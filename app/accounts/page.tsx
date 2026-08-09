import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import DbUnavailable from "@/components/DbUnavailable";
import type { Account, AccountType } from "@/lib/types";

export const dynamic = "force-dynamic";

const GROUPS: { type: AccountType; label: string; color: string }[] = [
  { type: "income", label: "Income", color: "text-emerald-600" },
  { type: "expense", label: "Expenses", color: "text-rose-600" },
  { type: "asset", label: "Assets", color: "text-blue-600" },
  { type: "liability", label: "Liabilities", color: "text-amber-600" },
  { type: "equity", label: "Equity", color: "text-purple-600" },
];

export default async function AccountsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("chart_of_accounts").select("*").order("code");
  if (error) {
    return (
      <div>
        <PageHeader title="Chart of Accounts" subtitle="Singapore FRS-aligned account codes." />
        <DbUnavailable detail={error.message} />
      </div>
    );
  }
  const accounts = (data as Account[]) ?? [];

  return (
    <div>
      <PageHeader
        title="Chart of Accounts"
        subtitle="Singapore FRS-aligned account codes used to categorise every transaction."
      />

      {accounts.length === 0 ? (
        <EmptyState title="No accounts" description="The chart of accounts seed did not load." />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {GROUPS.map((g) => {
            const rows = accounts.filter((a) => a.type === g.type);
            if (rows.length === 0) return null;
            return (
              <Card key={g.type} className="overflow-hidden">
                <div className="border-b border-slate-100 px-5 py-3">
                  <h2 className={`font-semibold ${g.color}`}>{g.label}</h2>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {rows.map((a) => (
                      <tr key={a.id} className="border-b border-slate-50 last:border-0">
                        <td className="px-5 py-2.5 font-mono text-xs text-slate-500">{a.code}</td>
                        <td className="px-2 py-2.5 text-slate-700">{a.name}</td>
                        <td className="px-5 py-2.5 text-right">
                          {a.gst_applicable && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                              GST
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
