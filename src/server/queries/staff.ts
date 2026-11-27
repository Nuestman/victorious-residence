import { and, asc, eq, inArray, ne } from "drizzle-orm";

import { db } from "@/server/db";
import { residences, users, type UserRole } from "@/server/db/schema";

const staffDirectoryRoles: UserRole[] = ["STAFF", "MANAGER"];

export async function listStaffDirectory(options: {
  residenceId?: string | null;
  /** When true (admin), include managers + staff; managers only see STAFF. */
  includeManagers: boolean;
}) {
  const roles: UserRole[] = options.includeManagers
    ? staffDirectoryRoles
    : ["STAFF"];

  const conditions = [inArray(users.role, roles), ne(users.role, "ADMIN")];

  if (options.residenceId) {
    conditions.push(eq(users.residenceId, options.residenceId));
  }

  return db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      role: users.role,
      residenceId: users.residenceId,
      residenceName: residences.name,
      createdAt: users.createdAt,
    })
    .from(users)
    .leftJoin(residences, eq(users.residenceId, residences.id))
    .where(and(...conditions))
    .orderBy(asc(users.fullName));
}

export async function getStaffMember(id: string) {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      phone: users.phone,
      role: users.role,
      residenceId: users.residenceId,
      residenceName: residences.name,
      createdAt: users.createdAt,
    })
    .from(users)
    .leftJoin(residences, eq(users.residenceId, residences.id))
    .where(eq(users.id, id))
    .limit(1);

  return row ?? null;
}
