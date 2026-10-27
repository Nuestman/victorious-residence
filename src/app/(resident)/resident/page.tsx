import Link from "next/link";
import { count } from "drizzle-orm";
import { Suspense } from "react";

import { PortalShell } from "@/components/portal-shell";
import { ResidentNav } from "@/components/resident/resident-nav";
import { getBookingHoldHours } from "@/lib/booking";
import { requireRole } from "@/server/auth/guards";
import { db } from "@/server/db";
import { bedSpaces } from "@/server/db/schema";
import { getAvailableBedsByRoomType } from "@/server/queries/availability";
import { getResidentBookings } from "@/server/queries/bookings";

export const instant = false;

async function ResidentContent() {
  const session = await requireRole("RESIDENT", "/resident");

  const availability = await getAvailableBedsByRoomType(
    session.user.residenceId ?? undefined,
  );
  const [{ totalBeds }] = await db
    .select({ totalBeds: count() })
    .from(bedSpaces);
  const myBookings = await getResidentBookings(session.user.id);
  const pendingBooking = myBookings.find((b) => b.paymentStatus === "PENDING");

  return (
    <PortalShell
      title="Resident portal"
      description={`Browse types, hold a bed for ${getBookingHoldHours()} hours, then upload proof of payment.`}
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <ResidentNav currentPath="/resident" />

      {pendingBooking ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          You have a pending hold on {pendingBooking.roomLabel}-
          {pendingBooking.bedLabel}.{" "}
          <Link
            href={`/resident/bookings/${pendingBooking.id}`}
            className="font-medium underline"
          >
            Complete payment proof
          </Link>{" "}
          before it expires.
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-stone-900">
          Available beds by room type
        </h2>
        <p className="text-sm text-stone-500">
          {totalBeds} bed spaces in inventory
        </p>
        <ul className="divide-y divide-stone-200 border border-stone-200">
          {availability.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
            >
              <div>
                <p className="font-medium text-stone-900">{row.name}</p>
                <p className="text-sm text-stone-500">
                  {row.capacity}-in-1 · GHS {row.pricePerBed} / bed
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium text-stone-800">
                  {row.availableBeds} available
                </p>
                {row.availableBeds > 0 && !pendingBooking ? (
                  <Link
                    href={`/resident/room-types/${row.id}`}
                    className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-800"
                  >
                    Choose bed
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </PortalShell>
  );
}

export default function ResidentHomePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-5xl px-6 py-12 text-stone-500">
          Loading resident portal…
        </main>
      }
    >
      <ResidentContent />
    </Suspense>
  );
}
