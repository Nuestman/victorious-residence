import { PortalShell } from "@/components/portal-shell";
import { StaffForm } from "@/components/staff/staff-form";
import { StaffList } from "@/components/staff/staff-list";
import { listActiveResidences } from "@/server/admin-residence";
import { requireAdmin } from "@/server/auth/guards";
import { rolesAssignableBy } from "@/server/auth/roles";
import { listStaffDirectory } from "@/server/queries/staff";

export const instant = false;

export default async function AdminStaffPage() {
  const session = await requireAdmin("/admin/staff");
  const residences = await listActiveResidences();
  const staff = await listStaffDirectory({ includeManagers: true });
  const assignableRoles = rolesAssignableBy(session.user.role);

  return (
    <PortalShell
      title="Staff"
      description="Create managers and staff for any campus. Only admins can assign the MANAGER role."
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-stone-900">Add staff</h2>
          {residences.length === 0 ? (
            <p className="text-sm text-stone-600">
              Create an active residence before adding staff.
            </p>
          ) : (
            <StaffForm
              mode="create"
              assignableRoles={assignableRoles}
              residences={residences}
            />
          )}
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-stone-900">Directory</h2>
          <StaffList staff={staff} basePath="/admin/staff" />
        </div>
      </section>
    </PortalShell>
  );
}
