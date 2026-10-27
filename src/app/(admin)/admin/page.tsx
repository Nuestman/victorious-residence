import Link from "next/link";
import { count, eq } from "drizzle-orm";

import { AdminNav } from "@/components/admin/admin-nav";
import { PortalShell } from "@/components/portal-shell";
import { requireAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { bedSpaces, roomTypes, rooms, users } from "@/server/db/schema";
import { getAvailableBedsByRoomType } from "@/server/queries/availability";

export const instant = false;

export default async function AdminHomePage() {
  const session = await requireAdmin("/admin");

  const [typeCount] = await db.select({ value: count() }).from(roomTypes);
  const [roomCount] = await db.select({ value: count() }).from(rooms);
  const [userCount] = await db.select({ value: count() }).from(users);
  const [availableBeds] = await db
    .select({ value: count() })
    .from(bedSpaces)
    .where(eq(bedSpaces.status, "AVAILABLE"));

  const availability = await getAvailableBedsByRoomType(
    session.user.residenceId ?? undefined,
  );

  return (
    <PortalShell
      title="Admin CMS"
      description="Define room types and provision rooms and bed spaces."
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <AdminNav currentPath="/admin" />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Room types", value: typeCount.value },
          { label: "Rooms", value: roomCount.value },
          { label: "Available beds", value: availableBeds.value },
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-medium text-stone-900">Availability</h2>
          <div className="flex gap-2">
            <Link
              href="/admin/room-types"
              className="text-sm font-medium text-stone-800 underline"
            >
              Manage types
            </Link>
            <Link
              href="/admin/provision"
              className="text-sm font-medium text-stone-800 underline"
            >
              Provision rooms
            </Link>
          </div>
        </div>
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
                {row.availableBeds} / {row.totalBeds} available
              </p>
            </li>
          ))}
        </ul>
      </section>
    </PortalShell>
  );
}
