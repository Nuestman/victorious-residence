"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { appBaseUrl } from "@/lib/app-url";
import { getPaymentBalance } from "@/lib/booking";
import { requireRole } from "@/server/auth/guards";
import { canManageResidence } from "@/server/auth/roles";
import { db } from "@/server/db";
import { auditLogs } from "@/server/db/schema";
import { sendPaymentReminderEmail } from "@/server/email/resend";
import { getBookingForReminder } from "@/server/queries/balances";

export type ReminderActionState = {
  error?: string;
  success?: string;
};

export async function sendPaymentReminderAction(
  _prev: ReminderActionState,
  formData: FormData,
): Promise<ReminderActionState> {
  const session = await requireRole("MANAGER");

  const bookingId = z.string().uuid().safeParse(formData.get("bookingId"));
  if (!bookingId.success) {
    return { error: "Invalid booking." };
  }

  const booking = await getBookingForReminder(bookingId.data);
  if (!booking) {
    return { error: "Booking not found." };
  }

  if (
    !canManageResidence(
      session.user.role,
      session.user.residenceId,
      booking.residenceId,
    )
  ) {
    return { error: "You cannot remind residents outside your residence." };
  }

  const balance = getPaymentBalance(booking.amount, booking.amountPaid);
  if (balance.remaining <= 0) {
    return { error: "This booking has no remaining balance to remind about." };
  }

  const sent = await sendPaymentReminderEmail({
    toEmail: booking.residentEmail,
    residentName: booking.residentName,
    roomLabel: booking.roomLabel,
    bedLabel: booking.bedLabel,
    roomTypeName: booking.roomTypeName,
    fullAmount: balance.full.toFixed(2),
    amountPaid: balance.paid.toFixed(2),
    remaining: balance.remaining.toFixed(2),
    coverage: balance.coverage,
    bookingUrl: `${appBaseUrl()}/resident/bookings/${booking.id}`,
  });

  if (!sent.ok) {
    return { error: sent.error };
  }

  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: "booking.payment_reminder",
    entityType: "booking",
    entityId: booking.id,
    metadata: {
      to: booking.residentEmail,
      remaining: balance.remaining,
      coverage: balance.coverage,
    },
  });

  revalidatePath("/manager/reviews");
  revalidatePath(`/manager/reviews/${booking.id}`);
  revalidatePath("/manager/balances");
  revalidatePath("/admin/balances");
  revalidatePath(`/manager/residents/${booking.residentId}`);
  revalidatePath(`/admin/residents/${booking.residentId}`);

  return {
    success: `Reminder emailed to ${booking.residentEmail} (GHS ${balance.remaining.toFixed(2)} remaining).`,
  };
}
