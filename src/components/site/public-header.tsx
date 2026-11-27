"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { PortalIcon } from "@/components/portal-icons";

import { BrandLogo } from "./brand-logo";
import { ContactEmailLink, ContactPhoneLinks } from "./contact-links";
import { UserMenu, type UserMenuUser } from "./user-menu";

const links = [
  { href: "/rooms", label: "Rooms" },
  { href: "/facilities", label: "Facilities" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export type PublicHeaderProps = {
  name: string;
  address: string;
  phone: string | null;
  email: string | null;
  user: UserMenuUser | null;
  portalHref: string | null;
};

function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PublicHeader({
  name,
  address,
  phone,
  email,
  user,
  portalHref,
}: PublicHeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-ink text-cream/80">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2 text-xs sm:px-6">
          <p>{address}</p>
          <p className="flex flex-wrap gap-x-4">
            <ContactPhoneLinks phone={phone} />
            <ContactEmailLink email={email} className="hover:text-brass" />
          </p>
        </div>
      </div>
      <div className="border-b border-ink/10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex h-9 min-w-0 items-center hover:opacity-90 md:h-10"
          >
            <BrandLogo name={name} size="md" tone="cream" />
          </Link>
          <div className="flex shrink-0 items-center gap-2.5">
            <nav className="hidden items-center gap-5 text-sm md:flex">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    isCurrent(pathname, link.href)
                      ? "font-medium text-forest"
                      : "text-ink/80 hover:text-forest"
                  }
                >
                  {link.label}
                </Link>
              ))}
              {user ? null : (
                <>
                  <Link href="/login" className="text-ink/80 hover:text-forest">
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-md bg-forest px-3 py-2 font-medium text-cream"
                  >
                    Book a Room
                  </Link>
                </>
              )}
            </nav>
            {user ? (
              <UserMenu user={user} portalHref={portalHref ?? undefined} />
            ) : null}
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-forest/20 text-forest md:hidden"
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((value) => !value)}
            >
              <PortalIcon name={open ? "close" : "menu"} className="h-4 w-4" />
            </button>
          </div>
        </div>
        {open ? (
          <nav className="flex flex-col gap-1 border-t border-ink/10 px-4 py-3 md:hidden">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm text-ink hover:bg-white"
              >
                {link.label}
              </Link>
            ))}
            {user ? null : (
              <div className="mt-2 flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-md border border-forest/30 px-3 py-2 text-center text-sm"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-md bg-forest px-3 py-2 text-center text-sm font-medium text-cream"
                >
                  Book a Room
                </Link>
              </div>
            )}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
