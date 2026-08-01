"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createProperty(formData: FormData): Promise<void> {
  const name = formData.get("name")?.toString().trim();
  if (!name) return;
  const supabase = await createClient();
  await supabase.from("properties").insert({
    name,
    address: formData.get("address")?.toString().trim() || null,
  });
  revalidatePath("/properties");
}

export async function deleteProperty(formData: FormData): Promise<void> {
  const id = formData.get("id")?.toString();
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("properties").delete().eq("id", id);
  revalidatePath("/properties");
}

export async function createUnit(formData: FormData): Promise<void> {
  const property_id = formData.get("property_id")?.toString();
  const label = formData.get("label")?.toString().trim();
  if (!property_id || !label) return;
  const supabase = await createClient();
  await supabase.from("units").insert({
    property_id,
    label,
    type: formData.get("type")?.toString() || "room",
  });
  revalidatePath("/properties");
}

export async function deleteUnit(formData: FormData): Promise<void> {
  const id = formData.get("id")?.toString();
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("units").delete().eq("id", id);
  revalidatePath("/properties");
}
