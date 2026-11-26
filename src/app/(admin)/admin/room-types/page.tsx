import Link from "next/link";
import { eq } from "drizzle-orm";

import { ResidenceSwitcher } from "@/components/admin/residence-switcher";
import { RoomTypeForm } from "@/components/admin/room-type-form";
import { PortalShell } from "@/components/portal-shell";
import {
  listActiveResidences,
  resolveAdminWorkingResidenceId,
} from "@/server/admin-residence";
import { getNextRoomTypeSortOrder } from "@/server/actions/inventory";
import { requireAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { roomTypes } from "@/server/db/schema";

export const instant = false;

export default async function AdminRoomTypesPage() {
  const session = await requireAdmin("/admin/room-types");
  const residences = await listActiveResidences();
  const residenceId = await resolveAdminWorkingResidenceId();

  const types = residenceId
    ? await db
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
        .where(eq(roomTypes.residenceId, residenceId))
        .orderBy(roomTypes.sortOrder, roomTypes.name)
    : [];

  const nextSortOrder = residenceId
    ? await getNextRoomTypeSortOrder(residenceId)
    : 1;

  const workingName =
    residences.find((row) => row.id === residenceId)?.name ?? null;

  return (
    <PortalShell
      title="Room types"
      description="Create and edit flexible room layouts used for provisioning."
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <ResidenceSwitcher residences={residences} selectedId={residenceId} />
      {workingName ? (
        <p className="text-sm text-stone-600">
          Showing types for <strong>{workingName}</strong>.
        </p>
      ) : null}

      {!residenceId ? (
        <p className="text-sm text-stone-600">
          Create a residence first, then add room types for that campus.
        </p>
      ) : (
        <section className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-lg font-medium text-stone-900">Create type</h2>
            <RoomTypeForm
              mode="create"
              residenceId={residenceId}
              defaultSortOrder={nextSortOrder}
            />
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
      )}
    </PortalShell>
  );
}
