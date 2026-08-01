# Security

## Secret Handling
- Supabase URL + anon key: public (safe for frontend)
- Supabase service role key: server-only (NEVER in frontend; only in server actions / route handlers)
- Storage: signed URLs for document access; no public bucket exposure of sensitive docs

## Permission Model
- **v1 (demo-first):** RLS enabled but permissive — all tables readable/writable anonymously. Seed data visible. No login wall.
- **Lock-down sprint:** Replace permissive policies with `auth.uid() = user_id` on every table. Users see only their own records. Shared team data requires same `user_id` or team membership logic.
- Agent (later) inherits the logged-in user's permissions — cannot exceed user scope.

## Approved-Tools Rule
- Only named, pre-defined tools (e.g. `extract_receipt_fields`, `categorise_transaction`) may be called by the agent.
- No raw `run_any` / `send_any` / arbitrary SQL execution tool.
- Every agent action logged to `audit_logs` with actor, action, entity, metadata.

## Audit Principle
- Every meaningful state change (transaction create/update/delete, invoice issue/pay/void, document upload/delete) writes to `audit_logs`.
- Audit log is append-only (no update/delete on audit rows).
- Reports are reproducible from transaction data — no cached/stale report values trusted without underlying transactions.

## Data Integrity
- Amounts stored as numeric(14,2) — never float
- GST rate stored per transaction for auditability
- Soft-delete not used in v1; deletes are hard + logged