import type { Metadata } from "next";

import { getPublicShowcase } from "@/server/queries/showcase";

export const instant = false;

export const metadata: Metadata = {
  title: "Facilities",
};

export default async function FacilitiesPage() {
  const showcase = await getPublicShowcase();
  const facilities = showcase?.facilities ?? [];

  return (
    <main className="mx-auto w-full max-w-6xl space-y-10 px-4 py-12 sm:px-6">
      <div className="max-w-2xl space-y-3">
        <p className="text-sm tracking-[0.18em] text-brass uppercase">
          Shared spaces
        </p>
        <h1 className="font-display text-5xl">Facilities</h1>
        <p className="text-lg text-ink/75">
          These spaces are shared by the residence. Room pages call out what is
          inside each room type.
        </p>
      </div>
      <div className="space-y-12">
        {facilities.map((facility, index) => (
          <article
            key={facility.id}
            className="grid items-center gap-6 md:grid-cols-2"
          >
            <img
              src={facility.url}
              alt={facility.title ?? "Facility"}
              className={`aspect-[4/3] w-full rounded-lg object-cover ${index % 2 === 1 ? "md:order-2" : ""}`}
            />
            <div className="space-y-3">
              <h2 className="font-display text-3xl">{facility.title}</h2>
              <p className="leading-7 text-ink/80">{facility.description}</p>
              {facility.caption ? (
                <p className="text-sm text-ink/60">{facility.caption}</p>
              ) : null}
            </div>
          </article>
        ))}
        {facilities.length === 0 ? (
          <p className="text-ink/70">Facilities have not been published yet.</p>
        ) : null}
      </div>
    </main>
  );
}
