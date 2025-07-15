import React from "react"
import { Search, Download } from "lucide-react"

interface SearchFilterRowProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  firstFilter?: {
    value: string
    onChange: (value: string) => void
    options: { value: string; label: string }[]
    placeholder?: string
  }
  secondFilter?: {
    value: string
    onChange: (value: string) => void
    options: { value: string; label: string }[]
    placeholder?: string
  }
  onExport?: () => void
  exportLabel?: string
}

const SearchFilterRow: React.FC<SearchFilterRowProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  firstFilter,
  secondFilter,
  onExport,
  exportLabel = "Export",
}) => {
  return (
    <div className="flex flex-wrap gap-4 mb-4 items-center">
      <div className="flex-1 min-w-[300px]">
        <div className="input-group shadow-sm">
          <span 
            className="input-group-text border-0 bg-white" 
            style={{ borderRadius: "16px 0 0 16px", height: "45px" }}
          >
            <Search size={16} className="text-muted" />
          </span>
          <input
            type="text"
            className="form-control border-0 py-2"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ borderRadius: "0 16px 16px 0", height: "45px" }}
          />
        </div>
      </div>
      
      {firstFilter && (
        <div className="flex-shrink-0 min-w-[200px]">
          <select
            className="form-select border-0 py-2 shadow-sm w-full"
            value={firstFilter.value}
            onChange={(e) => firstFilter.onChange(e.target.value)}
            style={{ borderRadius: "16px", height: "45px" }}
          >
            {firstFilter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {secondFilter && (
        <div className="flex-shrink-0 min-w-[200px]">
          <select
            className="form-select border-0 py-2 shadow-sm w-full"
            value={secondFilter.value}
            onChange={(e) => secondFilter.onChange(e.target.value)}
            style={{ borderRadius: "16px", height: "45px" }}
          >
            {secondFilter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {onExport && (
        <div className="flex-shrink-0 min-w-[150px]">
          <button
            className="btn w-full shadow-sm export-btn"
            onClick={onExport}
            style={{ borderRadius: "16px", height: "45px", transition: "all 0.3s ease" }}
          >
            <Download size={16} className="me-2" />
            {exportLabel}
          </button>
        </div>
      )}
    </div>
  )
}

export default SearchFilterRow 