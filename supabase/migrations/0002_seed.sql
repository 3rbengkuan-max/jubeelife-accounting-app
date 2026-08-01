-- Jubeelife Accounting App — seed data (idempotent)
-- Demo tenant: Gem Residence, 2 units, 2 tenants, 2 tenancies, chart of accounts,
-- 6 transactions, 1 issued invoice. Dates are relative to the current month so the
-- dashboard and current-period reports always show data.

-- ── Chart of Accounts (Singapore FRS-aligned, simplified) ──
insert into chart_of_accounts (code, name, type, gst_applicable) values
  ('4001', 'Rental Income',            'income',    false),
  ('4002', 'Other Income',             'income',    true),
  ('4003', 'Late Payment Fees',        'income',    true),
  ('5001', 'Property Maintenance',     'expense',   true),
  ('5002', 'MCST Management Fees',     'expense',   true),
  ('5003', 'Utilities',                'expense',   true),
  ('5004', 'Property Tax',             'expense',   false),
  ('5005', 'Insurance',                'expense',   true),
  ('5006', 'Agent Commission',         'expense',   true),
  ('5007', 'Repairs & Renovation',     'expense',   true),
  ('5008', 'Cleaning',                 'expense',   true),
  ('5009', 'Bank Charges',             'expense',   false),
  ('5010', 'Office & Admin',           'expense',   true),
  ('1001', 'Cash at Bank',             'asset',     false),
  ('1002', 'Accounts Receivable',      'asset',     false),
  ('1003', 'Property (Gem Residence)', 'asset',     false),
  ('2001', 'Accounts Payable',         'liability', false),
  ('2002', 'Security Deposits Held',   'liability', false),
  ('2003', 'GST Payable',              'liability', false),
  ('3001', 'Owner''s Capital',         'equity',    false),
  ('3002', 'Retained Earnings',        'equity',    false)
on conflict (code) do nothing;

-- ── Property + Units ──
insert into properties (id, name, address) values
  ('11111111-1111-1111-1111-111111111111', 'Gem Residence', '2 Kim Tian Road, Singapore 169244')
on conflict (id) do nothing;

insert into units (id, property_id, label, type) values
  ('22222222-2222-2222-2222-222222220001', '11111111-1111-1111-1111-111111111111', '12-03A', 'room'),
  ('22222222-2222-2222-2222-222222220002', '11111111-1111-1111-1111-111111111111', '12-05B', 'room')
on conflict (id) do nothing;

-- ── Tenants ──
insert into tenants (id, name, contact, email) values
  ('33333333-3333-3333-3333-333333330001', 'Wei Ling Tan',  '+65 9123 4567', 'weiling.tan@example.com'),
  ('33333333-3333-3333-3333-333333330002', 'Arjun Kumar',   '+65 9876 5432', 'arjun.kumar@example.com')
on conflict (id) do nothing;

-- ── Tenancies ──
insert into tenancies (id, unit_id, tenant_id, start_date, end_date, monthly_rent, status) values
  ('44444444-4444-4444-4444-444444440001',
   '22222222-2222-2222-2222-222222220001', '33333333-3333-3333-3333-333333330001',
   (date_trunc('month', current_date) - interval '5 months')::date,
   (date_trunc('month', current_date) + interval '7 months')::date,
   2500.00, 'active'),
  ('44444444-4444-4444-4444-444444440002',
   '22222222-2222-2222-2222-222222220002', '33333333-3333-3333-3333-333333330002',
   (date_trunc('month', current_date) - interval '3 months')::date,
   (date_trunc('month', current_date) + interval '9 months')::date,
   2200.00, 'active')
on conflict (id) do nothing;

-- ── Transactions (6) — this month + last month ──
insert into transactions (id, date, type, account_id, property_id, unit_id, tenancy_id, description, amount, gst_amount, gst_rate)
values
  ('55555555-5555-5555-5555-555555550001',
   (date_trunc('month', current_date) + interval '2 days')::date, 'income',
   (select id from chart_of_accounts where code='4001'),
   '11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222220001','44444444-4444-4444-4444-444444440001',
   'Monthly rent — 12-03A', 2500.00, 0, 0),
  ('55555555-5555-5555-5555-555555550002',
   (date_trunc('month', current_date) + interval '3 days')::date, 'income',
   (select id from chart_of_accounts where code='4001'),
   '11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222220002','44444444-4444-4444-4444-444444440002',
   'Monthly rent — 12-05B', 2200.00, 0, 0),
  ('55555555-5555-5555-5555-555555550003',
   (date_trunc('month', current_date) + interval '5 days')::date, 'expense',
   (select id from chart_of_accounts where code='5002'),
   '11111111-1111-1111-1111-111111111111', null, null,
   'MCST management fee — monthly', 450.00, 36.45, 9),
  ('55555555-5555-5555-5555-555555550004',
   (date_trunc('month', current_date) + interval '6 days')::date, 'expense',
   (select id from chart_of_accounts where code='5003'),
   '11111111-1111-1111-1111-111111111111', null, null,
   'Utilities — common area', 180.00, 14.58, 9),
  ('55555555-5555-5555-5555-555555550005',
   (date_trunc('month', current_date) - interval '25 days')::date, 'income',
   (select id from chart_of_accounts where code='4001'),
   '11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222220001','44444444-4444-4444-4444-444444440001',
   'Monthly rent — 12-03A (prev month)', 2500.00, 0, 0),
  ('55555555-5555-5555-5555-555555550006',
   (date_trunc('month', current_date) - interval '20 days')::date, 'expense',
   (select id from chart_of_accounts where code='5001'),
   '11111111-1111-1111-1111-111111111111', null, null,
   'Aircon servicing — 12-03A', 320.00, 25.92, 9)
on conflict (id) do nothing;

-- ── One issued invoice (so receivables widget has data) ──
insert into invoices (id, invoice_number, tenancy_id, tenant_id, issue_date, due_date, line_items, subtotal, gst_amount, total, status)
values
  ('66666666-6666-6666-6666-666666660001', 'INV-0001',
   '44444444-4444-4444-4444-444444440002', '33333333-3333-3333-3333-333333330002',
   (date_trunc('month', current_date) + interval '1 day')::date,
   (date_trunc('month', current_date) + interval '15 days')::date,
   '[{"description":"Monthly rent — 12-05B","qty":1,"unit_price":2200,"amount":2200}]'::jsonb,
   2200.00, 0, 2200.00, 'issued')
on conflict (id) do nothing;
