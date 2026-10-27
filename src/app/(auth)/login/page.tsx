import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { auth } from "@/server/auth";
import { defaultDestinationForRole } from "@/server/auth/roles";

export const instant = false;

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

async function LoginContent({ searchParams }: LoginPageProps) {
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
    <>
      <div className="space-y-2">
        <Link href="/" className="text-sm text-stone-500 hover:text-stone-800">
          ← Home
        </Link>
        <h1 className="text-2xl font-semibold text-stone-900">Sign in</h1>
        <p className="text-sm text-stone-600">
          Use a seeded demo account to open the resident, manager, or admin
          portals.
        </p>
      </div>
      <LoginForm callbackUrl={callbackUrl} />
    </>
  );
}

export default function LoginPage(props: LoginPageProps) {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-6 px-6 py-16">
      <Suspense fallback={<p className="text-sm text-stone-500">Loading…</p>}>
        <LoginContent {...props} />
      </Suspense>
    </main>
  );
}
