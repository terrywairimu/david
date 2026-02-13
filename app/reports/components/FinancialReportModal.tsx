"use client"

import React, { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { FormModal } from "@/components/ui/modal"
import { DollarSign, Download, Printer, Eye, TrendingUp, TrendingDown } from "lucide-react"
import { exportToCSV, printTableHtml, TableColumn } from "./ReportUtils"
import { useGlobalProgress } from "@/components/GlobalProgressManager"

interface FinancialReportModalProps {
  isOpen: boolean
  onClose: () => void
  dateFrom?: string
  dateTo?: string
}

type FinancialReportType = 'summary' | 'profitLoss' | 'balanceSheet' | 'cashFlow' | 'cashBook' | 'incomeStatement'

// Currency formatting
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2
  }).format(amount)
}

// Percentage formatting
const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0.0%'
  return `${((value / total) * 100).toFixed(1)}%`
}

export default function FinancialReportModal({ isOpen, onClose, dateFrom, dateTo }: FinancialReportModalProps) {
  const { startDownload, completeDownload, setError } = useGlobalProgress()
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState<FinancialReportType>('summary')
  const [showPercentages, setShowPercentages] = useState(true)
  const [rows, setRows] = useState<any[]>([])
  const [columns, setColumns] = useState<TableColumn[]>([])
  
  // Financial data
  const [financialData, setFinancialData] = useState({
    totalSales: 0,
    totalPayments: 0,
    totalExpenses: 0,
    clientExpenses: 0,
    companyExpenses: 0,
    cashBalance: 0,
    bankBalance: 0,
    receivables: 0,
    inventoryValue: 0,
    expensesByCategory: {} as Record<string, number>
  })

  useEffect(() => {
    if (!isOpen) return
    fetchFinancialData()
  }, [isOpen, dateFrom, dateTo, reportType])

  const fetchFinancialData = async () => {
      setLoading(true)
      try {
      const start = dateFrom ? new Date(dateFrom) : new Date(2020, 0, 1)
      const end = dateTo ? new Date(dateTo + 'T23:59:59') : new Date()
      
      // Fetch all financial data in parallel
      const [
        salesRes,
        paymentsRes,
        expensesRes,
        balancesRes,
        invoicesRes,
        inventoryRes,
        transactionsRes
      ] = await Promise.all([
        supabase.from('sales_orders').select('grand_total, date_created')
          .gte('date_created', start.toISOString())
          .lte('date_created', end.toISOString()),
        supabase.from('payments').select('amount, date_paid, status')
          .eq('status', 'completed')
          .gte('date_paid', start.toISOString())
          .lte('date_paid', end.toISOString()),
        supabase.from('expenses').select('amount, category, expense_type, date_created')
          .gte('date_created', start.toISOString())
          .lte('date_created', end.toISOString()),
        supabase.from('account_balances').select('*'),
        supabase.from('invoices').select('grand_total, paid_amount, status')
          .in('status', ['pending', 'overdue']),
        supabase.from('stock_items').select('quantity, unit_price'),
        reportType === 'cashBook' ? 
          supabase.from('account_transactions')
            .select('*')
            .gte('transaction_date', start.toISOString())
            .lte('transaction_date', end.toISOString())
            .order('transaction_date', { ascending: true }) :
          Promise.resolve({ data: [] })
      ])

      // Calculate totals
      const totalSales = (salesRes.data || []).reduce((s, r) => s + parseFloat(r.grand_total || 0), 0)
      const totalPayments = (paymentsRes.data || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0)
      
      // Group expenses by category and type
      const expensesByCategory: Record<string, number> = {}
      let clientExpenses = 0
      let companyExpenses = 0
      
      ;(expensesRes.data || []).forEach((e: any) => {
        const cat = e.category || 'Other'
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + parseFloat(e.amount || 0)
        if (e.expense_type === 'client') {
          clientExpenses += parseFloat(e.amount || 0)
        } else {
          companyExpenses += parseFloat(e.amount || 0)
        }
      })
      
      const totalExpenses = clientExpenses + companyExpenses
      
      // Account balances
      const cashBalance = parseFloat(balancesRes.data?.find(b => b.account_type === 'cash')?.current_balance || 0)
      const bankBalance = parseFloat(balancesRes.data?.find(b => b.account_type === 'cooperative_bank')?.current_balance || 0)
      const mpesaBalance = parseFloat(balancesRes.data?.find(b => b.account_type === 'mpesa')?.current_balance || 0)
      const pettyCashBalance = parseFloat(balancesRes.data?.find(b => b.account_type === 'petty_cash')?.current_balance || 0)
      
      // Receivables (unpaid invoices)
      const receivables = (invoicesRes.data || []).reduce((s, i) => 
        s + (parseFloat(i.grand_total || 0) - parseFloat(i.paid_amount || 0)), 0)
      
      // Inventory value
      const inventoryValue = (inventoryRes.data || []).reduce((s, i) => 
        s + ((i.quantity || 0) * parseFloat(i.unit_price || 0)), 0)

      setFinancialData({
        totalSales,
        totalPayments,
        totalExpenses,
        clientExpenses,
        companyExpenses,
        cashBalance,
        bankBalance,
        mpesaBalance,
        pettyCashBalance,
        receivables,
        inventoryValue,
        expensesByCategory
      })

      // Generate rows based on report type
      generateReportRows(reportType, {
        totalSales,
        totalPayments,
        totalExpenses,
        clientExpenses,
        companyExpenses,
        cashBalance,
        bankBalance,
        mpesaBalance,
        pettyCashBalance,
        receivables,
        inventoryValue,
        expensesByCategory,
        transactions: transactionsRes.data || []
      })

    } finally {
      setLoading(false)
    }
  }

  const generateReportRows = (type: FinancialReportType, data: any) => {
    let newRows: any[] = []
    let newColumns: TableColumn[] = []

    switch (type) {
      case 'profitLoss':
      case 'incomeStatement':
        // Professional Profit & Loss / Income Statement
        const grossProfit = data.totalSales - data.totalExpenses
        const netIncome = data.totalPayments - data.totalExpenses
        
        newRows = [
          { account: 'REVENUE', type: 'header', amount: null, percentage: '' },
          { account: 'Sales Revenue', type: 'revenue', amount: data.totalSales, percentage: '100.0%' },
          { account: 'Less: Cost of Goods Sold (COGS)', type: 'expense', amount: data.clientExpenses, percentage: showPercentages ? formatPercentage(data.clientExpenses, data.totalSales) : '' },
          { account: '', type: 'spacer', amount: null, percentage: '' },
          { account: 'GROSS PROFIT', type: 'subtotal', amount: data.totalSales - data.clientExpenses, percentage: showPercentages ? formatPercentage(data.totalSales - data.clientExpenses, data.totalSales) : '' },
          { account: '', type: 'spacer', amount: null, percentage: '' },
          { account: 'OPERATING EXPENSES', type: 'header', amount: null, percentage: '' },
          ...Object.entries(data.expensesByCategory)
            .filter(([cat]) => !['wages', 'material facilitation', 'fare', 'transport'].includes(cat.toLowerCase()))
            .map(([cat, amt]: [string, any]) => ({
              account: `  ${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
              type: 'expense',
              amount: amt,
              percentage: showPercentages ? formatPercentage(amt, data.totalSales) : ''
            })),
          { account: '', type: 'spacer', amount: null, percentage: '' },
          { account: 'Total Operating Expenses', type: 'subtotal', amount: data.companyExpenses, percentage: showPercentages ? formatPercentage(data.companyExpenses, data.totalSales) : '' },
          { account: '', type: 'spacer', amount: null, percentage: '' },
          { account: 'OPERATING INCOME', type: 'subtotal', amount: grossProfit - data.companyExpenses, percentage: showPercentages ? formatPercentage(grossProfit - data.companyExpenses, data.totalSales) : '' },
          { account: '', type: 'spacer', amount: null, percentage: '' },
          { account: 'Other Income', type: 'revenue', amount: 0, percentage: '' },
          { account: 'Other Expenses', type: 'expense', amount: 0, percentage: '' },
          { account: '', type: 'spacer', amount: null, percentage: '' },
          { account: 'NET INCOME', type: 'grandtotal', amount: netIncome, percentage: showPercentages ? formatPercentage(netIncome, data.totalSales) : '' }
        ]
        
        newColumns = [
          { key: 'account', label: 'Account Description' },
          { key: 'amount', label: 'Amount (KES)', align: 'right' },
          { key: 'percentage', label: '% of Revenue', align: 'right' }
        ]
        break

      case 'balanceSheet':
        // Professional Balance Sheet
        const totalCurrentAssets = data.cashBalance + data.bankBalance + (data.mpesaBalance || 0) + (data.pettyCashBalance || 0) + data.receivables + data.inventoryValue
        const totalAssets = totalCurrentAssets
        const netWorth = totalAssets // Simplified - in real scenario would subtract liabilities
        
        newRows = [
          { account: 'ASSETS', type: 'header', amount: null },
          { account: '', type: 'spacer', amount: null },
          { account: 'Current Assets', type: 'subheader', amount: null },
          { account: '  Cash in Hand', type: 'asset', amount: data.cashBalance },
          { account: '  Bank - Cooperative', type: 'asset', amount: data.bankBalance },
          { account: '  M-Pesa', type: 'asset', amount: data.mpesaBalance || 0 },
          { account: '  Petty Cash', type: 'asset', amount: data.pettyCashBalance || 0 },
          { account: '  Accounts Receivable', type: 'asset', amount: data.receivables },
          { account: '  Inventory', type: 'asset', amount: data.inventoryValue },
          { account: '', type: 'spacer', amount: null },
          { account: 'Total Current Assets', type: 'subtotal', amount: totalCurrentAssets },
          { account: '', type: 'spacer', amount: null },
          { account: 'Fixed Assets', type: 'subheader', amount: null },
          { account: '  Property & Equipment', type: 'asset', amount: 0 },
          { account: '  Less: Accumulated Depreciation', type: 'contra', amount: 0 },
          { account: '', type: 'spacer', amount: null },
          { account: 'Total Fixed Assets', type: 'subtotal', amount: 0 },
          { account: '', type: 'spacer', amount: null },
          { account: 'TOTAL ASSETS', type: 'grandtotal', amount: totalAssets },
          { account: '', type: 'spacer', amount: null },
          { account: 'LIABILITIES', type: 'header', amount: null },
          { account: '', type: 'spacer', amount: null },
          { account: 'Current Liabilities', type: 'subheader', amount: null },
          { account: '  Accounts Payable', type: 'liability', amount: 0 },
          { account: '  Accrued Expenses', type: 'liability', amount: 0 },
          { account: '', type: 'spacer', amount: null },
          { account: 'Total Current Liabilities', type: 'subtotal', amount: 0 },
          { account: '', type: 'spacer', amount: null },
          { account: 'TOTAL LIABILITIES', type: 'subtotal', amount: 0 },
          { account: '', type: 'spacer', amount: null },
          { account: 'EQUITY', type: 'header', amount: null },
          { account: '  Owner\'s Capital', type: 'equity', amount: netWorth },
          { account: '  Retained Earnings', type: 'equity', amount: 0 },
          { account: '', type: 'spacer', amount: null },
          { account: 'TOTAL EQUITY', type: 'subtotal', amount: netWorth },
          { account: '', type: 'spacer', amount: null },
          { account: 'TOTAL LIABILITIES & EQUITY', type: 'grandtotal', amount: netWorth }
        ]
        
        newColumns = [
          { key: 'account', label: 'Account' },
          { key: 'amount', label: 'Amount (KES)', align: 'right' }
        ]
        break

      case 'cashFlow':
        // Cash Flow Statement
        const netCashFromOperations = data.totalPayments - data.totalExpenses
        
        newRows = [
          { activity: 'CASH FLOWS FROM OPERATING ACTIVITIES', type: 'header', inflow: null, outflow: null, net: null },
          { activity: '', type: 'spacer', inflow: null, outflow: null, net: null },
          { activity: 'Cash Receipts from Customers', type: 'inflow', inflow: data.totalPayments, outflow: null, net: data.totalPayments },
          { activity: 'Cash Paid to Suppliers (Client Expenses)', type: 'outflow', inflow: null, outflow: data.clientExpenses, net: -data.clientExpenses },
          { activity: 'Cash Paid for Operating Expenses', type: 'outflow', inflow: null, outflow: data.companyExpenses, net: -data.companyExpenses },
          { activity: '', type: 'spacer', inflow: null, outflow: null, net: null },
          { activity: 'Net Cash from Operating Activities', type: 'subtotal', inflow: data.totalPayments, outflow: data.totalExpenses, net: netCashFromOperations },
          { activity: '', type: 'spacer', inflow: null, outflow: null, net: null },
          { activity: 'CASH FLOWS FROM INVESTING ACTIVITIES', type: 'header', inflow: null, outflow: null, net: null },
          { activity: 'Purchase of Equipment', type: 'outflow', inflow: null, outflow: 0, net: 0 },
          { activity: '', type: 'spacer', inflow: null, outflow: null, net: null },
          { activity: 'Net Cash from Investing Activities', type: 'subtotal', inflow: 0, outflow: 0, net: 0 },
          { activity: '', type: 'spacer', inflow: null, outflow: null, net: null },
          { activity: 'CASH FLOWS FROM FINANCING ACTIVITIES', type: 'header', inflow: null, outflow: null, net: null },
          { activity: 'Owner Contributions', type: 'inflow', inflow: 0, outflow: null, net: 0 },
          { activity: 'Owner Withdrawals', type: 'outflow', inflow: null, outflow: 0, net: 0 },
          { activity: '', type: 'spacer', inflow: null, outflow: null, net: null },
          { activity: 'Net Cash from Financing Activities', type: 'subtotal', inflow: 0, outflow: 0, net: 0 },
          { activity: '', type: 'spacer', inflow: null, outflow: null, net: null },
          { activity: 'NET INCREASE IN CASH', type: 'grandtotal', inflow: null, outflow: null, net: netCashFromOperations },
          { activity: '', type: 'spacer', inflow: null, outflow: null, net: null },
          { activity: 'Cash at Beginning of Period', type: 'info', inflow: null, outflow: null, net: (data.cashBalance + data.bankBalance + (data.mpesaBalance || 0) + (data.pettyCashBalance || 0)) - netCashFromOperations },
          { activity: 'Cash at End of Period', type: 'grandtotal', inflow: null, outflow: null, net: data.cashBalance + data.bankBalance + (data.mpesaBalance || 0) + (data.pettyCashBalance || 0) }
        ]
        
        newColumns = [
          { key: 'activity', label: 'Activity' },
          { key: 'inflow', label: 'Inflows', align: 'right' },
          { key: 'outflow', label: 'Outflows', align: 'right' },
          { key: 'net', label: 'Net', align: 'right' }
        ]
        break

      case 'cashBook':
        // Three-Column Cash Book
        let runningBalance = 0
        newRows = (data.transactions || []).map((t: any) => {
          const debit = t.transaction_type === 'in' ? parseFloat(t.amount) : 0
          const credit = t.transaction_type === 'out' ? parseFloat(t.amount) : 0
          runningBalance += debit - credit
          return {
            date: new Date(t.transaction_date).toLocaleDateString(),
            reference: t.transaction_number || '-',
            description: t.description || '-',
            account: t.account_type || '-',
            debit: debit || null,
            credit: credit || null,
            balance: runningBalance
          }
        })
        
        newColumns = [
          { key: 'date', label: 'Date' },
          { key: 'reference', label: 'Ref #' },
          { key: 'description', label: 'Description' },
          { key: 'account', label: 'Account' },
          { key: 'debit', label: 'Debit (Dr)', align: 'right' },
          { key: 'credit', label: 'Credit (Cr)', align: 'right' },
          { key: 'balance', label: 'Balance', align: 'right' }
        ]
        break

      default:
        // Financial Summary
        const netProfit = data.totalSales - data.totalExpenses
        const profitMargin = data.totalSales > 0 ? (netProfit / data.totalSales) * 100 : 0
        const totalLiquidity = data.cashBalance + data.bankBalance + (data.mpesaBalance || 0) + (data.pettyCashBalance || 0)
        
        newRows = [
          { metric: 'REVENUE', value: null, trend: '' },
          { metric: 'Total Sales (Orders)', value: data.totalSales, trend: '' },
          { metric: 'Total Payments Received', value: data.totalPayments, trend: '' },
          { metric: '', value: null, trend: '' },
          { metric: 'EXPENSES', value: null, trend: '' },
          { metric: 'Client Expenses (COGS)', value: data.clientExpenses, trend: '' },
          { metric: 'Company/Operating Expenses', value: data.companyExpenses, trend: '' },
          { metric: 'Total Expenses', value: data.totalExpenses, trend: '' },
          { metric: '', value: null, trend: '' },
          { metric: 'PROFITABILITY', value: null, trend: '' },
          { metric: 'Gross Profit', value: data.totalSales - data.clientExpenses, trend: '' },
          { metric: 'Net Profit', value: netProfit, trend: netProfit >= 0 ? 'up' : 'down' },
          { metric: 'Profit Margin', value: `${profitMargin.toFixed(1)}%`, trend: profitMargin >= 0 ? 'up' : 'down' },
          { metric: '', value: null, trend: '' },
          { metric: 'LIQUIDITY', value: null, trend: '' },
          { metric: 'Cash Balance', value: data.cashBalance, trend: '' },
          { metric: 'Bank Balance', value: data.bankBalance, trend: '' },
          { metric: 'M-Pesa', value: data.mpesaBalance || 0, trend: '' },
          { metric: 'Petty Cash', value: data.pettyCashBalance || 0, trend: '' },
          { metric: 'Total Liquid Assets', value: totalLiquidity, trend: '' },
          { metric: '', value: null, trend: '' },
          { metric: 'OTHER ASSETS', value: null, trend: '' },
          { metric: 'Accounts Receivable', value: data.receivables, trend: '' },
          { metric: 'Inventory Value', value: data.inventoryValue, trend: '' }
        ]
        
        newColumns = [
          { key: 'metric', label: 'Metric' },
          { key: 'value', label: 'Value (KES)', align: 'right' },
          { key: 'trend', label: 'Trend', align: 'center' }
        ]
    }

    setRows(newRows)
    setColumns(newColumns)
  }

  const handleExport = () => {
    startDownload(`financial-${reportType}`, 'csv')
    try {
      exportToCSV(`financial-${reportType}`, columns, rows)
      setTimeout(() => completeDownload(), 500)
    } catch (error) {
      setError('Failed to export report')
    }
  }
  
  const handlePrint = () => {
    const reportTitle = reportType === 'profitLoss' ? 'PROFIT & LOSS STATEMENT' :
                        reportType === 'incomeStatement' ? 'INCOME STATEMENT' :
                        reportType === 'balanceSheet' ? 'BALANCE SHEET' :
                        reportType === 'cashFlow' ? 'CASH FLOW STATEMENT' :
                        reportType === 'cashBook' ? 'THREE-COLUMN CASH BOOK' :
                        'FINANCIAL SUMMARY'
    
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #333;">CABINET MASTER STYLES & FINISHES</h2>
          <p style="margin: 5px 0; color: #666;">Ruiru Eastern By-Pass | Tel: +254729554475</p>
        </div>
        <h3 style="text-align: center; color: #444; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">${reportTitle}</h3>
        <p style="text-align: center; color: #666;">Period: ${dateFrom || 'All'} - ${dateTo || 'All'}</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background: #f8f9fa;">
              ${columns.map(c => `<th style="border: 1px solid #ddd; padding: 10px; text-align: ${c.align || 'left'};">${c.label}</th>`).join('')}
            </tr>
          </thead>
        <tbody>
            ${rows.map((r, idx) => {
              const isHeader = r.type === 'header' || r.type === 'subheader'
              const isTotal = r.type === 'subtotal' || r.type === 'grandtotal'
              const isSpacer = r.type === 'spacer'
              return isSpacer ? '' : `
                <tr style="background: ${isHeader ? '#e9ecef' : isTotal ? '#f8f9fa' : idx % 2 === 0 ? '#fff' : '#fafafa'}; ${isHeader || isTotal ? 'font-weight: bold;' : ''}">
                  ${columns.map(c => {
                    let value = r[c.key]
                    if (typeof value === 'number') value = formatCurrency(value)
                    if (value === null) value = ''
                    return `<td style="border: 1px solid #ddd; padding: 8px; text-align: ${c.align || 'left'};">${value}</td>`
                  }).join('')}
                </tr>
              `
            }).join('')}
        </tbody>
        </table>
        <div style="margin-top: 30px; display: flex; justify-content: space-between;">
          <div>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <div style="text-align: right;">
            <p><strong>Prepared by:</strong> _______________</p>
            <p><strong>Approved by:</strong> _______________</p>
          </div>
        </div>
      </div>
    `
    printTableHtml(reportTitle, html)
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp size={16} className="text-success" />
    if (trend === 'down') return <TrendingDown size={16} className="text-danger" />
    return null
  }

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title="Financial Reports" onSubmit={() => {}} showFooter={false} className="sm:max-w-[1100px]">
      {/* Report Type Selection */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <label className="form-label fw-semibold text-dark small">Report Type</label>
          <select 
            className="form-select border-0 shadow-sm" 
            value={reportType}
            onChange={e => setReportType(e.target.value as FinancialReportType)}
            style={{ borderRadius: '12px', height: '42px' }}
          >
            <option value="summary">Financial Summary</option>
            <option value="profitLoss">Profit & Loss Statement</option>
            <option value="incomeStatement">Income Statement</option>
            <option value="balanceSheet">Balance Sheet</option>
            <option value="cashFlow">Cash Flow Statement</option>
            <option value="cashBook">Three-Column Cash Book</option>
          </select>
        </div>
        <div className="col-md-6 d-flex align-items-end">
          {(reportType === 'profitLoss' || reportType === 'incomeStatement') && (
            <div className="form-check">
              <input 
                className="form-check-input" 
                type="checkbox" 
                checked={showPercentages} 
                onChange={e => setShowPercentages(e.target.checked)} 
              />
              <label className="form-check-label">Show Percentages</label>
            </div>
          )}
        </div>
      </div>

      {/* Info Bar */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="text-muted d-flex align-items-center gap-2">
          <DollarSign size={16} />
          <span>
            {reportType === 'profitLoss' ? 'Revenue, Expenses & Net Income Analysis' :
             reportType === 'balanceSheet' ? 'Assets, Liabilities & Equity Position' :
             reportType === 'cashFlow' ? 'Cash Inflows & Outflows Analysis' :
             reportType === 'cashBook' ? 'Detailed Cash Transactions' :
             'Complete Financial Overview'}
          </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-responsive" style={{ maxHeight: '450px', overflowY: 'auto' }}>
        <table className="table table-hover align-middle">
          <thead className="table-light sticky-top">
            <tr>
              {columns.map(col => (
                <th key={col.key} className={col.align === 'right' ? 'text-end' : col.align === 'center' ? 'text-center' : ''}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length}><div className="text-center text-muted py-3">Loading...</div></td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={columns.length}><div className="text-center text-muted py-3">No data available</div></td></tr>
            ) : (
              rows.map((r, idx) => {
                const isHeader = r.type === 'header' || r.type === 'subheader'
                const isTotal = r.type === 'subtotal' || r.type === 'grandtotal'
                const isSpacer = r.type === 'spacer'
                
                if (isSpacer) {
                  return <tr key={idx}><td colSpan={columns.length} style={{ height: '10px', border: 'none' }}></td></tr>
                }
                
                return (
                  <tr key={idx} className={isHeader ? 'table-secondary fw-bold' : isTotal ? 'table-light fw-bold' : ''}>
                    {columns.map(c => {
                      let value = r[c.key]
                      if (c.key === 'trend' && value) {
                        return <td key={c.key} className="text-center">{getTrendIcon(value)}</td>
                      }
                      if (typeof value === 'number') value = formatCurrency(value)
                      if (value === null) value = ''
                      return (
                        <td key={c.key} className={c.align === 'right' ? 'text-end' : c.align === 'center' ? 'text-center' : ''}>
                          {value}
                        </td>
                      )
                    })}
                </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer with action buttons */}
      <div className="border-top mt-4 pt-3">
        <div className="d-flex justify-content-between">
          <button className="btn btn-outline-secondary" onClick={onClose}>
            Close
          </button>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-primary" onClick={fetchFinancialData}>
              <Eye size={14} className="me-1"/>Refresh
            </button>
            <button className="btn btn-outline-secondary" onClick={handlePrint}>
              <Printer size={14} className="me-1"/>Print
            </button>
            <button className="btn btn-primary" onClick={handleExport}>
              <Download size={14} className="me-1"/>Export CSV
            </button>
          </div>
        </div>
      </div>
    </FormModal>
  )
}
