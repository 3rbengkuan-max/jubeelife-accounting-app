-- Income account (idempotent):
--   4004 Security Deposit Received — deposit taken from a tenant at the start of a
--   tenancy. This is the matching income side to 5012 Security Deposit Refund, so a
--   deposit received and later returned nets to zero over the tenancy. Non-GST.
-- Applied directly to the live DB on 2026-09-27.
insert into chart_of_accounts (code, name, type, gst_applicable) values
  ('4004', 'Security Deposit Received', 'income', false)
on conflict (code) do nothing;
