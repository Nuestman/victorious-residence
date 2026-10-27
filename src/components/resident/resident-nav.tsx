import Link from "next/link";

const links = [
  { href: "/resident", label: "Browse" },
  { href: "/resident/bookings", label: "My bookings" },
] as const;

type ResidentNavProps = {
  currentPath: string;
};

export function ResidentNav({ currentPath }: ResidentNavProps) {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-stone-200 pb-3">
      {links.map((link) => {
        const active =
          link.href === "/resident"
            ? currentPath === "/resident"
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
