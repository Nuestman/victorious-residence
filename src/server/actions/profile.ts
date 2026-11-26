"use server";

import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { storeAvatar } from "@/lib/avatar";
import { requireSession } from "@/server/auth/guards";
import { db } from "@/server/db";
import { auditLogs, users } from "@/server/db/schema";

export type ProfileActionState = {
  error?: string;
  success?: string;
};

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null));

const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: optionalText(40),
  nationalId: optionalText(40),
  studentId: optionalText(40),
  hometown: optionalText(120),
  emergencyContactName: optionalText(120),
  emergencyContactPhone: optionalText(40),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(8).max(100),
    newPassword: z.string().min(8).max(100),
    confirmPassword: z.string().min(8).max(100),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
  });

async function writeAudit(
  actorId: string,
  action: string,
  metadata: Record<string, unknown> = {},
) {
  await db.insert(auditLogs).values({
    actorId,
    action,
    entityType: "user",
    entityId: actorId,
    metadata,
  });
}

function revalidateProfile() {
  revalidatePath("/profile");
  revalidatePath("/admin/residents");
  revalidatePath("/manager/residents");
}

export async function updateProfileAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await requireSession("/profile");

  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || undefined,
    nationalId: formData.get("nationalId") || undefined,
    studentId: formData.get("studentId") || undefined,
    hometown: formData.get("hometown") || undefined,
    emergencyContactName: formData.get("emergencyContactName") || undefined,
    emergencyContactPhone: formData.get("emergencyContactPhone") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid profile details." };
  }

  await db
    .update(users)
    .set({
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      nationalId: parsed.data.nationalId,
      studentId: parsed.data.studentId,
      hometown: parsed.data.hometown,
      emergencyContactName: parsed.data.emergencyContactName,
      emergencyContactPhone: parsed.data.emergencyContactPhone,
    })
    .where(eq(users.id, session.user.id));

  await writeAudit(session.user.id, "profile.update", {
    fields: Object.keys(parsed.data),
  });

  revalidateProfile();
  return { success: "Profile details saved." };
}

export async function changePasswordAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await requireSession("/profile");

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid password form." };
  }

  const [row] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!row) {
    return { error: "Account not found." };
  }

  const matches = await compare(parsed.data.currentPassword, row.passwordHash);
  if (!matches) {
    return { error: "Current password is incorrect." };
  }

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return { error: "New password must be different from the current password." };
  }

  const passwordHash = await hash(parsed.data.newPassword, 12);
  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, session.user.id));

  await writeAudit(session.user.id, "profile.password_change");
  revalidateProfile();
  return { success: "Password updated." };
}

export async function updateAvatarAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await requireSession("/profile");
  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a profile photo to upload." };
  }

  const stored = await storeAvatar(file);
  if (!stored.ok) {
    return { error: stored.error };
  }

  await db
    .update(users)
    .set({ avatarUrl: stored.url })
    .where(eq(users.id, session.user.id));

  await writeAudit(session.user.id, "profile.avatar_update");
  revalidateProfile();
  return { success: "Profile photo updated." };
}

export async function removeAvatarAction(
  _prev: ProfileActionState,
  _formData: FormData,
): Promise<ProfileActionState> {
  const session = await requireSession("/profile");

  await db
    .update(users)
    .set({ avatarUrl: null })
    .where(eq(users.id, session.user.id));

  await writeAudit(session.user.id, "profile.avatar_remove");
  revalidateProfile();
  return { success: "Profile photo removed." };
}
