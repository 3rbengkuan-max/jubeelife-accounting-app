export function sgd(amount: number | string | null | undefined): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount ?? 0;
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(n as number) ? (n as number) : 0);
}

export function num(amount: number | string | null | undefined): number {
  const n = typeof amount === "string" ? parseFloat(amount) : amount ?? 0;
  return Number.isFinite(n as number) ? (n as number) : 0;
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  return new Intl.DateTimeFormat("en-SG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** First and last day (ISO) of the month containing `d` (defaults to today). */
export function monthRange(d = new Date()): { start: string; end: string; label: string } {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const iso = (x: Date) => x.toISOString().slice(0, 10);
  return {
    start: iso(start),
    end: iso(end),
    label: new Intl.DateTimeFormat("en-SG", { month: "long", year: "numeric" }).format(start),
  };
}

export function currentMonthISO(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

/**
 * Parse `from`/`to` date params (YYYY-MM-DD) into an inclusive date range.
 * Defaults to year-to-date: 1 Jan of the current year → today. If the two
 * dates are reversed (To before From), they are swapped so the range is valid.
 */
export function rangeFromParams(
  from?: string,
  to?: string,
): { start: string; end: string; label: string } {
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  const now = new Date();
  let start = from && iso.test(from) ? from : `${now.getFullYear()}-01-01`;
  let end = to && iso.test(to) ? to : todayISO();
  if (start > end) [start, end] = [end, start];
  return { start, end, label: `${fmtDate(start)} – ${fmtDate(end)}` };
}

/** Parse a "YYYY-MM" param (or default to current month) into a date range. */
export function monthFromParam(param?: string): {
  start: string;
  end: string;
  label: string;
  value: string;
} {
  let base = new Date();
  if (param && /^\d{4}-\d{2}$/.test(param)) {
    const [y, m] = param.split("-").map(Number);
    base = new Date(y, m - 1, 1);
  }
  const r = monthRange(base);
  return { ...r, value: `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}` };
}
