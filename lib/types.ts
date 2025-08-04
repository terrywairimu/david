// Core Entity Types
export interface RegisteredEntity {
  id: number
  type: "client" | "supplier"
  name: string
  phone?: string
  pin?: string
  location?: string
  date_added: string
  status: "active" | "inactive"
  email?: string
  address?: string
  company?: string
  contact_person?: string
  notes?: string
  last_transaction?: string
}

// Account Management Types
export interface AccountBalance {
  id: number
  account_type: "cash" | "cooperative_bank" | "credit" | "cheque"
  current_balance: number
  last_transaction_date: string
  updated_at: string
}

export interface AccountTransaction {
  id: number
  transaction_number: string
  account_type: "cash" | "cooperative_bank" | "credit" | "cheque"
  transaction_type: "in" | "out"
  amount: number
  description: string
  reference_type: "payment" | "expense" | "purchase" | "sale"
  reference_id: number
  transaction_date: string
  balance_after: number
  created_at: string
  updated_at: string
}

export interface AccountTransactionView {
  id: number
  transaction_number: string
  account_type: string
  transaction_type: string
  amount: number
  description: string
  reference_type: string
  reference_id: number
  transaction_date: string
  balance_after: number
  money_in: number
  money_out: number
  reference_number: string
  reference_description: string
}

export interface StockItem {
  id: number
  name: string
  description?: string
  unit_price: number
  quantity: number
  reorder_level: number
  date_added: string
  category?: string
  supplier_id?: number
  sku?: string
  image_url?: string
  status: "in_stock" | "low_stock" | "out_of_stock"
  last_updated: string
  supplier?: RegisteredEntity
  unit?: string
}

// Enhanced Quotation System Types
export interface QuotationSection {
  id: string
  type: "kitchen_cabinets" | "worktop" | "accessories"
  items: QuotationSectionItem[]
  subtotal: number
  labour_cost: number
  total: number
}

export interface QuotationSectionItem {
  id: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  total_price: number
  category?: string
  specifications?: string
  notes?: string
}

export interface Quotation {
  id: number
  quotation_number: string
  client_id: number
  date_created: string
  valid_until: string
  total_amount: number
  labour_total: number
  grand_total: number
  vat_amount?: number
  vat_percentage?: number
  status: "draft" | "pending" | "accepted" | "rejected" | "expired"
  notes?: string
  terms_conditions?: string
  client?: RegisteredEntity
  sections: QuotationSection[]
  section_names?: {
    cabinet: string;
    worktop: string;
    accessories: string;
    appliances: string;
    wardrobes: string;
    tvunit: string;
  };
  created_by?: string
  last_modified: string
}

export interface QuotationItem {
  id: number
  quotation_id: number
  stock_item_id?: number
  section_type: "kitchen_cabinets" | "worktop" | "accessories"
  description: string
  quantity: number
  unit: string
  unit_price: number
  total_price: number
  labour_cost: number
  specifications?: string
  notes?: string
  stock_item?: StockItem
}

// Sales Order Types
export interface SalesOrder {
  id: number
  order_number: string
  client_id: number
  quotation_id?: number
  date_created: string
  delivery_date?: string
  total_amount: number
  status: "pending" | "processing" | "completed" | "cancelled" | "delivered"
  notes?: string
  delivery_address?: string
  contact_person?: string
  phone?: string
  client?: RegisteredEntity
  quotation?: Quotation
  items: SalesOrderItem[]
}

export interface SalesOrderItem {
  id: number
  sales_order_id: number
  stock_item_id: number
  quantity: number
  unit_price: number
  total_price: number
  delivered_quantity: number
  status: "pending" | "delivered" | "cancelled"
  stock_item?: StockItem
}

// Invoice Types
export interface Invoice {
  id?: number
  invoice_number: string
  client_id: number
  sales_order_id?: number
  quotation_id?: number
  original_quotation_number?: string
  original_order_number?: string
  date_created: string
  due_date: string
  cabinet_total: number
  worktop_total: number
  accessories_total: number
  labour_percentage: number
  labour_total: number
  total_amount: number
  grand_total: number
  paid_amount: number
  balance_amount: number
  include_accessories: boolean
  status: string
  notes?: string
  terms_conditions?: string
  client?: {
    id: number
    name: string
    phone?: string
    location?: string
  }
  items?: InvoiceItem[]
  payments?: Payment[]
  // Legacy fields for backward compatibility
  balance?: number
  payment_terms?: string
  sales_order?: SalesOrder
}

