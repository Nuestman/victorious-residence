import type { NextAuthConfig } from "next-auth";

import type { UserRole } from "@/server/db/schema";

function isUserRole(value: unknown): value is UserRole {
  return value === "RESIDENT" || value === "MANAGER" || value === "ADMIN";
}

/** Edge-safe config used by middleware (no Node-only providers). */
export const authConfig = {
  providers: [],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.residenceId = user.residenceId;
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = isUserRole(token.role) ? token.role : "RESIDENT";
        session.user.residenceId =
          typeof token.residenceId === "string" || token.residenceId === null
            ? token.residenceId
            : null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
