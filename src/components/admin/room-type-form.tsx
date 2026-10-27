"use client";

import { useActionState } from "react";

import { ActionStatus } from "@/components/admin/action-status";
import {
  createRoomTypeAction,
  updateRoomTypeAction,
  type InventoryActionState,
} from "@/server/actions/inventory";

const initialState: InventoryActionState = {};

type RoomTypeFormProps =
  | {
      mode: "create";
      defaultSortOrder?: number;
    }
  | {
      mode: "edit";
      roomType: {
        id: string;
        name: string;
        capacity: number;
        pricePerBed: string;
        description: string | null;
        sortOrder: number;
        isActive: boolean;
      };
    };

export function RoomTypeForm(props: RoomTypeFormProps) {
  const action =
    props.mode === "create" ? createRoomTypeAction : updateRoomTypeAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  const defaults =
    props.mode === "edit"
      ? props.roomType
      : {
          name: "",
          capacity: 2,
          pricePerBed: "1800.00",
          description: "",
          sortOrder: props.defaultSortOrder ?? 0,
          isActive: true,
        };

  return (
    <form action={formAction} className="space-y-4">
      {props.mode === "edit" ? (
        <input type="hidden" name="id" value={props.roomType.id} />
      ) : null}

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-stone-700">Name</span>
        <input
          name="name"
          required
          defaultValue={defaults.name}
          placeholder="Standard 2-in-1"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-700">
            Beds per room
          </span>
          <input
            name="capacity"
            type="number"
            min={1}
            max={26}
            required
            defaultValue={defaults.capacity}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-700">
            Price per bed (GHS)
          </span>
          <input
            name="pricePerBed"
            required
            defaultValue={defaults.pricePerBed}
            placeholder="1800.00"
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-700">Sort order</span>
          <input
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={defaults.sortOrder}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"
          />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-stone-700">Description</span>
        <textarea
          name="description"
          rows={3}
          defaultValue={defaults.description ?? ""}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"
        />
      </label>

      {props.mode === "edit" ? (
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-700">Status</span>
          <select
            name="isActive"
            defaultValue={defaults.isActive ? "true" : "false"}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <p className="text-xs text-stone-500">
            Capacity changes apply to newly provisioned rooms only — existing
            beds are not resized.
          </p>
        </label>
      ) : null}

      <ActionStatus error={state.error} success={state.success} />

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending
          ? "Saving…"
          : props.mode === "create"
            ? "Create room type"
            : "Save changes"}
      </button>
    </form>
  );
}
