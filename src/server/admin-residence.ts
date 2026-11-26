import { asc, eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/server/db";
import { residences } from "@/server/db/schema";

export const ADMIN_RESIDENCE_COOKIE = "vr_admin_residence_id";

export async function listActiveResidences() {
  return db
    .select({
      id: residences.id,
      name: residences.name,
      slug: residences.slug,
      address: residences.address,
      isActive: residences.isActive,
    })
    .from(residences)
    .where(eq(residences.isActive, true))
    .orderBy(asc(residences.name));
}

export async function listAllResidences() {
  return db
    .select()
    .from(residences)
    .orderBy(asc(residences.name));
}

/**
 * Admin working campus: cookie if valid, else oldest active residence.
 */
export async function resolveAdminWorkingResidenceId(): Promise<string | null> {
  const active = await listActiveResidences();
  if (active.length === 0) {
    return null;
  }

  const jar = await cookies();
  const preferred = jar.get(ADMIN_RESIDENCE_COOKIE)?.value;
  if (preferred && active.some((row) => row.id === preferred)) {
    return preferred;
  }

  return active[0]?.id ?? null;
}

export async function getResidenceById(id: string) {
  const [row] = await db
    .select()
    .from(residences)
    .where(eq(residences.id, id))
    .limit(1);
  return row ?? null;
}
