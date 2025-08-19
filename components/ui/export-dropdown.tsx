import React, { useState, useRef, useEffect } from "react"
import { Download, ChevronDown, FileText, FileSpreadsheet } from "lucide-react"

interface ExportDropdownProps {
  onExport: (format: 'pdf' | 'csv') => void
  exportLabel?: string
  disabled?: boolean
  className?: string
}

const ExportDropdown: React.FC<ExportDropdownProps> = ({
  onExport,
  exportLabel = "Export",
  disabled = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleExport = (format: 'pdf' | 'csv') => {
    onExport(format)
    setIsOpen(false)
  }

  return (
    <div className={`export-dropdown ${className}`} ref={dropdownRef}>
      <button
        className="btn w-100 shadow-sm export-btn d-flex align-items-center justify-content-center gap-2"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        style={{ 
          borderRadius: "16px", 
          height: "45px", 
          transition: "all 0.3s ease",
          position: "relative"
        }}
      >
        <Download size={16} />
        {exportLabel}
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="dropdown-menu show"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 1000,
            marginTop: "4px",
            borderRadius: "12px",
            border: "1px solid #e9ecef",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            backgroundColor: "white",
            minWidth: "140px"
          }}
        >
          <button
            className="dropdown-item d-flex align-items-center gap-2 py-2 px-3"
            onClick={() => handleExport('pdf')}
            style={{ border: "none", backgroundColor: "transparent", width: "100%", textAlign: "left" }}
          >
            <FileText size={16} className="text-danger" />
            <span>PDF Report</span>
          </button>
          <button
            className="dropdown-item d-flex align-items-center gap-2 py-2 px-3"
            onClick={() => handleExport('csv')}
            style={{ border: "none", backgroundColor: "transparent", width: "100%", textAlign: "left" }}
          >
            <FileSpreadsheet size={16} className="text-success" />
            <span>CSV Export</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default ExportDropdown
