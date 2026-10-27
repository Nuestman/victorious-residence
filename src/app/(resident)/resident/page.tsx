import { count } from "drizzle-orm";
import { Suspense } from "react";

import { PortalShell } from "@/components/portal-shell";
import { requireRole } from "@/server/auth/guards";
import { db } from "@/server/db";
import { bedSpaces } from "@/server/db/schema";
import { getAvailableBedsByRoomType } from "@/server/queries/availability";

export const instant = false;

async function ResidentContent() {
  const session = await requireRole("RESIDENT", "/resident");

  const availability = await getAvailableBedsByRoomType(
    session.user.residenceId ?? undefined,
  );
  const [{ totalBeds }] = await db
    .select({ totalBeds: count() })
    .from(bedSpaces);

  return (
    <PortalShell
      title="Resident portal"
      description="Browse room types, hold a bed, and upload proof of payment."
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <section className="space-y-3">
        <h2 className="text-lg font-medium text-stone-900">
          Available beds by room type
        </h2>
        <p className="text-sm text-stone-500">{totalBeds} bed spaces in inventory</p>
        <ul className="divide-y divide-stone-200 border border-stone-200">
          {availability.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
            >
              <div>
                <p className="font-medium text-stone-900">{row.name}</p>
                <p className="text-sm text-stone-500">
                  {row.capacity}-in-1 · GHS {row.pricePerBed} / bed
                </p>
              </div>
              <p className="text-sm font-medium text-stone-800">
                {row.availableBeds} available
              </p>
            </li>
          ))}
        </ul>
      </section>
    </PortalShell>
  );
}

export default function ResidentHomePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-5xl px-6 py-12 text-stone-500">
          Loading resident portal…
        </main>
      }
    >
      <ResidentContent />
    </Suspense>
  );
}
