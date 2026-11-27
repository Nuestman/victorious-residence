import Link from "next/link";

import { BookingManagePanel } from "@/components/booking/booking-manage-panel";
import type { UpgradeBedOption } from "@/components/booking/upgrade-booking-form";
import { UserAvatar } from "@/components/site/user-avatar";
import { PaymentBalanceSummary } from "@/components/staff/payment-balance-summary";
import { PaymentReminderButton } from "@/components/staff/payment-reminder-button";
import { getPaymentBalance } from "@/lib/booking";

type ResidentDetailProps = {
  listHref: string;
  reviewBasePath?: string;
  resident: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    nationalId?: string | null;
    nationalIdImageUrl?: string | null;
    studentId?: string | null;
    studentIdImageUrl?: string | null;
    hometown?: string | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    avatarUrl?: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  activeAllocation: {
    bookingId: string;
    amount: string;
    amountPaid?: string | null;
    paymentStatus?: "PENDING" | "SUCCESS" | "FAILED";
    residenceId?: string;
    bedSpaceId?: string;
    roomLabel: string;
    bedLabel: string;
    roomTypeName: string;
    reviewedAt: Date | null;
  } | null;
  upgradeOptions?: UpgradeBedOption[];
  bookingHistory: Array<{
    id: string;
    amount: string;
    amountPaid?: string | null;
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
  upgradeOptions = [],
  bookingHistory,
}: ResidentDetailProps) {
  const allocationBalance = activeAllocation
    ? getPaymentBalance(activeAllocation.amount, activeAllocation.amountPaid)
    : null;

  return (
    <div className="space-y-8">
      <Link href={listHref} className="text-sm text-stone-500 hover:text-stone-800">
        ← All residents
      </Link>

      <div className="flex flex-wrap items-start gap-4">
        <UserAvatar
          name={resident.fullName}
          imageUrl={resident.avatarUrl}
          className="h-16 w-16 rounded-full object-cover"
        />
        <dl className="grid min-w-0 flex-1 gap-3 border border-stone-200 px-4 py-3 text-sm sm:grid-cols-2">
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
            <dt className="text-stone-500">Hometown</dt>
            <dd className="font-medium text-stone-900">
              {resident.hometown ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">National ID</dt>
            <dd className="font-medium text-stone-900">
              {resident.nationalId ?? "—"}
            </dd>
            {resident.nationalIdImageUrl ? (
              <dd className="mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resident.nationalIdImageUrl}
                  alt="National ID card"
                  className="max-h-36 rounded border border-stone-200 object-contain"
                />
              </dd>
            ) : null}
          </div>
          <div>
            <dt className="text-stone-500">Student ID</dt>
            <dd className="font-medium text-stone-900">
              {resident.studentId ?? "—"}
            </dd>
            {resident.studentIdImageUrl ? (
              <dd className="mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resident.studentIdImageUrl}
                  alt="Student ID card"
                  className="max-h-36 rounded border border-stone-200 object-contain"
                />
              </dd>
            ) : null}
          </div>
          <div>
            <dt className="text-stone-500">Emergency contact</dt>
            <dd className="font-medium text-stone-900">
              {resident.emergencyContactName || resident.emergencyContactPhone
                ? [
                    resident.emergencyContactName,
                    resident.emergencyContactPhone,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Registered</dt>
            <dd className="font-medium text-stone-900">
              {resident.createdAt.toLocaleString()}
            </dd>
          </div>
        </dl>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-stone-900">
          Current allocation
        </h2>
        {activeAllocation && allocationBalance ? (
          <div className="space-y-3 border border-stone-200 px-4 py-3 text-sm">
            <div>
              <p className="font-medium text-stone-900">
                {activeAllocation.roomTypeName} · {activeAllocation.roomLabel}-
                {activeAllocation.bedLabel}
              </p>
              <p className="text-stone-500">
                {activeAllocation.reviewedAt
                  ? `Approved ${activeAllocation.reviewedAt.toLocaleString()}`
                  : "Approved"}
              </p>
            </div>
            <PaymentBalanceSummary
              amount={activeAllocation.amount}
              amountPaid={activeAllocation.amountPaid}
            />
            {reviewBasePath ? (
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`${reviewBasePath}/${activeAllocation.bookingId}`}
                  className="text-sm font-medium text-stone-800 underline"
                >
                  Open booking
                </Link>
                <PaymentReminderButton
                  bookingId={activeAllocation.bookingId}
                  remaining={allocationBalance.remaining}
                  residentEmail={resident.email}
                />
              </div>
            ) : null}
            <BookingManagePanel
              bookingId={activeAllocation.bookingId}
              mode="staff"
              paymentStatus={activeAllocation.paymentStatus ?? "SUCCESS"}
              hasDeposit={Boolean(activeAllocation.amountPaid)}
              isOccupied
              currentAmount={activeAllocation.amount}
              amountPaid={activeAllocation.amountPaid}
              upgradeOptions={upgradeOptions}
            />
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
            {bookingHistory.map((row) => {
              const balance = getPaymentBalance(row.amount, row.amountPaid);
              return (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-stone-900">
                      {row.roomTypeName} · {row.roomLabel}-{row.bedLabel}
                    </p>
                    <p className="text-sm text-stone-500">
                      {statusLabel[row.paymentStatus]} ·{" "}
                      <PaymentBalanceSummary
                        amount={row.amount}
                        amountPaid={row.amountPaid}
                        compact
                      />
                    </p>
                    <p className="text-sm text-stone-500">
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
                    {reviewBasePath &&
                    row.paymentStatus !== "FAILED" &&
                    balance.remaining > 0 ? (
                      <div className="mt-2">
                        <PaymentReminderButton
                          bookingId={row.id}
                          remaining={balance.remaining}
                          residentEmail={resident.email}
                        />
                      </div>
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
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
