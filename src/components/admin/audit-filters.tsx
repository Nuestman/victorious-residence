type AuditFiltersProps = {
  q?: string;
  entityType?: string;
  action?: string;
  entityTypes: string[];
  actions: string[];
};

export function AuditFilters({
  q,
  entityType,
  action,
  entityTypes,
  actions,
}: AuditFiltersProps) {
  return (
    <form
      method="get"
      className="grid gap-3 rounded-md border border-stone-200 bg-stone-50 p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <label className="block space-y-1.5 sm:col-span-2 lg:col-span-1">
        <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
          Search
        </span>
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Actor, action, entity…"
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
          Entity type
        </span>
        <select
          name="entityType"
          defaultValue={entityType ?? ""}
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
        >
          <option value="">All</option>
          {entityTypes.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
          Action
        </span>
        <select
          name="action"
          defaultValue={action ?? ""}
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
        >
          <option value="">All</option>
          {actions.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-end gap-2">
        <button
          type="submit"
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          Filter
        </button>
        <a
          href="/admin/audit"
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800"
        >
          Clear
        </a>
      </div>
    </form>
  );
}
