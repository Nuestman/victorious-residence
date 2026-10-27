import Link from "next/link";
import { asc, eq } from "drizzle-orm";

import { AdminNav } from "@/components/admin/admin-nav";
import { RoomTypeForm } from "@/components/admin/room-type-form";
import { PortalShell } from "@/components/portal-shell";
import { requireAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { residences, roomTypes } from "@/server/db/schema";
import { getNextRoomTypeSortOrder } from "@/server/actions/inventory";

export const instant = false;

export default async function AdminRoomTypesPage() {
  const session = await requireAdmin("/admin/room-types");

  const [residence] = await db
    .select({ id: residences.id })
    .from(residences)
    .where(eq(residences.isActive, true))
    .orderBy(asc(residences.createdAt))
    .limit(1);

  const types = await db
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
    .where(
      residence
        ? eq(roomTypes.residenceId, residence.id)
        : eq(roomTypes.isActive, true),
    )
    .orderBy(roomTypes.sortOrder, roomTypes.name);

  const nextSortOrder = residence
    ? await getNextRoomTypeSortOrder(residence.id)
    : 1;

  return (
    <PortalShell
      title="Room types"
      description="Create and edit flexible room layouts used for provisioning."
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <AdminNav currentPath="/admin/room-types" />

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-stone-900">Create type</h2>
          <RoomTypeForm mode="create" defaultSortOrder={nextSortOrder} />
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-medium text-stone-900">Existing types</h2>
          <ul className="divide-y divide-stone-200 border border-stone-200">
            {types.map((type) => (
              <li
                key={type.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-stone-900">{type.name}</p>
                  <p className="text-sm text-stone-500">
                    {type.capacity}-in-1 · GHS {type.pricePerBed} / bed ·{" "}
                    {type.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
                <Link
                  href={`/admin/room-types/${type.id}`}
                  className="text-sm font-medium text-stone-800 underline"
                >
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </PortalShell>
  );
}
