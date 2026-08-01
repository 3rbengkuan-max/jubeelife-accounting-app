import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, EmptyState, Badge } from "@/components/ui";
import { createTenancy, deleteTenancy, updateTenancyStatus } from "./actions";
import { sgd, fmtDate, todayISO } from "@/lib/format";
import type { Tenancy, Unit, Tenant } from "@/lib/types";

export const dynamic = "force-dynamic";

const labelCls = "block text-xs font-semibold text-slate-600 mb-1";
const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]";

export default async function TenanciesPage() {
  const supabase = await createClient();
  const [tenRes, unitsRes, tenantsRes] = await Promise.all([
    supabase
      .from("tenancies")
      .select("*, units(label, properties(name)), tenants(name)")
      .order("created_at", { ascending: false }),
    supabase.from("units").select("*, properties(name)").order("label"),
    supabase.from("tenants").select("*").order("name"),
  ]);
  const tenancies = (tenRes.data as unknown as Tenancy[]) ?? [];
  const units = (unitsRes.data as unknown as Unit[]) ?? [];
  const tenants = (tenantsRes.data as Tenant[]) ?? [];
  const canCreate = units.length > 0 && tenants.length > 0;

  return (
    <div>
      <PageHeader
        title="Tenancies"
        subtitle="Lease contracts linking a tenant to a unit, with rent and period."
      />

      <Card className="mb-6 p-5">
        <h2 className="mb-4 font-semibold text-slate-800">Create tenancy</h2>
        {!canCreate ? (
          <p className="text-sm text-slate-400">
            You need at least one unit and one tenant first.
          </p>
        ) : (
          <form action={createTenancy} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className={labelCls} htmlFor="ten-unit">
                Unit *
              </label>
              <select id="ten-unit" name="unit_id" required className={inputCls}>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.properties?.name ? `${u.properties.name} · ` : ""}
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="ten-tenant">
                Tenant *
              </label>
              <select id="ten-tenant" name="tenant_id" required className={inputCls}>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="ten-rent">
                Monthly rent (S$) *
              </label>
              <input
                id="ten-rent"
                name="monthly_rent"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="2500.00"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="ten-start">
                Start date
              </label>
              <input id="ten-start" name="start_date" type="date" defaultValue={todayISO()} className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="ten-end">
                End date
              </label>
              <input id="ten-end" name="end_date" type="date" className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="ten-status">
                Status
              </label>
              <select id="ten-status" name="status" className={inputCls}>
                <option value="active">Active</option>
                <option value="ended">Ended</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <button
                type="submit"
                className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-dark)]"
              >
                Create tenancy
              </button>
            </div>
          </form>
        )}
      </Card>

      {tenancies.length === 0 ? (
        <EmptyState
          title="No tenancies yet"
          description="Create a tenancy to track who rents which unit, for how much, and for how long."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-semibold">Unit</th>
                  <th className="px-4 py-3 font-semibold">Tenant</th>
                  <th className="px-4 py-3 font-semibold">Period</th>
                  <th className="px-4 py-3 text-right font-semibold">Rent / mo</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {tenancies.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {t.units?.properties?.name ? `${t.units.properties.name} · ` : ""}
                      {t.units?.label ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{t.tenants?.name ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {fmtDate(t.start_date)} → {fmtDate(t.end_date)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">
                      {sgd(t.monthly_rent)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={t.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <form action={updateTenancyStatus} className="flex items-center gap-1">
                          <input type="hidden" name="id" value={t.id} />
                          <select
                            name="status"
                            defaultValue={t.status}
                            className="rounded border border-slate-200 px-1.5 py-1 text-xs text-slate-600"
                          >
                            <option value="active">active</option>
                            <option value="ended">ended</option>
                            <option value="terminated">terminated</option>
                          </select>
                          <button className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200">
                            Set
                          </button>
                        </form>
                        <form action={deleteTenancy}>
                          <input type="hidden" name="id" value={t.id} />
                          <button className="text-xs text-slate-400 hover:text-rose-600" title="Delete tenancy">
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
      )}
    </div>
  );
}
