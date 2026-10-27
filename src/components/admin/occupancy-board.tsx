import type { BedSpaceStatus } from "@/server/db/schema";

type OccupancyBoardProps = {
  rooms: Array<{
    roomId: string;
    roomLabel: string;
    floor: number | null;
    roomTypeName: string;
    beds: Array<{
      id: string;
      label: string;
      status: BedSpaceStatus;
    }>;
  }>;
};

const statusStyles: Record<BedSpaceStatus, string> = {
  AVAILABLE: "border-emerald-300 bg-emerald-50 text-emerald-900",
  PENDING_PAYMENT: "border-amber-300 bg-amber-50 text-amber-900",
  OCCUPIED: "border-stone-400 bg-stone-200 text-stone-800",
};

export function OccupancyBoard({ rooms }: OccupancyBoardProps) {
  if (rooms.length === 0) {
    return (
      <p className="text-sm text-stone-600">
        No rooms yet. Provision rooms from a room type to populate this board.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-xs text-stone-600">
        <span className="rounded border border-emerald-300 bg-emerald-50 px-2 py-1">
          Available
        </span>
        <span className="rounded border border-amber-300 bg-amber-50 px-2 py-1">
          Pending payment
        </span>
        <span className="rounded border border-stone-400 bg-stone-200 px-2 py-1">
          Occupied
        </span>
      </div>

      <ul className="space-y-3">
        {rooms.map((room) => (
          <li
            key={room.roomId}
            className="border border-stone-200 px-4 py-3"
          >
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="font-medium text-stone-900">{room.roomLabel}</p>
                <p className="text-sm text-stone-500">
                  {room.roomTypeName}
                  {room.floor != null ? ` · Floor ${room.floor}` : null}
                </p>
              </div>
              <p className="text-sm text-stone-500">
                {room.beds.length} bed
                {room.beds.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {room.beds.map((bed) => (
                <span
                  key={bed.id}
                  className={`rounded border px-2.5 py-1 text-sm font-medium ${statusStyles[bed.status]}`}
                  title={bed.status}
                >
                  {bed.label}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
