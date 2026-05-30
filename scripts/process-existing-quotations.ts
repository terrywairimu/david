// Script to process all existing quotations and convert them based on payment status
// Run: npx tsx scripts/process-existing-quotations.ts

import fs from 'fs'
import path from 'path'

try {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
      const [key, ...rest] = line.split('=')
      if (key && rest.length > 0) {
        process.env[key.trim()] = rest.join('=').trim()
      }
    })
  }
} catch {
  console.log('Could not read .env.local')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

async function main() {
  const { paymentMonitor } = await import('../lib/real-time-payment-monitor')
  console.log('🚀 Starting to process all existing quotations...')

  try {
    await paymentMonitor.processAllQuotations()
    console.log('✅ All quotations processed successfully!')
  } catch (error) {
    console.error('❌ Error processing quotations:', error)
    process.exit(1)
  }
}

main()
