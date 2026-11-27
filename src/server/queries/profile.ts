import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { duringRequest } from "@/server/db/request";
import { residences, users } from "@/server/db/schema";

export async function getUserProfile(userId: string) {
  await duringRequest();

  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      phone: users.phone,
      nationalId: users.nationalId,
      nationalIdImageUrl: users.nationalIdImageUrl,
      studentId: users.studentId,
      studentIdImageUrl: users.studentIdImageUrl,
      hometown: users.hometown,
      emergencyContactName: users.emergencyContactName,
      emergencyContactPhone: users.emergencyContactPhone,
      avatarUrl: users.avatarUrl,
      role: users.role,
      residenceId: users.residenceId,
      residenceName: residences.name,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .leftJoin(residences, eq(users.residenceId, residences.id))
    .where(eq(users.id, userId))
    .limit(1);

  return row ?? null;
}

export async function getUserAvatarUrl(userId: string): Promise<string | null> {
  await duringRequest();

  const [row] = await db
    .select({ avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return row?.avatarUrl ?? null;
}
