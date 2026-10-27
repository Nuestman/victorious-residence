import type { DefaultSession } from "next-auth";
import type { DefaultJWT } from "@auth/core/jwt";

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
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role?: UserRole;
    residenceId?: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT extends DefaultJWT {
    role?: UserRole;
    residenceId?: string | null;
  }
}

export {};
