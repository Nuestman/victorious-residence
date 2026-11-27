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
import { requireRole, requireSession } from "@/server/auth/guards";
import {
  canManageResidence,
  hasMinimumRole,
} from "@/server/auth/roles";
import { db } from "@/server/db";
import {
  auditLogs,
  bedSpaces,
  bookings,
  rooms,
  roomTypes,
  type UserRole,
} from "@/server/db/schema";

export type BookingActionState = {
  error?: string;
  success?: string;
};

function revalidateBookingPaths(bookingId?: string, residentId?: string) {
  revalidatePath("/resident");
  revalidatePath("/resident/bookings");
  if (bookingId) {
    revalidatePath(`/resident/bookings/${bookingId}`);
    revalidatePath(`/manager/reviews/${bookingId}`);
  }
  if (residentId) {
    revalidatePath(`/manager/residents/${residentId}`);
    revalidatePath(`/admin/residents/${residentId}`);
  }
  revalidatePath("/manager");
  revalidatePath("/manager/reviews");
  revalidatePath("/manager/residents");
  revalidatePath("/manager/balances");
  revalidatePath("/admin");
  revalidatePath("/admin/occupancy");
  revalidatePath("/admin/residents");
  revalidatePath("/admin/balances");
  revalidatePath("/");
}

async function releaseBedInventory(input: {
  bookingId: string;
  bedSpaceId: string;
}) {
  await db
    .update(bedSpaces)
    .set({
      status: "AVAILABLE",
      activeBookingId: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(bedSpaces.id, input.bedSpaceId),
        eq(bedSpaces.activeBookingId, input.bookingId),
      ),
    );
}

type BookingActor = {
  id: string;
  role: UserRole;
  residenceId?: string | null;
};

async function requireBookingActor(
  callbackPath: string,
): Promise<BookingActor> {
  const session = await requireSession(callbackPath);
  return {
    id: session.user.id,
    role: session.user.role,
    residenceId: session.user.residenceId,
  };
}

function assertCanManageBooking(
  actor: BookingActor,
  booking: { residentId: string; residenceId: string },
): BookingActionState | null {
  if (actor.role === "RESIDENT") {
    if (actor.id !== booking.residentId) {
      return { error: "You can only manage your own booking." };
    }
    return null;
  }

  if (hasMinimumRole(actor.role, "MANAGER")) {
    if (!canManageResidence(actor.role, actor.residenceId, booking.residenceId)) {
      return { error: "You cannot manage bookings for this campus." };
    }
    return null;
  }

  return { error: "You do not have permission to manage this booking." };
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

/**
 * Cancel an active application, reserved bed, or occupied residence.
 * Releases inventory when the booking held PENDING_PAYMENT / OCCUPIED.
 * Deposits remain non-refundable by policy — handled offline if needed.
 */
export async function cancelBookingAction(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const actor = await requireBookingActor("/resident/bookings");

  const bookingId = z.string().uuid().safeParse(formData.get("bookingId"));
  const noteParse = z
    .string()
    .trim()
    .max(500)
    .optional()
    .safeParse(formData.get("reviewNote") || undefined);
  const confirmed = formData.get("confirmCancel") === "yes";

  if (!bookingId.success) {
    return { error: "Invalid booking." };
  }
  if (!confirmed) {
    return { error: "Confirm cancellation to continue." };
  }

  const [current] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId.data))
    .limit(1);

  if (!current) {
    return { error: "Booking not found." };
  }

  const denied = assertCanManageBooking(actor, current);
  if (denied) {
    return denied;
  }

  if (current.paymentStatus === "FAILED") {
    return { error: "This booking is already cancelled or rejected." };
  }

  const isStaff = hasMinimumRole(actor.role, "MANAGER");
  const note = noteParse.success ? noteParse.data?.trim() || null : null;

  if (isStaff && (!note || note.length < 3)) {
    return { error: "Add a short staff note before cancelling." };
  }

  const hadDeposit = Boolean(current.receiptUrl || current.amountPaid);
  const defaultNote = isStaff
    ? note
    : note && note.length > 0
      ? note
      : hadDeposit
        ? "Cancelled by resident. Any accepted deposit remains non-refundable."
        : "Application withdrawn by resident.";

  const [cancelled] = await db
    .update(bookings)
    .set({
      paymentStatus: "FAILED",
      reviewedById: isStaff ? actor.id : current.reviewedById,
      reviewedAt: new Date(),
      reviewNote: defaultNote,
    })
    .where(
      and(
        eq(bookings.id, current.id),
        sql`${bookings.paymentStatus} in ('PENDING', 'SUCCESS')`,
      ),
    )
    .returning({
      id: bookings.id,
      bedSpaceId: bookings.bedSpaceId,
      residentId: bookings.residentId,
      paymentStatus: bookings.paymentStatus,
    });

  if (!cancelled) {
    return { error: "This booking was already closed." };
  }

  await releaseBedInventory({
    bookingId: cancelled.id,
    bedSpaceId: cancelled.bedSpaceId,
  });

  await db.insert(auditLogs).values({
    actorId: actor.id,
    action: "booking.cancel",
    entityType: "booking",
    entityId: cancelled.id,
    metadata: {
      previousStatus: current.paymentStatus,
      bedSpaceId: cancelled.bedSpaceId,
      hadDeposit,
      note: defaultNote,
      byRole: actor.role,
    },
  });

  revalidateBookingPaths(cancelled.id, cancelled.residentId);
  return {
    success: hadDeposit
      ? "Residence/booking cancelled and bed released. Deposits stay non-refundable — settle any exceptions offline."
      : "Application cancelled. You can choose another bed when ready.",
  };
}

