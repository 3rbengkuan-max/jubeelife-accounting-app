import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, StatCard, EmptyState } from "@/components/ui";
import { MonthPicker } from "@/components/PeriodPicker";
import { setReconciled, reconcileAll } from "./actions";
import AutoMatchPanel from "@/components/AutoMatchPanel";
import DbUnavailable from "@/components/DbUnavailable";
import { dbError } from "@/lib/db";
import { sgd, fmtDate, num, monthFromParam } from "@/lib/format";
import type { Transaction, DocumentRow } from "@/lib/types";

export const dynamic = "force-dynamic";
// Allow the AI statement read to run up to 60s (Vercel serverless limit).
export const maxDuration = 60;

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const docUrl = (path: string) =>
  `${SUPA_URL}/storage/v1/object/public/documents/${path}`;

export default async function ReconciliationPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const { start, end, label, value } = monthFromParam(month);
  const supabase = await createClient();

  const [txRes, stmtRes] = await Promise.all([
    supabase
      .from("transactions")
      .select("*, chart_of_accounts(code,name), documents(storage_path,file_name)")
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: true }),
    supabase
      .from("documents")
      .select("*")
      .eq("doc_type", "bank_statement")
      .order("created_at", { ascending: false }),
  ]);

  const dbErr = dbError(txRes, stmtRes);
  if (dbErr) {
    return (
      <div>
        <PageHeader title="Bank Reconciliation" subtitle={`For ${label}`} />
        <DbUnavailable detail={dbErr} />
      </div>
    );
  }

  const txns = (txRes.data as unknown as Transaction[]) ?? [];
  const statements = (stmtRes.data as DocumentRow[]) ?? [];

  const signed = (t: Transaction) =>
    (t.type === "income" ? 1 : -1) * num(t.amount);
  const net = txns.reduce((s, t) => s + signed(t), 0);
  const reconciledNet = txns.filter((t) => t.reconciled).reduce((s, t) => s + signed(t), 0);
  const reconciledCount = txns.filter((t) => t.reconciled).length;
  const unreconciled = net - reconciledNet;
  const allReconciled = txns.length > 0 && reconciledCount === txns.length;

  return (
    <div>
      <PageHeader
        title="Bank Reconciliation"
        subtitle={`Tick each transaction against your ${label} bank statement. When everything's ticked, the reconciled total should match the statement's net movement.`}
        action={<MonthPicker action="/reconciliation" value={value} />}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={`Net cash · ${label}`} value={sgd(net)} tone={net >= 0 ? "positive" : "negative"} hint="Matches Cash Flow" />
        <StatCard label="Reconciled total" value={sgd(reconciledNet)} tone="default" hint={`${reconciledCount} of ${txns.length} ticked`} />
        <StatCard label="Still to reconcile" value={sgd(unreconciled)} tone={Math.abs(unreconciled) < 0.01 ? "positive" : "warning"} hint={Math.abs(unreconciled) < 0.01 ? "Fully reconciled ✓" : "Unticked amount"} />
        <Card className="flex flex-col justify-center p-5">
          <Link href={`/reports/cash-flow?month=${value}`} className="text-sm font-semibold text-[var(--brand)] hover:underline">
            View Cash Flow →
          </Link>
          <Link href={`/reports/pnl?month=${value}`} className="mt-2 text-sm font-semibold text-[var(--brand)] hover:underline">
            View P&amp;L →
          </Link>
        </Card>
      </div>

      <Card className="mb-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-slate-800">Bank statements</h2>
          <Link href="/documents" className="text-sm font-medium text-[var(--brand)] hover:underline">
            + Upload a statement
          </Link>
        </div>
        {statements.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">
            No bank statements uploaded yet.{" "}
            <Link href="/documents" className="text-[var(--brand)] hover:underline">
              Upload one
            </Link>{" "}
            to check transactions against it.
          </p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {statements.map((d) => (
              <li key={d.id}>
                <a
                  href={docUrl(d.storage_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  📄 {d.file_name}
                </a>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="mb-6">
        <AutoMatchPanel
          statements={statements}
          start={start}
          end={end}
          monthLabel={label}
        />
      </div>

      {txns.length === 0 ? (
        <EmptyState
          title={`No transactions in ${label}`}
          description="Pick another month, or record transactions first — then reconcile them here."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm text-slate-500">
              {reconciledCount}/{txns.length} reconciled
            </span>
            <div className="flex gap-2">
              <form action={reconcileAll}>
                <input type="hidden" name="start" value={start} />
                <input type="hidden" name="end" value={end} />
                <input type="hidden" name="value" value="true" />
                <button className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200" disabled={allReconciled}>
                  Tick all
                </button>
              </form>
              <form action={reconcileAll}>
                <input type="hidden" name="start" value={start} />
                <input type="hidden" name="end" value={end} />
                <input type="hidden" name="value" value="false" />
                <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  Clear all
                </button>
              </form>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold">Account</th>
                  <th className="px-4 py-3 font-semibold">Doc</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  <th className="px-4 py-3 text-center font-semibold">Reconciled</th>
                </tr>
              </thead>
              <tbody>
                {txns.map((t) => (
                  <tr
                    key={t.id}
                    className={`border-b border-slate-100 last:border-0 ${t.reconciled ? "bg-emerald-50/40" : "hover:bg-slate-50/60"}`}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{fmtDate(t.date)}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {t.description || t.chart_of_accounts?.name || "Transaction"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {t.chart_of_accounts ? `${t.chart_of_accounts.code} · ${t.chart_of_accounts.name}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {t.documents?.storage_path ? (
                        <a href={docUrl(t.documents.storage_path)} target="_blank" rel="noopener noreferrer" className="text-[var(--brand)]" title={t.documents.file_name}>
                          📎
                        </a>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${t.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
                      {t.type === "income" ? "+" : "−"}
                      {sgd(t.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <form action={setReconciled}>
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="value" value={(!t.reconciled).toString()} />
                        <button
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-md border text-xs ${
                            t.reconciled
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-slate-300 text-transparent hover:border-slate-400"
                          }`}
                          title={t.reconciled ? "Mark as not reconciled" : "Mark as reconciled"}
                        >
                          ✓
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
