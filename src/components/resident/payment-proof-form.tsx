"use client";

import {
  useActionState,
  useId,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import { ActionStatus } from "@/components/admin/action-status";
import { PortalIcon } from "@/components/portal-icons";
import { MIN_RESERVATION_DEPOSIT_GHS } from "@/lib/booking";
import { RECEIPT_MAX_BYTES, RECEIPT_MAX_LABEL } from "@/lib/receipts";
import {
  submitPaymentProofAction,
  type BookingActionState,
} from "@/server/actions/bookings";

const initialState: BookingActionState = {};

type PaymentProofFormProps = {
  bookingId: string;
  fullAmount: string;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PaymentProofForm({
  bookingId,
  fullAmount,
}: PaymentProofFormProps) {
  const [state, formAction, pending] = useActionState(
    submitPaymentProofAction,
    initialState,
  );
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  function clearFile() {
    setFile(null);
    setLocalError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] ?? null;
    if (!next) {
      setFile(null);
      setLocalError(null);
      return;
    }
    if (next.size > RECEIPT_MAX_BYTES) {
      clearFile();
      setLocalError(`Receipt must be under ${RECEIPT_MAX_LABEL}.`);
      return;
    }
    setLocalError(null);
    setFile(next);
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="bookingId" value={bookingId} />

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-stone-700">
          Amount paid (GHS)
        </span>
        <input
          name="amountPaid"
          type="number"
          inputMode="decimal"
          min={MIN_RESERVATION_DEPOSIT_GHS}
          max={Number(fullAmount) || undefined}
          step="0.01"
          required
          defaultValue={MIN_RESERVATION_DEPOSIT_GHS}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"
        />
        <p className="text-xs text-stone-500">
          Minimum non-refundable deposit: GHS{" "}
          {MIN_RESERVATION_DEPOSIT_GHS.toLocaleString("en-GH")}. Full bed price:{" "}
          GHS {fullAmount}.
        </p>
      </label>

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

      <div className="space-y-2 rounded-lg border-2 border-dashed border-forest/40 bg-forest/5 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-forest">
              Upload payment receipt
            </p>
            <p className="mt-1 text-xs text-stone-600">
              JPEG, PNG, WebP, or PDF · max {RECEIPT_MAX_LABEL}
            </p>
          </div>
          <span className="rounded-full bg-forest px-2.5 py-1 text-[11px] font-semibold tracking-wide text-cream uppercase">
            Required
          </span>
        </div>

        <input
          ref={inputRef}
          id={inputId}
          name="receipt"
          type="file"
          required={!file}
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={onFileChange}
          className="sr-only"
        />

        {!file ? (
          <label
            htmlFor={inputId}
            className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-forest/25 bg-white px-4 py-8 text-center transition hover:border-forest hover:bg-cream/60"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-forest text-cream">
              <PortalIcon name="plus" className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium text-forest">
              Choose receipt file
            </span>
            <span className="text-xs text-stone-500">
              Tap to browse your photos or documents
            </span>
          </label>
        ) : (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-forest/20 bg-white px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-stone-900">
                {file.name}
              </p>
              <p className="text-xs text-stone-500">
                {formatFileSize(file.size)} · ready to submit
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label
                htmlFor={inputId}
                className="cursor-pointer rounded-md border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-800"
              >
                Replace
              </label>
              <button
                type="button"
                onClick={clearFile}
                className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-800"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {localError ? (
          <p className="text-sm text-red-700">{localError}</p>
        ) : null}
      </div>

      <ActionStatus error={state.error} success={state.success} />

      <button
        type="submit"
        disabled={pending || !file}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-forest px-4 py-3 text-sm font-medium text-cream disabled:opacity-60 sm:w-auto"
      >
        <PortalIcon name="check" className="h-4 w-4" />
        {pending ? "Submitting…" : "Submit deposit & reserve bed"}
      </button>
    </form>
  );
}
