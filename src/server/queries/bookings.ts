import { and, asc, desc, eq, isNotNull, sql } from "drizzle-orm";

import { db } from "@/server/db";
import { duringRequest } from "@/server/db/request";
import {
  bedSpaces,
  bookings,
  roomTypes,
  rooms,
  users,
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
      amenities: roomTypes.amenities,
      coverImageUrl: roomTypes.coverImageUrl,
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
      amountPaid: bookings.amountPaid,
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
      amountPaid: bookings.amountPaid,
      paymentStatus: bookings.paymentStatus,
      paymentReference: bookings.paymentReference,
      receiptUrl: bookings.receiptUrl,
      expiresAt: bookings.expiresAt,
      createdAt: bookings.createdAt,
      reviewedAt: bookings.reviewedAt,
      reviewNote: bookings.reviewNote,
      residentId: bookings.residentId,
      bedSpaceId: bookings.bedSpaceId,
      residenceId: bookings.residenceId,
      bedLabel: bedSpaces.label,
      bedStatus: bedSpaces.status,
      roomLabel: rooms.label,
      roomTypeId: roomTypes.id,
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

/** Available beds in a residence for cancel/upgrade room moves. */
export async function getUpgradeBedOptions(
  residenceId: string,
  excludeBedSpaceId?: string,
) {
  const rows = await db
    .select({
      bedId: bedSpaces.id,
      bedLabel: bedSpaces.label,
      roomLabel: rooms.label,
      roomTypeId: roomTypes.id,
      roomTypeName: roomTypes.name,
      capacity: roomTypes.capacity,
      pricePerBed: roomTypes.pricePerBed,
    })
    .from(bedSpaces)
    .innerJoin(rooms, eq(bedSpaces.roomId, rooms.id))
    .innerJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
    .where(
      and(
        eq(rooms.residenceId, residenceId),
        eq(roomTypes.isActive, true),
        eq(rooms.isActive, true),
        eq(bedSpaces.status, "AVAILABLE"),
      ),
    )
    .orderBy(roomTypes.sortOrder, rooms.label, bedSpaces.label);

  if (!excludeBedSpaceId) {
    return rows;
  }

  return rows.filter((row) => row.bedId !== excludeBedSpaceId);
}

const managerBookingSelect = {
  id: bookings.id,
  amount: bookings.amount,
  amountPaid: bookings.amountPaid,
  paymentStatus: bookings.paymentStatus,
  paymentReference: bookings.paymentReference,
  receiptUrl: bookings.receiptUrl,
  expiresAt: bookings.expiresAt,
  createdAt: bookings.createdAt,
  reviewedAt: bookings.reviewedAt,
  reviewNote: bookings.reviewNote,
  residentId: bookings.residentId,
  bedSpaceId: bookings.bedSpaceId,
  residenceId: bookings.residenceId,
  bedLabel: bedSpaces.label,
  bedStatus: bedSpaces.status,
  roomLabel: rooms.label,
  roomTypeId: roomTypes.id,
  roomTypeName: roomTypes.name,
  residentName: users.fullName,
  residentEmail: users.email,
  residentPhone: users.phone,
};

export async function getManagerReviewQueue(options?: {
  onlyWithProof?: boolean;
}) {
  await duringRequest();
  const conditions = [eq(bookings.paymentStatus, "PENDING")];

  if (options?.onlyWithProof) {
    conditions.push(isNotNull(bookings.receiptUrl));
    conditions.push(isNotNull(bookings.paymentReference));
  }

  return db
    .select(managerBookingSelect)
    .from(bookings)
    .innerJoin(bedSpaces, eq(bookings.bedSpaceId, bedSpaces.id))
    .innerJoin(rooms, eq(bedSpaces.roomId, rooms.id))
    .innerJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
    .innerJoin(users, eq(bookings.residentId, users.id))
    .where(and(...conditions))
    .orderBy(
      sql`case when ${bookings.receiptUrl} is null then 1 else 0 end`,
      asc(bookings.expiresAt),
    );
}

export async function getManagerBooking(bookingId: string) {
  const [row] = await db
    .select(managerBookingSelect)
    .from(bookings)
    .innerJoin(bedSpaces, eq(bookings.bedSpaceId, bedSpaces.id))
    .innerJoin(rooms, eq(bedSpaces.roomId, rooms.id))
    .innerJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
    .innerJoin(users, eq(bookings.residentId, users.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  return row ?? null;
}

export async function getRecentReviewedBookings(limit = 10) {
  await duringRequest();
  return db
    .select(managerBookingSelect)
    .from(bookings)
    .innerJoin(bedSpaces, eq(bookings.bedSpaceId, bedSpaces.id))
    .innerJoin(rooms, eq(bedSpaces.roomId, rooms.id))
    .innerJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
    .innerJoin(users, eq(bookings.residentId, users.id))
    .where(sql`${bookings.paymentStatus} in ('SUCCESS', 'FAILED')`)
    .orderBy(desc(bookings.reviewedAt), desc(bookings.updatedAt))
    .limit(limit);
}
