"use client"

import React, { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { FormModal } from "@/components/ui/modal"
import { Download, Printer, Users } from "lucide-react"
import { exportToCSV, printTableHtml, TableColumn } from "./ReportUtils"

interface ClientReportModalProps {
  isOpen: boolean
  onClose: () => void
}

type ClientRow = {
  name: string
  phone?: string
  location?: string
  total_quotations: number
  total_orders: number
  total_invoices: number
  total_payments: number
}

export default function ClientReportModal({ isOpen, onClose }: ClientReportModalProps) {
  const [rows, setRows] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const run = async () => {
      setLoading(true)
      try {
        const [{ data: clients }, { data: quotations }, { data: orders }, { data: invoices }, { data: payments }] = await Promise.all([
          supabase.from('registered_entities').select('id,name,phone,location').eq('status', 'active'),
          supabase.from('quotations').select('id, client_id, grand_total'),
          supabase.from('sales_orders').select('id, client_id, grand_total'),
          supabase.from('invoices').select('id, client_id, grand_total'),
          supabase.from('payments').select('id, client_id, amount')
        ])

        const byClient = new Map<number, ClientRow>()
        ;(clients || []).forEach(c => {
          byClient.set(c.id, { name: c.name, phone: c.phone, location: c.location, total_quotations: 0, total_orders: 0, total_invoices: 0, total_payments: 0 })
        })
        ;(quotations || []).forEach(q => { const r = byClient.get(q.client_id); if (r) r.total_quotations += Number(q.grand_total || 0) })
        ;(orders || []).forEach(o => { const r = byClient.get(o.client_id); if (r) r.total_orders += Number(o.grand_total || 0) })
        ;(invoices || []).forEach(i => { const r = byClient.get(i.client_id); if (r) r.total_invoices += Number(i.grand_total || 0) })
        ;(payments || []).forEach(p => { const r = byClient.get(p.client_id); if (r) r.total_payments += Number(p.amount || 0) })

        setRows(Array.from(byClient.values()))
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [isOpen])

  const columns: TableColumn[] = useMemo(() => [
    { key: 'name', label: 'Client' },
    { key: 'phone', label: 'Phone' },
    { key: 'location', label: 'Location' },
    { key: 'total_quotations', label: 'Quotations', align: 'right' },
    { key: 'total_orders', label: 'Sales Orders', align: 'right' },
    { key: 'total_invoices', label: 'Invoices', align: 'right' },
    { key: 'total_payments', label: 'Payments', align: 'right' },
  ], [])

  const totals = rows.reduce((acc, r) => ({
    quotations: acc.quotations + r.total_quotations,
    orders: acc.orders + r.total_orders,
    invoices: acc.invoices + r.total_invoices,
    payments: acc.payments + r.total_payments,
  }), { quotations: 0, orders: 0, invoices: 0, payments: 0 })

  const handleExport = () => exportToCSV('client-report', columns, rows)
  const handlePrint = () => {
    const html = `
      <h3>Client Summary Report</h3>
      <table class="table table-sm table-striped">
        <thead><tr>${columns.map(c => `<th class="text-${c.align || 'start'}">${c.label}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows.map(r => `<tr>${columns.map(c => `<td class="text-${c.align || 'start'}">${(r as any)[c.key] ?? ''}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>`
    printTableHtml('Client Report', html)
  }

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title="Client Reports" onSubmit={() => {}} showFooter={false} className="sm:max-w-[900px]">
      <div className="d-flex justify-content-between align-items-center">
        <div className="text-muted d-flex align-items-center gap-2">
          <Users size={16} />
          <span>Active clients and financial totals</span>
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
              <tr><td colSpan={columns.length}><div className="text-center text-muted py-3">No clients</div></td></tr>
            ) : (
              rows.map((r, idx) => (
                <tr key={idx}>
                  {columns.map(c => (
                    <td key={c.key} className={c.align === 'right' ? 'text-end' : c.align === 'center' ? 'text-center' : ''}>
                      {['total_quotations','total_orders','total_invoices','total_payments'].includes(c.key) ? (r as any)[c.key].toFixed(2) : (r as any)[c.key] || ''}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </FormModal>
  )
}


