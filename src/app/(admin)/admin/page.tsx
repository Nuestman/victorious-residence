import { count, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { PortalShell } from "@/components/portal-shell";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { roomTypes, rooms, users } from "@/server/db/schema";

export const instant = false;

async function AdminContent() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }

  const [typeCount] = await db.select({ value: count() }).from(roomTypes);
  const [roomCount] = await db.select({ value: count() }).from(rooms);
  const [userCount] = await db.select({ value: count() }).from(users);
  const types = await db
    .select({
      id: roomTypes.id,
      name: roomTypes.name,
      capacity: roomTypes.capacity,
      pricePerBed: roomTypes.pricePerBed,
      isActive: roomTypes.isActive,
    })
    .from(roomTypes)
    .where(eq(roomTypes.isActive, true))
    .orderBy(roomTypes.sortOrder);

  return (
    <PortalShell
      title="Admin CMS"
      description="Define room types and provision rooms and bed spaces."
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Room types", value: typeCount.value },
          { label: "Rooms", value: roomCount.value },
          { label: "Users", value: userCount.value },
        ].map((stat) => (
          <div key={stat.label} className="border border-stone-200 px-4 py-3">
            <p className="text-sm text-stone-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-stone-900">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-stone-900">Room types</h2>
        <ul className="divide-y divide-stone-200 border border-stone-200">
          {types.map((type) => (
            <li
              key={type.id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
            >
              <div>
                <p className="font-medium text-stone-900">{type.name}</p>
                <p className="text-sm text-stone-500">
                  Capacity {type.capacity} · GHS {type.pricePerBed} / bed
                </p>
              </div>
              <span className="text-xs tracking-wide text-stone-500 uppercase">
                {type.isActive ? "Active" : "Inactive"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </PortalShell>
  );
}

export default function AdminHomePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-5xl px-6 py-12 text-stone-500">
          Loading admin CMS…
        </main>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
