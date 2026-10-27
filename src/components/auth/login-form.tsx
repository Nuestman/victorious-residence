"use client";

import { useActionState } from "react";

import { loginAction, type LoginState } from "@/server/actions/auth";

const initialState: LoginState = {};

const demoAccounts = [
  { email: "admin@victorious.local", role: "ADMIN" },
  { email: "manager@victorious.local", role: "MANAGER" },
  { email: "resident@victorious.local", role: "RESIDENT" },
] as const;

type LoginFormProps = {
  callbackUrl?: string;
};

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        {callbackUrl ? (
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
        ) : null}

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-700">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue="resident@victorious.local"
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none focus:border-stone-500"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-700">Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            defaultValue="ChangeMe123!"
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none focus:border-stone-500"
          />
        </label>

        {state.error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm text-stone-600">
        <p className="font-medium text-stone-800">Demo accounts</p>
        <p className="mt-1">Password for all: <code>ChangeMe123!</code></p>
        <ul className="mt-2 space-y-1">
          {demoAccounts.map((account) => (
            <li key={account.email}>
              <code>{account.email}</code> · {account.role}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
