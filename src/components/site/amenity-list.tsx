export function AmenityList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-brass/40 bg-cream px-3 py-1 text-xs text-ink"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
