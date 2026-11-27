import Link from "next/link";

import { ResidenceForm } from "@/components/admin/residence-form";
import { PortalShell } from "@/components/portal-shell";
import { listAllResidences } from "@/server/admin-residence";
import { requireAdmin } from "@/server/auth/guards";

export const instant = false;

export default async function AdminResidencesPage() {
  const session = await requireAdmin("/admin/residences");
  const residences = await listAllResidences();

  return (
    <PortalShell
      title="Residences"
      description="Add and edit campuses. Each residence has its own inventory, managers, and staff."
      userId={session.user.id}
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-stone-900">Create residence</h2>
          <ResidenceForm mode="create" />
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-medium text-stone-900">All residences</h2>
          <ul className="divide-y divide-stone-200 border border-stone-200">
            {residences.map((residence) => (
              <li
                key={residence.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-stone-900">{residence.name}</p>
                  <p className="text-sm text-stone-500">
                    {residence.slug} · {residence.address} ·{" "}
                    {residence.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
                <Link
                  href={`/admin/residences/${residence.id}`}
                  className="text-sm font-medium text-stone-800 underline"
                >
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </PortalShell>
  );
}
