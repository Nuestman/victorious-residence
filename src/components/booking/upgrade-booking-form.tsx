"use client";

import { useActionState, useMemo, useState } from "react";

import { ActionStatus } from "@/components/admin/action-status";
import { PortalIcon } from "@/components/portal-icons";
import { formatMoneyGhs, getPaymentBalance } from "@/lib/booking";
import {
  upgradeBookingAction,
  type BookingActionState,
} from "@/server/actions/bookings";

const initialState: BookingActionState = {};

export type UpgradeBedOption = {
  bedId: string;
  bedLabel: string;
  roomLabel: string;
  roomTypeName: string;
  capacity: number;
  pricePerBed: string;
};

type UpgradeBookingFormProps = {
  bookingId: string;
  mode: "resident" | "staff";
  currentAmount: string;
  amountPaid?: string | null;
  options: UpgradeBedOption[];
};

export function UpgradeBookingForm({
  bookingId,
  mode,
  currentAmount,
  amountPaid,
  options,
}: UpgradeBookingFormProps) {
  const [state, formAction, pending] = useActionState(
    upgradeBookingAction,
    initialState,
  );
  const [selectedBedId, setSelectedBedId] = useState(options[0]?.bedId ?? "");

  const selected = useMemo(
    () => options.find((row) => row.bedId === selectedBedId) ?? null,
    [options, selectedBedId],
  );

  const preview = selected
    ? getPaymentBalance(selected.pricePerBed, amountPaid)
    : getPaymentBalance(currentAmount, amountPaid);

  if (options.length === 0) {
    return (
      <p className="text-sm text-stone-600">
        No other beds are available on this campus right now.
      </p>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-md border border-stone-200 bg-white p-4"
    >
      <input type="hidden" name="bookingId" value={bookingId} />
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-stone-900">
          Upgrade or change room
        </h3>
        <p className="text-sm text-stone-600">
          Move to another available bed. Paid amounts stay on file; any higher
          room price leaves a balance due.
        </p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-stone-700">New bed</span>
        <select
          name="newBedSpaceId"
          required
          disabled={pending}
          value={selectedBedId}
          onChange={(event) => setSelectedBedId(event.target.value)}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 disabled:bg-stone-50"
        >
          {options.map((row) => (
            <option key={row.bedId} value={row.bedId}>
              {row.roomTypeName} ({row.capacity}-in-1) · {row.roomLabel}-
              {row.bedLabel} · {formatMoneyGhs(row.pricePerBed)}
            </option>
          ))}
        </select>
      </label>

      {selected ? (
        <p className="text-sm text-stone-600">
          New full price {formatMoneyGhs(selected.pricePerBed)}
          {preview.remaining > 0
            ? ` · balance due ${formatMoneyGhs(preview.remaining.toFixed(2))}`
            : preview.paid > 0
              ? " · covered by amount already paid"
              : ""}
          .
        </p>
      ) : null}

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
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 disabled:bg-stone-50"
            placeholder="e.g. Upgrade to single at resident request"
          />
        </label>
      ) : null}

      <ActionStatus error={state.error} success={state.success} />
      <button
        type="submit"
        disabled={pending || !selectedBedId}
        className="inline-flex items-center gap-2 rounded-md bg-forest px-4 py-2.5 text-sm font-medium text-cream disabled:opacity-60"
      >
        <PortalIcon name="roomTypes" className="h-4 w-4" />
        {pending ? "Moving…" : "Confirm room change"}
      </button>
    </form>
  );
}
