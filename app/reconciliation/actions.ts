"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setReconciled(formData: FormData): Promise<void> {
  const id = formData.get("id")?.toString();
  const value = formData.get("value")?.toString() === "true";
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("transactions").update({ reconciled: value }).eq("id", id);
  revalidatePath("/reconciliation");
}

export async function reconcileAll(formData: FormData): Promise<void> {
  const start = formData.get("start")?.toString();
  const end = formData.get("end")?.toString();
  const value = formData.get("value")?.toString() === "true";
  if (!start || !end) return;
  const supabase = await createClient();
  await supabase
    .from("transactions")
    .update({ reconciled: value })
    .gte("date", start)
    .lte("date", end);
  revalidatePath("/reconciliation");
}