export interface InvoiceItem {
  id?: number
  invoice_id?: number
  category: "cabinet" | "worktop" | "accessories"
  description: string
  unit: string
  quantity: number
  unit_price: number
  total_price: number
  stock_item_id?: number
  discount_percentage?: number
  discount_amount?: number
  tax_percentage?: number
  tax_amount?: number
  stock_item?: StockItem
}

// Cash Sales Types
export interface CashSale {
  id?: number
  sale_number: string
  client_id: number
  invoice_id?: number
  sales_order_id?: number
  quotation_id?: number
  original_quotation_number?: string
  original_order_number?: string
  original_invoice_number?: string
  date_created: string
  payment_method: string
  payment_reference?: string
  cabinet_total: number
  worktop_total: number
  accessories_total: number
  labour_percentage: number
  labour_total: number
  total_amount: number
  grand_total: number
  amount_paid: number
  change_amount: number
  balance_amount: number
  include_accessories: boolean
  status: string
  notes?: string
  terms_conditions?: string
  client?: {
    id: number
    name: string
    phone?: string
    location?: string
  }
  items?: CashSaleItem[]
}

export interface CashSaleItem {
  id?: number
  cash_sale_id?: number
  category: "cabinet" | "worktop" | "accessories"
  description: string
  unit: string
  quantity: number
  unit_price: number
  total_price: number
  stock_item_id?: number
  stock_item?: StockItem
}

// Payment Types
export interface Payment {
  id: number
  payment_number: string
  client_id?: number
  invoice_id?: number
  amount: number
  payment_method: string
  reference?: string
  description?: string
  paid_to?: string
  account_credited?: string
  status: string
  date_created: string
  client?: RegisteredEntity
  invoice?: Invoice
}

export interface AccountSummary {
  client_id: number
  client_name: string
  total_invoices: number
  total_amount: number
  total_paid: number
  balance: number
  last_payment_date?: string
  status: "current" | "overdue" | "credit"
}

// Purchase Types
export interface Purchase {
  id: number
  purchase_order_number: string
  purchase_date: string
  supplier_id: number
  payment_method: string
  total_amount: number
  status: "pending" | "received" | "cancelled"
  notes?: string
  date_created: string
  last_modified: string
  supplier?: RegisteredEntity
  items?: PurchaseItemData[]
}

export interface PurchaseItem {
  id: number
  purchase_id: number
  stock_item_id: number
  description: string
  unit: string
  quantity: number
  unit_price: number
  total_price: number
  stock_item?: StockItem
}

export interface PurchaseItemData {
  id: number
  purchase_id: number
  stock_item_id: number
  description: string
  unit: string
  quantity: number
  unit_price: number
  total_price: number
}

// Expense Types
export interface Expense {
  id: number
  expense_number: string
  client_id?: number
  category: string
  department?: string
  amount: number
  description?: string
  receipt_number?: string
  account_debited?: string
  date_created: string
  expense_type: "client" | "company"
  client?: RegisteredEntity
}

export interface ExpenseCategory {
  id: number
  name: string
  description?: string
  type: "company" | "client"
  is_active: boolean
}

// Stock Management Types
export interface StockMovement {
  id: number
  stock_item_id: number
  type: "in" | "out" | "adjustment"
  quantity: number
  reference_type: "purchase" | "sales_order" | "adjustment" | "return"
  reference_id?: number
  date_created: string
  notes?: string
  created_by?: string
  stock_item?: StockItem
}

export interface StockSummary {
  total_items: number
  total_value: number
  low_stock_items: number
  out_of_stock_items: number
  categories: StockCategoryStats[]
}

export interface StockCategoryStats {
  category: string
  item_count: number
  total_value: number
  low_stock_count: number
}

// Document Generation Types
export interface DocumentTemplate {
  id: number
  name: string
  type: "quotation" | "invoice" | "sales_order" | "purchase_order"
  template_html: string
  is_default: boolean
  created_date: string
  last_modified: string
}

export interface DocumentSettings {
  company_name: string
  company_address: string
  company_phone: string
  company_email: string
  company_logo?: string
  tax_number?: string
  currency: string
  currency_symbol: string
  decimal_places: number
  date_format: string
  number_format: string
}

// UI State Types
export interface ModalState {
  isOpen: boolean
  type?: "create" | "edit" | "view" | "delete"
  data?: any
  title?: string
  size?: "sm" | "md" | "lg" | "xl" | "full"
}

