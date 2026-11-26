import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { auth } from "@/server/auth";
import { defaultDestinationForRole } from "@/server/auth/roles";
import { duringRequest } from "@/server/db/request";

export const instant = false;

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

async function LoginContent({ searchParams }: LoginPageProps) {
  await duringRequest();
  const session = await auth();
  const params = await searchParams;
  const callbackUrl =
    params.callbackUrl &&
    params.callbackUrl.startsWith("/") &&
    !params.callbackUrl.startsWith("//")
      ? params.callbackUrl
      : undefined;

  if (session?.user) {
    redirect(callbackUrl ?? defaultDestinationForRole(session.user.role));
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-4xl text-ink">Sign in</h1>
        <p className="text-sm text-ink/75">
          Residents, managers, and admins sign in here. New applicants can{" "}
          <Link href="/register" className="font-medium text-forest underline">
            create a resident account
          </Link>
          .
        </p>
      </div>
      <LoginForm callbackUrl={callbackUrl} />
    </div>
  );
}

export default function LoginPage(props: LoginPageProps) {
  return (
    <Suspense fallback={<p className="text-sm text-ink/60">Loading…</p>}>
      <LoginContent {...props} />
    </Suspense>
  );
}
