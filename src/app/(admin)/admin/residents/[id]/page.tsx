import { notFound } from "next/navigation";

import { PortalShell } from "@/components/portal-shell";
import { ResidentDetail } from "@/components/staff/resident-detail";
import { requireAdmin } from "@/server/auth/guards";
import { getUpgradeBedOptions } from "@/server/queries/bookings";
import { getResidentProfile } from "@/server/queries/residents";

export const instant = false;

type AdminResidentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminResidentDetailPage({
  params,
}: AdminResidentDetailPageProps) {
  const { id } = await params;
  const session = await requireAdmin(`/admin/residents/${id}`);
  const profile = await getResidentProfile(id);

  if (!profile) {
    notFound();
  }

  const upgradeOptions = profile.activeAllocation
    ? await getUpgradeBedOptions(
        profile.activeAllocation.residenceId,
        profile.activeAllocation.bedSpaceId,
      )
    : [];

  return (
    <PortalShell
      title={profile.resident.fullName}
      description={profile.resident.email}
      userId={session.user.id}
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <ResidentDetail
        listHref="/admin/residents"
        reviewBasePath="/manager/reviews"
        resident={profile.resident}
        activeAllocation={profile.activeAllocation}
        upgradeOptions={upgradeOptions}
        bookingHistory={profile.bookingHistory}
      />
    </PortalShell>
  );
}
