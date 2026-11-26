export function AvailabilityBadge({ count }: { count: number }) {
  const open = count > 0;

  return (
    <span
      className={
        open
          ? "rounded-full bg-forest/10 px-3 py-1 text-xs font-medium text-forest"
          : "rounded-full bg-ink/10 px-3 py-1 text-xs font-medium text-ink/70"
      }
    >
      {open
        ? `${count} bed${count === 1 ? "" : "s"} available`
        : "No beds open right now"}
    </span>
  );
}
