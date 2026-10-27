"use server";

import { and, eq, lt, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { bookingExpiresAt } from "@/lib/booking";
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
        "You already have a pending booking. Complete payment or wait for it to expire before holding another bed.",
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

  const [held] = await db
    .update(bedSpaces)
    .set({
      status: "PENDING_PAYMENT",
    })
    .where(
      and(
        eq(bedSpaces.id, bedSpaceId.data),
        eq(bedSpaces.status, "AVAILABLE"),
      ),
    )
    .returning({ id: bedSpaces.id });

  if (!held) {
    return { error: "That bed was just taken. Pick another." };
  }

  try {
    const [booking] = await db
      .insert(bookings)
      .values({
        residentId: session.user.id,
        bedSpaceId: held.id,
        residenceId: bedContext.residenceId,
        amount: bedContext.pricePerBed,
        paymentStatus: "PENDING",
        expiresAt: bookingExpiresAt(),
      })
      .returning({ id: bookings.id });

    await db
      .update(bedSpaces)
      .set({ activeBookingId: booking.id })
      .where(eq(bedSpaces.id, held.id));

    await db.insert(auditLogs).values({
      actorId: session.user.id,
      action: "booking.hold",
      entityType: "booking",
      entityId: booking.id,
      metadata: { bedSpaceId: held.id, amount: bedContext.pricePerBed },
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

    await db
      .update(bedSpaces)
      .set({ status: "AVAILABLE", activeBookingId: null })
      .where(eq(bedSpaces.id, held.id));

    console.error(error);
    return { error: "Could not create booking. Please try again." };
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

  if (!bookingId.success) {
    return { error: "Invalid booking." };
  }
  if (!paymentReference.success) {
    return {
      error: paymentReference.error.issues[0]?.message ?? "Invalid reference.",
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

  if (booking.expiresAt.getTime() < Date.now()) {
    await expireBookingById(booking.id, "system.auto_expire_on_submit");
    revalidateBookingPaths();
    return {
      error: "This hold has expired. Choose another bed and try again.",
    };
  }

  const stored = await storeReceipt(receipt);
  if (!stored.ok) {
    return { error: stored.error };
  }

  await db
    .update(bookings)
    .set({
      paymentReference: paymentReference.data,
      receiptUrl: stored.url,
    })
    .where(eq(bookings.id, booking.id));

  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: "booking.payment_proof",
    entityType: "booking",
    entityId: booking.id,
    metadata: { paymentReference: paymentReference.data },
  });

  revalidateBookingPaths();
  return {
    success:
      "Payment proof submitted. A manager will review and confirm your bed.",
  };
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

  await db
    .update(bookings)
    .set({
      paymentStatus: "FAILED",
      reviewNote: "Hold expired before payment was approved.",
      reviewedAt: new Date(),
    })
    .where(eq(bookings.id, booking.id));

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

  if (current.expiresAt.getTime() < Date.now()) {
    await expireBookingById(current.id, "booking.expire_before_approve");
    revalidateBookingPaths(current.id);
    return { error: "Hold expired. Bed was released automatically." };
  }

  if (!current.receiptUrl || !current.paymentReference) {
    return {
      error: "Resident must submit payment reference and receipt before approval.",
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
    // Booking approved but bed was not in PENDING_PAYMENT — force occupy if still pointing here
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
    },
  });

  revalidateBookingPaths(approved.id);
  return { success: "Booking approved. Bed is now occupied." };
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
  return { success: "Booking rejected. Bed released back to available." };
}
