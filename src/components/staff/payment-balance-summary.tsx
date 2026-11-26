import { getPaymentBalance } from "@/lib/booking";

type PaymentBalanceSummaryProps = {
  amount: string;
  amountPaid: string | null | undefined;
  compact?: boolean;
};

export function PaymentBalanceSummary({
  amount,
  amountPaid,
  compact = false,
}: PaymentBalanceSummaryProps) {
  const balance = getPaymentBalance(amount, amountPaid);

  if (compact) {
    return (
      <span>
        {balance.label} · paid GHS {balance.paid.toFixed(2)} /{" "}
        {balance.full.toFixed(2)}
        {balance.remaining > 0
          ? ` · due GHS ${balance.remaining.toFixed(2)}`
          : ""}
      </span>
    );
  }

  return (
    <dl className="grid gap-3 border border-stone-200 px-4 py-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <dt className="text-stone-500">Payment</dt>
        <dd className="font-medium text-stone-900">{balance.label}</dd>
      </div>
      <div>
        <dt className="text-stone-500">Full price</dt>
        <dd className="font-medium text-stone-900">
          GHS {balance.full.toFixed(2)}
        </dd>
      </div>
      <div>
        <dt className="text-stone-500">Paid</dt>
        <dd className="font-medium text-stone-900">
          GHS {balance.paid.toFixed(2)}
        </dd>
      </div>
      <div>
        <dt className="text-stone-500">Remaining</dt>
        <dd
          className={
            balance.remaining > 0
              ? "font-medium text-amber-900"
              : "font-medium text-emerald-800"
          }
        >
          GHS {balance.remaining.toFixed(2)}
        </dd>
      </div>
    </dl>
  );
}
