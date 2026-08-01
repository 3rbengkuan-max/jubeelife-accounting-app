-- Jubeelife Accounting App — initial schema (v1, demo-first)
-- Idempotent: safe to run multiple times.
-- Permissive RLS for anonymous demo access; Sprint 4 replaces with auth.uid() = user_id.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────

create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  created_at timestamptz not null default now(),
  user_id uuid
);

create table if not exists units (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  label text not null,
  type text default 'room',
  created_at timestamptz not null default now(),
  user_id uuid
);

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text,
  email text,
  created_at timestamptz not null default now(),
  user_id uuid
);

create table if not exists tenancies (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid references units(id) on delete set null,
  tenant_id uuid references tenants(id) on delete set null,
  start_date date,
  end_date date,
  monthly_rent numeric(12,2) not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  user_id uuid
);

create table if not exists chart_of_accounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  type text not null,
  gst_applicable boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  storage_path text not null,
  mime_type text,
  doc_type text default 'other',
  linked_type text,
  linked_id uuid,
  created_at timestamptz not null default now(),
  user_id uuid
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  type text not null,
  account_id uuid references chart_of_accounts(id) on delete set null,
  property_id uuid references properties(id) on delete set null,
  unit_id uuid references units(id) on delete set null,
  tenancy_id uuid references tenancies(id) on delete set null,
  description text,
  amount numeric(14,2) not null default 0,
  gst_amount numeric(14,2) not null default 0,
  gst_rate numeric(5,2) not null default 0,
  document_id uuid references documents(id) on delete set null,
  created_at timestamptz not null default now(),
  user_id uuid
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null,
  tenancy_id uuid references tenancies(id) on delete set null,
  tenant_id uuid references tenants(id) on delete set null,
  issue_date date not null default current_date,
  due_date date,
  line_items jsonb not null default '[]'::jsonb,
  subtotal numeric(14,2) not null default 0,
  gst_amount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  user_id uuid
);

create index if not exists idx_units_property on units(property_id);
create index if not exists idx_tenancies_unit on tenancies(unit_id);
create index if not exists idx_tenancies_tenant on tenancies(tenant_id);
create index if not exists idx_transactions_date on transactions(date);
create index if not exists idx_transactions_account on transactions(account_id);
create index if not exists idx_invoices_status on invoices(status);

-- ─────────────────────────────────────────────────────────────
-- Permissive RLS (v1 demo — replaced in Sprint 4)
-- ─────────────────────────────────────────────────────────────

do $$
declare t text;
begin
  foreach t in array array[
    'properties','units','tenants','tenancies','chart_of_accounts',
    'documents','transactions','invoices'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "demo_all" on %I;', t);
    execute format(
      'create policy "demo_all" on %I for all to anon, authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────
-- Storage bucket for documents (public for demo) + permissive policies
-- ─────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do update set public = true;

drop policy if exists "documents_read" on storage.objects;
drop policy if exists "documents_insert" on storage.objects;
drop policy if exists "documents_update" on storage.objects;
drop policy if exists "documents_delete" on storage.objects;

create policy "documents_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'documents');
create policy "documents_insert" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'documents');
create policy "documents_update" on storage.objects
  for update to anon, authenticated using (bucket_id = 'documents') with check (bucket_id = 'documents');
create policy "documents_delete" on storage.objects
  for delete to anon, authenticated using (bucket_id = 'documents');
