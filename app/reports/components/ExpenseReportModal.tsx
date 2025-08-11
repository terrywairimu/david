"use client"

import React, { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { FormModal } from "@/components/ui/modal"
import { Download, Printer, Wallet } from "lucide-react"
import { exportToCSV, printTableHtml, TableColumn } from "./ReportUtils"

interface ExpenseReportModalProps {
  isOpen: boolean
  onClose: () => void
  dateFrom?: string
  dateTo?: string
}

type Row = {
  date: string
  category: string
  expense_type?: string
  department?: string
  amount: number
  description?: string
}

export default function ExpenseReportModal({ isOpen, onClose, dateFrom, dateTo }: ExpenseReportModalProps) {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const run = async () => {
      setLoading(true)
      try {
        const { data } = await supabase.from('expenses').select('date_created, category, expense_type, department, amount, description')
        let mapped: Row[] = (data || []).map(e => ({
          date: e.date_created ? new Date(e.date_created as any).toLocaleDateString() : '',
          category: e.category,
          expense_type: e.expense_type,
          department: e.department,
          amount: Number(e.amount || 0),
          description: e.description || ''
        }))
        // client-side date filter
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
      } finally { setLoading(false) }
    }
    run()
  }, [isOpen, dateFrom, dateTo])

  const columns: TableColumn[] = useMemo(() => [
    { key: 'date', label: 'Date' },
    { key: 'category', label: 'Category' },
    { key: 'department', label: 'Department' },
    { key: 'expense_type', label: 'Type' },
    { key: 'description', label: 'Description' },
    { key: 'amount', label: 'Amount', align: 'right' },
  ], [])

  const total = rows.reduce((s, r) => s + (r.amount || 0), 0)

  const handleExport = () => exportToCSV('expense-report', columns, rows)
  const handlePrint = () => {
    const html = `
      <h3>Expense Report</h3>
      <table class="table table-sm table-striped">
        <thead><tr>${columns.map(c => `<th class="text-${c.align || 'start'}">${c.label}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows.map(r => `<tr>${columns.map(c => `<td class=\"text-${c.align || 'start'}\">${(r as any)[c.key] ?? ''}</td>`).join('')}</tr>`).join('')}
        </tbody>
        <tfoot><tr>${columns.map(c => c.key === 'amount' ? `<th class=\"text-end\">${total.toFixed(2)}</th>` : '<th></th>').join('')}</tr></tfoot>
      </table>`
    printTableHtml('Expense Report', html)
  }

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title="Expense Reports" onSubmit={() => {}} showFooter={false} className="sm:max-w-[1000px]">
      <div className="d-flex justify-content-between align-items-center">
        <div className="text-muted d-flex align-items-center gap-2">
          <Wallet size={16} />
          <span>Company and client expenses</span>
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


