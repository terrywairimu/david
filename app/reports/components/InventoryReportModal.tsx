"use client"

import React, { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { FormModal } from "@/components/ui/modal"
import { Download, Printer, Package } from "lucide-react"
import { exportToCSV, printTableHtml, TableColumn } from "./ReportUtils"
import { useGlobalProgress } from "@/components/GlobalProgressManager"

interface InventoryReportModalProps {
  isOpen: boolean
  onClose: () => void
}

type InvRow = {
  name: string
  sku?: string
  category?: string
  qty: number
  reorder_level?: number
  unit_price: number
  value: number
}

export default function InventoryReportModal({ isOpen, onClose }: InventoryReportModalProps) {
  const { startDownload, completeDownload, setError } = useGlobalProgress()
  const [rows, setRows] = useState<InvRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const run = async () => {
      setLoading(true)
      try {
        const { data } = await supabase.from('stock_items').select('name, sku, category, quantity, reorder_level, unit_price')
        const mapped = (data || []).map(it => ({
          name: it.name,
          sku: it.sku,
          category: it.category,
          qty: Number(it.quantity || 0),
          reorder_level: it.reorder_level,
          unit_price: Number(it.unit_price || 0),
          value: Number(it.unit_price || 0) * Number(it.quantity || 0)
        }))
        setRows(mapped)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [isOpen])

  const columns: TableColumn[] = useMemo(() => [
    { key: 'name', label: 'Item' },
    { key: 'sku', label: 'SKU' },
    { key: 'category', label: 'Category' },
    { key: 'qty', label: 'Qty', align: 'right' },
    { key: 'reorder_level', label: 'Reorder', align: 'right' },
    { key: 'unit_price', label: 'Unit Price', align: 'right' },
    { key: 'value', label: 'Stock Value', align: 'right' },
  ], [])

  const totals = rows.reduce((a, r) => a + (r.value || 0), 0)

  const handleExport = () => {
    startDownload('inventory-report', 'csv')
    try {
      exportToCSV('inventory-report', columns, rows)
      setTimeout(() => completeDownload(), 500)
    } catch (error) {
      setError('Failed to export report')
    }
  }
  const handlePrint = () => {
    const html = `
      <h3>Inventory Report</h3>
      <table class="table table-sm table-striped">
        <thead><tr>${columns.map(c => `<th class="text-${c.align || 'start'}">${c.label}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows.map(r => `<tr>${columns.map(c => `<td class="text-${c.align || 'start'}">${(r as any)[c.key] ?? ''}</td>`).join('')}</tr>`).join('')}
        </tbody>
        <tfoot><tr>${columns.map(c => c.key === 'value' ? `<th class="text-end">${totals.toFixed(2)}</th>` : '<th></th>').join('')}</tr></tfoot>
      </table>`
    printTableHtml('Inventory Report', html)
  }

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title="Inventory Reports" onSubmit={() => {}} showFooter={false} className="sm:max-w-[900px]">
      <div className="d-flex justify-content-between align-items-center">
        <div className="text-muted d-flex align-items-center gap-2">
          <Package size={16} />
          <span>On-hand stock, reorder levels, valuation</span>
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
              <tr><td colSpan={columns.length}><div className="text-center text-muted py-3">No stock</div></td></tr>
            ) : (
              rows.map((r, idx) => (
                <tr key={idx}>
                  {columns.map(c => (
                    <td key={c.key} className={c.align === 'right' ? 'text-end' : c.align === 'center' ? 'text-center' : ''}>
                      {['qty','reorder_level','unit_price','value'].includes(c.key) ? (r as any)[c.key].toFixed ? (r as any)[c.key].toFixed(2) : (r as any)[c.key] : (r as any)[c.key] || ''}
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


