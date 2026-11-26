import { notFound } from "next/navigation";

import { PortalShell } from "@/components/portal-shell";
import { StaffForm } from "@/components/staff/staff-form";
import { listActiveResidences } from "@/server/admin-residence";
import { requireAdmin } from "@/server/auth/guards";
import { rolesAssignableBy } from "@/server/auth/roles";
import { getStaffMember } from "@/server/queries/staff";

export const instant = false;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminStaffEditPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireAdmin(`/admin/staff/${id}`);
  const member = await getStaffMember(id);

  if (!member || member.role === "RESIDENT" || member.role === "ADMIN") {
    notFound();
  }

  const residences = await listActiveResidences();
  const assignableRoles = rolesAssignableBy(session.user.role);

  return (
    <PortalShell
      title={member.fullName}
      description="Update role, campus assignment, or password."
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <div className="max-w-xl">
        <StaffForm
          mode="edit"
          assignableRoles={assignableRoles}
          residences={residences}
          member={member}
        />
      </div>
    </PortalShell>
  );
}
