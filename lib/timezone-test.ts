// Timezone test utility to demonstrate the fix for the "one day less" issue
// This file helps debug and verify timezone conversions

import { dateInputToUTC, dateInputToDateOnly, nairobiToUTC, utcToNairobi, getCurrentNairobiTime } from './timezone'

/**
 * Test function to demonstrate the date conversion fix
 * Run this in your browser console to see the difference
 */
export function testDateConversion() {
  console.log('🌍 Testing Date Conversion Fix')
  console.log('================================')
  
  // Test case 1: Date input "2024-01-15"
  const testDateString = '2024-01-15'
  console.log(`\n📅 Test Date: ${testDateString}`)
  
  // OLD METHOD (problematic)
  const oldMethod = new Date(testDateString)
  const oldUTC = nairobiToUTC(oldMethod)
  console.log('❌ OLD METHOD (problematic):')
  console.log('  Input date string:', testDateString)
  console.log('  Created Date object:', oldMethod.toISOString())
  console.log('  After nairobiToUTC:', oldUTC.toISOString())
  console.log('  Date in database:', oldUTC.toISOString().split('T')[0])
  
  // NEW METHOD 1 (fixed with timezone conversion)
  const newUTC = dateInputToUTC(testDateString)
  console.log('\n✅ NEW METHOD 1 (dateInputToUTC):')
  console.log('  Input date string:', testDateString)
  console.log('  After dateInputToUTC:', newUTC.toISOString())
  console.log('  Date in database:', newUTC.toISOString().split('T')[0])
  
  // NEW METHOD 2 (RECOMMENDED - no timezone conversion)
  const newDateOnly = dateInputToDateOnly(testDateString)
  console.log('\n🎯 NEW METHOD 2 (dateInputToDateOnly - RECOMMENDED):')
  console.log('  Input date string:', testDateString)
  console.log('  After dateInputToDateOnly:', newDateOnly.toISOString())
  console.log('  Date in database:', newDateOnly.toISOString().split('T')[0])
  
  // Test case 2: Current date
  const today = new Date().toISOString().split('T')[0]
  console.log(`\n📅 Test Date: ${today}`)
  
  const todayDateOnly = dateInputToDateOnly(today)
  console.log('✅ Today conversion:')
  console.log('  Input date string:', today)
  console.log('  After dateInputToDateOnly:', todayDateOnly.toISOString())
  console.log('  Date in database:', todayDateOnly.toISOString().split('T')[0])
  
  // Test case 3: Edge case - year boundary
  const yearBoundary = '2024-12-31'
  console.log(`\n📅 Test Date: ${yearBoundary}`)
  
  const yearBoundaryDateOnly = dateInputToDateOnly(yearBoundary)
  console.log('✅ Year boundary conversion:')
  console.log('  Input date string:', yearBoundary)
  console.log('  After dateInputToDateOnly:', yearBoundaryDateOnly.toISOString())
  console.log('  Date in database:', yearBoundaryDateOnly.toISOString().split('T')[0])
  
  console.log('\n🎯 SUMMARY:')
  console.log('  - OLD METHOD: Can cause dates to be off by one day')
  console.log('  - NEW METHOD 1: Preserves date but involves timezone conversion')
  console.log('  - NEW METHOD 2: Preserves exact date with NO timezone conversion (RECOMMENDED)')
  console.log('  - Database storage: Always stores the correct date')
}

/**
 * Test function to verify the round-trip conversion
 * This ensures that saving and reading dates works correctly
 */
export function testRoundTripConversion() {
  console.log('🔄 Testing Round-Trip Conversion')
  console.log('================================')
  
  const testDateString = '2024-01-15'
  console.log(`\n📅 Test Date: ${testDateString}`)
  
  // Step 1: Convert date input to date-only value for storage (RECOMMENDED)
  const dateForStorage = dateInputToDateOnly(testDateString)
  console.log('💾 Step 1 - Convert to date-only for storage:')
  console.log('  Input:', testDateString)
  console.log('  Date for storage:', dateForStorage.toISOString())
  
  // Step 2: Simulate reading from database and converting to Nairobi for display
  const dateFromDatabase = dateForStorage // Simulate database read
  const nairobiForDisplay = utcToNairobi(dateFromDatabase)
  console.log('\n📖 Step 2 - Convert from database to Nairobi for display:')
  console.log('  Date from database:', dateFromDatabase.toISOString())
  console.log('  Nairobi for display:', nairobiForDisplay.toISOString())
  
  // Step 3: Format for display
  const displayDate = nairobiForDisplay.toISOString().split('T')[0]
  console.log('\n🎨 Step 3 - Format for display:')
  console.log('  Display date:', displayDate)
  
  // Step 4: Verify round-trip
  const roundTripSuccess = displayDate === testDateString
  console.log('\n✅ Round-trip verification:')
  console.log('  Original input:', testDateString)
  console.log('  Final display:', displayDate)
  console.log('  Round-trip successful:', roundTripSuccess ? '✅ YES' : '❌ NO')
  
  return roundTripSuccess
}

/**
 * Get current timezone information for debugging
 */
export function getTimezoneInfo() {
  console.log('🌍 Current Timezone Information')
  console.log('================================')
  
  const now = new Date()
  const nairobiNow = getCurrentNairobiTime()
  
  console.log('🕐 Current time:')
  console.log('  Local time:', now.toISOString())
  console.log('  Local timezone offset:', now.getTimezoneOffset(), 'minutes')
  console.log('  Nairobi time:', nairobiNow.toISOString())
  
  console.log('\n📅 Date input test:')
  const todayString = now.toISOString().split('T')[0]
  console.log('  Today as string:', todayString)
  console.log('  Converted to date-only:', dateInputToDateOnly(todayString).toISOString())
  
  return {
    localTime: now.toISOString(),
    localOffset: now.getTimezoneOffset(),
    nairobiTime: nairobiNow.toISOString(),
    todayString,
    todayDateOnly: dateInputToDateOnly(todayString).toISOString()
  }
}

// Export all test functions
export const timezoneTests = {
  testDateConversion,
  testRoundTripConversion,
  getTimezoneInfo
}

// Auto-run tests if this file is imported in development
if (process.env.NODE_ENV === 'development') {
  console.log('🧪 Timezone test utilities loaded. Run timezoneTests.testDateConversion() to test.')
}
