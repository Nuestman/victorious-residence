export function getBookingHoldHours(): number {
  const raw = process.env.BOOKING_HOLD_HOURS;
  const parsed = raw ? Number(raw) : 48;
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 168) {
    return 48;
  }
  return parsed;
}

export function bookingExpiresAt(from = new Date()): Date {
  const expires = new Date(from);
  expires.setHours(expires.getHours() + getBookingHoldHours());
  return expires;
}

export function formatMoneyGhs(amount: string | number): string {
  const value = typeof amount === "number" ? amount.toFixed(2) : amount;
  return `GHS ${value}`;
}
