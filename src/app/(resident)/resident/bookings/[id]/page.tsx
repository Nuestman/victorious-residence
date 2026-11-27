import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingManagePanel } from "@/components/booking/booking-manage-panel";
import { PortalShell } from "@/components/portal-shell";
import { PaymentProofForm } from "@/components/resident/payment-proof-form";
import {
  MIN_RESERVATION_DEPOSIT_GHS,
  parseMoneyAmount,
} from "@/lib/booking";
import { expireBookingById } from "@/server/actions/bookings";
import { requireRole } from "@/server/auth/guards";
import {
  getBookingForResident,
  getUpgradeBedOptions,
} from "@/server/queries/bookings";

export const instant = false;

type BookingDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BookingDetailPage({
  params,
}: BookingDetailPageProps) {
  const { id } = await params;
  const session = await requireRole("RESIDENT", `/resident/bookings/${id}`);

  let booking = await getBookingForResident(id, session.user.id);
  if (!booking) {
    notFound();
  }

  if (
    booking.paymentStatus === "PENDING" &&
    !booking.receiptUrl &&
    booking.expiresAt.getTime() < Date.now()
  ) {
    await expireBookingById(booking.id, "booking.expire_on_view");
    booking = await getBookingForResident(id, session.user.id);
    if (!booking) {
      notFound();
    }
  }

  const canSubmitProof =
    booking.paymentStatus === "PENDING" &&
    !booking.receiptUrl &&
    booking.expiresAt.getTime() >= Date.now();

  const reserved =
    booking.paymentStatus === "PENDING" && Boolean(booking.receiptUrl);
  const paid = booking.amountPaid ? parseMoneyAmount(booking.amountPaid) : null;
  const full = parseMoneyAmount(booking.amount) ?? 0;
  const remaining =
    paid !== null ? Math.max(0, Math.round((full - paid) * 100) / 100) : null;

  const canManage =
    booking.paymentStatus === "PENDING" ||
    booking.paymentStatus === "SUCCESS";
  const upgradeOptions = canManage
    ? await getUpgradeBedOptions(booking.residenceId, booking.bedSpaceId)
    : [];

  return (
    <PortalShell
      title={`${booking.roomLabel}-${booking.bedLabel}`}
      description={`${booking.roomTypeName} · full price GHS ${booking.amount}`}
      userId={session.user.id}
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <Link
        href="/resident/bookings"
        className="text-sm text-stone-500 hover:text-stone-800"
      >
        ← My bookings
      </Link>

      <dl className="grid gap-3 border border-stone-200 px-4 py-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-stone-500">Status</dt>
          <dd className="font-medium text-stone-900">
            {booking.paymentStatus === "PENDING" && reserved
              ? "Deposit submitted — awaiting review"
              : booking.paymentStatus}
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">Bed status</dt>
          <dd className="font-medium text-stone-900">{booking.bedStatus}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Reservation</dt>
          <dd className="font-medium text-stone-900">
            {reserved || booking.paymentStatus === "SUCCESS"
              ? "Reserved (deposit on file)"
              : "Not reserved until GHS " +
                MIN_RESERVATION_DEPOSIT_GHS.toLocaleString("en-GH") +
                "+ deposit"}
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">
            {reserved ? "Application started" : "Apply by"}
          </dt>
          <dd className="font-medium text-stone-900">
            {reserved
              ? booking.createdAt.toLocaleString()
              : booking.expiresAt.toLocaleString()}
          </dd>
        </div>
        {booking.amountPaid ? (
          <div>
            <dt className="text-stone-500">Amount paid (claimed)</dt>
            <dd className="font-medium text-stone-900">
              GHS {booking.amountPaid}
              {remaining !== null && remaining > 0
                ? ` · balance GHS ${remaining.toFixed(2)}`
                : remaining === 0
                  ? " · paid in full"
                  : ""}
            </dd>
          </div>
        ) : null}
        {booking.paymentReference ? (
          <div>
            <dt className="text-stone-500">Payment reference</dt>
            <dd className="font-medium text-stone-900">
              {booking.paymentReference}
            </dd>
          </div>
        ) : null}
        {booking.reviewNote ? (
          <div className="sm:col-span-2">
            <dt className="text-stone-500">Review note</dt>
            <dd className="font-medium text-stone-900">{booking.reviewNote}</dd>
          </div>
        ) : null}
      </dl>

      {booking.receiptUrl ? (
        <section className="space-y-2">
          <h2 className="text-lg font-medium text-stone-900">Receipt on file</h2>
          {booking.receiptUrl.startsWith("data:image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={booking.receiptUrl}
              alt="Uploaded payment receipt"
              className="max-h-80 rounded border border-stone-200"
            />
          ) : (
            <p className="text-sm text-stone-600">
              Receipt uploaded
              {booking.receiptUrl.startsWith("data:application/pdf")
                ? " (PDF)"
                : ""}
              .
            </p>
          )}
        </section>
      ) : null}

      {canSubmitProof ? (
        <section className="max-w-lg space-y-4 rounded-lg border border-forest/25 bg-cream/60 p-5 sm:p-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.14em] text-brass uppercase">
              Next step
            </p>
            <h2 className="text-xl font-medium text-stone-900">
              Pay deposit to reserve
            </h2>
            <p className="text-sm text-stone-600">
              Pay at least GHS{" "}
              {MIN_RESERVATION_DEPOSIT_GHS.toLocaleString("en-GH")} by MoMo or
              bank transfer (non-refundable). The bed is only reserved after you
              submit this proof. Full price is GHS {booking.amount}.
            </p>
          </div>
          <PaymentProofForm
            bookingId={booking.id}
            fullAmount={booking.amount}
          />
        </section>
      ) : null}

      {canManage ? (
        <BookingManagePanel
          bookingId={booking.id}
          mode="resident"
          paymentStatus={booking.paymentStatus}
          hasDeposit={Boolean(booking.receiptUrl || booking.amountPaid)}
          isOccupied={
            booking.paymentStatus === "SUCCESS" ||
            booking.bedStatus === "OCCUPIED"
          }
          currentAmount={booking.amount}
          amountPaid={booking.amountPaid}
          upgradeOptions={upgradeOptions}
        />
      ) : null}
    </PortalShell>
  );
}
