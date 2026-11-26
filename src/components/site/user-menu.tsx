"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { PortalIcon } from "@/components/portal-icons";
import type { UserRole } from "@/server/db/schema";

import { UserAvatar } from "./user-avatar";

export type UserMenuUser = {
  name: string;
  email: string;
  role: UserRole;
  imageUrl?: string | null;
};

function roleLabel(role: UserRole): string {
  switch (role) {
    case "RESIDENT":
      return "Resident";
    case "STAFF":
      return "Staff";
    case "MANAGER":
      return "Manager";
    case "ADMIN":
      return "Admin";
    default: {
      const unreachable: never = role;
      return unreachable;
    }
  }
}

function MenuItemContent({
  icon,
  children,
}: {
  icon: "profile" | "portal" | "home" | "signOut";
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <PortalIcon name={icon} className="h-4 w-4 text-ink/70" />
      {children}
    </span>
  );
}

export function UserMenu({
  user,
  portalHref,
  tone = "cream",
}: {
  user: UserMenuUser;
  portalHref?: string;
  tone?: "cream" | "forest";
}) {
  const pathname = usePathname();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const label = roleLabel(user.role);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const triggerClass =
    tone === "forest"
      ? "border-cream/30 bg-cream/10 text-cream hover:bg-cream/20"
      : "border-ink/10 bg-white text-ink hover:bg-cream";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={`flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 ${triggerClass}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`${user.name} account menu`}
        onClick={() => setOpen((value) => !value)}
      >
        <UserAvatar name={user.name} imageUrl={user.imageUrl} />
        <span className="hidden max-w-36 truncate text-sm font-medium sm:inline">
          {user.name}
        </span>
        <PortalIcon
          name="chevronDown"
          className={`h-4 w-4 shrink-0 ${tone === "forest" ? "text-cream/80" : "text-ink/50"}`}
        />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border border-ink/10 bg-white text-ink shadow-lg"
        >
          <div className="flex items-center gap-3 border-b border-ink/10 px-3 py-3">
            <UserAvatar
              name={user.name}
              imageUrl={user.imageUrl}
              className="h-11 w-11 rounded-full"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-ink/60">{user.email}</p>
              <p className="text-xs tracking-wide text-brass uppercase">{label}</p>
            </div>
          </div>
          <div className="py-1">
            <Link
              href="/profile"
              role="menuitem"
              className="block px-3 py-2 text-sm hover:bg-cream"
              onClick={() => setOpen(false)}
            >
              <MenuItemContent icon="profile">Profile</MenuItemContent>
            </Link>
            {portalHref ? (
              <Link
                href={portalHref}
                role="menuitem"
                className="block px-3 py-2 text-sm hover:bg-cream"
                onClick={() => setOpen(false)}
              >
                <MenuItemContent icon="portal">Open portal</MenuItemContent>
              </Link>
            ) : (
              <Link
                href="/"
                role="menuitem"
                className="block px-3 py-2 text-sm hover:bg-cream"
                onClick={() => setOpen(false)}
              >
                <MenuItemContent icon="home">Public site</MenuItemContent>
              </Link>
            )}
            <SignOutButton className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-cream" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
