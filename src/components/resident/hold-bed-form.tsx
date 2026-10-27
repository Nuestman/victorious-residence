"use client";

import { useActionState } from "react";

import { ActionStatus } from "@/components/admin/action-status";
import {
  holdBedAction,
  type BookingActionState,
} from "@/server/actions/bookings";

const initialState: BookingActionState = {};

type HoldBedFormProps = {
  bedSpaceId: string;
  roomLabel: string;
  bedLabel: string;
  pricePerBed: string;
};

export function HoldBedForm({
  bedSpaceId,
  roomLabel,
  bedLabel,
  pricePerBed,
}: HoldBedFormProps) {
  const [state, formAction, pending] = useActionState(holdBedAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="bedSpaceId" value={bedSpaceId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Holding…" : `Hold ${roomLabel}-${bedLabel}`}
      </button>
      <span className="text-sm text-stone-500">GHS {pricePerBed}</span>
      <ActionStatus error={state.error} success={state.success} />
    </form>
  );
}
