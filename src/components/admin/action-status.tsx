type ActionStatusProps = {
  error?: string;
  success?: string;
};

export function ActionStatus({ error, success }: ActionStatusProps) {
  if (error) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (success) {
    return (
      <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        {success}
      </p>
    );
  }

  return null;
}
