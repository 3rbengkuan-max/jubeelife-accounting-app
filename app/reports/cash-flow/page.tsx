import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { MonthPicker } from "@/components/PeriodPicker";
import PrintButton from "@/components/PrintButton";
import DbUnavailable from "@/components/DbUnavailable";
import { getCashFlow } from "@/lib/reports";
import { sgd, monthFromParam } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CashFlowPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const { start, end, label, value } = monthFromParam(month);
  const supabase = await createClient();
  const cf = await getCashFlow(supabase, start, end);
  if (cf.error) {
    return (
      <div>
        <PageHeader title="Cash Flow" subtitle={`For ${label}`} />
        <DbUnavailable detail={cf.error} />
      </div>
    );
  }
  const hasData = cf.inflows.length > 0 || cf.outflows.length > 0;

  return (
    <div>
      <PageHeader
        title="Cash Flow"
        subtitle={`For ${label}`}
        action={
          <div className="flex items-end gap-2">
            <MonthPicker action="/reports/cash-flow" value={value} />
            <PrintButton />
          </div>
        }
      />

      <Card className="mx-auto max-w-2xl p-8 print-full">
        <div className="mb-6 border-b border-slate-200 pb-4 text-center">
          <div className="text-lg font-bold text-slate-800">Jubeelife Pte Ltd</div>
          <div className="text-sm text-slate-500">Cash Flow Statement</div>
          <div className="text-sm text-slate-500">{label}</div>
        </div>

        {!hasData ? (
          <p className="py-8 text-center text-sm text-slate-400">
            No cash movements in this period.
          </p>
        ) : (
          <div className="space-y-6">
            <section>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-emerald-700">
                Cash In
              </h3>
              <table className="w-full text-sm">
                <tbody>
                  {cf.inflows.map((l) => (
                    <tr key={l.code} className="border-b border-slate-50">
                      <td className="py-1.5 text-slate-600">{l.name}</td>
                      <td className="py-1.5 text-right text-slate-700">{sgd(l.total)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-slate-200 font-semibold">
                    <td className="py-2 text-slate-700">Total Cash In</td>
                    <td className="py-2 text-right text-emerald-700">{sgd(cf.totalIn)}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-rose-700">
                Cash Out
              </h3>
              <table className="w-full text-sm">
                <tbody>
                  {cf.outflows.length === 0 ? (
                    <tr>
                      <td className="py-1.5 text-slate-400">No cash out</td>
                      <td className="py-1.5 text-right text-slate-400">{sgd(0)}</td>
                    </tr>
                  ) : (
                    cf.outflows.map((l) => (
                      <tr key={l.code} className="border-b border-slate-50">
                        <td className="py-1.5 text-slate-600">{l.name}</td>
                        <td className="py-1.5 text-right text-slate-700">{sgd(l.total)}</td>
                      </tr>
                    ))
                  )}
                  <tr className="border-t border-slate-200 font-semibold">
                    <td className="py-2 text-slate-700">Total Cash Out</td>
                    <td className="py-2 text-right text-rose-700">{sgd(cf.totalOut)}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <div className="flex items-center justify-between rounded-lg bg-slate-800 px-4 py-3 text-white">
              <span className="font-semibold">Net Cash Flow</span>
              <span className="text-lg font-bold">{sgd(cf.netCash)}</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
