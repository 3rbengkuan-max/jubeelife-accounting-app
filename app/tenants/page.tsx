import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { createTenant, deleteTenant } from "./actions";
import { fmtDate } from "@/lib/format";
import type { Tenant } from "@/lib/types";

export const dynamic = "force-dynamic";

const labelCls = "block text-xs font-semibold text-slate-600 mb-1";
const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]";

export default async function TenantsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("tenants").select("*").order("name");
  const tenants = (data as Tenant[]) ?? [];

  return (
    <div>
      <PageHeader title="Tenants" subtitle="People leasing your units." />

      <Card className="mb-6 p-5">
        <h2 className="mb-4 font-semibold text-slate-800">Add tenant</h2>
        <form action={createTenant} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={labelCls} htmlFor="t-name">
              Name *
            </label>
            <input id="t-name" name="name" required placeholder="Full name" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="t-contact">
              Contact
            </label>
            <input id="t-contact" name="contact" placeholder="+65 …" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="t-email">
              Email
            </label>
            <input id="t-email" name="email" type="email" placeholder="name@example.com" className={inputCls} />
          </div>
          <div className="sm:col-span-3">
            <button
              type="submit"
              className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-dark)]"
            >
              Add tenant
            </button>
          </div>
        </form>
      </Card>

      {tenants.length === 0 ? (
        <EmptyState
          title="No tenants yet"
          description="Add a tenant so you can attach them to a tenancy and issue invoices."
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Added</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-700">{t.name}</td>
                  <td className="px-4 py-3 text-slate-600">{t.contact ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{t.email ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{fmtDate(t.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={deleteTenant}>
                      <input type="hidden" name="id" value={t.id} />
                      <button className="text-xs text-slate-400 hover:text-rose-600" title="Delete tenant">
                        ✕
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
