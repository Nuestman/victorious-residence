/** Minimum non-refundable partial payment required before a bed is reserved. */
export const MIN_RESERVATION_DEPOSIT_GHS = 1000;

/**
 * Soft cleanup window for unpaid applications (no bed lock yet).
 * Deposit-backed reservations are not auto-released by this timer.
 */
export function getApplicationAbandonDays(): number {
  const raw = process.env.BOOKING_APPLICATION_ABANDON_DAYS;
  const parsed = raw ? Number(raw) : 14;
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 90) {
    return 14;
  }
  return parsed;
}

export function applicationAbandonsAt(from = new Date()): Date {
  const expires = new Date(from);
  expires.setDate(expires.getDate() + getApplicationAbandonDays());
  return expires;
}

export function formatMoneyGhs(amount: string | number): string {
  const value = typeof amount === "number" ? amount.toFixed(2) : amount;
  return `GHS ${value}`;
}

export function formatPublicPrice(amount: string | number): string {
  const value = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(value)) {
    return formatMoneyGhs(amount);
  }

  const whole = Math.round(value * 100) % 100 === 0;
  return `GHS ${value.toLocaleString("en-GH", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  })}`;
}

export function parseMoneyAmount(raw: string | number): number | null {
  const value = typeof raw === "number" ? raw : Number(String(raw).trim());
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }
  return Math.round(value * 100) / 100;
}

export function meetsReservationDeposit(amountPaid: number): boolean {
  return amountPaid >= MIN_RESERVATION_DEPOSIT_GHS;
}

export type PaymentBalance = {
  full: number;
  paid: number;
  remaining: number;
  /** unpaid = nothing recorded · partial = some paid · full = balance cleared */
  coverage: "unpaid" | "partial" | "full";
  label: string;
};

export function getPaymentBalance(
  amount: string | number,
  amountPaid: string | number | null | undefined,
): PaymentBalance {
  const full = parseMoneyAmount(amount) ?? 0;
  const paid = amountPaid == null || amountPaid === ""
    ? 0
    : (parseMoneyAmount(amountPaid) ?? 0);
  const remaining = Math.max(0, Math.round((full - paid) * 100) / 100);

  let coverage: PaymentBalance["coverage"] = "unpaid";
  if (paid > 0 && remaining > 0) {
    coverage = "partial";
  } else if (paid > 0 && remaining === 0) {
    coverage = "full";
  }

  const label =
    coverage === "full"
      ? "Paid in full"
      : coverage === "partial"
        ? "Partial payment"
        : "No payment recorded";

  return { full, paid, remaining, coverage, label };
}
