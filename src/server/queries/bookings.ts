import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/server/db";
import {
  bedSpaces,
  bookings,
  roomTypes,
  rooms,
} from "@/server/db/schema";

export async function getAvailableBedsForRoomType(roomTypeId: string) {
  return db
    .select({
      bedId: bedSpaces.id,
      bedLabel: bedSpaces.label,
      roomId: rooms.id,
      roomLabel: rooms.label,
      floor: rooms.floor,
      pricePerBed: roomTypes.pricePerBed,
      roomTypeName: roomTypes.name,
      residenceId: rooms.residenceId,
    })
    .from(bedSpaces)
    .innerJoin(rooms, eq(bedSpaces.roomId, rooms.id))
    .innerJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
    .where(
      and(
        eq(roomTypes.id, roomTypeId),
        eq(roomTypes.isActive, true),
        eq(rooms.isActive, true),
        eq(bedSpaces.status, "AVAILABLE"),
      ),
    )
    .orderBy(rooms.label, bedSpaces.label);
}

export async function getRoomTypeSummary(roomTypeId: string) {
  const [row] = await db
    .select({
      id: roomTypes.id,
      name: roomTypes.name,
      capacity: roomTypes.capacity,
      pricePerBed: roomTypes.pricePerBed,
      description: roomTypes.description,
      residenceId: roomTypes.residenceId,
      availableBeds: sql<number>`count(${bedSpaces.id}) filter (where ${bedSpaces.status} = 'AVAILABLE')`.mapWith(
        Number,
      ),
    })
    .from(roomTypes)
    .leftJoin(rooms, and(eq(rooms.roomTypeId, roomTypes.id), eq(rooms.isActive, true)))
    .leftJoin(bedSpaces, eq(bedSpaces.roomId, rooms.id))
    .where(and(eq(roomTypes.id, roomTypeId), eq(roomTypes.isActive, true)))
    .groupBy(roomTypes.id)
    .limit(1);

  return row ?? null;
}

export async function getResidentBookings(residentId: string) {
  return db
    .select({
      id: bookings.id,
      amount: bookings.amount,
      paymentStatus: bookings.paymentStatus,
      paymentReference: bookings.paymentReference,
      receiptUrl: bookings.receiptUrl,
      expiresAt: bookings.expiresAt,
      createdAt: bookings.createdAt,
      reviewedAt: bookings.reviewedAt,
      reviewNote: bookings.reviewNote,
      bedLabel: bedSpaces.label,
      bedStatus: bedSpaces.status,
      roomLabel: rooms.label,
      roomTypeName: roomTypes.name,
    })
    .from(bookings)
    .innerJoin(bedSpaces, eq(bookings.bedSpaceId, bedSpaces.id))
    .innerJoin(rooms, eq(bedSpaces.roomId, rooms.id))
    .innerJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
    .where(eq(bookings.residentId, residentId))
    .orderBy(desc(bookings.createdAt));
}

export async function getBookingForResident(
  bookingId: string,
  residentId: string,
) {
  const [row] = await db
    .select({
      id: bookings.id,
      amount: bookings.amount,
      paymentStatus: bookings.paymentStatus,
      paymentReference: bookings.paymentReference,
      receiptUrl: bookings.receiptUrl,
      expiresAt: bookings.expiresAt,
      createdAt: bookings.createdAt,
      reviewedAt: bookings.reviewedAt,
      reviewNote: bookings.reviewNote,
      residentId: bookings.residentId,
      bedSpaceId: bookings.bedSpaceId,
      bedLabel: bedSpaces.label,
      bedStatus: bedSpaces.status,
      roomLabel: rooms.label,
      roomTypeName: roomTypes.name,
      pricePerBed: roomTypes.pricePerBed,
    })
    .from(bookings)
    .innerJoin(bedSpaces, eq(bookings.bedSpaceId, bedSpaces.id))
    .innerJoin(rooms, eq(bedSpaces.roomId, rooms.id))
    .innerJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
    .where(
      and(eq(bookings.id, bookingId), eq(bookings.residentId, residentId)),
    )
    .limit(1);

  return row ?? null;
}
