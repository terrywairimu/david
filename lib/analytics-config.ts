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

export type ChartTypeKey = 'area' | 'line' | 'bar' | 'barHorizontal'

export interface AnalyticsMetricOption {
  id: string
  label: string
  dataKey: string
  format: 'currency' | 'number' | 'percent'
  chartType: ChartTypeKey
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

// Chart types: area=monetary trends, line=averages/rates, bar=counts/discrete
// Comprehensive analytics metrics per section/subType combination
const salesMetrics: AnalyticsMetricOption[] = [
  { id: 'total_amount', label: 'Total Value', dataKey: 'amount', format: 'currency', chartType: 'area', description: 'Sum of document amounts' },
  { id: 'count', label: 'Document Count', dataKey: 'count', format: 'number', chartType: 'bar', description: 'Number of documents' },
  { id: 'avg_value', label: 'Average Value', dataKey: 'avg', format: 'currency', chartType: 'line', description: 'Average per document' },
  { id: 'by_status', label: 'By Status', dataKey: 'by_status', format: 'number', chartType: 'bar', description: 'Breakdown by status' },
  { id: 'by_client', label: 'By Client', dataKey: 'by_client', format: 'currency', chartType: 'bar', description: 'Breakdown by client' },
  { id: 'conversion_rate', label: 'Conversion Rate', dataKey: 'conversion', format: 'percent', chartType: 'line', description: 'Quotation to order conversion' },
]

const expensesMetrics: AnalyticsMetricOption[] = [
  { id: 'total_amount', label: 'Total Amount', dataKey: 'amount', format: 'currency', chartType: 'area' },
  { id: 'count', label: 'Expense Count', dataKey: 'count', format: 'number', chartType: 'bar' },
  { id: 'by_category', label: 'By Category', dataKey: 'by_category', format: 'currency', chartType: 'bar' },
  { id: 'by_department', label: 'By Department', dataKey: 'by_department', format: 'currency', chartType: 'bar' },
  { id: 'avg_expense', label: 'Average per Expense', dataKey: 'avg', format: 'currency', chartType: 'line' },
]

const paymentsMetrics: AnalyticsMetricOption[] = [
  { id: 'total_amount', label: 'Total Amount', dataKey: 'amount', format: 'currency', chartType: 'area' },
  { id: 'count', label: 'Transaction Count', dataKey: 'count', format: 'number', chartType: 'bar' },
  { id: 'by_method', label: 'By Payment Method', dataKey: 'by_method', format: 'currency', chartType: 'bar' },
  { id: 'by_account', label: 'By Account', dataKey: 'by_account', format: 'currency', chartType: 'bar' },
  { id: 'avg_payment', label: 'Average per Payment', dataKey: 'avg', format: 'currency', chartType: 'line' },
]

const purchasesMetrics: AnalyticsMetricOption[] = [
  { id: 'total_amount', label: 'Total Amount', dataKey: 'amount', format: 'currency', chartType: 'area' },
  { id: 'count', label: 'Order Count', dataKey: 'count', format: 'number', chartType: 'bar' },
  { id: 'by_supplier', label: 'By Supplier', dataKey: 'by_supplier', format: 'currency', chartType: 'bar' },
  { id: 'by_status', label: 'By Status', dataKey: 'by_status', format: 'number', chartType: 'bar' },
  { id: 'avg_order', label: 'Average Order Value', dataKey: 'avg', format: 'currency', chartType: 'line' },
]

const stockMetrics: AnalyticsMetricOption[] = [
  { id: 'total_value', label: 'Total Stock Value', dataKey: 'value', format: 'currency', chartType: 'area' },
  { id: 'item_count', label: 'Item Count', dataKey: 'count', format: 'number', chartType: 'bar' },
  { id: 'by_category', label: 'By Category', dataKey: 'by_category', format: 'currency', chartType: 'bar' },
  { id: 'low_stock', label: 'Low Stock Items', dataKey: 'low_stock', format: 'number', chartType: 'bar' },
  { id: 'movements', label: 'Movement Volume', dataKey: 'movements', format: 'number', chartType: 'bar' },
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

export function getChartTypeForMetric(section: SectionId, metricId: string): ChartTypeKey {
  const metrics = getAnalyticsMetrics(section)
  const m = metrics.find(x => x.id === metricId)
  return m?.chartType ?? 'area'
}

export interface HeaderStatDef {
  label: string
  valueKey: 'total' | 'growthRate' | 'distinctEntities' | 'count' | 'avg'
  format: 'currency' | 'number' | 'percent'
}

export function getHeaderStatsConfig(section: SectionId, subType: string): HeaderStatDef[] {
  switch (section) {
    case 'sales':
      return [
        { label: 'Total Value', valueKey: 'total', format: 'currency' },
        { label: 'Growth', valueKey: 'growthRate', format: 'percent' },
        { label: 'Customers', valueKey: 'distinctEntities', format: 'number' },
        { label: subType === 'quotations' ? 'Quotations' : subType === 'sales_orders' ? 'Orders' : subType === 'invoices' ? 'Invoices' : 'Cash Sales', valueKey: 'count', format: 'number' },
        { label: 'Avg Value', valueKey: 'avg', format: 'currency' },
      ]
    case 'expenses':
      return [
        { label: 'Total Amount', valueKey: 'total', format: 'currency' },
        { label: 'Growth', valueKey: 'growthRate', format: 'percent' },
        { label: subType === 'client' ? 'Clients' : 'Categories', valueKey: 'distinctEntities', format: 'number' },
        { label: 'Expenses', valueKey: 'count', format: 'number' },
        { label: 'Avg Expense', valueKey: 'avg', format: 'currency' },
      ]
    case 'payments':
      return [
        { label: 'Total Amount', valueKey: 'total', format: 'currency' },
        { label: 'Growth', valueKey: 'growthRate', format: 'percent' },
        { label: subType === 'received' ? 'Clients' : subType === 'supplier' ? 'Suppliers' : 'Employees', valueKey: 'distinctEntities', format: 'number' },
        { label: 'Transactions', valueKey: 'count', format: 'number' },
        { label: 'Avg Payment', valueKey: 'avg', format: 'currency' },
      ]
    case 'purchases':
      return [
        { label: 'Total Amount', valueKey: 'total', format: 'currency' },
        { label: 'Growth', valueKey: 'growthRate', format: 'percent' },
        { label: 'Suppliers', valueKey: 'distinctEntities', format: 'number' },
        { label: 'Orders', valueKey: 'count', format: 'number' },
        { label: 'Avg Order', valueKey: 'avg', format: 'currency' },
      ]
    case 'stock':
      return [
        { label: subType === 'movements' ? 'Movement Volume' : 'Total Value', valueKey: 'total', format: subType === 'movements' ? 'number' : 'currency' },
        { label: 'Growth', valueKey: 'growthRate', format: 'percent' },
        { label: subType === 'movements' ? 'Items' : 'Categories', valueKey: 'distinctEntities', format: 'number' },
        { label: subType === 'movements' ? 'Movements' : 'Items', valueKey: 'count', format: 'number' },
        { label: subType === 'movements' ? 'Avg Volume' : 'Avg Value', valueKey: 'avg', format: subType === 'movements' ? 'number' : 'currency' },
      ]
    default:
      return [
        { label: 'Total Value', valueKey: 'total', format: 'currency' },
        { label: 'Growth', valueKey: 'growthRate', format: 'percent' },
        { label: 'Customers', valueKey: 'distinctEntities', format: 'number' },
        { label: 'Count', valueKey: 'count', format: 'number' },
        { label: 'Avg', valueKey: 'avg', format: 'currency' },
      ]
  }
}

export function getSegmentationTitle(section: SectionId, subType: string): string {
  const subLabel = subType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  switch (section) {
    case 'sales': return `${subLabel} by status`
    case 'expenses': return `${subLabel} by category`
    case 'payments': return `${subLabel} by method`
    case 'purchases': return `${subLabel} by status`
    case 'stock': return subType === 'movements' ? 'Movements by type' : `${subLabel} by category`
    default: return 'Distribution'
  }
}
