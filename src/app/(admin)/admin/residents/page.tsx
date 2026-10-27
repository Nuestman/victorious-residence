import { AdminNav } from "@/components/admin/admin-nav";
import { PortalShell } from "@/components/portal-shell";
import { ResidentsList } from "@/components/staff/residents-list";
import { requireAdmin } from "@/server/auth/guards";
import { listResidents } from "@/server/queries/residents";

export const instant = false;

export default async function AdminResidentsPage() {
  const session = await requireAdmin("/admin/residents");
  // Admin sees all residents; managers are residence-scoped on their route.
  const residents = await listResidents();

  return (
    <PortalShell
      title="Residents"
      description="Registered applicants and their booking activity."
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <AdminNav currentPath="/admin/residents" />
      <p className="text-sm text-stone-500">
        {residents.length} resident{residents.length === 1 ? "" : "s"}
      </p>
      <ResidentsList residents={residents} detailBasePath="/admin/residents" />
    </PortalShell>
  );
}
