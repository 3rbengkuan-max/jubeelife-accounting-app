"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { InvoiceLineItem } from "@/lib/types";

export type InvoiceActionState = { error?: string } | undefined;

async function nextInvoiceNumber(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string> {
  const { data } = await supabase
    .from("invoices")
    .select("invoice_number")
    .order("created_at", { ascending: false })
    .limit(1);
  const last = data?.[0]?.invoice_number as string | undefined;
  const n = last ? parseInt(last.replace(/\D/g, ""), 10) || 0 : 0;
  return `INV-${String(n + 1).padStart(4, "0")}`;
}

export async function createInvoice(
  _prev: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  const supabase = await createClient();

  const tenant_id = formData.get("tenant_id")?.toString();
  if (!tenant_id) return { error: "Please select a tenant." };

  let items: InvoiceLineItem[] = [];
  try {
    items = JSON.parse(formData.get("line_items")?.toString() || "[]");
  } catch {
    return { error: "Invalid line items." };
  }
  items = items.filter((i) => i.description?.trim() && i.amount > 0);
  if (items.length === 0) {
    return { error: "Add at least one line item with a description and amount." };
  }

  const subtotal = items.reduce((s, i) => s + Number(i.amount || 0), 0);
  const gstRate = parseFloat(formData.get("gst_rate")?.toString() ?? "0") || 0;
  const gst_amount = Math.round(subtotal * (gstRate / 100) * 100) / 100;
  const total = subtotal + gst_amount;

  const status = formData.get("status")?.toString() === "issued" ? "issued" : "draft";
  const invoice_number = await nextInvoiceNumber(supabase);

  const { error } = await supabase.from("invoices").insert({
    invoice_number,
    tenant_id,
    tenancy_id: formData.get("tenancy_id")?.toString() || null,
    issue_date: formData.get("issue_date")?.toString() || new Date().toISOString().slice(0, 10),
    due_date: formData.get("due_date")?.toString() || null,
    line_items: items,
    subtotal,
    gst_amount,
    total,
    status,
  });

  if (error) return { error: error.message };

  revalidatePath("/invoices");
  revalidatePath("/");
  redirect("/invoices");
}

export async function updateInvoiceStatus(formData: FormData): Promise<void> {
  const id = formData.get("id")?.toString();
  const status = formData.get("status")?.toString();
  if (!id || !status) return;
  const supabase = await createClient();
  await supabase.from("invoices").update({ status }).eq("id", id);
  revalidatePath("/invoices");
  revalidatePath("/");
}

export async function deleteInvoice(formData: FormData): Promise<void> {
  const id = formData.get("id")?.toString();
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("invoices").delete().eq("id", id);
  revalidatePath("/invoices");
  revalidatePath("/");
}
