import Link from "next/link";

import { RoomCard } from "@/components/site/room-card";
import { getPublicShowcase } from "@/server/queries/showcase";

export const instant = false;

export default async function HomePage() {
  const showcase = await getPublicShowcase();

  if (!showcase) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="font-display text-4xl">Victorious Residence</h1>
        <p className="mt-4 text-ink/75">
          The public catalogue is not available yet.
        </p>
      </main>
    );
  }

  const { residence, roomTypes, facilities, exterior } = showcase;
  const totalAvailable = roomTypes.reduce(
    (sum, row) => sum + row.availableBeds,
    0,
  );
  const hero =
    residence.heroImageUrl ?? exterior[0]?.url ?? "/showcase/exterior-day.jpg";

  return (
    <main>
      <section className="relative min-h-[70vh]">
        <img
          src={hero}
          alt={`${residence.name} front exterior`}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-ink/55" />
        <div className="relative z-10 mx-auto flex min-h-[70vh] w-full max-w-6xl flex-col justify-end px-4 py-16 text-cream sm:px-6">
          <p className="text-sm tracking-[0.2em] text-brass uppercase">
            Student hostel
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl leading-tight sm:text-6xl">
            {residence.name}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-cream/90">
            {residence.description}
          </p>
          <p className="mt-4 max-w-2xl text-lg text-cream/90">
            Skip the stress of unnecessary trips across town. Browse real photos
            of our rooms and facilities right here, check live bed availability,
            and reserve your spot online in minutes.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/rooms"
              className="rounded-md bg-cream px-5 py-2.5 text-sm font-medium text-forest"
            >
              View rooms
            </Link>
            <Link
              href="/register"
              className="rounded-md border border-cream/70 px-5 py-2.5 text-sm font-medium text-cream"
            >
              Book a Room
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-3">
        <article>
          <p className="font-display text-4xl text-forest">{totalAvailable}</p>
          <h2 className="mt-2 text-lg">Spaces open today</h2>
          <p className="mt-2 text-sm leading-6 text-ink/75">
            What’s free right now, by room type.
          </p>
        </article>
        <article>
          <p className="font-display text-4xl text-forest">{roomTypes.length}</p>
          <h2 className="mt-2 text-lg">Ways to stay</h2>
          <p className="mt-2 text-sm leading-6 text-ink/75">
            Private or shared rooms, each with its own price.
          </p>
        </article>
        <article>
          <p className="font-display text-4xl text-forest">Simple</p>
          <h2 className="mt-2 text-lg">Pay your way</h2>
          <p className="mt-2 text-sm leading-6 text-ink/75">
            Send MoMo or bank payment, share your receipt, and we confirm it.
          </p>
        </article>
      </section>

      <section className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-16 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-4xl">Rooms</h2>
          <Link href="/rooms" className="text-sm font-medium text-forest">
            All rooms
          </Link>
        </div>
        <div className="space-y-6">
          {roomTypes.map((room) => (
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
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-16 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-4xl">Facilities</h2>
            <Link href="/facilities" className="text-sm font-medium text-forest">
              See facilities
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {facilities.slice(0, 3).map((facility) => (
              <Link
                key={facility.id}
                href="/facilities"
                className="overflow-hidden rounded-lg border border-ink/10"
              >
                <img
                  src={facility.url}
                  alt={facility.title ?? "Facility"}
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="space-y-1 p-4">
                  <h3 className="font-medium">{facility.title}</h3>
                  <p className="text-sm text-ink/70">{facility.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-4xl">Gallery</h2>
          <Link href="/gallery" className="text-sm font-medium text-forest">
            Full gallery
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {exterior.slice(0, 4).map((photo) => (
            <figure key={photo.id} className="overflow-hidden rounded-lg">
              <img
                src={photo.url}
                alt={photo.title ?? residence.name}
                className="aspect-[16/10] w-full object-cover"
              />
              <figcaption className="mt-2 text-sm text-ink/70">
                {photo.title}
                {photo.caption ? ` · ${photo.caption}` : ""}
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="text-center rounded-lg bg-forest px-6 py-10 text-cream sm:px-10">
          <h2 className="font-display text-4xl">Ready to settle in?</h2>
          <p className="mt-3 max-w-xl mx-auto text-cream/85">
            Create an account, pick a room you like, and apply. We’ll help you
            through payment from there.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-block rounded-md bg-cream px-5 py-2.5 text-sm font-medium text-forest"
          >
            Book a Room Now
          </Link>
        </div>
      </section>
    </main>
  );
}
