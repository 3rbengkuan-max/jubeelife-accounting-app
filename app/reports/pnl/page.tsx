import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { RangePicker } from "@/components/PeriodPicker";
import PrintButton from "@/components/PrintButton";
import DbUnavailable from "@/components/DbUnavailable";
import { getProfitAndLoss } from "@/lib/reports";
import { sgd, rangeFromParams } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PnLPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const { start, end, label } = rangeFromParams(from, to);
  const supabase = await createClient();
  const pnl = await getProfitAndLoss(supabase, start, end);
  if (pnl.error) {
    return (
      <div>
        <PageHeader title="Profit & Loss" subtitle={`For ${label}`} />
        <DbUnavailable detail={pnl.error} />
      </div>
    );
  }
  const hasData = pnl.income.length > 0 || pnl.expense.length > 0;

  return (
    <div>
      <PageHeader
        title="Profit & Loss"
        subtitle={`For ${label}`}
        action={
          <div className="flex items-end gap-2">
            <RangePicker action="/reports/pnl" from={start} to={end} />
            <PrintButton />
          </div>
        }
      />

      <Card className="mx-auto max-w-2xl p-8 print-full">
        <div className="mb-6 border-b border-slate-200 pb-4 text-center">
          <div className="text-lg font-bold text-slate-800">Jubeelife Pte Ltd</div>
          <div className="text-sm text-slate-500">Profit &amp; Loss Statement</div>
          <div className="text-sm text-slate-500">{label}</div>
        </div>

        {!hasData ? (
          <p className="py-8 text-center text-sm text-slate-400">
            No transactions in this period.
          </p>
        ) : (
          <div className="space-y-6">
            <section>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-emerald-700">
                Income
              </h3>
              <table className="w-full text-sm">
                <tbody>
                  {pnl.income.map((l) => (
                    <tr key={l.code} className="border-b border-slate-50">
                      <td className="py-1.5 text-slate-600">
                        <span className="font-mono text-xs text-slate-400">{l.code}</span> {l.name}
                      </td>
                      <td className="py-1.5 text-right text-slate-700">{sgd(l.total)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-slate-200 font-semibold">
                    <td className="py-2 text-slate-700">Total Income</td>
                    <td className="py-2 text-right text-emerald-700">{sgd(pnl.totalIncome)}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-rose-700">
                Expenses
              </h3>
              <table className="w-full text-sm">
                <tbody>
                  {pnl.expense.length === 0 ? (
                    <tr>
                      <td className="py-1.5 text-slate-400">No expenses</td>
                      <td className="py-1.5 text-right text-slate-400">{sgd(0)}</td>
                    </tr>
                  ) : (
                    pnl.expense.map((l) => (
                      <tr key={l.code} className="border-b border-slate-50">
                        <td className="py-1.5 text-slate-600">
                          <span className="font-mono text-xs text-slate-400">{l.code}</span> {l.name}
                        </td>
                        <td className="py-1.5 text-right text-slate-700">{sgd(l.total)}</td>
                      </tr>
                    ))
                  )}
                  <tr className="border-t border-slate-200 font-semibold">
                    <td className="py-2 text-slate-700">Total Expenses</td>
                    <td className="py-2 text-right text-rose-700">{sgd(pnl.totalExpense)}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <div className="flex items-center justify-between rounded-lg bg-slate-800 px-4 py-3 text-white">
              <span className="font-semibold">Net Profit</span>
              <span className="text-lg font-bold">{sgd(pnl.net)}</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
