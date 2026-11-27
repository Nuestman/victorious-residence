import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { RoomTypeForm } from "@/components/admin/room-type-form";
import { PortalShell } from "@/components/portal-shell";
import { requireAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { roomTypes } from "@/server/db/schema";
import { listRoomTypeAngles } from "@/server/queries/showcase";

export const instant = false;

type EditRoomTypePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditRoomTypePage({
  params,
}: EditRoomTypePageProps) {
  const { id } = await params;
  const session = await requireAdmin(`/admin/room-types/${id}`);

  const [roomType] = await db
    .select({
      id: roomTypes.id,
      name: roomTypes.name,
      capacity: roomTypes.capacity,
      pricePerBed: roomTypes.pricePerBed,
      description: roomTypes.description,
      amenities: roomTypes.amenities,
      coverImageUrl: roomTypes.coverImageUrl,
      sortOrder: roomTypes.sortOrder,
      isActive: roomTypes.isActive,
    })
    .from(roomTypes)
    .where(eq(roomTypes.id, id))
    .limit(1);

  if (!roomType) {
    notFound();
  }

  const gallery = await listRoomTypeAngles(roomType.id);

  return (
    <PortalShell
      title={`Edit · ${roomType.name}`}
      description="Update pricing, photos, amenities, or deactivate this type."
      userId={session.user.id}
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <Link
        href="/admin/room-types"
        className="text-sm text-forest"
      >
        Back to room types
      </Link>
      <div className="max-w-xl">
        <RoomTypeForm
          mode="edit"
          roomType={{
            ...roomType,
            amenities: roomType.amenities ?? [],
            gallery: gallery.map((image) => ({
              url: image.url,
              caption: image.caption,
            })),
          }}
        />
      </div>
    </PortalShell>
  );
}
