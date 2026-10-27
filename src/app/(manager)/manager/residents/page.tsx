import { ManagerNav } from "@/components/manager/manager-nav";
import { PortalShell } from "@/components/portal-shell";
import { ResidentsList } from "@/components/staff/residents-list";
import { requireRole } from "@/server/auth/guards";
import { listResidents } from "@/server/queries/residents";

export const instant = false;

export default async function ManagerResidentsPage() {
  const session = await requireRole("MANAGER", "/manager/residents");
  const residents = await listResidents(session.user.residenceId);

  return (
    <PortalShell
      title="Residents"
      description="Registered applicants and their booking activity."
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <ManagerNav currentPath="/manager/residents" />
      <p className="text-sm text-stone-500">
        {residents.length} resident{residents.length === 1 ? "" : "s"}
      </p>
      <ResidentsList
        residents={residents}
        detailBasePath="/manager/residents"
      />
    </PortalShell>
  );
}