export interface FilterState {
  search: string
  type?: "client" | "supplier" | "all"
  status?: string
  date_from?: string
  date_to?: string
  category?: string
  sort_by?: string
  sort_order?: "asc" | "desc"
  page: number
  per_page: number
}

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  width?: string
  align?: "left" | "center" | "right"
  format?: "currency" | "date" | "number" | "text"
}

export interface PaginationInfo {
  current_page: number
  per_page: number
  total_items: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
  data?: any
}

// Form Types
export interface RegisterFormData {
  type: "client" | "supplier"
  name: string
  phone?: string
  pin?: string
  location?: string
  email?: string
  address?: string
  company?: string
  contact_person?: string
  notes?: string
}

export interface QuotationFormData {
  client_id: number
  valid_until: string
  notes?: string
  terms_conditions?: string
  kitchen_cabinets: QuotationSectionFormData
  worktop: QuotationSectionFormData
  accessories: QuotationSectionFormData
}

export interface QuotationSectionFormData {
  items: QuotationSectionItemFormData[]
  labour_cost: number
}

export interface QuotationSectionItemFormData {
  description: string
  quantity: number
  unit: string
  unit_price: number
  specifications?: string
  notes?: string
}

export interface StockItemFormData {
  name: string
  description?: string
  unit_price: number
  quantity: number
  reorder_level: number
  category?: string
  supplier_id?: number
  sku?: string
}

export interface PaymentFormData {
  client_id: number
  invoice_id?: number
  amount: number
  payment_method: "cash" | "card" | "mobile" | "cooperative_bank"
  payment_reference?: string
  date_paid: string
  notes?: string
}

export interface ExpenseFormData {
  category: string
  description?: string
  amount: number
  expense_type: "company" | "client"
  client_id?: number
  receipt_number?: string
  notes?: string
  payment_method?: "cash" | "card" | "mobile" | "cooperative_bank"
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationInfo
}

export interface DatabaseResult<T> {
  data: T | null
  error: string | null
  count?: number
}

// Chart and Analytics Types
export interface ChartData {
  labels: string[]
  datasets: ChartDataset[]
}

export interface ChartDataset {
  label: string
  data: number[]
  backgroundColor?: string | string[]
  borderColor?: string | string[]
  borderWidth?: number
  fill?: boolean
}

export interface SalesAnalytics {
  total_sales: number
  total_revenue: number
  average_order_value: number
  top_clients: ClientStats[]
  monthly_sales: MonthlyStats[]
  sales_by_category: CategoryStats[]
}

export interface ClientStats {
  client_id: number
  client_name: string
  total_orders: number
  total_amount: number
  last_order_date: string
}

export interface MonthlyStats {
  month: string
  year: number
  sales_count: number
  revenue: number
}

export interface CategoryStats {
  category: string
  sales_count: number
  revenue: number
  percentage: number
}

// Validation Types
export interface ValidationRule {
  field: string
  required?: boolean
  min?: number
  max?: number
  pattern?: RegExp
  custom?: (value: any) => boolean | string
}

export interface ValidationResult {
  isValid: boolean
  errors: { [key: string]: string }
}

// Settings Types
export interface UserSettings {
  theme: "light" | "dark"
  language: string
  currency: string
  date_format: string
  decimal_places: number
  default_payment_method: string
  email_notifications: boolean
  sms_notifications: boolean
}

// Print and Export Types
export interface PrintOptions {
  format: "A4" | "letter" | "legal"
  orientation: "portrait" | "landscape"
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
  header?: boolean
  footer?: boolean
  page_numbers?: boolean
}

export interface ExportOptions {
  format: "pdf" | "excel" | "csv"
  filename?: string
  include_summary?: boolean
  date_range?: {
    start: string
    end: string
  }
}

// Notification Types
export interface NotificationSettings {
  low_stock_alerts: boolean
  overdue_payments: boolean
  quotation_expiry: boolean
  delivery_reminders: boolean
  email_notifications: boolean
  sms_notifications: boolean
  push_notifications: boolean
}

export interface SystemNotification {
  id: number
  type: "info" | "warning" | "error" | "success"
  title: string
  message: string
  read: boolean
  created_at: string
  action_url?: string
  action_text?: string
}

// Audit and Logging Types
export interface AuditLog {
  id: number
  table_name: string
  record_id: number
  action: "create" | "update" | "delete"
  old_values?: any
  new_values?: any
  user_id?: number
  timestamp: string
  ip_address?: string
}

export interface SystemLog {
  id: number
  level: "debug" | "info" | "warning" | "error"
  message: string
  context?: any
  timestamp: string
  user_id?: number
  session_id?: string
} 