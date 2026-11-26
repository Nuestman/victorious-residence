"use client";

import { useActionState } from "react";

import { ActionStatus } from "@/components/admin/action-status";
import { PortalIcon } from "@/components/portal-icons";
import { CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/contact";
import {
  createResidenceAction,
  updateResidenceAction,
  type ResidenceActionState,
} from "@/server/actions/residences";

const initialState: ResidenceActionState = {};

type ResidenceFormProps =
  | { mode: "create" }
  | {
      mode: "edit";
      residence: {
        id: string;
        name: string;
        slug: string;
        address: string;
        description: string | null;
        phone: string | null;
        email: string | null;
        heroImageUrl: string | null;
        isActive: boolean;
      };
    };

export function ResidenceForm(props: ResidenceFormProps) {
  const action =
    props.mode === "create" ? createResidenceAction : updateResidenceAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  const defaults =
    props.mode === "edit"
      ? props.residence
      : {
          name: "",
          slug: "",
          address: "",
          description: "",
          phone: "",
          email: "",
          heroImageUrl: "",
          isActive: true,
        };

  return (
    <form action={formAction} className="space-y-4">
      {props.mode === "edit" ? (
        <input type="hidden" name="id" value={props.residence.id} />
      ) : null}

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-stone-700">Name</span>
        <input
          name="name"
          required
          defaultValue={defaults.name}
          placeholder="Victorious Residence — North"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-stone-700">Slug</span>
        <input
          name="slug"
          defaultValue={defaults.slug}
          placeholder="victorious-north (optional — auto from name)"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"
        />
        <p className="text-xs text-stone-500">
          Lowercase kebab-case unique key. Leave blank on create to derive from
          the name.
        </p>
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-stone-700">Address</span>
        <input
          name="address"
          required
          defaultValue={defaults.address}
          placeholder="Obuasi, Ghana"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-stone-700">Phone</span>
        <input
          name="phone"
          defaultValue={"phone" in defaults ? (defaults.phone ?? "") : ""}
          placeholder={CONTACT_PHONE}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-stone-700">Email</span>
        <input
          name="email"
          type="email"
          defaultValue={"email" in defaults ? (defaults.email ?? "") : ""}
          placeholder={CONTACT_EMAIL}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-stone-700">Hero image URL</span>
        <input
          name="heroImageUrl"
          defaultValue={
            "heroImageUrl" in defaults ? (defaults.heroImageUrl ?? "") : ""
          }
          placeholder="/showcase/exterior-day.jpg"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"
        />
      </label>

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
            ? "Create residence"
            : "Save changes"}
      </button>
    </form>
  );
}
