import type { UserRole } from "@/server/db/schema";

const roleRank: Record<UserRole, number> = {
  RESIDENT: 1,
  MANAGER: 2,
  ADMIN: 3,
};

export function hasMinimumRole(
  role: UserRole | undefined,
  minimum: UserRole,
): boolean {
  if (!role) {
    return false;
  }

  return roleRank[role] >= roleRank[minimum];
}

export function canManageResidence(
  role: UserRole | undefined,
  userResidenceId: string | null | undefined,
  targetResidenceId: string,
): boolean {
  if (role === "ADMIN") {
    return true;
  }

  if (role === "MANAGER" && userResidenceId === targetResidenceId) {
    return true;
  }

  return false;
}

export function defaultDestinationForRole(role: UserRole | undefined): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "MANAGER":
      return "/manager";
    case "RESIDENT":
      return "/resident";
    case undefined:
      return "/";
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}
