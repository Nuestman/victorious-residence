/** Accept site paths and http(s) URLs. Empty input is allowed. */
export function parseMediaUrl(
  value: unknown,
): string | null | "invalid" {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }

  if (raw.startsWith("/") && !raw.startsWith("//") && !raw.includes(" ")) {
    return raw;
  }

  try {
    const url = new URL(raw);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return raw;
    }
  } catch {
    return "invalid";
  }

  return "invalid";
}

export function parseAmenities(value: unknown): string[] {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 24);
}
