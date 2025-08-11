"use client"

import React from "react"

interface ReportCardProps {
  title: string
  description: string
  accent: string // CSS gradient string
  onClick: () => void
  icon?: React.ReactNode
}

// Windows 11-like file shape using CSS mask (rounded document with folded corner)
const fileMaskSvg = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="M6 2c-1.657 0-3 1.343-3 3v14c0 2.209 1.791 4 4 4h10c2.209 0 4-1.791 4-4V8.828c0-.53-.211-1.039-.586-1.414l-5.828-5.828A2 2 0 0 0 13.172 1H6zm7 1.414L19.586 9H15a2 2 0 0 1-2-2V3.414z"/></svg>'
)

export default function ReportCard({ title, description, accent, onClick, icon }: ReportCardProps) {
  return (
    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }} role="button" onClick={onClick}>
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">{title}</h5>
          <div
            className="position-relative"
            style={{ width: 48, height: 48 }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                background: accent,
                WebkitMaskImage: `url("data:image/svg+xml,${fileMaskSvg}")`,
                maskImage: `url("data:image/svg+xml,${fileMaskSvg}")`,
                WebkitMaskSize: 'cover',
                maskSize: 'cover',
                filter: 'drop-shadow(0 1px 0 rgba(0,0,0,.05))',
                borderRadius: 10,
              }}
            />
            {icon && (
              <div className="position-absolute top-50 start-50 translate-middle" style={{ color: 'rgba(0,0,0,.65)' }}>
                {icon}
              </div>
            )}
          </div>
        </div>
        <p className="text-muted mb-4">{description}</p>
        <div className="d-grid">
          <button className="btn btn-primary" onClick={(e)=>{ e.stopPropagation(); onClick(); }}>Generate Report</button>
        </div>
      </div>
    </div>
  )
}


