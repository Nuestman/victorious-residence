import Link from "next/link";
import { count } from "drizzle-orm";
import { Suspense } from "react";

import { PortalShell } from "@/components/portal-shell";
import { RoomCard } from "@/components/site/room-card";
import { MIN_RESERVATION_DEPOSIT_GHS } from "@/lib/booking";
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
      description={`Choose a bed, then reserve it with a non-refundable deposit of at least GHS ${MIN_RESERVATION_DEPOSIT_GHS.toLocaleString("en-GH")}.`}
      userId={session.user.id}
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >

      {pendingBooking ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          You have a pending booking for {pendingBooking.roomLabel}-
          {pendingBooking.bedLabel}.{" "}
          <Link
            href={`/resident/bookings/${pendingBooking.id}`}
            className="font-medium underline"
          >
            {pendingBooking.receiptUrl
              ? "View deposit status"
              : "Pay the GHS " +
                MIN_RESERVATION_DEPOSIT_GHS.toLocaleString("en-GH") +
                "+ deposit to reserve"}
          </Link>
          .
        </div>
      ) : null}

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">
          Available beds by room type
        </h2>
        <p className="text-sm text-ink/70">
          {totalBeds} bed spaces in inventory
          {pendingBooking
            ? " · finish your current booking before choosing another bed"
            : ""}
        </p>
        <div className="space-y-6">
          {availability.map((row) => (
            <RoomCard
              key={row.id}
              href={
                row.availableBeds > 0 && !pendingBooking
                  ? `/resident/room-types/${row.id}`
                  : `/rooms/${row.id}`
              }
              name={row.name}
              description={row.description}
              capacity={row.capacity}
              pricePerBed={row.pricePerBed}
              amenities={row.amenities ?? []}
              availableBeds={row.availableBeds}
              imageUrl={row.coverImageUrl}
              cta={
                row.availableBeds > 0 && !pendingBooking
                  ? "Choose bed"
                  : "View photos"
              }
            />
          ))}
        </div>
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
