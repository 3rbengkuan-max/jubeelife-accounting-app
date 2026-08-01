"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { createInvoice, type InvoiceActionState } from "@/app/invoices/actions";
import { sgd, todayISO } from "@/lib/format";
import type { Tenant, Tenancy } from "@/lib/types";

type Line = { description: string; qty: number; unit_price: number };

const labelCls = "block text-xs font-semibold text-slate-600 mb-1";
const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]";

export default function InvoiceForm({
  tenants,
  tenancies,
}: {
  tenants: Tenant[];
  tenancies: Tenancy[];
}) {
  const [state, formAction, pending] = useActionState<InvoiceActionState, FormData>(
    createInvoice,
    undefined,
  );
  const [lines, setLines] = useState<Line[]>([
    { description: "", qty: 1, unit_price: 0 },
  ]);
  const [gstRate, setGstRate] = useState("0");

  const computed = useMemo(() => {
    const withAmount = lines.map((l) => ({
      ...l,
      amount: Math.round(Number(l.qty || 0) * Number(l.unit_price || 0) * 100) / 100,
    }));
    const subtotal = withAmount.reduce((s, l) => s + l.amount, 0);
    const gst = Math.round(subtotal * (parseFloat(gstRate) / 100) * 100) / 100;
    return { withAmount, subtotal, gst, total: subtotal + gst };
  }, [lines, gstRate]);

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const addLine = () =>
    setLines((prev) => [...prev, { description: "", qty: 1, unit_price: 0 }]);
  const removeLine = (i: number) =>
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)));

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      )}

      <input type="hidden" name="line_items" value={JSON.stringify(computed.withAmount)} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="tenant_id">
            Tenant *
          </label>
          <select id="tenant_id" name="tenant_id" required className={inputCls}>
            <option value="">Select tenant…</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="tenancy_id">
            Tenancy (optional)
          </label>
          <select id="tenancy_id" name="tenancy_id" className={inputCls}>
            <option value="">—</option>
            {tenancies.map((t) => (
              <option key={t.id} value={t.id}>
                {t.units?.label ?? "Unit"} · {t.tenants?.name ?? "Tenant"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="issue_date">
            Issue date
          </label>
          <input id="issue_date" name="issue_date" type="date" defaultValue={todayISO()} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="due_date">
            Due date
          </label>
          <input id="due_date" name="due_date" type="date" className={inputCls} />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className={labelCls}>Line items *</label>
          <button
            type="button"
            onClick={addLine}
            className="text-sm font-medium text-[var(--brand)] hover:underline"
          >
            + Add line
          </button>
        </div>
        <div className="space-y-2">
          {computed.withAmount.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                placeholder="Description"
                value={lines[i].description}
                onChange={(e) => setLine(i, { description: e.target.value })}
                className={`${inputCls} flex-1`}
              />
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Qty"
                value={lines[i].qty}
                onChange={(e) => setLine(i, { qty: parseFloat(e.target.value) || 0 })}
                className={`${inputCls} w-20`}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Unit price"
                value={lines[i].unit_price}
                onChange={(e) => setLine(i, { unit_price: parseFloat(e.target.value) || 0 })}
                className={`${inputCls} w-28`}
              />
              <div className="w-24 text-right text-sm font-medium text-slate-700">
                {sgd(l.amount)}
              </div>
              <button
                type="button"
                onClick={() => removeLine(i)}
                className="px-1 text-slate-400 hover:text-rose-600"
                title="Remove line"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <label className={labelCls} htmlFor="gst_rate">
            GST rate (%)
          </label>
          <select
            id="gst_rate"
            name="gst_rate"
            value={gstRate}
            onChange={(e) => setGstRate(e.target.value)}
            className={inputCls}
          >
            <option value="0">0% (exempt)</option>
            <option value="9">9% (standard-rated)</option>
          </select>
        </div>
        <div className="min-w-[220px] space-y-1 rounded-lg bg-slate-50 px-4 py-3 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal</span>
            <span className="font-medium text-slate-700">{sgd(computed.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>GST</span>
            <span className="font-medium text-slate-700">{sgd(computed.gst)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-bold text-slate-800">
            <span>Total</span>
            <span>{sgd(computed.total)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          name="status"
          value="issued"
          disabled={pending}
          className="rounded-lg bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-dark)] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save & Issue"}
        </button>
        <button
          type="submit"
          name="status"
          value="draft"
          disabled={pending}
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          Save as draft
        </button>
        <Link
          href="/invoices"
          className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
