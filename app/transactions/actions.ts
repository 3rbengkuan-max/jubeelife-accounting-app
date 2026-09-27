"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string } | undefined;

function toNull(v: FormDataEntryValue | null): string | null {
  const s = (v as string | null)?.toString().trim();
  return s ? s : null;
}

export async function createTransaction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();

  const type = toNull(formData.get("type"));
  const date = toNull(formData.get("date"));
  const account_id = toNull(formData.get("account_id"));
  const amountRaw = toNull(formData.get("amount"));

  if (!type || !date || !account_id || !amountRaw) {
    return { error: "Date, type, account and amount are required." };
  }
  const amount = parseFloat(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Amount must be a positive number." };
  }

  const gst_rate = parseFloat(toNull(formData.get("gst_rate")) ?? "0") || 0;
  const gst_amount = Math.round(amount * (gst_rate / 100) * 100) / 100;

  const { data: txn, error } = await supabase
    .from("transactions")
    .insert({
      type,
      date,
      account_id,
      property_id: toNull(formData.get("property_id")),
      unit_id: toNull(formData.get("unit_id")),
      tenancy_id: toNull(formData.get("tenancy_id")),
      description: toNull(formData.get("description")),
      amount,
      gst_rate,
      gst_amount,
    })
    .select("id")
    .single();

  if (error || !txn) {
    return { error: error?.message ?? "Could not save the transaction." };
  }

  // Optional document upload
  const file = formData.get("document") as File | null;
  if (file && file.size > 0) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `transactions/${txn.id}/${Date.now()}_${safeName}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: upErr } = await supabase.storage
      .from("documents")
      .upload(path, bytes, { contentType: file.type || "application/octet-stream" });

    if (!upErr) {
      const { data: doc } = await supabase
        .from("documents")
        .insert({
          file_name: file.name,
          storage_path: path,
          mime_type: file.type,
          doc_type: toNull(formData.get("doc_type")) ?? "receipt",
          linked_type: "transaction",
          linked_id: txn.id,
        })
        .select("id")
        .single();
      if (doc) {
        await supabase
          .from("transactions")
          .update({ document_id: doc.id })
          .eq("id", txn.id);
      }
    }
  }

  revalidatePath("/transactions");
  revalidatePath("/");
  revalidatePath("/reports");
  redirect("/transactions");
}

export async function updateTransaction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();

  const id = toNull(formData.get("id"));
  const type = toNull(formData.get("type"));
  const date = toNull(formData.get("date"));
  const account_id = toNull(formData.get("account_id"));
  const amountRaw = toNull(formData.get("amount"));

  if (!id) return { error: "Missing transaction id." };
  if (!type || !date || !account_id || !amountRaw) {
    return { error: "Date, type, account and amount are required." };
  }
  const amount = parseFloat(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Amount must be a positive number." };
  }

  const gst_rate = parseFloat(toNull(formData.get("gst_rate")) ?? "0") || 0;
  const gst_amount = Math.round(amount * (gst_rate / 100) * 100) / 100;

  const { error } = await supabase
    .from("transactions")
    .update({
      type,
      date,
      account_id,
      property_id: toNull(formData.get("property_id")),
      unit_id: toNull(formData.get("unit_id")),
      tenancy_id: toNull(formData.get("tenancy_id")),
      description: toNull(formData.get("description")),
      amount,
      gst_rate,
      gst_amount,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  // Optional: attach an additional document
  const file = formData.get("document") as File | null;
  if (file && file.size > 0) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `transactions/${id}/${Date.now()}_${safeName}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: upErr } = await supabase.storage
      .from("documents")
      .upload(path, bytes, { contentType: file.type || "application/octet-stream" });
    if (!upErr) {
      const { data: doc } = await supabase
        .from("documents")
        .insert({
          file_name: file.name,
          storage_path: path,
          mime_type: file.type,
          doc_type: toNull(formData.get("doc_type")) ?? "receipt",
          linked_type: "transaction",
          linked_id: id,
        })
        .select("id")
        .single();
      if (doc) {
        await supabase.from("transactions").update({ document_id: doc.id }).eq("id", id);
      }
    }
  }

  revalidatePath("/transactions");
  revalidatePath("/");
  revalidatePath("/reports");
  redirect("/transactions");
}

export async function deleteTransaction(formData: FormData): Promise<void> {
  const id = formData.get("id")?.toString();
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("transactions").delete().eq("id", id);
  revalidatePath("/transactions");
  revalidatePath("/");
  revalidatePath("/reports");
}
