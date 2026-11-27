const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/** Max profile photo upload size (bytes). */
export const AVATAR_MAX_BYTES = 500_000; // ~500KB — keep DB rows and pages light

export const AVATAR_MAX_LABEL = "500KB";

export type AvatarStoreResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Stores a profile photo as a data URL (same launch approach as receipts).
 * Swap to object storage when Blob/S3 is wired.
 */
export async function storeAvatar(file: File): Promise<AvatarStoreResult> {
  if (!ALLOWED_TYPES.has(file.type)) {
    return {
      ok: false,
      error: "Profile photo must be a JPEG, PNG, or WebP image.",
    };
  }

  if (file.size <= 0 || file.size > AVATAR_MAX_BYTES) {
    return {
      ok: false,
      error: `Profile photo must be under ${AVATAR_MAX_LABEL}.`,
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const url = `data:${file.type};base64,${base64}`;

  return { ok: true, url };
}
