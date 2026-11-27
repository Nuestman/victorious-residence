import { and, asc, eq } from "drizzle-orm";

import { ProvisionRoomsForm } from "@/components/admin/provision-rooms-form";
import { ResidenceSwitcher } from "@/components/admin/residence-switcher";
import { PortalShell } from "@/components/portal-shell";
import {
  listActiveResidences,
  resolveAdminWorkingResidenceId,
} from "@/server/admin-residence";
import { requireAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { roomTypes } from "@/server/db/schema";

export const instant = false;

export default async function AdminProvisionPage() {
  const session = await requireAdmin("/admin/provision");
  const residences = await listActiveResidences();
  const residenceId = await resolveAdminWorkingResidenceId();

  const types = residenceId
    ? await db
        .select({
          id: roomTypes.id,
          name: roomTypes.name,
          capacity: roomTypes.capacity,
          pricePerBed: roomTypes.pricePerBed,
        })
        .from(roomTypes)
        .where(
          and(
            eq(roomTypes.isActive, true),
            eq(roomTypes.residenceId, residenceId),
          ),
        )
        .orderBy(asc(roomTypes.sortOrder), asc(roomTypes.name))
    : [];

  const workingName =
    residences.find((row) => row.id === residenceId)?.name ?? null;

  return (
    <PortalShell
      title="Provision rooms"
      description="Create physical rooms and auto-generate bed spaces from a room type’s capacity."
      userId={session.user.id}
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <ResidenceSwitcher residences={residences} selectedId={residenceId} />
      {workingName ? (
        <p className="text-sm text-stone-600">
          Provisioning into <strong>{workingName}</strong>.
        </p>
      ) : null}
      <div className="max-w-3xl">
        <ProvisionRoomsForm roomTypes={types} />
      </div>
    </PortalShell>
  );
}
