import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";

type PortalShellProps = {
  title: string;
  description: string;
  userName: string;
  userEmail: string;
  role: string;
  children?: React.ReactNode;
};

export function PortalShell({
  title,
  description,
  userName,
  userEmail,
  role,
  children,
}: PortalShellProps) {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Link href="/" className="text-sm text-stone-500 hover:text-stone-800">
            ← Victorious Residence
          </Link>
          <h1 className="text-2xl font-semibold text-stone-900">{title}</h1>
          <p className="text-stone-600">{description}</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <div>
            <p className="font-medium text-stone-900">{userName}</p>
            <p className="text-sm text-stone-500">
              {userEmail} · {role}
            </p>
          </div>
          <SignOutButton />
        </div>
      </div>
      {children}
    </main>
  );
}
