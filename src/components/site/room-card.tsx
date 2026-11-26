import Link from "next/link";

import { formatPublicPrice } from "@/lib/booking";

import { PortalIcon } from "@/components/portal-icons";

import { AmenityList } from "./amenity-list";
import { AvailabilityBadge } from "./availability-badge";

type RoomCardProps = {
  href: string;
  name: string;
  description: string | null;
  capacity: number;
  pricePerBed: string;
  amenities: string[];
  availableBeds: number;
  imageUrl: string | null;
  cta: string;
};

export function RoomCard({
  href,
  name,
  description,
  capacity,
  pricePerBed,
  amenities,
  availableBeds,
  imageUrl,
  cta,
}: RoomCardProps) {
  return (
    <article className="grid overflow-hidden rounded-lg border border-ink/10 bg-white md:grid-cols-[minmax(0,18rem)_1fr]">
      <div className="min-h-56 bg-forest/10">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex min-h-56 items-center justify-center px-4 text-sm text-forest/70">
            Photo coming soon
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-ink">{name}</h2>
            <p className="mt-1 text-sm text-ink/70">
              {capacity === 1 ? "Private room · 1 bed" : `${capacity} beds in the room`}
            </p>
          </div>
          <AvailabilityBadge count={availableBeds} />
        </div>
        {description ? (
          <p className="text-sm leading-6 text-ink/80">{description}</p>
        ) : null}
        <AmenityList items={amenities} />
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-lg font-medium text-forest">
            {formatPublicPrice(pricePerBed)}{" "}
            <span className="text-sm font-normal text-ink/70">/ bed</span>
          </p>
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 rounded-md bg-forest px-4 py-2 text-sm font-medium text-cream"
          >
            {cta}
            <PortalIcon name="chevronRight" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
