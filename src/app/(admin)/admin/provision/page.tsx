import { asc, eq } from "drizzle-orm";

import { AdminNav } from "@/components/admin/admin-nav";
import { ProvisionRoomsForm } from "@/components/admin/provision-rooms-form";
import { PortalShell } from "@/components/portal-shell";
import { requireAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { roomTypes } from "@/server/db/schema";

export const instant = false;

export default async function AdminProvisionPage() {
  const session = await requireAdmin("/admin/provision");

  const types = await db
    .select({
      id: roomTypes.id,
      name: roomTypes.name,
      capacity: roomTypes.capacity,
      pricePerBed: roomTypes.pricePerBed,
    })
    .from(roomTypes)
    .where(eq(roomTypes.isActive, true))
    .orderBy(asc(roomTypes.sortOrder), asc(roomTypes.name));

  return (
    <PortalShell
      title="Provision rooms"
      description="Create physical rooms and auto-generate bed spaces from a room type’s capacity."
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <AdminNav currentPath="/admin/provision" />
      <div className="max-w-3xl">
        <ProvisionRoomsForm roomTypes={types} />
      </div>
    </PortalShell>
  );
}
