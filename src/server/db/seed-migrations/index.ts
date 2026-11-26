import { config } from "dotenv";
import { eq, sql } from "drizzle-orm";

import { migration as m0001 } from "./0001_replace_placeholder_captions";
import { migration as m0002 } from "./0002_remove_retired_facility_media";
import { migration as m0003 } from "./0003_fill_legacy_contact_fields";
import { migration as m0004 } from "./0004_refresh_legacy_room_type_copy";
import type { SeedMigration } from "./types";

config({ path: ".env.local" });
config({ path: ".env" });

const migrations: SeedMigration[] = [m0001, m0002, m0003, m0004];

async function ensureSeedMigrationsTable(
  db: import("./types").SeedDb,
) {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS seed_migrations (
      id text PRIMARY KEY NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

async function run() {
  const { db } = await import("../index");
  const { seedMigrations } = await import("../schema");

  console.log("Running incremental seed migrations…");
  await ensureSeedMigrationsTable(db);

  const applied = await db.select().from(seedMigrations);
  const appliedIds = new Set(applied.map((row) => row.id));

  let ran = 0;
  for (const migration of migrations) {
    if (appliedIds.has(migration.id)) {
      console.log(`  skip ${migration.id}`);
      continue;
    }

    console.log(`  apply ${migration.id}: ${migration.description}`);
    await migration.up(db);
    await db.insert(seedMigrations).values({ id: migration.id });
    ran += 1;
  }

  // Sanity: re-check should no-op if somehow double-inserted mid-run.
  for (const migration of migrations) {
    const [row] = await db
      .select()
      .from(seedMigrations)
      .where(eq(seedMigrations.id, migration.id))
      .limit(1);
    if (!row) {
      throw new Error(`Seed migration ${migration.id} was not recorded`);
    }
  }

  console.log(
    ran === 0
      ? "No pending seed migrations."
      : `Applied ${ran} seed migration(s).`,
  );
}

run()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
