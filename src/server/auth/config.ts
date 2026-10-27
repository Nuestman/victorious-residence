import type { NextAuthConfig } from "next-auth";

import type { UserRole } from "@/server/db/schema";

declare module "next-auth" {
  interface User {
    role: UserRole;
    residenceId: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      residenceId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    residenceId: string | null;
  }
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
        session.user.role = token.role;
        session.user.residenceId = token.residenceId;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
