import { config } from "dotenv";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";

config({ path: ".env.local" });
config({ path: ".env" });

async function seed() {
  const { db } = await import("./index");
  const {
    bedSpaces,
    residences,
    rooms,
    roomTypes,
    users,
  } = await import("./schema");

  console.log("Seeding Victorious Residence…");

  const [residence] = await db
    .insert(residences)
    .values({
      name: "Victorious Residence",
      slug: "victorious-residence",
      address: "Obuasi, Ghana",
      description:
        "Student and worker hostel with flexible room types and digitized bed allocation.",
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
    ])
    .onConflictDoNothing({ target: users.email });

  const typeDefs = [
    {
      name: "Executive Single",
      capacity: 1,
      pricePerBed: "2500.00",
      description: "Private room, one bed.",
      sortOrder: 1,
      roomCount: 2,
      labelPrefix: "S",
    },
    {
      name: "Standard 2-in-1",
      capacity: 2,
      pricePerBed: "1800.00",
      description: "Shared room with two bed spaces.",
      sortOrder: 2,
      roomCount: 4,
      labelPrefix: "D",
    },
    {
      name: "Economy 4-in-1",
      capacity: 4,
      pricePerBed: "1200.00",
      description: "Shared room with four bed spaces.",
      sortOrder: 3,
      roomCount: 3,
      labelPrefix: "Q",
    },
  ] as const;

  for (const typeDef of typeDefs) {
    const [roomType] = await db
      .insert(roomTypes)
      .values({
        residenceId: existingResidence.id,
        name: typeDef.name,
        capacity: typeDef.capacity,
        pricePerBed: typeDef.pricePerBed,
        description: typeDef.description,
        amenities: ["Wi-Fi", "Shared kitchen", "Security"],
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
          .where(eq(roomTypes.name, typeDef.name))
          .limit(1)
      )[0];

    if (!resolvedType) {
      continue;
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
            .where(eq(rooms.label, label))
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

  console.log("Seed complete.");
  console.log("Demo logins (password: ChangeMe123!):");
  console.log("  admin@victorious.local");
  console.log("  manager@victorious.local");
  console.log("  resident@victorious.local");
}

seed()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
