import Link from "next/link";
import { and, count, eq, isNotNull } from "drizzle-orm";
import { Suspense } from "react";

import { ManagerNav } from "@/components/manager/manager-nav";
import { PortalShell } from "@/components/portal-shell";
import { requireRole } from "@/server/auth/guards";
import { db } from "@/server/db";
import { bedSpaces, bookings } from "@/server/db/schema";
import {
  getManagerReviewQueue,
  getRecentReviewedBookings,
} from "@/server/queries/bookings";

export const instant = false;

async function ManagerContent() {
  const session = await requireRole("MANAGER", "/manager");

  const [available] = await db
    .select({ value: count() })
    .from(bedSpaces)
    .where(eq(bedSpaces.status, "AVAILABLE"));
  const [pendingBeds] = await db
    .select({ value: count() })
    .from(bedSpaces)
    .where(eq(bedSpaces.status, "PENDING_PAYMENT"));
  const [occupied] = await db
    .select({ value: count() })
    .from(bedSpaces)
    .where(eq(bedSpaces.status, "OCCUPIED"));
  const [pendingReviews] = await db
    .select({ value: count() })
    .from(bookings)
    .where(eq(bookings.paymentStatus, "PENDING"));
  const [readyForReview] = await db
    .select({ value: count() })
    .from(bookings)
    .where(
      and(
        eq(bookings.paymentStatus, "PENDING"),
        isNotNull(bookings.receiptUrl),
        isNotNull(bookings.paymentReference),
      ),
    );

  const queuePreview = await getManagerReviewQueue({ onlyWithProof: true });
  const recent = await getRecentReviewedBookings(5);

  return (
    <PortalShell
      title="Manager panel"
      description="Review payment proofs and approve or reject bed assignments."
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <ManagerNav currentPath="/manager" />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Available beds", value: available.value },
          { label: "Pending payment beds", value: pendingBeds.value },
          { label: "Occupied", value: occupied.value },
          { label: "Open holds", value: pendingReviews.value },
          { label: "Ready to review", value: readyForReview.value },
        ].map((stat) => (
          <div key={stat.label} className="border border-stone-200 px-4 py-3">
            <p className="text-sm text-stone-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-stone-900">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-medium text-stone-900">
            Ready for review
          </h2>
          <Link
            href="/manager/reviews"
            className="text-sm font-medium text-stone-800 underline"
          >
            Open full queue
          </Link>
        </div>
        {queuePreview.length === 0 ? (
          <p className="text-sm text-stone-600">
            No bookings with payment proof waiting right now.
          </p>
        ) : (
          <ul className="divide-y divide-stone-200 border border-stone-200">
            {queuePreview.slice(0, 5).map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-stone-900">
                    {row.residentName} · {row.roomLabel}-{row.bedLabel}
                  </p>
                  <p className="text-sm text-stone-500">
                    GHS {row.amount} · ref {row.paymentReference} · expires{" "}
                    {row.expiresAt.toLocaleString()}
                  </p>
                </div>
                <Link
                  href={`/manager/reviews/${row.id}`}
                  className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-800"
                >
                  Review
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-stone-900">Recent decisions</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-stone-600">No reviewed bookings yet.</p>
        ) : (
          <ul className="divide-y divide-stone-200 border border-stone-200">
            {recent.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-stone-900">
                    {row.residentName} · {row.roomLabel}-{row.bedLabel}
                  </p>
                  <p className="text-sm text-stone-500">
                    {row.paymentStatus} · GHS {row.amount}
                    {row.reviewedAt
                      ? ` · ${row.reviewedAt.toLocaleString()}`
                      : null}
                  </p>
                </div>
                <Link
                  href={`/manager/reviews/${row.id}`}
                  className="text-sm font-medium text-stone-800 underline"
                >
                  View
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PortalShell>
  );
}

export default function ManagerHomePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-5xl px-6 py-12 text-stone-500">
          Loading manager panel…
        </main>
      }
    >
      <ManagerContent />
    </Suspense>
  );
}
