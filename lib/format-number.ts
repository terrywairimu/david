/**
 * Professional number formatting utilities.
 * - formatNumber: Display numbers with comma separators (e.g. 1,234,567.89)
 * - parseFormattedNumber: Parse formatted string back to number
 * - formatNumberInput: Format for input display while typing
 */

export function formatNumber(
  value: number | string | null | undefined,
  options?: { minFractionDigits?: number; maxFractionDigits?: number; locale?: string }
): string {
  if (value === null || value === undefined || value === '') return ''
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : Number(value)
  if (isNaN(num)) return ''
  return num.toLocaleString(options?.locale || 'en-KE', {
    minimumFractionDigits: options?.minFractionDigits ?? 0,
    maximumFractionDigits: options?.maxFractionDigits ?? 2,
  })
}

export function parseFormattedNumber(value: string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  const cleaned = String(value).replace(/,/g, '').trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

/**
 * Format a raw numeric string for display in an input (adds commas).
 * Use when displaying value back to user in an input field.
 */
export function formatNumberForInput(value: string): string {
  if (!value || value === '') return ''
  const parts = String(value).replace(/,/g, '').split('.')
  const intPart = parts[0]?.replace(/\B(?=(\d{3})+(?!\d))/g, ',') || ''
  const decPart = parts[1] !== undefined ? `.${parts[1]}` : ''
  return intPart + decPart
}

/**
 * Normalize numeric string: strip leading zeros except for "0" or "0.xxx"
 */
export function normalizeNumericString(value: string, allowDecimals = true): string {
  const raw = value.replace(/,/g, '').trim()
  if (!raw || raw === '.' || raw === '-') return ''
  const match = raw.match(allowDecimals ? /^-?\d*\.?\d*/ : /^-?\d*/)
  let cleaned = match ? match[0] : raw
  if (cleaned.startsWith('.')) cleaned = '0' + cleaned
  // Strip leading zeros: 01234 -> 1234, 0.5 -> 0.5, 0 -> 0 (keep lone 0)
  if (cleaned.startsWith('-')) {
    const rest = cleaned.slice(1)
    cleaned = '-' + (rest.replace(/^0+(?=\d)/, '') || rest)
  } else {
    cleaned = cleaned.replace(/^0+(?=\d)/, '') || cleaned
  }
  return cleaned
}
