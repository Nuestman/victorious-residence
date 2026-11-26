/**
 * Mark already-applied schema migrations in __drizzle_migrations when the DB
 * was created with db:push (empty migration history).
 *
 * Prefer `npm run db:sync` (`scripts/sync-migrations.mjs`) — it applies any
 * missing SQL (tolerating "already exists") and records every journal entry.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config({ path: ".env" });

const journal = JSON.parse(
  fs.readFileSync("drizzle/meta/_journal.json", "utf8"),
);

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

try {
  await sql`create schema if not exists drizzle`;
  await sql`
    create table if not exists drizzle.__drizzle_migrations (
      id serial primary key,
      hash text not null,
      created_at bigint
    )
  `;

  const existing = await sql`
    select hash from drizzle.__drizzle_migrations
  `;
  const existingHashes = new Set(existing.map((row) => row.hash));

  // Baseline everything except the newest pending migration.
  const toBaseline = journal.entries.slice(0, -1);
  for (const entry of toBaseline) {
    const filePath = path.join("drizzle", `${entry.tag}.sql`);
    const query = fs.readFileSync(filePath, "utf8");
    const hash = crypto.createHash("sha256").update(query).digest("hex");
    if (existingHashes.has(hash)) {
      console.log(`skip ${entry.tag}`);
      continue;
    }
    await sql`
      insert into drizzle.__drizzle_migrations (hash, created_at)
      values (${hash}, ${entry.when})
    `;
    console.log(`baselined ${entry.tag}`);
  }
} finally {
  await sql.end();
}
