# Jubeelife Accounting App — Product Requirements

## Problem
Jubeelife Pte Ltd (space & room rental, e.g. Gem Residence) has no accounting system beyond spreadsheets. Transactions, MCST fees, tenancy docs, bank statements, and invoices are scattered. The owner + admin support need a simple, practical tool to capture transactions and generate P&L, Balance Sheet, and Cash Flow statements aligned with Singapore standards (ACRA/IRAS).

## Target User
- **Primary:** Property business owner (self-run)
- **Secondary:** Admin support staff
- Both internal users; shared data; daily operational use.

## Core Objects
- **Property** — e.g. Gem Residence; one or more buildings.
- **Unit** — rental unit within a property (e.g. Room 12-03A).
- **Tenant** — lessee per tenancy agreement.
- **Tenancy** — lease contract: unit, tenant, period, rent amount, status.
- **Transaction** — a recorded financial event: date, type (income/expense), category, property, unit, amount, GST, description, document ref.
- **Document** — uploaded file (receipt, invoice, bank statement, tenancy agreement, MCST bill).
- **Invoice** — issued to tenant: line items, totals, status (draft/issued/paid/overdue).
- **Chart of Account** — account codes aligned with Singapore FRS (revenue, COA, assets, liabilities, equity).
- **Report** — generated P&L, Balance Sheet, Cash Flow (period, output format).

## MVP (v1) — Must-haves
- [ ] Record transactions (income/expense) with category, property/unit, GST, document link
- [ ] Upload & link documents to transactions or tenancies
- [ ] Chart of accounts seed (Singapore FRS-aligned, simplified)
- [ ] Tenancy tracking: tenant, unit, period, rent, status
- [ ] Invoice creation: draft -> issued; link to tenant/tenancy
- [ ] P&L statement (period selectable)
- [ ] Balance Sheet (as-of-date)
- [ ] Cash Flow statement (period)
- [ ] Operational dashboard: monthly income vs expense, outstanding receivables, rent due
- [ ] Multi-user shared data (no per-user isolation yet; open for demo)

## Non-goals (v1)
- Full double-entry ledger posting (journal entries with debit/credit pairs) — simplified single-entry with category mapping
- E-invoicing / Peppol integration
- Bank feed auto-import
- Payroll
- Tax filing direct to IRAS (manual export)
- Per-user access control / RBAC (defer to lock-down sprint)

## Success Criteria
**One concrete scenario:** Owner records a rental income transaction of S$2,500 for Gem Residence Unit 12-03A (October rent), uploads the tenant's payment receipt, then opens the P&L report for the current month and sees the S$2,500 reflected as rental revenue, total income, and net profit updated. The dashboard shows the month's income and the unit's outstanding balance is zero.