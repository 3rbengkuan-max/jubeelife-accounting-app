"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createTenancy(formData: FormData): Promise<void> {
  const unit_id = formData.get("unit_id")?.toString();
  const tenant_id = formData.get("tenant_id")?.toString();
  const rent = parseFloat(formData.get("monthly_rent")?.toString() ?? "");
  if (!unit_id || !tenant_id || !Number.isFinite(rent)) return;

  const supabase = await createClient();
  await supabase.from("tenancies").insert({
    unit_id,
    tenant_id,
    start_date: formData.get("start_date")?.toString() || null,
    end_date: formData.get("end_date")?.toString() || null,
    monthly_rent: rent,
    status: formData.get("status")?.toString() || "active",
  });
  revalidatePath("/tenancies");
  revalidatePath("/");
}

export async function updateTenancyStatus(formData: FormData): Promise<void> {
  const id = formData.get("id")?.toString();
  const status = formData.get("status")?.toString();
  if (!id || !status) return;
  const supabase = await createClient();
  await supabase.from("tenancies").update({ status }).eq("id", id);
  revalidatePath("/tenancies");
  revalidatePath("/");
}

export async function deleteTenancy(formData: FormData): Promise<void> {
  const id = formData.get("id")?.toString();
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("tenancies").delete().eq("id", id);
  revalidatePath("/tenancies");
  revalidatePath("/");
}
