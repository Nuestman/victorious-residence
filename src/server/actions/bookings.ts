"use server";

import { and, eq, isNull, lt, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  applicationAbandonsAt,
  meetsReservationDeposit,
  MIN_RESERVATION_DEPOSIT_GHS,
  parseMoneyAmount,
} from "@/lib/booking";
import { storeReceipt } from "@/lib/receipts";
import { requireRole } from "@/server/auth/guards";
import { db } from "@/server/db";
import {
  auditLogs,
  bedSpaces,
  bookings,
  rooms,
  roomTypes,
} from "@/server/db/schema";

export type BookingActionState = {
  error?: string;
  success?: string;
};

function revalidateBookingPaths(bookingId?: string) {
  revalidatePath("/resident");
  revalidatePath("/resident/bookings");
  if (bookingId) {
    revalidatePath(`/resident/bookings/${bookingId}`);
    revalidatePath(`/manager/reviews/${bookingId}`);
  }
  revalidatePath("/manager");
  revalidatePath("/manager/reviews");
  revalidatePath("/admin");
  revalidatePath("/admin/occupancy");
  revalidatePath("/");
}

/**
 * Start a booking application for a bed.
 * Does NOT reserve inventory — reservation happens after a ≥ GHS 1000 deposit proof.
 */
export async function holdBedAction(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const session = await requireRole("RESIDENT", "/resident");

  const bedSpaceId = z.string().uuid().safeParse(formData.get("bedSpaceId"));
  if (!bedSpaceId.success) {
    return { error: "Invalid bed selection." };
  }

  const [activeHold] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.residentId, session.user.id),
        eq(bookings.paymentStatus, "PENDING"),
      ),
    )
    .limit(1);

  if (activeHold) {
    return {
      error:
        "You already have a pending booking. Pay the non-refundable deposit (GHS 1,000+) or wait for that application to close before choosing another bed.",
    };
  }

  const [bedContext] = await db
    .select({
      bedId: bedSpaces.id,
      status: bedSpaces.status,
      residenceId: rooms.residenceId,
      pricePerBed: roomTypes.pricePerBed,
      roomTypeActive: roomTypes.isActive,
      roomActive: rooms.isActive,
    })
    .from(bedSpaces)
    .innerJoin(rooms, eq(bedSpaces.roomId, rooms.id))
    .innerJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
    .where(eq(bedSpaces.id, bedSpaceId.data))
    .limit(1);

  if (
    !bedContext ||
    bedContext.status !== "AVAILABLE" ||
    !bedContext.roomTypeActive ||
    !bedContext.roomActive
  ) {
    return { error: "That bed is no longer available." };
  }

  try {
    const [booking] = await db
      .insert(bookings)
      .values({
        residentId: session.user.id,
        bedSpaceId: bedContext.bedId,
        residenceId: bedContext.residenceId,
        amount: bedContext.pricePerBed,
        paymentStatus: "PENDING",
        expiresAt: applicationAbandonsAt(),
      })
      .returning({ id: bookings.id });

    await db.insert(auditLogs).values({
      actorId: session.user.id,
      action: "booking.application",
      entityType: "booking",
      entityId: booking.id,
      metadata: {
        bedSpaceId: bedContext.bedId,
        amount: bedContext.pricePerBed,
        minDepositGhs: MIN_RESERVATION_DEPOSIT_GHS,
      },
    });

    revalidateBookingPaths();
    redirect(`/resident/bookings/${booking.id}`);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    console.error(error);
    return { error: "Could not start booking. Please try again." };
  }
}

