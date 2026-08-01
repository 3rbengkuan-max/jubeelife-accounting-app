"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createTenant(formData: FormData): Promise<void> {
  const name = formData.get("name")?.toString().trim();
  if (!name) return;
  const supabase = await createClient();
  await supabase.from("tenants").insert({
    name,
    contact: formData.get("contact")?.toString().trim() || null,
    email: formData.get("email")?.toString().trim() || null,
  });
  revalidatePath("/tenants");
  revalidatePath("/tenancies");
}

export async function deleteTenant(formData: FormData): Promise<void> {
  const id = formData.get("id")?.toString();
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("tenants").delete().eq("id", id);
  revalidatePath("/tenants");
}
