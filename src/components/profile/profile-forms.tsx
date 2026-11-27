"use client";

import {
  useActionState,
  useId,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import { ActionStatus } from "@/components/admin/action-status";
import { PortalIcon } from "@/components/portal-icons";
import { UserAvatar } from "@/components/site/user-avatar";
import { AVATAR_MAX_BYTES, AVATAR_MAX_LABEL } from "@/lib/avatar";
import {
  ID_DOCUMENT_MAX_BYTES,
  ID_DOCUMENT_MAX_LABEL,
} from "@/lib/id-document";
import {
  changePasswordAction,
  removeAvatarAction,
  updateAvatarAction,
  updateProfileAction,
  type ProfileActionState,
} from "@/server/actions/profile";

const initialState: ProfileActionState = {};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type ProfileFormUser = {
  fullName: string;
  email: string;
  phone: string | null;
  nationalId: string | null;
  nationalIdImageUrl: string | null;
  studentId: string | null;
  studentIdImageUrl: string | null;
  hometown: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  avatarUrl: string | null;
  role: string;
  residenceName: string | null;
};

function IdCardUploadField({
  label,
  numberName,
  numberDefault,
  fileName,
  removeName,
  existingUrl,
}: {
  label: string;
  numberName: string;
  numberDefault: string;
  fileName: string;
  removeName: string;
  existingUrl: string | null;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);

  function clearFile() {
    setFile(null);
    setLocalError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] ?? null;
    if (!next) {
      setFile(null);
      setLocalError(null);
      return;
    }
    if (next.size > ID_DOCUMENT_MAX_BYTES) {
      clearFile();
      setLocalError(`${label} image must be under ${ID_DOCUMENT_MAX_LABEL}.`);
      return;
    }
    setLocalError(null);
    setRemoveExisting(false);
    setFile(next);
  }

  const showExisting = Boolean(existingUrl) && !removeExisting && !file;

  return (
    <div className="space-y-3 rounded-md border border-ink/10 bg-cream/40 p-3 sm:col-span-2">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink">{label} number</span>
        <input
          name={numberName}
          defaultValue={numberDefault}
          className="w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-ink"
        />
      </label>

      <div className="space-y-2">
        <p className="text-sm font-medium text-ink">{label} card photo</p>
        <p className="text-xs text-ink/55">
          JPEG, PNG, or WebP · max {ID_DOCUMENT_MAX_LABEL}
        </p>

        {showExisting ? (
          <div className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={existingUrl!}
              alt={`${label} on file`}
              className="max-h-40 rounded-md border border-ink/10 object-contain"
            />
            <label className="flex items-center gap-2 text-sm text-ink/80">
              <input
                type="checkbox"
                name={removeName}
                value="yes"
                checked={removeExisting}
                onChange={(event) => setRemoveExisting(event.target.checked)}
              />
              Remove current card photo on save
            </label>
          </div>
        ) : null}

        {removeExisting ? (
          <input type="hidden" name={removeName} value="yes" />
        ) : null}

        <input
          ref={inputRef}
          id={inputId}
          name={fileName}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFileChange}
          className="sr-only"
        />

        {!file ? (
          <label
            htmlFor={inputId}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-forest/30 bg-white px-3 py-3 text-sm font-medium text-forest transition hover:border-forest hover:bg-cream/70"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-forest text-cream">
              <PortalIcon name="plus" className="h-3.5 w-3.5" />
            </span>
            {showExisting || removeExisting ? "Replace card photo" : "Upload card photo"}
          </label>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-forest/15 bg-white px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{file.name}</p>
              <p className="text-xs text-ink/55">
                {formatFileSize(file.size)} · will upload on save
              </p>
            </div>
            <div className="flex gap-2">
              <label
                htmlFor={inputId}
                className="cursor-pointer rounded-md border border-ink/15 px-2.5 py-1 text-xs font-medium text-ink"
              >
                Replace
              </label>
              <button
                type="button"
                onClick={clearFile}
                className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {localError ? <p className="text-sm text-red-700">{localError}</p> : null}
      </div>
    </div>
  );
}

export function ProfileDetailsForm({ user }: { user: ProfileFormUser }) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );
  const isResident = user.role === "RESIDENT";

  return (
    <form action={formAction} className="space-y-4" encType="multipart/form-data">
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

        {isResident ? (
          <>
            <IdCardUploadField
              label="National ID / Ghana Card"
              numberName="nationalId"
              numberDefault={user.nationalId ?? ""}
              fileName="nationalIdImage"
              removeName="removeNationalIdImage"
              existingUrl={user.nationalIdImageUrl}
            />

            <IdCardUploadField
              label="Student ID"
              numberName="studentId"
              numberDefault={user.studentId ?? ""}
              fileName="studentIdImage"
              removeName="removeStudentIdImage"
              existingUrl={user.studentIdImageUrl}
            />
          </>
        ) : null}

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
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  function clearFile() {
    setFile(null);
    setLocalError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] ?? null;
    if (!next) {
      setFile(null);
      setLocalError(null);
      return;
    }
    if (next.size > AVATAR_MAX_BYTES) {
      clearFile();
      setLocalError(`Photo must be under ${AVATAR_MAX_LABEL}.`);
      return;
    }
    setLocalError(null);
    setFile(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="rounded-full ring-2 ring-forest/15 transition hover:ring-forest/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          aria-label="View larger profile photo"
        >
          <UserAvatar
            name={user.fullName}
            imageUrl={user.avatarUrl}
            className="h-16 w-16 rounded-full object-cover"
          />
        </button>
        <div className="text-sm text-ink/70">
          <p className="font-medium text-ink">{user.fullName}</p>
          <p>
            {user.role}
            {user.residenceName ? ` · ${user.residenceName}` : ""}
          </p>
          <p className="mt-1 text-xs text-ink/50">Click photo to enlarge</p>
        </div>
      </div>

      {previewOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Profile photo preview"
          onClick={() => setPreviewOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setPreviewOpen(false);
            }
          }}
        >
          <button
            type="button"
            className="absolute top-4 right-4 rounded-md border border-cream/30 bg-ink/40 px-3 py-1.5 text-sm text-cream"
            onClick={() => setPreviewOpen(false)}
          >
            Close
          </button>
          <div
            className="max-h-[85dvh] max-w-[min(28rem,90vw)] overflow-hidden rounded-2xl bg-white p-2 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <UserAvatar
              name={user.fullName}
              imageUrl={user.avatarUrl}
              className="h-auto w-full rounded-xl object-contain"
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <form action={uploadAction} className="space-y-3">
          <div className="rounded-md border border-dashed border-forest/35 bg-forest/5 p-3">
            <div className="mb-2">
              <p className="text-sm font-semibold text-forest">
                {user.avatarUrl ? "Replace photo" : "Upload photo"}
              </p>
              <p className="text-xs text-ink/60">
                JPEG, PNG, or WebP · max {AVATAR_MAX_LABEL}
              </p>
            </div>

            <input
              ref={inputRef}
              id={inputId}
              name="avatar"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required={!file}
              onChange={onFileChange}
              className="sr-only"
            />

            {!file ? (
              <label
                htmlFor={inputId}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-forest/20 bg-white px-3 py-3 text-sm font-medium text-forest transition hover:border-forest hover:bg-cream/70"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-forest text-cream">
                  <PortalIcon name="plus" className="h-3.5 w-3.5" />
                </span>
                Choose photo
              </label>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-forest/15 bg-white px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {file.name}
                  </p>
                  <p className="text-xs text-ink/55">
                    {formatFileSize(file.size)} · ready to upload
                  </p>
                </div>
                <div className="flex gap-2">
                  <label
                    htmlFor={inputId}
                    className="cursor-pointer rounded-md border border-ink/15 px-2.5 py-1 text-xs font-medium text-ink"
                  >
                    Replace
                  </label>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            {localError ? (
              <p className="mt-2 text-sm text-red-700">{localError}</p>
            ) : null}
          </div>

          <ActionStatus
            error={uploadState.error || removeState.error}
            success={uploadState.success || removeState.success}
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={uploadPending || !file}
              className="rounded-md bg-forest px-4 py-2 text-sm font-medium text-cream disabled:opacity-60"
            >
              {uploadPending ? "Uploading…" : "Save photo"}
            </button>
            {user.avatarUrl ? (
              <button
                type="submit"
                formAction={removeAction}
                formNoValidate
                disabled={removePending}
                className="rounded-md border border-ink/20 px-3 py-2 text-sm font-medium text-ink disabled:opacity-60"
              >
                {removePending ? "Removing…" : "Remove current photo"}
              </button>
            ) : null}
          </div>
        </form>
      </div>
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
