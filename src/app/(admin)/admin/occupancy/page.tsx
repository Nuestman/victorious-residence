import { OccupancyBoard } from "@/components/admin/occupancy-board";
import { ResidenceSwitcher } from "@/components/admin/residence-switcher";
import { PortalShell } from "@/components/portal-shell";
import {
  listActiveResidences,
  resolveAdminWorkingResidenceId,
} from "@/server/admin-residence";
import { requireAdmin } from "@/server/auth/guards";
import { getOccupancyBoard } from "@/server/queries/availability";

export const instant = false;

export default async function AdminOccupancyPage() {
  const session = await requireAdmin("/admin/occupancy");
  const residences = await listActiveResidences();
  const residenceId = await resolveAdminWorkingResidenceId();
  const rooms = residenceId ? await getOccupancyBoard(residenceId) : [];
  const workingName =
    residences.find((row) => row.id === residenceId)?.name ?? null;

  return (
    <PortalShell
      title="Occupancy"
      description="Live room → bed matrix for the selected campus."
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <ResidenceSwitcher residences={residences} selectedId={residenceId} />
      {workingName ? (
        <p className="text-sm text-stone-600">
          Showing occupancy for <strong>{workingName}</strong>.
        </p>
      ) : (
        <p className="text-sm text-stone-600">
          Create or activate a residence to view occupancy.
        </p>
      )}
      {residenceId ? <OccupancyBoard rooms={rooms} /> : null}
    </PortalShell>
  );
}
