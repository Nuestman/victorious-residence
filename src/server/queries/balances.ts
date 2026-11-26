import { and, asc, desc, eq, ne, or, sql } from "drizzle-orm";

import { db } from "@/server/db";
import { duringRequest } from "@/server/db/request";
import {
  bedSpaces,
  bookings,
  rooms,
  roomTypes,
  users,
} from "@/server/db/schema";

/**
 * Active bookings with money still owed (unpaid applications or partial deposits).
 * Excludes FAILED and fully paid rows.
 */
export async function listOutstandingBalances(options?: {
  residenceId?: string | null;
}) {
  await duringRequest();

  const conditions = [
    or(
      eq(bookings.paymentStatus, "PENDING"),
      eq(bookings.paymentStatus, "SUCCESS"),
    ),
    sql`coalesce((${bookings.amountPaid})::numeric, 0) < (${bookings.amount})::numeric`,
  ];

  if (options?.residenceId) {
    conditions.push(eq(bookings.residenceId, options.residenceId));
  }

  return db
    .select({
      id: bookings.id,
      amount: bookings.amount,
      amountPaid: bookings.amountPaid,
      paymentStatus: bookings.paymentStatus,
      paymentReference: bookings.paymentReference,
      reviewedAt: bookings.reviewedAt,
      createdAt: bookings.createdAt,
      residentId: bookings.residentId,
      residentName: users.fullName,
      residentEmail: users.email,
      residentPhone: users.phone,
      bedLabel: bedSpaces.label,
      bedStatus: bedSpaces.status,
      roomLabel: rooms.label,
      roomTypeName: roomTypes.name,
    })
    .from(bookings)
    .innerJoin(users, eq(bookings.residentId, users.id))
    .innerJoin(bedSpaces, eq(bookings.bedSpaceId, bedSpaces.id))
    .innerJoin(rooms, eq(bedSpaces.roomId, rooms.id))
    .innerJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
    .where(and(...conditions))
    .orderBy(desc(bookings.updatedAt), asc(users.fullName));
}

export async function getBookingForReminder(bookingId: string) {
  await duringRequest();

  const [row] = await db
    .select({
      id: bookings.id,
      amount: bookings.amount,
      amountPaid: bookings.amountPaid,
      paymentStatus: bookings.paymentStatus,
      residenceId: bookings.residenceId,
      residentId: bookings.residentId,
      residentName: users.fullName,
      residentEmail: users.email,
      bedLabel: bedSpaces.label,
      roomLabel: rooms.label,
      roomTypeName: roomTypes.name,
    })
    .from(bookings)
    .innerJoin(users, eq(bookings.residentId, users.id))
    .innerJoin(bedSpaces, eq(bookings.bedSpaceId, bedSpaces.id))
    .innerJoin(rooms, eq(bedSpaces.roomId, rooms.id))
    .innerJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
    .where(
      and(
        eq(bookings.id, bookingId),
        ne(bookings.paymentStatus, "FAILED"),
      ),
    )
    .limit(1);

  return row ?? null;
}
