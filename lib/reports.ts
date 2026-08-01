import type { SupabaseClient } from "@supabase/supabase-js";
import { num } from "@/lib/format";
import type { Account, Invoice } from "@/lib/types";

type Row = {
  amount: number;
  gst_amount: number;
  type: "income" | "expense";
  chart_of_accounts: Pick<Account, "code" | "name" | "type"> | null;
};

export interface AccountLine {
  code: string;
  name: string;
  total: number;
}

/** Group transactions in [start, end] by account, split into income and expense. */
export async function getProfitAndLoss(
  supabase: SupabaseClient,
  start: string,
  end: string,
) {
  const { data } = await supabase
    .from("transactions")
    .select("amount, gst_amount, type, chart_of_accounts(code,name,type)")
    .gte("date", start)
    .lte("date", end);

  const rows = (data as unknown as Row[]) ?? [];
  const incomeMap = new Map<string, AccountLine>();
  const expenseMap = new Map<string, AccountLine>();

  for (const r of rows) {
    const code = r.chart_of_accounts?.code ?? "0000";
    const name = r.chart_of_accounts?.name ?? "Uncategorised";
    const map = r.type === "income" ? incomeMap : expenseMap;
    const line = map.get(code) ?? { code, name, total: 0 };
    line.total += num(r.amount);
    map.set(code, line);
  }

  const income = [...incomeMap.values()].sort((a, b) => a.code.localeCompare(b.code));
  const expense = [...expenseMap.values()].sort((a, b) => a.code.localeCompare(b.code));
  const totalIncome = income.reduce((s, l) => s + l.total, 0);
  const totalExpense = expense.reduce((s, l) => s + l.total, 0);

  return { income, expense, totalIncome, totalExpense, net: totalIncome - totalExpense };
}

/** Cash movements in [start, end] grouped by account (single-entry = cash basis). */
export async function getCashFlow(
  supabase: SupabaseClient,
  start: string,
  end: string,
) {
  const pnl = await getProfitAndLoss(supabase, start, end);
  return {
    inflows: pnl.income,
    outflows: pnl.expense,
    totalIn: pnl.totalIncome,
    totalOut: pnl.totalExpense,
    netCash: pnl.net,
  };
}

/**
 * Simplified single-entry balance sheet as of a date.
 * Cash = income − expenses to date; A/R = open invoices; GST payable = net GST.
 * Retained earnings = net profit to date; a balancing equity figure keeps
 * Assets = Liabilities + Equity (the app is single-entry, so this is derived).
 */
export async function getBalanceSheet(supabase: SupabaseClient, asOf: string) {
  const [txRes, invRes] = await Promise.all([
    supabase
      .from("transactions")
      .select("amount, gst_amount, type")
      .lte("date", asOf),
    supabase.from("invoices").select("*").lte("issue_date", asOf),
  ]);

  const tx = (txRes.data as { amount: number; gst_amount: number; type: string }[]) ?? [];
  let cash = 0;
  let gstPayable = 0;
  for (const t of tx) {
    if (t.type === "income") {
      cash += num(t.amount) + num(t.gst_amount);
      gstPayable += num(t.gst_amount);
    } else {
      cash -= num(t.amount) + num(t.gst_amount);
      gstPayable -= num(t.gst_amount);
    }
  }

  const invoices = (invRes.data as Invoice[]) ?? [];
  const receivables = invoices
    .filter((i) => i.status === "issued" || i.status === "overdue")
    .reduce((s, i) => s + num(i.total), 0);

  const netProfit = cash - gstPayable; // profit excludes GST held for IRAS

  const totalAssets = cash + receivables;
  const totalLiabilities = gstPayable;
  const retainedEarnings = netProfit + receivables; // accrual-ish: earned incl. open invoices
  const ownersEquity = totalAssets - totalLiabilities - retainedEarnings; // balancing figure

  return {
    assets: [
      { name: "Cash at Bank", total: cash },
      { name: "Accounts Receivable", total: receivables },
    ],
    liabilities: [{ name: "GST Payable", total: gstPayable }],
    equity: [
      { name: "Retained Earnings", total: retainedEarnings },
      { name: "Owner's Equity (balancing)", total: ownersEquity },
    ],
    totalAssets,
    totalLiabilities,
    totalEquity: retainedEarnings + ownersEquity,
  };
}
