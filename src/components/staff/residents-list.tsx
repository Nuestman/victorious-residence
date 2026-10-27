import Link from "next/link";

type ResidentRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  createdAt: Date;
  bookingCount: number;
  pendingCount: number;
  approvedCount: number;
  occupiedBed: string | null;
};

type ResidentsListProps = {
  residents: ResidentRow[];
  detailBasePath: string;
};

export function ResidentsList({
  residents,
  detailBasePath,
}: ResidentsListProps) {
  if (residents.length === 0) {
    return (
      <p className="text-sm text-stone-600">
        No residents registered yet. New applicants appear here after they
        create an account.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-stone-200 border border-stone-200">
      {residents.map((row) => (
        <li
          key={row.id}
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
        >
          <div>
            <p className="font-medium text-stone-900">{row.fullName}</p>
            <p className="text-sm text-stone-500">
              {row.email}
              {row.phone ? ` · ${row.phone}` : null}
            </p>
            <p className="mt-1 text-sm text-stone-500">
              {row.occupiedBed
                ? `Allocated: ${row.occupiedBed}`
                : "No active allocation"}
              {" · "}
              {row.bookingCount} booking{row.bookingCount === 1 ? "" : "s"}
              {row.pendingCount > 0 ? ` · ${row.pendingCount} pending` : null}
            </p>
          </div>
          <Link
            href={`${detailBasePath}/${row.id}`}
            className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-800"
          >
            View
          </Link>
        </li>
      ))}
    </ul>
  );
}
