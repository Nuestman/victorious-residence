"use client";

import { useActionState } from "react";

import { ActionStatus } from "@/components/admin/action-status";
import { PortalIcon } from "@/components/portal-icons";
import {
  sendPaymentReminderAction,
  type ReminderActionState,
} from "@/server/actions/reminders";

const initialState: ReminderActionState = {};

type PaymentReminderButtonProps = {
  bookingId: string;
  remaining: number;
  residentEmail: string;
};

export function PaymentReminderButton({
  bookingId,
  remaining,
  residentEmail,
}: PaymentReminderButtonProps) {
  const [state, formAction, pending] = useActionState(
    sendPaymentReminderAction,
    initialState,
  );

  if (remaining <= 0) {
    return null;
  }

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 disabled:opacity-60"
      >
        <PortalIcon name="inquiries" className="h-4 w-4" />
        {pending
          ? "Sending…"
          : `Email payment reminder (GHS ${remaining.toFixed(2)})`}
      </button>
      <p className="text-xs text-stone-500">Sends to {residentEmail}</p>
      <ActionStatus error={state.error} success={state.success} />
    </form>
  );
}
