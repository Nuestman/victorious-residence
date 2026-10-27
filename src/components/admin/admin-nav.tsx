import Link from "next/link";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/room-types", label: "Room types" },
  { href: "/admin/provision", label: "Provision rooms" },
  { href: "/admin/occupancy", label: "Occupancy" },
  { href: "/admin/residents", label: "Residents" },
] as const;

type AdminNavProps = {
  currentPath: string;
};

export function AdminNav({ currentPath }: AdminNavProps) {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-stone-200 pb-3">
      {links.map((link) => {
        const active =
          link.href === "/admin"
            ? currentPath === "/admin"
            : currentPath.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              active
                ? "rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white"
                : "rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-800"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
