/**
 * Analytics configuration: sections, sub-types, and metrics
 * Maps to database tables: quotations, sales_orders, invoices, cash_sales, payments, supplier_payments, employee_payments, expenses, purchases, stock_items, stock_movements
 */

export type SectionId = 'sales' | 'expenses' | 'payments' | 'purchases' | 'stock'
export type TimeRangeKey = '7d' | '30d' | '3m' | '6m' | '12m' | 'custom'

export interface SectionOption {
  id: SectionId
  label: string
  icon?: string
}

export interface SubTypeOption {
  id: string
  label: string
  table: string
  dateField: string
  amountField: string
}

export interface AnalyticsMetricOption {
  id: string
  label: string
  dataKey: string
  format: 'currency' | 'number' | 'percent'
  description?: string
}

export const SECTIONS: SectionOption[] = [
  { id: 'sales', label: 'Sales', icon: '📊' },
  { id: 'expenses', label: 'Expenses', icon: '💰' },
  { id: 'payments', label: 'Payments', icon: '💳' },
  { id: 'purchases', label: 'Purchases', icon: '🛒' },
  { id: 'stock', label: 'Stock', icon: '📦' },
]

const salesSubTypes: SubTypeOption[] = [
  { id: 'quotations', label: 'Quotations', table: 'quotations', dateField: 'date_created', amountField: 'grand_total' },
  { id: 'sales_orders', label: 'Sales Orders', table: 'sales_orders', dateField: 'date_created', amountField: 'grand_total' },
  { id: 'invoices', label: 'Invoices', table: 'invoices', dateField: 'date_created', amountField: 'grand_total' },
  { id: 'cash_sales', label: 'Cash Sales', table: 'cash_sales', dateField: 'date_created', amountField: 'grand_total' },
]

const expensesSubTypes: SubTypeOption[] = [
  { id: 'company', label: 'Company Expenses', table: 'expenses', dateField: 'date_created', amountField: 'amount' },
  { id: 'client', label: 'Client Expenses', table: 'expenses', dateField: 'date_created', amountField: 'amount' },
  { id: 'all', label: 'All Expenses', table: 'expenses', dateField: 'date_created', amountField: 'amount' },
]

const paymentsSubTypes: SubTypeOption[] = [
  { id: 'received', label: 'Received Payments', table: 'payments', dateField: 'date_created', amountField: 'amount' },
  { id: 'supplier', label: 'Supplier Payments', table: 'supplier_payments', dateField: 'date_created', amountField: 'amount' },
  { id: 'employee', label: 'Employee Payments', table: 'employee_payments', dateField: 'date_created', amountField: 'amount' },
]

const purchasesSubTypes: SubTypeOption[] = [
  { id: 'client', label: 'Client Purchases', table: 'purchases', dateField: 'purchase_date', amountField: 'total_amount' },
  { id: 'general', label: 'General Purchases', table: 'purchases', dateField: 'purchase_date', amountField: 'total_amount' },
  { id: 'all', label: 'All Purchases', table: 'purchases', dateField: 'purchase_date', amountField: 'total_amount' },
]

const stockSubTypes: SubTypeOption[] = [
  { id: 'items', label: 'New Stock Items', table: 'stock_items', dateField: 'date_added', amountField: 'unit_price' },
  { id: 'movements', label: 'Stock Movements', table: 'stock_movements', dateField: 'date_created', amountField: 'quantity' },
  { id: 'valuation', label: 'Stock by Category', table: 'stock_items', dateField: 'date_added', amountField: 'unit_price' },
]

export function getSubTypes(section: SectionId): SubTypeOption[] {
  switch (section) {
    case 'sales': return salesSubTypes
    case 'expenses': return expensesSubTypes
    case 'payments': return paymentsSubTypes
    case 'purchases': return purchasesSubTypes
    case 'stock': return stockSubTypes
    default: return salesSubTypes
  }
}

