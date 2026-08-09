import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, EmptyState, Badge, LinkButton } from "@/components/ui";
import { sgd, fmtDate, num } from "@/lib/format";
import { updateInvoiceStatus, deleteInvoice } from "./actions";
import DbUnavailable from "@/components/DbUnavailable";
import type { Invoice } from "@/lib/types";

export const dynamic = "force-dynamic";

const NEXT_STATUS: Record<string, { to: string; label: string }[]> = {
  draft: [{ to: "issued", label: "Issue" }],
  issued: [
    { to: "paid", label: "Mark paid" },
    { to: "overdue", label: "Mark overdue" },
  ],
  overdue: [{ to: "paid", label: "Mark paid" }],
  paid: [],
};

export default async function InvoicesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*, tenants(name)")
    .order("issue_date", { ascending: false });
  if (error) {
    return (
      <div>
        <PageHeader title="Invoices" subtitle="Bill tenants and track what's outstanding." />
        <DbUnavailable detail={error.message} />
      </div>
    );
  }
  const invoices = (data as unknown as Invoice[]) ?? [];

  const outstanding = invoices
    .filter((i) => i.status === "issued" || i.status === "overdue")
    .reduce((s, i) => s + num(i.total), 0);
  const paid = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + num(i.total), 0);

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Bill tenants and track what's outstanding."
        action={<LinkButton href="/invoices/new">+ New Invoice</LinkButton>}
      />

      {invoices.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="Create your first invoice to bill a tenant and track receivables."
          ctaHref="/invoices/new"
          ctaLabel="+ New Invoice"
        />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
            <Card className="p-4">
              <div className="text-xs uppercase text-slate-400">Outstanding</div>
              <div className="mt-1 font-bold text-amber-600">{sgd(outstanding)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs uppercase text-slate-400">Paid</div>
              <div className="mt-1 font-bold text-emerald-600">{sgd(paid)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs uppercase text-slate-400">Total invoices</div>
              <div className="mt-1 font-bold text-slate-800">{invoices.length}</div>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-semibold">Invoice</th>
                    <th className="px-4 py-3 font-semibold">Tenant</th>
                    <th className="px-4 py-3 font-semibold">Issued</th>
                    <th className="px-4 py-3 font-semibold">Due</th>
                    <th className="px-4 py-3 text-right font-semibold">Total</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700">
                        {inv.invoice_number}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{inv.tenants?.name ?? "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                        {fmtDate(inv.issue_date)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                        {fmtDate(inv.due_date)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">
                        {sgd(inv.total)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge value={inv.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {(NEXT_STATUS[inv.status] ?? []).map((t) => (
                            <form key={t.to} action={updateInvoiceStatus}>
                              <input type="hidden" name="id" value={inv.id} />
                              <input type="hidden" name="status" value={t.to} />
                              <button className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200">
                                {t.label}
                              </button>
                            </form>
                          ))}
                          <form action={deleteInvoice}>
                            <input type="hidden" name="id" value={inv.id} />
                            <button className="px-1 text-xs text-slate-400 hover:text-rose-600" title="Delete invoice">
                              ✕
                            </button>
                          </form>
                        </div>
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
