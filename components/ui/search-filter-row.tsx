import React, { useState } from "react"
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
  onExport?: () => void
  exportLabel?: string
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
}) => {
  const [showSpecificDate, setShowSpecificDate] = useState(false)
  const [showPeriodDates, setShowPeriodDates] = useState(false)

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
    <div className="search-filter-row mb-4">
      {/* Desktop Layout */}
      <div className="d-none d-md-block">
        <div className="row">
          {/* Search Input */}
          <div className="col-md-3">
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
            <div className="col-md-3">
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

          {/* Date Filter */}
          {dateFilter && (
            <div className="col-md-3">
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
              
              {/* Specific Date Input */}
              {showSpecificDate && (
                <input
                  type="date"
                  className="form-control border-0 shadow-sm mt-2"
                  value={dateFilter.specificDate || ""}
                  onChange={(e) => dateFilter.onSpecificDateChange?.(e.target.value)}
                  style={{ borderRadius: "16px", height: "45px" }}
                />
              )}
              
              {/* Period Date Inputs */}
              {showPeriodDates && (
                <div className="d-flex align-items-center justify-content-between mt-2">
                  <input
                    type="date"
                    className="form-control border-0 shadow-sm"
                    value={dateFilter.periodStartDate || ""}
                    onChange={(e) => dateFilter.onPeriodStartChange?.(e.target.value)}
                    style={{ borderRadius: "16px", height: "45px", width: "calc(50% - 10px)", minWidth: "0" }}
                  />
                  <span className="mx-2">to</span>
                  <input
                    type="date"
                    className="form-control border-0 shadow-sm"
                    value={dateFilter.periodEndDate || ""}
                    onChange={(e) => dateFilter.onPeriodEndChange?.(e.target.value)}
                    style={{ borderRadius: "16px", height: "45px", width: "calc(50% - 10px)", minWidth: "0" }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Second Filter (fallback if no date filter) */}
          {secondFilter && !dateFilter && (
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

          {/* Export Button */}
          {onExport && (
            <div className="col-md-3">
              <button
                className="btn w-100 shadow-sm export-btn"
                onClick={onExport}
                style={{ borderRadius: "16px", height: "45px", transition: "all 0.3s ease" }}
              >
                <Download size={16} className="me-2" />
                {exportLabel}
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

          {/* Second Filter (fallback if no date filter) */}
          {secondFilter && !dateFilter && (
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

          {/* Export Button */}
          {onExport && (
            <div className="flex-fill">
              <button
                className="btn w-100 shadow-sm export-btn"
                onClick={onExport}
                style={{ borderRadius: "16px", height: "45px", transition: "all 0.3s ease" }}
              >
                <Download size={16} className="me-2" />
                {exportLabel}
              </button>
            </div>
          )}
        </div>

        {/* Mobile Date Inputs */}
        {dateFilter && (
          <>
            {/* Specific Date Input */}
            {showSpecificDate && (
              <div className="mt-2">
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
              <div className="mt-2">
                <div className="d-flex gap-2">
                  <input
                    type="date"
                    className="form-control border-0 shadow-sm flex-fill"
                    value={dateFilter.periodStartDate || ""}
                    onChange={(e) => dateFilter.onPeriodStartChange?.(e.target.value)}
                    style={{ borderRadius: "16px", height: "45px" }}
                  />
                  <span className="d-flex align-items-center text-muted">to</span>
                  <input
                    type="date"
                    className="form-control border-0 shadow-sm flex-fill"
                    value={dateFilter.periodEndDate || ""}
                    onChange={(e) => dateFilter.onPeriodEndChange?.(e.target.value)}
                    style={{ borderRadius: "16px", height: "45px" }}
                  />
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