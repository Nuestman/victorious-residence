import { and, asc, eq, sql } from "drizzle-orm";
import { cache } from "react";

import { duringRequest } from "@/server/db/request";
import { db } from "@/server/db";
import {
  bedSpaces,
  residenceMedia,
  residences,
  roomTypeMedia,
  roomTypes,
  rooms,
} from "@/server/db/schema";
import { getAvailableBedsByRoomType } from "@/server/queries/availability";

const publicSlug = "victorious-residence";

export const getPublicShowcase = cache(async () => {
  await duringRequest();

  const [preferred] = await db
    .select()
    .from(residences)
    .where(and(eq(residences.slug, publicSlug), eq(residences.isActive, true)))
    .limit(1);

  const residence =
    preferred ??
    (
      await db
        .select()
        .from(residences)
        .where(eq(residences.isActive, true))
        .orderBy(asc(residences.createdAt))
        .limit(1)
    )[0];

  if (!residence) {
    return null;
  }

  const media = await db
    .select({
      id: residenceMedia.id,
      kind: residenceMedia.kind,
      title: residenceMedia.title,
      description: residenceMedia.description,
      url: residenceMedia.url,
      caption: residenceMedia.caption,
      sortOrder: residenceMedia.sortOrder,
    })
    .from(residenceMedia)
    .where(eq(residenceMedia.residenceId, residence.id))
    .orderBy(asc(residenceMedia.sortOrder), asc(residenceMedia.createdAt));

  const roomTypeRows = await getAvailableBedsByRoomType(residence.id);

  return {
    residence,
    exterior: media.filter((item) => item.kind === "EXTERIOR"),
    facilities: media.filter((item) => item.kind === "FACILITY"),
    media,
    roomTypes: roomTypeRows,
  };
});

export async function getPublicRoomType(roomTypeId: string) {
  await duringRequest();
  const showcase = await getPublicShowcase();
  if (!showcase) {
    return null;
  }

  const [row] = await db
    .select({
      id: roomTypes.id,
      name: roomTypes.name,
      capacity: roomTypes.capacity,
      pricePerBed: roomTypes.pricePerBed,
      description: roomTypes.description,
      amenities: roomTypes.amenities,
      coverImageUrl: roomTypes.coverImageUrl,
      availableBeds: sql<number>`count(${bedSpaces.id}) filter (where ${bedSpaces.status} = 'AVAILABLE')`.mapWith(
        Number,
      ),
    })
    .from(roomTypes)
    .leftJoin(
      rooms,
      and(eq(rooms.roomTypeId, roomTypes.id), eq(rooms.isActive, true)),
    )
    .leftJoin(bedSpaces, eq(bedSpaces.roomId, rooms.id))
    .where(
      and(
        eq(roomTypes.id, roomTypeId),
        eq(roomTypes.residenceId, showcase.residence.id),
        eq(roomTypes.isActive, true),
      ),
    )
    .groupBy(roomTypes.id)
    .limit(1);

  if (!row) {
    return null;
  }

  const angles = await listRoomTypeAngles(roomTypeId);

  return {
    ...row,
    amenities: row.amenities ?? [],
    angles,
    residenceName: showcase.residence.name,
  };
}

export async function listRoomTypeAngles(roomTypeId: string) {
  await duringRequest();
  return db
    .select({
      id: roomTypeMedia.id,
      url: roomTypeMedia.url,
      caption: roomTypeMedia.caption,
      sortOrder: roomTypeMedia.sortOrder,
    })
    .from(roomTypeMedia)
    .where(eq(roomTypeMedia.roomTypeId, roomTypeId))
    .orderBy(asc(roomTypeMedia.sortOrder));
}
