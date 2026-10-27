import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { hasMinimumRole } from "@/server/auth/roles";
import type { UserRole } from "@/server/db/schema";

export async function requireSession(callbackPath?: string) {
  const session = await auth();

  if (!session?.user) {
    const loginUrl =
      callbackPath && callbackPath.startsWith("/")
        ? `/login?callbackUrl=${encodeURIComponent(callbackPath)}`
        : "/login";
    redirect(loginUrl);
  }

  return session;
}

export async function requireRole(
  minimumRole: UserRole,
  callbackPath?: string,
) {
  const session = await requireSession(callbackPath);

  if (!hasMinimumRole(session.user.role, minimumRole)) {
    redirect("/");
  }

  return session;
}

export async function requireAdmin(callbackPath?: string) {
  return requireRole("ADMIN", callbackPath);
}
