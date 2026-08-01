"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { uploadDocument, type DocActionState } from "@/app/documents/actions";

const labelCls = "block text-xs font-semibold text-slate-600 mb-1";
const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-dark)] disabled:opacity-60"
    >
      {pending ? "Uploading…" : "Upload document"}
    </button>
  );
}

export default function DocumentUploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState<DocActionState, FormData>(
    async (prev, fd) => {
      const res = await uploadDocument(prev, fd);
      if (res?.ok) formRef.current?.reset();
      return res;
    },
    undefined,
  );

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {state.error}
        </div>
      )}
      {state?.ok && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          ✓ {state.ok}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="document">
            File *
          </label>
          <input
            id="document"
            name="document"
            type="file"
            required
            accept="image/*,application/pdf,.csv,.xls,.xlsx"
            className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="doc_type">
            Document type
          </label>
          <select id="doc_type" name="doc_type" defaultValue="bank_statement" className={inputCls}>
            <option value="bank_statement">Bank statement</option>
            <option value="mcst_bill">MCST bill</option>
            <option value="tenancy_agreement">Tenancy agreement</option>
            <option value="invoice">Invoice</option>
            <option value="receipt">Receipt</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}
