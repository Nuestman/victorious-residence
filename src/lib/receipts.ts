const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

/** Max receipt upload size (bytes). */
export const RECEIPT_MAX_BYTES = 5 * 1024 * 1024; // 5MB

export const RECEIPT_MAX_LABEL = "5MB";

export type ReceiptStoreResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Stores a receipt as a data URL for portable local + Vercel staging.
 * Swap to object storage (Vercel Blob / S3) when BLOB_READ_WRITE_TOKEN is wired.
 */
export async function storeReceipt(file: File): Promise<ReceiptStoreResult> {
  if (!ALLOWED_TYPES.has(file.type)) {
    return {
      ok: false,
      error: "Receipt must be a JPEG, PNG, WebP image, or PDF.",
    };
  }

  if (file.size <= 0 || file.size > RECEIPT_MAX_BYTES) {
    return {
      ok: false,
      error: `Receipt must be under ${RECEIPT_MAX_LABEL}.`,
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const url = `data:${file.type};base64,${base64}`;

  return { ok: true, url };
}
