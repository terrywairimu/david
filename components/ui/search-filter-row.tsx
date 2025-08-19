import React, { useState, useEffect } from "react"
import { Search } from "lucide-react"
import ExportDropdown from "./export-dropdown"

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
  dateFilter?: {
    value: string
    onChange: (value: string) => void
    onSpecificDateChange?: (date: string) => void
    onPeriodStartChange?: (date: string) => void
    onPeriodEndChange?: (date: string) => void
    specificDate?: string
    periodStartDate?: string
    periodEndDate?: string
  }
  onExport?: (format: 'pdf' | 'csv') => void
  exportLabel?: string
  compactLayout?: boolean // For account summary view
  transferButton?: {
    onClick: () => void
    label?: string
  }
}

const SearchFilterRow: React.FC<SearchFilterRowProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  firstFilter,
  secondFilter,
  dateFilter,
  onExport,
  exportLabel = "Export",
  compactLayout = false,
  transferButton,
}) => {
  const [showSpecificDate, setShowSpecificDate] = useState(dateFilter?.value === "specific")
  const [showPeriodDates, setShowPeriodDates] = useState(dateFilter?.value === "period")

  // Update show states when dateFilter value changes from outside
  useEffect(() => {
    setShowSpecificDate(dateFilter?.value === "specific")
    setShowPeriodDates(dateFilter?.value === "period")
  }, [dateFilter?.value])

  const handleDateFilterChange = (value: string) => {
    if (dateFilter?.onChange) {
      dateFilter.onChange(value)
    }
    
    // Show/hide date inputs based on selection
    setShowSpecificDate(value === "specific")
    setShowPeriodDates(value === "period")
  }

  const dateFilterOptions = [
    { value: "", label: "All Dates" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "year", label: "This Year" },
    { value: "specific", label: "Specific Date" },
    { value: "period", label: "Specific Period" },
  ]

  return (
    <div className="search-filter-row mb-4 w-100">
      {/* Desktop Layout */}
      <div className="d-none d-md-block">
        <div className="row g-3">
          {/* Search Input */}
          <div className={compactLayout ? "col-md-3" : "col-md-3"}>
            <div className="input-group shadow-sm">
              <span className="input-group-text bg-white border-end-0" style={{ borderRadius: "16px 0 0 16px", height: "45px" }}>
                <i className="fas fa-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 border-end-0"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                style={{ borderRadius: "0", height: "45px" }}
              />
            </div>
          </div>

          {/* First Filter */}
          {firstFilter && (
            <div className={compactLayout ? "col-md-2" : "col-md-3"}>
              <select
                className="form-select border-0 shadow-sm"
                value={firstFilter.value}
                onChange={(e) => firstFilter.onChange(e.target.value)}
                style={{ borderRadius: "16px", height: "45px" }}
              >
                <option value="">{firstFilter.placeholder || "All"}</option>
                {firstFilter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Second Filter - Only show if not compactLayout */}
          {secondFilter && !compactLayout && (
            <div className="col-md-3">
              <select
                className="form-select border-0 shadow-sm"
                value={secondFilter.value}
                onChange={(e) => secondFilter.onChange(e.target.value)}
                style={{ borderRadius: "16px", height: "45px" }}
              >
                <option value="">{secondFilter.placeholder || "All"}</option>
                {secondFilter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Filter */}
          {dateFilter && (
            <div className={compactLayout ? "col-md-3" : "col-md-3"}>
              <select
                className="form-select border-0 shadow-sm"
                value={dateFilter.value}
                onChange={(e) => handleDateFilterChange(e.target.value)}
                style={{ borderRadius: "16px", height: "45px" }}
              >
                {dateFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              {/* Desktop Date Inputs */}
              {/* Specific Date Input */}
              {showSpecificDate && (
                <div className="mt-2 date-input-container" style={{ overflow: "hidden" }}>
                  <input
                    type="date"
                    className="form-control border-0 shadow-sm w-100"
                    value={dateFilter.specificDate || ""}
                    onChange={(e) => dateFilter.onSpecificDateChange?.(e.target.value)}
                    style={{ borderRadius: "16px", height: "45px" }}
                  />
                </div>
              )}
              
              {/* Period Date Inputs */}
              {showPeriodDates && (
                <div className="mt-2 date-input-container" style={{ overflow: "hidden" }}>
                  <div className="d-flex align-items-center justify-content-between gap-1" style={{ maxWidth: "100%" }}>
                    <input
                      type="date"
                      className="form-control border-0 shadow-sm"
                      value={dateFilter.periodStartDate || ""}
                      onChange={(e) => dateFilter.onPeriodStartChange?.(e.target.value)}
                      style={{ borderRadius: "16px", height: "45px", flex: 1, minWidth: 0, maxWidth: "calc(50% - 8px)" }}
                    />
                    <div className="text-center" style={{ width: "16px", flexShrink: 0 }}>
                      <div className="small text-muted mb-1" style={{ fontSize: "10px" }}>to</div>
                      <i className="fas fa-arrow-right" style={{ fontSize: "10px" }}></i>
                    </div>
                    <input
                      type="date"
                      className="form-control border-0 shadow-sm"
                      value={dateFilter.periodEndDate || ""}
                      onChange={(e) => dateFilter.onPeriodEndChange?.(e.target.value)}
                      style={{ borderRadius: "16px", height: "45px", flex: 1, minWidth: 0, maxWidth: "calc(50% - 8px)" }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Export Button */}
          {onExport && (
            <div className={compactLayout ? "col-md-2" : "col-md-3"}>
              <ExportDropdown
                onExport={onExport}
                exportLabel={exportLabel}
              />
            </div>
          )}

          {/* Transfer Button - Only show when compactLayout is true */}
          {transferButton && compactLayout && (
            <div className="col-md-2">
              <button
                className="btn btn-success w-100"
                onClick={transferButton.onClick}
                style={{ 
                  borderRadius: "16px", 
                  height: "45px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }}
              >
                <i className="fas fa-exchange-alt me-2"></i>
                {transferButton.label || "Transfer"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="d-block d-md-none">
        {/* Search Input - Full Row */}
        <div className="mb-3">
          <div className="input-group shadow-sm">
            <span className="input-group-text bg-white border-end-0" style={{ borderRadius: "16px 0 0 16px", height: "45px" }}>
              <i className="fas fa-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0 border-end-0"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{ borderRadius: "0", height: "45px" }}
            />
          </div>
        </div>

        {/* Filters and Export Button - Shared Row */}
        <div className="d-flex gap-2">
          {/* First Filter */}
          {firstFilter && (
            <div className="flex-fill">
              <select
                className="form-select border-0 shadow-sm w-100"
                value={firstFilter.value}
                onChange={(e) => firstFilter.onChange(e.target.value)}
                style={{ borderRadius: "16px", height: "45px" }}
              >
                <option value="">{firstFilter.placeholder || "All"}</option>
                {firstFilter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Second Filter */}
          {secondFilter && (
            <div className="flex-fill">
              <select
                className="form-select border-0 shadow-sm w-100"
                value={secondFilter.value}
                onChange={(e) => secondFilter.onChange(e.target.value)}
                style={{ borderRadius: "16px", height: "45px" }}
              >
                <option value="">{secondFilter.placeholder || "All"}</option>
                {secondFilter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Filter */}
          {dateFilter && (
            <div className="flex-fill">
              <select
                className="form-select border-0 shadow-sm w-100"
                value={dateFilter.value}
                onChange={(e) => handleDateFilterChange(e.target.value)}
                style={{ borderRadius: "16px", height: "45px" }}
              >
                {dateFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Export Button */}
          {onExport && (
            <div className="flex-fill">
              <ExportDropdown
                onExport={onExport}
                exportLabel={exportLabel}
              />
            </div>
          )}
        </div>

        {/* Mobile Date Inputs */}
        {dateFilter && (
          <>
            {/* Specific Date Input */}
            {showSpecificDate && (
              <div className="mt-3">
                <input
                  type="date"
                  className="form-control shadow-sm"
                  value={dateFilter.specificDate || ""}
                  onChange={(e) => dateFilter.onSpecificDateChange?.(e.target.value)}
                  style={{ borderRadius: "16px", height: "45px" }}
                />
              </div>
            )}

            {/* Period Date Inputs */}
            {showPeriodDates && (
              <div className="mt-3">
                <div className="row g-2">
                  <div className="col-6">
                    <input
                      type="date"
                      className="form-control shadow-sm"
                      placeholder="Start Date"
                      value={dateFilter.periodStartDate || ""}
                      onChange={(e) => dateFilter.onPeriodStartChange?.(e.target.value)}
                      style={{ borderRadius: "16px", height: "45px" }}
                    />
                  </div>
                  <div className="col-6">
                    <input
                      type="date"
                      className="form-control shadow-sm"
                      placeholder="End Date"
                      value={dateFilter.periodEndDate || ""}
                      onChange={(e) => dateFilter.onPeriodEndChange?.(e.target.value)}
                      style={{ borderRadius: "16px", height: "45px" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default SearchFilterRow 