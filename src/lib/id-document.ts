const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/** Max ID card upload size (bytes). */
export const ID_DOCUMENT_MAX_BYTES = 1_000_000; // 1MB — keep DB rows light

export const ID_DOCUMENT_MAX_LABEL = "1MB";

export type IdDocumentStoreResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Stores an ID card image as a data URL (same launch approach as avatars/receipts).
 * Swap to object storage when Blob/S3 is wired.
 */
export async function storeIdDocument(
  file: File,
  label = "ID card",
): Promise<IdDocumentStoreResult> {
  if (!ALLOWED_TYPES.has(file.type)) {
    return {
      ok: false,
      error: `${label} must be a JPEG, PNG, or WebP image.`,
    };
  }

  if (file.size <= 0 || file.size > ID_DOCUMENT_MAX_BYTES) {
    return {
      ok: false,
      error: `${label} must be under ${ID_DOCUMENT_MAX_LABEL}.`,
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const url = `data:${file.type};base64,${base64}`;

  return { ok: true, url };
}
