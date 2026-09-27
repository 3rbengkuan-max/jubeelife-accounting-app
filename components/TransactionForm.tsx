"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  createTransaction,
  updateTransaction,
  type ActionState,
} from "@/app/transactions/actions";
import { sgd } from "@/lib/format";
import type { Account, Property, Tenancy, Unit, Transaction } from "@/lib/types";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-dark)] disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

const labelCls = "block text-xs font-semibold text-slate-600 mb-1";
const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]";

export default function TransactionForm({
  accounts,
  properties,
  units,
  tenancies,
  defaultDate,
  initial,
}: {
  accounts: Account[];
  properties: Property[];
  units: Unit[];
  tenancies: Tenancy[];
  defaultDate: string;
  initial?: Transaction;
}) {
  const isEdit = !!initial;
  const [state, formAction] = useActionState<ActionState, FormData>(
    isEdit ? updateTransaction : createTransaction,
    undefined,
  );
  const [type, setType] = useState<"income" | "expense">(initial?.type ?? "income");
  const [propertyId, setPropertyId] = useState(initial?.property_id ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [gstRate, setGstRate] = useState(initial ? String(initial.gst_rate) : "0");

  const filteredAccounts = accounts.filter((a) => a.type === type);
  const filteredUnits = propertyId
    ? units.filter((u) => u.property_id === propertyId)
    : units;

  const { gst, total } = useMemo(() => {
    const a = parseFloat(amount) || 0;
    const r = parseFloat(gstRate) || 0;
    const g = Math.round(a * (r / 100) * 100) / 100;
    return { gst: g, total: a + g };
  }, [amount, gstRate]);

  return (
    <form action={formAction} className="space-y-5">
      {isEdit && <input type="hidden" name="id" value={initial!.id} />}
      {state?.error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Type *</label>
          <div className="flex gap-2">
            {(["income", "expense"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize ${
                  type === t
                    ? t === "income"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-rose-500 bg-rose-50 text-rose-700"
                    : "border-slate-300 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <input type="hidden" name="type" value={type} />
        </div>

        <div>
          <label className={labelCls} htmlFor="date">
            Date *
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={initial?.date ?? defaultDate}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="account_id">
            Account (category) *
          </label>
          <select
            id="account_id"
            name="account_id"
            required
            defaultValue={initial?.account_id ?? ""}
            className={inputCls}
          >
            <option value="">Select account…</option>
            {filteredAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} · {a.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls} htmlFor="amount">
            Amount (S$) *
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="property_id">
            Property
          </label>
          <select
            id="property_id"
            name="property_id"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className={inputCls}
          >
            <option value="">—</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls} htmlFor="unit_id">
            Unit
          </label>
          <select
            id="unit_id"
            name="unit_id"
            defaultValue={initial?.unit_id ?? ""}
            className={inputCls}
          >
            <option value="">—</option>
            {filteredUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls} htmlFor="tenancy_id">
            Tenancy (optional)
          </label>
          <select
            id="tenancy_id"
            name="tenancy_id"
            defaultValue={initial?.tenancy_id ?? ""}
            className={inputCls}
          >
            <option value="">—</option>
            {tenancies.map((t) => (
              <option key={t.id} value={t.id}>
                {t.units?.label ?? "Unit"} · {t.tenants?.name ?? "Tenant"} ·{" "}
                {sgd(t.monthly_rent)}/mo
              </option>
            ))}
          </select>
        </div>

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
            <option value="0">0% (exempt / not registered)</option>
            <option value="9">9% (standard-rated)</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="description">
          Description
        </label>
        <input
          id="description"
          name="description"
          type="text"
          defaultValue={initial?.description ?? ""}
          placeholder="e.g. October rent — 12-03A"
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="document">
            {isEdit ? "Attach a new document (optional)" : "Attach document (receipt / invoice)"}
          </label>
          <input
            id="document"
            name="document"
            type="file"
            accept="image/*,application/pdf"
            className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="doc_type">
            Document type
          </label>
          <select id="doc_type" name="doc_type" className={inputCls}>
            <option value="receipt">Receipt</option>
            <option value="invoice">Invoice</option>
            <option value="bank_statement">Bank statement</option>
            <option value="mcst_bill">MCST bill</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3 text-sm">
        <div className="text-slate-500">
          Net <span className="font-semibold text-slate-700">{sgd(parseFloat(amount) || 0)}</span>
          <span className="mx-2">·</span>
          GST <span className="font-semibold text-slate-700">{sgd(gst)}</span>
        </div>
        <div className="text-slate-500">
          Total incl. GST:{" "}
          <span className="text-base font-bold text-slate-800">{sgd(total)}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton label={isEdit ? "Save changes" : "Save transaction"} />
        <Link
          href="/transactions"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
