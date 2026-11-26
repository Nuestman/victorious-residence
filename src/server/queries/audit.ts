import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "@/server/db";
import { duringRequest } from "@/server/db/request";
import { auditLogs, users } from "@/server/db/schema";

export type AuditLogFilters = {
  q?: string;
  entityType?: string;
  action?: string;
  limit?: number;
  offset?: number;
};

export async function listAuditLogs(filters: AuditLogFilters = {}) {
  await duringRequest();

  const limit = Math.min(Math.max(filters.limit ?? 50, 1), 200);
  const offset = Math.max(filters.offset ?? 0, 0);
  const conditions = [];

  if (filters.entityType?.trim()) {
    conditions.push(eq(auditLogs.entityType, filters.entityType.trim()));
  }
  if (filters.action?.trim()) {
    conditions.push(eq(auditLogs.action, filters.action.trim()));
  }
  if (filters.q?.trim()) {
    const term = `%${filters.q.trim()}%`;
    conditions.push(
      or(
        ilike(auditLogs.action, term),
        ilike(auditLogs.entityType, term),
        ilike(users.fullName, term),
        ilike(users.email, term),
        sql`${auditLogs.entityId}::text ilike ${term}`,
      ),
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      actorId: auditLogs.actorId,
      actorName: users.fullName,
      actorEmail: users.email,
      actorRole: users.role,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorId, users.id))
    .where(where)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  const [countRow] = await db
    .select({ value: sql<number>`count(*)`.mapWith(Number) })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorId, users.id))
    .where(where);

  return {
    rows,
    total: countRow?.value ?? 0,
    limit,
    offset,
  };
}

export async function listAuditEntityTypes() {
  await duringRequest();
  const rows = await db
    .selectDistinct({ entityType: auditLogs.entityType })
    .from(auditLogs);
  return rows.map((row) => row.entityType).sort();
}

export async function listAuditActions() {
  await duringRequest();
  const rows = await db
    .selectDistinct({ action: auditLogs.action })
    .from(auditLogs);
  return rows.map((row) => row.action).sort();
}
