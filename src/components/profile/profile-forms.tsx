"use client";

import { useActionState } from "react";

import { ActionStatus } from "@/components/admin/action-status";
import { UserAvatar } from "@/components/site/user-avatar";
import {
  changePasswordAction,
  removeAvatarAction,
  updateAvatarAction,
  updateProfileAction,
  type ProfileActionState,
} from "@/server/actions/profile";

const initialState: ProfileActionState = {};

export type ProfileFormUser = {
  fullName: string;
  email: string;
  phone: string | null;
  nationalId: string | null;
  studentId: string | null;
  hometown: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  avatarUrl: string | null;
  role: string;
  residenceName: string | null;
};

export function ProfileDetailsForm({ user }: { user: ProfileFormUser }) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-ink">Full name</span>
          <input
            name="fullName"
            required
            defaultValue={user.fullName}
            className="w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-ink"
          />
        </label>

        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-ink">Email</span>
          <input
            value={user.email}
            disabled
            className="w-full rounded-md border border-ink/10 bg-cream px-3 py-2 text-ink/70"
          />
          <p className="text-xs text-ink/55">
            Email is your sign-in identity and cannot be changed here.
          </p>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">Phone</span>
          <input
            name="phone"
            defaultValue={user.phone ?? ""}
            className="w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-ink"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">Hometown</span>
          <input
            name="hometown"
            defaultValue={user.hometown ?? ""}
            placeholder="e.g. Kumasi"
            className="w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-ink"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">National ID / Ghana Card</span>
          <input
            name="nationalId"
            defaultValue={user.nationalId ?? ""}
            className="w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-ink"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">Student ID</span>
          <input
            name="studentId"
            defaultValue={user.studentId ?? ""}
            className="w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-ink"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">Emergency contact name</span>
          <input
            name="emergencyContactName"
            defaultValue={user.emergencyContactName ?? ""}
            className="w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-ink"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">Emergency contact phone</span>
          <input
            name="emergencyContactPhone"
            defaultValue={user.emergencyContactPhone ?? ""}
            className="w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-ink"
          />
        </label>
      </div>

      <ActionStatus error={state.error} success={state.success} />

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-forest px-4 py-2.5 text-sm font-medium text-cream disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save details"}
      </button>
    </form>
  );
}

export function ProfileAvatarForm({ user }: { user: ProfileFormUser }) {
  const [uploadState, uploadAction, uploadPending] = useActionState(
    updateAvatarAction,
    initialState,
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeAvatarAction,
    initialState,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <UserAvatar
          name={user.fullName}
          imageUrl={user.avatarUrl}
          className="h-20 w-20 rounded-full object-cover"
        />
        <div className="text-sm text-ink/70">
          <p className="font-medium text-ink">{user.fullName}</p>
          <p>
            {user.role}
            {user.residenceName ? ` · ${user.residenceName}` : ""}
          </p>
        </div>
      </div>

      <form action={uploadAction} className="space-y-3">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">Upload photo</span>
          <input
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="block w-full text-sm text-ink"
          />
          <p className="text-xs text-ink/55">JPEG, PNG, or WebP · max 500KB</p>
        </label>
        <ActionStatus error={uploadState.error} success={uploadState.success} />
        <button
          type="submit"
          disabled={uploadPending}
          className="rounded-md bg-forest px-4 py-2.5 text-sm font-medium text-cream disabled:opacity-60"
        >
          {uploadPending ? "Uploading…" : "Upload photo"}
        </button>
      </form>

      {user.avatarUrl ? (
        <form action={removeAction}>
          <ActionStatus error={removeState.error} success={removeState.success} />
          <button
            type="submit"
            disabled={removePending}
            className="rounded-md border border-ink/20 px-4 py-2 text-sm font-medium text-ink disabled:opacity-60"
          >
            {removePending ? "Removing…" : "Remove photo"}
          </button>
        </form>
      ) : null}
    </div>
  );
}

export function ProfilePasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">Current password</span>
        <input
          name="currentPassword"
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
          className="w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-ink"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">New password</span>
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-ink"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">Confirm new password</span>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-ink"
        />
      </label>

      <ActionStatus error={state.error} success={state.success} />

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-forest px-4 py-2.5 text-sm font-medium text-cream disabled:opacity-60"
      >
        {pending ? "Updating…" : "Change password"}
      </button>
    </form>
  );
}
