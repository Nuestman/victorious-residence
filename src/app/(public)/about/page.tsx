import type { Metadata } from "next";
import Link from "next/link";

import { MIN_RESERVATION_DEPOSIT_GHS } from "@/lib/booking";
import { getPublicShowcase } from "@/server/queries/showcase";

export const instant = false;

export const metadata: Metadata = {
  title: "About",
};

export default async function AboutPage() {
  const showcase = await getPublicShowcase();
  const name = showcase?.residence.name ?? "Victorious Residence";
  const minDeposit = MIN_RESERVATION_DEPOSIT_GHS.toLocaleString("en-GH");

  return (
    <main className="mx-auto w-full max-w-3xl space-y-10 px-4 py-12 sm:px-6">
      <div className="space-y-3">
        <p className="text-sm tracking-[0.18em] text-brass uppercase">About</p>
        <h1 className="font-display text-5xl">{name}</h1>
        <p className="text-lg leading-8 text-ink/80">
          {showcase?.residence.description ??
            "A student hostel in Obuasi made for university life — a place that feels like home."}
        </p>
      </div>
      <section className="space-y-3">
        <h2 className="font-display text-3xl">Who it’s for</h2>
        <p className="leading-7 text-ink/80">
          University students who want somewhere calm and comfortable, with quiet study spaces, and dependable Wi-Fi throughout the entire building, to live
          while they study.
        </p>
      </section>
      
      <section className="space-y-3">
        <h2 className="font-display text-3xl">Paying for your stay</h2>
        <p className="leading-7 text-ink/80">
          Choose a bed online, then pay a non-refundable deposit of at least GHS{" "}
          {minDeposit} by MoMo or bank transfer and upload your receipt. That
          deposit is what reserves your bed. A manager confirms the payment; any
          remaining balance is settled afterward.
        </p>
      </section>
      <Link
        href="/rooms"
        className="inline-block rounded-md bg-forest px-5 py-2.5 text-sm font-medium text-cream"
      >
        Browse rooms
      </Link>
    </main>
  );
}
