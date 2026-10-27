import Link from "next/link";

import { ManagerNav } from "@/components/manager/manager-nav";
import { PortalShell } from "@/components/portal-shell";
import { expireBookingById } from "@/server/actions/bookings";
import { requireRole } from "@/server/auth/guards";
import { getManagerReviewQueue } from "@/server/queries/bookings";

export const instant = false;

type ReviewsPageProps = {
  searchParams: Promise<{ proof?: string }>;
};

export default async function ManagerReviewsPage({
  searchParams,
}: ReviewsPageProps) {
  const session = await requireRole("MANAGER", "/manager/reviews");
  const params = await searchParams;
  const onlyWithProof = params.proof !== "all";

  const pendingAll = await getManagerReviewQueue({ onlyWithProof: false });

  for (const row of pendingAll) {
    if (row.expiresAt.getTime() < Date.now()) {
      await expireBookingById(row.id, "booking.expire_on_manager_queue");
    }
  }

  const queue = await getManagerReviewQueue({ onlyWithProof });

  return (
    <PortalShell
      title="Review queue"
      description="Approve payment proofs to lock beds, or reject to release inventory."
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <ManagerNav currentPath="/manager/reviews" />

      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/manager/reviews"
          className={
            onlyWithProof
              ? "rounded-md bg-stone-900 px-3 py-1.5 font-medium text-white"
              : "rounded-md border border-stone-300 px-3 py-1.5 font-medium text-stone-800"
          }
        >
          With proof
        </Link>
        <Link
          href="/manager/reviews?proof=all"
          className={
            !onlyWithProof
              ? "rounded-md bg-stone-900 px-3 py-1.5 font-medium text-white"
              : "rounded-md border border-stone-300 px-3 py-1.5 font-medium text-stone-800"
          }
        >
          All pending holds
        </Link>
      </div>

      {queue.length === 0 ? (
        <p className="text-sm text-stone-600">
          No bookings in this queue right now.
        </p>
      ) : (
        <ul className="divide-y divide-stone-200 border border-stone-200">
          {queue.map((row) => {
            const hasProof = Boolean(row.receiptUrl && row.paymentReference);
            return (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-stone-900">
                    {row.residentName} · {row.roomTypeName} · {row.roomLabel}-
                    {row.bedLabel}
                  </p>
                  <p className="text-sm text-stone-500">
                    GHS {row.amount}
                    {hasProof
                      ? ` · ref ${row.paymentReference}`
                      : " · awaiting payment proof"}
                    {" · expires "}
                    {row.expiresAt.toLocaleString()}
                  </p>
                </div>
                <Link
                  href={`/manager/reviews/${row.id}`}
                  className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-800"
                >
                  {hasProof ? "Review" : "Open"}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </PortalShell>
  );
}
