# Architecture

## Stack
- **Frontend:** Next.js (App Router) + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + RLS + Storage for documents)
- **Hosting:** Vercel

## Build Now vs Later
**Now (v1):**
- Transaction capture form + list
- Document upload to Supabase Storage + link to records
- Tenancy & tenant CRUD
- Invoice creation (draft -> issued)
- P&L, Balance Sheet, Cash Flow report generation (server-computed from transactions)
- Dashboard with monthly summaries
- Chart of accounts seed data

**Later:**
- Login/signup + per-user RLS
- Double-entry journal posting
- Bank feed auto-import
- AI document extraction (OCR -> structured fields)
- IRAS/ACRA export formats
- Recurring transaction templates
- Budget vs actual tracking

## Key User Action Flow (Record a Transaction)
1. User opens Transactions page -> clicks "New Transaction"
2. Form: date, type (income/expense), category (from chart of accounts), property, unit (optional), amount, GST rate, description, document upload (optional)
3. On submit -> insert row into `transactions` table -> if document attached, upload to Supabase Storage and store path in `documents` table linked to transaction
4. Transaction list refreshes showing new entry
5. Dashboard & reports automatically reflect new transaction (computed server-side)

## Layer Plan
1. **Data:** Supabase tables (transactions, tenancies, invoices, documents, properties, units, chart_of_accounts) with seed data. All reads/writes open for demo.
2. **App Logic:** CRUD screens + report computation queries (SQL views/functions for P&L, balance sheet, cash flow from transactions grouped by account category).
3. **Smart Features (later):** AI-assisted document extraction, auto-categorisation, anomaly detection on transactions.

## Why Core Runs Without AI
Every transaction, report, and invoice is pure CRUD + SQL aggregation. The app is fully functional with zero AI. Intelligence (OCR, auto-categorise) is an optional add-on that drafts suggestions — never required to record or report.