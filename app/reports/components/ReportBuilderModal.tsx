"use client"

import React, { useEffect, useMemo, useState } from "react"
import "../reports.css"
import { supabase } from "@/lib/supabase-client"
import { Calendar, Download, Printer, X, BarChart3, TrendingUp, Users, Package, Wallet, Settings } from "lucide-react"
import { exportToCSV, printTableHtml, TableColumn } from "./ReportUtils"
import { 
  generateSalesReportPDF, 
  generateExpenseReportPDF, 
  generateInventoryReportPDF,
  generateClientReportPDF,
  generateFinancialReportPDF,
  generateTestPDF,
  type SalesReportData,
  type ExpenseReportData,
  type InventoryReportData,
  type ClientReportData,
  type FinancialReportData
} from "@/lib/report-pdf-templates"
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

  if (!isOpen) return null
  
  const [datePreset, setDatePreset] = useState<DateRangeKey>('month')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [format, setFormat] = useState<'pdf'|'excel'|'csv'>('csv')
  
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
  
  // Financial
  const [financialReportType, setFinancialReportType] = useState<'summary'|'profitLoss'|'balanceSheet'|'cashFlow'>('summary')
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

  const testPDFGeneration = async () => {
    try {
      console.log('Testing PDF generation...')
      const { template, inputs } = await generateTestPDF()
      console.log('Template:', template)
      console.log('Inputs:', inputs)
      
      const { generate } = await import('@pdfme/generator')
      const { text, rectangle, line, image } = await import('@pdfme/schemas')
      const pdf = await generate({ template, inputs, plugins: { text, rectangle, line, image } })
      console.log('PDF generated successfully:', pdf)
      
      // Download PDF
      const blob = new Blob([new Uint8Array(pdf.buffer)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'test.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      console.log('Test PDF downloaded successfully')
    } catch (error) {
      console.error('Test PDF generation failed:', error)
    }
  }

  const runAndExport = async () => {
    const { start, end } = computeDateRange(datePreset)
    let rows: any[] = []
    let columns: TableColumn[] = []

    if (type === 'sales') {
      console.info('[ReportBuilderModal] running sales query', { salesGroupBy, includeCashSales, includeInvoices })
      const { data } = await supabase.from('invoices').select('grand_total, date_created, client_id, registered_entities(name)').gte('date_created', start.toISOString()).lte('date_created', end.toISOString())
      if (salesGroupBy === 'client') {
        const byClient = new Map<string, number>()
        ;(data||[]).forEach((i: any) => {
          const k = i.registered_entities?.name || 'unknown'
          byClient.set(k, (byClient.get(k)||0) + Number(i.grand_total||0))
        })
        rows = Array.from(byClient.entries()).map(([client, total]) => ({ client, total: total.toFixed(2) }))
        columns = [{key:'client',label:'Client'}, {key:'total',label:'Total Sales',align:'right'}]
      } else {
        rows = (data||[]).map((i: any) => ({ date: new Date(i.date_created).toLocaleDateString(), client: i.registered_entities?.name, amount: i.grand_total }))
        columns = [{key:'date',label:'Date'}, {key:'client',label:'Client'}, {key:'amount',label:'Amount',align:'right'}]
      }
    }

    if (type === 'expenses') {
      console.info('[ReportBuilderModal] running expenses query', { expensesGroupBy, includeClientExpenses, includeCompanyExpenses })
      const { data } = await supabase.from('expenses').select('amount, date_created, category').gte('date_created', start.toISOString()).lte('date_created', end.toISOString())
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
        const { data } = await supabase.from('stock_items').select('name, category, quantity, reorder_level, unit_price')
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
        const { data } = await supabase.from('stock_movements').select('created_at, item_id, quantity, type, stock_items(name, category)')
        const map = new Map<string, number>()
        ;(data||[]).forEach((m: any) => {
          const k = inventoryGroupBy === 'category' ? (m.stock_items?.category || 'other') : (m.stock_items?.name || 'unknown')
          const qty = Number(m.quantity || 0) * (m.type === 'out' ? -1 : 1)
          map.set(k, (map.get(k)||0) + qty)
        })
        rows = Array.from(map.entries()).map(([group, qty]) => ({ group, qty }))
        columns = [{key:'group',label:'Group'}, {key:'qty',label:'Net Movement',align:'right'}]
      }
    }

    if (type === 'clients') {
      console.info('[ReportBuilderModal] running clients query')
      const [{ data: invoices }, { data: payments }, { data: clients }] = await Promise.all([
        supabase.from('invoices').select('client_id, grand_total').gte('date_created', start.toISOString()).lte('date_created', end.toISOString()),
        supabase.from('payments').select('client_id, amount').gte('date_created', start.toISOString()).lte('date_created', end.toISOString()),
        supabase.from('registered_entities').select('id, name').eq('type','client')
      ])
      const byClient = new Map<number, {name:string, sales:number, payments:number}>()
      ;(clients||[]).forEach((c: any) => byClient.set(c.id, { name: c.name, sales:0, payments:0 }))
      ;(invoices||[]).forEach((i: any) => { const r = byClient.get(i.client_id); if (r) r.sales += Number(i.grand_total||0) })
      ;(payments||[]).forEach((p: any) => { const r = byClient.get(p.client_id); if (r) r.payments += Number(p.amount||0) })
      const list = Array.from(byClient.entries()).map(([id, v]) => ({ client: v.name, sales: v.sales, payments: v.payments, balance: v.sales - v.payments }))
      rows = clientSelection === 'all' ? list : list.filter((r: any) => byClient.get(clientSelection as number)?.name === r.client)
      columns = [{key:'client',label:'Client'},{key:'sales',label:'Sales',align:'right'},{key:'payments',label:'Payments',align:'right'},{key:'balance',label:'Balance',align:'right'}]
    }

    if (type === 'financial') {
      console.info('[ReportBuilderModal] running financial query')
      const [{ data: inv }, { data: exp }] = await Promise.all([
        supabase.from('invoices').select('grand_total').gte('date_created', start.toISOString()).lte('date_created', end.toISOString()),
        supabase.from('expenses').select('amount').gte('date_created', start.toISOString()).lte('date_created', end.toISOString()),
      ])
      const sales = (inv||[]).reduce((s: any,i: any)=>s+Number(i.grand_total||0),0)
      const expenses = (exp||[]).reduce((s: any,i: any)=>s+Number(i.amount||0),0)
      const net = sales - expenses
      rows = [ { metric: 'Sales', amount: sales.toFixed(2) }, { metric: 'Expenses', amount: (-expenses).toFixed(2) }, { metric: 'Net', amount: net.toFixed(2) } ]
      columns = [{key:'metric',label:'Metric'},{key:'amount',label:'Amount',align:'right'}]
    }

    if (type === 'custom') {
      console.info('[ReportBuilderModal] running custom summary')
      // very simple combined totals demo
      const tasks: Promise<any>[] = []
      if (includeClients) tasks.push(Promise.resolve(supabase.from('registered_entities').select('id').eq('type','client')))
      if (includeSales) tasks.push(Promise.resolve(supabase.from('invoices').select('grand_total')))
      if (includeExpensesData) tasks.push(Promise.resolve(supabase.from('expenses').select('amount')))
      if (includeInventoryData) tasks.push(Promise.resolve(supabase.from('stock_items').select('unit_price, quantity')))
      const results = await Promise.all(tasks)
      const summary: Record<string, number> = {}
      let idx = 0
      if (includeClients) { summary.clients = (results[idx++].data||[]).length }
      if (includeSales) { summary.sales = (results[idx++].data||[]).reduce((s: any,i: any)=>s+Number(i.grand_total||0),0) }
      if (includeExpensesData) { summary.expenses = (results[idx++].data||[]).reduce((s: any,i: any)=>s+Number(i.amount||0),0) }
      if (includeInventoryData) { summary.stockValue = (results[idx++].data||[]).reduce((s: any,i: any)=>s+Number(i.unit_price||0)*Number(i.quantity||0),0) }
      rows = Object.entries(summary).map(([k,v]) => ({ metric: k, value: v.toFixed(2) }))
      columns = [{key:'metric',label:'Metric'},{key:'value',label:'Value',align:'right'}]
    }

    // Export/Print
    const filenameBase = `${type}_report_${new Date().toISOString().slice(0,10)}`
    
    if (format === 'pdf') {
      try {
        // Generate PDF based on report type
        if (type === 'sales') {
          const salesData: SalesReportData = {
            companyName: "CABINET MASTER STYLES & FINISHES",
            companyLocation: "Location: Ruiru Eastern By-Pass",
            companyPhone: "Tel: +254729554475",
            companyEmail: "Email: cabinetmasterstyles@gmail.com",
            reportTitle: "Sales Report",
            reportDate: new Date().toLocaleDateString(),
            reportPeriod: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
            reportType: salesGroupBy,
            reportGenerated: new Date().toLocaleDateString(),
            reportNumber: `SR-${Date.now()}`,
            items: rows.map((r: any) => ({
              date: r.date || new Date().toLocaleDateString(),
              client: r.client || 'N/A',
              invoice: r.invoice || 'N/A',
              amount: parseFloat(r.total || r.amount || '0'),
              status: r.status || 'Active'
            })),
            summary: `Sales report generated for ${salesGroupBy} grouping. Total sales: ${formatCurrency(rows.reduce((sum: number, r: any) => sum + parseFloat(r.total || r.amount || '0'), 0))}`,
            totalSales: rows.reduce((sum: number, r: any) => sum + parseFloat(r.total || r.amount || '0'), 0),
            preparedBy: "System",
            approvedBy: "Management"
          };
          
          const { template, inputs } = await generateSalesReportPDF(salesData);
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
          
          const { template, inputs } = await generateFinancialReportPDF(financialData);
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
            <button 
              type="button" 
              className="btn btn-info border-0 shadow-sm" 
              onClick={testPDFGeneration}
              style={{ borderRadius: '12px', height: '45px', padding: '0 1.5rem' }}
            >
              Test PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


