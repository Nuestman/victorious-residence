"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  submitContactInquiryAction,
  type ContactFormState,
} from "@/server/actions/contact";

const initialState: ContactFormState = {};

const fieldClass =
  "w-full border-0 border-b border-forest/25 bg-transparent px-0 py-2.5 text-ink outline-none transition focus:border-forest";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(
    submitContactInquiryAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium tracking-[0.12em] text-ink/55 uppercase">
            Full name
          </span>
          <input
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            className={fieldClass}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium tracking-[0.12em] text-ink/55 uppercase">
            Email
          </span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className={fieldClass}
          />
        </label>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium tracking-[0.12em] text-ink/55 uppercase">
            Phone
            <span className="normal-case tracking-normal text-ink/40">
              {" "}
              (optional)
            </span>
          </span>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={40}
            className={fieldClass}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium tracking-[0.12em] text-ink/55 uppercase">
            Subject
            <span className="normal-case tracking-normal text-ink/40">
              {" "}
              (optional)
            </span>
          </span>
          <input name="subject" type="text" maxLength={160} className={fieldClass} />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium tracking-[0.12em] text-ink/55 uppercase">
          Message
        </span>
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={4000}
          rows={6}
          className={`${fieldClass} resize-y`}
        />
      </label>

      {state.error ? (
        <p className="text-sm text-red-700">{state.error}</p>
      ) : null}

      {state.success ? (
        <p className="text-sm text-forest">{state.success}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-forest px-6 py-3 text-sm font-medium text-cream disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
