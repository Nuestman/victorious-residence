"use client";

import { useActionState } from "react";

import { ActionStatus } from "@/components/admin/action-status";
import { PortalIcon } from "@/components/portal-icons";
import {
  cancelBookingAction,
  type BookingActionState,
} from "@/server/actions/bookings";

const initialState: BookingActionState = {};

type CancelBookingFormProps = {
  bookingId: string;
  mode: "resident" | "staff";
  hasDeposit: boolean;
  isOccupied: boolean;
};

export function CancelBookingForm({
  bookingId,
  mode,
  hasDeposit,
  isOccupied,
}: CancelBookingFormProps) {
  const [state, formAction, pending] = useActionState(
    cancelBookingAction,
    initialState,
  );

  const title = isOccupied
    ? "Cancel residence"
    : hasDeposit
      ? "Cancel reservation"
      : "Withdraw application";

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-md border border-red-200 bg-red-50/60 p-4"
    >
      <input type="hidden" name="bookingId" value={bookingId} />
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-red-950">{title}</h3>
        <p className="text-sm text-red-900/80">
          {hasDeposit
            ? "This releases the bed. Accepted deposits are non-refundable unless management settles an exception offline."
            : "This closes the application so you can choose another bed later."}
        </p>
      </div>

      {mode === "staff" ? (
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-700">
            Staff note (required)
          </span>
          <textarea
            name="reviewNote"
            rows={2}
            required
            minLength={3}
            maxLength={500}
            disabled={pending}
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 disabled:bg-stone-50"
            placeholder="Reason for cancellation"
          />
        </label>
      ) : (
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-700">
            Note (optional)
          </span>
          <textarea
            name="reviewNote"
            rows={2}
            maxLength={500}
            disabled={pending}
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 disabled:bg-stone-50"
            placeholder="Optional reason"
          />
        </label>
      )}

      <label className="flex items-start gap-2 text-sm text-stone-800">
        <input
          type="checkbox"
          name="confirmCancel"
          value="yes"
          required
          disabled={pending}
          className="mt-1"
        />
        <span>
          I confirm this cancellation
          {hasDeposit ? " and understand deposits are non-refundable" : ""}.
        </span>
      </label>

      <ActionStatus error={state.error} success={state.success} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-800 disabled:opacity-60"
      >
        <PortalIcon name="reject" className="h-4 w-4" />
        {pending ? "Cancelling…" : title}
      </button>
    </form>
  );
}
