import type { Metadata } from "next";
import Link from "next/link";

import { ContactActions } from "@/components/site/contact-actions";
import { ContactForm } from "@/components/site/contact-form";
import { getPublicShowcase } from "@/server/queries/showcase";

export const instant = false;

export const metadata: Metadata = {
  title: "Contact",
};

export default async function ContactPage() {
  const showcase = await getPublicShowcase();
  const residence = showcase?.residence;
  const name = residence?.name ?? "Victorious Residence";
  const address = residence?.address ?? "Obuasi, Ghana";

  return (
    <main>
      <section className="relative overflow-hidden bg-forest">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f6f1e8' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col justify-end px-4 pb-10 pt-16 sm:px-6 sm:pb-12 sm:pt-20">
          <p className="text-sm tracking-[0.22em] text-brass uppercase">
            Contact
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl leading-tight text-cream sm:text-6xl">
            {name}
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-7 text-cream/85">
            Ask about rooms, availability, or a visit — we’ll get back to you.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16 lg:py-16">
        <div>
          <p className="text-sm tracking-[0.16em] text-brass uppercase">
            Write to us
          </p>
          <h2 className="mt-2 font-display text-4xl text-ink">Send a message</h2>
          <p className="mt-3 max-w-lg text-ink/70">
            Tell us what you need. Prefer a call or WhatsApp? Use the details on
            the right.
          </p>
          <div className="mt-8">
            <ContactForm />
          </div>
        </div>

        <aside className="space-y-10 lg:pt-2">
          <div className="space-y-3">
            <p className="text-sm tracking-[0.16em] text-brass uppercase">
              Visit
            </p>
            <p className="font-display text-3xl text-ink">{address}</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm tracking-[0.16em] text-brass uppercase">
              Reach us
            </p>
            <ContactActions />
          </div>

          <div className="space-y-4 border-t border-forest/15 pt-8">
            <p className="text-sm tracking-[0.16em] text-brass uppercase">
              Ready to book?
            </p>
            <p className="text-sm leading-6 text-ink/70">
              Create an account to check live beds and reserve with a
              non-refundable GHS 1,000+ deposit.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-md bg-forest px-5 py-2.5 text-sm font-medium text-cream"
              >
                Register
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-forest/30 px-5 py-2.5 text-sm font-medium text-forest"
              >
                Sign in
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
