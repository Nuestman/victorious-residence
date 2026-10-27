"use server";

import { hash } from "bcryptjs";
import { asc, eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { z } from "zod";

import { signIn, signOut } from "@/server/auth";
import { defaultDestinationForRole } from "@/server/auth/roles";
import { db } from "@/server/db";
import { residences, users } from "@/server/db/schema";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  callbackUrl: z.string().optional(),
});

const registerSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100),
    email: z.string().trim().email(),
    phone: z.string().trim().min(8).max(20),
    password: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type LoginState = {
  error?: string;
};

export type RegisterState = {
  error?: string;
};

function safeCallbackUrl(raw: string | undefined): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return null;
  }
  return raw;
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    callbackUrl: formData.get("callbackUrl") || undefined,
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password (min 8 characters)." };
  }

  const email = parsed.data.email.toLowerCase();
  const callbackUrl = safeCallbackUrl(parsed.data.callbackUrl);

  const [existingUser] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const redirectTo =
    callbackUrl ?? defaultDestinationForRole(existingUser?.role);

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }

  return {};
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the form and try again.",
    };
  }

  const email = parsed.data.email.toLowerCase();

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return { error: "An account with that email already exists. Sign in instead." };
  }

  const [residence] = await db
    .select({ id: residences.id })
    .from(residences)
    .where(eq(residences.isActive, true))
    .orderBy(asc(residences.createdAt))
    .limit(1);

  if (!residence) {
    return { error: "Registration is temporarily unavailable. Contact management." };
  }

  const passwordHash = await hash(parsed.data.password, 12);

  await db.insert(users).values({
    email,
    passwordHash,
    fullName: parsed.data.fullName,
    phone: parsed.data.phone,
    role: "RESIDENT",
    residenceId: residence.id,
  });

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/resident",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: "Account created, but sign-in failed. Try signing in manually.",
      };
    }
    throw error;
  }

  return {};
}
