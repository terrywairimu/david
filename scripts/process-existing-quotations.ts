// Script to process all existing quotations and convert them based on payment status
// This can be run manually to catch up on any missed conversions

import { paymentMonitor } from '../lib/real-time-payment-monitor'

async function processAllQuotations() {
  console.log('🚀 Starting to process all existing quotations...')
  
  try {
    await paymentMonitor.processAllQuotations()
    console.log('✅ All quotations processed successfully!')
  } catch (error) {
    console.error('❌ Error processing quotations:', error)
  }
}

// Run the script
processAllQuotations()
