import type { Metadata } from "next";

import { RoomCard } from "@/components/site/room-card";
import { getPublicShowcase } from "@/server/queries/showcase";

export const instant = false;

export const metadata: Metadata = {
  title: "Rooms",
};

export default async function RoomsPage() {
  const showcase = await getPublicShowcase();
  const rooms = showcase?.roomTypes ?? [];

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-12 sm:px-6">
      <div className="max-w-2xl space-y-3">
        <p className="text-sm tracking-[0.18em] text-brass uppercase">Stay</p>
        <h1 className="font-display text-5xl">Rooms</h1>
        <p className="text-lg text-ink/75">
          Each card is a room type, not a single bed. The price is per bed, and
          the count is how many beds are open in that type right now.
        </p>
      </div>
      <div className="space-y-6">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            href={`/rooms/${room.id}`}
            name={room.name}
            description={room.description}
            capacity={room.capacity}
            pricePerBed={room.pricePerBed}
            amenities={room.amenities ?? []}
            availableBeds={room.availableBeds}
            imageUrl={room.coverImageUrl}
            cta="More details"
          />
        ))}
        {rooms.length === 0 ? (
          <p className="text-ink/70">No room types are published yet.</p>
        ) : null}
      </div>
    </main>
  );
}
