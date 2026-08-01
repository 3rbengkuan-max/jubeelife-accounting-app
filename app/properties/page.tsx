import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import {
  createProperty,
  deleteProperty,
  createUnit,
  deleteUnit,
} from "./actions";
import type { Property, Unit } from "@/lib/types";

export const dynamic = "force-dynamic";

const labelCls = "block text-xs font-semibold text-slate-600 mb-1";
const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]";
const btnCls =
  "rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-dark)]";

export default async function PropertiesPage() {
  const supabase = await createClient();
  const [propsRes, unitsRes] = await Promise.all([
    supabase.from("properties").select("*").order("name"),
    supabase.from("units").select("*").order("label"),
  ]);
  const properties = (propsRes.data as Property[]) ?? [];
  const units = (unitsRes.data as Unit[]) ?? [];

  return (
    <div>
      <PageHeader
        title="Properties & Units"
        subtitle="Buildings you manage and the rentable units inside them."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-semibold text-slate-800">Add property</h2>
          <form action={createProperty} className="space-y-3">
            <div>
              <label className={labelCls} htmlFor="p-name">
                Name *
              </label>
              <input id="p-name" name="name" required placeholder="e.g. Gem Residence" className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="p-addr">
                Address
              </label>
              <input id="p-addr" name="address" placeholder="Street, postal code" className={inputCls} />
            </div>
            <button type="submit" className={btnCls}>
              Add property
            </button>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-semibold text-slate-800">Add unit</h2>
          {properties.length === 0 ? (
            <p className="text-sm text-slate-400">Add a property first.</p>
          ) : (
            <form action={createUnit} className="space-y-3">
              <div>
                <label className={labelCls} htmlFor="u-prop">
                  Property *
                </label>
                <select id="u-prop" name="property_id" required className={inputCls}>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="u-label">
                    Label *
                  </label>
                  <input id="u-label" name="label" required placeholder="e.g. 12-03A" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="u-type">
                    Type
                  </label>
                  <select id="u-type" name="type" className={inputCls}>
                    <option value="room">Room</option>
                    <option value="unit">Unit</option>
                  </select>
                </div>
              </div>
              <button type="submit" className={btnCls}>
                Add unit
              </button>
            </form>
          )}
        </Card>
      </div>

      <div className="mt-6 space-y-4">
        {properties.length === 0 ? (
          <EmptyState
            title="No properties yet"
            description="Add your first property (e.g. Gem Residence) to start tracking its units and rent."
          />
        ) : (
          properties.map((p) => {
            const pUnits = units.filter((u) => u.property_id === p.id);
            return (
              <Card key={p.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">{p.name}</h3>
                    <p className="text-sm text-slate-500">{p.address ?? "No address"}</p>
                  </div>
                  <form action={deleteProperty}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="text-xs text-slate-400 hover:text-rose-600" title="Delete property">
                      Delete
                    </button>
                  </form>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {pUnits.length === 0 ? (
                    <span className="text-sm text-slate-400">No units yet.</span>
                  ) : (
                    pUnits.map((u) => (
                      <span
                        key={u.id}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                      >
                        {u.label}
                        <span className="text-xs text-slate-400 capitalize">{u.type}</span>
                        <form action={deleteUnit} className="inline">
                          <input type="hidden" name="id" value={u.id} />
                          <button className="text-slate-400 hover:text-rose-600" title="Remove unit">
                            ✕
                          </button>
                        </form>
                      </span>
                    ))
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
