"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DocActionState = { error?: string; ok?: string } | undefined;

export async function uploadDocument(
  _prev: DocActionState,
  formData: FormData,
): Promise<DocActionState> {
  const file = formData.get("document") as File | null;
  if (!file || file.size === 0) {
    return { error: "Please choose a file to upload." };
  }
  if (file.size > 25 * 1024 * 1024) {
    return { error: "File is too large (max 25 MB)." };
  }

  const supabase = await createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `library/${Date.now()}_${safeName}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from("documents")
    .upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
    });
  if (upErr) return { error: `Upload failed: ${upErr.message}` };

  const { error: insErr } = await supabase.from("documents").insert({
    file_name: file.name,
    storage_path: path,
    mime_type: file.type,
    doc_type: formData.get("doc_type")?.toString() || "bank_statement",
    linked_type: null,
    linked_id: null,
  });
  if (insErr) {
    // Roll back the orphaned storage object so we don't leave a dangling file.
    await supabase.storage.from("documents").remove([path]);
    return { error: `Could not save the document: ${insErr.message}` };
  }

  revalidatePath("/documents");
  return { ok: `Uploaded "${file.name}".` };
}

export async function deleteDocument(formData: FormData): Promise<void> {
  const id = formData.get("id")?.toString();
  const path = formData.get("storage_path")?.toString();
  if (!id) return;
  const supabase = await createClient();
  if (path) {
    await supabase.storage.from("documents").remove([path]);
  }
  await supabase.from("documents").delete().eq("id", id);
  revalidatePath("/documents");
}
