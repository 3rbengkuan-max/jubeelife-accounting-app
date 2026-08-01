import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import InvoiceForm from "@/components/InvoiceForm";
import type { Tenant, Tenancy } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const supabase = await createClient();
  const [tenantsRes, tenanciesRes] = await Promise.all([
    supabase.from("tenants").select("*").order("name"),
    supabase
      .from("tenancies")
      .select("*, units(label), tenants(name)")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <PageHeader
        title="New Invoice"
        subtitle="Bill a tenant. Save as a draft or issue it straight away."
      />
      <Card className="max-w-3xl p-6">
        <InvoiceForm
          tenants={(tenantsRes.data as Tenant[]) ?? []}
          tenancies={(tenanciesRes.data as unknown as Tenancy[]) ?? []}
        />
      </Card>
    </div>
  );
}
