import Link from "next/link";
import { notFound } from "next/navigation";

import { PortalShell } from "@/components/portal-shell";
import { HoldBedForm } from "@/components/resident/hold-bed-form";
import { ResidentNav } from "@/components/resident/resident-nav";
import { getBookingHoldHours } from "@/lib/booking";
import { requireRole } from "@/server/auth/guards";
import {
  getAvailableBedsForRoomType,
  getResidentBookings,
  getRoomTypeSummary,
} from "@/server/queries/bookings";

export const instant = false;

type RoomTypeBedsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RoomTypeBedsPage({
  params,
}: RoomTypeBedsPageProps) {
  const { id } = await params;
  const session = await requireRole("RESIDENT", `/resident/room-types/${id}`);

  const summary = await getRoomTypeSummary(id);
  if (!summary) {
    notFound();
  }

  const beds = await getAvailableBedsForRoomType(id);
  const myBookings = await getResidentBookings(session.user.id);
  const pendingBooking = myBookings.find((b) => b.paymentStatus === "PENDING");

  return (
    <PortalShell
      title={summary.name}
      description={`${summary.capacity}-in-1 · GHS ${summary.pricePerBed} / bed · hold lasts ${getBookingHoldHours()} hours`}
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <ResidentNav currentPath="/resident" />
      <Link
        href="/resident"
        className="text-sm text-stone-500 hover:text-stone-800"
      >
        ← Back to room types
      </Link>

      {summary.description ? (
        <p className="text-stone-600">{summary.description}</p>
      ) : null}

      {pendingBooking ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Finish your current pending booking before holding another bed.{" "}
          <Link
            href={`/resident/bookings/${pendingBooking.id}`}
            className="font-medium underline"
          >
            Open booking
          </Link>
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-stone-900">
          Available beds ({beds.length})
        </h2>
        {beds.length === 0 ? (
          <p className="text-sm text-stone-600">
            No beds available in this type right now.
          </p>
        ) : (
          <ul className="divide-y divide-stone-200 border border-stone-200">
            {beds.map((bed) => (
              <li
                key={bed.bedId}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-stone-900">
                    Room {bed.roomLabel} · Bed {bed.bedLabel}
                  </p>
                  <p className="text-sm text-stone-500">
                    {bed.floor != null ? `Floor ${bed.floor}` : "Floor n/a"}
                  </p>
                </div>
                {pendingBooking ? (
                  <span className="text-sm text-stone-500">Hold unavailable</span>
                ) : (
                  <HoldBedForm
                    bedSpaceId={bed.bedId}
                    roomLabel={bed.roomLabel}
                    bedLabel={bed.bedLabel}
                    pricePerBed={bed.pricePerBed}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </PortalShell>
  );
}
