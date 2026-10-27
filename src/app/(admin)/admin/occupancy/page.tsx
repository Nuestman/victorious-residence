import { AdminNav } from "@/components/admin/admin-nav";
import { OccupancyBoard } from "@/components/admin/occupancy-board";
import { PortalShell } from "@/components/portal-shell";
import { requireAdmin } from "@/server/auth/guards";
import { getOccupancyBoard } from "@/server/queries/availability";

export const instant = false;

export default async function AdminOccupancyPage() {
  const session = await requireAdmin("/admin/occupancy");

  if (!session.user.residenceId) {
    return (
      <PortalShell
        title="Occupancy"
        description="Room → bed matrix for the residence."
        userName={session.user.name}
        userEmail={session.user.email}
        role={session.user.role}
      >
        <AdminNav currentPath="/admin/occupancy" />
        <p className="text-sm text-stone-600">
          Your admin user is not linked to a residence. Re-seed or assign{" "}
          <code>residenceId</code> on the user record.
        </p>
      </PortalShell>
    );
  }

  const rooms = await getOccupancyBoard(session.user.residenceId);

  return (
    <PortalShell
      title="Occupancy"
      description="Live room → bed matrix across the residence."
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <AdminNav currentPath="/admin/occupancy" />
      <OccupancyBoard rooms={rooms} />
    </PortalShell>
  );
}
