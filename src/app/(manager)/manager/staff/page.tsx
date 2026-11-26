import { PortalShell } from "@/components/portal-shell";
import { StaffForm } from "@/components/staff/staff-form";
import { StaffList } from "@/components/staff/staff-list";
import { listActiveResidences } from "@/server/admin-residence";
import { requireRole } from "@/server/auth/guards";
import { rolesAssignableBy } from "@/server/auth/roles";
import { listStaffDirectory } from "@/server/queries/staff";

export const instant = false;

export default async function ManagerStaffPage() {
  const session = await requireRole("MANAGER", "/manager/staff");
  const residenceId = session.user.residenceId;
  const residences = await listActiveResidences();
  const campus = residences.filter((row) => row.id === residenceId);
  const staff = await listStaffDirectory({
    residenceId,
    includeManagers: false,
  });
  const assignableRoles = rolesAssignableBy(session.user.role);

  return (
    <PortalShell
      title="Staff"
      description="Add janitors, security, and other STAFF for your residence. Manager role assignment is admin-only."
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >

      {!residenceId ? (
        <p className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Your account has no residence assigned. Ask an admin to attach you to
          a campus before managing staff.
        </p>
      ) : (
        <section className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-lg font-medium text-stone-900">Add staff</h2>
            <StaffForm
              mode="create"
              assignableRoles={assignableRoles}
              residences={campus.length > 0 ? campus : residences}
              lockedResidenceId={residenceId}
            />
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-medium text-stone-900">Directory</h2>
            <StaffList staff={staff} basePath="/manager/staff" />
          </div>
        </section>
      )}
    </PortalShell>
  );
}
