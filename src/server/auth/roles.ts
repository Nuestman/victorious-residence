import type { UserRole } from "@/server/db/schema";

const roleRank: Record<UserRole, number> = {
  RESIDENT: 1,
  STAFF: 2,
  MANAGER: 3,
  ADMIN: 4,
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

/** Roles a manager may assign when creating/editing staff accounts. */
export const managerAssignableRoles = ["STAFF"] as const satisfies readonly UserRole[];

/** Roles an admin may assign via the staff directory (not ADMIN). */
export const adminAssignableRoles = [
  "STAFF",
  "MANAGER",
] as const satisfies readonly UserRole[];

export function rolesAssignableBy(actorRole: UserRole): readonly UserRole[] {
  switch (actorRole) {
    case "ADMIN":
      return adminAssignableRoles;
    case "MANAGER":
      return managerAssignableRoles;
    case "STAFF":
    case "RESIDENT":
      return [];
    default: {
      const _exhaustive: never = actorRole;
      return _exhaustive;
    }
  }
}

export function defaultDestinationForRole(role: UserRole | undefined): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "MANAGER":
      return "/manager";
    case "STAFF":
      return "/profile";
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
