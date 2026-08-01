import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { AsOfPicker } from "@/components/PeriodPicker";
import PrintButton from "@/components/PrintButton";
import { getBalanceSheet } from "@/lib/reports";
import { sgd, fmtDate, todayISO } from "@/lib/format";

export const dynamic = "force-dynamic";

function Section({
  title,
  rows,
  total,
  totalLabel,
  color,
}: {
  title: string;
  rows: { name: string; total: number }[];
  total: number;
  totalLabel: string;
  color: string;
}) {
  return (
    <section>
      <h3 className={`mb-2 text-sm font-bold uppercase tracking-wide ${color}`}>{title}</h3>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-slate-50">
              <td className="py-1.5 text-slate-600">{r.name}</td>
              <td className="py-1.5 text-right text-slate-700">{sgd(r.total)}</td>
            </tr>
          ))}
          <tr className="border-t border-slate-200 font-semibold">
            <td className="py-2 text-slate-700">{totalLabel}</td>
            <td className="py-2 text-right text-slate-800">{sgd(total)}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

export default async function BalanceSheetPage({
  searchParams,
}: {
  searchParams: Promise<{ as_of?: string }>;
}) {
  const { as_of } = await searchParams;
  const asOf = as_of && /^\d{4}-\d{2}-\d{2}$/.test(as_of) ? as_of : todayISO();
  const supabase = await createClient();
  const bs = await getBalanceSheet(supabase, asOf);
  const balanced = Math.abs(bs.totalAssets - (bs.totalLiabilities + bs.totalEquity)) < 0.01;

  return (
    <div>
      <PageHeader
        title="Balance Sheet"
        subtitle={`As at ${fmtDate(asOf)}`}
        action={
          <div className="flex items-end gap-2">
            <AsOfPicker action="/reports/balance-sheet" value={asOf} />
            <PrintButton />
          </div>
        }
      />

      <Card className="mx-auto max-w-2xl p-8 print-full">
        <div className="mb-6 border-b border-slate-200 pb-4 text-center">
          <div className="text-lg font-bold text-slate-800">Jubeelife Pte Ltd</div>
          <div className="text-sm text-slate-500">Balance Sheet</div>
          <div className="text-sm text-slate-500">As at {fmtDate(asOf)}</div>
        </div>

        <div className="space-y-6">
          <Section
            title="Assets"
            rows={bs.assets}
            total={bs.totalAssets}
            totalLabel="Total Assets"
            color="text-blue-700"
          />
          <Section
            title="Liabilities"
            rows={bs.liabilities}
            total={bs.totalLiabilities}
            totalLabel="Total Liabilities"
            color="text-amber-700"
          />
          <Section
            title="Equity"
            rows={bs.equity}
            total={bs.totalEquity}
            totalLabel="Total Equity"
            color="text-purple-700"
          />

          <div className="flex items-center justify-between rounded-lg bg-slate-800 px-4 py-3 text-white">
            <span className="font-semibold">Liabilities + Equity</span>
            <span className="text-lg font-bold">
              {sgd(bs.totalLiabilities + bs.totalEquity)}
            </span>
          </div>
          <p className="text-center text-xs text-slate-400">
            {balanced ? "✓ Balanced" : "⚠ Not balanced"} · Simplified single-entry
            derivation (v1) — cash basis with open invoices as receivables.
          </p>
        </div>
      </Card>
    </div>
  );
}
