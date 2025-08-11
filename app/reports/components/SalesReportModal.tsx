"use client"

import React, { useEffect, useMemo, useState } from "react"
import { X, Download, Printer, FileText, Calendar } from "lucide-react"
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
  client: string
  type: "Quotation" | "Sales Order" | "Invoice" | "Payment"
  amount: number
}

export default function SalesReportModal({ isOpen, onClose, dateFrom, dateTo }: SalesReportModalProps) {
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<SalesRow[]>([])

  const dateFilter = (col: string) => {
    const filters: string[] = []
    if (dateFrom) filters.push(`${col} >= '${dateFrom}'`)
    if (dateTo) filters.push(`${col} <= '${dateTo} 23:59:59'`)
    return filters.length ? ` and ${filters.join(' and ')}` : ''
  }

  useEffect(() => {
    if (!isOpen) return
    const load = async () => {
      setLoading(true)
      try {
        // Quotations
        const { data: quotations } = await supabase
          .from("quotations")
          .select("quotation_number, date_created, grand_total, client:registered_entities(name)")
          .order('date_created', { ascending: true })

        // Sales Orders
        const { data: orders } = await supabase
          .from("sales_orders")
          .select("order_number, date_created, grand_total, client:registered_entities(name)")
          .order('date_created', { ascending: true })

        // Invoices
        const { data: invoices } = await supabase
          .from("invoices")
          .select("invoice_number, date_created, grand_total, client:registered_entities(name)")
          .order('date_created', { ascending: true })

        // Payments (completed)
        const { data: payments } = await supabase
          .from("payments")
          .select("payment_date, amount, registered_entities(name)")
          .order('payment_date', { ascending: true })

        const combined: SalesRow[] = []
        ;(quotations || []).forEach(q => combined.push({
          date: q.date_created ? new Date(q.date_created as any).toLocaleDateString() : '',
          quotation_number: q.quotation_number,
          client: q.client?.name || '',
          type: "Quotation",
          amount: Number(q.grand_total || 0)
        }))
        ;(orders || []).forEach(o => combined.push({
          date: o.date_created ? new Date(o.date_created as any).toLocaleDateString() : '',
          order_number: o.order_number,
          client: o.client?.name || '',
          type: "Sales Order",
          amount: Number(o.grand_total || 0)
        }))
        ;(invoices || []).forEach(i => combined.push({
          date: i.date_created ? new Date(i.date_created as any).toLocaleDateString() : '',
          invoice_number: i.invoice_number,
          client: i.client?.name || '',
          type: "Invoice",
          amount: Number(i.grand_total || 0)
        }))
        ;(payments || []).forEach(p => combined.push({
          date: p.payment_date ? new Date(p.payment_date as any).toLocaleDateString() : '',
          client: p.registered_entities?.name || '',
          type: "Payment",
          amount: Number(p.amount || 0)
        }))

        // Optional date filtering on client side (read-only)
        const start = dateFrom ? new Date(dateFrom) : null
        const end = dateTo ? new Date(dateTo + 'T23:59:59') : null
        const filtered = combined.filter(r => {
          if (!r.date) return true
          const d = new Date(r.date)
          if (start && d < start) return false
          if (end && d > end) return false
          return true
        })
        setRows(filtered)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isOpen, dateFrom, dateTo])

  const columns: TableColumn[] = useMemo(() => [
    { key: 'date', label: 'Date' },
    { key: 'type', label: 'Type' },
    { key: 'client', label: 'Client' },
    { key: 'quotation_number', label: 'Quotation #' },
    { key: 'order_number', label: 'Order #' },
    { key: 'invoice_number', label: 'Invoice #' },
    { key: 'amount', label: 'Amount', align: 'right' },
  ], [])

  const total = rows.reduce((sum, r) => sum + (r.amount || 0), 0)

  const handleExport = () => exportToCSV('sales-report', columns, rows)

  const handlePrint = () => {
    const html = `
      <h3>Sales Report</h3>
      <p>${dateFrom || 'All'} - ${dateTo || 'All'}</p>
      <table class="table table-sm table-striped">
        <thead><tr>${columns.map(c => `<th class="text-${c.align || 'start'}">${c.label}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows.map(r => `<tr>${columns.map(c => `<td class="text-${c.align || 'start'}">${r[c.key as keyof SalesRow] ?? ''}</td>`).join('')}</tr>`).join('')}
        </tbody>
        <tfoot>
          <tr>${columns.map(c => c.key === 'amount' ? `<th class="text-end">${total.toFixed(2)}</th>` : '<th></th>').join('')}</tr>
        </tfoot>
      </table>`
    printTableHtml('Sales Report', html)
  }

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title="Sales Reports" onSubmit={() => {}} showFooter={false} className="sm:max-w-[900px]">
      <div className="d-flex justify-content-between align-items-center">
        <div className="text-muted d-flex align-items-center gap-2">
          <Calendar size={16} />
          <span>{dateFrom || 'All'} – {dateTo || 'All'}</span>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={handlePrint}><Printer size={14} className="me-1"/>Print</button>
          <button className="btn btn-primary btn-sm" onClick={handleExport}><Download size={14} className="me-1"/>Export CSV</button>
        </div>
      </div>

      <div className="table-responsive mt-3">
        <table className="table table-hover align-middle">
          <thead>
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
                      {c.key === 'amount' ? r.amount.toFixed(2) : (r as any)[c.key] || ''}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              {columns.map(c => (
                <th key={c.key} className={c.align === 'right' ? 'text-end' : c.align === 'center' ? 'text-center' : ''}>
                  {c.key === 'amount' ? total.toFixed(2) : ''}
                </th>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </FormModal>
  )
}