/**
 * Move an active booking to a different available bed (upgrade / room change).
 * Keeps amountPaid; updates full amount to the new room-type price.
 */
export async function upgradeBookingAction(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const actor = await requireBookingActor("/resident/bookings");

  const bookingId = z.string().uuid().safeParse(formData.get("bookingId"));
  const newBedSpaceId = z
    .string()
    .uuid()
    .safeParse(formData.get("newBedSpaceId"));
  const noteParse = z
    .string()
    .trim()
    .max(500)
    .optional()
    .safeParse(formData.get("reviewNote") || undefined);

  if (!bookingId.success || !newBedSpaceId.success) {
    return { error: "Choose a valid booking and bed." };
  }

  const [current] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId.data))
    .limit(1);

  if (!current) {
    return { error: "Booking not found." };
  }

  const denied = assertCanManageBooking(actor, current);
  if (denied) {
    return denied;
  }

  if (
    current.paymentStatus !== "PENDING" &&
    current.paymentStatus !== "SUCCESS"
  ) {
    return { error: "Only active bookings can be upgraded or moved." };
  }

  if (newBedSpaceId.data === current.bedSpaceId) {
    return { error: "Pick a different bed than the current one." };
  }

  const [target] = await db
    .select({
      bedId: bedSpaces.id,
      status: bedSpaces.status,
      residenceId: rooms.residenceId,
      pricePerBed: roomTypes.pricePerBed,
      roomTypeName: roomTypes.name,
      roomLabel: rooms.label,
      bedLabel: bedSpaces.label,
      roomTypeActive: roomTypes.isActive,
      roomActive: rooms.isActive,
    })
    .from(bedSpaces)
    .innerJoin(rooms, eq(bedSpaces.roomId, rooms.id))
    .innerJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
    .where(eq(bedSpaces.id, newBedSpaceId.data))
    .limit(1);

  if (
    !target ||
    target.status !== "AVAILABLE" ||
    !target.roomTypeActive ||
    !target.roomActive
  ) {
    return { error: "That bed is no longer available." };
  }

  if (target.residenceId !== current.residenceId) {
    return { error: "Upgrades must stay within the same campus." };
  }

  const [currentBed] = await db
    .select({
      status: bedSpaces.status,
      activeBookingId: bedSpaces.activeBookingId,
    })
    .from(bedSpaces)
    .where(eq(bedSpaces.id, current.bedSpaceId))
    .limit(1);

  const inventoryLocked =
    currentBed?.activeBookingId === current.id &&
    (currentBed.status === "PENDING_PAYMENT" ||
      currentBed.status === "OCCUPIED");

  const nextBedStatus = inventoryLocked
    ? current.paymentStatus === "SUCCESS"
      ? "OCCUPIED"
      : "PENDING_PAYMENT"
    : null;

  const isStaff = hasMinimumRole(actor.role, "MANAGER");
  const note = noteParse.success ? noteParse.data?.trim() || null : null;
  if (isStaff && (!note || note.length < 3)) {
    return { error: "Add a short staff note for the room change." };
  }

  try {
    await db.transaction(async (tx) => {
      if (inventoryLocked) {
        const [claimed] = await tx
          .update(bedSpaces)
          .set({
            status: nextBedStatus!,
            activeBookingId: current.id,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(bedSpaces.id, target.bedId),
              eq(bedSpaces.status, "AVAILABLE"),
            ),
          )
          .returning({ id: bedSpaces.id });

        if (!claimed) {
          throw new Error("BED_TAKEN");
        }

        await tx
          .update(bedSpaces)
          .set({
            status: "AVAILABLE",
            activeBookingId: null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(bedSpaces.id, current.bedSpaceId),
              eq(bedSpaces.activeBookingId, current.id),
            ),
          );
      }

      await tx
        .update(bookings)
        .set({
          bedSpaceId: target.bedId,
          amount: target.pricePerBed,
          reviewNote: isStaff
            ? note
            : current.reviewNote,
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, current.id));

      await tx.insert(auditLogs).values({
        actorId: actor.id,
        action: "booking.upgrade",
        entityType: "booking",
        entityId: current.id,
        metadata: {
          fromBedSpaceId: current.bedSpaceId,
          toBedSpaceId: target.bedId,
          previousAmount: current.amount,
          newAmount: target.pricePerBed,
          roomTypeName: target.roomTypeName,
          roomLabel: target.roomLabel,
          bedLabel: target.bedLabel,
          inventoryLocked,
          note,
          byRole: actor.role,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "BED_TAKEN") {
      return { error: "That bed was just taken. Pick another one." };
    }
    console.error(error);
    return { error: "Could not complete the room change. Try again." };
  }

  revalidateBookingPaths(current.id, current.residentId);

  const newAmount = parseMoneyAmount(target.pricePerBed) ?? 0;
  const paid =
    current.amountPaid == null || current.amountPaid === ""
      ? 0
      : (parseMoneyAmount(current.amountPaid) ?? 0);
  const remaining = Math.max(0, Math.round((newAmount - paid) * 100) / 100);

  return {
    success:
      remaining > 0
        ? `Moved to ${target.roomLabel}-${target.bedLabel} (${target.roomTypeName}). New full price GHS ${target.pricePerBed}; balance due GHS ${remaining.toFixed(2)}.`
        : `Moved to ${target.roomLabel}-${target.bedLabel} (${target.roomTypeName}). Full price GHS ${target.pricePerBed}.`,
  };
}
