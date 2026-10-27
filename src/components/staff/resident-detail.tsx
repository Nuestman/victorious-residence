import Link from "next/link";

type ResidentDetailProps = {
  listHref: string;
  reviewBasePath?: string;
  resident: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  activeAllocation: {
    bookingId: string;
    amount: string;
    roomLabel: string;
    bedLabel: string;
    roomTypeName: string;
    reviewedAt: Date | null;
  } | null;
  bookingHistory: Array<{
    id: string;
    amount: string;
    paymentStatus: "PENDING" | "SUCCESS" | "FAILED";
    paymentReference: string | null;
    expiresAt: Date;
    createdAt: Date;
    reviewedAt: Date | null;
    reviewNote: string | null;
    bedLabel: string;
    bedStatus: string;
    roomLabel: string;
    roomTypeName: string;
  }>;
};

const statusLabel = {
  PENDING: "Pending",
  SUCCESS: "Approved",
  FAILED: "Failed / rejected",
} as const;

export function ResidentDetail({
  listHref,
  reviewBasePath,
  resident,
  activeAllocation,
  bookingHistory,
}: ResidentDetailProps) {
  return (
    <div className="space-y-8">
      <Link href={listHref} className="text-sm text-stone-500 hover:text-stone-800">
        ← All residents
      </Link>

      <dl className="grid gap-3 border border-stone-200 px-4 py-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-stone-500">Full name</dt>
          <dd className="font-medium text-stone-900">{resident.fullName}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Email</dt>
          <dd className="font-medium text-stone-900">{resident.email}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Phone</dt>
          <dd className="font-medium text-stone-900">
            {resident.phone ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">Registered</dt>
          <dd className="font-medium text-stone-900">
            {resident.createdAt.toLocaleString()}
          </dd>
        </div>
      </dl>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-stone-900">
          Current allocation
        </h2>
        {activeAllocation ? (
          <div className="border border-stone-200 px-4 py-3 text-sm">
            <p className="font-medium text-stone-900">
              {activeAllocation.roomTypeName} · {activeAllocation.roomLabel}-
              {activeAllocation.bedLabel}
            </p>
            <p className="text-stone-500">
              GHS {activeAllocation.amount}
              {activeAllocation.reviewedAt
                ? ` · approved ${activeAllocation.reviewedAt.toLocaleString()}`
                : null}
            </p>
            {reviewBasePath ? (
              <Link
                href={`${reviewBasePath}/${activeAllocation.bookingId}`}
                className="mt-2 inline-block text-sm font-medium text-stone-800 underline"
              >
                Open booking
              </Link>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-stone-600">No occupied bed assigned.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-stone-900">Booking history</h2>
        {bookingHistory.length === 0 ? (
          <p className="text-sm text-stone-600">No bookings yet.</p>
        ) : (
          <ul className="divide-y divide-stone-200 border border-stone-200">
            {bookingHistory.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-stone-900">
                    {row.roomTypeName} · {row.roomLabel}-{row.bedLabel}
                  </p>
                  <p className="text-sm text-stone-500">
                    {statusLabel[row.paymentStatus]} · GHS {row.amount} ·{" "}
                    {row.createdAt.toLocaleString()}
                    {row.paymentReference
                      ? ` · ref ${row.paymentReference}`
                      : null}
                  </p>
                  {row.reviewNote ? (
                    <p className="mt-1 text-sm text-stone-500">
                      Note: {row.reviewNote}
                    </p>
                  ) : null}
                </div>
                {reviewBasePath ? (
                  <Link
                    href={`${reviewBasePath}/${row.id}`}
                    className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-800"
                  >
                    Open
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
