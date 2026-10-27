import Link from "next/link";
import { notFound } from "next/navigation";

import { PortalShell } from "@/components/portal-shell";
import { PaymentProofForm } from "@/components/resident/payment-proof-form";
import { ResidentNav } from "@/components/resident/resident-nav";
import { requireRole } from "@/server/auth/guards";
import { expireBookingById } from "@/server/actions/bookings";
import { getBookingForResident } from "@/server/queries/bookings";

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
    booking.expiresAt.getTime() >= Date.now();

  return (
    <PortalShell
      title={`${booking.roomLabel}-${booking.bedLabel}`}
      description={`${booking.roomTypeName} · GHS ${booking.amount}`}
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <ResidentNav currentPath="/resident/bookings" />
      <Link
        href="/resident/bookings"
        className="text-sm text-stone-500 hover:text-stone-800"
      >
        ← My bookings
      </Link>

      <dl className="grid gap-3 border border-stone-200 px-4 py-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-stone-500">Status</dt>
          <dd className="font-medium text-stone-900">{booking.paymentStatus}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Bed status</dt>
          <dd className="font-medium text-stone-900">{booking.bedStatus}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Hold expires</dt>
          <dd className="font-medium text-stone-900">
            {booking.expiresAt.toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">Created</dt>
          <dd className="font-medium text-stone-900">
            {booking.createdAt.toLocaleString()}
          </dd>
        </div>
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
        <section className="max-w-lg space-y-3">
          <h2 className="text-lg font-medium text-stone-900">
            Upload proof of payment
          </h2>
          <p className="text-sm text-stone-600">
            Pay via MoMo or bank transfer for GHS {booking.amount}, then enter
            the reference and upload your receipt screenshot.
          </p>
          <PaymentProofForm bookingId={booking.id} />
        </section>
      ) : null}
    </PortalShell>
  );
}
