import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, EmptyState, Badge, LinkButton } from "@/components/ui";
import { sgd, fmtDate, num } from "@/lib/format";
import { deleteTransaction } from "./actions";
import type { Transaction } from "@/lib/types";

export const dynamic = "force-dynamic";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

function docUrl(path: string) {
  return `${SUPA_URL}/storage/v1/object/public/documents/${path}`;
}

export default async function TransactionsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*, chart_of_accounts(code,name,type), properties(name), units(label), documents(storage_path,file_name)")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  const txns = (data as unknown as Transaction[]) ?? [];

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

      {error && (
        <Card className="mb-4 border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Couldn&apos;t load transactions: {error.message}
        </Card>
      )}

      {txns.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          description="Record your first income or expense to start building your P&L and cash flow."
          ctaHref="/transactions/new"
          ctaLabel="+ New Transaction"
        />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
            <Card className="p-4">
              <div className="text-xs uppercase text-slate-400">Income</div>
              <div className="mt-1 font-bold text-emerald-600">{sgd(totalIncome)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs uppercase text-slate-400">Expense</div>
              <div className="mt-1 font-bold text-rose-600">{sgd(totalExpense)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs uppercase text-slate-400">Net</div>
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
                    <th className="px-4 py-3"></th>
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
                      <td className="px-4 py-3 text-right">
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
