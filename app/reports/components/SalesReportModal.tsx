"use client"

import React, { useEffect, useMemo, useState } from "react"
import { X, Download, Printer, FileText, Calendar, Search, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { FormModal } from "@/components/ui/modal"
import { exportToCSV, printTableHtml, TableColumn } from "./ReportUtils"

interface SalesReportModalProps {
  isOpen: boolean
  onClose: () => void
  dateFrom?: string
  dateTo?: string
}

type SalesRow = {
  date: string
  quotation_number?: string
  order_number?: string
  invoice_number?: string
  sale_number?: string
  client: string
  type: "Quotation" | "Sales Order" | "Invoice" | "Cash Sale" | "Payment"
  status?: string
  amount: number
}

// Currency formatting
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2
  }).format(amount)
}

export default function SalesReportModal({ isOpen, onClose, dateFrom, dateTo }: SalesReportModalProps) {
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<SalesRow[]>([])
  
  // Filter states
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [clientSearchTerm, setClientSearchTerm] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [documentTypes, setDocumentTypes] = useState({
    quotations: true,
    salesOrders: true,
    invoices: true,
    cashSales: true
  })
  const [groupBy, setGroupBy] = useState<'none' | 'day' | 'week' | 'month' | 'client'>('none')
  
  // Client options
  const [clientOptions, setClientOptions] = useState<Array<{id: number, name: string}>>([])

  // Load client options
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

  // Filter clients by search term
  const filteredClients = useMemo(() => {
    if (!clientSearchTerm) return clientOptions
    return clientOptions.filter(c => 
      c.name.toLowerCase().includes(clientSearchTerm.toLowerCase())
    )
  }, [clientOptions, clientSearchTerm])

  useEffect(() => {
    if (!isOpen) return
    loadData()
  }, [isOpen, dateFrom, dateTo, documentTypes, selectedClientId])

  const loadData = async () => {
    setLoading(true)
    try {
      const combined: SalesRow[] = []
      
      // Build queries based on selected document types
      const queries = []
      
      if (documentTypes.quotations) {
        let query = supabase
          .from("quotations")
          .select("quotation_number, date_created, grand_total, status, client:registered_entities(name)")
          .order('date_created', { ascending: false })
        
        if (selectedClientId) {
          query = query.eq('client_id', parseInt(selectedClientId))
        }
        
        queries.push(query.then(({ data }) => {
          ;(data || []).forEach(q => combined.push({
            date: q.date_created ? new Date(q.date_created as any).toLocaleDateString() : '',
            quotation_number: q.quotation_number,
            client: q.client?.name || '-',
            type: "Quotation",
            status: q.status,
            amount: Number(q.grand_total || 0)
          }))
        }))
      }

      if (documentTypes.salesOrders) {
        let query = supabase
          .from("sales_orders")
          .select("order_number, date_created, grand_total, status, client:registered_entities(name)")
          .order('date_created', { ascending: false })
        
        if (selectedClientId) {
          query = query.eq('client_id', parseInt(selectedClientId))
        }
        
        queries.push(query.then(({ data }) => {
          ;(data || []).forEach(o => combined.push({
            date: o.date_created ? new Date(o.date_created as any).toLocaleDateString() : '',
            order_number: o.order_number,
            client: o.client?.name || '-',
            type: "Sales Order",
            status: o.status,
            amount: Number(o.grand_total || 0)
          }))
        }))
      }

      if (documentTypes.invoices) {
        let query = supabase
          .from("invoices")
          .select("invoice_number, date_created, grand_total, status, client:registered_entities(name)")
          .order('date_created', { ascending: false })
        
        if (selectedClientId) {
          query = query.eq('client_id', parseInt(selectedClientId))
        }
        
        queries.push(query.then(({ data }) => {
          ;(data || []).forEach(i => combined.push({
            date: i.date_created ? new Date(i.date_created as any).toLocaleDateString() : '',
            invoice_number: i.invoice_number,
            client: i.client?.name || '-',
            type: "Invoice",
            status: i.status,
            amount: Number(i.grand_total || 0)
          }))
        }))
      }

      if (documentTypes.cashSales) {
        let query = supabase
          .from("cash_sales")
          .select("sale_number, date_created, grand_total, status, client:registered_entities(name)")
          .order('date_created', { ascending: false })
        
        if (selectedClientId) {
          query = query.eq('client_id', parseInt(selectedClientId))
        }
        
        queries.push(query.then(({ data }) => {
          ;(data || []).forEach(s => combined.push({
            date: s.date_created ? new Date(s.date_created as any).toLocaleDateString() : '',
            sale_number: s.sale_number,
            client: s.client?.name || '-',
            type: "Cash Sale",
            status: s.status || 'completed',
            amount: Number(s.grand_total || 0)
          }))
        }))
      }

      await Promise.all(queries)

      // Optional date filtering on client side
      const start = dateFrom ? new Date(dateFrom) : null
      const end = dateTo ? new Date(dateTo + 'T23:59:59') : null
      const filtered = combined.filter(r => {
        if (!r.date) return true
        const d = new Date(r.date)
        if (start && d < start) return false
        if (end && d > end) return false
        return true
      })
      
      // Sort by date descending
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      setRows(filtered)
    } finally {
      setLoading(false)
    }
  }

  const columns: TableColumn[] = useMemo(() => [
    { key: 'date', label: 'Date' },
    { key: 'type', label: 'Type' },
    { key: 'client', label: 'Client' },
    { key: 'quotation_number', label: 'Quotation #' },
    { key: 'order_number', label: 'Order #' },
    { key: 'invoice_number', label: 'Invoice #' },
    { key: 'sale_number', label: 'Sale #' },
    { key: 'status', label: 'Status' },
    { key: 'amount', label: 'Amount', align: 'right' },
  ], [])

  const total = rows.reduce((sum, r) => sum + (r.amount || 0), 0)

  const handleExport = () => exportToCSV('sales-report', columns, rows)

  const handlePrint = () => {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #333;">CABINET MASTER STYLES & FINISHES</h2>
          <p style="margin: 5px 0; color: #666;">Ruiru Eastern By-Pass | Tel: +254729554475</p>
        </div>
        <h3 style="text-align: center; color: #444; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">SALES REPORT</h3>
        <p style="text-align: center; color: #666;">Period: ${dateFrom || 'All'} - ${dateTo || 'All'}</p>
        ${selectedClientId ? `<p style="text-align: center; color: #666;"><strong>Client:</strong> ${clientOptions.find(c => c.id.toString() === selectedClientId)?.name}</p>` : ''}
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background: #f8f9fa;">
              ${columns.map(c => `<th style="border: 1px solid #ddd; padding: 10px; text-align: ${c.align || 'left'};">${c.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map((r, idx) => `
              <tr style="background: ${idx % 2 === 0 ? '#fff' : '#f8f9fa'};">
                ${columns.map(c => {
                  let value = r[c.key as keyof SalesRow]
                  if (c.key === 'amount') value = formatCurrency(r.amount)
                  return `<td style="border: 1px solid #ddd; padding: 8px; text-align: ${c.align || 'left'};">${value ?? '-'}</td>`
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #e9ecef; font-weight: bold;">
              ${columns.map(c => c.key === 'amount' ? `<th style="border: 1px solid #ddd; padding: 10px; text-align: right;">${formatCurrency(total)}</th>` : '<th style="border: 1px solid #ddd; padding: 10px;"></th>').join('')}
            </tr>
          </tfoot>
        </table>
        <div style="margin-top: 30px; display: flex; justify-content: space-between;">
          <div>
            <p><strong>Total Records:</strong> ${rows.length}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <div style="text-align: right;">
            <p><strong>Prepared by:</strong> _______________</p>
            <p><strong>Approved by:</strong> _______________</p>
          </div>
        </div>
      </div>
    `
    printTableHtml('Sales Report', html)
  }

  // Clear client selection
  const clearClientSelection = () => {
    setSelectedClientId('')
    setClientSearchTerm('')
  }

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title="Sales Reports" onSubmit={() => {}} showFooter={false} className="sm:max-w-[1200px]">
      {/* Filter Controls */}
      <div className="row g-3 mb-4 align-items-end">
        <div className="col-md-3">
          <label className="form-label fw-semibold text-dark small">Group By</label>
          <select 
            className="form-select border-0 shadow-sm" 
            value={groupBy}
            onChange={e => setGroupBy(e.target.value as any)}
            style={{ borderRadius: '12px', height: '42px' }}
          >
            <option value="none">No Grouping</option>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="client">Client</option>
          </select>
        </div>
        
        <div className="col-md-4">
          <label className="form-label fw-semibold text-dark small">Select Client</label>
          <div className="position-relative">
            <div className="input-group">
              <span className="input-group-text border-0 bg-white" style={{ borderRadius: '12px 0 0 12px' }}>
                <Search size={14} className="text-muted" />
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
                style={{ borderRadius: '0', height: '42px' }}
              />
              {selectedClientId && (
                <button 
                  type="button"
                  className="btn btn-outline-secondary border-0"
                  onClick={clearClientSelection}
                  style={{ borderRadius: '0 12px 12px 0' }}
                >
                  <X size={14} />
                </button>
              )}
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
                  className="p-2 border-bottom text-muted small"
                  onClick={() => {
                    clearClientSelection()
                    setShowClientDropdown(false)
                  }}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
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
                      backgroundColor: selectedClientId === client.id.toString() ? '#e7f3ff' : 'transparent'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = selectedClientId === client.id.toString() ? '#e7f3ff' : 'transparent'}
                  >
                    {client.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="col-md-5">
          <label className="form-label fw-semibold text-dark small">Include Documents</label>
          <div className="d-flex flex-wrap gap-3">
            <div className="form-check">
              <input 
                className="form-check-input" 
                type="checkbox" 
                checked={documentTypes.quotations} 
                onChange={e => setDocumentTypes({...documentTypes, quotations: e.target.checked})} 
              />
              <label className="form-check-label small">Quotations</label>
            </div>
            <div className="form-check">
              <input 
                className="form-check-input" 
                type="checkbox" 
                checked={documentTypes.salesOrders} 
                onChange={e => setDocumentTypes({...documentTypes, salesOrders: e.target.checked})} 
              />
              <label className="form-check-label small">Sales Orders</label>
            </div>
            <div className="form-check">
              <input 
                className="form-check-input" 
                type="checkbox" 
                checked={documentTypes.invoices} 
                onChange={e => setDocumentTypes({...documentTypes, invoices: e.target.checked})} 
              />
              <label className="form-check-label small">Invoices</label>
            </div>
            <div className="form-check">
              <input 
                className="form-check-input" 
                type="checkbox" 
                checked={documentTypes.cashSales} 
                onChange={e => setDocumentTypes({...documentTypes, cashSales: e.target.checked})} 
              />
              <label className="form-check-label small">Cash Sales</label>
            </div>
          </div>
        </div>
      </div>

      {/* Info Bar */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="text-muted d-flex align-items-center gap-2">
          <Calendar size={16} />
          <span>{dateFrom || 'All'} – {dateTo || 'All'}</span>
          {selectedClientId && (
            <span className="badge bg-primary ms-2">
              {clientOptions.find(c => c.id.toString() === selectedClientId)?.name}
            </span>
          )}
          <span className="badge bg-secondary ms-2">{rows.length} records</span>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
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
              <tr><td colSpan={columns.length}><div className="text-center text-muted py-3">No data in range</div></td></tr>
            ) : (
              rows.map((r, idx) => (
                <tr key={idx}>
                  {columns.map(c => (
                    <td key={c.key} className={c.align === 'right' ? 'text-end' : c.align === 'center' ? 'text-center' : ''}>
                      {c.key === 'amount' ? formatCurrency(r.amount) : (r as any)[c.key] || '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="table-light">
            <tr className="fw-bold">
              {columns.map(c => (
                <th key={c.key} className={c.align === 'right' ? 'text-end' : c.align === 'center' ? 'text-center' : ''}>
                  {c.key === 'amount' ? formatCurrency(total) : ''}
                </th>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
      
      {/* Footer with action buttons */}
      <div className="border-top mt-4 pt-3">
        <div className="d-flex justify-content-between">
          <button className="btn btn-outline-secondary" onClick={onClose}>
            Close
          </button>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-primary" onClick={loadData}>
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
