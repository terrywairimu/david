"use client"

import React, { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { Calendar, Download, Printer, X, BarChart3, TrendingUp, Users, Package, Wallet, Settings, FileText, Search, Eye } from "lucide-react"
import { exportToCSV, printTableHtml, TableColumn } from "./ReportUtils"
import { useGlobalProgress } from "@/components/GlobalProgressManager"
import { getNairobiDayBoundaries, getNairobiWeekBoundaries, getNairobiMonthBoundaries } from "@/lib/timezone"
import { generateReportPDF, REPORT_COLUMNS, ReportData, ReportColumn } from "@/lib/dynamic-report-pdf"

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

// Label style - white text for visibility on dark/gradient backgrounds
const labelStyle = { color: '#ffffff', fontWeight: 600 }

// Dropdown style with proper text color
const dropdownStyle = { 
  borderRadius: '12px', 
  height: '45px',
  backgroundColor: '#ffffff',
  color: '#333333',
  border: '1px solid #e5e7eb'
}

// Client dropdown item style
const dropdownItemStyle = {
  padding: '10px 12px',
  cursor: 'pointer',
  borderBottom: '1px solid #f3f4f6',
  color: '#333333',
  backgroundColor: '#ffffff'
}

const dropdownItemHoverStyle = {
  ...dropdownItemStyle,
  backgroundColor: '#f0f9ff'
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
      startDate = new Date(2020, 0, 1)
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
  const { startDownload, completeDownload, setError } = useGlobalProgress()
  const [loading, setLoading] = useState(false)
  const [previewData, setPreviewData] = useState<any[] | null>(null)
  const [previewColumns, setPreviewColumns] = useState<ReportColumn[]>([])
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
  const [salesFilterType, setSalesFilterType] = useState<'all'|'specific'>('all')
  const [salesClientId, setSalesClientId] = useState<string>('')
  const [salesClientSearch, setSalesClientSearch] = useState('')
  const [showSalesClientDropdown, setShowSalesClientDropdown] = useState(false)
  
  // Expenses
  const [expensesGroupBy, setExpensesGroupBy] = useState<'none'|'day'|'week'|'month'|'category'|'department'>('none')
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
  const [financialFilterType, setFinancialFilterType] = useState<'all'|'company'|'specific'>('all')
  const [financialClientId, setFinancialClientId] = useState<string>('')
  const [financialClientSearch, setFinancialClientSearch] = useState('')
  const [showFinancialClientDropdown, setShowFinancialClientDropdown] = useState(false)
  const [includeComparisons, setIncludeComparisons] = useState(false)
  const [showPercentages, setShowPercentages] = useState(true)
  
  // Clients
  const [clientFilterType, setClientFilterType] = useState<'all'|'specific'>('all')
  const [clientFilter, setClientFilter] = useState<string>('')
  const [clientSearchFilter, setClientSearchFilter] = useState('')
  const [showClientFilterDropdown, setShowClientFilterDropdown] = useState(false)
  const [clientReportType, setClientReportType] = useState<'list'|'statement'|'aging'|'activity'>('list')
  
  // Custom
  const [includeSales, setIncludeSales] = useState(true)
  const [includeExpensesData, setIncludeExpensesData] = useState(true)
  const [includeInventoryData, setIncludeInventoryData] = useState(true)
  const [customGroupBy, setCustomGroupBy] = useState<'none'|'day'|'week'|'month'|'client'|'category'>('none')

  // Load client options for all report types
  useEffect(() => {
    if (isOpen) {
      supabase.from('registered_entities')
        .select('id, name')
        .eq('type', 'client')
        .eq('status', 'active')
        .order('name')
        .then(({ data }) => {
          setClientOptions((data || []).map(c => ({ id: c.id, name: c.name })))
        })
    }
  }, [isOpen])

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

  // Filter clients by search term for expenses
  const filteredClients = useMemo(() => {
    if (!clientSearchTerm) return clientOptions
    return clientOptions.filter(c => 
      c.name.toLowerCase().includes(clientSearchTerm.toLowerCase())
    )
  }, [clientOptions, clientSearchTerm])

  // Filter clients for sales
  const filteredSalesClients = useMemo(() => {
    if (!salesClientSearch) return clientOptions
    return clientOptions.filter(c => 
      c.name.toLowerCase().includes(salesClientSearch.toLowerCase())
    )
  }, [clientOptions, salesClientSearch])

  // Filter clients for financial
  const filteredFinancialClients = useMemo(() => {
    if (!financialClientSearch) return clientOptions
    return clientOptions.filter(c => 
      c.name.toLowerCase().includes(financialClientSearch.toLowerCase())
    )
  }, [clientOptions, financialClientSearch])

  // Filter clients for client reports
  const filteredClientFilterOptions = useMemo(() => {
    if (!clientSearchFilter) return clientOptions
    return clientOptions.filter(c => 
      c.name.toLowerCase().includes(clientSearchFilter.toLowerCase())
    )
  }, [clientOptions, clientSearchFilter])

  if (!isOpen) return null

  // Generate report data
  const generateReportData = async (): Promise<{ rows: any[], columns: ReportColumn[], title: string, totals?: Record<string, number> }> => {
    const { start, end } = computeDateRange(datePreset, startDate, endDate)
    let rows: any[] = []
    let columns: ReportColumn[] = []
    let title = ''
    let totals: Record<string, number> | undefined
    
    if (type === 'expenses') {
      title = expenseType === 'client' ? 'CLIENT EXPENSE REPORT' : 
              expenseType === 'company' ? 'COMPANY EXPENSE REPORT' : 'EXPENSE REPORT'
      
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
        const clientName = clientOptions.find(c => c.id.toString() === selectedClientId)?.name
        if (clientName) title = `EXPENSE REPORT - ${clientName.toUpperCase()}`
      }
      
      if (selectedCategory) {
        query = query.eq('category', selectedCategory)
      }
      
      const { data, error } = await query
      if (error) throw error
      
      rows = (data || []).map((exp: any) => ({
        date: new Date(exp.date_created).toLocaleDateString(),
        expense_number: exp.expense_number || '-',
        category: exp.category || '-',
        description: (exp.description || '-').substring(0, 40),
        expense_type: exp.expense_type || '-',
        client_name: exp.client?.name || '-',
        amount: parseFloat(exp.amount || 0)
      }))
      
      columns = REPORT_COLUMNS.expenses
      totals = { amount: rows.reduce((s, r) => s + r.amount, 0) }
      
    } else if (type === 'financial') {
      if (financialReportType === 'cashBook') {
        title = 'THREE-COLUMN CASH BOOK'
        
        const { data: transactions } = await supabase
          .from('account_transactions')
          .select('*')
          .gte('transaction_date', start.toISOString())
          .lte('transaction_date', end.toISOString())
          .order('transaction_date', { ascending: true })
        
        let runningBalance = 0
        let totalDebit = 0
        let totalCredit = 0
        
        rows = (transactions || []).map((t: any) => {
          const debit = t.transaction_type === 'in' ? parseFloat(t.amount) : 0
          const credit = t.transaction_type === 'out' ? parseFloat(t.amount) : 0
          runningBalance += debit - credit
          totalDebit += debit
          totalCredit += credit
          return {
            date: new Date(t.transaction_date).toLocaleDateString(),
            reference: t.transaction_number || '-',
            description: (t.description || '-').substring(0, 50),
            account: t.account_type || '-',
            debit: debit || null,
            credit: credit || null,
            balance: runningBalance
          }
        })
        
        columns = REPORT_COLUMNS.cashBook
        totals = { debit: totalDebit, credit: totalCredit, balance: runningBalance }
        
      } else if (financialReportType === 'profitLoss' || financialReportType === 'incomeStatement') {
        title = financialReportType === 'profitLoss' ? 'PROFIT & LOSS STATEMENT' : 'INCOME STATEMENT'
        
        // Build queries based on filter type
        let salesQuery = supabase.from('sales_orders').select('grand_total, client_id')
          .gte('date_created', start.toISOString())
          .lte('date_created', end.toISOString())
        let expensesQuery = supabase.from('expenses').select('amount, category, expense_type, client_id')
          .gte('date_created', start.toISOString())
          .lte('date_created', end.toISOString())
        let paymentsQuery = supabase.from('payments').select('amount, client_id')
          .eq('status', 'completed')
          .gte('date_paid', start.toISOString())
          .lte('date_paid', end.toISOString())
        
        // COGS Query - purchases for resale (client purchases = COGS)
        let cogsQuery: any = supabase.from('purchases').select('total_amount, client_id')
          .not('client_id', 'is', null) // Only client purchases count as COGS
          .gte('purchase_date', start.toISOString())
          .lte('purchase_date', end.toISOString())
        
        if (financialFilterType === 'company') {
          expensesQuery = expensesQuery.eq('expense_type', 'company')
          // Company filter = general/company purchases (no client attached)
          cogsQuery = supabase.from('purchases').select('total_amount, client_id').is('client_id', null)
            .gte('purchase_date', start.toISOString())
            .lte('purchase_date', end.toISOString())
        } else if (financialFilterType === 'specific' && financialClientId) {
          salesQuery = salesQuery.eq('client_id', parseInt(financialClientId))
          expensesQuery = expensesQuery.eq('client_id', parseInt(financialClientId))
          paymentsQuery = paymentsQuery.eq('client_id', parseInt(financialClientId))
          cogsQuery = cogsQuery.eq('client_id', parseInt(financialClientId))
          const clientName = clientOptions.find(c => c.id.toString() === financialClientId)?.name
          if (clientName) title = `${title} - ${clientName.toUpperCase()}`
        }
        
        const [salesRes, expensesRes, paymentsRes, cogsRes] = await Promise.all([
          salesQuery, expensesQuery, paymentsQuery, cogsQuery
        ])
        
        const totalRevenue = (salesRes.data || []).reduce((s, r) => s + parseFloat(r.grand_total || 0), 0)
        const totalPayments = (paymentsRes.data || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0)
        const totalCOGS = (cogsRes.data || []).reduce((s: number, r: any) => s + parseFloat(r.total_amount || 0), 0)
        
        const expensesByCategory = (expensesRes.data || []).reduce((acc: any, exp: any) => {
          const cat = exp.category || 'Other'
          acc[cat] = (acc[cat] || 0) + parseFloat(exp.amount || 0)
          return acc
        }, {})
        
        const totalExpenses = Object.values(expensesByCategory).reduce((s: number, v: any) => s + v, 0)
        const grossProfit = totalRevenue - totalCOGS
        const operatingProfit = grossProfit - totalExpenses
        const netIncome = totalPayments - totalCOGS - totalExpenses
        
        rows = [
          { account: 'REVENUE', type: '', amount: null, percentage: '' },
          { account: 'Sales Revenue', type: 'Revenue', amount: totalRevenue, percentage: '100.0%' },
          { account: 'Payments Received', type: 'Revenue', amount: totalPayments, percentage: showPercentages && totalRevenue > 0 ? `${((totalPayments/totalRevenue)*100).toFixed(1)}%` : '' },
          { account: '', type: '', amount: null, percentage: '' },
          { account: 'COST OF GOODS SOLD (COGS)', type: '', amount: null, percentage: '' },
          { account: 'Purchases for Resale', type: 'COGS', amount: totalCOGS, percentage: showPercentages && totalRevenue > 0 ? `${((totalCOGS/totalRevenue)*100).toFixed(1)}%` : '' },
          { account: '', type: '', amount: null, percentage: '' },
          { account: 'GROSS PROFIT', type: 'Subtotal', amount: grossProfit, percentage: showPercentages && totalRevenue > 0 ? `${((grossProfit/totalRevenue)*100).toFixed(1)}%` : '' },
          { account: '', type: '', amount: null, percentage: '' },
          { account: 'OPERATING EXPENSES', type: '', amount: null, percentage: '' },
          ...Object.entries(expensesByCategory).map(([cat, amt]: [string, any]) => ({
            account: `  ${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
            type: 'Expense',
            amount: amt,
            percentage: showPercentages && totalRevenue > 0 ? `${((amt/totalRevenue)*100).toFixed(1)}%` : ''
          })),
          { account: 'Total Operating Expenses', type: 'Subtotal', amount: totalExpenses, percentage: showPercentages && totalRevenue > 0 ? `${((totalExpenses/totalRevenue)*100).toFixed(1)}%` : '' },
          { account: '', type: '', amount: null, percentage: '' },
          { account: 'OPERATING PROFIT', type: 'Total', amount: operatingProfit, percentage: showPercentages && totalRevenue > 0 ? `${((operatingProfit/totalRevenue)*100).toFixed(1)}%` : '' },
          { account: 'NET INCOME', type: 'GrandTotal', amount: netIncome, percentage: showPercentages && totalRevenue > 0 ? `${((netIncome/totalRevenue)*100).toFixed(1)}%` : '' }
        ]
        
        columns = REPORT_COLUMNS.financial
        
      } else if (financialReportType === 'balanceSheet') {
        title = 'BALANCE SHEET'
        
        const { data: balances } = await supabase.from('account_balances').select('*')
        const { data: invoices } = await supabase.from('invoices').select('grand_total, paid_amount').in('status', ['pending', 'overdue'])
        const { data: inventory } = await supabase.from('stock_items').select('quantity, unit_price')
        
        const cashBalance = parseFloat(balances?.find(b => b.account_type === 'cash')?.current_balance || 0)
        const bankBalance = parseFloat(balances?.find(b => b.account_type === 'cooperative_bank')?.current_balance || 0)
        const receivables = (invoices || []).reduce((s, i) => s + (parseFloat(i.grand_total || 0) - parseFloat(i.paid_amount || 0)), 0)
        const inventoryValue = (inventory || []).reduce((s, i) => s + ((i.quantity || 0) * parseFloat(i.unit_price || 0)), 0)
        const totalAssets = cashBalance + bankBalance + receivables + inventoryValue
        
        rows = [
          { account: 'ASSETS', type: '', amount: null, percentage: '' },
          { account: 'Current Assets', type: '', amount: null, percentage: '' },
          { account: '  Cash in Hand', type: 'Asset', amount: cashBalance, percentage: '' },
          { account: '  Bank (Cooperative)', type: 'Asset', amount: bankBalance, percentage: '' },
          { account: '  Accounts Receivable', type: 'Asset', amount: receivables, percentage: '' },
          { account: '  Inventory', type: 'Asset', amount: inventoryValue, percentage: '' },
          { account: '', type: '', amount: null, percentage: '' },
          { account: 'Total Current Assets', type: 'Subtotal', amount: totalAssets, percentage: '' },
          { account: '', type: '', amount: null, percentage: '' },
          { account: 'TOTAL ASSETS', type: 'GrandTotal', amount: totalAssets, percentage: '' }
        ]
        
        columns = REPORT_COLUMNS.financial
        
      } else if (financialReportType === 'cashFlow') {
        title = 'CASH FLOW STATEMENT'
        
        const [paymentsIn, expenses] = await Promise.all([
          supabase.from('payments').select('amount')
            .eq('status', 'completed')
            .gte('date_paid', start.toISOString())
            .lte('date_paid', end.toISOString()),
          supabase.from('expenses').select('amount')
            .gte('date_created', start.toISOString())
            .lte('date_created', end.toISOString())
        ])
        
        const totalInflows = (paymentsIn.data || []).reduce((s, p) => s + parseFloat(p.amount || 0), 0)
        const totalOutflows = (expenses.data || []).reduce((s, e) => s + parseFloat(e.amount || 0), 0)
        const netCashFlow = totalInflows - totalOutflows
        
        rows = [
          { account: 'OPERATING ACTIVITIES', type: '', amount: null, percentage: '' },
          { account: 'Cash Receipts from Customers', type: 'Inflow', amount: totalInflows, percentage: '' },
          { account: 'Cash Paid for Expenses', type: 'Outflow', amount: -totalOutflows, percentage: '' },
          { account: '', type: '', amount: null, percentage: '' },
          { account: 'Net Cash from Operations', type: 'Subtotal', amount: netCashFlow, percentage: '' },
          { account: '', type: '', amount: null, percentage: '' },
          { account: 'NET CHANGE IN CASH', type: 'GrandTotal', amount: netCashFlow, percentage: '' }
        ]
        
        columns = REPORT_COLUMNS.financial
        
      } else {
        // Financial Summary
        title = 'FINANCIAL SUMMARY'
        if (financialFilterType === 'specific' && financialClientId) {
          const clientName = clientOptions.find(c => c.id.toString() === financialClientId)?.name
          if (clientName) title = `FINANCIAL SUMMARY - ${clientName.toUpperCase()}`
        }
        
        let salesQuery = supabase.from('sales_orders').select('grand_total, client_id')
        let expensesQuery = supabase.from('expenses').select('amount')
        let paymentsQuery = supabase.from('payments').select('amount').eq('status', 'completed')
        
        // COGS Query - purchases for resale (client purchases)
        let cogsQuery: any = supabase.from('purchases').select('total_amount, client_id')
          .not('client_id', 'is', null)
        
        if (financialFilterType === 'company') {
          expensesQuery = expensesQuery.eq('expense_type', 'company')
          cogsQuery = supabase.from('purchases').select('total_amount, client_id').is('client_id', null)
        } else if (financialFilterType === 'specific' && financialClientId) {
          salesQuery = salesQuery.eq('client_id', parseInt(financialClientId))
          expensesQuery = expensesQuery.eq('client_id', parseInt(financialClientId))
          paymentsQuery = paymentsQuery.eq('client_id', parseInt(financialClientId))
          cogsQuery = cogsQuery.eq('client_id', parseInt(financialClientId))
        }
        
        const [salesRes, expensesRes, paymentsRes, balancesRes, cogsRes] = await Promise.all([
          salesQuery,
          expensesQuery,
          paymentsQuery,
          supabase.from('account_balances').select('*'),
          cogsQuery
        ])
        
        const totalSales = (salesRes.data || []).reduce((s, r) => s + parseFloat(r.grand_total || 0), 0)
        const totalExpenses = (expensesRes.data || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0)
        const totalPayments = (paymentsRes.data || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0)
        const totalCOGS = (cogsRes.data || []).reduce((s: number, r: any) => s + parseFloat(r.total_amount || 0), 0)
        const cashBalance = parseFloat(balancesRes.data?.find(b => b.account_type === 'cash')?.current_balance || 0)
        const bankBalance = parseFloat(balancesRes.data?.find(b => b.account_type === 'cooperative_bank')?.current_balance || 0)
        
        const grossProfit = totalSales - totalCOGS
        const netProfit = grossProfit - totalExpenses
        
        rows = [
          { account: 'Total Sales (Revenue)', type: 'Revenue', amount: totalSales, percentage: '' },
          { account: 'Total Payments Received', type: 'Revenue', amount: totalPayments, percentage: '' },
          { account: 'Cost of Goods Sold (COGS)', type: 'COGS', amount: totalCOGS, percentage: '' },
          { account: 'Gross Profit', type: 'Subtotal', amount: grossProfit, percentage: '' },
          { account: 'Operating Expenses', type: 'Expense', amount: totalExpenses, percentage: '' },
          { account: 'Net Profit', type: 'Total', amount: netProfit, percentage: '' },
          { account: '', type: '', amount: null, percentage: '' },
          { account: 'Cash Balance', type: 'Asset', amount: cashBalance, percentage: '' },
          { account: 'Bank Balance', type: 'Asset', amount: bankBalance, percentage: '' },
          { account: 'Total Liquid Assets', type: 'GrandTotal', amount: cashBalance + bankBalance, percentage: '' }
        ]
        
        columns = REPORT_COLUMNS.financial
      }
      
    } else if (type === 'sales') {
      title = 'SALES REPORT'
      if (salesFilterType === 'specific' && salesClientId) {
        const clientName = clientOptions.find(c => c.id.toString() === salesClientId)?.name
        if (clientName) title = `SALES REPORT - ${clientName.toUpperCase()}`
      }
      
      const allRows: any[] = []
      
      if (includeQuotations) {
        let query = supabase.from('quotations')
          .select('quotation_number, date_created, grand_total, status, client_id, client:registered_entities(name)')
          .gte('date_created', start.toISOString())
          .lte('date_created', end.toISOString())
        
        if (salesFilterType === 'specific' && salesClientId) {
          query = query.eq('client_id', parseInt(salesClientId))
        }
        
        const { data } = await query
        ;(data || []).forEach((r: any) => allRows.push({
          date: new Date(r.date_created).toLocaleDateString(),
          type: 'Quotation',
          reference: r.quotation_number || '-',
          client: r.client?.name || '-',
          status: r.status || '-',
          amount: parseFloat(r.grand_total || 0)
        }))
      }
      
      if (includeSalesOrders) {
        let query = supabase.from('sales_orders')
          .select('order_number, date_created, grand_total, status, client_id, client:registered_entities(name)')
          .gte('date_created', start.toISOString())
          .lte('date_created', end.toISOString())
        
        if (salesFilterType === 'specific' && salesClientId) {
          query = query.eq('client_id', parseInt(salesClientId))
        }
        
        const { data } = await query
        ;(data || []).forEach((r: any) => allRows.push({
          date: new Date(r.date_created).toLocaleDateString(),
          type: 'Sales Order',
          reference: r.order_number || '-',
          client: r.client?.name || '-',
          status: r.status || '-',
          amount: parseFloat(r.grand_total || 0)
        }))
      }
      
      if (includeInvoices) {
        let query = supabase.from('invoices')
          .select('invoice_number, date_created, grand_total, status, client_id, client:registered_entities(name)')
          .gte('date_created', start.toISOString())
          .lte('date_created', end.toISOString())
        
        if (salesFilterType === 'specific' && salesClientId) {
          query = query.eq('client_id', parseInt(salesClientId))
        }
        
        const { data } = await query
        ;(data || []).forEach((r: any) => allRows.push({
          date: new Date(r.date_created).toLocaleDateString(),
          type: 'Invoice',
          reference: r.invoice_number || '-',
          client: r.client?.name || '-',
          status: r.status || '-',
          amount: parseFloat(r.grand_total || 0)
        }))
      }
      
      if (includeCashSales) {
        let query = supabase.from('cash_sales')
          .select('sale_number, date_created, grand_total, status, client_id, client:registered_entities(name)')
          .gte('date_created', start.toISOString())
          .lte('date_created', end.toISOString())
        
        if (salesFilterType === 'specific' && salesClientId) {
          query = query.eq('client_id', parseInt(salesClientId))
        }
        
        const { data } = await query
        ;(data || []).forEach((r: any) => allRows.push({
          date: new Date(r.date_created).toLocaleDateString(),
          type: 'Cash Sale',
          reference: r.sale_number || '-',
          client: r.client?.name || '-',
          status: r.status || 'completed',
          amount: parseFloat(r.grand_total || 0)
        }))
      }
      
      rows = allRows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      columns = REPORT_COLUMNS.sales
      totals = { amount: rows.reduce((s, r) => s + r.amount, 0) }
      
    } else if (type === 'inventory') {
      title = inventoryReportType === 'low_stock' ? 'LOW STOCK INVENTORY REPORT' :
              inventoryReportType === 'out_of_stock' ? 'OUT OF STOCK REPORT' : 'INVENTORY REPORT'
      
      let query = supabase.from('stock_items').select('*').order('name')
      
      if (inventoryCategory) query = query.eq('category', inventoryCategory)
      if (!includeZeroStock) query = query.gt('quantity', 0)
      
      const { data } = await query
      
      let filteredData = data || []
      if (inventoryReportType === 'low_stock') {
        filteredData = filteredData.filter(i => (i.quantity || 0) < (i.reorder_level || 10) && (i.quantity || 0) > 0)
      } else if (inventoryReportType === 'out_of_stock') {
        filteredData = filteredData.filter(i => (i.quantity || 0) <= 0)
      }
      
      rows = filteredData.map((i: any) => ({
        name: i.name || '-',
        category: i.category || '-',
        quantity: i.quantity || 0,
        unit: i.unit || '-',
        unit_price: parseFloat(i.unit_price || 0),
        value: (i.quantity || 0) * parseFloat(i.unit_price || 0),
        status: (i.quantity || 0) <= 0 ? 'Out of Stock' : (i.quantity || 0) < (i.reorder_level || 10) ? 'Low Stock' : 'In Stock'
      }))
      
      columns = REPORT_COLUMNS.inventory
      totals = { value: rows.reduce((s, r) => s + r.value, 0) }
      
    } else if (type === 'clients') {
      title = 'CLIENT REPORT'
      
      let query = supabase.from('registered_entities')
        .select('*')
        .eq('type', 'client')
        .eq('status', 'active')
        .order('name')
      
      if (clientFilterType === 'specific' && clientFilter) {
        query = query.eq('id', parseInt(clientFilter))
        const clientName = clientOptions.find(c => c.id.toString() === clientFilter)?.name
        if (clientName) title = `CLIENT REPORT - ${clientName.toUpperCase()}`
      }
      
      const { data: clients } = await query
      
      const clientData = await Promise.all((clients || []).map(async (client: any) => {
        const [orders, payments, expenses] = await Promise.all([
          supabase.from('sales_orders').select('grand_total').eq('client_id', client.id),
          supabase.from('payments').select('amount').eq('client_id', client.id).eq('status', 'completed'),
          supabase.from('expenses').select('amount').eq('client_id', client.id).eq('expense_type', 'client')
        ])
        
        const totalOrders = (orders.data || []).reduce((s, o) => s + parseFloat(o.grand_total || 0), 0)
        const totalPaid = (payments.data || []).reduce((s, p) => s + parseFloat(p.amount || 0), 0)
        const totalExpenses = (expenses.data || []).reduce((s, e) => s + parseFloat(e.amount || 0), 0)
        
        return {
          name: client.name || '-',
          phone: client.phone || '-',
          location: client.location || '-',
          total_orders: totalOrders,
          total_payments: totalPaid,
          total_expenses: totalExpenses,
          balance: totalOrders - totalPaid
        }
      }))
      
      rows = clientData
      columns = REPORT_COLUMNS.clients
      totals = {
        total_orders: rows.reduce((s, r) => s + r.total_orders, 0),
        total_payments: rows.reduce((s, r) => s + r.total_payments, 0),
        total_expenses: rows.reduce((s, r) => s + r.total_expenses, 0),
        balance: rows.reduce((s, r) => s + r.balance, 0)
      }
    }
    
    return { rows, columns, title, totals }
  }

  // Generate preview
  const generatePreview = async () => {
    setLoading(true)
    try {
      const { rows, columns, title, totals } = await generateReportData()
      setPreviewData(rows)
      setPreviewColumns(columns)
    } catch (error) {
      console.error('Error generating preview:', error)
    } finally {
      setLoading(false)
    }
  }

  // Generate and export PDF
  const runAndExport = async () => {
    setLoading(true)
    const { start, end } = computeDateRange(datePreset, startDate, endDate)
    
    try {
      // Generate report data
      const { rows, columns, title, totals } = await generateReportData()
      
      if (rows.length === 0) {
        alert('No data found for the selected criteria.')
        setLoading(false)
        return
      }
      
      const filenameBase = `${type}_report_${new Date().toISOString().slice(0,10)}`
      const fileType = format === 'pdf' ? 'pdf' as const : 'csv' as const
      startDownload(filenameBase, fileType)
      
      if (format === 'pdf') {
        // Determine orientation (landscape for cash book)
        const orientation = financialReportType === 'cashBook' ? 'landscape' : 'portrait'
        
        // Prepare report data
        const reportData: ReportData = {
          title,
          subtitle: type === 'expenses' && selectedClientId ? 
            clientOptions.find(c => c.id.toString() === selectedClientId)?.name : undefined,
          period: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
          generatedDate: new Date().toLocaleString(),
          columns,
          rows,
          totals,
          summary: `Total Records: ${rows.length}`
        }
        
        // Generate PDF
        await generateReportPDF(reportData, orientation, filenameBase)
        
      } else {
        // Export to CSV
        const tableColumns: TableColumn[] = columns.map(c => ({
          key: c.key,
          label: c.label,
          align: c.align
        }))
        exportToCSV(filenameBase, tableColumns, rows)
      }
      
      setTimeout(() => completeDownload(), 500)
      onClose()
    } catch (error) {
      console.error('Error generating report:', error)
      setError('Failed to generate report')
      alert('Failed to generate report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Print report
  const handlePrint = async () => {
    setLoading(true)
    try {
      const { rows, columns, title, totals } = await generateReportData()
      const { start, end } = computeDateRange(datePreset, startDate, endDate)
      
      // Determine if landscape (for cash book)
      const isLandscape = financialReportType === 'cashBook'
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            @page { size: ${isLandscape ? 'landscape' : 'portrait'}; margin: 10mm; }
            body { font-family: Arial, sans-serif; padding: 10px; font-size: 10px; }
            .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #B06A2B; padding-bottom: 10px; }
            .header h1 { color: #B06A2B; margin: 0; font-size: 18px; }
            .header p { margin: 3px 0; color: #666; font-size: 10px; }
            .report-title { text-align: center; background: #f0f0f0; padding: 8px; border-radius: 5px; margin: 10px 0; }
            .report-title h2 { margin: 0; color: #B06A2B; font-size: 14px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 9px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9px; }
            th { background: #e8e8e8; padding: 6px 4px; text-align: left; border: 1px solid #ddd; font-size: 9px; }
            td { padding: 5px 4px; border: 1px solid #ddd; }
            tr:nth-child(even) { background: #f9f9f9; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .total-row { background: #e8e8e8 !important; font-weight: bold; }
            .footer { margin-top: 20px; display: flex; justify-content: space-between; font-size: 9px; }
            .signature { border-top: 1px solid #333; width: 120px; text-align: center; margin-top: 30px; padding-top: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CABINET MASTER STYLES & FINISHES</h1>
            <p>Location: Ruiru Eastern By-Pass | Tel: +254729554475</p>
            <p>Email: cabinetmasterstyles@gmail.com</p>
          </div>
          
          <div class="report-title">
            <h2>${title}</h2>
          </div>
          
          <div class="info-row">
            <span>Period: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}</span>
            <span>Generated: ${new Date().toLocaleString()}</span>
          </div>
          
          <table>
            <thead>
              <tr>
                ${columns.map(c => `<th class="${c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : ''}">${c.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map((row, idx) => {
                const isHeaderRow = row.type === 'Header' || row.type === 'header'
                const isSubtotalRow = row.type === 'Subtotal' || row.type === 'subtotal' || row.type === 'GrandTotal'
                const isSpacerRow = row.type === 'Spacer' || row.type === 'spacer'
                
                if (isSpacerRow) return '<tr><td colspan="' + columns.length + '" style="height:5px;border:none;"></td></tr>'
                
                return `<tr class="${isHeaderRow ? 'total-row' : ''} ${isSubtotalRow ? 'total-row' : ''}">
                  ${columns.map(c => {
                    let value = row[c.key]
                    if (typeof value === 'number' && value !== null) {
                      value = c.key.includes('quantity') ? value : formatCurrency(value)
                    }
                    if (value === null || value === undefined) value = ''
                    return `<td class="${c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : ''}">${value}</td>`
                  }).join('')}
                </tr>`
              }).join('')}
            </tbody>
            ${totals ? `
              <tfoot>
                <tr class="total-row">
                  ${columns.map((c, idx) => {
                    if (idx === 0) return '<td><strong>TOTAL</strong></td>'
                    const totalVal = totals[c.key]
                    if (totalVal !== undefined) return `<td class="text-right"><strong>${formatCurrency(totalVal)}</strong></td>`
                    return '<td></td>'
                  }).join('')}
                </tr>
              </tfoot>
            ` : ''}
          </table>
          
          <div class="footer">
            <div>
              <p>Total Records: ${rows.length}</p>
            </div>
            <div style="display: flex; gap: 50px;">
              <div class="signature">Prepared by</div>
              <div class="signature">Approved by</div>
            </div>
          </div>
        </body>
        </html>
      `
      
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 500)
      }
    } finally {
      setLoading(false)
    }
  }

  // Client search dropdown component
  const ClientSearchDropdown = ({ 
    searchTerm, 
    setSearchTerm, 
    selectedId, 
    setSelectedId, 
    showDropdown, 
    setShowDropdown, 
    filteredList,
    placeholder = "Search client..."
  }: {
    searchTerm: string
    setSearchTerm: (v: string) => void
    selectedId: string
    setSelectedId: (v: string) => void
    showDropdown: boolean
    setShowDropdown: (v: boolean) => void
    filteredList: Array<{id: number, name: string}>
    placeholder?: string
  }) => (
    <div className="position-relative">
      <div className="input-group">
        <span className="input-group-text" style={{ borderRadius: '12px 0 0 12px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
          <Search size={16} style={{ color: '#6b7280' }} />
        </span>
        <input 
          type="text" 
          className="form-control" 
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value)
            setShowDropdown(true)
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          style={{ 
            borderRadius: '0 12px 12px 0', 
            height: '45px',
            backgroundColor: '#ffffff',
            color: '#333333',
            border: '1px solid #e5e7eb',
            borderLeft: 'none'
          }}
        />
      </div>
      
      {showDropdown && (
        <div 
          className="position-absolute w-100 shadow-lg rounded-3 mt-1" 
          style={{ 
            zIndex: 1000, 
            maxHeight: '200px', 
            overflowY: 'auto', 
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb'
          }}
        >
          <div 
            className="border-bottom"
            onClick={() => { setSelectedId(''); setSearchTerm(''); setShowDropdown(false) }}
            style={{ ...dropdownItemStyle, color: '#6b7280', fontSize: '0.875rem' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
          >
            All Clients
          </div>
          {filteredList.map(client => (
            <div 
              key={client.id}
              onClick={() => {
                setSelectedId(client.id.toString())
                setSearchTerm(client.name)
                setShowDropdown(false)
              }}
              style={{ 
                ...dropdownItemStyle, 
                backgroundColor: selectedId === client.id.toString() ? '#eff6ff' : '#ffffff',
                color: '#1f2937'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedId === client.id.toString() ? '#eff6ff' : '#ffffff'}
            >
              {client.name}
            </div>
          ))}
          {filteredList.length === 0 && (
            <div style={{ ...dropdownItemStyle, color: '#9ca3af', fontStyle: 'italic' }}>
              No clients found
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }} onClick={(e) => {
      // Close dropdowns when clicking outside
      if ((e.target as HTMLElement).classList.contains('modal')) {
        setShowClientDropdown(false)
        setShowSalesClientDropdown(false)
        setShowFinancialClientDropdown(false)
        setShowClientFilterDropdown(false)
      }
    }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content" style={{ 
          borderRadius: '24px', 
          border: 'none', 
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.98)',
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
          <div className="modal-body p-4" style={{ maxHeight: '60vh', overflowY: 'auto', backgroundColor: 'rgba(30, 41, 59, 0.95)' }}>
            {/* Date Range Selection */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="form-label fw-semibold" style={labelStyle}>Date Range</label>
                <select 
                  className="form-select" 
                  value={datePreset} 
                  onChange={e => setDatePreset(e.target.value as DateRangeKey)}
                  style={dropdownStyle}
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
                    <label className="form-label fw-semibold" style={labelStyle}>Start Date</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={startDate} 
                      onChange={e => setStartDate(e.target.value)}
                      style={dropdownStyle}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold" style={labelStyle}>End Date</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={endDate} 
                      onChange={e => setEndDate(e.target.value)}
                      style={dropdownStyle}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Expenses Report Options */}
            {type === 'expenses' && (
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label fw-semibold" style={labelStyle}>Group By</label>
                  <select 
                    className="form-select" 
                    value={expensesGroupBy} 
                    onChange={e => setExpensesGroupBy(e.target.value as any)}
                    style={dropdownStyle}
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
                  <label className="form-label fw-semibold" style={labelStyle}>Expense Type</label>
                  <select 
                    className="form-select" 
                    value={expenseType} 
                    onChange={e => {
                      setExpenseType(e.target.value as any)
                      if (e.target.value !== 'client') {
                        setSelectedClientId('')
                        setClientSearchTerm('')
                      }
                    }}
                    style={dropdownStyle}
                  >
                    <option value="all">All Expenses</option>
                    <option value="company">Company Only</option>
                    <option value="client">Client Only</option>
                  </select>
                </div>
                
                {/* Client Selection - Only shown when expense type is 'client' */}
                {expenseType === 'client' && (
                  <div className="col-md-4">
                    <label className="form-label fw-semibold" style={labelStyle}>Select Client</label>
                    <ClientSearchDropdown 
                      searchTerm={clientSearchTerm}
                      setSearchTerm={setClientSearchTerm}
                      selectedId={selectedClientId}
                      setSelectedId={setSelectedClientId}
                      showDropdown={showClientDropdown}
                      setShowDropdown={setShowClientDropdown}
                      filteredList={filteredClients}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Financial Report Options */}
            {type === 'financial' && (
              <>
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold" style={labelStyle}>Filter By</label>
                    <select 
                      className="form-select" 
                      value={financialFilterType} 
                      onChange={e => {
                        setFinancialFilterType(e.target.value as any)
                        if (e.target.value !== 'specific') {
                          setFinancialClientId('')
                          setFinancialClientSearch('')
                        }
                      }}
                      style={dropdownStyle}
                    >
                      <option value="all">All</option>
                      <option value="company">Company Only</option>
                      <option value="specific">Specific Client</option>
                    </select>
                  </div>
                  
                  {financialFilterType === 'specific' && (
                    <div className="col-md-4">
                      <label className="form-label fw-semibold" style={labelStyle}>Select Client</label>
                      <ClientSearchDropdown 
                        searchTerm={financialClientSearch}
                        setSearchTerm={setFinancialClientSearch}
                        selectedId={financialClientId}
                        setSelectedId={setFinancialClientId}
                        showDropdown={showFinancialClientDropdown}
                        setShowDropdown={setShowFinancialClientDropdown}
                        filteredList={filteredFinancialClients}
                      />
                    </div>
                  )}
                </div>
                
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" style={labelStyle}>Report Type</label>
                    <select 
                      className="form-select" 
                      value={financialReportType} 
                      onChange={e => setFinancialReportType(e.target.value as any)}
                      style={dropdownStyle}
                    >
                      <option value="summary">Financial Summary</option>
                      <option value="profitLoss">Profit & Loss Statement</option>
                      <option value="incomeStatement">Income Statement</option>
                      <option value="balanceSheet">Balance Sheet</option>
                      <option value="cashFlow">Cash Flow Statement</option>
                      <option value="cashBook">Three-Column Cash Book (Landscape)</option>
                    </select>
                  </div>
                  <div className="col-md-6 d-flex align-items-end gap-3">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" checked={showPercentages} onChange={e => setShowPercentages(e.target.checked)} id="showPercentages" />
                      <label className="form-check-label" htmlFor="showPercentages" style={{ color: '#ffffff' }}>Show Percentages</label>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Sales Report Options */}
            {type === 'sales' && (
              <>
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold" style={labelStyle}>Filter By</label>
                    <select 
                      className="form-select" 
                      value={salesFilterType} 
                      onChange={e => {
                        setSalesFilterType(e.target.value as any)
                        if (e.target.value !== 'specific') {
                          setSalesClientId('')
                          setSalesClientSearch('')
                        }
                      }}
                      style={dropdownStyle}
                    >
                      <option value="all">All Clients</option>
                      <option value="specific">Specific Client</option>
                    </select>
                  </div>
                  
                  {salesFilterType === 'specific' && (
                    <div className="col-md-4">
                      <label className="form-label fw-semibold" style={labelStyle}>Select Client</label>
                      <ClientSearchDropdown 
                        searchTerm={salesClientSearch}
                        setSearchTerm={setSalesClientSearch}
                        selectedId={salesClientId}
                        setSelectedId={setSalesClientId}
                        showDropdown={showSalesClientDropdown}
                        setShowDropdown={setShowSalesClientDropdown}
                        filteredList={filteredSalesClients}
                      />
                    </div>
                  )}
                </div>
                
                <div className="row g-3 mb-4">
                  <div className="col-md-12">
                    <label className="form-label fw-semibold" style={labelStyle}>Include Documents</label>
                    <div className="d-flex flex-wrap gap-3 mt-2">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" checked={includeQuotations} onChange={e => setIncludeQuotations(e.target.checked)} id="includeQuotations" />
                        <label className="form-check-label" htmlFor="includeQuotations" style={{ color: '#ffffff' }}>Quotations</label>
                      </div>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" checked={includeSalesOrders} onChange={e => setIncludeSalesOrders(e.target.checked)} id="includeSalesOrders" />
                        <label className="form-check-label" htmlFor="includeSalesOrders" style={{ color: '#ffffff' }}>Sales Orders</label>
                      </div>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" checked={includeInvoices} onChange={e => setIncludeInvoices(e.target.checked)} id="includeInvoices" />
                        <label className="form-check-label" htmlFor="includeInvoices" style={{ color: '#ffffff' }}>Invoices</label>
                      </div>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" checked={includeCashSales} onChange={e => setIncludeCashSales(e.target.checked)} id="includeCashSales" />
                        <label className="form-check-label" htmlFor="includeCashSales" style={{ color: '#ffffff' }}>Cash Sales</label>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Inventory Report Options */}
            {type === 'inventory' && (
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label fw-semibold" style={labelStyle}>Report Type</label>
                  <select 
                    className="form-select" 
                    value={inventoryReportType} 
                    onChange={e => setInventoryReportType(e.target.value as any)}
                    style={dropdownStyle}
                  >
                    <option value="all">All Items</option>
                    <option value="low_stock">Low Stock Items</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
                <div className="col-md-4 d-flex align-items-end">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" checked={includeZeroStock} onChange={e => setIncludeZeroStock(e.target.checked)} id="includeZeroStock" />
                    <label className="form-check-label" htmlFor="includeZeroStock" style={{ color: '#ffffff' }}>Include Zero Stock</label>
                  </div>
                </div>
              </div>
            )}

            {/* Client Report Options */}
            {type === 'clients' && (
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label fw-semibold" style={labelStyle}>Filter by Client</label>
                  <select 
                    className="form-select" 
                    value={clientFilterType} 
                    onChange={e => {
                      setClientFilterType(e.target.value as any)
                      if (e.target.value !== 'specific') {
                        setClientFilter('')
                        setClientSearchFilter('')
                      }
                    }}
                    style={dropdownStyle}
                  >
                    <option value="all">All Clients</option>
                    <option value="specific">Specific Client</option>
                  </select>
                </div>
                
                {clientFilterType === 'specific' && (
                  <div className="col-md-4">
                    <label className="form-label fw-semibold" style={labelStyle}>Select Client</label>
                    <ClientSearchDropdown 
                      searchTerm={clientSearchFilter}
                      setSearchTerm={setClientSearchFilter}
                      selectedId={clientFilter}
                      setSelectedId={setClientFilter}
                      showDropdown={showClientFilterDropdown}
                      setShowDropdown={setShowClientFilterDropdown}
                      filteredList={filteredClientFilterOptions}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Output Format */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="form-label fw-semibold" style={labelStyle}>Output Format</label>
                <select 
                  className="form-select" 
                  value={format} 
                  onChange={e => setFormat(e.target.value as any)}
                  style={dropdownStyle}
                >
                  <option value="pdf">PDF Document</option>
                  <option value="csv">CSV File</option>
                </select>
              </div>
            </div>

            {/* Preview Section */}
            {previewData && previewData.length > 0 && (
              <div className="mt-4 p-3 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                <h6 className="fw-bold mb-3" style={{ color: '#ffffff' }}>Preview ({previewData.length} records)</h6>
                <div className="table-responsive" style={{ maxHeight: '250px', overflowY: 'auto', backgroundColor: '#ffffff', borderRadius: '8px' }}>
                  <table className="table table-sm table-hover mb-0">
                    <thead className="table-light sticky-top">
                      <tr>
                        {previewColumns.map(col => (
                          <th key={col.key} className={col.align === 'right' ? 'text-end' : col.align === 'center' ? 'text-center' : ''} style={{ color: '#333333' }}>{col.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 15).map((row, idx) => (
                        <tr key={idx}>
                          {previewColumns.map(col => (
                            <td key={col.key} className={col.align === 'right' ? 'text-end' : col.align === 'center' ? 'text-center' : ''} style={{ color: '#333333' }}>
                              {typeof row[col.key] === 'number' && !col.key.includes('quantity') ? formatCurrency(row[col.key]) : (row[col.key] || '-')}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {previewData.length > 15 && (
                        <tr><td colSpan={previewColumns.length} className="text-center text-muted">... and {previewData.length - 15} more records</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer with all buttons */}
          <div className="modal-footer border-0 p-4" style={{ background: 'rgba(248, 250, 252, 0.95)' }}>
            <div className="d-flex justify-content-between w-100">
              <button 
                type="button" 
                className="btn btn-outline-secondary" 
                onClick={onClose}
                style={{ borderRadius: '12px', height: '45px', padding: '0 1.5rem' }}
              >
                Close
              </button>
              
              <div className="d-flex gap-3">
                <button 
                  type="button" 
                  className="btn btn-outline-primary" 
                  onClick={generatePreview}
                  disabled={loading}
                  style={{ borderRadius: '12px', height: '45px', padding: '0 1.5rem' }}
                >
                  <Eye size={16} className="me-2"/>
                  Preview
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline-secondary" 
                  onClick={handlePrint}
                  disabled={loading}
                  style={{ borderRadius: '12px', height: '45px', padding: '0 1.5rem' }}
                >
                  <Printer size={16} className="me-2"/>
                  Print
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
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
