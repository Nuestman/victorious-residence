import { AuditFilters } from "@/components/admin/audit-filters";
import { AuditLogList } from "@/components/admin/audit-log-list";
import { PortalShell } from "@/components/portal-shell";
import { requireAdmin } from "@/server/auth/guards";
import {
  listAuditActions,
  listAuditEntityTypes,
  listAuditLogs,
} from "@/server/queries/audit";

export const instant = false;

type AuditPageProps = {
  searchParams: Promise<{
    q?: string;
    entityType?: string;
    action?: string;
    offset?: string;
  }>;
};

export default async function AdminAuditPage({ searchParams }: AuditPageProps) {
  const session = await requireAdmin("/admin/audit");
  const params = await searchParams;
  const offset = Number(params.offset ?? "0");
  const filters = {
    q: params.q?.trim() || undefined,
    entityType: params.entityType?.trim() || undefined,
    action: params.action?.trim() || undefined,
  };

  const [{ rows, total, limit }, entityTypes, actions] = await Promise.all([
    listAuditLogs({
      ...filters,
      offset: Number.isFinite(offset) && offset > 0 ? offset : 0,
      limit: 50,
    }),
    listAuditEntityTypes(),
    listAuditActions(),
  ]);

  return (
    <PortalShell
      title="Audit log"
      description="Immutable trail of staff, resident, and system actions across the app."
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <AuditFilters
        q={filters.q}
        entityType={filters.entityType}
        action={filters.action}
        entityTypes={entityTypes}
        actions={actions}
      />
      <AuditLogList
        rows={rows}
        total={total}
        limit={limit}
        offset={Number.isFinite(offset) && offset > 0 ? offset : 0}
        filters={filters}
      />
    </PortalShell>
  );
}
