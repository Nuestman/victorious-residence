/** Labels beds A, B, C… within a room (capacity 1–26). */
export function bedLabelsForCapacity(capacity: number): string[] {
  if (capacity < 1 || capacity > 26) {
    throw new Error("Room capacity must be between 1 and 26");
  }

  return Array.from({ length: capacity }, (_, index) =>
    String.fromCharCode(65 + index),
  );
}

export function formatRoomLabel(prefix: string, number: number, pad = 2): string {
  const normalized = prefix.trim().toUpperCase();
  return `${normalized}${String(number).padStart(pad, "0")}`;
}
