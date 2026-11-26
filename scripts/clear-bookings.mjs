/**
 * Wipe all bookings and reset bed inventory for staging tests.
 * Does not delete users, residences, or room inventory.
 */
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

try {
  const before = await sql`
    select
      (select count(*)::int from bookings) as bookings,
      (select count(*)::int from bed_spaces where status <> 'AVAILABLE') as non_available_beds,
      (select count(*)::int from bed_spaces where active_booking_id is not null) as locked_beds
  `;
  console.log("before:", before[0]);

  await sql.begin(async (tx) => {
    await tx`
      update bed_spaces
      set
        active_booking_id = null,
        status = 'AVAILABLE',
        updated_at = now()
      where active_booking_id is not null
         or status <> 'AVAILABLE'
    `;
    await tx`delete from bookings`;
  });

  const after = await sql`
    select
      (select count(*)::int from bookings) as bookings,
      (select count(*)::int from bed_spaces where status <> 'AVAILABLE') as non_available_beds,
      (select count(*)::int from bed_spaces where active_booking_id is not null) as locked_beds,
      (select count(*)::int from bed_spaces) as total_beds
  `;
  console.log("after:", after[0]);
  console.log("Bookings cleared; all beds set to AVAILABLE.");
} finally {
  await sql.end();
}