export async function submitPaymentProofAction(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const session = await requireRole("RESIDENT", "/resident/bookings");

  const bookingId = z.string().uuid().safeParse(formData.get("bookingId"));
  const paymentReference = z
    .string()
    .trim()
    .min(4, "Enter the MoMo/bank reference")
    .max(80)
    .safeParse(formData.get("paymentReference"));
  const amountPaidRaw = z
    .string()
    .trim()
    .min(1, "Enter how much you paid")
    .safeParse(formData.get("amountPaid"));

  if (!bookingId.success) {
    return { error: "Invalid booking." };
  }
  if (!paymentReference.success) {
    return {
      error: paymentReference.error.issues[0]?.message ?? "Invalid reference.",
    };
  }
  if (!amountPaidRaw.success) {
    return {
      error: amountPaidRaw.error.issues[0]?.message ?? "Enter the amount paid.",
    };
  }

  const amountPaid = parseMoneyAmount(amountPaidRaw.data);
  if (amountPaid === null) {
    return { error: "Enter a valid payment amount in GHS." };
  }
  if (!meetsReservationDeposit(amountPaid)) {
    return {
      error: `A non-refundable deposit of at least GHS ${MIN_RESERVATION_DEPOSIT_GHS.toLocaleString("en-GH")} is required to reserve a bed.`,
    };
  }

  const receipt = formData.get("receipt");
  if (!(receipt instanceof File) || receipt.size === 0) {
    return { error: "Upload a receipt image or PDF." };
  }

  const [booking] = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.id, bookingId.data),
        eq(bookings.residentId, session.user.id),
      ),
    )
    .limit(1);

  if (!booking) {
    return { error: "Booking not found." };
  }

  if (booking.paymentStatus !== "PENDING") {
    return { error: "This booking can no longer accept payment proof." };
  }

  if (booking.receiptUrl) {
    return {
      error:
        "Deposit proof is already on file for this booking. Wait for manager review.",
    };
  }

  if (
    !booking.receiptUrl &&
    booking.expiresAt.getTime() < Date.now()
  ) {
    await expireBookingById(booking.id, "system.auto_expire_on_submit");
    revalidateBookingPaths();
    return {
      error:
        "This application expired before a deposit was submitted. Choose another bed and try again.",
    };
  }

  const fullAmount = parseMoneyAmount(booking.amount) ?? 0;
  if (amountPaid > fullAmount + 0.001) {
    return {
      error: `Amount paid cannot exceed the bed price (GHS ${booking.amount}).`,
    };
  }

  const stored = await storeReceipt(receipt);
  if (!stored.ok) {
    return { error: stored.error };
  }

  const amountPaidStr = amountPaid.toFixed(2);

  const [held] = await db
    .update(bedSpaces)
    .set({
      status: "PENDING_PAYMENT",
      activeBookingId: booking.id,
    })
    .where(
      and(
        eq(bedSpaces.id, booking.bedSpaceId),
        eq(bedSpaces.status, "AVAILABLE"),
      ),
    )
    .returning({ id: bedSpaces.id });

  if (!held) {
    return {
      error:
        "That bed was reserved by someone else before your deposit could be recorded. Contact management if you already paid — deposits are non-refundable once accepted, and staff will help reassign or apply it.",
    };
  }

  try {
    await db
      .update(bookings)
      .set({
        paymentReference: paymentReference.data,
        receiptUrl: stored.url,
        amountPaid: amountPaidStr,
      })
      .where(eq(bookings.id, booking.id));

    await db.insert(auditLogs).values({
      actorId: session.user.id,
      action: "booking.deposit_proof",
      entityType: "booking",
      entityId: booking.id,
      metadata: {
        paymentReference: paymentReference.data,
        amountPaid: amountPaidStr,
        minDepositGhs: MIN_RESERVATION_DEPOSIT_GHS,
      },
    });

    revalidateBookingPaths(booking.id);
    return {
      success: `Deposit proof submitted (GHS ${amountPaidStr}). Your bed is now reserved pending manager confirmation. This deposit is non-refundable.`,
    };
  } catch (error) {
    await db
      .update(bedSpaces)
      .set({ status: "AVAILABLE", activeBookingId: null })
      .where(
        and(
          eq(bedSpaces.id, booking.bedSpaceId),
          eq(bedSpaces.status, "PENDING_PAYMENT"),
          eq(bedSpaces.activeBookingId, booking.id),
        ),
      );
    console.error(error);
    return { error: "Could not save payment proof. Please try again." };
  }
}

export async function expireBookingById(
  bookingId: string,
  action = "booking.expire",
) {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(
      and(eq(bookings.id, bookingId), eq(bookings.paymentStatus, "PENDING")),
    )
    .limit(1);

  if (!booking) {
    return false;
  }

  // Deposit already submitted → bed is reserved; do not auto-release.
  if (booking.receiptUrl) {
    return false;
  }

  await db
    .update(bookings)
    .set({
      paymentStatus: "FAILED",
      reviewNote: "Application closed before a reservation deposit was submitted.",
      reviewedAt: new Date(),
    })
    .where(eq(bookings.id, booking.id));

  // Only release if this booking had somehow locked the bed (legacy holds).
  await db
    .update(bedSpaces)
    .set({
      status: "AVAILABLE",
      activeBookingId: null,
    })
    .where(
      and(
        eq(bedSpaces.id, booking.bedSpaceId),
        eq(bedSpaces.status, "PENDING_PAYMENT"),
        eq(bedSpaces.activeBookingId, booking.id),
      ),
    );

  await db.insert(auditLogs).values({
    actorId: null,
    action,
    entityType: "booking",
    entityId: booking.id,
    metadata: { bedSpaceId: booking.bedSpaceId },
  });

  return true;
}

