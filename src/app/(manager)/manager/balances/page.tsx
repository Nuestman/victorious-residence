import { PortalShell } from "@/components/portal-shell";
import { BalancesList } from "@/components/staff/balances-list";
import { requireRole } from "@/server/auth/guards";
import { listOutstandingBalances } from "@/server/queries/balances";

export const instant = false;

export default async function ManagerBalancesPage() {
  const session = await requireRole("MANAGER", "/manager/balances");
  const residenceId =
    session.user.role === "MANAGER" ? session.user.residenceId : null;
  const rows = await listOutstandingBalances({
    residenceId: residenceId ?? undefined,
  });

  return (
    <PortalShell
      title="Payment balances"
      description="Track full vs partial payments and email residents who still owe a balance."
      userId={session.user.id}
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <BalancesList rows={rows} reviewBasePath="/manager/reviews" />
    </PortalShell>
  );
}
