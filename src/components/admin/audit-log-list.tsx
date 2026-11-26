import Link from "next/link";

import { auditActionLabel } from "@/server/audit";

type AuditRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  actorRole: string | null;
};

type AuditLogListProps = {
  rows: AuditRow[];
  total: number;
  limit: number;
  offset: number;
  filters: {
    q?: string;
    entityType?: string;
    action?: string;
  };
};

function metadataPreview(metadata: Record<string, unknown> | null): string {
  if (!metadata || Object.keys(metadata).length === 0) {
    return "—";
  }
  try {
    const json = JSON.stringify(metadata);
    return json.length > 120 ? `${json.slice(0, 117)}…` : json;
  } catch {
    return "—";
  }
}

function buildPageHref(
  filters: AuditLogListProps["filters"],
  nextOffset: number,
): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.entityType) params.set("entityType", filters.entityType);
  if (filters.action) params.set("action", filters.action);
  if (nextOffset > 0) params.set("offset", String(nextOffset));
  const qs = params.toString();
  return qs ? `/admin/audit?${qs}` : "/admin/audit";
}

export function AuditLogList({
  rows,
  total,
  limit,
  offset,
  filters,
}: AuditLogListProps) {
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, total);
  const prevOffset = Math.max(offset - limit, 0);
  const nextOffset = offset + limit;
  const hasPrev = offset > 0;
  const hasNext = nextOffset < total;

  if (rows.length === 0) {
    return (
      <p className="border border-stone-200 px-4 py-6 text-sm text-stone-600">
        No audit events match these filters.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-500">
        Showing {from}–{to} of {total}
      </p>
      <ul className="divide-y divide-stone-200 border border-stone-200">
        {rows.map((row) => (
          <li key={row.id} className="space-y-1 px-4 py-3 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-stone-900">
                  {auditActionLabel(row.action)}
                </p>
                <p className="text-stone-500">
                  {row.actorName
                    ? `${row.actorName}${row.actorRole ? ` (${row.actorRole})` : ""}`
                    : "System"}
                  {row.actorEmail ? ` · ${row.actorEmail}` : ""}
                </p>
              </div>
              <time
                className="text-stone-500"
                dateTime={row.createdAt.toISOString()}
              >
                {row.createdAt.toLocaleString()}
              </time>
            </div>
            <p className="text-stone-600">
              <span className="font-medium">{row.entityType}</span> ·{" "}
              <code className="text-xs">{row.entityId}</code>
            </p>
            <p className="break-all font-mono text-xs text-stone-500">
              {row.action}
              {" · "}
              {metadataPreview(row.metadata)}
            </p>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        {hasPrev ? (
          <Link
            href={buildPageHref(filters, prevOffset)}
            className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-800"
          >
            Previous
          </Link>
        ) : null}
        {hasNext ? (
          <Link
            href={buildPageHref(filters, nextOffset)}
            className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-800"
          >
            Next
          </Link>
        ) : null}
      </div>
    </div>
  );
}
