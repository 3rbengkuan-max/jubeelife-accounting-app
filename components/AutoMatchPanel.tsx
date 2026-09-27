"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  autoMatchStatement,
  importStatementLines,
  type AutoMatchState,
  type ImportState,
} from "@/app/reconciliation/ai-actions";
import { sgd, fmtDate } from "@/lib/format";
import type { DocumentRow, Account } from "@/lib/types";
import type { StatementLine } from "@/lib/anthropic";

function RunButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-dark)] disabled:opacity-60"
    >
      {pending ? "Reading statement…" : "✨ Auto-read & match"}
    </button>
  );
}

// Interactive list of statement lines that had no matching transaction:
// pick a category per line and import the selected ones as transactions.
function ImportUnmatched({
  lines,
  accounts,
}: {
  lines: StatementLine[];
  accounts: Account[];
}) {
  const incomeAccts = accounts.filter((a) => a.type === "income");
  const expenseAccts = accounts.filter((a) => a.type === "expense");

  const defaultAcctId = (l: StatementLine) => {
    const pool = l.direction === "in" ? incomeAccts : expenseAccts;
    const byCode = l.account_code ? pool.find((a) => a.code === l.account_code) : undefined;
    return (byCode ?? pool[0])?.id ?? "";
  };

  const [rows, setRows] = useState(
    lines.map((l) => ({ line: l, selected: true, accountId: defaultAcctId(l) })),
  );
  const [state, formAction, pending] = useActionState<ImportState, FormData>(
    importStatementLines,
    undefined,
  );

  if (state?.ok) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        ✓ Imported <strong>{state.created}</strong> transaction
        {state.created === 1 ? "" : "s"} from the statement — they&apos;re now recorded
        and ticked as reconciled. Re-run Auto-read if you want to refresh the match.
      </div>
    );
  }

  const chosen = rows.filter((r) => r.selected && r.accountId);
  const payload = JSON.stringify(
    chosen.map((r) => ({
      date: r.line.date,
      description: r.line.description,
      amount: r.line.amount,
      direction: r.line.direction,
      account_id: r.accountId,
    })),
  );

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="mb-1 font-semibold text-amber-900">
        On the statement but not recorded ({lines.length})
      </div>
      <p className="mb-3 text-xs text-amber-800/80">
        Review the category (suggested by AI), untick anything you don&apos;t want, then
        import them as transactions.
      </p>

      {state && !state.ok && (
        <div className="mb-2 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        {rows.map((r, i) => {
          const pool = r.line.direction === "in" ? incomeAccts : expenseAccts;
          return (
            <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={r.selected}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((x, idx) => (idx === i ? { ...x, selected: e.target.checked } : x)),
                  )
                }
                className="h-4 w-4 accent-[var(--brand)]"
              />
              <span className="w-20 shrink-0 text-xs text-amber-800/80">{fmtDate(r.line.date)}</span>
              <span className="min-w-0 flex-1 truncate text-amber-900">{r.line.description}</span>
              <span
                className={`w-20 shrink-0 text-right font-medium ${r.line.direction === "in" ? "text-emerald-700" : "text-rose-700"}`}
              >
                {r.line.direction === "in" ? "+" : "−"}
                {sgd(r.line.amount)}
              </span>
              <select
                value={r.accountId}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((x, idx) => (idx === i ? { ...x, accountId: e.target.value } : x)),
                  )
                }
                disabled={!r.selected}
                className="w-44 shrink-0 rounded border border-amber-300 bg-white px-2 py-1 text-xs disabled:opacity-50"
              >
                {pool.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} · {a.name}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      <form action={formAction} className="mt-3">
        <input type="hidden" name="lines" value={payload} />
        <button
          type="submit"
          disabled={pending || chosen.length === 0}
          className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-dark)] disabled:opacity-50"
        >
          {pending
            ? "Importing…"
            : `Import ${chosen.length} transaction${chosen.length === 1 ? "" : "s"}`}
        </button>
      </form>
    </div>
  );
}

export default function AutoMatchPanel({
  statements,
  accounts,
  start,
  end,
  monthLabel,
}: {
  statements: DocumentRow[];
  accounts: Account[];
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
            Let AI read an uploaded bank statement (PDF or photo), tick off the matching
            transactions for {monthLabel}, and import any that aren&apos;t recorded yet.
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
          <RunButton />
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
            <ImportUnmatched
              key={state.unmatchedLines.map((l) => `${l.date}|${l.amount}|${l.description}`).join(";")}
              lines={state.unmatchedLines}
              accounts={accounts}
            />
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
