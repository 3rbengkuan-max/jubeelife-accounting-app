import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, StatCard, Badge, LinkButton } from "@/components/ui";
import { sgd, fmtDate, num, monthRange } from "@/lib/format";
import type { Transaction, Invoice, Tenancy } from "@/lib/types";
import DbUnavailable from "@/components/DbUnavailable";
import { dbError } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = await createClient();
  const { start, end, label } = monthRange();

  const [monthTx, recentTx, invoicesRes, tenanciesRes] = await Promise.all([
    supabase
      .from("transactions")
      .select("type, amount")
      .gte("date", start)
      .lte("date", end),
    supabase
      .from("transactions")
      .select("*, chart_of_accounts(code,name), properties(name), units(label)")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.from("invoices").select("*").order("issue_date", { ascending: false }),
    supabase
      .from("tenancies")
      .select("*, units(label), tenants(name)")
      .eq("status", "active"),
  ]);

  const dbErr = dbError(monthTx, recentTx, invoicesRes, tenanciesRes);
  if (dbErr) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle={`Overview for ${label}`} />
        <DbUnavailable detail={dbErr} />
      </div>
    );
  }

  const mtx = (monthTx.data as Pick<Transaction, "type" | "amount">[]) ?? [];
  const monthIncome = mtx
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + num(t.amount), 0);
  const monthExpense = mtx
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + num(t.amount), 0);
  const net = monthIncome - monthExpense;

  const invoices = (invoicesRes.data as Invoice[]) ?? [];
  const outstanding = invoices
    .filter((i) => i.status === "issued" || i.status === "overdue")
    .reduce((s, i) => s + num(i.total), 0);

  const tenancies = (tenanciesRes.data as unknown as Tenancy[]) ?? [];
  const rentDue = tenancies.reduce((s, t) => s + num(t.monthly_rent), 0);

  const recent = (recentTx.data as unknown as Transaction[]) ?? [];
  const barMax = Math.max(monthIncome, monthExpense, 1);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Overview for ${label}`}
        action={<LinkButton href="/transactions/new">+ New Transaction</LinkButton>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={`Income · ${label}`} value={sgd(monthIncome)} tone="positive" />
        <StatCard label={`Expense · ${label}`} value={sgd(monthExpense)} tone="negative" />
        <StatCard
          label="Net profit · this month"
          value={sgd(net)}
          tone={net >= 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Outstanding receivables"
          value={sgd(outstanding)}
          hint={`${invoices.filter((i) => i.status === "issued" || i.status === "overdue").length} open invoice(s)`}
          tone="warning"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Income vs Expense</h2>
            <span className="text-xs text-slate-400">{label}</span>
          </div>
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-slate-500">Income</span>
                <span className="font-semibold text-emerald-600">{sgd(monthIncome)}</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${(monthIncome / barMax) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-slate-500">Expense</span>
                <span className="font-semibold text-rose-600">{sgd(monthExpense)}</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-rose-500"
                  style={{ width: `${(monthExpense / barMax) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-500">
            Net this month:{" "}
            <span className={`font-bold ${net >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {sgd(net)}
            </span>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-semibold text-slate-800">Rent due this month</h2>
          <div className="text-3xl font-bold text-slate-800">{sgd(rentDue)}</div>
          <div className="mt-1 text-xs text-slate-400">
            Across {tenancies.length} active tenanc{tenancies.length === 1 ? "y" : "ies"}
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {tenancies.slice(0, 4).map((t) => (
              <li key={t.id} className="flex justify-between">
                <span className="text-slate-600">
                  {t.units?.label ?? "—"} · {t.tenants?.name ?? "—"}
                </span>
                <span className="font-medium text-slate-700">{sgd(t.monthly_rent)}</span>
              </li>
            ))}
            {tenancies.length === 0 && (
              <li className="text-slate-400">No active tenancies.</li>
            )}
          </ul>
          <Link
            href="/tenancies"
            className="mt-4 inline-block text-sm font-medium text-[var(--brand)] hover:underline"
          >
            View tenancies →
          </Link>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-800">Recent transactions</h2>
          <Link
            href="/transactions"
            className="text-sm font-medium text-[var(--brand)] hover:underline"
          >
            View all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">
            No transactions yet.{" "}
            <Link href="/transactions/new" className="text-[var(--brand)] hover:underline">
              Record one
            </Link>
            .
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge value={t.type} />
                    <span className="truncate font-medium text-slate-700">
                      {t.description || t.chart_of_accounts?.name || "Transaction"}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400">
                    {fmtDate(t.date)}
                    {t.properties?.name ? ` · ${t.properties.name}` : ""}
                    {t.units?.label ? ` · ${t.units.label}` : ""}
                  </div>
                </div>
                <div
                  className={`shrink-0 font-semibold ${
                    t.type === "income" ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {t.type === "income" ? "+" : "−"}
                  {sgd(t.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
