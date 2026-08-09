// Detect whether any Supabase query result carried a connection/query error
// (as opposed to simply returning no rows). Used to show a clear
// "database unavailable" state instead of misleading empty/zero data.
type Result = { error: { message?: string } | null } | null | undefined;

export function dbError(...results: Result[]): string | null {
  for (const r of results) {
    if (r && r.error) return r.error.message ?? "Database connection error";
  }
  return null;
}
