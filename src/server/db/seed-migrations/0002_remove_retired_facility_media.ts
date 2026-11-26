import { and, eq, inArray, or } from "drizzle-orm";

import { residenceMedia, residences } from "../schema";

import type { SeedMigration } from "./types";

export const migration: SeedMigration = {
  id: "0002_remove_retired_facility_media",
  description:
    "Remove retired courtyard / Wi-Fi common-area showcase rows if still present.",
  async up(db) {
    const [residence] = await db
      .select({ id: residences.id })
      .from(residences)
      .where(eq(residences.slug, "victorious-residence"))
      .limit(1);

    if (!residence) {
      return;
    }

    await db.delete(residenceMedia).where(
      and(
        eq(residenceMedia.residenceId, residence.id),
        or(
          inArray(residenceMedia.url, [
            "/showcase/exterior-courtyard.jpg",
            "/showcase/facility-common.jpg",
          ]),
          inArray(residenceMedia.title, ["Courtyard", "Wi-Fi common area"]),
        ),
      ),
    );
  },
};
