"use server";

import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { z } from "zod";

import { signIn, signOut } from "@/server/auth";
import { defaultDestinationForRole } from "@/server/auth/roles";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  callbackUrl: z.string().optional(),
});

export type LoginState = {
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
