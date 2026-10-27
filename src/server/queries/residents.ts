import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/server/db";
import {
  bedSpaces,
  bookings,
  rooms,
  roomTypes,
  users,
} from "@/server/db/schema";
import { getResidentBookings } from "@/server/queries/bookings";

export async function listResidents(residenceId?: string | null) {
  const conditions = [eq(users.role, "RESIDENT")];
  if (residenceId) {
    conditions.push(eq(users.residenceId, residenceId));
  }

  return db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      phone: users.phone,
      createdAt: users.createdAt,
      bookingCount: sql<number>`count(${bookings.id})`.mapWith(Number),
      pendingCount: sql<number>`count(${bookings.id}) filter (where ${bookings.paymentStatus} = 'PENDING')`.mapWith(
        Number,
      ),
      approvedCount: sql<number>`count(${bookings.id}) filter (where ${bookings.paymentStatus} = 'SUCCESS')`.mapWith(
        Number,
      ),
      occupiedBed: sql<string | null>`max(case when ${bookings.paymentStatus} = 'SUCCESS' and ${bedSpaces.status} = 'OCCUPIED' then ${rooms.label} || '-' || ${bedSpaces.label} else null end)`,
    })
    .from(users)
    .leftJoin(bookings, eq(bookings.residentId, users.id))
    .leftJoin(bedSpaces, eq(bookings.bedSpaceId, bedSpaces.id))
    .leftJoin(rooms, eq(bedSpaces.roomId, rooms.id))
    .where(and(...conditions))
    .groupBy(users.id)
    .orderBy(asc(users.fullName));
}

export async function getResidentProfile(residentId: string) {
  const [resident] = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      phone: users.phone,
      role: users.role,
      residenceId: users.residenceId,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(and(eq(users.id, residentId), eq(users.role, "RESIDENT")))
    .limit(1);

  if (!resident) {
    return null;
  }

  const bookingHistory = await getResidentBookings(residentId);

  const activeAllocation = await db
    .select({
      bookingId: bookings.id,
      amount: bookings.amount,
      roomLabel: rooms.label,
      bedLabel: bedSpaces.label,
      roomTypeName: roomTypes.name,
      reviewedAt: bookings.reviewedAt,
    })
    .from(bookings)
    .innerJoin(bedSpaces, eq(bookings.bedSpaceId, bedSpaces.id))
    .innerJoin(rooms, eq(bedSpaces.roomId, rooms.id))
    .innerJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
    .where(
      and(
        eq(bookings.residentId, residentId),
        eq(bookings.paymentStatus, "SUCCESS"),
        eq(bedSpaces.status, "OCCUPIED"),
      ),
    )
    .orderBy(desc(bookings.reviewedAt))
    .limit(1);

  return {
    resident,
    bookingHistory,
    activeAllocation: activeAllocation[0] ?? null,
  };
}
