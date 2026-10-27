import { and, eq, sql } from "drizzle-orm";

import { db } from "@/server/db";
import { bedSpaces, roomTypes, rooms } from "@/server/db/schema";

export async function getAvailableBedsByRoomType(residenceId?: string) {
  const conditions = [eq(roomTypes.isActive, true)];

  if (residenceId) {
    conditions.push(eq(roomTypes.residenceId, residenceId));
  }

  return db
    .select({
      id: roomTypes.id,
      name: roomTypes.name,
      capacity: roomTypes.capacity,
      pricePerBed: roomTypes.pricePerBed,
      description: roomTypes.description,
      sortOrder: roomTypes.sortOrder,
      availableBeds: sql<number>`count(${bedSpaces.id}) filter (where ${bedSpaces.status} = 'AVAILABLE')`.mapWith(
        Number,
      ),
      totalBeds: sql<number>`count(${bedSpaces.id})`.mapWith(Number),
    })
    .from(roomTypes)
    .innerJoin(
      rooms,
      and(eq(rooms.roomTypeId, roomTypes.id), eq(rooms.isActive, true)),
    )
    .innerJoin(bedSpaces, eq(bedSpaces.roomId, rooms.id))
    .where(and(...conditions))
    .groupBy(roomTypes.id)
    .orderBy(roomTypes.sortOrder);
}

export async function getOccupancyBoard(residenceId: string) {
  const rows = await db
    .select({
      roomId: rooms.id,
      roomLabel: rooms.label,
      floor: rooms.floor,
      roomTypeId: roomTypes.id,
      roomTypeName: roomTypes.name,
      bedId: bedSpaces.id,
      bedLabel: bedSpaces.label,
      bedStatus: bedSpaces.status,
    })
    .from(rooms)
    .innerJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
    .innerJoin(bedSpaces, eq(bedSpaces.roomId, rooms.id))
    .where(and(eq(rooms.residenceId, residenceId), eq(rooms.isActive, true)))
    .orderBy(rooms.label, bedSpaces.label);

  const byRoom = new Map<
    string,
    {
      roomId: string;
      roomLabel: string;
      floor: number | null;
      roomTypeId: string;
      roomTypeName: string;
      beds: Array<{
        id: string;
        label: string;
        status: (typeof rows)[number]["bedStatus"];
      }>;
    }
  >();

  for (const row of rows) {
    const existing = byRoom.get(row.roomId);
    const bed = {
      id: row.bedId,
      label: row.bedLabel,
      status: row.bedStatus,
    };

    if (existing) {
      existing.beds.push(bed);
      continue;
    }

    byRoom.set(row.roomId, {
      roomId: row.roomId,
      roomLabel: row.roomLabel,
      floor: row.floor,
      roomTypeId: row.roomTypeId,
      roomTypeName: row.roomTypeName,
      beds: [bed],
    });
  }

  return Array.from(byRoom.values());
}
