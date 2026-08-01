# Tasks & Sprints

## Sprint 1 — Foundation & Transaction Engine
**Goal:** Database + core transaction CRUD + dashboard visible without login.
- [ ] Create Supabase schema (migration SQL) for all core tables with seed data
- [ ] Set up Next.js project + Tailwind + Supabase client
- [ ] Build Properties & Units pages (list + create)
- [ ] Build Tenants & Tenancies pages (list + create)
- [ ] Build Transactions page: list + create form (date, type, account, property, unit, amount, GST, description, document upload)
- [ ] Document upload to Supabase Storage + link to transaction
- [ ] Dashboard: monthly income vs expense summary, recent transactions
- [ ] Seed: Gem Residence, 2 units, 2 tenants, 2 tenancies, 6 transactions, chart of accounts
**DoD:** User can create a transaction with linked document and see it in the list + dashboard updates.

## Sprint 2 — Reports & Invoices
**Goal:** P&L, Balance Sheet, Cash Flow reports + invoice creation.
- [ ] Build Chart of Accounts page (view seeded accounts)
- [ ] Build P&L report page (select period, SQL aggregation by income/expense accounts)
- [ ] Build Balance Sheet report (as-of date, assets/liabilities/equity from transactions + invoices)
- [ ] Build Cash Flow report (period, cash in/out by category)
- [ ] Build Invoice create page (draft -> issued; line items, GST, totals)
- [ ] Invoice list + status badge (draft/issued/paid/overdue)
- [ ] Dashboard: add outstanding receivables + rent-due-this-month widgets
**DoD:** User generates P&L for current month and sees recorded transactions reflected; creates and issues an invoice. **<- v1 functional milestone**

## Sprint 3 — Polish & Empty/Error States
**Goal:** All screens handle loading/empty/error; UI clarity.
- [ ] Loading skeletons on all list pages
- [ ] Empty states with call-to-action on all lists
- [ ] Error boundaries + toast notifications for failed writes
- [ ] Report print/export to PDF (browser print)
- [ ] Currency formatting (SGD) consistently applied
- [ ] Responsive layout for desktop + tablet
**DoD:** Every screen handles empty/loading/error gracefully; report is printable.

## Sprint 4 — Lock It Down (Auth & RLS)
**Goal:** Login/signup + per-user data isolation.
- [ ] Supabase Auth (email/password) signup + login pages
- [ ] Replace permissive RLS policies with `auth.uid() = user_id` on all tables
- [ ] Assign user_id on all inserts (server-side)
- [ ] Middleware to redirect unauthenticated users to /login (except demo landing if desired)
- [ ] Invite admin support user; shared data via same ownership or team logic
**DoD:** New user sees only their own data; seeded demo rows tied to a seed user.

---

## Text Gantt
```
Sprint 1: [Foundation & Transaction Engine]
Sprint 2: [Reports & Invoices]          <- v1 functional
Sprint 3: [Polish & Empty/Error States]
Sprint 4: [Lock It Down (Auth & RLS)]
```