"use client"

import React, { useMemo, useState } from "react"
import { FormModal } from "@/components/ui/modal"
import { Download } from "lucide-react"
import { exportToCSV, TableColumn } from "./ReportUtils"

interface CustomReportModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CustomReportModal({ isOpen, onClose }: CustomReportModalProps) {
  const [columns, setColumns] = useState<TableColumn[]>([
    { key: 'field1', label: 'Field 1' },
    { key: 'field2', label: 'Field 2' },
  ])
  const [rows, setRows] = useState<Record<string, any>[]>([])

  const canExport = useMemo(() => columns.length > 0 && rows.length > 0, [columns, rows])

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title="Create Custom Report" onSubmit={() => {}} showFooter={false} className="sm:max-w-[700px]">
      <div className="text-muted">Build your own report by selecting fields and filters. (Coming soon)</div>
      <div className="mt-3">
        <button className="btn btn-primary btn-sm" disabled={!canExport} onClick={() => exportToCSV('custom-report', columns, rows)}>
          <Download size={14} className="me-1"/>Export CSV
        </button>
      </div>
    </FormModal>
  )
}


