"use client";

import { useActionState } from "react";

import { ActionStatus } from "@/components/admin/action-status";
import { PortalIcon } from "@/components/portal-icons";
import { MIN_RESERVATION_DEPOSIT_GHS } from "@/lib/booking";
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
        className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
      >
        <PortalIcon name="check" className="h-4 w-4" />
        {pending ? "Starting…" : `Apply for ${roomLabel}-${bedLabel}`}
      </button>
      <span className="text-sm text-stone-500">
        GHS {pricePerBed} · reserve with GHS{" "}
        {MIN_RESERVATION_DEPOSIT_GHS.toLocaleString("en-GH")}+ deposit
      </span>
      <ActionStatus error={state.error} success={state.success} />
    </form>
  );
}
