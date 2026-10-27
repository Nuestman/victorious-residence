import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/register-form";
import { auth } from "@/server/auth";
import { defaultDestinationForRole } from "@/server/auth/roles";

export const instant = false;

async function RegisterContent() {
  const session = await auth();

  if (session?.user) {
    redirect(defaultDestinationForRole(session.user.role));
  }

  return (
    <>
      <div className="space-y-2">
        <Link href="/" className="text-sm text-stone-500 hover:text-stone-800">
          ← Home
        </Link>
        <h1 className="text-2xl font-semibold text-stone-900">
          Create resident account
        </h1>
        <p className="text-sm text-stone-600">
          Register to browse room types, hold a bed, and upload proof of
          payment.
        </p>
      </div>
      <RegisterForm />
    </>
  );
}

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-6 px-6 py-16">
      <Suspense fallback={<p className="text-sm text-stone-500">Loading…</p>}>
        <RegisterContent />
      </Suspense>
    </main>
  );
}
