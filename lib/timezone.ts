// Global timezone utility for Nairobi (UTC+3.00)
// This ensures consistent timezone handling across the entire application

export const NAIROBI_TIMEZONE = 'Africa/Nairobi'
export const NAIROBI_UTC_OFFSET = 3 // UTC+3.00

/**
 * Convert any date to Nairobi timezone
 * @param date - Date to convert (can be Date object, string, or number)
 * @returns Date in Nairobi timezone
 */
export function toNairobiTime(date: Date | string | number): Date {
  const inputDate = new Date(date)
  
  // Get the current timezone offset of the input date
  const localOffset = inputDate.getTimezoneOffset()
  
  // Nairobi is UTC+3, so we need to add 3 hours to UTC
  // If the input is already in local time, we need to convert it
  const nairobiOffset = -NAIROBI_UTC_OFFSET * 60 // Convert hours to minutes
  
  // Calculate the difference and adjust
  const offsetDiff = localOffset - nairobiOffset
  const nairobiTime = new Date(inputDate.getTime() + (offsetDiff * 60000))
  
  return nairobiTime
}

/**
 * Convert Nairobi time to UTC for database storage
 * @param nairobiDate - Date in Nairobi timezone
 * @returns Date in UTC
 */
export function nairobiToUTC(nairobiDate: Date): Date {
  // Nairobi is UTC+3, so subtract 3 hours to get UTC
  const utcTime = new Date(nairobiDate.getTime() - (NAIROBI_UTC_OFFSET * 60 * 60000))
  return utcTime
}

/**
 * Convert UTC time from database to Nairobi time for display
 * @param utcDate - Date in UTC from database
 * @returns Date in Nairobi timezone
 */
export function utcToNairobi(utcDate: Date): Date {
  // UTC is UTC+0, so add 3 hours to get Nairobi time
  const nairobiTime = new Date(utcDate.getTime() + (NAIROBI_UTC_OFFSET * 60 * 60000))
  return nairobiTime
}

/**
 * Convert a date input (date-only string like "2024-01-15") to UTC
 * This function handles the common case where date inputs are treated as midnight in local time
 * @param dateString - Date string from HTML date input (YYYY-MM-DD)
 * @returns Date in UTC that represents the same calendar date in Nairobi timezone
 */
export function dateInputToUTC(dateString: string): Date {
  // Parse the date string and create a Date object
  // The date input gives us a date string like "2024-01-15"
  const [year, month, day] = dateString.split('-').map(Number)
  
  // CRITICAL FIX: Don't apply timezone conversion for date inputs
  // Date inputs represent calendar dates, not specific times
  // We want to preserve the exact date the user selected
  
  // Create a Date object at midnight in the user's local timezone
  // This ensures the date is preserved exactly as selected
  const localDate = new Date(year, month - 1, day, 0, 0, 0, 0)
  
  // Convert to UTC by adding the local timezone offset
  // This preserves the exact calendar date
  const utcDate = new Date(localDate.getTime() + (localDate.getTimezoneOffset() * 60000))
  
  return utcDate
}

/**
 * Convert a date input to a date-only value (RECOMMENDED for date inputs)
 * This function treats date inputs as pure calendar dates without timezone conversion
 * @param dateString - Date string from HTML date input (YYYY-MM-DD)
 * @returns Date object representing the exact calendar date selected
 */
export function dateInputToDateOnly(dateString: string): Date {
  // Parse the date string
  const [year, month, day] = dateString.split('-').map(Number)
  
  // Create a Date object at noon (12:00) in the user's local timezone
  // Using noon prevents any timezone edge cases that could affect the date
  const localDate = new Date(year, month - 1, day, 12, 0, 0, 0)
  
  return localDate
}

/**
 * Convert a date input (date-only string like "2024-01-15") to Nairobi timezone
 * This is useful for display purposes
 * @param dateString - Date string from HTML date input (YYYY-MM-DD)
 * @returns Date in Nairobi timezone
 */
export function dateInputToNairobi(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

/**
 * Get current time in Nairobi timezone
 * @returns Current date/time in Nairobi
 */
export function getCurrentNairobiTime(): Date {
  return toNairobiTime(new Date())
}

/**
 * Format date for display in Nairobi timezone
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatNairobiDate(
  date: Date | string | number, 
  options: Intl.DateTimeFormatOptions = {}
): string {
  const nairobiDate = toNairobiTime(date)
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: NAIROBI_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options
  }
  
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(nairobiDate)
}

/**
 * Format time for display in Nairobi timezone
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted time string
 */
export function formatNairobiTime(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const nairobiDate = toNairobiTime(date)
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: NAIROBI_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    ...options
  }
  
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(nairobiDate)
}

/**
 * Format date and time for display in Nairobi timezone
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date and time string
 */
export function formatNairobiDateTime(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const nairobiDate = toNairobiTime(date)
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: NAIROBI_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  }
  
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(nairobiDate)
}

/**
 * Get Nairobi timezone offset string
 * @returns Timezone offset string (e.g., "+03:00")
 */
export function getNairobiOffsetString(): string {
  return `+${NAIROBI_UTC_OFFSET.toString().padStart(2, '0')}:00`
}

/**
 * Check if a date is in Nairobi timezone
 * @param date - Date to check
 * @returns True if date is in Nairobi timezone
 */
export function isNairobiTime(date: Date): boolean {
  const nairobiTime = toNairobiTime(date)
  const localTime = new Date(date)
  
  // Compare the dates - if they're the same, it's already in Nairobi time
  return nairobiTime.getTime() === localTime.getTime()
}

/**
 * Create a date range in Nairobi timezone
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Object with start and end dates in Nairobi timezone
 */
export function createNairobiDateRange(startDate: Date, endDate: Date) {
  return {
    start: toNairobiTime(startDate),
    end: toNairobiTime(endDate)
  }
}

/**
 * Get start and end of day in Nairobi timezone
 * @param date - Date to get day boundaries for
 * @returns Object with start and end of day in Nairobi timezone
 */
export function getNairobiDayBoundaries(date: Date = new Date()) {
  const nairobiDate = toNairobiTime(date)
  
  const startOfDay = new Date(nairobiDate)
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date(nairobiDate)
  endOfDay.setHours(23, 59, 59, 999)
  
  return {
    start: startOfDay,
    end: endOfDay
  }
}

/**
 * Get start and end of week in Nairobi timezone
 * @param date - Date to get week boundaries for
 * @returns Object with start and end of week in Nairobi timezone
 */
export function getNairobiWeekBoundaries(date: Date = new Date()) {
  const nairobiDate = toNairobiTime(date)
  
  const startOfWeek = new Date(nairobiDate)
  const dayOfWeek = startOfWeek.getDay()
  startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek)
  startOfWeek.setHours(0, 0, 0, 0)
  
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)
  
  return {
    start: startOfWeek,
    end: endOfWeek
  }
}

/**
 * Get start and end of month in Nairobi timezone
 * @param date - Date to get month boundaries for
 * @returns Object with start and end of month in Nairobi timezone
 */
export function getNairobiMonthBoundaries(date: Date = new Date()) {
  const nairobiDate = toNairobiTime(date)
  
  const startOfMonth = new Date(nairobiDate.getFullYear(), nairobiDate.getMonth(), 1)
  const endOfMonth = new Date(nairobiDate.getFullYear(), nairobiDate.getMonth() + 1, 0)
  endOfMonth.setHours(23, 59, 59, 999)
  
  return {
    start: startOfMonth,
    end: endOfMonth
  }
}
