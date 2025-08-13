"use client"

import React, { useEffect, useMemo, useState } from "react"
import { FormModal } from "@/components/ui/modal"
import { supabase } from "@/lib/supabase-client"
import { Calendar, Download, Printer } from "lucide-react"
import { exportToCSV, printTableHtml, TableColumn } from "./ReportUtils"

type ReportType = 'sales' | 'expenses' | 'inventory' | 'clients' | 'financial' | 'custom'

interface ReportBuilderModalProps {
  isOpen: boolean
  onClose: () => void
  type: ReportType
}

type DateRangeKey = 'today' | 'yesterday' | 'week' | 'lastWeek' | 'month' | 'lastMonth' | 'quarter' | 'year' | 'custom'

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

function computeDateRange(selection: DateRangeKey): { start: Date, end: Date } {
  const today = new Date()
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0)
  const startOfThisWeek = new Date(endOfToday)
  startOfThisWeek.setDate(endOfToday.getDate() - endOfToday.getDay())
  startOfThisWeek.setHours(0,0,0,0)
  const startOfLastWeek = new Date(startOfThisWeek)
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)
  const endOfLastWeek = new Date(startOfThisWeek)
  endOfLastWeek.setDate(endOfLastWeek.getDate() - 1)
  endOfLastWeek.setHours(23,59,59,999)
  const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
  endOfLastMonth.setHours(23,59,59,999)
  const startOfThisQuarter = new Date(today)
  startOfThisQuarter.setMonth(Math.floor(today.getMonth()/3)*3,1)
  startOfThisQuarter.setHours(0,0,0,0)
  const startOfThisYear = new Date(today.getFullYear(), 0, 1)
  switch(selection){
    case 'today': return { start: startOfToday, end: endOfToday }
    case 'yesterday': {
      const yStart = new Date(startOfToday)
      yStart.setDate(yStart.getDate()-1)
      const yEnd = new Date(endOfToday)
      yEnd.setDate(yEnd.getDate()-1)
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
  const [clientOptions, setClientOptions] = useState<{id:number, name:string}[]>([])
  // Financial
  const [financialReportType, setFinancialReportType] = useState<'summary'|'profitLoss'|'balanceSheet'|'cashFlow'>('summary')
  const [comparisonPeriod, setComparisonPeriod] = useState<'none'|'previousPeriod'|'previousYear'>('none')
  // Custom
  const [includeClients, setIncludeClients] = useState(true)
  const [includeSales, setIncludeSales] = useState(true)
  const [includeExpensesData, setIncludeExpensesData] = useState(true)
  const [includeInventoryData, setIncludeInventoryData] = useState(false)
  const [customGroupBy, setCustomGroupBy] = useState<'none'|'day'|'week'|'month'|'client'|'category'>('month')

  // Load clients when opening clients report
  useEffect(() => {
    if (isOpen && type === 'clients') {
      supabase.from('registered_entities').select('id, name').eq('type','client').then(({data}) => setClientOptions((data||[]).map(d=>({id:d.id, name:d.name}))))
    }
  }, [isOpen, type])

  // Reset custom date fields when preset changes
  useEffect(() => {
    if (datePreset !== 'custom') {
      const { start, end } = computeDateRange(datePreset)
      setStartDate(start.toISOString().substring(0,10))
      setEndDate(end.toISOString().substring(0,10))
    }
  }, [datePreset])

  const headerStyle = useMemo(() => ({ background: headerGradients[type], color: '#fff', borderRadius: 12 }), [type])
  const buttonClass = useMemo(() => buttonVariants[type], [type])

  const runAndExport = async () => {
    // eslint-disable-next-line no-console
    console.info('[ReportBuilderModal] generate clicked', { type, datePreset })
    // Build date range
    let start: Date, end: Date
    if (datePreset === 'custom' && startDate && endDate) {
      start = new Date(startDate)
      end = new Date(endDate + 'T23:59:59')
    } else {
      const r = computeDateRange(datePreset)
      start = r.start; end = r.end
    }

    // Execute according to type
    let columns: TableColumn[] = []
    let rows: Record<string, any>[] = []

    if (type === 'sales') {
      console.info('[ReportBuilderModal] running sales query')
      const [invRes, cashRes] = await Promise.all([
        includeInvoices ? supabase.from('invoices').select('date_created, grand_total, client:registered_entities(name)').gte('date_created', start.toISOString()).lte('date_created', end.toISOString()) : Promise.resolve({ data: [] as any[] }),
        includeCashSales ? supabase.from('cash_sales').select('date_created, grand_total, client:registered_entities(name)').gte('date_created', start.toISOString()).lte('date_created', end.toISOString()) : Promise.resolve({ data: [] as any[] }),
      ])
      const data = [...(invRes.data||[]), ...(cashRes.data||[])]
      const keyFn = (r:any) => {
        switch(salesGroupBy){
          case 'day': return new Date(r.date_created).toLocaleDateString()
          case 'week': { const d=new Date(r.date_created); const first=new Date(d); first.setDate(d.getDate()-d.getDay()); return first.toLocaleDateString() }
          case 'month': { const d=new Date(r.date_created); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` }
          case 'client': return r.client?.name || 'Unknown'
          default: return 'All'
        }
      }
      const map = new Map<string, number>()
      data.forEach(r => { const k = keyFn(r); map.set(k, (map.get(k)||0) + Number(r.grand_total||0)) })
      columns = [{key:'group',label:'Group'},{key:'amount',label:'Amount',align:'right'}]
      rows = Array.from(map.entries()).map(([group, amount]) => ({ group, amount: amount.toFixed(2) }))
    }

    if (type === 'expenses') {
      console.info('[ReportBuilderModal] running expenses query')
      const { data } = await supabase.from('expenses').select('date_created, amount, category, department, expense_type').gte('date_created', start.toISOString()).lte('date_created', end.toISOString())
      const keyFn = (r:any) => {
        switch(expensesGroupBy){
          case 'day': return new Date(r.date_created).toLocaleDateString()
          case 'week': { const d=new Date(r.date_created); const first=new Date(d); first.setDate(d.getDate()-d.getDay()); return first.toLocaleDateString() }
          case 'month': { const d=new Date(r.date_created); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` }
          case 'category': return r.category
          case 'department': return r.department || '—'
        }
      }
      const map = new Map<string, number>()
      ;(data||[]).forEach(r => {
        if (!includeClientExpenses && r.expense_type === 'client') return
        if (!includeCompanyExpenses && r.expense_type === 'company') return
        const k = keyFn(r) as string
        map.set(k, (map.get(k)||0) + Number(r.amount||0))
      })
      columns = [{key:'group',label:'Group'},{key:'amount',label:'Amount',align:'right'}]
      rows = Array.from(map.entries()).map(([group, amount]) => ({ group, amount: amount.toFixed(2) }))
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
      const table = `
        <table class="table table-sm table-striped">
          <thead><tr>${columns.map(c=>`<th class="text-${c.align||'start'}">${c.label}</th>`).join('')}</tr></thead>
          <tbody>${rows.map(r=>`<tr>${columns.map(c=>`<td class="text-${c.align||'start'}">${(r as any)[c.key] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>`
      printTableHtml('Report', table)
    } else {
      exportToCSV(filenameBase, columns, rows)
    }
    onClose()
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Report Builder — ${type}`}
      onSubmit={(e) => { e.preventDefault(); runAndExport() }}
      confirmLabel="Generate Report"
      showFooter={false}
      showHeader={false}
      useGlassBody
    >
      {/* Date Range Selection */}
      <div className="row g-3 align-items-end mb-4">
        <div className="col-md-4">
          <label className="form-label fw-semibold">Date Range</label>
          <select className="form-select" value={datePreset} onChange={e=>setDatePreset(e.target.value as DateRangeKey)}>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Current Week</option>
            <option value="lastWeek">Last Week</option>
            <option value="month">Current Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="quarter">Current Quarter</option>
            <option value="year">Current Year</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        {datePreset === 'custom' && (
          <div className="col-md-4">
            <label className="form-label fw-semibold">Start Date</label>
            <input type="date" className="form-control" value={startDate} onChange={e=>setStartDate(e.target.value)} />
          </div>
        )}
        {datePreset === 'custom' && (
          <div className="col-md-4">
            <label className="form-label fw-semibold">End Date</label>
            <input type="date" className="form-control" value={endDate} onChange={e=>setEndDate(e.target.value)} />
          </div>
        )}
      </div>

      {/* Dynamic form content */}
      {type === 'sales' && (
        <>
          <div className="mb-4">
            <label className="form-label fw-semibold">Group By</label>
            <select className="form-select" value={salesGroupBy} onChange={e=>setSalesGroupBy(e.target.value as any)}>
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="client">Client</option>
              <option value="product">Product/Service</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="form-label fw-semibold">Include</label>
            <div className="form-check"><input className="form-check-input" type="checkbox" checked={includeCashSales} onChange={e=>setIncludeCashSales(e.target.checked)} id="inc-cash" /><label htmlFor="inc-cash" className="form-check-label">Cash Sales</label></div>
            <div className="form-check"><input className="form-check-input" type="checkbox" checked={includeInvoices} onChange={e=>setIncludeInvoices(e.target.checked)} id="inc-inv" /><label htmlFor="inc-inv" className="form-check-label">Invoiced Sales</label></div>
          </div>
        </>
      )}

      {type === 'expenses' && (
        <>
          <div className="mb-4">
            <label className="form-label fw-semibold">Group By</label>
            <select className="form-select" value={expensesGroupBy} onChange={e=>setExpensesGroupBy(e.target.value as any)}>
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="category">Category</option>
              <option value="department">Department</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="form-label fw-semibold">Include</label>
            <div className="form-check"><input className="form-check-input" type="checkbox" checked={includeClientExpenses} onChange={e=>setIncludeClientExpenses(e.target.checked)} id="inc-ce" /><label htmlFor="inc-ce" className="form-check-label">Client Expenses</label></div>
            <div className="form-check"><input className="form-check-input" type="checkbox" checked={includeCompanyExpenses} onChange={e=>setIncludeCompanyExpenses(e.target.checked)} id="inc-coe" /><label htmlFor="inc-coe" className="form-check-label">Company Expenses</label></div>
          </div>
        </>
      )}

      {type === 'inventory' && (
        <>
          <div className="mb-4">
            <label className="form-label fw-semibold">Report Type</label>
            <select className="form-select" value={inventoryReportType} onChange={e=>setInventoryReportType(e.target.value as any)}>
              <option value="current">Current Inventory Levels</option>
              <option value="movement">Inventory Movement</option>
              <option value="value">Inventory Valuation</option>
              <option value="lowStock">Low Stock Items</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="form-label fw-semibold">Group By</label>
            <select className="form-select" value={inventoryGroupBy} onChange={e=>setInventoryGroupBy(e.target.value as any)}>
              <option value="category">Category</option>
              <option value="item">Individual Items</option>
            </select>
          </div>
        </>
      )}

      {type === 'clients' && (
        <>
          <div className="mb-4">
            <label className="form-label fw-semibold">Report Type</label>
            <select className="form-select" value={clientReportType} onChange={e=>setClientReportType(e.target.value as any)}>
              <option value="activity">Client Activity</option>
              <option value="sales">Sales by Client</option>
              <option value="balance">Outstanding Balances</option>
              <option value="newClients">New Clients</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="form-label fw-semibold">Client</label>
            <select className="form-select" value={String(clientSelection)} onChange={e=>setClientSelection(e.target.value === 'all'? 'all' : Number(e.target.value))}>
              <option value="all">All Clients</option>
              {clientOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </>
      )}

      {type === 'financial' && (
        <>
          <div className="mb-4">
            <label className="form-label fw-semibold">Report Type</label>
            <select className="form-select" value={financialReportType} onChange={e=>setFinancialReportType(e.target.value as any)}>
              <option value="summary">Financial Summary</option>
              <option value="profitLoss">Profit & Loss Statement</option>
              <option value="balanceSheet">Balance Sheet</option>
              <option value="cashFlow">Cash Flow Statement</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="form-label fw-semibold">Comparison</label>
            <select className="form-select" value={comparisonPeriod} onChange={e=>setComparisonPeriod(e.target.value as any)}>
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
            <label className="form-label fw-semibold">Include Data From</label>
            <div className="form-check"><input className="form-check-input" type="checkbox" checked={includeClients} onChange={e=>setIncludeClients(e.target.checked)} id="inc-cli" /><label htmlFor="inc-cli" className="form-check-label">Clients</label></div>
            <div className="form-check"><input className="form-check-input" type="checkbox" checked={includeSales} onChange={e=>setIncludeSales(e.target.checked)} id="inc-sales" /><label htmlFor="inc-sales" className="form-check-label">Sales</label></div>
            <div className="form-check"><input className="form-check-input" type="checkbox" checked={includeExpensesData} onChange={e=>setIncludeExpensesData(e.target.checked)} id="inc-exp" /><label htmlFor="inc-exp" className="form-check-label">Expenses</label></div>
            <div className="form-check"><input className="form-check-input" type="checkbox" checked={includeInventoryData} onChange={e=>setIncludeInventoryData(e.target.checked)} id="inc-inv-data" /><label htmlFor="inc-inv-data" className="form-check-label">Inventory</label></div>
          </div>
          <div className="mb-4">
            <label className="form-label fw-semibold">Group By</label>
            <select className="form-select" value={customGroupBy} onChange={e=>setCustomGroupBy(e.target.value as any)}>
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
          <label className="form-label">Format</label>
          <select className="form-select" value={format} onChange={e=>setFormat(e.target.value as any)}>
            <option value="pdf">PDF (print)</option>
            <option value="excel">Excel (CSV)</option>
            <option value="csv">CSV</option>
          </select>
        </div>
        <div className="col-md-8 d-flex justify-content-end gap-3">
          <button type="button" className="btn btn-outline-secondary" onClick={() => window.print()}>
            <Printer size={16} className="me-2"/>
            Preview
          </button>
          <button type="button" className="btn btn-add" onClick={runAndExport}>
            <Download size={16} className="me-2"/>
            Generate Report
          </button>
        </div>
      </div>
    </FormModal>
  )
}


