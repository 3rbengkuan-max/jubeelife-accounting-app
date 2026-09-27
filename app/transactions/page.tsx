import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, EmptyState, Badge, LinkButton } from "@/components/ui";
import { sgd, fmtDate, num } from "@/lib/format";
import { deleteTransaction } from "./actions";
import DbUnavailable from "@/components/DbUnavailable";
import { dbError } from "@/lib/db";
import type { Transaction, Account, Property } from "@/lib/types";

export const dynamic = "force-dynamic";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

function docUrl(path: string) {
  return `${SUPA_URL}/storage/v1/object/public/documents/${path}`;
}

const labelCls = "block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1";
const inputCls =
  "w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    account?: string;
    property?: string;
    from?: string;
    to?: string;
    q?: string;
  }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("transactions")
    .select(
      "*, chart_of_accounts(code,name,type), properties(name), units(label), documents(storage_path,file_name)",
    );
  if (sp.type === "income" || sp.type === "expense") query = query.eq("type", sp.type);
  if (sp.account) query = query.eq("account_id", sp.account);
  if (sp.property) query = query.eq("property_id", sp.property);
  if (sp.from) query = query.gte("date", sp.from);
  if (sp.to) query = query.lte("date", sp.to);
  if (sp.q) query = query.ilike("description", `%${sp.q}%`);
  query = query
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  const [txRes, acctRes, propRes] = await Promise.all([
    query,
    supabase.from("chart_of_accounts").select("*").order("code"),
    supabase.from("properties").select("*").order("name"),
  ]);

  const dbErr = dbError(txRes, acctRes, propRes);
  if (dbErr) {
    return (
      <div>
        <PageHeader
          title="Transactions"
          subtitle="Every income and expense recorded, most recent first."
        />
        <DbUnavailable detail={dbErr} />
      </div>
    );
  }

  const txns = (txRes.data as unknown as Transaction[]) ?? [];
  const accounts = (acctRes.data as Account[]) ?? [];
  const properties = (propRes.data as Property[]) ?? [];
  const hasFilters = !!(sp.type || sp.account || sp.property || sp.from || sp.to || sp.q);

  const totalIncome = txns
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + num(t.amount), 0);
  const totalExpense = txns
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + num(t.amount), 0);

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="Every income and expense recorded, most recent first."
        action={<LinkButton href="/transactions/new">+ New Transaction</LinkButton>}
      />

      {/* Filters */}
      <Card className="mb-4 p-4">
        <form method="get" action="/transactions" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:items-end">
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <label className={labelCls} htmlFor="q">Search description</label>
            <input id="q" name="q" defaultValue={sp.q ?? ""} placeholder="e.g. rent, utilities…" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="type">Type</label>
            <select id="type" name="type" defaultValue={sp.type ?? ""} className={inputCls}>
              <option value="">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="account">Category</label>
            <select id="account" name="account" defaultValue={sp.account ?? ""} className={inputCls}>
              <option value="">All</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.code} · {a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="property">Property</label>
            <select id="property" name="property" defaultValue={sp.property ?? ""} className={inputCls}>
              <option value="">All</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="from">From</label>
            <input id="from" name="from" type="date" defaultValue={sp.from ?? ""} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="to">To</label>
            <input id="to" name="to" type="date" defaultValue={sp.to ?? ""} className={inputCls} />
          </div>
          <div className="col-span-2 flex gap-2 sm:col-span-3 lg:col-span-6">
            <button className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-dark)]">
              Apply filters
            </button>
            {hasFilters && (
              <Link href="/transactions" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Clear
              </Link>
            )}
          </div>
        </form>
      </Card>

      {txns.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No matching transactions" : "No transactions yet"}
          description={
            hasFilters
              ? "No transactions match these filters. Try clearing them."
              : "Record your first income or expense to start building your P&L and cash flow."
          }
          ctaHref={hasFilters ? undefined : "/transactions/new"}
          ctaLabel={hasFilters ? undefined : "+ New Transaction"}
        />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
            <Card className="p-4">
              <div className="text-xs uppercase text-slate-400">
                Income{hasFilters ? " (filtered)" : ""}
              </div>
              <div className="mt-1 font-bold text-emerald-600">{sgd(totalIncome)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs uppercase text-slate-400">
                Expense{hasFilters ? " (filtered)" : ""}
              </div>
              <div className="mt-1 font-bold text-rose-600">{sgd(totalExpense)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs uppercase text-slate-400">
                Net · {txns.length} row{txns.length === 1 ? "" : "s"}
              </div>
              <div className="mt-1 font-bold text-slate-800">
                {sgd(totalIncome - totalExpense)}
              </div>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Account</th>
                    <th className="px-4 py-3 font-semibold">Description</th>
                    <th className="px-4 py-3 font-semibold">Property / Unit</th>
                    <th className="px-4 py-3 text-right font-semibold">GST</th>
                    <th className="px-4 py-3 text-right font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Doc</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {txns.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {fmtDate(t.date)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge value={t.type} />
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {t.chart_of_accounts
                          ? `${t.chart_of_accounts.code} · ${t.chart_of_accounts.name}`
                          : "—"}
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-slate-600">
                        {t.description ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {t.properties?.name ?? "—"}
                        {t.units?.label ? ` · ${t.units.label}` : ""}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-slate-500">
                        {num(t.gst_amount) > 0 ? sgd(t.gst_amount) : "—"}
                      </td>
                      <td
                        className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${
                          t.type === "income" ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {t.type === "income" ? "+" : "−"}
                        {sgd(t.amount)}
                      </td>
                      <td className="px-4 py-3">
                        {t.documents?.storage_path ? (
                          <a
                            href={docUrl(t.documents.storage_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={t.documents.file_name}
                            className="text-[var(--brand)] hover:underline"
                          >
                            📎
                          </a>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/transactions/${t.id}/edit`}
                            className="text-xs font-medium text-[var(--brand)] hover:underline"
                          >
                            Edit
                          </Link>
                          <form action={deleteTransaction}>
                            <input type="hidden" name="id" value={t.id} />
                            <button
                              type="submit"
                              className="text-xs text-slate-400 hover:text-rose-600"
                              title="Delete transaction"
                            >
                              ✕
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
