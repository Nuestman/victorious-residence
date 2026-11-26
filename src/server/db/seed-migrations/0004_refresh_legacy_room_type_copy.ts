import { and, eq } from "drizzle-orm";

import { showcaseRoomTypes } from "../showcase-content";
import { residences, roomTypes } from "../schema";

import type { SeedMigration } from "./types";

const LEGACY_DESCRIPTIONS = new Set([
  "Private room, one bed.",
  "Shared room with two bed spaces.",
  "Shared room with four bed spaces.",
  "A private room with one bed, a wardrobe, a writing desk, and a window. The bathroom is private to the room. Shared kitchen, study room, laundry, and Wi-Fi are on the facilities page. Suited to a resident who wants a quiet space of their own.",
  "A shared room with two single beds, wardrobes, and a desk by the window. Residents share the room bathroom and the hostel kitchen, study room, and laundry. A practical choice when you want company without a four-bed room.",
  "A shared room with four bed spaces, personal storage, and a window for daylight. The bathroom is shared by the room. Kitchen, study, lounge, laundry, and the secure entrance are shared across the residence. This is the lowest price per bed.",
]);

export const migration: SeedMigration = {
  id: "0004_refresh_legacy_room_type_copy",
  description:
    "Refresh room-type description/amenities/cover only when still on known legacy seed copy or missing cover.",
  async up(db) {
    const [residence] = await db
      .select({ id: residences.id })
      .from(residences)
      .where(eq(residences.slug, "victorious-residence"))
      .limit(1);

    if (!residence) {
      return;
    }

    for (const typeDef of showcaseRoomTypes) {
      const [row] = await db
        .select()
        .from(roomTypes)
        .where(
          and(
            eq(roomTypes.residenceId, residence.id),
            eq(roomTypes.name, typeDef.name),
          ),
        )
        .limit(1);

      if (!row) {
        continue;
      }

      const shouldRefresh =
        !row.coverImageUrl || LEGACY_DESCRIPTIONS.has(row.description ?? "");

      if (!shouldRefresh) {
        continue;
      }

      await db
        .update(roomTypes)
        .set({
          description: typeDef.description,
          amenities: [...typeDef.amenities],
          coverImageUrl: typeDef.coverImageUrl,
        })
        .where(eq(roomTypes.id, row.id));
    }
  },
};
