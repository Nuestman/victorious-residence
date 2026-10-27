"use client";

import Link from "next/link";
import { useActionState } from "react";

import { registerAction, type RegisterState } from "@/server/actions/auth";

const initialState: RegisterState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState,
  );

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-700">Full name</span>
          <input
            name="fullName"
            required
            minLength={2}
            autoComplete="name"
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none focus:border-stone-500"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-700">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none focus:border-stone-500"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-700">Phone</span>
          <input
            name="phone"
            type="tel"
            required
            minLength={8}
            autoComplete="tel"
            placeholder="+233..."
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
            autoComplete="new-password"
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none focus:border-stone-500"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-700">
            Confirm password
          </span>
          <input
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
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
          {pending ? "Creating account…" : "Create resident account"}
        </button>
      </form>

      <p className="text-sm text-stone-600">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-stone-900 underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
