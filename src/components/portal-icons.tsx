import type { ReactNode, SVGProps } from "react";

import type { PortalIconName } from "@/components/portal-nav";

export type { PortalIconName };

type IconProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

function BaseIcon({ children, className, title, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      className={className ?? "h-4 w-4 shrink-0"}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

const iconPaths: Record<PortalIconName, ReactNode> = {
  overview: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </>
  ),
  residences: (
    <>
      <path d="M4 20V8l8-4 8 4v12" />
      <path d="M9 20v-6h6v6" />
      <path d="M9 10h.01M15 10h.01" />
    </>
  ),
  roomTypes: (
    <>
      <path d="M3 8h18v11H3z" />
      <path d="M3 12h18" />
      <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
      <path d="M8 16h.01M16 16h.01" />
    </>
  ),
  provision: (
    <>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.1-3.1a6 6 0 0 1-7.9 7.9l-7 7a2.1 2.1 0 0 1-3-3l7-7a6 6 0 0 1 4.8-5.8z" />
    </>
  ),
  occupancy: (
    <>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16v-5" />
      <path d="M12 16V8" />
      <path d="M16 16v-3" />
      <path d="M20 16v-8" />
    </>
  ),
  residents: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  staff: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <circle cx="19" cy="8" r="2.5" />
      <path d="M19 11.5v3M17.5 13h3" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </>
  ),
  reviews: (
    <>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  inquiries: (
    <>
      <path d="M4 6h16v12H4z" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  browse: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  bookings: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 3v4M16 3v4" />
      <path d="M8 15h.01M12 15h.01M16 15h.01" />
    </>
  ),
  balances: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 15V9" />
      <path d="M12 15V7" />
      <path d="M17 15v-3" />
      <path d="M5 19h14" />
    </>
  ),
  audit: (
    <>
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </>
  ),
  home: (
    <>
      <path d="m4 11 8-7 8 7" />
      <path d="M6 10v10h12V10" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  portal: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </>
  ),
  signOut: (
    <>
      <path d="M10 17H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h5" />
      <path d="M15 12H8" />
      <path d="m12 8 4 4-4 4" />
      <path d="M15 5h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12M18 6 6 18" />
    </>
  ),
  chevronDown: (
    <>
      <path d="m6 9 6 6 6-6" />
    </>
  ),
  chevronRight: (
    <>
      <path d="m9 6 6 6-6 6" />
    </>
  ),
  save: (
    <>
      <path d="M5 4h11l3 3v13H5z" />
      <path d="M8 4v5h8V4" />
      <path d="M8 20v-6h8v6" />
    </>
  ),
  check: (
    <>
      <path d="M5 13l4 4L19 7" />
    </>
  ),
  reject: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  login: (
    <>
      <path d="M14 17h5a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-5" />
      <path d="M9 12h10" />
      <path d="m12 8-4 4 4 4" />
      <path d="M9 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
    </>
  ),
};

export function PortalIcon({
  name,
  className = "h-4 w-4 shrink-0",
}: {
  name: PortalIconName;
  className?: string;
}) {
  return <BaseIcon className={className}>{iconPaths[name]}</BaseIcon>;
}

export function pageIconForPath(pathname: string): PortalIconName {
  if (pathname.startsWith("/admin/residences")) return "residences";
  if (pathname.startsWith("/admin/room-types")) return "roomTypes";
  if (pathname.startsWith("/admin/provision")) return "provision";
  if (pathname.startsWith("/admin/occupancy")) return "occupancy";
  if (pathname.startsWith("/admin/residents")) return "residents";
  if (pathname.startsWith("/admin/balances")) return "balances";
  if (pathname.startsWith("/admin/staff")) return "staff";
  if (pathname.startsWith("/admin/inquiries")) return "inquiries";
  if (pathname.startsWith("/admin/audit")) return "audit";
  if (pathname === "/admin") return "overview";

  if (pathname.startsWith("/manager/reviews")) return "reviews";
  if (pathname.startsWith("/manager/balances")) return "balances";
  if (pathname.startsWith("/manager/inquiries")) return "inquiries";
  if (pathname.startsWith("/manager/residents")) return "residents";
  if (pathname.startsWith("/manager/staff")) return "staff";
  if (pathname === "/manager") return "overview";

  if (pathname.startsWith("/resident/bookings")) return "bookings";
  if (pathname.startsWith("/resident/room-types")) return "roomTypes";
  if (pathname.startsWith("/resident")) return "browse";

  if (pathname.startsWith("/profile")) return "profile";

  return "overview";
}
