"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { formatNumberForInput, parseFormattedNumber, normalizeNumericString } from "@/lib/format-number"

interface FormattedNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: string | number
  onChange: (value: string) => void
  allowDecimals?: boolean
  min?: number
  max?: number
}

/**
 * Number input that:
 * - Starts empty (no leading 0)
 * - Formats with commas as user types (e.g. 1,234,567.89)
 * - Passes raw numeric string (no commas) to onChange for form compatibility
 */
const FormattedNumberInput = React.forwardRef<HTMLInputElement, FormattedNumberInputProps>(
  ({ value, onChange, allowDecimals = true, className, min, max, ...props }, ref) => {
    const rawValue = value === '' || value === 0 || value === '0' || value === null || value === undefined
      ? ''
      : String(value).replace(/,/g, '')
    const displayValue = rawValue === '' ? '' : formatNumberForInput(rawValue)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let raw = e.target.value.replace(/,/g, '').replace(/\s/g, '')
      if (!allowDecimals) raw = raw.replace(/\./g, '')
      if (raw === '' || raw === '.') {
        onChange('')
        return
      }
      const normalized = normalizeNumericString(raw, allowDecimals)
      onChange(normalized)
    }

    const handleBlur = () => {
      if (rawValue === '') return
      const num = parseFormattedNumber(rawValue)
      if (num === 0) {
        onChange('')
      }
    }

    return (
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn(className)}
        {...props}
      />
    )
  }
)
FormattedNumberInput.displayName = "FormattedNumberInput"

export { FormattedNumberInput }
