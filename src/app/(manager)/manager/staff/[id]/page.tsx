import { notFound } from "next/navigation";

import { PortalShell } from "@/components/portal-shell";
import { StaffForm } from "@/components/staff/staff-form";
import { listActiveResidences } from "@/server/admin-residence";
import { requireRole } from "@/server/auth/guards";
import { rolesAssignableBy } from "@/server/auth/roles";
import { getStaffMember } from "@/server/queries/staff";

export const instant = false;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ManagerStaffEditPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireRole("MANAGER", `/manager/staff/${id}`);
  const member = await getStaffMember(id);

  if (
    !member ||
    member.role !== "STAFF" ||
    !session.user.residenceId ||
    member.residenceId !== session.user.residenceId
  ) {
    notFound();
  }

  const residences = await listActiveResidences();
  const campus = residences.filter((row) => row.id === session.user.residenceId);
  const assignableRoles = rolesAssignableBy(session.user.role);

  return (
    <PortalShell
      title={member.fullName}
      description="Update STAFF details for your residence."
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <div className="max-w-xl">
        <StaffForm
          mode="edit"
          assignableRoles={assignableRoles}
          residences={campus}
          lockedResidenceId={session.user.residenceId}
          member={member}
        />
      </div>
    </PortalShell>
  );
}
