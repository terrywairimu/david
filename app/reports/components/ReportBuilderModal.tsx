"use client"

import React, { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { Calendar, Download, Printer, X, BarChart3, TrendingUp, Users, Package, Wallet, Settings, FileText, Search, Eye } from "lucide-react"
import { exportToCSV, printTableHtml, TableColumn } from "./ReportUtils"
import { getNairobiDayBoundaries, getNairobiWeekBoundaries, getNairobiMonthBoundaries } from "@/lib/timezone"

type ReportType = 'sales' | 'expenses' | 'inventory' | 'clients' | 'financial' | 'custom'

interface ReportBuilderModalProps {
  isOpen: boolean
  onClose: () => void
  type: ReportType
}

type DateRangeKey = 'today' | 'yesterday' | 'week' | 'lastWeek' | 'month' | 'lastMonth' | 'quarter' | 'year' | 'custom' | 'all'

// Color schemes matching the HTML version
const headerGradients: Record<ReportType, string> = {
  sales: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  expenses: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
  inventory: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
  clients: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
  financial: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
  custom: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)'
}

const reportIcons: Record<ReportType, React.ReactNode> = {
  sales: <BarChart3 size={24} />,
  expenses: <TrendingUp size={24} />,
  inventory: <Package size={24} />,
  clients: <Users size={24} />,
  financial: <Wallet size={24} />,
  custom: <Settings size={24} />
}

const reportTitles: Record<ReportType, string> = {
  sales: 'Sales Reports',
  expenses: 'Expense Reports',
  inventory: 'Inventory Reports',
  clients: 'Client Reports',
  financial: 'Financial Summary',
  custom: 'Custom Reports'
}

// Currency formatting function
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2
  }).format(amount)
}

const computeDateRange = (preset: DateRangeKey, start?: string, end?: string) => {
  const now = new Date()
  let startDate: Date, endDate: Date

  switch (preset) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      break
    case 'yesterday':
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
      endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59)
      break
    case 'week':
      const weekBounds = getNairobiWeekBoundaries(now)
      startDate = weekBounds.start
      endDate = weekBounds.end
      break
    case 'lastWeek':
      const lastWeek = new Date(now)
      lastWeek.setDate(lastWeek.getDate() - 7)
      const lastWeekBounds = getNairobiWeekBoundaries(lastWeek)
      startDate = lastWeekBounds.start
      endDate = lastWeekBounds.end
      break
    case 'month':
      const monthBounds = getNairobiMonthBoundaries(now)
      startDate = monthBounds.start
      endDate = monthBounds.end
      break
    case 'lastMonth':
      const lastMonth = new Date(now)
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      const lastMonthBounds = getNairobiMonthBoundaries(lastMonth)
      startDate = lastMonthBounds.start
      endDate = lastMonthBounds.end
      break
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3)
      startDate = new Date(now.getFullYear(), quarter * 3, 1)
      endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59)
      break
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1)
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
      break
    case 'all':
      startDate = new Date(2020, 0, 1) // Far back date
      endDate = new Date(now.getFullYear() + 1, 11, 31, 23, 59, 59)
      break
    case 'custom':
      startDate = start ? new Date(start) : new Date()
      endDate = end ? new Date(end + 'T23:59:59') : new Date()
      break
    default:
      startDate = new Date()
      endDate = new Date()
  }

  return { start: startDate, end: endDate }
}

