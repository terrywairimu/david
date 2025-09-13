"use client"

import React, { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { Calendar, Download, Printer, X, BarChart3, TrendingUp, Users, Package, Wallet, Settings, FileText } from "lucide-react"
import { exportToCSV, printTableHtml, TableColumn } from "./ReportUtils"
import { 
  generateSalesReportPDF, 
  generateExpenseReportPDF, 
  generateInventoryReportPDF,
  generateClientReportPDF,
  generateFinancialReportPDF,
  type SalesReportData,
  type ExpenseReportData,
  type InventoryReportData,
  type ClientReportData,
  type FinancialReportData
} from "@/lib/report-pdf-templates"
import { 
  financialCalculator,
  type ProfitLossData,
  type BalanceSheetData,
  type CashFlowData
} from "@/lib/financial-reports"
import { 
  generateProfitLossPDF as generateProfitLossPDFTemplate,
  generateBalanceSheetPDF as generateBalanceSheetPDFTemplate,
  generateCashFlowPDF as generateCashFlowPDFTemplate,
  generateCashBookPDF as generateCashBookPDFTemplate
} from "@/lib/financial-pdf-templates"
import { generateComprehensiveCashBookPDF, comprehensiveCashBookTemplate } from "@/lib/comprehensive-cashbook-template"
import { getNairobiDayBoundaries, getNairobiWeekBoundaries, getNairobiMonthBoundaries } from "@/lib/timezone"

type ReportType = 'sales' | 'expenses' | 'inventory' | 'clients' | 'financial' | 'custom'

interface ReportBuilderModalProps {
  isOpen: boolean
  onClose: () => void
  type: ReportType
}

type DateRangeKey = 'today' | 'yesterday' | 'week' | 'lastWeek' | 'month' | 'lastMonth' | 'quarter' | 'year' | 'custom'

// Color schemes matching the HTML version
const headerGradients: Record<ReportType, string> = {
  sales: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  expenses: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
  inventory: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
  clients: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
  financial: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
  custom: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
}

const buttonVariants: Record<ReportType, string> = {
  sales: 'btn-primary',
  expenses: 'btn-danger',
  inventory: 'btn-success',
  clients: 'btn-info',
  financial: 'btn-warning',
  custom: 'btn-secondary',
}

const reportIcons: Record<ReportType, React.ReactNode> = {
  sales: <BarChart3 size={20} />,
  expenses: <TrendingUp size={20} />,
  inventory: <Package size={20} />,
  clients: <Users size={20} />,
  financial: <Wallet size={20} />,
  custom: <Settings size={20} />,
}

const reportTitles: Record<ReportType, string> = {
  sales: 'Sales Report',
  expenses: 'Expense Report',
  inventory: 'Inventory Report',
  clients: 'Client Report',
  financial: 'Financial Summary',
  custom: 'Custom Report',
}

// Currency formatting function
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

function computeDateRange(selection: DateRangeKey): { start: Date, end: Date } {
  // Use Nairobi timezone for all date calculations
  const today = new Date()
  const { start: startOfToday, end: endOfToday } = getNairobiDayBoundaries(today)
  
  const { start: startOfThisWeek, end: endOfThisWeek } = getNairobiWeekBoundaries(today)
  
  const startOfLastWeek = new Date(startOfThisWeek)
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)
  const endOfLastWeek = new Date(startOfThisWeek)
  endOfLastWeek.setDate(endOfLastWeek.getDate() - 1)
  endOfLastWeek.setHours(23, 59, 59, 999)
  
  const { start: startOfThisMonth, end: endOfThisMonth } = getNairobiMonthBoundaries(today)
  
  const startOfLastMonth = new Date(startOfThisMonth)
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1)
  const endOfLastMonth = new Date(startOfThisMonth)
  endOfLastMonth.setDate(0)
  endOfLastMonth.setHours(23, 59, 59, 999)
  
  const startOfThisQuarter = new Date(today)
  startOfThisQuarter.setMonth(Math.floor(today.getMonth() / 3) * 3, 1)
  startOfThisQuarter.setHours(0, 0, 0, 0)
  
  const startOfThisYear = new Date(today.getFullYear(), 0, 1)
  
  switch(selection){
    case 'today': return { start: startOfToday, end: endOfToday }
    case 'yesterday': {
      const yStart = new Date(startOfToday)
      yStart.setDate(yStart.getDate() - 1)
      const yEnd = new Date(endOfToday)
      yEnd.setDate(yEnd.getDate() - 1)
      return { start: yStart, end: yEnd }
    }
    case 'week': return { start: startOfThisWeek, end: endOfToday }
    case 'lastWeek': return { start: startOfLastWeek, end: endOfLastWeek }
    case 'month': return { start: startOfThisMonth, end: endOfToday }
    case 'lastMonth': return { start: startOfLastMonth, end: endOfLastMonth }
    case 'quarter': return { start: startOfThisQuarter, end: endOfToday }
    case 'year': return { start: startOfThisYear, end: endOfToday }
    default: return { start: startOfThisMonth, end: endOfToday }
  }
}

