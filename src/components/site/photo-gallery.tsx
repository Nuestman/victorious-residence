"use client";

import { useState } from "react";

type GalleryImage = {
  src: string;
  alt: string;
};

export function PhotoGallery({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  if (!current) {
    return null;
  }

  return (
    <div className="space-y-3">
      <img
        src={current.src}
        alt={current.alt}
        className="aspect-[16/10] w-full rounded-lg object-cover"
      />
      {images.length > 1 ? (
        <div className="grid grid-cols-3 gap-3">
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              aria-label={image.alt}
              onClick={() => setActive(index)}
              className={
                index === active
                  ? "overflow-hidden rounded-md ring-2 ring-brass"
                  : "overflow-hidden rounded-md opacity-80"
              }
            >
              <img src={image.src} alt={image.alt} className="aspect-[4/3] w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
