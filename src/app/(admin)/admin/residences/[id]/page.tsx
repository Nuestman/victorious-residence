import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { ResidenceForm } from "@/components/admin/residence-form";
import { ShowcaseMediaForm } from "@/components/admin/showcase-media-form";
import { PortalShell } from "@/components/portal-shell";
import { getResidenceById } from "@/server/admin-residence";
import { requireAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { residenceMedia } from "@/server/db/schema";

export const instant = false;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminResidenceEditPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireAdmin(`/admin/residences/${id}`);
  const residence = await getResidenceById(id);

  if (!residence) {
    notFound();
  }

  const media = await db
    .select({
      id: residenceMedia.id,
      kind: residenceMedia.kind,
      title: residenceMedia.title,
      description: residenceMedia.description,
      url: residenceMedia.url,
      caption: residenceMedia.caption,
    })
    .from(residenceMedia)
    .where(eq(residenceMedia.residenceId, residence.id))
    .orderBy(asc(residenceMedia.sortOrder));

  return (
    <PortalShell
      title={residence.name}
      description="Update campus details, contact lines, and showcase photos."
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="max-w-xl">
          <ResidenceForm mode="edit" residence={residence} />
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-stone-900">Showcase photos</h2>
          <ShowcaseMediaForm residenceId={residence.id} rows={media} />
        </div>
      </div>
    </PortalShell>
  );
}
