"use client";

import { useFormStatus } from "react-dom";

import { signOutAction } from "@/server/actions/auth";

function SubmitLabel() {
  const { pending } = useFormStatus();
  return <>{pending ? "Signing out…" : "Sign out"}</>;
}

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-800"
      >
        <SubmitLabel />
      </button>
    </form>
  );
}