export default function ReportBuilderModal({ isOpen, onClose, type }: ReportBuilderModalProps){
  
  const [loading, setLoading] = useState(false)
  const [previewData, setPreviewData] = useState<any[] | null>(null)
  const [previewColumns, setPreviewColumns] = useState<TableColumn[]>([])
  const [clientOptions, setClientOptions] = useState<Array<{id: number, name: string}>>([])
  const [categoryOptions, setCategoryOptions] = useState<string[]>([])

  // Reset loading when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setLoading(false)
      setPreviewData(null)
    }
  }, [isOpen])

  const [datePreset, setDatePreset] = useState<DateRangeKey>('month')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [format, setFormat] = useState<'pdf'|'excel'|'csv'>('pdf')
  
  // Sales
  const [salesGroupBy, setSalesGroupBy] = useState<'day'|'week'|'month'|'client'|'product'>('month')
  const [includeCashSales, setIncludeCashSales] = useState(true)
  const [includeInvoices, setIncludeInvoices] = useState(true)
  const [includeQuotations, setIncludeQuotations] = useState(true)
  const [includeSalesOrders, setIncludeSalesOrders] = useState(true)
  
  // Expenses
  const [expensesGroupBy, setExpensesGroupBy] = useState<'day'|'week'|'month'|'category'|'department'>('category')
  const [expenseType, setExpenseType] = useState<'all'|'company'|'client'>('all')
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [clientSearchTerm, setClientSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  
  // Inventory
  const [inventoryReportType, setInventoryReportType] = useState<'all'|'low_stock'|'out_of_stock'|'category'|'valuation'>('all')
  const [inventoryCategory, setInventoryCategory] = useState<string>('')
  const [includeZeroStock, setIncludeZeroStock] = useState(false)
  
  // Financial - Professional Report Types
  const [financialReportType, setFinancialReportType] = useState<'summary'|'profitLoss'|'balanceSheet'|'cashFlow'|'cashBook'|'incomeStatement'|'trialBalance'>('summary')
  const [includeComparisons, setIncludeComparisons] = useState(false)
  const [showPercentages, setShowPercentages] = useState(true)
  
  // Clients
  const [clientFilter, setClientFilter] = useState<string>('')
  const [clientReportType, setClientReportType] = useState<'list'|'statement'|'aging'|'activity'>('list')
  
  // Custom
  const [includeSales, setIncludeSales] = useState(true)
  const [includeExpensesData, setIncludeExpensesData] = useState(true)
  const [includeInventoryData, setIncludeInventoryData] = useState(true)
  const [customGroupBy, setCustomGroupBy] = useState<'none'|'day'|'week'|'month'|'client'|'category'>('none')

  // Load client options for all report types that need it
  useEffect(() => {
    if (isOpen && (type === 'clients' || type === 'expenses' || type === 'sales')) {
      supabase.from('registered_entities')
        .select('id, name')
        .eq('type', 'client')
        .eq('status', 'active')
        .order('name')
        .then(({ data }) => {
          setClientOptions((data || []).map(c => ({ id: c.id, name: c.name })))
        })
    }
  }, [isOpen, type])

  // Load expense categories
  useEffect(() => {
    if (isOpen && type === 'expenses') {
      supabase.from('expenses')
        .select('category')
        .then(({ data }) => {
          const categories = [...new Set((data || []).map(e => e.category).filter(Boolean))]
          setCategoryOptions(categories.sort())
        })
    }
  }, [isOpen, type])

  // Filter clients by search term
  const filteredClients = useMemo(() => {
    if (!clientSearchTerm) return clientOptions
    return clientOptions.filter(c => 
      c.name.toLowerCase().includes(clientSearchTerm.toLowerCase())
    )
  }, [clientOptions, clientSearchTerm])

  if (!isOpen) return null

  // Generate preview data
  const generatePreview = async () => {
    const { start, end } = computeDateRange(datePreset, startDate, endDate)
    let rows: any[] = []
    let columns: TableColumn[] = []
    
    setLoading(true)
    
    try {
      if (type === 'expenses') {
        let query = supabase.from('expenses')
          .select(`
            *,
            client:registered_entities!expenses_client_id_fkey(id, name)
          `)
          .gte('date_created', start.toISOString())
          .lte('date_created', end.toISOString())
          .order('date_created', { ascending: false })
        
        if (expenseType !== 'all') {
          query = query.eq('expense_type', expenseType)
        }
        
        if (selectedClientId && expenseType === 'client') {
          query = query.eq('client_id', parseInt(selectedClientId))
        }
        
        if (selectedCategory) {
          query = query.eq('category', selectedCategory)
        }
        
        const { data, error } = await query
        
        if (error) throw error
        
        // Group data if needed
        if (expensesGroupBy === 'category') {
          const grouped = (data || []).reduce((acc: any, exp: any) => {
            const key = exp.category || 'Uncategorized'
            if (!acc[key]) acc[key] = { category: key, count: 0, total: 0 }
            acc[key].count += 1
            acc[key].total += parseFloat(exp.amount || 0)
            return acc
          }, {})
          
          rows = Object.values(grouped)
          columns = [
            { key: 'category', label: 'Category' },
            { key: 'count', label: 'Count', align: 'right' },
            { key: 'total', label: 'Total Amount', align: 'right' }
          ]
        } else {
          rows = (data || []).map((exp: any) => ({
            date: new Date(exp.date_created).toLocaleDateString(),
            expense_number: exp.expense_number,
            category: exp.category,
            description: exp.description,
            expense_type: exp.expense_type,
            client: exp.client?.name || '-',
            amount: parseFloat(exp.amount || 0)
          }))
          
          columns = [
            { key: 'date', label: 'Date' },
            { key: 'expense_number', label: 'Expense #' },
            { key: 'category', label: 'Category' },
            { key: 'description', label: 'Description' },
            { key: 'expense_type', label: 'Type' },
            { key: 'client', label: 'Client' },
            { key: 'amount', label: 'Amount', align: 'right' }
          ]
        }
      } else if (type === 'financial') {
        // Professional Financial Reports
        if (financialReportType === 'profitLoss' || financialReportType === 'incomeStatement') {
          // Profit & Loss / Income Statement
          const [salesRes, expensesRes, paymentsRes] = await Promise.all([
            supabase.from('sales_orders').select('grand_total, date_created')
              .gte('date_created', start.toISOString())
              .lte('date_created', end.toISOString()),
            supabase.from('expenses').select('amount, category, expense_type, date_created')
              .gte('date_created', start.toISOString())
              .lte('date_created', end.toISOString()),
            supabase.from('payments').select('amount, date_paid')
              .eq('status', 'completed')
              .gte('date_paid', start.toISOString())
              .lte('date_paid', end.toISOString())
          ])
          
          const totalRevenue = (salesRes.data || []).reduce((s, r) => s + parseFloat(r.grand_total || 0), 0)
          const totalPayments = (paymentsRes.data || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0)
          
          // Group expenses by category
          const expensesByCategory = (expensesRes.data || []).reduce((acc: any, exp: any) => {
            const cat = exp.category || 'Other'
            acc[cat] = (acc[cat] || 0) + parseFloat(exp.amount || 0)
            return acc
          }, {})
          
          const totalExpenses = Object.values(expensesByCategory).reduce((s: number, v: any) => s + v, 0)
          const grossProfit = totalRevenue - totalExpenses
          const netIncome = totalPayments - totalExpenses
          
          rows = [
            { account: 'REVENUE', type: 'Header', amount: '', percentage: '' },
            { account: 'Sales Revenue', type: 'Revenue', amount: totalRevenue, percentage: '100%' },
            { account: 'Payments Received', type: 'Revenue', amount: totalPayments, percentage: showPercentages ? `${((totalPayments/totalRevenue)*100).toFixed(1)}%` : '' },
            { account: '', type: 'Spacer', amount: '', percentage: '' },
            { account: 'EXPENSES', type: 'Header', amount: '', percentage: '' },
            ...Object.entries(expensesByCategory).map(([cat, amt]: [string, any]) => ({
              account: cat.charAt(0).toUpperCase() + cat.slice(1),
              type: 'Expense',
              amount: amt,
              percentage: showPercentages ? `${((amt/totalRevenue)*100).toFixed(1)}%` : ''
            })),
            { account: 'Total Expenses', type: 'Subtotal', amount: totalExpenses, percentage: showPercentages ? `${((totalExpenses/totalRevenue)*100).toFixed(1)}%` : '' },
            { account: '', type: 'Spacer', amount: '', percentage: '' },
            { account: 'PROFIT/LOSS', type: 'Header', amount: '', percentage: '' },
            { account: 'Gross Profit', type: 'Total', amount: grossProfit, percentage: showPercentages ? `${((grossProfit/totalRevenue)*100).toFixed(1)}%` : '' },
            { account: 'Net Income', type: 'GrandTotal', amount: netIncome, percentage: showPercentages ? `${((netIncome/totalRevenue)*100).toFixed(1)}%` : '' }
          ]
          
          columns = [
            { key: 'account', label: 'Account' },
            { key: 'type', label: 'Type' },
            { key: 'amount', label: 'Amount (KES)', align: 'right' },
            { key: 'percentage', label: '% of Revenue', align: 'right' }
          ]
        } else if (financialReportType === 'cashBook') {
          // Three-Column Cash Book
          const { data: transactions } = await supabase
            .from('account_transactions')
            .select('*')
            .gte('transaction_date', start.toISOString())
            .lte('transaction_date', end.toISOString())
            .order('transaction_date', { ascending: true })
          
          let runningBalance = 0
          rows = (transactions || []).map((t: any) => {
            const debit = t.transaction_type === 'in' ? parseFloat(t.amount) : 0
            const credit = t.transaction_type === 'out' ? parseFloat(t.amount) : 0
            runningBalance += debit - credit
            return {
              date: new Date(t.transaction_date).toLocaleDateString(),
              reference: t.transaction_number,
              description: t.description,
              account: t.account_type,
              debit: debit || '',
              credit: credit || '',
              balance: runningBalance
            }
          })
          
          columns = [
            { key: 'date', label: 'Date' },
            { key: 'reference', label: 'Reference' },
            { key: 'description', label: 'Description' },
            { key: 'account', label: 'Account' },
            { key: 'debit', label: 'Debit (Dr)', align: 'right' },
            { key: 'credit', label: 'Credit (Cr)', align: 'right' },
            { key: 'balance', label: 'Balance', align: 'right' }
          ]
        } else if (financialReportType === 'balanceSheet') {
          // Balance Sheet
          const { data: balances } = await supabase.from('account_balances').select('*')
          
          const cashBalance = balances?.find(b => b.account_type === 'cash')?.current_balance || 0
          const bankBalance = balances?.find(b => b.account_type === 'cooperative_bank')?.current_balance || 0
          
          // Get receivables (unpaid invoices)
          const { data: invoices } = await supabase.from('invoices')
            .select('grand_total, paid_amount')
            .in('status', ['pending', 'overdue'])
          
          const receivables = (invoices || []).reduce((s, i) => 
            s + (parseFloat(i.grand_total || 0) - parseFloat(i.paid_amount || 0)), 0)
          
          // Get inventory value
          const { data: inventory } = await supabase.from('stock_items').select('quantity, unit_price')
          const inventoryValue = (inventory || []).reduce((s, i) => 
            s + ((i.quantity || 0) * parseFloat(i.unit_price || 0)), 0)
          
          rows = [
            { account: 'ASSETS', type: 'Header', amount: '' },
            { account: 'Current Assets', type: 'SubHeader', amount: '' },
            { account: 'Cash in Hand', type: 'Asset', amount: parseFloat(cashBalance) },
            { account: 'Bank (Cooperative)', type: 'Asset', amount: parseFloat(bankBalance) },
            { account: 'Accounts Receivable', type: 'Asset', amount: receivables },
            { account: 'Inventory', type: 'Asset', amount: inventoryValue },
            { account: 'Total Current Assets', type: 'Subtotal', amount: parseFloat(cashBalance) + parseFloat(bankBalance) + receivables + inventoryValue },
            { account: '', type: 'Spacer', amount: '' },
            { account: 'TOTAL ASSETS', type: 'GrandTotal', amount: parseFloat(cashBalance) + parseFloat(bankBalance) + receivables + inventoryValue }
          ]
          
          columns = [
            { key: 'account', label: 'Account' },
            { key: 'type', label: 'Type' },
            { key: 'amount', label: 'Amount (KES)', align: 'right' }
          ]
        } else if (financialReportType === 'cashFlow') {
          // Cash Flow Statement
          const [paymentsIn, paymentsOut, expenses] = await Promise.all([
            supabase.from('payments').select('amount, description')
              .eq('status', 'completed')
              .gte('date_paid', start.toISOString())
              .lte('date_paid', end.toISOString()),
            supabase.from('supplier_payments').select('amount, description')
              .gte('payment_date', start.toISOString())
              .lte('payment_date', end.toISOString()),
            supabase.from('expenses').select('amount, category')
              .gte('date_created', start.toISOString())
              .lte('date_created', end.toISOString())
          ])
          
          const totalInflows = (paymentsIn.data || []).reduce((s, p) => s + parseFloat(p.amount || 0), 0)
          const supplierPayments = (paymentsOut.data || []).reduce((s, p) => s + parseFloat(p.amount || 0), 0)
          const operatingExpenses = (expenses.data || []).reduce((s, e) => s + parseFloat(e.amount || 0), 0)
          const netCashFlow = totalInflows - supplierPayments - operatingExpenses
          
          rows = [
            { activity: 'OPERATING ACTIVITIES', type: 'Header', inflow: '', outflow: '', net: '' },
            { activity: 'Cash Receipts from Customers', type: 'Inflow', inflow: totalInflows, outflow: '', net: totalInflows },
            { activity: 'Payments to Suppliers', type: 'Outflow', inflow: '', outflow: supplierPayments, net: -supplierPayments },
            { activity: 'Operating Expenses', type: 'Outflow', inflow: '', outflow: operatingExpenses, net: -operatingExpenses },
            { activity: '', type: 'Spacer', inflow: '', outflow: '', net: '' },
            { activity: 'Net Cash from Operations', type: 'Subtotal', inflow: totalInflows, outflow: supplierPayments + operatingExpenses, net: netCashFlow },
            { activity: '', type: 'Spacer', inflow: '', outflow: '', net: '' },
            { activity: 'NET CHANGE IN CASH', type: 'GrandTotal', inflow: '', outflow: '', net: netCashFlow }
          ]
          
          columns = [
            { key: 'activity', label: 'Activity' },
            { key: 'type', label: 'Type' },
            { key: 'inflow', label: 'Inflows', align: 'right' },
            { key: 'outflow', label: 'Outflows', align: 'right' },
            { key: 'net', label: 'Net', align: 'right' }
          ]
        } else {
          // Summary
          const [salesRes, expensesRes, paymentsRes, balancesRes] = await Promise.all([
            supabase.from('sales_orders').select('grand_total'),
            supabase.from('expenses').select('amount'),
            supabase.from('payments').select('amount').eq('status', 'completed'),
            supabase.from('account_balances').select('*')
          ])
          
          const totalSales = (salesRes.data || []).reduce((s, r) => s + parseFloat(r.grand_total || 0), 0)
          const totalExpenses = (expensesRes.data || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0)
          const totalPayments = (paymentsRes.data || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0)
          const cashBalance = balancesRes.data?.find(b => b.account_type === 'cash')?.current_balance || 0
          const bankBalance = balancesRes.data?.find(b => b.account_type === 'cooperative_bank')?.current_balance || 0
          
          rows = [
            { metric: 'Total Sales (Orders)', value: totalSales },
            { metric: 'Total Payments Received', value: totalPayments },
            { metric: 'Total Expenses', value: totalExpenses },
            { metric: 'Net Profit', value: totalSales - totalExpenses },
            { metric: 'Cash Balance', value: parseFloat(cashBalance) },
            { metric: 'Bank Balance', value: parseFloat(bankBalance) },
            { metric: 'Total Liquid Assets', value: parseFloat(cashBalance) + parseFloat(bankBalance) }
          ]
          
          columns = [
            { key: 'metric', label: 'Metric' },
            { key: 'value', label: 'Value (KES)', align: 'right' }
          ]
        }
      } else if (type === 'sales') {
        // Sales report logic
        const queries = []
        
        if (includeQuotations) {
          queries.push(
            supabase.from('quotations')
              .select('quotation_number, date_created, grand_total, status, client:registered_entities(name)')
              .gte('date_created', start.toISOString())
              .lte('date_created', end.toISOString())
          )
        }
        
        if (includeSalesOrders) {
          queries.push(
            supabase.from('sales_orders')
              .select('order_number, date_created, grand_total, status, client:registered_entities(name)')
              .gte('date_created', start.toISOString())
              .lte('date_created', end.toISOString())
          )
        }
        
        if (includeInvoices) {
          queries.push(
            supabase.from('invoices')
              .select('invoice_number, date_created, grand_total, status, client:registered_entities(name)')
              .gte('date_created', start.toISOString())
              .lte('date_created', end.toISOString())
          )
        }
        
        if (includeCashSales) {
          queries.push(
            supabase.from('cash_sales')
              .select('sale_number, date_created, grand_total, status, client:registered_entities(name)')
              .gte('date_created', start.toISOString())
              .lte('date_created', end.toISOString())
          )
        }
        
        const results = await Promise.all(queries)
        
        const allRows: any[] = []
        let idx = 0
        
        if (includeQuotations && results[idx]) {
          (results[idx].data || []).forEach((r: any) => {
            allRows.push({
              date: new Date(r.date_created).toLocaleDateString(),
              type: 'Quotation',
              reference: r.quotation_number,
              client: r.client?.name || '-',
              status: r.status,
              amount: parseFloat(r.grand_total || 0)
            })
          })
          idx++
        }
        
        if (includeSalesOrders && results[idx]) {
          (results[idx].data || []).forEach((r: any) => {
            allRows.push({
              date: new Date(r.date_created).toLocaleDateString(),
              type: 'Sales Order',
              reference: r.order_number,
              client: r.client?.name || '-',
              status: r.status,
              amount: parseFloat(r.grand_total || 0)
            })
          })
          idx++
        }
        
        if (includeInvoices && results[idx]) {
          (results[idx].data || []).forEach((r: any) => {
            allRows.push({
              date: new Date(r.date_created).toLocaleDateString(),
              type: 'Invoice',
              reference: r.invoice_number,
              client: r.client?.name || '-',
              status: r.status,
              amount: parseFloat(r.grand_total || 0)
            })
          })
          idx++
        }
        
        if (includeCashSales && results[idx]) {
          (results[idx].data || []).forEach((r: any) => {
            allRows.push({
              date: new Date(r.date_created).toLocaleDateString(),
              type: 'Cash Sale',
              reference: r.sale_number,
              client: r.client?.name || '-',
              status: r.status || 'completed',
              amount: parseFloat(r.grand_total || 0)
            })
          })
        }
        
        rows = allRows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        
        columns = [
          { key: 'date', label: 'Date' },
          { key: 'type', label: 'Type' },
          { key: 'reference', label: 'Reference #' },
          { key: 'client', label: 'Client' },
          { key: 'status', label: 'Status' },
          { key: 'amount', label: 'Amount', align: 'right' }
        ]
      } else if (type === 'inventory') {
        let query = supabase.from('stock_items').select('*').order('name')
        
        if (inventoryCategory) {
          query = query.eq('category', inventoryCategory)
        }
        
        if (!includeZeroStock) {
          query = query.gt('quantity', 0)
        }
        
        const { data } = await query
        
        let filteredData = data || []
        
        if (inventoryReportType === 'low_stock') {
          filteredData = filteredData.filter(i => (i.quantity || 0) < (i.reorder_level || 10) && (i.quantity || 0) > 0)
        } else if (inventoryReportType === 'out_of_stock') {
          filteredData = filteredData.filter(i => (i.quantity || 0) <= 0)
        }
        
        rows = filteredData.map((i: any) => ({
          name: i.name,
          category: i.category,
          quantity: i.quantity || 0,
          unit: i.unit,
          unit_price: parseFloat(i.unit_price || 0),
          reorder_level: i.reorder_level || 0,
          value: (i.quantity || 0) * parseFloat(i.unit_price || 0),
          status: (i.quantity || 0) <= 0 ? 'Out of Stock' : 
                  (i.quantity || 0) < (i.reorder_level || 10) ? 'Low Stock' : 'In Stock'
        }))
        
        columns = [
          { key: 'name', label: 'Item Name' },
          { key: 'category', label: 'Category' },
          { key: 'quantity', label: 'Qty', align: 'right' },
          { key: 'unit', label: 'Unit' },
          { key: 'unit_price', label: 'Unit Price', align: 'right' },
          { key: 'value', label: 'Total Value', align: 'right' },
          { key: 'status', label: 'Status' }
        ]
      } else if (type === 'clients') {
        let query = supabase.from('registered_entities')
          .select('*')
          .eq('type', 'client')
          .eq('status', 'active')
          .order('name')
        
        if (clientFilter) {
          query = query.eq('id', parseInt(clientFilter))
        }
        
        const { data: clients } = await query
        
        // Get totals for each client
        const clientData = await Promise.all((clients || []).map(async (client: any) => {
          const [quotations, orders, payments, expenses] = await Promise.all([
            supabase.from('quotations').select('grand_total').eq('client_id', client.id),
            supabase.from('sales_orders').select('grand_total').eq('client_id', client.id),
            supabase.from('payments').select('amount').eq('client_id', client.id).eq('status', 'completed'),
            supabase.from('expenses').select('amount').eq('client_id', client.id).eq('expense_type', 'client')
          ])
          
          const totalQuoted = (quotations.data || []).reduce((s, q) => s + parseFloat(q.grand_total || 0), 0)
          const totalOrders = (orders.data || []).reduce((s, o) => s + parseFloat(o.grand_total || 0), 0)
          const totalPaid = (payments.data || []).reduce((s, p) => s + parseFloat(p.amount || 0), 0)
          const totalExpenses = (expenses.data || []).reduce((s, e) => s + parseFloat(e.amount || 0), 0)
          
          return {
            name: client.name,
            phone: client.phone || '-',
            location: client.location || '-',
            total_quoted: totalQuoted,
            total_orders: totalOrders,
            total_paid: totalPaid,
            client_expenses: totalExpenses,
            balance: totalOrders - totalPaid
          }
        }))
        
        rows = clientData
        
        columns = [
          { key: 'name', label: 'Client Name' },
          { key: 'phone', label: 'Phone' },
          { key: 'location', label: 'Location' },
          { key: 'total_quoted', label: 'Quoted', align: 'right' },
          { key: 'total_orders', label: 'Orders', align: 'right' },
          { key: 'total_paid', label: 'Paid', align: 'right' },
          { key: 'client_expenses', label: 'Expenses', align: 'right' },
          { key: 'balance', label: 'Balance', align: 'right' }
        ]
      }
      
      setPreviewData(rows)
      setPreviewColumns(columns)
    } catch (error) {
      console.error('Error generating preview:', error)
    } finally {
      setLoading(false)
    }
  }

  const runAndExport = async () => {
    if (!previewData) {
      await generatePreview()
    }
    
    const { start, end } = computeDateRange(datePreset, startDate, endDate)
    const filenameBase = `${type}_report_${new Date().toISOString().slice(0,10)}`
    
    if (format === 'pdf') {
      try {
        const { generateDynamicTemplateWithPagination } = await import('@/lib/report-pdf-templates')
        
        const customTableHeaders = previewColumns.map(c => c.label)
        let templateType: any = type === 'sales' ? 'salesOrders' : 
                                type === 'expenses' ? 'expenses' : 
                                type === 'inventory' ? 'stock' : 
                                type === 'clients' ? 'clients' : 'payments'
        
        const template = generateDynamicTemplateWithPagination(
          (previewData || []).length, 
          customTableHeaders, 
          templateType
        )
        
        async function fetchImageAsBase64(url: string): Promise<string> {
          const response = await fetch(url)
          const blob = await response.blob()
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
        }
        
        const watermarkLogoBase64 = await fetchImageAsBase64('/logowatermark.png')
        const companyLogoBase64 = await fetchImageAsBase64('/logowatermark.png')
        
        const reportTitle = type === 'financial' ? 
          financialReportType === 'profitLoss' ? 'PROFIT & LOSS STATEMENT' :
          financialReportType === 'balanceSheet' ? 'BALANCE SHEET' :
          financialReportType === 'cashFlow' ? 'CASH FLOW STATEMENT' :
          financialReportType === 'cashBook' ? 'THREE-COLUMN CASH BOOK' :
          financialReportType === 'incomeStatement' ? 'INCOME STATEMENT' :
          'FINANCIAL SUMMARY'
          : `${type.toUpperCase()} REPORT`
        
        const inputs = [{
          logo: companyLogoBase64,
          companyName: "CABINET MASTER STYLES & FINISHES",
          companyLocation: "Location: Ruiru Eastern By-Pass",
          companyPhone: "Tel: +254729554475",
          companyEmail: "Email: cabinetmasterstyles@gmail.com",
          reportTitle,
          reportDateLabel: 'Generated:',
          reportDateValue: new Date().toLocaleDateString(),
          reportPeriodLabel: 'Period:',
          reportPeriodValue: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
          reportTypeLabel: 'Type:',
          reportTypeValue: `${type.charAt(0).toUpperCase() + type.slice(1)} Analysis`,
          
          ...(previewData || []).map((row, index) => {
            const rowData: any = {}
            previewColumns.forEach((col, colIdx) => {
              const value = row[col.key]
              rowData[`col${colIdx}_${index}`] = typeof value === 'number' ? 
                (col.align === 'right' ? formatCurrency(value) : value.toString()) : 
                (value || '-')
            })
            return rowData
          }).reduce((acc, item) => ({ ...acc, ...item }), {}),
          
          summaryTitle: 'Summary:',
          summaryContent: `Total Records: ${(previewData || []).length}`,
          totalLabel: 'Total:',
          totalValue: formatCurrency(
            (previewData || []).reduce((sum, row) => {
              const amountKey = previewColumns.find(c => c.key === 'amount' || c.key === 'value' || c.key === 'total')?.key
              return sum + (amountKey ? (parseFloat(row[amountKey]) || 0) : 0)
            }, 0)
          ),
          preparedByLabel: `Prepared by: System`,
          approvedByLabel: `Approved by: _______________`,
          
          ...Array.from({ length: Math.ceil((previewData || []).length / 15) + 1 }, (_, i) => ({
            [`watermarkLogo_${i}`]: watermarkLogoBase64
          })).reduce((acc, item) => ({ ...acc, ...item }), {}),
        }]
        
        const { generate } = await import('@pdfme/generator')
        const { text, rectangle, line, image } = await import('@pdfme/schemas')
        const pdf = await generate({ template, inputs, plugins: { text, rectangle, line, image } as any })
        
        const blob = new Blob([new Uint8Array(pdf.buffer)], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${filenameBase}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
      } catch (pdfError) {
        console.error('PDF generation failed:', pdfError)
        // Fallback to print
        handlePrint()
      }
    } else {
      exportToCSV(filenameBase, previewColumns, previewData || [])
    }
    
    onClose()
  }

  const handlePrint = () => {
    if (!previewData || previewData.length === 0) {
      generatePreview().then(() => {
        setTimeout(() => printReport(), 500)
      })
    } else {
      printReport()
    }
  }
  
  const printReport = () => {
    const { start, end } = computeDateRange(datePreset, startDate, endDate)
    const total = (previewData || []).reduce((sum, row) => {
      const amountKey = previewColumns.find(c => c.key === 'amount' || c.key === 'value' || c.key === 'total')?.key
      return sum + (amountKey ? (parseFloat(row[amountKey]) || 0) : 0)
    }, 0)
    
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #333;">CABINET MASTER STYLES & FINISHES</h2>
          <p style="margin: 5px 0; color: #666;">Ruiru Eastern By-Pass | Tel: +254729554475</p>
        </div>
        <h3 style="text-align: center; color: #444; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
          ${type.toUpperCase()} REPORT
        </h3>
        <p style="text-align: center; color: #666;">Period: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background: #f8f9fa;">
              ${previewColumns.map(c => `<th style="border: 1px solid #ddd; padding: 10px; text-align: ${c.align || 'left'};">${c.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${(previewData || []).map((row, idx) => `
              <tr style="background: ${idx % 2 === 0 ? '#fff' : '#f8f9fa'};">
                ${previewColumns.map(c => `
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: ${c.align || 'left'};">
                    ${typeof row[c.key] === 'number' ? formatCurrency(row[c.key]) : (row[c.key] || '-')}
                  </td>
                `).join('')}
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #e9ecef; font-weight: bold;">
              ${previewColumns.map(c => `
                <td style="border: 1px solid #ddd; padding: 10px; text-align: ${c.align || 'left'};">
                  ${(c.key === 'amount' || c.key === 'value' || c.key === 'total') ? formatCurrency(total) : ''}
                </td>
              `).join('')}
            </tr>
          </tfoot>
        </table>
        <div style="margin-top: 30px; display: flex; justify-content: space-between;">
          <div>
            <p style="margin: 5px 0;"><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p style="margin: 5px 0;"><strong>Total Records:</strong> ${(previewData || []).length}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 5px 0;"><strong>Prepared by:</strong> _______________</p>
            <p style="margin: 5px 0;"><strong>Approved by:</strong> _______________</p>
          </div>
        </div>
      </div>
    `
    printTableHtml(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`, html)
  }

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content" style={{ 
          borderRadius: '24px', 
          border: 'none', 
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
        }}>
          {/* Header with gradient background */}
          <div className="modal-header border-0" style={{ 
            background: headerGradients[type],
            color: '#ffffff',
            borderRadius: '24px 24px 0 0',
            padding: '1.5rem 2rem'
          }}>
            <div className="d-flex align-items-center gap-3">
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.2)', 
                borderRadius: '12px', 
                width: '48px', 
                height: '48px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                {reportIcons[type]}
              </div>
              <h5 className="modal-title mb-0 fw-bold fs-4">{reportTitles[type]}</h5>
            </div>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
              style={{ fontSize: '1.2rem' }}
            />
          </div>

          {/* Modal Body */}
          <div className="modal-body p-4" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <form onSubmit={(e) => { e.preventDefault(); runAndExport(); }}>
              
              {/* Date Range Selection */}
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label fw-semibold text-dark">Date Range</label>
                  <select 
                    className="form-select border-0 shadow-sm" 
                    value={datePreset} 
                    onChange={e => setDatePreset(e.target.value as DateRangeKey)}
                    style={{ borderRadius: '16px', height: '45px' }}
                  >
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">This Week</option>
                    <option value="lastWeek">Last Week</option>
                    <option value="month">This Month</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="quarter">This Quarter</option>
                    <option value="year">This Year</option>
                    <option value="all">All Time</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
                
                {datePreset === 'custom' && (
                  <>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold text-dark">Start Date</label>
                      <input 
                        type="date" 
                        className="form-control border-0 shadow-sm" 
                        value={startDate} 
                        onChange={e => setStartDate(e.target.value)}
                        style={{ borderRadius: '16px', height: '45px' }}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold text-dark">End Date</label>
                      <input 
                        type="date" 
                        className="form-control border-0 shadow-sm" 
                        value={endDate} 
                        onChange={e => setEndDate(e.target.value)}
                        style={{ borderRadius: '16px', height: '45px' }}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Expenses Report Options */}
              {type === 'expenses' && (
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold text-dark">Group By</label>
                    <select 
                      className="form-select border-0 shadow-sm" 
                      value={expensesGroupBy} 
                      onChange={e => setExpensesGroupBy(e.target.value as any)}
                      style={{ borderRadius: '16px', height: '45px' }}
                    >
                      <option value="none">No Grouping (Detail)</option>
                      <option value="day">Day</option>
                      <option value="week">Week</option>
                      <option value="month">Month</option>
                      <option value="category">Category</option>
                      <option value="department">Department</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold text-dark">Expense Type</label>
                    <select 
                      className="form-select border-0 shadow-sm" 
                      value={expenseType} 
                      onChange={e => {
                        setExpenseType(e.target.value as any)
                        if (e.target.value !== 'client') {
                          setSelectedClientId('')
                          setClientSearchTerm('')
                        }
                      }}
                      style={{ borderRadius: '16px', height: '45px' }}
                    >
                      <option value="all">All Expenses</option>
                      <option value="company">Company Only</option>
                      <option value="client">Client Only</option>
                    </select>
                  </div>
                  
                  {/* Client Selection - Only shown when expense type is 'client' */}
                  {expenseType === 'client' && (
                    <div className="col-md-4">
                      <label className="form-label fw-semibold text-dark">Select Client</label>
                      <div className="position-relative">
                        <div className="input-group">
                          <span className="input-group-text border-0 bg-white" style={{ borderRadius: '16px 0 0 16px' }}>
                            <Search size={16} className="text-muted" />
                          </span>
                          <input 
                            type="text" 
                            className="form-control border-0 shadow-sm" 
                            value={clientSearchTerm}
                            onChange={e => {
                              setClientSearchTerm(e.target.value)
                              setShowClientDropdown(true)
                            }}
                            onFocus={() => setShowClientDropdown(true)}
                            placeholder="Search client..."
                            style={{ borderRadius: '0 16px 16px 0', height: '45px' }}
                          />
                        </div>
                        
                        {showClientDropdown && filteredClients.length > 0 && (
                          <div 
                            className="position-absolute w-100 bg-white shadow-lg rounded-3 mt-1" 
                            style={{ 
                              zIndex: 1000, 
                              maxHeight: '200px', 
                              overflowY: 'auto',
                              border: '1px solid #e9ecef'
                            }}
                          >
                            <div 
                              className="p-2 border-bottom text-muted small cursor-pointer hover-bg-light"
                              onClick={() => {
                                setSelectedClientId('')
                                setClientSearchTerm('')
                                setShowClientDropdown(false)
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              All Clients
                            </div>
                            {filteredClients.map(client => (
                              <div 
                                key={client.id}
                                className="p-2 border-bottom"
                                onClick={() => {
                                  setSelectedClientId(client.id.toString())
                                  setClientSearchTerm(client.name)
                                  setShowClientDropdown(false)
                                }}
                                style={{ 
                                  cursor: 'pointer',
                                  backgroundColor: selectedClientId === client.id.toString() ? '#f0f9ff' : 'transparent'
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = selectedClientId === client.id.toString() ? '#f0f9ff' : 'transparent'}
                              >
                                {client.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="col-md-4">
                    <label className="form-label fw-semibold text-dark">Category Filter</label>
                    <select 
                      className="form-select border-0 shadow-sm" 
                      value={selectedCategory} 
                      onChange={e => setSelectedCategory(e.target.value)}
                      style={{ borderRadius: '16px', height: '45px' }}
                    >
                      <option value="">All Categories</option>
                      {categoryOptions.map(cat => (
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Sales Report Options */}
              {type === 'sales' && (
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">Group By</label>
                    <select 
                      className="form-select border-0 shadow-sm" 
                      value={salesGroupBy} 
                      onChange={e => setSalesGroupBy(e.target.value as any)}
                      style={{ borderRadius: '16px', height: '45px' }}
                    >
                      <option value="none">No Grouping (Detail)</option>
                      <option value="day">Day</option>
                      <option value="week">Week</option>
                      <option value="month">Month</option>
                      <option value="client">Client</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">Include Documents</label>
                    <div className="d-flex flex-wrap gap-3 mt-2">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" checked={includeQuotations} onChange={e => setIncludeQuotations(e.target.checked)} />
                        <label className="form-check-label">Quotations</label>
                      </div>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" checked={includeSalesOrders} onChange={e => setIncludeSalesOrders(e.target.checked)} />
                        <label className="form-check-label">Sales Orders</label>
                      </div>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" checked={includeInvoices} onChange={e => setIncludeInvoices(e.target.checked)} />
                        <label className="form-check-label">Invoices</label>
                      </div>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" checked={includeCashSales} onChange={e => setIncludeCashSales(e.target.checked)} />
                        <label className="form-check-label">Cash Sales</label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Inventory Report Options */}
              {type === 'inventory' && (
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold text-dark">Report Type</label>
                    <select 
                      className="form-select border-0 shadow-sm" 
                      value={inventoryReportType} 
                      onChange={e => setInventoryReportType(e.target.value as any)}
                      style={{ borderRadius: '16px', height: '45px' }}
                    >
                      <option value="all">All Items</option>
                      <option value="low_stock">Low Stock Items</option>
                      <option value="out_of_stock">Out of Stock</option>
                      <option value="valuation">Inventory Valuation</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold text-dark">Category</label>
                    <input 
                      type="text" 
                      className="form-control border-0 shadow-sm" 
                      value={inventoryCategory} 
                      onChange={e => setInventoryCategory(e.target.value)}
                      placeholder="Filter by category..."
                      style={{ borderRadius: '16px', height: '45px' }}
                    />
                  </div>
                  <div className="col-md-4 d-flex align-items-end">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" checked={includeZeroStock} onChange={e => setIncludeZeroStock(e.target.checked)} />
                      <label className="form-check-label">Include Zero Stock Items</label>
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Report Options */}
              {type === 'financial' && (
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">Report Type</label>
                    <select 
                      className="form-select border-0 shadow-sm" 
                      value={financialReportType} 
                      onChange={e => setFinancialReportType(e.target.value as any)}
                      style={{ borderRadius: '16px', height: '45px' }}
                    >
                      <option value="summary">Financial Summary</option>
                      <option value="profitLoss">Profit & Loss Statement</option>
                      <option value="incomeStatement">Income Statement</option>
                      <option value="balanceSheet">Balance Sheet</option>
                      <option value="cashFlow">Cash Flow Statement</option>
                      <option value="cashBook">Three-Column Cash Book</option>
                      <option value="trialBalance">Trial Balance</option>
                    </select>
                  </div>
                  <div className="col-md-6 d-flex align-items-end gap-3">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" checked={showPercentages} onChange={e => setShowPercentages(e.target.checked)} />
                      <label className="form-check-label">Show Percentages</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" checked={includeComparisons} onChange={e => setIncludeComparisons(e.target.checked)} />
                      <label className="form-check-label">Period Comparison</label>
                    </div>
                  </div>
                </div>
              )}

              {/* Client Report Options */}
              {type === 'clients' && (
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">Report Type</label>
                    <select 
                      className="form-select border-0 shadow-sm" 
                      value={clientReportType} 
                      onChange={e => setClientReportType(e.target.value as any)}
                      style={{ borderRadius: '16px', height: '45px' }}
                    >
                      <option value="list">Client List with Totals</option>
                      <option value="statement">Client Statement</option>
                      <option value="aging">Aging Report</option>
                      <option value="activity">Activity Summary</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">Filter by Client</label>
                    <select 
                      className="form-select border-0 shadow-sm" 
                      value={clientFilter} 
                      onChange={e => setClientFilter(e.target.value)}
                      style={{ borderRadius: '16px', height: '45px' }}
                    >
                      <option value="">All Clients</option>
                      {clientOptions.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Output Format */}
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label fw-semibold text-dark">Output Format</label>
                  <select 
                    className="form-select border-0 shadow-sm" 
                    value={format} 
                    onChange={e => setFormat(e.target.value as any)}
                    style={{ borderRadius: '16px', height: '45px' }}
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="excel">Excel (CSV)</option>
                    <option value="csv">CSV File</option>
                  </select>
                </div>
              </div>

              {/* Preview Section */}
              {previewData && previewData.length > 0 && (
                <div className="mt-4">
                  <h6 className="fw-bold mb-3">Preview ({previewData.length} records)</h6>
                  <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <table className="table table-sm table-hover">
                      <thead className="table-light sticky-top">
                        <tr>
                          {previewColumns.map(col => (
                            <th key={col.key} className={col.align === 'right' ? 'text-end' : ''}>{col.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.slice(0, 20).map((row, idx) => (
                          <tr key={idx}>
                            {previewColumns.map(col => (
                              <td key={col.key} className={col.align === 'right' ? 'text-end' : ''}>
                                {typeof row[col.key] === 'number' ? 
                                  (col.align === 'right' ? formatCurrency(row[col.key]) : row[col.key]) : 
                                  (row[col.key] || '-')}
                              </td>
                            ))}
                          </tr>
                        ))}
                        {previewData.length > 20 && (
                          <tr>
                            <td colSpan={previewColumns.length} className="text-center text-muted">
                              ... and {previewData.length - 20} more records
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Footer with all buttons */}
          <div className="modal-footer border-0 p-4" style={{ background: 'rgba(248, 250, 252, 0.8)' }}>
            <div className="d-flex justify-content-between w-100">
              <button 
                type="button" 
                className="btn btn-outline-secondary border-0 shadow-sm" 
                onClick={onClose}
                style={{ borderRadius: '12px', height: '45px', padding: '0 1.5rem' }}
              >
                Close
              </button>
              
              <div className="d-flex gap-3">
                <button 
                  type="button" 
                  className="btn btn-outline-primary border-0 shadow-sm" 
                  onClick={generatePreview}
                  disabled={loading}
                  style={{ borderRadius: '12px', height: '45px', padding: '0 1.5rem' }}
                >
                  <Eye size={16} className="me-2"/>
                  Preview
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline-secondary border-0 shadow-sm" 
                  onClick={handlePrint}
                  disabled={loading}
                  style={{ borderRadius: '12px', height: '45px', padding: '0 1.5rem' }}
                >
                  <Printer size={16} className="me-2"/>
                  Print
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary border-0 shadow-sm" 
                  onClick={runAndExport}
                  disabled={loading}
                  style={{ borderRadius: '12px', height: '45px', padding: '0 1.5rem' }}
                >
                  {loading ? (
                    <>
                      <div className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download size={16} className="me-2"/>
                      Generate Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
