"use client";

import { useFormStatus } from "react-dom";

import { PortalIcon } from "@/components/portal-icons";
import { signOutAction } from "@/server/actions/auth";

function SubmitLabel() {
  const { pending } = useFormStatus();
  return (
    <>
      <PortalIcon name="signOut" className="h-4 w-4 text-ink/70" />
      {pending ? "Signing out…" : "Sign out"}
    </>
  );
}

export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOutAction} className="block w-full">
      <button
        type="submit"
        className={
          className ??
          "inline-flex items-center gap-2 rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-800"
        }
      >
        <SubmitLabel />
      </button>
    </form>
  );
}
