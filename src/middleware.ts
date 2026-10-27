import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/server/auth/config";
import { hasMinimumRole } from "@/server/auth/roles";
import type { UserRole } from "@/server/db/schema";

const { auth } = NextAuth(authConfig);

const protectedMatchers: Array<{ prefix: string; minimumRole: UserRole }> = [
  { prefix: "/admin", minimumRole: "ADMIN" },
  { prefix: "/manager", minimumRole: "MANAGER" },
  { prefix: "/resident", minimumRole: "RESIDENT" },
];

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const rule = protectedMatchers.find((entry) =>
    pathname.startsWith(entry.prefix),
  );

  if (!rule) {
    return NextResponse.next();
  }

  const role = request.auth?.user?.role;

  if (!request.auth) {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!hasMinimumRole(role, rule.minimumRole)) {
    return NextResponse.redirect(new URL("/", request.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/manager/:path*", "/resident/:path*"],
};
