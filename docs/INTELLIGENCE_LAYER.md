# Intelligence Layer

## Messy Inputs (later phase)
- Uploaded receipts: photo of hand-written receipt, noisy OCR text
- Bank statement PDFs: inconsistent column layouts
- Tenancy agreement PDFs: free-text lease terms

## Auto-Structure Schema (later)
```json
{
  "doc_type": "receipt",
  "extracted": {
    "date": "2024-10-15",
    "vendor": "ABC Maintenance Pte Ltd",
    "amount": 350.00,
    "category_suggestion": "Repairs & Maintenance",
    "account_code_suggestion": "5003"
  },
  "source": "document_id: <uuid>",
  "confidence": 0.87,
  "review_status": "unreviewed"
}
```

## Events to Track
- `transaction.created` — log every new transaction
- `document.uploaded` — log document upload + link
- `invoice.issued` — log invoice status change to issued
- `invoice.paid` — log invoice marked paid
- `report.generated` — log report generation (type, period)

## Scoring Rules (v1 — rule-based, no AI)
- **Outstanding receivables:** invoice.status in ('issued','overdue') AND due_date < today -> overdue; else outstanding
- **Rent due this month:** tenancy.status='active' AND no matching transaction for current month rent amount
- **Cash flow health:** (income - expense) for current month; flag if negative
- **Report accuracy:** sum of all transactions by account type must reconcile; flag if mismatch

## What Gets Ranked
- Overdue invoices sorted by amount descending
- Tenancies with missing rent payments for current month
- Properties with highest expense ratio

## v1 vs Later
- **v1:** Pure rule-based scoring via SQL queries. No AI/OCR.
- **Later:** AI document extraction, auto-categorisation suggestions, anomaly detection.