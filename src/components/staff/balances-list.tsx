import Link from "next/link";

import { PaymentBalanceSummary } from "@/components/staff/payment-balance-summary";
import { PaymentReminderButton } from "@/components/staff/payment-reminder-button";
import { getPaymentBalance } from "@/lib/booking";

type BalanceRow = {
  id: string;
  amount: string;
  amountPaid: string | null;
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED";
  paymentReference: string | null;
  residentName: string;
  residentEmail: string;
  roomLabel: string;
  bedLabel: string;
  roomTypeName: string;
  bedStatus: string;
};

type BalancesListProps = {
  rows: BalanceRow[];
  reviewBasePath: string;
};

export function BalancesList({ rows, reviewBasePath }: BalancesListProps) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-stone-600">
        No outstanding balances right now. Partial payments with remaining dues
        appear here.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-stone-200 border border-stone-200">
      {rows.map((row) => {
        const balance = getPaymentBalance(row.amount, row.amountPaid);
        return (
          <li key={row.id} className="space-y-3 px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-stone-900">
                  {row.residentName} · {row.roomTypeName} · {row.roomLabel}-
                  {row.bedLabel}
                </p>
                <p className="text-sm text-stone-500">
                  {row.paymentStatus} · bed {row.bedStatus}
                  {row.paymentReference ? ` · ref ${row.paymentReference}` : ""}
                </p>
              </div>
              <Link
                href={`${reviewBasePath}/${row.id}`}
                className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-800"
              >
                Open booking
              </Link>
            </div>
            <PaymentBalanceSummary
              amount={row.amount}
              amountPaid={row.amountPaid}
            />
            <PaymentReminderButton
              bookingId={row.id}
              remaining={balance.remaining}
              residentEmail={row.residentEmail}
            />
          </li>
        );
      })}
    </ul>
  );
}
