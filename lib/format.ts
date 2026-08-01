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
