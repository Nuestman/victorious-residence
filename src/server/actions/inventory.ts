"use server";

import { and, eq, inArray, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { bedLabelsForCapacity, formatRoomLabel } from "@/lib/bed-labels";
import { parseAmenities, parseMediaUrl } from "@/lib/media-url";
import { revalidatePublicShowcase } from "@/server/revalidate-public";
import { getResidenceById } from "@/server/admin-residence";
import { requireAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import {
  auditLogs,
  bedSpaces,
  roomTypeMedia,
  rooms,
  roomTypes,
} from "@/server/db/schema";

export type InventoryActionState = {
  error?: string;
  success?: string;
};

const moneySchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount (e.g. 1800 or 1800.00)");

const roomTypeFieldsSchema = z.object({
  name: z.string().trim().min(2).max(80),
  capacity: z.coerce.number().int().min(1).max(26),
  pricePerBed: moneySchema,
  description: z.string().trim().max(2000).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  amenities: z.string().trim().max(500).optional(),
  coverImageUrl: z.string().trim().max(500).optional(),
});

async function writeAudit(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
) {
  await db.insert(auditLogs).values({
    actorId,
    action,
    entityType,
    entityId,
    metadata,
  });
}

function revalidateInventoryPaths(roomTypeId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/room-types");
  revalidatePath("/admin/provision");
  revalidatePath("/admin/occupancy");
  revalidatePath("/resident");
  revalidatePath("/manager");
  revalidatePublicShowcase(roomTypeId);
}

function readCover(formData: FormData) {
  const cover = parseMediaUrl(formData.get("coverImageUrl"));
  if (cover === "invalid") {
    return {
      error: "Cover image must be a site path starting with / or an http(s) URL.",
    } as const;
  }
  return { coverImageUrl: cover } as const;
}

function readGallery(formData: FormData) {
  const urls = formData.getAll("galleryUrl");
  const captions = formData.getAll("galleryCaption");
  const rows: Array<{ url: string; caption: string | null; sortOrder: number }> =
    [];

  for (let index = 0; index < urls.length; index += 1) {
    const url = parseMediaUrl(urls[index]);
    if (url === "invalid") {
      return {
        error:
          "Room photo URLs must be a site path starting with / or an http(s) URL.",
      } as const;
    }
    if (!url) {
      continue;
    }
    const caption = String(captions[index] ?? "").trim();
    rows.push({
      url,
      caption: caption.length > 0 ? caption : null,
      sortOrder: rows.length,
    });
  }

  if (rows.length > 8) {
    return { error: "Add at most 8 room photos." } as const;
  }

  return { rows } as const;
}

export async function createRoomTypeAction(
  _prev: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const session = await requireAdmin();

  const parsed = roomTypeFieldsSchema
    .extend({ residenceId: z.string().uuid() })
    .safeParse({
      name: formData.get("name"),
      capacity: formData.get("capacity"),
      pricePerBed: formData.get("pricePerBed"),
      description: formData.get("description") || undefined,
      sortOrder: formData.get("sortOrder") || 0,
      amenities: formData.get("amenities") || undefined,
      coverImageUrl: formData.get("coverImageUrl") || undefined,
      residenceId: formData.get("residenceId"),
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid room type." };
  }

  const cover = readCover(formData);
  if ("error" in cover) {
    return { error: cover.error };
  }

  const residence = await getResidenceById(parsed.data.residenceId);
  if (!residence || !residence.isActive) {
    return { error: "Select an active residence before creating room types." };
  }

  try {
    const [created] = await db
      .insert(roomTypes)
      .values({
        residenceId: residence.id,
        name: parsed.data.name,
        capacity: parsed.data.capacity,
        pricePerBed: parsed.data.pricePerBed,
        description: parsed.data.description || null,
        amenities: parseAmenities(parsed.data.amenities),
        coverImageUrl: cover.coverImageUrl,
        sortOrder: parsed.data.sortOrder,
        isActive: true,
      })
      .returning({ id: roomTypes.id });

    await writeAudit(
      session.user.id,
      "room_type.create",
      "room_type",
      created.id,
      parsed.data,
    );

    revalidateInventoryPaths();
    return { success: `Created room type “${parsed.data.name}”.` };
  } catch {
    return {
      error:
        "Could not create room type. The name may already exist for this residence.",
    };
  }
}

export async function updateRoomTypeAction(
  _prev: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const session = await requireAdmin();

  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) {
    return { error: "Invalid room type id." };
  }

  const parsed = roomTypeFieldsSchema
    .extend({
      isActive: z
        .enum(["true", "false"])
        .transform((value) => value === "true"),
    })
    .safeParse({
      name: formData.get("name"),
      capacity: formData.get("capacity"),
      pricePerBed: formData.get("pricePerBed"),
      description: formData.get("description") || undefined,
      sortOrder: formData.get("sortOrder") || 0,
      amenities: formData.get("amenities") || undefined,
      coverImageUrl: formData.get("coverImageUrl") || undefined,
      isActive: formData.get("isActive") ?? "true",
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid room type." };
  }

  const cover = readCover(formData);
  if ("error" in cover) {
    return { error: cover.error };
  }

  const gallery = readGallery(formData);
  if ("error" in gallery) {
    return { error: gallery.error };
  }

  try {
    const [updated] = await db
      .update(roomTypes)
      .set({
        name: parsed.data.name,
        capacity: parsed.data.capacity,
        pricePerBed: parsed.data.pricePerBed,
        description: parsed.data.description || null,
        amenities: parseAmenities(parsed.data.amenities),
        coverImageUrl: cover.coverImageUrl,
        sortOrder: parsed.data.sortOrder,
        isActive: parsed.data.isActive,
      })
      .where(eq(roomTypes.id, id.data))
      .returning({ id: roomTypes.id, name: roomTypes.name });

    if (!updated) {
      return { error: "Room type not found." };
    }

    await db
      .delete(roomTypeMedia)
      .where(eq(roomTypeMedia.roomTypeId, updated.id));

    if (gallery.rows.length > 0) {
      await db.insert(roomTypeMedia).values(
        gallery.rows.map((row) => ({
          roomTypeId: updated.id,
          url: row.url,
          caption: row.caption,
          sortOrder: row.sortOrder,
        })),
      );
    }

    await writeAudit(
      session.user.id,
      "room_type.update",
      "room_type",
      updated.id,
      parsed.data,
    );

    revalidateInventoryPaths(updated.id);
    return { success: `Updated “${updated.name}”.` };
  } catch {
    return {
      error:
        "Could not update room type. The name may already exist for this residence.",
    };
  }
}

const provisionSchema = z.object({
  roomTypeId: z.string().uuid(),
  count: z.coerce.number().int().min(1).max(50),
  labelPrefix: z
    .string()
    .trim()
    .min(1)
    .max(8)
    .regex(/^[A-Za-z0-9-]+$/, "Prefix may only include letters, numbers, and -"),
  startNumber: z.coerce.number().int().min(1).max(9999),
  floor: z.coerce.number().int().min(0).max(100).optional(),
});

export async function provisionRoomsAction(
  _prev: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const session = await requireAdmin();

  const floorRaw = formData.get("floor");
  const parsed = provisionSchema.safeParse({
    roomTypeId: formData.get("roomTypeId"),
    count: formData.get("count"),
    labelPrefix: formData.get("labelPrefix"),
    startNumber: formData.get("startNumber"),
    floor:
      floorRaw === null || floorRaw === "" ? undefined : Number(floorRaw),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid provision." };
  }

  const [roomType] = await db
    .select()
    .from(roomTypes)
    .where(eq(roomTypes.id, parsed.data.roomTypeId))
    .limit(1);

  if (!roomType || !roomType.isActive) {
    return { error: "Select an active room type." };
  }

  const labels = Array.from({ length: parsed.data.count }, (_, index) =>
    formatRoomLabel(
      parsed.data.labelPrefix,
      parsed.data.startNumber + index,
    ),
  );

  const collisions = await db
    .select({ label: rooms.label })
    .from(rooms)
    .where(
      and(
        eq(rooms.residenceId, roomType.residenceId),
        inArray(rooms.label, labels),
      ),
    )
    .limit(1);

  if (collisions[0]) {
    return {
      error: `Room label “${collisions[0].label}” already exists. Choose a different prefix or start number.`,
    };
  }

  const bedLabels = bedLabelsForCapacity(roomType.capacity);
  const createdRoomIds: string[] = [];

  try {
    for (const label of labels) {
      const [room] = await db
        .insert(rooms)
        .values({
          residenceId: roomType.residenceId,
          roomTypeId: roomType.id,
          label,
          floor: parsed.data.floor ?? null,
          isActive: true,
        })
        .returning({ id: rooms.id });

      createdRoomIds.push(room.id);

      await db.insert(bedSpaces).values(
        bedLabels.map((bedLabel) => ({
          roomId: room.id,
          label: bedLabel,
          status: "AVAILABLE" as const,
        })),
      );
    }

    await writeAudit(
      session.user.id,
      "rooms.provision",
      "room_type",
      roomType.id,
      {
        count: parsed.data.count,
        labels,
        bedsPerRoom: roomType.capacity,
        totalBeds: parsed.data.count * roomType.capacity,
      },
    );

    revalidateInventoryPaths();
    return {
      success: `Provisioned ${parsed.data.count} room(s) (${labels[0]}–${labels[labels.length - 1]}) with ${roomType.capacity} bed(s) each.`,
    };
  } catch (error) {
    console.error(error);
    return {
      error:
        "Provisioning failed partway through. Check occupancy and retry with unused labels.",
    };
  }
}

export async function getNextSuggestedStartNumber(
  residenceId: string,
  labelPrefix: string,
) {
  const prefix = labelPrefix.trim().toUpperCase();
  const existingLabels = await db
    .select({ label: rooms.label })
    .from(rooms)
    .where(eq(rooms.residenceId, residenceId));

  let highest = 0;
  for (const row of existingLabels) {
    if (!row.label.startsWith(prefix)) {
      continue;
    }
    const suffix = row.label.slice(prefix.length);
    const asNumber = Number(suffix);
    if (Number.isInteger(asNumber) && asNumber > highest) {
      highest = asNumber;
    }
  }

  return highest + 1;
}

/** Exported for forms that want a default sort order suggestion. */
export async function getNextRoomTypeSortOrder(residenceId: string) {
  const [row] = await db
    .select({ value: max(roomTypes.sortOrder) })
    .from(roomTypes)
    .where(eq(roomTypes.residenceId, residenceId));

  return (row?.value ?? 0) + 1;
}
