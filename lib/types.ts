export type AccountType = "income" | "expense" | "asset" | "liability" | "equity";
export type TxnType = "income" | "expense";
export type InvoiceStatus = "draft" | "issued" | "paid" | "overdue";

export interface Property {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
}

export interface Unit {
  id: string;
  property_id: string | null;
  label: string;
  type: string | null;
  created_at: string;
  properties?: Property | null;
}

export interface Tenant {
  id: string;
  name: string;
  contact: string | null;
  email: string | null;
  created_at: string;
}

export interface Tenancy {
  id: string;
  unit_id: string | null;
  tenant_id: string | null;
  start_date: string | null;
  end_date: string | null;
  monthly_rent: number;
  status: string;
  created_at: string;
  units?: Unit | null;
  tenants?: Tenant | null;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  gst_applicable: boolean;
}

export interface DocumentRow {
  id: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  doc_type: string | null;
  linked_type: string | null;
  linked_id: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: TxnType;
  account_id: string | null;
  property_id: string | null;
  unit_id: string | null;
  tenancy_id: string | null;
  description: string | null;
  amount: number;
  gst_amount: number;
  gst_rate: number;
  document_id: string | null;
  reconciled: boolean;
  created_at: string;
  chart_of_accounts?: Account | null;
  properties?: Property | null;
  units?: Unit | null;
  documents?: DocumentRow | null;
}

export interface InvoiceLineItem {
  description: string;
  qty: number;
  unit_price: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  tenancy_id: string | null;
  tenant_id: string | null;
  issue_date: string;
  due_date: string | null;
  line_items: InvoiceLineItem[];
  subtotal: number;
  gst_amount: number;
  total: number;
  status: InvoiceStatus;
  created_at: string;
  tenants?: Tenant | null;
}
