import { eq } from "drizzle-orm";

import {
  isLegacyPlaceholderCaption,
  showcaseMedia,
  showcaseRoomTypes,
} from "../showcase-content";
import { residenceMedia, roomTypeMedia } from "../schema";

import type { SeedMigration } from "./types";

const captionsByUrl = new Map<string, string>([
  ...showcaseMedia.map((item) => [item.url, item.caption] as const),
  ...showcaseRoomTypes.flatMap((room) =>
    room.angles.map((angle) => [angle.url, angle.caption] as const),
  ),
]);

export const migration: SeedMigration = {
  id: "0001_replace_placeholder_captions",
  description:
    "Replace legacy placeholder media captions with production captions (URL-matched only).",
  async up(db) {
    const residenceRows = await db.select().from(residenceMedia);
    for (const row of residenceRows) {
      if (!isLegacyPlaceholderCaption(row.caption)) {
        continue;
      }
      const next = captionsByUrl.get(row.url);
      if (!next || next === row.caption) {
        continue;
      }
      await db
        .update(residenceMedia)
        .set({ caption: next })
        .where(eq(residenceMedia.id, row.id));
    }

    const roomRows = await db.select().from(roomTypeMedia);
    for (const row of roomRows) {
      if (!isLegacyPlaceholderCaption(row.caption)) {
        continue;
      }
      const next = captionsByUrl.get(row.url);
      if (!next || next === row.caption) {
        continue;
      }
      await db
        .update(roomTypeMedia)
        .set({ caption: next })
        .where(eq(roomTypeMedia.id, row.id));
    }
  },
};
