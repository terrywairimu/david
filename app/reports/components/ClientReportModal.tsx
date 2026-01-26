"use client"

import React, { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { FormModal } from "@/components/ui/modal"
import { Download, Printer, Users, Search, Eye, X } from "lucide-react"
import { exportToCSV, printTableHtml, TableColumn } from "./ReportUtils"

interface ClientReportModalProps {
  isOpen: boolean
  onClose: () => void
}

type ClientReportType = 'summary' | 'statement' | 'aging' | 'activity'

type ClientRow = {
  id: number
  name: string
  phone?: string
  location?: string
  total_quotations: number
  total_orders: number
  total_invoices: number
  total_payments: number
  total_expenses: number
  balance: number
}

// Currency formatting
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2
  }).format(amount)
}

export default function ClientReportModal({ isOpen, onClose }: ClientReportModalProps) {
  const [rows, setRows] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(false)
  
  // Filter states
  const [reportType, setReportType] = useState<ClientReportType>('summary')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  
  // Client options for dropdown
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
  const filteredClientOptions = useMemo(() => {
    if (!searchTerm) return clientOptions
    return clientOptions.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [clientOptions, searchTerm])

  useEffect(() => {
    if (!isOpen) return
    fetchData()
  }, [isOpen, selectedClientId])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Build client query
      let clientQuery = supabase.from('registered_entities')
        .select('id, name, phone, location')
        .eq('type', 'client')
        .eq('status', 'active')
        .order('name')
      
      if (selectedClientId) {
        clientQuery = clientQuery.eq('id', parseInt(selectedClientId))
      }
      
      const [{ data: clients }, { data: quotations }, { data: orders }, { data: invoices }, { data: payments }, { data: expenses }] = await Promise.all([
        clientQuery,
        supabase.from('quotations').select('id, client_id, grand_total'),
        supabase.from('sales_orders').select('id, client_id, grand_total'),
        supabase.from('invoices').select('id, client_id, grand_total, paid_amount'),
        supabase.from('payments').select('id, client_id, amount').eq('status', 'completed'),
        supabase.from('expenses').select('id, client_id, amount').eq('expense_type', 'client')
      ])

      const byClient = new Map<number, ClientRow>()
      ;(clients || []).forEach(c => {
        byClient.set(c.id, { 
          id: c.id,
          name: c.name, 
          phone: c.phone || '-', 
          location: c.location || '-', 
          total_quotations: 0, 
          total_orders: 0, 
          total_invoices: 0, 
          total_payments: 0,
          total_expenses: 0,
          balance: 0
        })
      })
      
      ;(quotations || []).forEach(q => { 
        const r = byClient.get(q.client_id)
        if (r) r.total_quotations += Number(q.grand_total || 0) 
      })
      ;(orders || []).forEach(o => { 
        const r = byClient.get(o.client_id)
        if (r) r.total_orders += Number(o.grand_total || 0) 
      })
      ;(invoices || []).forEach(i => { 
        const r = byClient.get(i.client_id)
        if (r) r.total_invoices += Number(i.grand_total || 0) 
      })
      ;(payments || []).forEach(p => { 
        const r = byClient.get(p.client_id)
        if (r) r.total_payments += Number(p.amount || 0) 
      })
      ;(expenses || []).forEach(e => { 
        const r = byClient.get(e.client_id)
        if (r) r.total_expenses += Number(e.amount || 0) 
      })
      
      // Calculate balance (orders - payments)
      byClient.forEach(client => {
        client.balance = client.total_orders - client.total_payments
      })

      setRows(Array.from(byClient.values()))
    } finally {
      setLoading(false)
    }
  }

  // Filter rows by search term
  const filteredRows = useMemo(() => {
    if (!searchTerm) return rows
    return rows.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [rows, searchTerm])

  const columns: TableColumn[] = useMemo(() => [
    { key: 'name', label: 'Client Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'location', label: 'Location' },
    { key: 'total_quotations', label: 'Quotations', align: 'right' },
    { key: 'total_orders', label: 'Orders', align: 'right' },
    { key: 'total_payments', label: 'Paid', align: 'right' },
    { key: 'total_expenses', label: 'Expenses', align: 'right' },
    { key: 'balance', label: 'Balance', align: 'right' },
  ], [])

  const totals = filteredRows.reduce((acc, r) => ({
    quotations: acc.quotations + r.total_quotations,
    orders: acc.orders + r.total_orders,
    invoices: acc.invoices + r.total_invoices,
    payments: acc.payments + r.total_payments,
    expenses: acc.expenses + r.total_expenses,
    balance: acc.balance + r.balance,
  }), { quotations: 0, orders: 0, invoices: 0, payments: 0, expenses: 0, balance: 0 })

  const handleExport = () => exportToCSV('client-report', columns, filteredRows)
  
  const handlePrint = () => {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #333;">CABINET MASTER STYLES & FINISHES</h2>
          <p style="margin: 5px 0; color: #666;">Ruiru Eastern By-Pass | Tel: +254729554475</p>
        </div>
        <h3 style="text-align: center; color: #444; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">CLIENT SUMMARY REPORT</h3>
        <p style="text-align: center; color: #666;">Generated: ${new Date().toLocaleString()}</p>
        ${selectedClientId ? `<p style="text-align: center; color: #666;"><strong>Client:</strong> ${clientOptions.find(c => c.id.toString() === selectedClientId)?.name}</p>` : ''}
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background: #f8f9fa;">
              ${columns.map(c => `<th style="border: 1px solid #ddd; padding: 10px; text-align: ${c.align || 'left'};">${c.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${filteredRows.map((r, idx) => `
              <tr style="background: ${idx % 2 === 0 ? '#fff' : '#f8f9fa'};">
                ${columns.map(c => {
                  let value = (r as any)[c.key]
                  if (typeof value === 'number') value = formatCurrency(value)
                  return `<td style="border: 1px solid #ddd; padding: 8px; text-align: ${c.align || 'left'};">${value ?? '-'}</td>`
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #e9ecef; font-weight: bold;">
              <td style="border: 1px solid #ddd; padding: 10px;">TOTALS</td>
              <td style="border: 1px solid #ddd; padding: 10px;"></td>
              <td style="border: 1px solid #ddd; padding: 10px;"></td>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${formatCurrency(totals.quotations)}</td>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${formatCurrency(totals.orders)}</td>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${formatCurrency(totals.payments)}</td>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${formatCurrency(totals.expenses)}</td>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${formatCurrency(totals.balance)}</td>
            </tr>
          </tfoot>
        </table>
        <div style="margin-top: 30px; display: flex; justify-content: space-between;">
          <div>
            <p><strong>Total Clients:</strong> ${filteredRows.length}</p>
          </div>
          <div style="text-align: right;">
            <p><strong>Prepared by:</strong> _______________</p>
            <p><strong>Approved by:</strong> _______________</p>
          </div>
        </div>
      </div>
    `
    printTableHtml('Client Report', html)
  }

  // Clear client selection
  const clearClientSelection = () => {
    setSelectedClientId('')
    setSearchTerm('')
  }

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title="Client Reports" onSubmit={() => {}} showFooter={false} className="sm:max-w-[1200px]">
      {/* Filter Controls */}
      <div className="row g-3 mb-4 align-items-end">
        <div className="col-md-4">
          <label className="form-label fw-semibold text-dark small">Report Type</label>
          <select 
            className="form-select border-0 shadow-sm" 
            value={reportType}
            onChange={e => setReportType(e.target.value as ClientReportType)}
            style={{ borderRadius: '12px', height: '42px' }}
          >
            <option value="summary">Client Summary</option>
            <option value="statement">Client Statement</option>
            <option value="aging">Aging Report</option>
            <option value="activity">Activity Report</option>
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
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value)
                  setShowClientDropdown(true)
                }}
                onFocus={() => setShowClientDropdown(true)}
                placeholder="Search or select client..."
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
            
            {showClientDropdown && filteredClientOptions.length > 0 && (
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
                {filteredClientOptions.map(client => (
                  <div 
                    key={client.id}
                    className="p-2 border-bottom"
                    onClick={() => {
                      setSelectedClientId(client.id.toString())
                      setSearchTerm(client.name)
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
        
        <div className="col-md-4 d-flex align-items-end justify-content-end">
          <span className="badge bg-primary">{filteredRows.length} clients</span>
        </div>
      </div>

      {/* Info Bar */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="text-muted d-flex align-items-center gap-2">
          <Users size={16} />
          <span>
            {selectedClientId ? 
              `Client: ${clientOptions.find(c => c.id.toString() === selectedClientId)?.name}` : 
              'All active clients with financial summaries'}
          </span>
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
            ) : filteredRows.length === 0 ? (
              <tr><td colSpan={columns.length}><div className="text-center text-muted py-3">No clients found</div></td></tr>
            ) : (
              filteredRows.map((r, idx) => (
                <tr key={idx}>
                  {columns.map(c => {
                    let value = (r as any)[c.key]
                    const isNumeric = ['total_quotations','total_orders','total_invoices','total_payments','total_expenses','balance'].includes(c.key)
                    if (isNumeric) value = formatCurrency(value)
                    const isNegative = c.key === 'balance' && r.balance < 0
                    return (
                      <td 
                        key={c.key} 
                        className={`${c.align === 'right' ? 'text-end' : c.align === 'center' ? 'text-center' : ''} ${isNegative ? 'text-danger' : ''}`}
                      >
                        {value || '-'}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="table-light">
            <tr className="fw-bold">
              <td>TOTALS</td>
              <td></td>
              <td></td>
              <td className="text-end">{formatCurrency(totals.quotations)}</td>
              <td className="text-end">{formatCurrency(totals.orders)}</td>
              <td className="text-end">{formatCurrency(totals.payments)}</td>
              <td className="text-end">{formatCurrency(totals.expenses)}</td>
              <td className={`text-end ${totals.balance < 0 ? 'text-danger' : ''}`}>{formatCurrency(totals.balance)}</td>
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
            <button className="btn btn-outline-primary" onClick={fetchData}>
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