export default function ReportBuilderModal({ isOpen, onClose, type }: ReportBuilderModalProps){
  // Debug logging to help identify mounting issues
  useEffect(() => {
    console.info("[ReportBuilderModal] open", { type, isOpen })
  }, [type, isOpen])

  const [datePreset, setDatePreset] = useState<DateRangeKey>('month')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [format, setFormat] = useState<'pdf'|'excel'|'csv'>('pdf')
  
  // Sales
  const [salesGroupBy, setSalesGroupBy] = useState<'day'|'week'|'month'|'client'|'product'>('month')
  const [includeCashSales, setIncludeCashSales] = useState(true)
  const [includeInvoices, setIncludeInvoices] = useState(true)
  
  // Expenses
  const [expensesGroupBy, setExpensesGroupBy] = useState<'day'|'week'|'month'|'category'|'department'>('month')
  const [includeClientExpenses, setIncludeClientExpenses] = useState(true)
  const [includeCompanyExpenses, setIncludeCompanyExpenses] = useState(true)
  
  // Inventory
  const [inventoryReportType, setInventoryReportType] = useState<'current'|'movement'|'value'|'lowStock'>('current')
  const [inventoryGroupBy, setInventoryGroupBy] = useState<'category'|'item'>('category')
  
  // Clients
  const [clientReportType, setClientReportType] = useState<'activity'|'sales'|'balance'|'newClients'>('activity')
  const [clientSelection, setClientSelection] = useState<'all'|number>('all')
  const [clientOptions, setClientOptions] = useState<Array<{id: number, name: string}>>([])
  
  // Financial - default to lastMonth to include July 2025 data
  const [financialReportType, setFinancialReportType] = useState<'summary'|'profitLoss'|'balanceSheet'|'cashFlow'|'cashBook'>('summary')
  const [comparisonPeriod, setComparisonPeriod] = useState<'none'|'previousPeriod'|'previousYear'>('none')
  
  // Custom
  const [includeClients, setIncludeClients] = useState(true)
  const [includeSales, setIncludeSales] = useState(true)
  const [includeExpensesData, setIncludeExpensesData] = useState(true)
  const [includeInventoryData, setIncludeInventoryData] = useState(true)
  const [customGroupBy, setCustomGroupBy] = useState<'none'|'day'|'week'|'month'|'client'|'category'>('none')

  // Load client options
  useEffect(() => {
    if (type === 'clients') {
      supabase.from('registered_entities').select('id, name').eq('type', 'client').then(({ data }) => {
        setClientOptions(data || [])
      })
    }
  }, [type])

  // Auto-set date preset for financial reports to include July 2025 data
  useEffect(() => {
    if (type === 'financial' && datePreset === 'month') {
      setDatePreset('lastMonth')
    }
  }, [type, datePreset])

  if (!isOpen) return null


  const runAndExport = async () => {
    const { start, end } = computeDateRange(datePreset)
    let rows: any[] = []
    let columns: TableColumn[] = []

    if (type === 'sales') {
      console.info('[ReportBuilderModal] running sales query', { salesGroupBy, includeCashSales, includeInvoices })
      
      // Query sales_orders table (actual sales data) instead of invoices (which is empty)
      const { data, error: salesError } = await supabase
        .from('sales_orders')
        .select('total_amount, grand_total, date_created, client_id, registered_entities(name)')
        .gte('date_created', start.toISOString())
        .lte('date_created', end.toISOString())
      
      if (salesError) {
        console.error('Sales query error:', salesError)
      }
      
      console.log('Sales data retrieved:', { 
        count: data?.length || 0, 
        sample: data?.slice(0, 3),
        dateRange: { start: start.toISOString(), end: end.toISOString() }
      })
      
      if (salesGroupBy === 'client') {
        const byClient = new Map<string, number>()
        ;(data||[]).forEach((i: any) => {
          const k = i.registered_entities?.name || 'unknown'
          // Use grand_total if available, otherwise total_amount
          const amount = parseFloat(i.grand_total) || parseFloat(i.total_amount) || 0
          byClient.set(k, (byClient.get(k)||0) + amount)
        })
        rows = Array.from(byClient.entries()).map(([client, total]) => ({ client, total: total.toFixed(2) }))
        columns = [{key:'client',label:'Client'}, {key:'total',label:'Total Sales',align:'right'}]
      } else {
        rows = (data||[]).map((i: any) => ({ 
          date: new Date(i.date_created).toLocaleDateString(), 
          client: i.registered_entities?.name, 
          amount: parseFloat(i.grand_total) || parseFloat(i.total_amount) || 0 
        }))
        columns = [{key:'date',label:'Date'}, {key:'client',label:'Client'}, {key:'amount',label:'Amount',align:'right'}]
      }
      
      console.log('Sales report rows generated:', { rowsCount: rows.length, sampleRows: rows.slice(0, 3) })
    }

    if (type === 'expenses') {
      console.info('[ReportBuilderModal] running expenses query', { expensesGroupBy, includeClientExpenses, includeCompanyExpenses })
      const { data, error: expenseError } = await supabase
        .from('expenses')
        .select('amount, date_created, category')
        .gte('date_created', start.toISOString())
        .lte('date_created', end.toISOString())
      
      if (expenseError) {
        console.error('Expense query error:', expenseError)
      }
      
      console.log('Expense data retrieved:', { count: data?.length || 0, sample: data?.slice(0, 3) })
      
      if (expensesGroupBy === 'category') {
        const byCategory = new Map<string, number>()
        ;(data||[]).forEach((e: any) => {
          const k = e.category || 'other'
          byCategory.set(k, (byCategory.get(k)||0) + Number(e.amount||0))
        })
        rows = Array.from(byCategory.entries()).map(([category, total]) => ({ category, total: total.toFixed(2) }))
        columns = [{key:'category',label:'Category'}, {key:'total',label:'Total Expenses',align:'right'}]
      } else {
        rows = (data||[]).map((e: any) => ({ date: new Date(e.date_created).toLocaleDateString(), category: e.category, amount: e.amount }))
        columns = [{key:'date',label:'Date'}, {key:'category',label:'Category'}, {key:'amount',label:'Amount',align:'right'}]
      }
    }

    if (type === 'inventory') {
      console.info('[ReportBuilderModal] running inventory query', { inventoryReportType, inventoryGroupBy })
      if (inventoryReportType === 'current' || inventoryReportType === 'value' || inventoryReportType === 'lowStock') {
        const { data, error: inventoryError } = await supabase.from('stock_items').select('name, category, quantity, reorder_level, unit_price')
        
        if (inventoryError) {
          console.error('Inventory query error:', inventoryError)
        }
        
        console.log('Inventory data retrieved:', { count: data?.length || 0, sample: data?.slice(0, 3) })
        
        if (inventoryReportType === 'lowStock') {
          rows = (data||[]).filter(d => (d.quantity||0) <= (d.reorder_level||0)).map(d => ({ item: d.name, category: d.category, qty: d.quantity, reorder: d.reorder_level, unit_price: d.unit_price, value: Number(d.unit_price||0) * Number(d.quantity||0) }))
          columns = [ {key:'item',label:'Item'}, {key:'category',label:'Category'}, {key:'qty',label:'Qty',align:'right'}, {key:'reorder',label:'Reorder',align:'right'}, {key:'unit_price',label:'Unit Price',align:'right'}, {key:'value',label:'Value',align:'right'} ]
        } else {
          if (inventoryGroupBy === 'category') {
            const map = new Map<string, {qty:number,value:number}>()
            ;(data||[]).forEach(d => {
              const k = d.category || 'other'
              const qty = Number(d.quantity||0)
              const value = Number(d.unit_price||0) * qty
              const cur = map.get(k) || { qty:0, value:0 }
              cur.qty += qty; cur.value += value; map.set(k, cur)
            })
            rows = Array.from(map.entries()).map(([category, v]) => ({ category, qty: v.qty, value: v.value.toFixed(2) }))
            columns = [{key:'category',label:'Category'}, {key:'qty',label:'Qty',align:'right'}, {key:'value',label:'Value',align:'right'}]
          } else {
            rows = (data||[]).map(d => ({ item: d.name, category: d.category, qty: d.quantity, unit_price: d.unit_price, value: Number(d.unit_price||0) * Number(d.quantity||0) }))
            columns = [{key:'item',label:'Item'}, {key:'category',label:'Category'}, {key:'qty',label:'Qty',align:'right'}, {key:'unit_price',label:'Unit Price',align:'right'}, {key:'value',label:'Value',align:'right'}]
          }
        }
      } else {
        // movement
        const { data, error: movementError } = await supabase.from('stock_movements').select('date_created, stock_item_id, quantity, movement_type, stock_items(name, category)')
        
        if (movementError) {
          console.error('Stock movement query error:', movementError)
        }
        
        console.log('Stock movement data retrieved:', { count: data?.length || 0, sample: data?.slice(0, 3) })
        
        const map = new Map<string, number>()
        ;(data||[]).forEach((m: any) => {
          const k = inventoryGroupBy === 'category' ? (m.stock_items?.category || 'other') : (m.stock_items?.name || 'unknown')
          const qty = Number(m.quantity || 0) * (m.movement_type === 'out' ? -1 : 1)
          map.set(k, (map.get(k)||0) + qty)
        })
        rows = Array.from(map.entries()).map(([group, qty]) => ({ group, qty }))
        columns = [{key:'group',label:'Group'}, {key:'qty',label:'Net Movement',align:'right'}]
      }
    }

    if (type === 'clients') {
      console.info('[ReportBuilderModal] running clients query')
      const [{ data: salesData, error: salesError }, { data: payments, error: paymentsError }, { data: clients, error: clientsError }] = await Promise.all([
        supabase.from('sales_orders').select('client_id, total_amount, grand_total').gte('date_created', start.toISOString()).lte('date_created', end.toISOString()),
        supabase.from('payments').select('client_id, amount').gte('date_created', start.toISOString()).lte('date_created', end.toISOString()),
        supabase.from('registered_entities').select('id, name').eq('type','client')
      ])
      
      if (salesError) console.error('Sales query error:', salesError)
      if (paymentsError) console.error('Payments query error:', paymentsError)
      if (clientsError) console.error('Clients query error:', clientsError)
      
      console.log('Clients report data:', {
        salesCount: salesData?.length || 0,
        paymentsCount: payments?.length || 0,
        clientsCount: clients?.length || 0,
        sampleSales: salesData?.slice(0, 3),
        samplePayments: payments?.slice(0, 3)
      })
      
      const byClient = new Map<number, {name:string, sales:number, payments:number}>()
      ;(clients||[]).forEach((c: any) => byClient.set(c.id, { name: c.name, sales:0, payments:0 }))
      ;(salesData||[]).forEach((i: any) => { 
        const r = byClient.get(i.client_id); 
        if (r) r.sales += (parseFloat(i.grand_total) || parseFloat(i.total_amount) || 0) 
      })
      ;(payments||[]).forEach((p: any) => { const r = byClient.get(p.client_id); if (r) r.payments += Number(p.amount||0) })
      const list = Array.from(byClient.entries()).map(([id, v]) => ({ client: v.name, sales: v.sales, payments: v.payments, balance: v.sales - v.payments }))
      rows = clientSelection === 'all' ? list : list.filter((r: any) => byClient.get(clientSelection as number)?.name === r.client)
      columns = [{key:'client',label:'Client'},{key:'sales',label:'Sales',align:'right'},{key:'payments',label:'Payments',align:'right'},{key:'balance',label:'Balance',align:'right'}]
    }

    if (type === 'financial') {
      console.info('[ReportBuilderModal] running financial query')
      
      if (financialReportType === 'cashBook') {
        console.info('[ReportBuilderModal] running cash book query')
        
        // Get all cash-related transactions for the date range
        const [{ data: transactions, error: transactionsError }, { data: quotations, error: quotationsError }] = await Promise.all([
          supabase.from('account_transactions').select('*').gte('transaction_date', start.toISOString()).lte('transaction_date', end.toISOString()),
          supabase.from('quotations').select('discount_amount').gte('date_created', start.toISOString()).lte('date_created', end.toISOString())
        ])
        
        if (transactionsError) console.error('Transactions query error:', transactionsError)
        if (quotationsError) console.error('Quotations query error:', quotationsError)
        
        console.log('Cash book data retrieved:', {
          transactionsCount: transactions?.length || 0,
          quotationsCount: quotations?.length || 0
        })
        
        // Process transactions to separate receipts and payments
        const receipts: any[] = [];
        const payments: any[] = [];
        
        // Helper function to extract reference number from description
        const extractRefNumber = (description: string): string => {
          if (!description) return '';
          
          // Look for exact patterns found in the database:
          // EN2508773 (2 letters + 7 digits), POCL2508035 (4 letters + 7 digits)
          const refPatterns = [
            /^(EN\d{7})$/i,        // EN followed by exactly 7 digits
            /^(POCL\d{7})$/i,      // POCL followed by exactly 7 digits  
            /^(PN\d{7})$/i,        // PN followed by exactly 7 digits
            /^([A-Z]{2,4}\d{7})$/i  // Any 2-4 letter code followed by exactly 7 digits
          ];
          
          for (const pattern of refPatterns) {
            const match = description.match(pattern);
            if (match) {
              return match[1];
            }
          }
          
          // If no exact pattern found, return the description itself (truncated if too long)
          return description.length > 15 ? description.substring(0, 15) + '...' : description;
        };

        ;(transactions || []).forEach((t: any, index: number) => {
          console.log('Processing transaction:', t);
          
          // Extract the actual reference number from description
          const refNumber = extractRefNumber(t.description);
          console.log(`Extracted ref number from "${t.description}": "${refNumber}"`);
          
          const transaction = {
            date: new Date(t.transaction_date || t.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
            particulars: t.description || 'Transaction',
            ref: refNumber, // Use extracted reference number
            cash: t.account_type === 'cash' ? Number(t.amount || 0) : 0,
            bank: t.account_type === 'cooperative_bank' ? Number(t.amount || 0) : 0,
            discount: 0
          }
          
          if (t.transaction_type === 'in') {
            receipts.push(transaction);
            console.log('Added to receipts:', transaction);
          } else if (t.transaction_type === 'out') {
            payments.push(transaction);
            console.log('Added to payments:', transaction);
          }
        });
        
        // Calculate discount from quotations
        const discountFromQuotations = (quotations || []).reduce((sum: number, q: any) => sum + Number(q.discount_amount || 0), 0);
        
        // Add discount data from quotations if any exists
        if (discountFromQuotations > 0) {
          receipts.push({
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
            particulars: 'Discount Allowed',
            ref: 'DIS-001', // Use DIS prefix for discount entries
            cash: 0,
            bank: 0,
            discount: discountFromQuotations
          });
        }
        
        // If no discount from quotations, add a placeholder entry for demonstration
        if (discountFromQuotations === 0) {
          receipts.push({
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
            particulars: 'Discount Allowed',
            ref: 'DIS-001', // Use DIS prefix for discount entries
            cash: 0,
            bank: 0,
            discount: 0
          });
        }
        
        // Calculate totals
        const totalCashReceipts = receipts.reduce((sum: number, r: any) => sum + r.cash, 0)
        const totalBankReceipts = receipts.reduce((sum: number, r: any) => sum + r.bank, 0)
        const totalDiscountAllowed = receipts.reduce((sum: number, r: any) => sum + r.discount, 0)
        
        const totalCashPayments = payments.reduce((sum: number, r: any) => sum + r.cash, 0)
        const totalBankPayments = payments.reduce((sum: number, r: any) => sum + r.bank, 0)
        
        // Add totals to receipts
        receipts.push({
          date: '',
          particulars: 'Total',
          ref: '',
          cash: totalCashReceipts,
          bank: totalBankReceipts,
          discount: totalDiscountAllowed
        })
        
        // Add totals to payments
        payments.push({
          date: '',
          particulars: 'Total',
          ref: '',
          cash: totalCashPayments,
          bank: totalBankPayments,
          discount: 0
        })
        
        // Store cash book data in a global variable for PDF generation
        const watermarkBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; // Placeholder watermark
        const cashBookData = {
          companyInfo: {
            name: 'CABINET MASTER AND STYLES',
            location: 'Ruiru Eastern By-Pass',
            tel: '+254729554475',
            email: 'cabinetmasterstyles@gmail.com',
          },
          receipts,
          payments,
          watermarkBase64,
          period: `${new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - ${new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
          reportNo: `CB-${new Date().getTime().toString().slice(-6)}`,
        };
        
        ;(window as any).cashBookData = cashBookData
        
        // Set rows to receipts for the table display (will be overridden in PDF generation)
        rows = receipts
        
        columns = [
          {key:'date',label:'Date'},
          {key:'particulars',label:'Particulars'},
          {key:'ref',label:'REF:'},
          {key:'cash',label:'Cash (KES)',align:'right'},
          {key:'bank',label:'Cooperative Bank (KES)',align:'right'},
          {key:'discount',label:'Discount Allowed (KES)',align:'right'}
        ]
        
        console.log('Cash book rows generated:', { 
          receiptsCount: receipts.length, 
          paymentsCount: payments.length,
          totals: (window as any).cashBookData.totals
        })
        
      } else {
        // Original financial summary logic
        const [{ data: salesData, error: salesError }, { data: exp, error: expensesError }] = await Promise.all([
          supabase.from('sales_orders').select('total_amount, grand_total').gte('date_created', start.toISOString()).lte('date_created', end.toISOString()),
          supabase.from('expenses').select('amount').gte('date_created', start.toISOString()).lte('date_created', end.toISOString()),
        ])
        
        if (salesError) console.error('Sales query error:', salesError)
        if (expensesError) console.error('Expenses query error:', expensesError)
        
        console.log('Financial summary data:', {
          salesCount: salesData?.length || 0,
          expensesCount: exp?.length || 0,
          sampleSales: salesData?.slice(0, 3),
          sampleExpenses: exp?.slice(0, 3)
        })
        
        const sales = (salesData||[]).reduce((s: any,i: any)=>s+(parseFloat(i.grand_total) || parseFloat(i.total_amount) || 0),0)
        const expenses = (exp||[]).reduce((s: any,i: any)=>s+Number(i.amount||0),0)
        const net = sales - expenses
        
        console.log('Financial summary calculations:', { sales, expenses, net })
        
        rows = [ { metric: 'Sales', amount: sales.toFixed(2) }, { metric: 'Expenses', amount: (-expenses).toFixed(2) }, { metric: 'Net', amount: net.toFixed(2) } ]
        columns = [{key:'metric',label:'Metric'},{key:'amount',label:'Amount',align:'right'}]
      }
    }



    if (type === 'custom') {
      console.info('[ReportBuilderModal] running custom summary')
      // very simple combined totals demo
      const tasks: Promise<any>[] = []
      if (includeClients) tasks.push(Promise.resolve(supabase.from('registered_entities').select('id').eq('type','client')))
      if (includeSales) tasks.push(Promise.resolve(supabase.from('sales_orders').select('total_amount, grand_total')))
      if (includeExpensesData) tasks.push(Promise.resolve(supabase.from('expenses').select('amount')))
      if (includeInventoryData) tasks.push(Promise.resolve(supabase.from('stock_items').select('unit_price, quantity')))
      const results = await Promise.all(tasks)
      
      console.log('Custom report data:', {
        includeClients,
        includeSales,
        includeExpensesData,
        includeInventoryData,
        resultsCount: results.length,
        sampleResults: results.map(r => r.data?.slice(0, 2))
      })
      
      const summary: Record<string, number> = {}
      let idx = 0
      if (includeClients) { summary.clients = (results[idx++].data||[]).length }
      if (includeSales) { 
        summary.sales = (results[idx++].data||[]).reduce((s: any,i: any)=>
          s+(parseFloat(i.grand_total) || parseFloat(i.total_amount) || 0),0) 
      }
      if (includeExpensesData) { summary.expenses = (results[idx++].data||[]).reduce((s: any,i: any)=>s+Number(i.amount||0),0) }
      if (includeInventoryData) { summary.stockValue = (results[idx++].data||[]).reduce((s: any,i: any)=>s+Number(i.unit_price||0)*Number(i.quantity||0),0) }
      
      console.log('Custom report summary:', summary)
      
      rows = Object.entries(summary).map(([k,v]) => ({ metric: k, value: v.toFixed(2) }))
      columns = [{key:'metric',label:'Metric'},{key:'value',label:'Value',align:'right'}]
    }

    // Export/Print
    const filenameBase = `${type}_report_${new Date().toISOString().slice(0,10)}`
    
    if (format === 'pdf') {
      try {
        // Use the same dynamic template system as other working exports
        const { generateDynamicTemplateWithPagination } = await import('@/lib/report-pdf-templates');
        
        // Get custom table headers based on report type
        let customTableHeaders: string[] = [];
        let templateType: 'expenses' | 'payments' | 'stock' | 'quotations' | 'salesOrders' | 'invoices' | 'cashSales' | 'purchases' | 'clients' = 'expenses';
        
        if (type === 'sales') {
          customTableHeaders = ['Date', 'Client', 'Type', 'Reference', 'Amount'];
          templateType = 'salesOrders';
        } else if (type === 'expenses') {
          customTableHeaders = ['Date', 'Category', 'Description', 'Type', 'Amount'];
          templateType = 'expenses';
        } else if (type === 'inventory') {
          customTableHeaders = ['Item', 'Category', 'Quantity', 'Unit Price', 'Value'];
          templateType = 'stock';
        } else if (type === 'clients') {
          customTableHeaders = ['Client', 'Phone', 'Location', 'Balance', 'Status'];
          templateType = 'clients';
        } else if (type === 'financial') {
          customTableHeaders = ['Account', 'Type', 'Amount', 'Balance', 'Date'];
          templateType = 'payments';
        }
        
        // Generate dynamic template with pagination
        const template = generateDynamicTemplateWithPagination(rows.length, customTableHeaders, templateType);
        
        // Fetch watermark image as base64
        async function fetchImageAsBase64(url: string): Promise<string> {
          const response = await fetch(url);
          const blob = await response.blob();
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
        
        const watermarkLogoBase64 = await fetchImageAsBase64('/logowatermark.png');
        const companyLogoBase64 = await fetchImageAsBase64('/logowatermark.png');

        // Create inputs with actual data
        const inputs = [{
          // Company Info
          logo: companyLogoBase64,
          companyName: "CABINET MASTER STYLES & FINISHES",
          companyLocation: "Location: Ruiru Eastern By-Pass",
          companyPhone: "Tel: +254729554475",
          companyEmail: "Email: cabinetmasterstyles@gmail.com",
          
          // Report Header
          reportTitle: `${type.toUpperCase()} REPORT`,
          reportDateLabel: 'Date:',
          reportDateValue: new Date().toLocaleDateString(),
          reportPeriodLabel: 'Period:',
          reportPeriodValue: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
          reportTypeLabel: 'Type:',
          reportTypeValue: `${type.charAt(0).toUpperCase() + type.slice(1)} Analysis`,
          
          // Real Data Rows (populated with actual data from rows array)
          ...rows.map((row, index) => {
            if (type === 'sales') {
              return {
                [`date_${index}`]: new Date(row.date || row.date_created).toLocaleDateString(),
                [`client_${index}`]: String(row.client || 'N/A'),
                [`type_${index}`]: String(row.type || 'N/A'),
                [`reference_${index}`]: String(row.quotation_number || row.order_number || row.invoice_number || 'N/A'),
                [`amount_${index}`]: `KES ${(row.amount || 0).toFixed(2)}`
              };
            } else if (type === 'expenses') {
              return {
                [`date_${index}`]: new Date(row.date || row.date_created).toLocaleDateString(),
                [`category_${index}`]: String(row.category || 'N/A'),
                [`description_${index}`]: String(row.description || 'N/A'),
                [`type_${index}`]: String(row.expense_type || 'N/A'),
                [`amount_${index}`]: `KES ${(row.amount || 0).toFixed(2)}`
              };
            } else if (type === 'inventory') {
              return {
                [`item_${index}`]: String(row.name || row.description || 'N/A'),
                [`category_${index}`]: String(row.category || 'N/A'),
                [`quantity_${index}`]: String(row.quantity || 0),
                [`unitPrice_${index}`]: `KES ${(row.unit_price || 0).toFixed(2)}`,
                [`value_${index}`]: `KES ${(row.value || 0).toFixed(2)}`
              };
            } else if (type === 'clients') {
              return {
                [`client_${index}`]: String(row.name || 'N/A'),
                [`phone_${index}`]: String(row.phone || 'N/A'),
                [`location_${index}`]: String(row.location || 'N/A'),
                [`balance_${index}`]: `KES ${(row.balance || 0).toFixed(2)}`,
                [`status_${index}`]: String(row.status || 'Active')
              };
            } else if (type === 'financial') {
              return {
                [`account_${index}`]: String(row.account || 'N/A'),
                [`type_${index}`]: String(row.type || 'N/A'),
                [`amount_${index}`]: `KES ${(row.amount || 0).toFixed(2)}`,
                [`balance_${index}`]: `KES ${(row.balance || 0).toFixed(2)}`,
                [`date_${index}`]: new Date(row.date || row.transaction_date).toLocaleDateString()
              };
            }
            return {};
          }).reduce((acc, item) => ({ ...acc, ...item }), {}),
          
          // Footer
          summaryTitle: 'Summary:',
          summaryContent: `Total ${type} Records: ${rows.length}`,
          totalLabel: 'Total:',
          totalValue: `KES ${rows.reduce((sum, row) => sum + (row.amount || row.value || row.balance || 0), 0).toFixed(2)}`,
          preparedByLabel: `Prepared by: System`,
          approvedByLabel: `Approved by: System`,
          
          // Watermark - map to all pages
          ...Array.from({ length: Math.ceil(rows.length / 15) + 1 }, (_, i) => ({
            [`watermarkLogo_${i}`]: watermarkLogoBase64
          })).reduce((acc, item) => ({ ...acc, ...item }), {}),
        }];
        
        // Generate and download the PDF
        const { generate } = await import('@pdfme/generator');
        const { text, rectangle, line, image } = await import('@pdfme/schemas');
        const pdf = await generate({ template, inputs, plugins: { text, rectangle, line, image } as any });
        
        // Download PDF
        const blob = new Blob([new Uint8Array(pdf.buffer)], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filenameBase}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
      } catch (pdfError) {
        console.error('PDF generation failed, falling back to HTML:', pdfError);
        // Fallback to HTML generation
        const html = `
          <h2>${type.charAt(0).toUpperCase() + type.slice(1)} Report</h2>
          <p>Period: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}</p>
          <table border="1" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                ${columns.map(col => `<th>${col.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map(row => `
                <tr>
                  ${columns.map(col => `<td>${(row as any)[col.key] || ''}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        printTableHtml(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`, html);
      }
    } else if (type === 'expenses') {
          const expenseData: ExpenseReportData = {
            companyName: "CABINET MASTER STYLES & FINISHES",
            companyLocation: "Location: Ruiru Eastern By-Pass",
            companyPhone: "Tel: +254729554475",
            companyEmail: "Email: cabinetmasterstyles@gmail.com",
            reportTitle: "Expense Report",
            reportDate: new Date().toLocaleDateString(),
            reportPeriod: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
            reportType: expensesGroupBy,
            reportGenerated: new Date().toLocaleDateString(),
            reportNumber: `ER-${Date.now()}`,
            items: rows.map((r: any) => ({
              date: r.date || new Date().toLocaleDateString(),
              category: r.category || 'N/A',
              description: r.description || 'N/A',
              amount: parseFloat(r.total || r.amount || '0'),
              type: r.type || 'Company'
            })),
            summary: `Expense report generated for ${expensesGroupBy} grouping. Total expenses: ${formatCurrency(rows.reduce((sum: number, r: any) => sum + parseFloat(r.total || r.amount || '0'), 0))}`,
            totalExpenses: rows.reduce((sum: number, r: any) => sum + parseFloat(r.total || r.amount || '0'), 0),
            preparedBy: "System",
            approvedBy: "Management"
          };
          
          const { template, inputs } = await generateExpenseReportPDF(expenseData);
          try {
            const { generate } = await import('@pdfme/generator');
            const { text, rectangle, line, image } = await import('@pdfme/schemas');
            const pdf = await generate({ template, inputs, plugins: { text, rectangle, line, image } });
            
            // Download PDF
            const blob = new Blob([new Uint8Array(pdf.buffer)], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filenameBase}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          } catch (pdfError) {
            console.error('PDF generation failed, falling back to HTML:', pdfError);
            // Fallback to HTML
            const table = `
              <table class="table table-sm table-striped">
                <thead><tr>${columns.map(c=>`<th class="text-${c.align||'start'}">${c.label}</th>`).join('')}</tr></thead>
                <tbody>${rows.map(r=>`<tr>${columns.map(c=>`<td class="text-${c.align||'start'}">${(r as any)[c.key] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
              </table>`
            printTableHtml(`${reportTitles[type]}`, table)
          }
          

          
        } else if (type === 'financial') {
          try {
            let pdfData: any;
            let template: any;
            let inputs: any;
            
            switch (financialReportType) {
              case 'cashBook':
                // Generate Three Column Cash Book using template system
                const cashBookData = {
                  companyInfo: {
                    name: 'CABINET MASTER AND STYLES',
                    location: 'Ruiru Eastern By-Pass',
                    tel: '+254729554475',
                    email: 'cabinetmasterstyles@gmail.com',
                  },
                  receipts: (window as any).cashBookData?.receipts || [],
                  payments: (window as any).cashBookData?.payments || [],
                  watermarkBase64: (window as any).cashBookData?.watermarkBase64 || '',
                  period: (window as any).cashBookData?.period || `${new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - ${new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
                  reportNo: (window as any).cashBookData?.reportNo || `CB-${new Date().getTime().toString().slice(-6)}`,
                };
                
                console.log('Cash book data being sent to comprehensive template:', cashBookData);
                console.log('Receipts data:', cashBookData.receipts);
                console.log('Payments data:', cashBookData.payments);
                
                template = comprehensiveCashBookTemplate;
                inputs = await generateComprehensiveCashBookPDF(cashBookData);
                break;
                
              case 'profitLoss':
                // Generate Profit & Loss Statement
                const profitLossData = await financialCalculator.calculateProfitLoss(
                  start.toISOString().split('T')[0],
                  end.toISOString().split('T')[0]
                );
                const { template: plTemplate, inputs: plInputs } = await generateProfitLossPDFTemplate(profitLossData);
                template = plTemplate;
                inputs = plInputs;
                break;
                
              case 'balanceSheet':
                // Generate Balance Sheet
                const balanceSheetData = await financialCalculator.calculateBalanceSheet(
                  end.toISOString().split('T')[0]
                );
                const { template: bsTemplate, inputs: bsInputs } = await generateBalanceSheetPDFTemplate(balanceSheetData);
                template = bsTemplate;
                inputs = bsInputs;
                break;
                
              case 'cashFlow':
                // Generate Cash Flow Statement
                const cashFlowData = await financialCalculator.calculateCashFlow(
                  start.toISOString().split('T')[0],
                  end.toISOString().split('T')[0]
                );
                const { template: cfTemplate, inputs: cfInputs } = await generateCashFlowPDFTemplate(cashFlowData);
                template = cfTemplate;
                inputs = cfInputs;
                break;
                
              default:
                // Generate Financial Summary (legacy)
                const financialData: FinancialReportData = {
                  companyName: "CABINET MASTER STYLES & FINISHES",
                  companyLocation: "Location: Ruiru Eastern By-Pass",
                  companyPhone: "Tel: +254729554475",
                  companyEmail: "Email: cabinetmasterstyles@gmail.com",
                  reportTitle: "Financial Summary Report",
                  reportDate: new Date().toLocaleDateString(),
                  reportPeriod: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
                  reportType: 'Financial Summary',
                  reportGenerated: new Date().toLocaleDateString(),
                  reportNumber: `FR-${Date.now()}`,
                  items: rows.map((r: any) => ({
                    metric: r.metric || 'N/A',
                    currentPeriod: parseFloat(r.amount || '0'),
                    previousPeriod: undefined,
                    change: undefined
                  })),
                  summary: `Financial summary report generated. Net income: ${formatCurrency(rows.reduce((sum: number, r: any) => sum + parseFloat(r.amount || '0'), 0))}`,
                  netIncome: rows.reduce((sum: number, r: any) => sum + parseFloat(r.amount || '0'), 0),
                  preparedBy: "System",
                  approvedBy: "Management"
                };
                
                const { template: fsTemplate, inputs: fsInputs } = await generateFinancialReportPDF(financialData);
                template = fsTemplate;
                inputs = fsInputs;
                break;
            }
            
            try {
              const { generate } = await import('@pdfme/generator');
              const { text, rectangle, line, image } = await import('@pdfme/schemas');
              const pdf = await generate({ template, inputs, plugins: { text, rectangle, line, image } });
              
              // Download PDF
              const reportTypeName = financialReportType === 'cashBook' ? 'cash-book' :
                                    financialReportType === 'profitLoss' ? 'profit-loss' : 
                                    financialReportType === 'balanceSheet' ? 'balance-sheet' : 
                                    financialReportType === 'cashFlow' ? 'cash-flow' : 'financial-summary';
              
              const blob = new Blob([new Uint8Array(pdf.buffer)], { type: 'application/pdf' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${reportTypeName}-${start.toISOString().split('T')[0]}-${end.toISOString().split('T')[0]}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            } catch (pdfmeError) {
              console.error('PDFme generation failed, falling back to HTML:', pdfmeError);
              // Fallback to HTML for cash book
              if (financialReportType === 'cashBook') {
                const cashBookData = (window as any).cashBookData;
                if (cashBookData) {
                  const receiptsTable = `
                    <table class="table table-sm table-striped">
                      <thead><tr><th>Date</th><th>Particulars</th><th>REF</th><th>Cash (KES)</th><th>Cooperative Bank (KES)</th><th>Disc. Allowed</th></tr></thead>
                      <tbody>${cashBookData.receipts.map((r: any) => 
                        `<tr><td>${r.date}</td><td>${r.particulars}</td><td>${r.ref}</td><td>${r.cash}</td><td>${r.bank}</td><td>${r.discount}</td></tr>`
                      ).join('')}</tbody>
                    </table>`;
                  
                  const paymentsTable = `
                    <table class="table table-sm table-striped">
                      <thead><tr><th>Date</th><th>Particulars</th><th>REF</th><th>Cash (KES)</th><th>Cooperative Bank (KES)</th><th>Disc. Received</th></tr></thead>
                      <tbody>${cashBookData.payments.map((r: any) => 
                        `<tr><td>${r.date}</td><td>${r.particulars}</td><td>${r.ref}</td><td>${r.cash}</td><td>${r.bank}</td><td>${r.discount}</td></tr>`
                      ).join('')}</tbody>
                    </table>`;
                  
                  const combinedTable = `
                    <div class="row">
                      <div class="col-md-6">
                        <h4>Receipts (DR)</h4>${receiptsTable}
                      </div>
                      <div class="col-md-6">
                        <h4>Payments (CR)</h4>${paymentsTable}
                      </div>
                    </div>`;
                  
                  printTableHtml('Three Column Cash Book', combinedTable);
                } else {
                  printTableHtml('Cash Book Report', 'No cash book data available');
                }
              } else {
                // Fallback to HTML for other financial reports
                const table = `
                  <table class="table table-sm table-striped">
                    <thead><tr>${columns.map(c=>`<th class="text-${c.align||'start'}">${c.label}</th>`).join('')}</tr></thead>
                    <tbody>${rows.map(r=>`<tr>${columns.map(c=>`<td class="text-${c.align||'start'}">${(r as any)[c.key] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
                  </table>`;
                printTableHtml('Financial Report', table);
              }
            }
          } catch (pdfError) {
            console.error('PDF generation failed, falling back to HTML:', pdfError);
            // Fallback to HTML for financial reports
            if (financialReportType === 'cashBook') {
              const cashBookData = (window as any).cashBookData;
              if (cashBookData) {
                const receiptsTable = `
                  <table class="table table-sm table-striped">
                    <thead><tr><th>Date</th><th>Particulars</th><th>REF</th><th>Cash (KES)</th><th>Cooperative Bank (KES)</th><th>Disc. Allowed</th></tr></thead>
                    <tbody>${cashBookData.receipts.map((r: any) => 
                      `<tr><td>${r.date}</td><td>${r.particulars}</td><td>${r.ref}</td><td>${r.cash}</td><td>${r.bank}</td><td>${r.discount}</td></tr>`
                    ).join('')}</tbody>
                  </table>`;
                
                const paymentsTable = `
                  <table class="table table-sm table-striped">
                    <thead><tr><th>Date</th><th>Particulars</th><th>REF</th><th>Cash (KES)</th><th>Cooperative Bank (KES)</th><th>Disc. Received</th></tr></thead>
                    <tbody>${cashBookData.payments.map((r: any) => 
                      `<tr><td>${r.date}</td><td>${r.particulars}</td><td>${r.ref}</td><td>${r.cash}</td><td>${r.bank}</td><td>${r.discount}</td></tr>`
                    ).join('')}</tbody>
                  </table>`;
                
                const combinedTable = `
                  <div class="row">
                    <div class="col-md-6">
                      <h4>Receipts (DR)</h4>${receiptsTable}
                    </div>
                    <div class="col-md-6">
                      <h4>Payments (CR)</h4>${paymentsTable}
                    </div>
                  </div>`;
                
                printTableHtml('Three Column Cash Book', combinedTable);
              } else {
                printTableHtml('Cash Book Report', 'No cash book data available');
              }
            } else {
              // Fallback to HTML for other financial reports
              const table = `
                <table class="table table-sm table-striped">
                  <thead><tr>${columns.map(c=>`<th class="text-${c.align||'start'}">${c.label}</th>`).join('')}</tr></thead>
                  <tbody>${rows.map(r=>`<tr>${columns.map(c=>`<td class="text-${c.align||'start'}">${(r as any)[c.key] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
                </table>`;
              printTableHtml('Financial Report', table);
            }
          }
          
        } else if (type === 'inventory') {
          const inventoryData: InventoryReportData = {
            companyName: "CABINET MASTER STYLES & FINISHES",
            companyLocation: "Location: Ruiru Eastern By-Pass",
            companyPhone: "Tel: +254729554475",
            companyEmail: "Email: cabinetmasterstyles@gmail.com",
            reportTitle: "Inventory Report",
            reportDate: new Date().toLocaleDateString(),
            reportPeriod: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
            reportType: inventoryReportType,
            reportGenerated: new Date().toLocaleDateString(),
            reportNumber: `IR-${Date.now()}`,
            items: rows.map((r: any) => ({
              item: r.item || r.group || 'N/A',
              category: r.category || 'N/A',
              quantity: parseFloat(r.qty || '0'),
              unitPrice: parseFloat(r.unit_price || '0'),
              value: parseFloat(r.value || '0')
            })),
            summary: `Inventory report generated for ${inventoryReportType}. Total value: ${formatCurrency(rows.reduce((sum: number, r: any) => sum + parseFloat(r.value || '0'), 0))}`,
            totalValue: rows.reduce((sum: number, r: any) => sum + parseFloat(r.value || '0'), 0),
            preparedBy: "System",
            approvedBy: "Management"
          };
          
          const { template, inputs } = await generateInventoryReportPDF(inventoryData);
          try {
            const { generate } = await import('@pdfme/generator');
            const { text, rectangle, line, image } = await import('@pdfme/schemas');
            const pdf = await generate({ template, inputs, plugins: { text, rectangle, line, image } });
            
            // Download PDF
            const blob = new Blob([new Uint8Array(pdf.buffer)], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filenameBase}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          } catch (pdfError) {
            console.error('PDF generation failed, falling back to HTML:', pdfError);
            // Fallback to HTML
            const table = `
              <table class="table table-sm table-striped">
                <thead><tr>${columns.map(c=>`<th class="text-${c.align||'start'}">${c.label}</th>`).join('')}</tr></thead>
                <tbody>${rows.map(r=>`<tr>${columns.map(c=>`<td class="text-${c.align||'start'}">${(r as any)[c.key] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
              </table>`
            printTableHtml('Report', table)
          }
          
        } else if (type === 'clients') {
          const clientData: ClientReportData = {
            companyName: "CABINET MASTER STYLES & FINISHES",
            companyLocation: "Location: Ruiru Eastern By-Pass",
            companyPhone: "Tel: +254729554475",
            companyEmail: "Email: cabinetmasterstyles@gmail.com",
            reportTitle: "Client Report",
            reportDate: new Date().toLocaleDateString(),
            reportPeriod: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
            reportType: 'Client Summary',
            reportGenerated: new Date().toLocaleDateString(),
            reportNumber: `CR-${Date.now()}`,
            items: rows.map((r: any) => ({
              client: r.client || 'N/A',
              sales: parseFloat(r.sales || '0'),
              payments: parseFloat(r.payments || '0'),
              balance: parseFloat(r.balance || '0'),
              status: r.status || 'Active'
            })),
            summary: `Client report generated. Total balance: ${formatCurrency(rows.reduce((sum: number, r: any) => sum + parseFloat(r.balance || '0'), 0))}`,
            totalBalance: rows.reduce((sum: number, r: any) => sum + parseFloat(r.balance || '0'), 0),
            preparedBy: "System",
            approvedBy: "Management"
          };
          
          const { template, inputs } = await generateClientReportPDF(clientData);
          try {
            const { generate } = await import('@pdfme/generator');
            const { text, rectangle, line, image } = await import('@pdfme/schemas');
            const pdf = await generate({ template, inputs, plugins: { text, rectangle, line, image } });
            
            // Download PDF
            const blob = new Blob([new Uint8Array(pdf.buffer)], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filenameBase}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          } catch (pdfError) {
            console.error('PDF generation failed, falling back to HTML:', pdfError);
            // Fallback to HTML
            const table = `
              <table class="table table-sm table-striped">
                <thead><tr>${columns.map(c=>`<th class="text-${c.align||'start'}">${c.label}</th>`).join('')}</tr></thead>
                <tbody>${rows.map(r=>`<tr>${columns.map(c=>`<td class="text-${c.align||'start'}">${(r as any)[c.key] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
              </table>`
            printTableHtml('Report', table)
          }
          
        } else {
          // For custom reports, use HTML fallback
          const table = `
            <table class="table table-sm table-striped">
              <thead><tr>${columns.map(c=>`<th class="text-${c.align||'start'}">${c.label}</th>`).join('')}</tr></thead>
              <tbody>${rows.map(r=>`<tr>${columns.map(c=>`<td class="text-${c.align||'start'}">${(r as any)[c.key] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
            </table>`
          printTableHtml(`${reportTitles[type]}`, table)
        }
      } catch (error) {
        console.error('Error generating PDF:', error);
        // Fallback to HTML for all report types
      const table = `
        <table class="table table-sm table-striped">
          <thead><tr>${columns.map(c=>`<th class="text-${c.align||'start'}">${c.label}</th>`).join('')}</tr></thead>
          <tbody>${rows.map(r=>`<tr>${columns.map(c=>`<td class="text-${c.align||'start'}">${(r as any)[c.key] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>`
      printTableHtml('Report', table)
      }
    } else {
      exportToCSV(filenameBase, columns, rows)
    }
    onClose()
  }

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
      <div className="modal-dialog modal-lg">
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
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
          
          {/* Modal Body */}
          <div className="modal-body p-4">
            <form onSubmit={(e) => { e.preventDefault(); runAndExport() }}>
              {/* Date Range Selection */}
              <div className="mb-4">
                <label className="form-label fw-semibold text-dark">Date Range</label>
                <select 
                  className="form-select border-0 shadow-sm" 
                  value={datePreset} 
                  onChange={e=>setDatePreset(e.target.value as DateRangeKey)}
                  style={{ borderRadius: '16px', height: '45px' }}
                >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Current Week</option>
            <option value="lastWeek">Last Week</option>
            <option value="month">Current Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="quarter">Current Quarter</option>
            <option value="year">Current Year</option>
                  <option value="custom">Custom Range</option>
          </select>
        </div>
              
        {datePreset === 'custom' && (
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">Start Date</label>
                    <input 
                      type="date" 
                      className="form-control border-0 shadow-sm" 
                      value={startDate} 
                      onChange={e=>setStartDate(e.target.value)}
                      style={{ borderRadius: '16px', height: '45px' }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">End Date</label>
                    <input 
                      type="date" 
                      className="form-control border-0 shadow-sm" 
                      value={endDate} 
                      onChange={e=>setEndDate(e.target.value)}
                      style={{ borderRadius: '16px', height: '45px' }}
                    />
          </div>
          </div>
        )}

              {/* Dynamic form content based on report type */}
      {type === 'sales' && (
        <>
          <div className="mb-4">
                    <label className="form-label fw-semibold text-dark">Group By</label>
                    <select 
                      className="form-select border-0 shadow-sm" 
                      value={salesGroupBy} 
                      onChange={e=>setSalesGroupBy(e.target.value as any)}
                      style={{ borderRadius: '16px', height: '45px' }}
                    >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="client">Client</option>
              <option value="product">Product/Service</option>
            </select>
          </div>
          <div className="mb-4">
                    <label className="form-label fw-semibold text-dark">Include</label>
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        checked={includeCashSales} 
                        onChange={e=>setIncludeCashSales(e.target.checked)} 
                        id="inc-cash" 
                      />
                      <label htmlFor="inc-cash" className="form-check-label text-dark">Cash Sales</label>
                    </div>
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        checked={includeInvoices} 
                        onChange={e=>setIncludeInvoices(e.target.checked)} 
                        id="inc-inv" 
                      />
                      <label htmlFor="inc-inv" className="form-check-label text-dark">Invoiced Sales</label>
                    </div>
          </div>
        </>
      )}

      {type === 'expenses' && (
        <>
          <div className="mb-4">
                    <label className="form-label fw-semibold text-dark">Group By</label>
                    <select 
                      className="form-select border-0 shadow-sm" 
                      value={expensesGroupBy} 
                      onChange={e=>setExpensesGroupBy(e.target.value as any)}
                      style={{ borderRadius: '16px', height: '45px' }}
                    >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="category">Category</option>
              <option value="department">Department</option>
            </select>
          </div>
          <div className="mb-4">
                    <label className="form-label fw-semibold text-dark">Include</label>
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        checked={includeClientExpenses} 
                        onChange={e=>setIncludeClientExpenses(e.target.checked)} 
                        id="inc-ce" 
                      />
                      <label htmlFor="inc-ce" className="form-check-label text-dark">Client Expenses</label>
                    </div>
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        checked={includeCompanyExpenses} 
                        onChange={e=>setIncludeCompanyExpenses(e.target.checked)} 
                        id="inc-coe" 
                      />
                      <label htmlFor="inc-coe" className="form-check-label text-dark">Company Expenses</label>
                    </div>
          </div>
        </>
      )}

      {type === 'inventory' && (
        <>
          <div className="mb-4">
                    <label className="form-label fw-semibold text-dark">Report Type</label>
                    <select 
                      className="form-select border-0 shadow-sm" 
                      value={inventoryReportType} 
                      onChange={e=>setInventoryReportType(e.target.value as any)}
                      style={{ borderRadius: '16px', height: '45px' }}
                    >
              <option value="current">Current Inventory Levels</option>
              <option value="movement">Inventory Movement</option>
              <option value="value">Inventory Valuation</option>
              <option value="lowStock">Low Stock Items</option>
            </select>
          </div>
          <div className="mb-4">
                    <label className="form-label fw-semibold text-dark">Group By</label>
                    <select 
                      className="form-select border-0 shadow-sm" 
                      value={inventoryGroupBy} 
                      onChange={e=>setInventoryGroupBy(e.target.value as any)}
                      style={{ borderRadius: '16px', height: '45px' }}
                    >
              <option value="category">Category</option>
              <option value="item">Individual Items</option>
            </select>
          </div>
        </>
      )}

      {type === 'clients' && (
        <>
          <div className="mb-4">
                    <label className="form-label fw-semibold text-dark">Report Type</label>
                    <select 
                      className="form-select border-0 shadow-sm" 
                      value={clientReportType} 
                      onChange={e=>setClientReportType(e.target.value as any)}
                      style={{ borderRadius: '16px', height: '45px' }}
                    >
              <option value="activity">Client Activity</option>
              <option value="sales">Sales by Client</option>
              <option value="balance">Outstanding Balances</option>
              <option value="newClients">New Clients</option>
            </select>
          </div>
          <div className="mb-4">
                    <label className="form-label fw-semibold text-dark">Client</label>
                    <select 
                      className="form-select border-0 shadow-sm" 
                      value={String(clientSelection)} 
                      onChange={e=>setClientSelection(e.target.value === 'all'? 'all' : Number(e.target.value))}
                      style={{ borderRadius: '16px', height: '45px' }}
                    >
              <option value="all">All Clients</option>
              {clientOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </>
      )}

      {type === 'financial' && (
        <>
          {/* Data Availability Notice */}
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Data Availability Notice
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    <strong>Current Data Status:</strong> Sales data is available for July 2025. 
                    To see meaningful financial reports, please select a date range that includes July 2025 
                    or periods where transactions have occurred.
                  </p>
                  <p className="mt-1">
                    <strong>Available Data:</strong> 4 sales orders (KES 1,613,480.60), 
                    159 expenses (KES 703,889.00), 59 inventory items (KES 1,761,150.00), 
                    34 purchases (KES 1,300,850.00)
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
                    <label className="form-label fw-semibold text-dark">Report Type</label>
                    <select 
                      className="form-select border-0 shadow-sm" 
                      value={financialReportType} 
                      onChange={e=>setFinancialReportType(e.target.value as any)}
                      style={{ borderRadius: '16px', height: '45px' }}
                    >
              <option value="summary">Financial Summary</option>
              <option value="profitLoss">Profit & Loss Statement</option>
              <option value="balanceSheet">Balance Sheet</option>
              <option value="cashFlow">Cash Flow Statement</option>
              <option value="cashBook">Three Column Cash Book</option>
            </select>
          </div>
          <div className="mb-4">
                    <label className="form-label fw-semibold text-dark">Comparison</label>
                    <select 
                      className="form-select border-0 shadow-sm" 
                      value={comparisonPeriod} 
                      onChange={e=>setComparisonPeriod(e.target.value as any)}
                      style={{ borderRadius: '16px', height: '45px' }}
                    >
              <option value="none">None</option>
              <option value="previousPeriod">Previous Period</option>
              <option value="previousYear">Same Period Last Year</option>
            </select>
          </div>
        </>
      )}

      {type === 'custom' && (
        <>
          <div className="mb-4">
                    <label className="form-label fw-semibold text-dark">Include Data From</label>
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        checked={includeClients} 
                        onChange={e=>setIncludeClients(e.target.checked)} 
                        id="inc-cli" 
                      />
                      <label htmlFor="inc-cli" className="form-check-label text-dark">Clients</label>
                    </div>
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        checked={includeSales} 
                        onChange={e=>setIncludeSales(e.target.checked)} 
                        id="inc-sales" 
                      />
                      <label htmlFor="inc-sales" className="form-check-label text-dark">Sales</label>
                    </div>
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        checked={includeExpensesData} 
                        onChange={e=>setIncludeExpensesData(e.target.checked)} 
                        id="inc-exp" 
                      />
                      <label htmlFor="inc-exp" className="form-check-label text-dark">Expenses</label>
                    </div>
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        checked={includeInventoryData} 
                        onChange={e=>setIncludeInventoryData(e.target.checked)} 
                        id="inc-inv-data" 
                      />
                      <label htmlFor="inc-inv-data" className="form-check-label text-dark">Inventory</label>
                    </div>
          </div>
          <div className="mb-4">
                    <label className="form-label fw-semibold text-dark">Group By</label>
                    <select 
                      className="form-select border-0 shadow-sm" 
                      value={customGroupBy} 
                      onChange={e=>setCustomGroupBy(e.target.value as any)}
                      style={{ borderRadius: '16px', height: '45px' }}
                    >
              <option value="none">No Grouping</option>
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="client">Client</option>
              <option value="category">Category</option>
            </select>
          </div>
        </>
      )}

      {/* Format + Generate */}
      <div className="row g-3 align-items-end">
        <div className="col-md-4">
                  <label className="form-label fw-semibold text-dark">Format</label>
                  <select 
                    className="form-select border-0 shadow-sm" 
                    value={format} 
                    onChange={e=>setFormat(e.target.value as any)}
                    style={{ borderRadius: '16px', height: '45px' }}
                  >
            <option value="pdf">PDF (print)</option>
            <option value="excel">Excel (CSV)</option>
            <option value="csv">CSV</option>
          </select>
        </div>
        <div className="col-md-8 d-flex justify-content-end gap-3">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary border-0 shadow-sm" 
                    onClick={() => window.print()}
                    style={{ borderRadius: '12px', height: '45px', padding: '0 1.5rem' }}
                  >
            <Printer size={16} className="me-2"/>
            Preview
          </button>
                  <button 
                    type="submit" 
                    className={`btn ${buttonVariants[type]} border-0 shadow-sm`}
                    style={{ borderRadius: '12px', height: '45px', padding: '0 1.5rem' }}
                  >
            <Download size={16} className="me-2"/>
            Generate Report
          </button>
        </div>
      </div>
            </form>
          </div>
          
          {/* Modal Footer */}
          <div className="modal-footer border-0" style={{ 
            borderTop: '1px solid rgba(0, 0, 0, 0.1)',
            padding: '1rem 2rem'
          }}>
            <button 
              type="button" 
              className="btn btn-secondary border-0 shadow-sm" 
              onClick={onClose}
              style={{ borderRadius: '12px', height: '45px', padding: '0 1.5rem' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


