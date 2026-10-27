import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { AdminNav } from "@/components/admin/admin-nav";
import { RoomTypeForm } from "@/components/admin/room-type-form";
import { PortalShell } from "@/components/portal-shell";
import { requireAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { roomTypes } from "@/server/db/schema";

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
      sortOrder: roomTypes.sortOrder,
      isActive: roomTypes.isActive,
    })
    .from(roomTypes)
    .where(eq(roomTypes.id, id))
    .limit(1);

  if (!roomType) {
    notFound();
  }

  return (
    <PortalShell
      title={`Edit · ${roomType.name}`}
      description="Update pricing, capacity for new rooms, or deactivate this type."
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <AdminNav currentPath="/admin/room-types" />
      <Link
        href="/admin/room-types"
        className="text-sm text-stone-500 hover:text-stone-800"
      >
        ← Back to room types
      </Link>
      <div className="max-w-xl">
        <RoomTypeForm mode="edit" roomType={roomType} />
      </div>
    </PortalShell>
  );
}
