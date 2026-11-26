import Link from "next/link";

import { PortalShell } from "@/components/portal-shell";
import { requireRole } from "@/server/auth/guards";
import { getResidentBookings } from "@/server/queries/bookings";

export const instant = false;

const statusLabel = {
  PENDING: "Pending payment",
  SUCCESS: "Approved",
  FAILED: "Failed / expired",
} as const;

export default async function ResidentBookingsPage() {
  const session = await requireRole("RESIDENT", "/resident/bookings");
  const rows = await getResidentBookings(session.user.id);

  return (
    <PortalShell
      title="My bookings"
      description="Track deposit payments, reservations, and allocation status."
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >

      {rows.length === 0 ? (
        <p className="text-sm text-stone-600">
          No bookings yet.{" "}
          <Link href="/resident" className="underline">
            Browse room types
          </Link>
          .
        </p>
      ) : (
        <ul className="divide-y divide-stone-200 border border-stone-200">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <p className="font-medium text-stone-900">
                  {row.roomTypeName} · {row.roomLabel}-{row.bedLabel}
                </p>
                <p className="text-sm text-stone-500">
                  {statusLabel[row.paymentStatus]} · GHS {row.amount}
                  {row.paymentStatus === "PENDING" && row.receiptUrl
                    ? ` · deposit GHS ${row.amountPaid ?? "—"} (reserved)`
                    : null}
                  {row.paymentStatus === "PENDING" && !row.receiptUrl
                    ? ` · deposit due by ${row.expiresAt.toLocaleString()}`
                    : null}
                </p>
              </div>
              <Link
                href={`/resident/bookings/${row.id}`}
                className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-800"
              >
                View
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PortalShell>
  );
}