// Comprehensive analytics metrics per section/subType combination
const salesMetrics: AnalyticsMetricOption[] = [
  { id: 'total_amount', label: 'Total Value', dataKey: 'amount', format: 'currency', description: 'Sum of document amounts' },
  { id: 'count', label: 'Document Count', dataKey: 'count', format: 'number', description: 'Number of documents' },
  { id: 'avg_value', label: 'Average Value', dataKey: 'avg', format: 'currency', description: 'Average per document' },
  { id: 'by_status', label: 'By Status', dataKey: 'by_status', format: 'number', description: 'Breakdown by status' },
  { id: 'by_client', label: 'By Client', dataKey: 'by_client', format: 'currency', description: 'Breakdown by client' },
  { id: 'conversion_rate', label: 'Conversion Rate', dataKey: 'conversion', format: 'percent', description: 'Quotation to order conversion' },
]

const expensesMetrics: AnalyticsMetricOption[] = [
  { id: 'total_amount', label: 'Total Amount', dataKey: 'amount', format: 'currency' },
  { id: 'count', label: 'Expense Count', dataKey: 'count', format: 'number' },
  { id: 'by_category', label: 'By Category', dataKey: 'by_category', format: 'currency' },
  { id: 'by_department', label: 'By Department', dataKey: 'by_department', format: 'currency' },
  { id: 'avg_expense', label: 'Average per Expense', dataKey: 'avg', format: 'currency' },
]

const paymentsMetrics: AnalyticsMetricOption[] = [
  { id: 'total_amount', label: 'Total Amount', dataKey: 'amount', format: 'currency' },
  { id: 'count', label: 'Transaction Count', dataKey: 'count', format: 'number' },
  { id: 'by_method', label: 'By Payment Method', dataKey: 'by_method', format: 'currency' },
  { id: 'by_account', label: 'By Account', dataKey: 'by_account', format: 'currency' },
  { id: 'avg_payment', label: 'Average per Payment', dataKey: 'avg', format: 'currency' },
]

const purchasesMetrics: AnalyticsMetricOption[] = [
  { id: 'total_amount', label: 'Total Amount', dataKey: 'amount', format: 'currency' },
  { id: 'count', label: 'Order Count', dataKey: 'count', format: 'number' },
  { id: 'by_supplier', label: 'By Supplier', dataKey: 'by_supplier', format: 'currency' },
  { id: 'by_status', label: 'By Status', dataKey: 'by_status', format: 'number' },
  { id: 'avg_order', label: 'Average Order Value', dataKey: 'avg', format: 'currency' },
]

const stockMetrics: AnalyticsMetricOption[] = [
  { id: 'total_value', label: 'Total Stock Value', dataKey: 'value', format: 'currency' },
  { id: 'item_count', label: 'Item Count', dataKey: 'count', format: 'number' },
  { id: 'by_category', label: 'By Category', dataKey: 'by_category', format: 'currency' },
  { id: 'low_stock', label: 'Low Stock Items', dataKey: 'low_stock', format: 'number' },
  { id: 'movements', label: 'Movement Volume', dataKey: 'movements', format: 'number' },
]

export function getAnalyticsMetrics(section: SectionId): AnalyticsMetricOption[] {
  switch (section) {
    case 'sales': return salesMetrics
    case 'expenses': return expensesMetrics
    case 'payments': return paymentsMetrics
    case 'purchases': return purchasesMetrics
    case 'stock': return stockMetrics
    default: return salesMetrics
  }
}

export const TIME_RANGE_LABELS: Record<TimeRangeKey, string> = {
  '7d': '7 Days',
  '30d': '30 Days',
  '3m': '3 Months',
  '6m': '6 Months',
  '12m': '12 Months',
  custom: 'Specific Period',
}

export function getTimeRangeSubtitle(timeRange: TimeRangeKey, start?: string, end?: string): string {
  if (timeRange === 'custom' && start && end) {
    return `${start} to ${end}`
  }
  return TIME_RANGE_LABELS[timeRange] || timeRange
}

export function getChartTitle(section: string, subType: string, metric: string, timeLabel: string): string {
  const sectionLabel = SECTIONS.find(s => s.id === section)?.label || section
  const subLabel = subType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const metricLabel = metric.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return `${sectionLabel} › ${subLabel} › ${metricLabel}`
}
