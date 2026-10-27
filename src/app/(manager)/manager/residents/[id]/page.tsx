import { notFound } from "next/navigation";

import { ManagerNav } from "@/components/manager/manager-nav";
import { PortalShell } from "@/components/portal-shell";
import { ResidentDetail } from "@/components/staff/resident-detail";
import { requireRole } from "@/server/auth/guards";
import { getResidentProfile } from "@/server/queries/residents";

export const instant = false;

type ManagerResidentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ManagerResidentDetailPage({
  params,
}: ManagerResidentDetailPageProps) {
  const { id } = await params;
  const session = await requireRole("MANAGER", `/manager/residents/${id}`);
  const profile = await getResidentProfile(id);

  if (!profile) {
    notFound();
  }

  if (
    session.user.role === "MANAGER" &&
    session.user.residenceId &&
    profile.resident.residenceId !== session.user.residenceId
  ) {
    notFound();
  }

  return (
    <PortalShell
      title={profile.resident.fullName}
      description={profile.resident.email}
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <ManagerNav currentPath="/manager/residents" />
      <ResidentDetail
        listHref="/manager/residents"
        reviewBasePath="/manager/reviews"
        resident={profile.resident}
        activeAllocation={profile.activeAllocation}
        bookingHistory={profile.bookingHistory}
      />
    </PortalShell>
  );
}
