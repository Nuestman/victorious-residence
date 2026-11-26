import { setAdminWorkingResidenceAction } from "@/server/actions/residences";

type ResidenceOption = {
  id: string;
  name: string;
};

type ResidenceSwitcherProps = {
  residences: ResidenceOption[];
  selectedId: string | null;
};

export function ResidenceSwitcher({
  residences,
  selectedId,
}: ResidenceSwitcherProps) {
  if (residences.length === 0) {
    return (
      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        No active residences. Create one under Residences before managing
        inventory.
      </p>
    );
  }

  return (
    <form
      action={setAdminWorkingResidenceAction}
      className="flex flex-wrap items-end gap-3 rounded-md border border-stone-200 bg-stone-50 px-3 py-3"
    >
      <label className="block min-w-[14rem] flex-1 space-y-1">
        <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
          Working campus
        </span>
        <select
          name="residenceId"
          defaultValue={selectedId ?? residences[0]?.id}
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
        >
          {residences.map((residence) => (
            <option key={residence.id} value={residence.id}>
              {residence.name}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800"
      >
        Switch
      </button>
    </form>
  );
}
