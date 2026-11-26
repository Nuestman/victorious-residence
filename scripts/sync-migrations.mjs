/**
 * Align __drizzle_migrations with the journal for DBs that were evolved via
 * db:push (or partial migrate). Applies any missing SQL safely, then records
 * the migration hash drizzle-kit expects.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const journal = JSON.parse(
  fs.readFileSync("drizzle/meta/_journal.json", "utf8"),
);

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

function hashQuery(query) {
  return crypto.createHash("sha256").update(query).digest("hex");
}

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

  for (const entry of journal.entries) {
    const filePath = path.join("drizzle", `${entry.tag}.sql`);
    const query = fs.readFileSync(filePath, "utf8");
    const hash = hashQuery(query);

    if (existingHashes.has(hash)) {
      console.log(`ok      ${entry.tag}`);
      continue;
    }

    // Apply statements; tolerate "already exists" from prior db:push.
    const statements = query
      .split("--> statement-breakpoint")
      .map((part) => part.trim())
      .filter(Boolean);

    for (const statement of statements) {
      try {
        await sql.unsafe(statement);
        console.log(`applied ${entry.tag}: ${statement.slice(0, 72)}…`);
      } catch (error) {
        const code = error?.code;
        const message = String(error?.message ?? error);
        const ignorable =
          code === "42701" || // duplicate_column
          code === "42P07" || // duplicate_table
          code === "42710" || // duplicate_object
          code === "23505" || // unique_violation on enum/label edge cases
          /already exists/i.test(message);
        if (!ignorable) {
          throw error;
        }
        console.log(`skip    ${entry.tag}: already present (${code ?? "ok"})`);
      }
    }

    await sql`
      insert into drizzle.__drizzle_migrations (hash, created_at)
      values (${hash}, ${entry.when})
    `;
    existingHashes.add(hash);
    console.log(`recorded ${entry.tag}`);
  }

  const amountPaid = await sql`
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'bookings'
      and column_name = 'amount_paid'
  `;
  if (amountPaid.length === 0) {
    throw new Error("bookings.amount_paid is still missing after sync");
  }
  console.log("verified bookings.amount_paid");
} finally {
  await sql.end();
}
