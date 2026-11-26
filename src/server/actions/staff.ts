"use server";

import { hash } from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/server/auth/guards";
import { rolesAssignableBy } from "@/server/auth/roles";
import { db } from "@/server/db";
import { auditLogs, residences, users, type UserRole } from "@/server/db/schema";

export type StaffActionState = {
  error?: string;
  success?: string;
};

const createStaffSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional(),
  password: z.string().min(8).max(100),
  role: z.enum(["STAFF", "MANAGER"]),
  residenceId: z.string().uuid(),
});

const updateStaffSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional(),
  role: z.enum(["STAFF", "MANAGER"]),
  residenceId: z.string().uuid(),
  password: z.string().min(8).max(100).optional(),
});

async function writeAudit(
  actorId: string,
  action: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
) {
  await db.insert(auditLogs).values({
    actorId,
    action,
    entityType: "user",
    entityId,
    metadata,
  });
}

function revalidateStaffPaths() {
  revalidatePath("/admin/staff");
  revalidatePath("/manager/staff");
  revalidatePath("/admin");
  revalidatePath("/manager");
}

function assertAssignableRole(actorRole: UserRole, targetRole: UserRole) {
  const allowed = rolesAssignableBy(actorRole);
  if (!allowed.includes(targetRole)) {
    return false;
  }
  return true;
}

async function assertResidenceExists(residenceId: string) {
  const [row] = await db
    .select({ id: residences.id, isActive: residences.isActive })
    .from(residences)
    .where(eq(residences.id, residenceId))
    .limit(1);
  return row ?? null;
}

export async function createStaffAction(
  _prev: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const session = await requireRole("MANAGER");
  const actorRole = session.user.role;

  const parsed = createStaffSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    password: formData.get("password"),
    role: formData.get("role"),
    residenceId: formData.get("residenceId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid staff details." };
  }

  if (!assertAssignableRole(actorRole, parsed.data.role)) {
    return {
      error:
        actorRole === "MANAGER"
          ? "Managers can only create STAFF accounts."
          : "You cannot assign that role.",
    };
  }

  if (actorRole === "MANAGER") {
    if (
      !session.user.residenceId ||
      session.user.residenceId !== parsed.data.residenceId
    ) {
      return { error: "You can only add staff to your assigned residence." };
    }
  }

  const residence = await assertResidenceExists(parsed.data.residenceId);
  if (!residence || !residence.isActive) {
    return { error: "Select an active residence." };
  }

  const passwordHash = await hash(parsed.data.password, 12);

  try {
    const [created] = await db
      .insert(users)
      .values({
        email: parsed.data.email.toLowerCase(),
        passwordHash,
        fullName: parsed.data.fullName,
        phone: parsed.data.phone || null,
        role: parsed.data.role,
        residenceId: parsed.data.residenceId,
      })
      .returning({ id: users.id, fullName: users.fullName, role: users.role });

    await writeAudit(session.user.id, "staff.create", created.id, {
      role: created.role,
      residenceId: parsed.data.residenceId,
      email: parsed.data.email.toLowerCase(),
    });

    revalidateStaffPaths();
    return {
      success: `Created ${created.role.toLowerCase()} “${created.fullName}”.`,
    };
  } catch {
    return { error: "Could not create account. Email may already be registered." };
  }
}

export async function updateStaffAction(
  _prev: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const session = await requireRole("MANAGER");
  const actorRole = session.user.role;

  const passwordRaw = formData.get("password");
  const parsed = updateStaffSchema.safeParse({
    id: formData.get("id"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || undefined,
    role: formData.get("role"),
    residenceId: formData.get("residenceId"),
    password:
      typeof passwordRaw === "string" && passwordRaw.length > 0
        ? passwordRaw
        : undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid staff details." };
  }

  if (!assertAssignableRole(actorRole, parsed.data.role)) {
    return {
      error:
        actorRole === "MANAGER"
          ? "Managers can only keep accounts as STAFF."
          : "You cannot assign that role.",
    };
  }

  const [existing] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, parsed.data.id), ne(users.role, "ADMIN")))
    .limit(1);

  if (!existing) {
    return { error: "Staff member not found." };
  }

  if (existing.role === "RESIDENT") {
    return { error: "Use the residents list for resident accounts." };
  }

  if (actorRole === "MANAGER") {
    if (existing.role !== "STAFF") {
      return { error: "Managers can only edit STAFF accounts." };
    }
    if (
      !session.user.residenceId ||
      existing.residenceId !== session.user.residenceId
    ) {
      return { error: "That staff member is outside your residence." };
    }
    if (parsed.data.residenceId !== session.user.residenceId) {
      return { error: "You cannot move staff to another residence." };
    }
  }

  const residence = await assertResidenceExists(parsed.data.residenceId);
  if (!residence || !residence.isActive) {
    return { error: "Select an active residence." };
  }

  const updates: {
    fullName: string;
    phone: string | null;
    role: "STAFF" | "MANAGER";
    residenceId: string;
    passwordHash?: string;
  } = {
    fullName: parsed.data.fullName,
    phone: parsed.data.phone || null,
    role: parsed.data.role,
    residenceId: parsed.data.residenceId,
  };

  if (parsed.data.password) {
    updates.passwordHash = await hash(parsed.data.password, 12);
  }

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, parsed.data.id))
    .returning({ id: users.id, fullName: users.fullName, role: users.role });

  await writeAudit(session.user.id, "staff.update", updated.id, {
    role: updated.role,
    residenceId: parsed.data.residenceId,
    passwordChanged: Boolean(parsed.data.password),
  });

  revalidateStaffPaths();
  revalidatePath(`/admin/staff/${updated.id}`);
  revalidatePath(`/manager/staff/${updated.id}`);
  return { success: `Updated “${updated.fullName}”.` };
}
