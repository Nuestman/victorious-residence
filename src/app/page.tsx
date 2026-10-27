import Link from "next/link";
import { Suspense } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { auth } from "@/server/auth";

export const instant = false;

async function HomeAuthActions() {
  const session = await auth();

  if (session?.user) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-stone-200 bg-stone-50 px-4 py-3">
        <p className="text-sm text-stone-700">
          Signed in as <strong>{session.user.name}</strong> ({session.user.role})
        </p>
        <Link
          href={
            session.user.role === "ADMIN"
              ? "/admin"
              : session.user.role === "MANAGER"
                ? "/manager"
                : "/resident"
          }
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          Open portal
        </Link>
        <SignOutButton />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href="/login"
        className="rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white"
      >
        Sign in
      </Link>
      <Link
        href="/login?callbackUrl=/resident"
        className="rounded-md border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-800"
      >
        Resident portal
      </Link>
      <Link
        href="/login?callbackUrl=/manager"
        className="rounded-md border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-800"
      >
        Manager panel
      </Link>
      <Link
        href="/login?callbackUrl=/admin"
        className="rounded-md border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-800"
      >
        Admin CMS
      </Link>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-10 px-6 py-16">
      <div className="space-y-4">
        <p className="text-sm font-medium tracking-[0.2em] text-stone-500 uppercase">
          Victorious Residence
        </p>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
          Hostel inventory, bookings, and payment review — one system.
        </h1>
        <p className="max-w-xl text-lg text-stone-600">
          Public availability, resident proof-of-payment uploads, and manager
          approval workflows on a flexible room-type model.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="h-10 w-40 animate-pulse rounded-md bg-stone-100" />
        }
      >
        <HomeAuthActions />
      </Suspense>

      <p className="text-sm text-stone-500">
        Demo password: <code className="rounded bg-stone-100 px-1">ChangeMe123!</code>
        {" · "}
        <code className="rounded bg-stone-100 px-1">admin@victorious.local</code>
        {" / "}
        <code className="rounded bg-stone-100 px-1">manager@victorious.local</code>
        {" / "}
        <code className="rounded bg-stone-100 px-1">resident@victorious.local</code>
      </p>
    </main>
  );
}
