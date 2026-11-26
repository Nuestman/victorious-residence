import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AmenityList } from "@/components/site/amenity-list";
import { AvailabilityBadge } from "@/components/site/availability-badge";
import { PhotoGallery } from "@/components/site/photo-gallery";
import { formatPublicPrice } from "@/lib/booking";
import { auth } from "@/server/auth";
import { defaultDestinationForRole } from "@/server/auth/roles";
import { getPublicRoomType } from "@/server/queries/showcase";

export const instant = false;

type RoomPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: RoomPageProps): Promise<Metadata> {
  const { id } = await params;
  const room = await getPublicRoomType(id);
  return { title: room?.name ?? "Room" };
}

export default async function PublicRoomPage({ params }: RoomPageProps) {
  const { id } = await params;
  const room = await getPublicRoomType(id);
  if (!room) {
    notFound();
  }

  const session = await auth();
  const images = (
    room.angles.length > 0
      ? room.angles
      : room.coverImageUrl
        ? [{ url: room.coverImageUrl, caption: room.name }]
        : []
  ).map((image) => ({
    src: image.url,
    alt: `${room.name}${image.caption ? ` — ${image.caption}` : ""}`,
  }));

  const residentHoldHref = `/resident/room-types/${room.id}`;
  let primaryHref = "/register";
  let primaryLabel = "Book a Room";
  let secondaryHref: string | null = `/login?callbackUrl=${encodeURIComponent(residentHoldHref)}`;
  let secondaryLabel: string | null = "Sign in to continue";

  if (session?.user?.role === "RESIDENT") {
    primaryHref = residentHoldHref;
    primaryLabel = "Choose this room";
    secondaryHref = null;
    secondaryLabel = null;
  } else if (session?.user) {
    primaryHref = defaultDestinationForRole(session.user.role);
    primaryLabel = "Open portal";
    secondaryHref = null;
    secondaryLabel = null;
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <div className="space-y-4">
        <Link href="/rooms" className="text-sm text-forest">
          All rooms
        </Link>
        <PhotoGallery images={images} />
      </div>
      <div className="space-y-5">
        <p className="text-sm tracking-[0.18em] text-brass uppercase">
          {room.residenceName}
        </p>
        <h1 className="font-display text-5xl">{room.name}</h1>
        <AvailabilityBadge count={room.availableBeds} />
        <p className="text-2xl text-forest">
          {formatPublicPrice(room.pricePerBed)}{" "}
          <span className="text-base text-ink/70">/ bed</span>
        </p>
        <p className="text-sm text-ink/70">
          {room.capacity === 1
            ? "Private room with one bed."
            : `${room.capacity} bed spaces in the room.`}
        </p>
        {room.description ? (
          <p className="leading-7 text-ink/80">{room.description}</p>
        ) : null}
        <AmenityList items={room.amenities} />
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href={primaryHref}
            className="rounded-md bg-forest px-5 py-2.5 text-sm font-medium text-cream"
          >
            {primaryLabel}
          </Link>
          {secondaryHref && secondaryLabel ? (
            <Link
              href={secondaryHref}
              className="rounded-md border border-forest/30 px-5 py-2.5 text-sm font-medium text-forest"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}
