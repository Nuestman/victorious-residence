import Link from "next/link";
import { and, count, eq } from "drizzle-orm";

import { ResidenceSwitcher } from "@/components/admin/residence-switcher";
import { PortalShell } from "@/components/portal-shell";
import {
  listActiveResidences,
  resolveAdminWorkingResidenceId,
} from "@/server/admin-residence";
import { requireAdmin } from "@/server/auth/guards";
import { db } from "@/server/db";
import { bedSpaces, rooms, roomTypes, users } from "@/server/db/schema";
import { getAvailableBedsByRoomType } from "@/server/queries/availability";
import { countNewContactInquiries } from "@/server/queries/contact-inquiries";

export const instant = false;

export default async function AdminHomePage() {
  const session = await requireAdmin("/admin");
  const residences = await listActiveResidences();
  const residenceId = await resolveAdminWorkingResidenceId();

  const [typeCount] = residenceId
    ? await db
        .select({ value: count() })
        .from(roomTypes)
        .where(eq(roomTypes.residenceId, residenceId))
    : [{ value: 0 }];
  const [roomCount] = residenceId
    ? await db
        .select({ value: count() })
        .from(rooms)
        .where(eq(rooms.residenceId, residenceId))
    : [{ value: 0 }];
  const [userCount] = residenceId
    ? await db
        .select({ value: count() })
        .from(users)
        .where(eq(users.residenceId, residenceId))
    : [{ value: 0 }];
  const [availableBeds] = residenceId
    ? await db
        .select({ value: count() })
        .from(bedSpaces)
        .innerJoin(rooms, eq(bedSpaces.roomId, rooms.id))
        .where(
          and(
            eq(rooms.residenceId, residenceId),
            eq(bedSpaces.status, "AVAILABLE"),
          ),
        )
    : [{ value: 0 }];

  const availability = await getAvailableBedsByRoomType(
    residenceId ?? undefined,
  );
  const newMessages = await countNewContactInquiries();

  const workingName =
    residences.find((row) => row.id === residenceId)?.name ?? null;

  return (
    <PortalShell
      title="Admin CMS"
      description="Manage campuses, inventory, residents, and staff."
      userId={session.user.id}
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <ResidenceSwitcher residences={residences} selectedId={residenceId} />
      {workingName ? (
        <p className="text-sm text-stone-600">
          Overview for <strong>{workingName}</strong>.
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Room types", value: typeCount.value },
          { label: "Rooms", value: roomCount.value },
          { label: "Available beds", value: availableBeds.value },
          { label: "Users (campus)", value: userCount.value },
          { label: "New messages", value: newMessages },
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
              href="/admin/residences"
              className="text-sm font-medium text-stone-800 underline"
            >
              Residences
            </Link>
            <Link
              href="/admin/staff"
              className="text-sm font-medium text-stone-800 underline"
            >
              Staff
            </Link>
            <Link
              href="/admin/room-types"
              className="text-sm font-medium text-stone-800 underline"
            >
              Manage types
            </Link>
            <Link
              href="/admin/inquiries"
              className="text-sm font-medium text-stone-800 underline"
            >
              Messages
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
          {availability.length === 0 ? (
            <li className="px-4 py-6 text-sm text-stone-600">
              No room types for this campus yet.
            </li>
          ) : null}
        </ul>
      </section>
    </PortalShell>
  );
}
