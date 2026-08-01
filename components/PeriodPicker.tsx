// Server component: a no-JS GET form for choosing a report period.
export function MonthPicker({ action, value }: { action: string; value: string }) {
  return (
    <form action={action} method="get" className="no-print flex items-end gap-2">
      <div>
        <label htmlFor="month" className="block text-xs font-semibold text-slate-600">
          Month
        </label>
        <input
          id="month"
          type="month"
          name="month"
          defaultValue={value}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none"
        />
      </div>
      <button className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-dark)]">
        Apply
      </button>
    </form>
  );
}

export function AsOfPicker({ action, value }: { action: string; value: string }) {
  return (
    <form action={action} method="get" className="no-print flex items-end gap-2">
      <div>
        <label htmlFor="as_of" className="block text-xs font-semibold text-slate-600">
          As of date
        </label>
        <input
          id="as_of"
          type="date"
          name="as_of"
          defaultValue={value}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none"
        />
      </div>
      <button className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-dark)]">
        Apply
      </button>
    </form>
  );
}
