"use client"

import React, { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { FormModal } from "@/components/ui/modal"
import { Download, Printer, Wallet, Search, Eye, X } from "lucide-react"
import { exportToCSV, printTableHtml, TableColumn } from "./ReportUtils"
import { useGlobalProgress } from "@/components/GlobalProgressManager"

interface ExpenseReportModalProps {
  isOpen: boolean
  onClose: () => void
  dateFrom?: string
  dateTo?: string
}

type Row = {
  date: string
  expense_number?: string
  category: string
  expense_type?: string
  department?: string
  client_name?: string
  amount: number
  description?: string
}

// Currency formatting
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2
  }).format(amount)
}

export default function ExpenseReportModal({ isOpen, onClose, dateFrom, dateTo }: ExpenseReportModalProps) {
  const { startDownload, completeDownload, setError } = useGlobalProgress()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  
  // Filter states
  const [expenseType, setExpenseType] = useState<'all' | 'company' | 'client'>('all')
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [clientSearchTerm, setClientSearchTerm] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  
  // Options
  const [clientOptions, setClientOptions] = useState<Array<{id: number, name: string}>>([])
  const [categoryOptions, setCategoryOptions] = useState<string[]>([])
  
  // Preview state
  const [previewMode, setPreviewMode] = useState(false)

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
      
      // Load category options
      supabase.from('expenses')
        .select('category')
        .then(({ data }) => {
          const categories = [...new Set((data || []).map(e => e.category).filter(Boolean))]
          setCategoryOptions(categories.sort())
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

  const fetchData = async () => {
    setLoading(true)
    try {
      let query = supabase.from('expenses')
        .select(`
          *,
          client:registered_entities!expenses_client_id_fkey(id, name)
        `)
        .order('date_created', { ascending: false })
      
      // Apply expense type filter
      if (expenseType !== 'all') {
        query = query.eq('expense_type', expenseType)
      }
      
      // Apply client filter (only when expense type is 'client')
      if (selectedClientId && expenseType === 'client') {
        query = query.eq('client_id', parseInt(selectedClientId))
      }
      
      // Apply category filter
      if (selectedCategory) {
        query = query.eq('category', selectedCategory)
      }
      
      const { data } = await query
      
      let mapped: Row[] = (data || []).map(e => ({
        date: e.date_created ? new Date(e.date_created as any).toLocaleDateString() : '',
        expense_number: e.expense_number,
        category: e.category,
        expense_type: e.expense_type,
        department: e.department,
        client_name: e.client?.name || '-',
        amount: Number(e.amount || 0),
        description: e.description || ''
      }))
      
      // Client-side date filter
      const start = dateFrom ? new Date(dateFrom) : null
      const end = dateTo ? new Date(dateTo + 'T23:59:59') : null
      if (start || end) {
        mapped = mapped.filter(r => {
          if (!r.date) return true
          const d = new Date(r.date)
          if (start && d < start) return false
          if (end && d > end) return false
          return true
        })
      }
      
      setRows(mapped)
    } finally { 
      setLoading(false) 
    }
  }

  useEffect(() => {
    if (!isOpen) return
    fetchData()
  }, [isOpen, dateFrom, dateTo, expenseType, selectedClientId, selectedCategory])

  const columns: TableColumn[] = useMemo(() => [
    { key: 'date', label: 'Date' },
    { key: 'expense_number', label: 'Expense #' },
    { key: 'category', label: 'Category' },
    { key: 'department', label: 'Department' },
    { key: 'expense_type', label: 'Type' },
    { key: 'client_name', label: 'Client' },
    { key: 'description', label: 'Description' },
    { key: 'amount', label: 'Amount', align: 'right' },
  ], [])

  const total = rows.reduce((s, r) => s + (r.amount || 0), 0)

  const handleExport = () => {
    startDownload('expense-report', 'csv')
    try {
      exportToCSV('expense-report', columns, rows)
      setTimeout(() => completeDownload(), 500)
    } catch (error) {
      setError('Failed to export report')
    }
  }
  
  const handlePrint = () => {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #333;">CABINET MASTER STYLES & FINISHES</h2>
          <p style="margin: 5px 0; color: #666;">Ruiru Eastern By-Pass | Tel: +254729554475</p>
        </div>
        <h3 style="text-align: center; color: #444; border-bottom: 2px solid #ef4444; padding-bottom: 10px;">EXPENSE REPORT</h3>
        <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
          <span>Period: ${dateFrom || 'All'} - ${dateTo || 'All'}</span>
          <span>Type: ${expenseType === 'all' ? 'All Expenses' : expenseType === 'company' ? 'Company' : 'Client'}</span>
          ${selectedClientId && clientOptions.find(c => c.id.toString() === selectedClientId) ? 
            `<span>Client: ${clientOptions.find(c => c.id.toString() === selectedClientId)?.name}</span>` : ''}
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f8f9fa;">
              ${columns.map(c => `<th style="border: 1px solid #ddd; padding: 10px; text-align: ${c.align || 'left'};">${c.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map((r, idx) => `
              <tr style="background: ${idx % 2 === 0 ? '#fff' : '#f8f9fa'};">
                ${columns.map(c => `<td style="border: 1px solid #ddd; padding: 8px; text-align: ${c.align || 'left'};">${c.key === 'amount' ? formatCurrency(r.amount) : (r as any)[c.key] ?? ''}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #e9ecef; font-weight: bold;">
              ${columns.map(c => c.key === 'amount' ? `<th style="border: 1px solid #ddd; padding: 10px; text-align: right;">${formatCurrency(total)}</th>` : '<th style="border: 1px solid #ddd; padding: 10px;"></th>').join('')}
            </tr>
          </tfoot>
        </table>
        <div style="margin-top: 20px; display: flex; justify-content: space-between;">
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
    printTableHtml('Expense Report', html)
  }

  // Clear client selection
  const clearClientSelection = () => {
    setSelectedClientId('')
    setClientSearchTerm('')
  }

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title="Expense Reports" onSubmit={() => {}} showFooter={false} className="sm:max-w-[1200px]">
      {/* Filter Controls */}
      <div className="row g-3 mb-4 align-items-end">
        <div className="col-md-3">
          <label className="form-label fw-semibold text-dark small">Group By</label>
          <select 
            className="form-select border-0 shadow-sm" 
            value="none"
            style={{ borderRadius: '12px', height: '42px' }}
          >
            <option value="none">No Grouping</option>
            <option value="category">Category</option>
            <option value="department">Department</option>
          </select>
        </div>
        
        <div className="col-md-3">
          <label className="form-label fw-semibold text-dark small">Expense Type</label>
          <select 
            className="form-select border-0 shadow-sm" 
            value={expenseType}
            onChange={e => {
              setExpenseType(e.target.value as any)
              if (e.target.value !== 'client') {
                clearClientSelection()
              }
            }}
            style={{ borderRadius: '12px', height: '42px' }}
          >
            <option value="all">All Expenses</option>
            <option value="company">Company Only</option>
            <option value="client">Client Only</option>
          </select>
        </div>
        
        {/* Client Selection - Only shown when expense type is 'client' */}
        {expenseType === 'client' && (
          <div className="col-md-3">
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
        )}
        
        <div className="col-md-3">
          <label className="form-label fw-semibold text-dark small">Category</label>
          <select 
            className="form-select border-0 shadow-sm" 
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            style={{ borderRadius: '12px', height: '42px' }}
          >
            <option value="">All Categories</option>
            {categoryOptions.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Info Bar */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="text-muted d-flex align-items-center gap-2">
          <Wallet size={16} />
          <span>
            {expenseType === 'all' ? 'All expenses' : 
             expenseType === 'company' ? 'Company expenses' : 
             `Client expenses${selectedClientId ? ` - ${clientOptions.find(c => c.id.toString() === selectedClientId)?.name}` : ''}`}
          </span>
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
              <tr><td colSpan={columns.length}><div className="text-center text-muted py-3">No data found</div></td></tr>
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
            <tr>
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
            <button className="btn btn-outline-primary" onClick={() => setPreviewMode(!previewMode)}>
              <Eye size={14} className="me-1"/>Preview
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
