"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  pageIconForPath,
  PortalIcon,
} from "@/components/portal-icons";
import {
  isPortalLinkActive,
  type PortalLink,
} from "@/components/portal-nav";
import { UserMenu } from "@/components/site/user-menu";
import { formatAppVersion } from "@/lib/version";
import type { UserRole } from "@/server/db/schema";

type AppChromeProps = {
  title: string;
  description: string;
  userName: string;
  userEmail: string;
  role: UserRole;
  links: PortalLink[];
  children?: React.ReactNode;
};

function SideNav({
  links,
  pathname,
  onNavigate,
}: {
  links: PortalLink[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1 p-3">
      {links.map((link) => {
        const active = isPortalLinkActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={
              active
                ? "flex items-center gap-2.5 rounded-md bg-forest px-3 py-2 text-sm font-medium text-cream"
                : "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink hover:bg-cream"
            }
          >
            <PortalIcon name={link.icon} className="h-4 w-4 shrink-0 opacity-90" />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppChrome({
  title,
  description,
  userName,
  userEmail,
  role,
  links,
  children,
}: AppChromeProps) {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(72);
  const titleIcon = pageIconForPath(pathname);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) {
      return;
    }

    const syncHeight = () => {
      setHeaderHeight(Math.ceil(header.getBoundingClientRect().height));
    };

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(header);
    window.addEventListener("resize", syncHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncHeight);
    };
  }, []);

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-cream text-ink">
      <header
        ref={headerRef}
        className="sticky top-0 z-40 border-b border-cream/10 bg-forest text-cream"
      >
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-cream/30 px-3 py-1.5 text-sm md:hidden"
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              <PortalIcon name={open ? "close" : "menu"} className="h-4 w-4" />
              {open ? "Close" : "Menu"}
            </button>
            <div>
              <Link href="/" className="font-display text-xl">
                Victorious Residence
              </Link>
              <p className="text-xs tracking-wide text-brass uppercase">
                {role} portal
              </p>
            </div>
          </div>
          <UserMenu
            tone="forest"
            user={{ name: userName, email: userEmail, role }}
          />
        </div>
      </header>

      <div className="flex flex-1">
        <aside
          className="sticky z-30 hidden w-56 shrink-0 self-start border-r border-ink/10 bg-white md:flex md:flex-col"
          style={{
            top: headerHeight,
            height: `calc(100dvh - ${headerHeight}px)`,
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            <SideNav links={links} pathname={pathname} />
          </div>
          <div className="border-t border-ink/10 px-3 py-3">
            <p className="text-xs text-ink/50">Victorious Residence</p>
            <p className="font-mono text-xs text-ink/70">{formatAppVersion()}</p>
          </div>
        </aside>
        {open ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-ink/40"
              onClick={() => setOpen(false)}
            />
            <aside className="relative flex h-full w-64 flex-col bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-ink/60">{userEmail}</p>
                </div>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="rounded-md border border-ink/15 p-2 text-ink"
                  onClick={() => setOpen(false)}
                >
                  <PortalIcon name="close" className="h-4 w-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <SideNav
                  links={links}
                  pathname={pathname}
                  onNavigate={() => setOpen(false)}
                />
              </div>
              <div className="border-t border-ink/10 px-4 py-3">
                <p className="text-xs text-ink/50">Victorious Residence</p>
                <p className="font-mono text-xs text-ink/70">
                  {formatAppVersion()}
                </p>
              </div>
            </aside>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
            <div className="space-y-2">
              <h1 className="flex items-center gap-3 font-display text-3xl text-ink">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-forest/10 text-forest">
                  <PortalIcon name={titleIcon} className="h-5 w-5" />
                </span>
                {title}
              </h1>
              <p className="max-w-3xl text-ink/75">{description}</p>
            </div>
            {children}
          </main>

          <footer className="border-t border-ink/10 bg-white px-4 py-4 text-sm text-ink/70 sm:px-6">
            <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2">
              <p>
                Victorious Residence · {role.toLowerCase()} tools ·{" "}
                <span className="font-mono">{formatAppVersion()}</span>
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 font-medium text-forest"
              >
                <PortalIcon name="home" className="h-4 w-4" />
                Public site
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
