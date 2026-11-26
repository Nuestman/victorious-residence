import { eq, or, sql } from "drizzle-orm";

import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  LEGACY_PLACEHOLDER_EMAIL,
  LEGACY_PLACEHOLDER_PHONE,
} from "@/lib/contact";

import { residences } from "../schema";

import type { SeedMigration } from "./types";

export const migration: SeedMigration = {
  id: "0003_fill_legacy_contact_fields",
  description:
    "Replace legacy placeholder phone/email only when those exact values remain.",
  async up(db) {
    await db
      .update(residences)
      .set({
        phone: sql`case
          when ${residences.phone} is null
            or trim(${residences.phone}) = ''
            or ${residences.phone} = ${LEGACY_PLACEHOLDER_PHONE}
          then ${CONTACT_PHONE}
          else ${residences.phone}
        end`,
        email: sql`case
          when ${residences.email} is null
            or trim(${residences.email}) = ''
            or ${residences.email} = ${LEGACY_PLACEHOLDER_EMAIL}
          then ${CONTACT_EMAIL}
          else ${residences.email}
        end`,
      })
      .where(
        or(
          eq(residences.phone, LEGACY_PLACEHOLDER_PHONE),
          eq(residences.email, LEGACY_PLACEHOLDER_EMAIL),
          sql`${residences.phone} is null or trim(${residences.phone}) = ''`,
          sql`${residences.email} is null or trim(${residences.email}) = ''`,
        ),
      );
  },
};
