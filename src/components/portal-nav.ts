import type { UserRole } from "@/server/db/schema";

export type PortalIconName =
  | "overview"
  | "residences"
  | "roomTypes"
  | "provision"
  | "occupancy"
  | "residents"
  | "staff"
  | "profile"
  | "reviews"
  | "inquiries"
  | "browse"
  | "bookings"
  | "balances"
  | "audit"
  | "home"
  | "portal"
  | "signOut"
  | "menu"
  | "close"
  | "chevronDown"
  | "chevronRight"
  | "save"
  | "check"
  | "reject"
  | "plus"
  | "login";

export type PortalLink = {
  href: string;
  label: string;
  icon: PortalIconName;
};

const adminLinks: PortalLink[] = [
  { href: "/admin", label: "Overview", icon: "overview" },
  { href: "/admin/residences", label: "Residences", icon: "residences" },
  { href: "/admin/room-types", label: "Room types", icon: "roomTypes" },
  { href: "/admin/provision", label: "Provision rooms", icon: "provision" },
  { href: "/admin/occupancy", label: "Occupancy", icon: "occupancy" },
  { href: "/admin/residents", label: "Residents", icon: "residents" },
  { href: "/admin/balances", label: "Balances", icon: "balances" },
  { href: "/admin/staff", label: "Staff", icon: "staff" },
  { href: "/admin/inquiries", label: "Messages", icon: "inquiries" },
  { href: "/admin/audit", label: "Audit log", icon: "audit" },
  { href: "/profile", label: "Profile", icon: "profile" },
];

const managerLinks: PortalLink[] = [
  { href: "/manager", label: "Overview", icon: "overview" },
  { href: "/manager/reviews", label: "Review queue", icon: "reviews" },
  { href: "/manager/balances", label: "Balances", icon: "balances" },
  { href: "/manager/inquiries", label: "Messages", icon: "inquiries" },
  { href: "/manager/residents", label: "Residents", icon: "residents" },
  { href: "/manager/staff", label: "Staff", icon: "staff" },
  { href: "/profile", label: "Profile", icon: "profile" },
];

const residentLinks: PortalLink[] = [
  { href: "/resident", label: "Browse Rooms", icon: "browse" },
  { href: "/resident/bookings", label: "My bookings", icon: "bookings" },
  { href: "/profile", label: "Profile", icon: "profile" },
];

const staffLinks: PortalLink[] = [
  { href: "/profile", label: "Profile", icon: "profile" },
];

export function portalLinksForRole(role: UserRole): PortalLink[] {
  switch (role) {
    case "ADMIN":
      return adminLinks;
    case "MANAGER":
      return managerLinks;
    case "RESIDENT":
      return residentLinks;
    case "STAFF":
      return staffLinks;
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}

export function isPortalLinkActive(pathname: string, href: string): boolean {
  if (href === "/admin" || href === "/manager") {
    return pathname === href;
  }

  if (href === "/resident") {
    return (
      pathname === "/resident" || pathname.startsWith("/resident/room-types")
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
