# Test Plan

## v1 Success Scenario (Manual)
1. Open app (no login) -> dashboard loads with seed data for Gem Residence
2. Navigate to Transactions -> click "New Transaction"
3. Fill: date=today, type=income, account=Rental Income (4001), property=Gem Residence, unit=12-03A, amount=2500.00, GST=0, description="October rent"
4. Upload a receipt image -> submit
5. Transaction appears in list with linked document icon
6. Open Dashboard -> monthly income includes the 2500.00
7. Navigate to Reports -> P&L -> select current month -> Rental Income shows 2500.00, Net Profit updated
8. Navigate to Invoices -> "New Invoice" -> select tenant, add line item (rent 2500), save as draft -> issue -> status shows "Issued"
9. Dashboard outstanding receivables shows the invoice amount

## Empty State Tests
1. Delete all transactions (or fresh DB) -> Transactions page shows empty state with "New Transaction" CTA
2. No invoices -> Invoices page shows empty state with "New Invoice" CTA
3. No tenancies -> Tenancies page shows empty state with "Create Tenancy" CTA
4. P&L with no transactions for selected period -> shows zeroes with message "No transactions in this period"

## Error State Tests
1. Submit transaction form without required fields -> validation errors shown inline
2. Document upload fails (network off) -> error toast, form retains input
3. Report generation with invalid date range -> error message shown
4. Supabase connection error -> list pages show retry button

## Data Integrity Tests
1. Create income transaction 1000 + expense 400 -> P&L net = 600
2. GST rate 9% on 1000 -> gst_amount = 90, total recorded = 1090
3. Invoice subtotal + GST = total (verify math)
4. Same transaction appears in P&L and Cash Flow for same period

## Post Lock-Down Tests (Sprint 4)
1. Log in as user A -> see only user A's transactions
2. Log in as user B -> see only user B's transactions (no leak)
3. Attempt to read another user's data via API -> denied by RLS