"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { autoMatchStatement, type AutoMatchState } from "@/app/reconciliation/ai-actions";
import { sgd, fmtDate } from "@/lib/format";
import type { DocumentRow } from "@/lib/types";

function RunButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-dark)] disabled:opacity-60"
    >
      {pending ? "Reading statement…" : "✨ Auto-read & match"}
    </button>
  );
}

export default function AutoMatchPanel({
  statements,
  start,
  end,
  monthLabel,
}: {
  statements: DocumentRow[];
  start: string;
  end: string;
  monthLabel: string;
}) {
  const [state, formAction] = useActionState<AutoMatchState, FormData>(
    autoMatchStatement,
    undefined,
  );

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-violet-900">✨ Auto-read statement</h2>
          <p className="mt-1 text-sm text-violet-700/80">
            Let AI read an uploaded bank statement (PDF or photo) and tick off the
            matching transactions for {monthLabel} automatically.
          </p>
        </div>
      </div>

      {statements.length === 0 ? (
        <p className="mt-3 text-sm text-violet-700/70">
          Upload a bank statement in Documents first, then it&apos;ll appear here.
        </p>
      ) : (
        <form action={formAction} className="mt-4 flex flex-wrap items-end gap-2">
          <input type="hidden" name="start" value={start} />
          <input type="hidden" name="end" value={end} />
          <div>
            <label htmlFor="document_id" className="block text-xs font-semibold text-violet-800">
              Statement
            </label>
            <select
              id="document_id"
              name="document_id"
              className="rounded-lg border border-violet-300 bg-white px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
            >
              {statements.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.file_name}
                </option>
              ))}
            </select>
          </div>
          <RunButton disabled={false} />
        </form>
      )}

      {state && state.ok === false && (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {state.error}
        </div>
      )}

      {state && state.ok === true && (
        <div className="mt-4 space-y-3 text-sm">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-emerald-800">
            ✓ Read {state.totalLines} line{state.totalLines === 1 ? "" : "s"} from the
            statement and auto-reconciled <strong>{state.matched}</strong> transaction
            {state.matched === 1 ? "" : "s"}.
          </div>

          {state.unmatchedLines.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="mb-1 font-semibold text-amber-800">
                On the statement but not recorded ({state.unmatchedLines.length}) — you may
                need to add these:
              </div>
              <ul className="space-y-0.5 text-amber-800/90">
                {state.unmatchedLines.slice(0, 12).map((l, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="truncate">
                      {fmtDate(l.date)} · {l.description}
                    </span>
                    <span className={l.direction === "in" ? "text-emerald-700" : "text-rose-700"}>
                      {l.direction === "in" ? "+" : "−"}
                      {sgd(l.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {state.unmatchedTxns.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              <div className="mb-1 font-semibold text-slate-700">
                Recorded but not found on the statement ({state.unmatchedTxns.length}):
              </div>
              <ul className="space-y-0.5 text-slate-600">
                {state.unmatchedTxns.slice(0, 12).map((t, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="truncate">
                      {fmtDate(t.date)} · {t.description}
                    </span>
                    <span className={t.type === "income" ? "text-emerald-700" : "text-rose-700"}>
                      {t.type === "income" ? "+" : "−"}
                      {sgd(t.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
