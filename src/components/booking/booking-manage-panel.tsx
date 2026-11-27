import { CancelBookingForm } from "@/components/booking/cancel-booking-form";
import {
  UpgradeBookingForm,
  type UpgradeBedOption,
} from "@/components/booking/upgrade-booking-form";

type BookingManagePanelProps = {
  bookingId: string;
  mode: "resident" | "staff";
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED";
  hasDeposit: boolean;
  isOccupied: boolean;
  currentAmount: string;
  amountPaid?: string | null;
  upgradeOptions: UpgradeBedOption[];
};

export function BookingManagePanel({
  bookingId,
  mode,
  paymentStatus,
  hasDeposit,
  isOccupied,
  currentAmount,
  amountPaid,
  upgradeOptions,
}: BookingManagePanelProps) {
  if (paymentStatus === "FAILED") {
    return null;
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-medium text-stone-900">
          {mode === "staff" ? "Manage booking" : "Manage your booking"}
        </h2>
        <p className="text-sm text-stone-600">
          Cancel to release the bed, or move to another available room on this
          campus.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <UpgradeBookingForm
          bookingId={bookingId}
          mode={mode}
          currentAmount={currentAmount}
          amountPaid={amountPaid}
          options={upgradeOptions}
        />
        <CancelBookingForm
          bookingId={bookingId}
          mode={mode}
          hasDeposit={hasDeposit}
          isOccupied={isOccupied}
        />
      </div>
    </section>
  );
}
