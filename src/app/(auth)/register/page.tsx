import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/register-form";
import { auth } from "@/server/auth";
import { defaultDestinationForRole } from "@/server/auth/roles";
import { duringRequest } from "@/server/db/request";

export const instant = false;

async function RegisterContent() {
  await duringRequest();
  const session = await auth();

  if (session?.user) {
    redirect(defaultDestinationForRole(session.user.role));
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-4xl text-ink">
          Create your account
        </h1>
        <p className="text-sm text-ink/75">
          Sign up to browse and book a room. Already registered?{" "}
          <Link href="/login" className="font-medium text-forest underline">
            Sign in
          </Link>
          .
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink/60">Loading…</p>}>
      <RegisterContent />
    </Suspense>
  );
}
