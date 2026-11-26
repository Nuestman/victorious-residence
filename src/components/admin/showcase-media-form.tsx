"use client";

import { useActionState } from "react";

import { ActionStatus } from "@/components/admin/action-status";
import {
  updateShowcaseMediaAction,
  type ResidenceActionState,
} from "@/server/actions/residences";
import type { ResidenceMediaKind } from "@/server/db/schema";

const initialState: ResidenceActionState = {};

type MediaRow = {
  id: string;
  kind: ResidenceMediaKind;
  title: string | null;
  description: string | null;
  url: string;
  caption: string | null;
};

export function ShowcaseMediaForm({
  residenceId,
  rows,
}: {
  residenceId: string;
  rows: MediaRow[];
}) {
  const [state, formAction, pending] = useActionState(
    updateShowcaseMediaAction,
    initialState,
  );
  const items = [
    ...rows,
    {
      id: "",
      kind: "EXTERIOR" as const,
      title: "",
      description: "",
      url: "",
      caption: "",
    },
  ];

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="residenceId" value={residenceId} />
      <p className="text-xs text-stone-500">
        Paste a path such as /showcase/exterior-day.jpg or a full image URL.
        Replacing a file in public/showcase with the same name updates the
        photo without changing the URL.
      </p>
      {items.map((row, index) => (
        <fieldset
          key={row.id || `new-${index}`}
          className="space-y-2 rounded-md border border-stone-200 p-3"
        >
          <input type="hidden" name="mediaId" value={row.id} />
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-stone-600">Kind</span>
              <select
                name="mediaKind"
                defaultValue={row.kind}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              >
                <option value="EXTERIOR">Exterior</option>
                <option value="FACILITY">Facility</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-stone-600">Title</span>
              <input
                name="mediaTitle"
                defaultValue={row.title ?? ""}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-stone-600">Image URL</span>
            <input
              name="mediaUrl"
              defaultValue={row.url}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-stone-600">Caption</span>
            <input
              name="mediaCaption"
              defaultValue={row.caption ?? ""}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-stone-600">Description</span>
            <textarea
              name="mediaDescription"
              rows={2}
              defaultValue={row.description ?? ""}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          {row.id ? (
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" name="mediaDelete" value={row.id} />
              Remove this photo
            </label>
          ) : (
            <p className="text-xs text-stone-500">
              Leave the URL blank to skip this new row.
            </p>
          )}
        </fieldset>
      ))}
      <ActionStatus error={state.error} success={state.success} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save showcase photos"}
      </button>
    </form>
  );
}
