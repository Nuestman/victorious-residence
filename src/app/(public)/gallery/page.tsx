import type { Metadata } from "next";

import { getPublicShowcase } from "@/server/queries/showcase";

export const instant = false;

export const metadata: Metadata = {
  title: "Gallery",
};

export default async function GalleryPage() {
  const showcase = await getPublicShowcase();
  const photos = showcase?.media ?? [];
  const name = showcase?.residence.name ?? "Victorious Residence";

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-12 sm:px-6">
      <div className="max-w-2xl space-y-3">
        <p className="text-sm tracking-[0.18em] text-brass uppercase">
          The building
        </p>
        <h1 className="font-display text-5xl">Gallery</h1>
        <p className="text-lg text-ink/75">
          A look at the building and shared spaces inside {name}.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {photos.map((photo) => (
          <figure key={photo.id} className="space-y-2">
            <img
              src={photo.url}
              alt={photo.title ?? name}
              className="aspect-[16/10] w-full rounded-lg object-cover"
            />
            <figcaption className="text-sm text-ink/75">
              <span className="font-medium text-ink">{photo.title}</span>
              {photo.caption ? ` · ${photo.caption}` : ""}
            </figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}
