# Agentic Layer

## Draftable Actions (Low risk — auto)
| Action | Trigger | Output |
|---|---|---|
| Suggest category for transaction | Document uploaded (later) | Draft category + account code; user confirms |
| Pre-fill transaction from receipt | Document uploaded (later) | Draft transaction form; user reviews & saves |
| Tag overdue invoice | Daily check | Set status='overdue' if past due |

## Executable After Approval (Medium risk)
| Action | Risk | Approval |
|---|---|---|
| Create transaction from drafted suggestion | Medium | User confirms |
| Issue invoice (draft -> issued) | Medium | User confirms send |
| Mark invoice as paid | Medium | User confirms |

## Human-Only Actions (High/Critical risk)
| Action | Risk |
|---|---|
| Delete transaction | High |
| Delete invoice | High |
| Delete document | High |
| Void posted invoice | Critical |

## Named Tools (later)
- `extract_receipt_fields` — input: document_id; output: structured JSON; low risk
- `categorise_transaction` — input: description + amount; output: account_code; low risk
- `generate_report` — input: type + period; output: report data; low risk
- No raw SQL execution tool ever exposed to agent.

## Audit Log Fields
| Field | Type |
|---|---|
| id | uuid pk |
| actor | text (user email or 'system') |
| action | text |
| entity_type | text |
| entity_id | uuid |
| metadata | jsonb |
| created_at | timestamptz |

## v1 vs Later
- **v1:** No agentic actions. All actions are manual user CRUD. Overdue tagging is a scheduled SQL check (no agent).
- **Later:** AI drafting, auto-categorise, report generation agent.