import Link from "next/link";
import { notFound } from "next/navigation";

import { ManagerNav } from "@/components/manager/manager-nav";
import { ReviewActionsForm } from "@/components/manager/review-actions-form";
import { PortalShell } from "@/components/portal-shell";
import { expireBookingById } from "@/server/actions/bookings";
import { requireRole } from "@/server/auth/guards";
import { getManagerBooking } from "@/server/queries/bookings";

export const instant = false;

type ManagerReviewDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ManagerReviewDetailPage({
  params,
}: ManagerReviewDetailPageProps) {
  const { id } = await params;
  const session = await requireRole("MANAGER", `/manager/reviews/${id}`);

  let booking = await getManagerBooking(id);
  if (!booking) {
    notFound();
  }

  if (
    booking.paymentStatus === "PENDING" &&
    booking.expiresAt.getTime() < Date.now()
  ) {
    await expireBookingById(booking.id, "booking.expire_on_manager_view");
    booking = await getManagerBooking(id);
    if (!booking) {
      notFound();
    }
  }

  const hasProof = Boolean(booking.receiptUrl && booking.paymentReference);
  const canReview = booking.paymentStatus === "PENDING";

  return (
    <PortalShell
      title={`${booking.roomLabel}-${booking.bedLabel}`}
      description={`${booking.roomTypeName} · GHS ${booking.amount}`}
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
    >
      <ManagerNav currentPath="/manager/reviews" />
      <Link
        href="/manager/reviews"
        className="text-sm text-stone-500 hover:text-stone-800"
      >
        ← Review queue
      </Link>

      <dl className="grid gap-3 border border-stone-200 px-4 py-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-stone-500">Resident</dt>
          <dd className="font-medium text-stone-900">{booking.residentName}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Contact</dt>
          <dd className="font-medium text-stone-900">
            {booking.residentEmail}
            {booking.residentPhone ? ` · ${booking.residentPhone}` : null}
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">Payment status</dt>
          <dd className="font-medium text-stone-900">{booking.paymentStatus}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Bed status</dt>
          <dd className="font-medium text-stone-900">{booking.bedStatus}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Payment reference</dt>
          <dd className="font-medium text-stone-900">
            {booking.paymentReference ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">Hold expires</dt>
          <dd className="font-medium text-stone-900">
            {booking.expiresAt.toLocaleString()}
          </dd>
        </div>
        {booking.reviewNote ? (
          <div className="sm:col-span-2">
            <dt className="text-stone-500">Review note</dt>
            <dd className="font-medium text-stone-900">{booking.reviewNote}</dd>
          </div>
        ) : null}
      </dl>

      {booking.receiptUrl ? (
        <section className="space-y-2">
          <h2 className="text-lg font-medium text-stone-900">Receipt</h2>
          {booking.receiptUrl.startsWith("data:image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={booking.receiptUrl}
              alt="Resident payment receipt"
              className="max-h-96 rounded border border-stone-200"
            />
          ) : booking.receiptUrl.startsWith("data:application/pdf") ? (
            <p className="text-sm text-stone-600">
              PDF receipt on file (embedded). Ask resident to resend as image if
              you need a visual check.
            </p>
          ) : (
            <p className="text-sm text-stone-600">Receipt on file.</p>
          )}
        </section>
      ) : (
        <p className="text-sm text-amber-800">
          No receipt uploaded yet. You can still reject the hold if needed.
        </p>
      )}

      {canReview ? (
        <section className="max-w-xl space-y-3">
          <h2 className="text-lg font-medium text-stone-900">Decision</h2>
          <ReviewActionsForm bookingId={booking.id} hasProof={hasProof} />
        </section>
      ) : (
        <p className="text-sm text-stone-600">
          This booking is already {booking.paymentStatus.toLowerCase()}.
        </p>
      )}
    </PortalShell>
  );
}
