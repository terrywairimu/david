export interface TableColumn {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
}

export function exportToCSV(filename: string, columns: TableColumn[], rows: Record<string, any>[]) {
  const header = columns.map(c => '"' + c.label.replace(/"/g, '""') + '"').join(',')
  const body = rows
    .map(row => columns.map(c => {
      const value = row[c.key]
      const str = value == null ? '' : String(value)
      return '"' + str.replace(/"/g, '""') + '"'
    }).join(','))
    .join('\n')

  const csv = header + '\n' + body
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.setAttribute('download', filename.endsWith('.csv') ? filename : filename + '.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function printTableHtml(title: string, html: string) {
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`<!doctype html><html><head><title>${title}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" />
    <style>
      body{ padding:24px; }
      .table th, .table td { vertical-align: middle; }
    </style>
  </head><body>${html}</body></html>`)
  win.document.close()
  win.focus()
  win.print()
}


