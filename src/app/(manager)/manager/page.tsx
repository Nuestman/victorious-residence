import { count, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { PortalShell } from "@/components/portal-shell";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { bedSpaces, bookings } from "@/server/db/schema";

export const instant = false;

async function ManagerContent() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/manager");
  }

  const [available] = await db
    .select({ value: count() })
    .from(bedSpaces)
    .where(eq(bedSpaces.status, "AVAILABLE"));
  const [pending] = await db
    .select({ value: count() })
    .from(bedSpaces)
    .where(eq(bedSpaces.status, "PENDING_PAYMENT"));
  const [occupied] = await db
    .select({ value: count() })
    .from(bedSpaces)
    .where(eq(bedSpaces.status, "OCCUPIED"));
  const [pendingReviews] = await db
    .select({ value: count() })
    .from(bookings)
    .where(eq(bookings.paymentStatus, "PENDING"));

  return (
    <PortalShell
      title="Manager panel"
      description="Review payment proofs and approve or reject bed assignments."
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Available beds", value: available.value },
          { label: "Pending payment", value: pending.value },
          { label: "Occupied", value: occupied.value },
          { label: "Review queue", value: pendingReviews.value },
        ].map((stat) => (
          <div key={stat.label} className="border border-stone-200 px-4 py-3">
            <p className="text-sm text-stone-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-stone-900">
              {stat.value}
            </p>
          </div>
        ))}
      </section>
      <p className="text-sm text-stone-500">
        Approve/reject queue UI comes next. Counts above are live from Neon.
      </p>
    </PortalShell>
  );
}

export default function ManagerHomePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-5xl px-6 py-12 text-stone-500">
          Loading manager panel…
        </main>
      }
    >
      <ManagerContent />
    </Suspense>
  );
}
