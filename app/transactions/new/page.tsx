import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import TransactionForm from "@/components/TransactionForm";
import { todayISO } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NewTransactionPage() {
  const supabase = await createClient();
  const [accounts, properties, units, tenancies] = await Promise.all([
    supabase.from("chart_of_accounts").select("*").order("code"),
    supabase.from("properties").select("*").order("name"),
    supabase.from("units").select("*").order("label"),
    supabase
      .from("tenancies")
      .select("*, units(*), tenants(*)")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <PageHeader
        title="New Transaction"
        subtitle="Record an income or expense. Attach a receipt to keep an audit trail."
      />
      <Card className="max-w-3xl p-6">
        <TransactionForm
          accounts={accounts.data ?? []}
          properties={properties.data ?? []}
          units={units.data ?? []}
          tenancies={(tenancies.data as never) ?? []}
          defaultDate={todayISO()}
        />
      </Card>
    </div>
  );
}
