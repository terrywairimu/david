// Global timezone configuration for the entire application
// This ensures consistent timezone handling across all components
// Configuration is loaded from environment variables

export const TIMEZONE_CONFIG = {
  // Primary timezone for the application (from environment)
  PRIMARY_TIMEZONE: process.env.NEXT_PUBLIC_TIMEZONE || 'Africa/Nairobi',
  
  // UTC offset in hours (from environment)
  UTC_OFFSET: parseInt(process.env.NEXT_PUBLIC_UTC_OFFSET || '3'),
  
  // Timezone display name (from environment)
  DISPLAY_NAME: process.env.NEXT_PUBLIC_TIMEZONE_DISPLAY_NAME || 'Nairobi (UTC+3)',
  
  // Timezone abbreviation (from environment)
  ABBREVIATION: process.env.NEXT_PUBLIC_TIMEZONE_ABBREVIATION || 'EAT',
  
  // Date format options
  DATE_FORMAT: {
    short: 'MM/dd/yyyy',
    long: 'MMMM dd, yyyy',
    iso: 'yyyy-MM-dd'
  },
  
  // Time format options
  TIME_FORMAT: {
    short: 'HH:mm',
    long: 'HH:mm:ss',
    withTimezone: `HH:mm (${process.env.NEXT_PUBLIC_TIMEZONE_ABBREVIATION || 'EAT'})`
  },
  
  // DateTime format options
  DATETIME_FORMAT: {
    short: 'MM/dd/yyyy HH:mm',
    long: 'MMMM dd, yyyy HH:mm:ss',
    iso: 'yyyy-MM-dd HH:mm:ss'
  }
}

// Environment-specific timezone settings
export const getTimezoneSettings = () => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isProduction = process.env.NODE_ENV === 'production'
  const debugTimezone = process.env.NEXT_PUBLIC_DEBUG_TIMEZONE === 'true'
  
  return {
    ...TIMEZONE_CONFIG,
    // Override timezone for development if needed
    PRIMARY_TIMEZONE: isDevelopment ? TIMEZONE_CONFIG.PRIMARY_TIMEZONE : TIMEZONE_CONFIG.PRIMARY_TIMEZONE,
    // Add debug logging in development
    DEBUG: isDevelopment || debugTimezone,
    // Production optimizations
    OPTIMIZE_FOR_PERFORMANCE: isProduction
  }
}

// Timezone validation
export const validateTimezone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return true
  } catch (error) {
    return false
  }
}

// Get supported timezones (for future extensibility)
export const getSupportedTimezones = () => {
  return [
    {
      value: 'Africa/Nairobi',
      label: 'Nairobi (UTC+3)',
      offset: '+03:00'
    },
    {
      value: 'UTC',
      label: 'UTC (UTC+0)',
      offset: '+00:00'
    }
  ]
}

// Timezone conversion utilities
export const convertBetweenTimezones = (
  date: Date,
  fromTimezone: string,
  toTimezone: string
): Date => {
  try {
    // Create a formatter for the source timezone
    const fromFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: fromTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    
    // Format the date in the source timezone
    const parts = fromFormatter.formatToParts(date)
    const dateParts: any = {}
    
    parts.forEach(part => {
      if (part.type !== 'literal') {
        dateParts[part.type] = parseInt(part.value)
      }
    })
    
    // Create a new date in the target timezone
    const targetDate = new Date(
      dateParts.year,
      dateParts.month - 1,
      dateParts.day,
      dateParts.hour,
      dateParts.minute,
      dateParts.second
    )
    
    return targetDate
  } catch (error) {
    console.error('Error converting between timezones:', error)
    return date // Return original date if conversion fails
  }
}

// Export the main configuration
export default TIMEZONE_CONFIG