export async function expireStaleBookings(): Promise<number> {
  const stale = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.paymentStatus, "PENDING"),
        isNull(bookings.receiptUrl),
        lt(bookings.expiresAt, sql`now()`),
      ),
    );

  let expired = 0;
  for (const row of stale) {
    const ok = await expireBookingById(row.id, "booking.expire_cron");
    if (ok) {
      expired += 1;
    }
  }

  if (expired > 0) {
    revalidateBookingPaths();
  }

  return expired;
}

export async function approveBookingAction(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const session = await requireRole("MANAGER", "/manager/reviews");

  const bookingId = z.string().uuid().safeParse(formData.get("bookingId"));
  const reviewNote = z
    .string()
    .trim()
    .max(500)
    .optional()
    .safeParse(formData.get("reviewNote") || undefined);

  if (!bookingId.success) {
    return { error: "Invalid booking." };
  }

  const [current] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId.data))
    .limit(1);

  if (!current) {
    return { error: "Booking not found." };
  }

  if (current.paymentStatus !== "PENDING") {
    return { error: "This booking was already reviewed." };
  }

  if (!current.receiptUrl || !current.paymentReference || !current.amountPaid) {
    return {
      error:
        "Resident must submit a deposit of at least GHS 1,000 with reference and receipt before approval.",
    };
  }

  const paid = parseMoneyAmount(current.amountPaid);
  if (paid === null || !meetsReservationDeposit(paid)) {
    return {
      error: `Recorded deposit must be at least GHS ${MIN_RESERVATION_DEPOSIT_GHS.toLocaleString("en-GH")}.`,
    };
  }

  const [approved] = await db
    .update(bookings)
    .set({
      paymentStatus: "SUCCESS",
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      reviewNote: reviewNote.success ? reviewNote.data || null : null,
    })
    .where(
      and(
        eq(bookings.id, current.id),
        eq(bookings.paymentStatus, "PENDING"),
      ),
    )
    .returning({ id: bookings.id, bedSpaceId: bookings.bedSpaceId });

  if (!approved) {
    return { error: "Another reviewer already processed this booking." };
  }

  const [occupied] = await db
    .update(bedSpaces)
    .set({
      status: "OCCUPIED",
      activeBookingId: approved.id,
    })
    .where(
      and(
        eq(bedSpaces.id, approved.bedSpaceId),
        eq(bedSpaces.status, "PENDING_PAYMENT"),
      ),
    )
    .returning({ id: bedSpaces.id });

  if (!occupied) {
    await db
      .update(bedSpaces)
      .set({
        status: "OCCUPIED",
        activeBookingId: approved.id,
      })
      .where(eq(bedSpaces.id, approved.bedSpaceId));
  }

  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: "booking.approve",
    entityType: "booking",
    entityId: approved.id,
    metadata: {
      bedSpaceId: approved.bedSpaceId,
      paymentReference: current.paymentReference,
      amountPaid: current.amountPaid,
    },
  });

  revalidateBookingPaths(approved.id);
  return {
    success:
      "Booking approved. Bed is occupied. Confirm any remaining balance with the resident offline if needed.",
  };
}

export async function rejectBookingAction(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const session = await requireRole("MANAGER", "/manager/reviews");

  const bookingId = z.string().uuid().safeParse(formData.get("bookingId"));
  const reviewNote = z
    .string()
    .trim()
    .min(3, "Add a short rejection reason")
    .max(500)
    .safeParse(formData.get("reviewNote"));

  if (!bookingId.success) {
    return { error: "Invalid booking." };
  }
  if (!reviewNote.success) {
    return {
      error: reviewNote.error.issues[0]?.message ?? "Rejection note required.",
    };
  }

  const [rejected] = await db
    .update(bookings)
    .set({
      paymentStatus: "FAILED",
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      reviewNote: reviewNote.data,
    })
    .where(
      and(
        eq(bookings.id, bookingId.data),
        eq(bookings.paymentStatus, "PENDING"),
      ),
    )
    .returning({
      id: bookings.id,
      bedSpaceId: bookings.bedSpaceId,
    });

  if (!rejected) {
    return { error: "This booking was already reviewed or does not exist." };
  }

  await db
    .update(bedSpaces)
    .set({
      status: "AVAILABLE",
      activeBookingId: null,
    })
    .where(
      and(
        eq(bedSpaces.id, rejected.bedSpaceId),
        eq(bedSpaces.status, "PENDING_PAYMENT"),
      ),
    );

  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: "booking.reject",
    entityType: "booking",
    entityId: rejected.id,
    metadata: {
      bedSpaceId: rejected.bedSpaceId,
      reviewNote: reviewNote.data,
    },
  });

  revalidateBookingPaths(rejected.id);
  return {
    success:
      "Booking rejected and bed released. Apply your deposit policy offline — accepted deposits are non-refundable.",
  };
}
