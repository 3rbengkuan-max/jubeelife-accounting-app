import Link from "next/link";
import { PageHeader, Card } from "@/components/ui";

export const dynamic = "force-dynamic";

const reports = [
  {
    href: "/reports/pnl",
    title: "Profit & Loss",
    desc: "Income and expenses by account for a selected month, with net profit.",
    icon: "📈",
  },
  {
    href: "/reports/balance-sheet",
    title: "Balance Sheet",
    desc: "Assets, liabilities and equity as at a chosen date (simplified single-entry).",
    icon: "⚖️",
  },
  {
    href: "/reports/cash-flow",
    title: "Cash Flow",
    desc: "Cash in and cash out by category for a selected month.",
    icon: "💵",
  },
];

export default function ReportsHub() {
  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Financial statements computed directly from your transactions — always reproducible, never cached."
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {reports.map((r) => (
          <Link key={r.href} href={r.href}>
            <Card className="h-full p-6 transition-shadow hover:shadow-md">
              <div className="text-3xl">{r.icon}</div>
              <h2 className="mt-3 font-semibold text-slate-800">{r.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{r.desc}</p>
              <span className="mt-4 inline-block text-sm font-medium text-[var(--brand)]">
                Open report →
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
