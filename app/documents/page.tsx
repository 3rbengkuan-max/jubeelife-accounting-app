import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import DocumentUploadForm from "@/components/DocumentUploadForm";
import { deleteDocument } from "./actions";
import DbUnavailable from "@/components/DbUnavailable";
import { fmtDate } from "@/lib/format";
import type { DocumentRow } from "@/lib/types";

export const dynamic = "force-dynamic";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

function docUrl(path: string) {
  return `${SUPA_URL}/storage/v1/object/public/documents/${path}`;
}

function prettyType(t: string | null) {
  return (t ?? "other").replace(/_/g, " ");
}

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    return (
      <div>
        <PageHeader title="Documents" subtitle="Upload monthly bank statements, MCST bills and agreements." />
        <DbUnavailable detail={error.message} />
      </div>
    );
  }
  const docs = (data as DocumentRow[]) ?? [];

  return (
    <div>
      <PageHeader
        title="Documents"
        subtitle="Upload monthly bank statements, MCST bills and agreements for reference and checking — no transaction required."
      />

      <Card className="mb-6 p-6">
        <h2 className="mb-4 font-semibold text-slate-800">Upload a document</h2>
        <DocumentUploadForm />
      </Card>

      {docs.length === 0 ? (
        <EmptyState
          title="No documents yet"
          description="Upload a bank statement or bill above. You can also attach receipts directly to a transaction."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-semibold">File</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Linked to</th>
                  <th className="px-4 py-3 font-semibold">Uploaded</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <a
                        href={docUrl(d.storage_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[var(--brand)] hover:underline"
                      >
                        📎 {d.file_name}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-600">
                        {prettyType(d.doc_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-500">
                      {d.linked_type ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {fmtDate(d.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <a
                          href={docUrl(d.storage_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-slate-600 hover:text-[var(--brand)]"
                        >
                          View
                        </a>
                        <form action={deleteDocument}>
                          <input type="hidden" name="id" value={d.id} />
                          <input type="hidden" name="storage_path" value={d.storage_path} />
                          <button className="text-xs text-slate-400 hover:text-rose-600" title="Delete document">
                            ✕
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
