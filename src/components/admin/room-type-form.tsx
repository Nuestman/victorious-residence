"use client";

import { useActionState } from "react";

import { ActionStatus } from "@/components/admin/action-status";
import { PortalIcon } from "@/components/portal-icons";
import {
  createRoomTypeAction,
  updateRoomTypeAction,
  type InventoryActionState,
} from "@/server/actions/inventory";

const initialState: InventoryActionState = {};

type RoomTypeFormProps =
  | {
      mode: "create";
      residenceId: string;
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
        amenities: string[];
        coverImageUrl: string | null;
        gallery: Array<{ url: string; caption: string | null }>;
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
          amenities: "",
          coverImageUrl: "",
          sortOrder: props.defaultSortOrder ?? 0,
          isActive: true,
        };

  return (
    <form action={formAction} className="space-y-4">
      {props.mode === "edit" ? (
        <input type="hidden" name="id" value={props.roomType.id} />
      ) : (
        <input type="hidden" name="residenceId" value={props.residenceId} />
      )}

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

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-stone-700">
          Amenities (comma-separated)
        </span>
        <input
          name="amenities"
          defaultValue={
            props.mode === "edit"
              ? props.roomType.amenities.join(", ")
              : defaults.amenities
          }
          placeholder="Wardrobe, Writing desk, Wi-Fi"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-stone-700">Cover image URL</span>
        <input
          name="coverImageUrl"
          defaultValue={
            props.mode === "edit" ? (props.roomType.coverImageUrl ?? "") : ""
          }
          placeholder="/showcase/room-single-bed.jpg"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"
        />
      </label>

      {props.mode === "edit" ? (
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-stone-700">
            Extra photos
          </legend>
          <p className="text-xs text-stone-500">
            Up to 8 angles. Leave a row blank to skip it. Saving replaces the
            gallery for this room type.
          </p>
          {[...props.roomType.gallery, { url: "", caption: "" }]
            .slice(0, 8)
            .map((image, index) => (
              <div key={`${image.url}-${index}`} className="grid gap-2 sm:grid-cols-2">
                <input
                  name="galleryUrl"
                  defaultValue={image.url}
                  placeholder="/showcase/room-single-desk.jpg"
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"
                />
                <input
                  name="galleryCaption"
                  defaultValue={image.caption ?? ""}
                  placeholder="Caption"
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"
                />
              </div>
            ))}
        </fieldset>
      ) : null}

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
        className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        <PortalIcon
          name={props.mode === "create" ? "plus" : "save"}
          className="h-4 w-4"
        />
        {pending
          ? "Saving…"
          : props.mode === "create"
            ? "Create room type"
            : "Save changes"}
      </button>
    </form>
  );
}
