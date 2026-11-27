import Link from "next/link";
import { notFound } from "next/navigation";

import { PortalShell } from "@/components/portal-shell";
import { HoldBedForm } from "@/components/resident/hold-bed-form";
import { AmenityList } from "@/components/site/amenity-list";
import { PhotoGallery } from "@/components/site/photo-gallery";
import { MIN_RESERVATION_DEPOSIT_GHS } from "@/lib/booking";
import { requireRole } from "@/server/auth/guards";
import {
  getAvailableBedsForRoomType,
  getResidentBookings,
  getRoomTypeSummary,
} from "@/server/queries/bookings";
import { listRoomTypeAngles } from "@/server/queries/showcase";

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
  const angles = await listRoomTypeAngles(id);
  const myBookings = await getResidentBookings(session.user.id);
  const pendingBooking = myBookings.find((b) => b.paymentStatus === "PENDING");
  const images = (
    angles.length > 0
      ? angles
      : summary.coverImageUrl
        ? [{ url: summary.coverImageUrl, caption: summary.name }]
        : []
  ).map((image) => ({
    src: image.url,
    alt: `${summary.name}${image.caption ? ` — ${image.caption}` : ""}`,
  }));

  return (
    <PortalShell
      title={summary.name}
      description={`${summary.capacity}-in-1 · GHS ${summary.pricePerBed} / bed · reserve with GHS ${MIN_RESERVATION_DEPOSIT_GHS.toLocaleString("en-GH")}+ non-refundable deposit`}
      userId={session.user.id}
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <Link href="/resident" className="text-sm text-forest">
        Back to room types
      </Link>

      {images.length > 0 ? <PhotoGallery images={images} /> : null}
      {summary.description ? (
        <p className="leading-7 text-ink/80">{summary.description}</p>
      ) : null}
      <AmenityList items={summary.amenities ?? []} />

      {pendingBooking ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Finish your current pending booking before applying for another bed.{" "}
          <Link
            href={`/resident/bookings/${pendingBooking.id}`}
            className="font-medium underline"
          >
            Open booking
          </Link>
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-ink">
          Available beds ({beds.length})
        </h2>
        {beds.length === 0 ? (
          <p className="text-sm text-ink/70">
            No beds available in this type right now.
          </p>
        ) : (
          <ul className="divide-y divide-ink/10 rounded-lg border border-ink/10 bg-white">
            {beds.map((bed) => (
              <li
                key={bed.bedId}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-ink">
                    Room {bed.roomLabel} · Bed {bed.bedLabel}
                  </p>
                  <p className="text-sm text-ink/60">
                    {bed.floor != null ? `Floor ${bed.floor}` : "Floor n/a"}
                  </p>
                </div>
                {pendingBooking ? (
                  <span className="text-sm text-ink/60">Application unavailable</span>
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
