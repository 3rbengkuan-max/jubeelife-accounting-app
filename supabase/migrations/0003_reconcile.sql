-- Add a reconciliation flag so transactions can be ticked off against a
-- monthly bank statement. Idempotent.
alter table transactions
  add column if not exists reconciled boolean not null default false;

create index if not exists idx_transactions_reconciled on transactions(reconciled);
