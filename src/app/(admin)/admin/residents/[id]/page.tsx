import { notFound } from "next/navigation";

import { AdminNav } from "@/components/admin/admin-nav";
import { PortalShell } from "@/components/portal-shell";
import { ResidentDetail } from "@/components/staff/resident-detail";
import { requireAdmin } from "@/server/auth/guards";
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

  return (
    <PortalShell
      title={profile.resident.fullName}
      description={profile.resident.email}
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <AdminNav currentPath="/admin/residents" />
      <ResidentDetail
        listHref="/admin/residents"
        reviewBasePath="/manager/reviews"
        resident={profile.resident}
        activeAllocation={profile.activeAllocation}
        bookingHistory={profile.bookingHistory}
      />
    </PortalShell>
  );
}
