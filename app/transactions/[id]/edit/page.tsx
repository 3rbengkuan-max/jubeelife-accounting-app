import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import DbUnavailable from "@/components/DbUnavailable";
import TransactionForm from "@/components/TransactionForm";
import { todayISO } from "@/lib/format";
import type { Transaction } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [txnRes, accounts, properties, units, tenancies] = await Promise.all([
    supabase.from("transactions").select("*").eq("id", id).single(),
    supabase.from("chart_of_accounts").select("*").order("code"),
    supabase.from("properties").select("*").order("name"),
    supabase.from("units").select("*").order("label"),
    supabase
      .from("tenancies")
      .select("*, units(*), tenants(*)")
      .order("created_at", { ascending: false }),
  ]);

  if (txnRes.error) {
    return (
      <div>
        <PageHeader title="Edit Transaction" />
        <DbUnavailable detail={txnRes.error.message} />
      </div>
    );
  }
  if (!txnRes.data) notFound();

  return (
    <div>
      <PageHeader
        title="Edit Transaction"
        subtitle="Change any detail and save. Amounts and reports update immediately."
      />
      <Card className="max-w-3xl p-6">
        <TransactionForm
          initial={txnRes.data as Transaction}
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
