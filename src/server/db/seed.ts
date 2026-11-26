import { config } from "dotenv";
import { hash } from "bcryptjs";
import { and, count, eq, or, inArray, sql } from "drizzle-orm";

import { CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/contact";

import {
  HERO_IMAGE,
  SHOWCASE_DESCRIPTION,
  showcaseMedia,
  showcaseRoomTypes,
} from "./showcase-content";

config({ path: ".env.local" });
config({ path: ".env" });

/**
 * Bootstrap seed only: insert missing rows. Never overwrites admin-edited
 * residence copy, contact fields, or media captions. Run `db:seed:migrate`
 * for incremental, idempotent data fixes.
 */
async function seed() {
  const { db } = await import("./index");
  const {
    bedSpaces,
    residences,
    rooms,
    residenceMedia,
    roomTypeMedia,
    roomTypes,
    users,
  } = await import("./schema");

  console.log("Seeding Victorious Residence (insert-only)…");

  const [residence] = await db
    .insert(residences)
    .values({
      name: "Victorious Residence",
      slug: "victorious-residence",
      address: "Obuasi, Ghana",
      description: SHOWCASE_DESCRIPTION,
      phone: CONTACT_PHONE,
      email: CONTACT_EMAIL,
      heroImageUrl: HERO_IMAGE,
      isActive: true,
    })
    .onConflictDoNothing({ target: residences.slug })
    .returning();

  const existingResidence =
    residence ??
    (
      await db
        .select()
        .from(residences)
        .where(eq(residences.slug, "victorious-residence"))
        .limit(1)
    )[0];

  if (!existingResidence) {
    throw new Error("Failed to create or load residence");
  }

  // Fill only empty contact / hero fields — never clobber live values.
  await db
    .update(residences)
    .set({
      description: sql`coalesce(nullif(trim(${residences.description}), ''), ${SHOWCASE_DESCRIPTION})`,
      phone: sql`coalesce(nullif(trim(${residences.phone}), ''), ${CONTACT_PHONE})`,
      email: sql`coalesce(nullif(trim(${residences.email}), ''), ${CONTACT_EMAIL})`,
      heroImageUrl: sql`coalesce(nullif(trim(${residences.heroImageUrl}), ''), ${HERO_IMAGE})`,
    })
    .where(eq(residences.id, existingResidence.id));

  const passwordHash = await hash("ChangeMe123!", 12);

  await db
    .insert(users)
    .values([
      {
        email: "admin@victorious.local",
        passwordHash,
        fullName: "System Admin",
        phone: "+233000000001",
        role: "ADMIN",
        residenceId: existingResidence.id,
      },
      {
        email: "manager@victorious.local",
        passwordHash,
        fullName: "Resident Manager",
        phone: "+233000000002",
        role: "MANAGER",
        residenceId: existingResidence.id,
      },
      {
        email: "resident@victorious.local",
        passwordHash,
        fullName: "Demo Resident",
        phone: "+233000000003",
        role: "RESIDENT",
        residenceId: existingResidence.id,
      },
      {
        email: "staff@victorious.local",
        passwordHash,
        fullName: "Demo Staff",
        phone: "+233000000004",
        role: "STAFF",
        residenceId: existingResidence.id,
      },
    ])
    .onConflictDoNothing({ target: users.email });

  for (const typeDef of showcaseRoomTypes) {
    const [roomType] = await db
      .insert(roomTypes)
      .values({
        residenceId: existingResidence.id,
        name: typeDef.name,
        capacity: typeDef.capacity,
        pricePerBed: typeDef.pricePerBed,
        description: typeDef.description,
        amenities: [...typeDef.amenities],
        coverImageUrl: typeDef.coverImageUrl,
        isActive: true,
        sortOrder: typeDef.sortOrder,
      })
      .onConflictDoNothing({
        target: [roomTypes.residenceId, roomTypes.name],
      })
      .returning();

    const resolvedType =
      roomType ??
      (
        await db
          .select()
          .from(roomTypes)
          .where(
            and(
              eq(roomTypes.residenceId, existingResidence.id),
              eq(roomTypes.name, typeDef.name),
            ),
          )
          .limit(1)
      )[0];

    if (!resolvedType) {
      continue;
    }

    const [angleCount] = await db
      .select({ value: count() })
      .from(roomTypeMedia)
      .where(eq(roomTypeMedia.roomTypeId, resolvedType.id));

    if (Number(angleCount?.value ?? 0) === 0) {
      await db.insert(roomTypeMedia).values(
        typeDef.angles.map((angle, index) => ({
          roomTypeId: resolvedType.id,
          url: angle.url,
          caption: angle.caption,
          sortOrder: index,
        })),
      );
    }

    for (let i = 1; i <= typeDef.roomCount; i += 1) {
      const label = `${typeDef.labelPrefix}${String(i).padStart(2, "0")}`;
      const [room] = await db
        .insert(rooms)
        .values({
          residenceId: existingResidence.id,
          roomTypeId: resolvedType.id,
          label,
          floor: 1,
          isActive: true,
        })
        .onConflictDoNothing({
          target: [rooms.residenceId, rooms.label],
        })
        .returning();

      const resolvedRoom =
        room ??
        (
          await db
            .select()
            .from(rooms)
            .where(
              and(
                eq(rooms.residenceId, existingResidence.id),
                eq(rooms.label, label),
              ),
            )
            .limit(1)
        )[0];

      if (!resolvedRoom) {
        continue;
      }

      const bedLabels = Array.from({ length: typeDef.capacity }, (_, idx) =>
        String.fromCharCode(65 + idx),
      );

      await db
        .insert(bedSpaces)
        .values(
          bedLabels.map((bedLabel) => ({
            roomId: resolvedRoom.id,
            label: bedLabel,
            status: "AVAILABLE" as const,
          })),
        )
        .onConflictDoNothing({
          target: [bedSpaces.roomId, bedSpaces.label],
        });
    }
  }

  for (const item of showcaseMedia) {
    const titles =
      item.title === "Reception"
        ? [item.title, "Secure entrance"]
        : [item.title];
    const urls =
      item.title === "Reception"
        ? [item.url, "/showcase/facility-gate.jpg"]
        : [item.url];
    const [existingMedia] = await db
      .select()
      .from(residenceMedia)
      .where(
        and(
          eq(residenceMedia.residenceId, existingResidence.id),
          or(
            inArray(residenceMedia.url, urls),
            inArray(residenceMedia.title, titles),
          ),
        ),
      )
      .limit(1);

    if (existingMedia) {
      continue;
    }

    await db.insert(residenceMedia).values({
      residenceId: existingResidence.id,
      kind: item.kind,
      title: item.title,
      description: item.description,
      url: item.url,
      caption: item.caption,
      sortOrder: item.sortOrder,
    });
  }

  console.log("Bootstrap seed complete (no overwrites of existing content).");
  console.log("Run `npm run db:seed:migrate` for incremental data migrations.");
  console.log("Demo logins (password: ChangeMe123!):");
  console.log("  admin@victorious.local");
  console.log("  manager@victorious.local");
  console.log("  staff@victorious.local");
  console.log("  resident@victorious.local");
}

seed()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
