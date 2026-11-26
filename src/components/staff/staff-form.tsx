"use client";

import { useActionState } from "react";

import { ActionStatus } from "@/components/admin/action-status";
import {
  createStaffAction,
  updateStaffAction,
  type StaffActionState,
} from "@/server/actions/staff";
import type { UserRole } from "@/server/db/schema";

const initialState: StaffActionState = {};

type ResidenceOption = { id: string; name: string };

type StaffFormProps =
  | {
      mode: "create";
      assignableRoles: readonly UserRole[];
      residences: ResidenceOption[];
      lockedResidenceId?: string | null;
    }
  | {
      mode: "edit";
      assignableRoles: readonly UserRole[];
      residences: ResidenceOption[];
      lockedResidenceId?: string | null;
      member: {
        id: string;
        fullName: string;
        email: string;
        phone: string | null;
        role: UserRole;
        residenceId: string | null;
      };
    };

export function StaffForm(props: StaffFormProps) {
  const action =
    props.mode === "create" ? createStaffAction : updateStaffAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  const defaults =
    props.mode === "edit"
      ? props.member
      : {
          fullName: "",
          email: "",
          phone: "",
          role: props.assignableRoles[0] ?? "STAFF",
          residenceId:
            props.lockedResidenceId ?? props.residences[0]?.id ?? "",
        };

  const residenceLocked = Boolean(props.lockedResidenceId);

  return (
    <form action={formAction} className="space-y-4">
      {props.mode === "edit" ? (
        <input type="hidden" name="id" value={props.member.id} />
      ) : null}

      {residenceLocked ? (
        <input
          type="hidden"
          name="residenceId"
          value={props.lockedResidenceId ?? ""}
        />
      ) : null}

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-stone-700">Full name</span>
        <input
          name="fullName"
          required
          defaultValue={defaults.fullName}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"
        />
      </label>

      {props.mode === "create" ? (
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-700">Email</span>
          <input
            name="email"
            type="email"
            required
            defaultValue={defaults.email}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"
          />
        </label>
      ) : (
        <p className="text-sm text-stone-600">
          Email: <span className="font-medium text-stone-900">{props.member.email}</span>
        </p>
      )}

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-stone-700">Phone</span>
        <input
          name="phone"
          defaultValue={defaults.phone ?? ""}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-700">Role</span>
          <select
            name="role"
            defaultValue={defaults.role}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"
          >
            {props.assignableRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          {!props.assignableRoles.includes("MANAGER") ? (
            <p className="text-xs text-stone-500">
              Only admins can assign the MANAGER role.
            </p>
          ) : null}
        </label>

        {!residenceLocked ? (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-stone-700">Residence</span>
            <select
              name="residenceId"
              required
              defaultValue={defaults.residenceId ?? ""}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"
            >
              {props.residences.map((residence) => (
                <option key={residence.id} value={residence.id}>
                  {residence.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="self-end text-sm text-stone-600">
            Residence locked to your campus.
          </p>
        )}
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-stone-700">
          {props.mode === "create" ? "Password" : "New password (optional)"}
        </span>
        <input
          name="password"
          type="password"
          required={props.mode === "create"}
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"
        />
      </label>

      <ActionStatus error={state.error} success={state.success} />

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending
          ? "Saving…"
          : props.mode === "create"
            ? "Create staff"
            : "Save changes"}
      </button>
    </form>
  );
}
