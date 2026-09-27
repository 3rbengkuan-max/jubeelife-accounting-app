-- Additional expense accounts (idempotent):
--   5011 Head Lease Rental      — rent paid to the landlord under the master/head
--                                 lease (previously mis-booked as Property Maintenance).
--   5012 Security Deposit Refund — refund of a tenant's security deposit at the
--                                 end of a tenancy.
-- Both are non-GST. Applied directly to the live DB on 2026-09-27; this file
-- keeps the chart of accounts reproducible for a fresh setup.
insert into chart_of_accounts (code, name, type, gst_applicable) values
  ('5011', 'Head Lease Rental',      'expense', false),
  ('5012', 'Security Deposit Refund', 'expense', false)
on conflict (code) do nothing;
