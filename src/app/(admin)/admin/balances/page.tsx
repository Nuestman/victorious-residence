import { ResidenceSwitcher } from "@/components/admin/residence-switcher";
import { PortalShell } from "@/components/portal-shell";
import { BalancesList } from "@/components/staff/balances-list";
import {
  listActiveResidences,
  resolveAdminWorkingResidenceId,
} from "@/server/admin-residence";
import { requireAdmin } from "@/server/auth/guards";
import { listOutstandingBalances } from "@/server/queries/balances";

export const instant = false;

export default async function AdminBalancesPage() {
  const session = await requireAdmin("/admin/balances");
  const residences = await listActiveResidences();
  const residenceId = await resolveAdminWorkingResidenceId();
  const rows = await listOutstandingBalances({
    residenceId: residenceId ?? undefined,
  });
  const workingName =
    residences.find((row) => row.id === residenceId)?.name ?? null;

  return (
    <PortalShell
      title="Payment balances"
      description="Track full vs partial payments by campus and email balance reminders."
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <ResidenceSwitcher residences={residences} selectedId={residenceId} />
      {workingName ? (
        <p className="text-sm text-stone-600">
          Showing balances for <strong>{workingName}</strong>.
        </p>
      ) : null}
      <BalancesList rows={rows} reviewBasePath="/manager/reviews" />
    </PortalShell>
  );
}
