"use client"

import React, { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { FormModal } from "@/components/ui/modal"
import { DollarSign, Download, Printer } from "lucide-react"
import { exportToCSV, printTableHtml, TableColumn } from "./ReportUtils"

interface FinancialReportModalProps {
  isOpen: boolean
  onClose: () => void
  dateFrom?: string
  dateTo?: string
}

type Row = { name: string, amount: number }

export default function FinancialReportModal({ isOpen, onClose, dateFrom, dateTo }: FinancialReportModalProps) {
  const [sales, setSales] = useState<number>(0)
  const [payments, setPayments] = useState<number>(0)
  const [expenses, setExpenses] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const run = async () => {
      setLoading(true)
      try {
        const [invRes, payRes, expRes] = await Promise.all([
          supabase.from('invoices').select('grand_total'),
          supabase.from('payments').select('amount'),
          supabase.from('expenses').select('amount')
        ])

        setSales((invRes.data || []).reduce((s, i) => s + Number(i.grand_total || 0), 0))
        setPayments((payRes.data || []).reduce((s, i) => s + Number(i.amount || 0), 0))
        setExpenses((expRes.data || []).reduce((s, i) => s + Number(i.amount || 0), 0))
      } finally { setLoading(false) }
    }
    run()
  }, [isOpen, dateFrom, dateTo])

  const rows: Row[] = useMemo(() => ([
    { name: 'Sales (Invoiced)', amount: sales },
    { name: 'Payments Received', amount: payments },
    { name: 'Expenses', amount: -expenses },
    { name: 'Net', amount: sales - expenses },
  ]), [sales, payments, expenses])

  const columns: TableColumn[] = [
    { key: 'name', label: 'Metric' },
    { key: 'amount', label: 'Amount', align: 'right' },
  ]

  const handleExport = () => exportToCSV('financial-summary', columns, rows as any)
  const handlePrint = () => {
    const html = `
      <h3>Financial Summary</h3>
      <table class="table table-sm table-striped">
        <thead><tr>${columns.map(c => `<th class="text-${c.align || 'start'}">${c.label}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows.map(r => `<tr><td>${r.name}</td><td class="text-end">${r.amount.toFixed(2)}</td></tr>`).join('')}
        </tbody>
      </table>`
    printTableHtml('Financial Summary', html)
  }

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title="Financial Summary" onSubmit={() => {}} showFooter={false} className="sm:max-w-[700px]">
      <div className="d-flex justify-content-between align-items-center">
        <div className="text-muted d-flex align-items-center gap-2">
          <DollarSign size={16} />
          <span>Totals across invoices, payments and expenses</span>
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
                <th key={col.key} className={col.align === 'right' ? 'text-end' : ''}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={2}><div className="text-center text-muted py-3">Loading...</div></td></tr>
            ) : (
              rows.map((r, idx) => (
                <tr key={idx}>
                  <td>{r.name}</td>
                  <td className="text-end">{r.amount.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </FormModal>
  )
}


