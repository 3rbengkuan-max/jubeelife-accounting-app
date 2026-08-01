# Data Model

## properties
| Field | Type |
|---|---|
| id | uuid pk |
| name | text (e.g. "Gem Residence") |
| address | text |
| created_at | timestamptz |
| user_id | uuid nullable |

## units
| Field | Type |
|---|---|
| id | uuid pk |
| property_id | uuid -> properties |
| label | text (e.g. "12-03A") |
| type | text (room/unit) |
| created_at | timestamptz |
| user_id | uuid nullable |

## tenants
| Field | Type |
|---|---|
| id | uuid pk |
| name | text |
| contact | text |
| email | text |
| created_at | timestamptz |
| user_id | uuid nullable |

## tenancies
| Field | Type |
|---|---|
| id | uuid pk |
| unit_id | uuid -> units |
| tenant_id | uuid -> tenants |
| start_date | date |
| end_date | date |
| monthly_rent | numeric(12,2) |
| status | text (active/ended/terminated) |
| created_at | timestamptz |
| user_id | uuid nullable |

## chart_of_accounts
| Field | Type |
|---|---|
| id | uuid pk |
| code | text (e.g. "4001") |
| name | text (e.g. "Rental Income") |
| type | text (income/expense/asset/liability/equity) |
| gst_applicable | boolean default false |
| created_at | timestamptz |

## transactions
| Field | Type |
|---|---|
| id | uuid pk |
| date | date |
| type | text (income/expense) |
| account_id | uuid -> chart_of_accounts |
| property_id | uuid -> properties (nullable) |
| unit_id | uuid -> units (nullable) |
| tenancy_id | uuid -> tenancies (nullable) |
| description | text |
| amount | numeric(14,2) |
| gst_amount | numeric(14,2) default 0 |
| gst_rate | numeric(5,2) default 0 |
| document_id | uuid -> documents (nullable) |
| created_at | timestamptz |
| user_id | uuid nullable |

## documents
| Field | Type |
|---|---|
| id | uuid pk |
| file_name | text |
| storage_path | text |
| mime_type | text |
| doc_type | text (receipt/invoice/bank_statement/tenancy_agreement/mcst_bill/other) |
| linked_type | text (transaction/tenancy/null) |
| linked_id | uuid nullable |
| created_at | timestamptz |
| user_id | uuid nullable |

## invoices
| Field | Type |
|---|---|
| id | uuid pk |
| invoice_number | text |
| tenancy_id | uuid -> tenancies (nullable) |
| tenant_id | uuid -> tenants |
| issue_date | date |
| due_date | date |
| line_items | jsonb (array of {description, qty, unit_price, amount}) |
| subtotal | numeric(14,2) |
| gst_amount | numeric(14,2) |
| total | numeric(14,2) |
| status | text (draft/issued/paid/overdue) |
| created_at | timestamptz |
| user_id | uuid nullable |

## RLS / Permissions (v1 demo)
All tables: RLS enabled, permissive read/write for anonymous. Lock-down sprint replaces with `auth.uid() = user_id`.

## AI Fields
No AI-generated fields in v1. When AI extraction added later, fields will carry: value + source + confidence + review_status.