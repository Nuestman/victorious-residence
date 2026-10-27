"use client";

import { useActionState } from "react";

import { ActionStatus } from "@/components/admin/action-status";
import {
  approveBookingAction,
  rejectBookingAction,
  type BookingActionState,
} from "@/server/actions/bookings";

const initialState: BookingActionState = {};

type ReviewActionsFormProps = {
  bookingId: string;
  hasProof: boolean;
};

export function ReviewActionsForm({
  bookingId,
  hasProof,
}: ReviewActionsFormProps) {
  const [approveState, approveAction, approvePending] = useActionState(
    approveBookingAction,
    initialState,
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectBookingAction,
    initialState,
  );

  const pending = approvePending || rejectPending;

  return (
    <div className="space-y-6">
      <form action={approveAction} className="space-y-3">
        <input type="hidden" name="bookingId" value={bookingId} />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-700">
            Approval note (optional)
          </span>
          <textarea
            name="reviewNote"
            rows={2}
            maxLength={500}
            disabled={pending || !hasProof}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 disabled:bg-stone-50"
            placeholder="Optional note for the resident"
          />
        </label>
        <ActionStatus error={approveState.error} success={approveState.success} />
        <button
          type="submit"
          disabled={pending || !hasProof}
          className="rounded-md bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {approvePending ? "Approving…" : "Approve & assign bed"}
        </button>
        {!hasProof ? (
          <p className="text-sm text-amber-800">
            Waiting for resident payment reference and receipt.
          </p>
        ) : null}
      </form>

      <form action={rejectAction} className="space-y-3 border-t border-stone-200 pt-6">
        <input type="hidden" name="bookingId" value={bookingId} />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-700">
            Rejection reason (required)
          </span>
          <textarea
            name="reviewNote"
            rows={2}
            required
            minLength={3}
            maxLength={500}
            disabled={pending}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 disabled:bg-stone-50"
            placeholder="e.g. Receipt unclear / wrong amount / reference mismatch"
          />
        </label>
        <ActionStatus error={rejectState.error} success={rejectState.success} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-800 disabled:opacity-60"
        >
          {rejectPending ? "Rejecting…" : "Reject & release bed"}
        </button>
      </form>
    </div>
  );
}
