"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { extractStatementLines, type StatementLine } from "@/lib/anthropic";
import { num } from "@/lib/format";
import type { Transaction } from "@/lib/types";

export type AutoMatchState =
  | {
      ok: true;
      matched: number;
      totalLines: number;
      unmatchedLines: StatementLine[];
      unmatchedTxns: { date: string; description: string; amount: number; type: string }[];
    }
  | { ok: false; error: string }
  | undefined;

function daysBetween(a: string, b: string): number {
  return Math.abs(
    (new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24),
  );
}

export async function autoMatchStatement(
  _prev: AutoMatchState,
  formData: FormData,
): Promise<AutoMatchState> {
  const documentId = formData.get("document_id")?.toString();
  const start = formData.get("start")?.toString();
  const end = formData.get("end")?.toString();
  if (!documentId || !start || !end) {
    return { ok: false, error: "Pick a statement and a month first." };
  }

  const supabase = await createClient();

  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path, mime_type, file_name")
    .eq("id", documentId)
    .single();
  if (!doc) return { ok: false, error: "That statement could not be found." };

  const { data: blob, error: dlErr } = await supabase.storage
    .from("documents")
    .download(doc.storage_path);
  if (dlErr || !blob) {
    return { ok: false, error: `Could not download the statement: ${dlErr?.message ?? "unknown error"}` };
  }
  const bytes = new Uint8Array(await blob.arrayBuffer());

  // Chart of accounts, so the AI can suggest a category per line.
  const { data: acctData } = await supabase
    .from("chart_of_accounts")
    .select("code, name, type")
    .order("code");
  const accounts = (acctData as { code: string; name: string; type: string }[]) ?? [];

  let lines: StatementLine[] | null;
  try {
    lines = await extractStatementLines(bytes, doc.mime_type ?? "application/pdf", accounts);
  } catch (e) {
    return { ok: false, error: `AI extraction failed: ${(e as Error).message}` };
  }
  if (lines === null) {
    return {
      ok: false,
      error:
        "AI reading isn't configured yet — the ANTHROPIC_API_KEY is missing from the app environment.",
    };
  }

  // Load this month's transactions
  const { data: txData } = await supabase
    .from("transactions")
    .select("id, date, type, amount, description, reconciled")
    .gte("date", start)
    .lte("date", end);
  const txns = (txData as unknown as Transaction[]) ?? [];

  const usedTxn = new Set<string>();
  const matchedIds: string[] = [];
  const unmatchedLines: StatementLine[] = [];

  for (const line of lines) {
    const wantType = line.direction === "in" ? "income" : "expense";
    // Candidate: same type, amount within a cent, closest date within 5 days, not yet used
    let best: Transaction | null = null;
    let bestDelta = Infinity;
    for (const t of txns) {
      if (usedTxn.has(t.id)) continue;
      if (t.type !== wantType) continue;
      if (Math.abs(num(t.amount) - num(line.amount)) > 0.01) continue;
      const delta = daysBetween(t.date, line.date);
      if (delta <= 5 && delta < bestDelta) {
        best = t;
        bestDelta = delta;
      }
    }
    if (best) {
      usedTxn.add(best.id);
      if (!best.reconciled) matchedIds.push(best.id);
    } else {
      unmatchedLines.push(line);
    }
  }

  if (matchedIds.length > 0) {
    await supabase.from("transactions").update({ reconciled: true }).in("id", matchedIds);
  }

  const unmatchedTxns = txns
    .filter((t) => !usedTxn.has(t.id))
    .map((t) => ({
      date: t.date,
      description: t.description ?? "—",
      amount: num(t.amount),
      type: t.type,
    }));

  revalidatePath("/reconciliation");

  return {
    ok: true,
    matched: matchedIds.length,
    totalLines: lines.length,
    unmatchedLines,
    unmatchedTxns,
  };
}

// ── Import selected statement lines as new transactions ──────────────────────

export type ImportState =
  | { ok: true; created: number }
  | { ok: false; error: string }
  | undefined;

interface ImportLine {
  date: string;
  description: string;
  amount: number;
  direction: "in" | "out";
  account_id: string;
}

export async function importStatementLines(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  let items: ImportLine[] = [];
  try {
    items = JSON.parse(formData.get("lines")?.toString() || "[]");
  } catch {
    return { ok: false, error: "Could not read the selected lines." };
  }
  items = items.filter(
    (i) => i.account_id && Number(i.amount) > 0 && (i.direction === "in" || i.direction === "out"),
  );
  if (items.length === 0) {
    return { ok: false, error: "Select at least one line and a category for it." };
  }

  const supabase = await createClient();
  const rows = items.map((i) => ({
    date: i.date,
    type: i.direction === "in" ? "income" : "expense",
    account_id: i.account_id,
    description: i.description || null,
    amount: Number(i.amount),
    gst_amount: 0,
    gst_rate: 0,
    reconciled: true, // it came from the statement, so it's already reconciled
  }));

  const { error } = await supabase.from("transactions").insert(rows);
  if (error) {
    return { ok: false, error: `Could not import: ${error.message}` };
  }

  revalidatePath("/reconciliation");
  revalidatePath("/transactions");
  revalidatePath("/reports");
  revalidatePath("/");
  return { ok: true, created: rows.length };
}
