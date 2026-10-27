"use client";

import { useActionState } from "react";

import { ActionStatus } from "@/components/admin/action-status";
import {
  submitPaymentProofAction,
  type BookingActionState,
} from "@/server/actions/bookings";

const initialState: BookingActionState = {};

type PaymentProofFormProps = {
  bookingId: string;
};

export function PaymentProofForm({ bookingId }: PaymentProofFormProps) {
  const [state, formAction, pending] = useActionState(
    submitPaymentProofAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="bookingId" value={bookingId} />

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-stone-700">
          Payment reference (MoMo / bank)
        </span>
        <input
          name="paymentReference"
          required
          minLength={4}
          maxLength={80}
          placeholder="e.g. 1234567890"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-stone-700">
          Receipt (JPEG, PNG, WebP, or PDF · max 1.5MB)
        </span>
        <input
          name="receipt"
          type="file"
          required
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="block w-full text-sm text-stone-700"
        />
      </label>

      <ActionStatus error={state.error} success={state.success} />

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit payment proof"}
      </button>
    </form>
  );
}
