"use client";

import { useActionState } from "react";

import { ActionStatus } from "@/components/admin/action-status";
import {
  provisionRoomsAction,
  type InventoryActionState,
} from "@/server/actions/inventory";

const initialState: InventoryActionState = {};

type RoomTypeOption = {
  id: string;
  name: string;
  capacity: number;
  pricePerBed: string;
};

type ProvisionRoomsFormProps = {
  roomTypes: RoomTypeOption[];
};

export function ProvisionRoomsForm({ roomTypes }: ProvisionRoomsFormProps) {
  const [state, formAction, pending] = useActionState(
    provisionRoomsAction,
    initialState,
  );

  if (roomTypes.length === 0) {
    return (
      <p className="text-sm text-stone-600">
        Create an active room type before provisioning rooms.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-stone-700">Room type</span>
        <select
          name="roomTypeId"
          required
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"
          defaultValue={roomTypes[0]?.id}
        >
          {roomTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name} · {type.capacity}-in-1 · GHS {type.pricePerBed}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-700">
            How many rooms
          </span>
          <input
            name="count"
            type="number"
            min={1}
            max={50}
            required
            defaultValue={2}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-700">Label prefix</span>
          <input
            name="labelPrefix"
            required
            defaultValue="R"
            maxLength={8}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-700">
            Start number
          </span>
          <input
            name="startNumber"
            type="number"
            min={1}
            required
            defaultValue={1}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-700">
            Floor (optional)
          </span>
          <input
            name="floor"
            type="number"
            min={0}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"
          />
        </label>
      </div>

      <p className="text-sm text-stone-500">
        Example: prefix <code>R</code>, start <code>1</code>, count{" "}
        <code>3</code> creates rooms <code>R01</code>, <code>R02</code>,{" "}
        <code>R03</code> with bed labels matching the type capacity (A, B, …).
      </p>

      <ActionStatus error={state.error} success={state.success} />

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Provisioning…" : "Provision rooms & beds"}
      </button>
    </form>
  );
}
