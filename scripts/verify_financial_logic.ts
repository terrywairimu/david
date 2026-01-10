
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyFinancialLogic() {
    console.log('--- Verifying Financial Report Queries ---')

    const start = new Date(new Date().getFullYear(), 0, 1).toISOString() // Start of year
    const end = new Date().toISOString() // Now

    console.log(`Time Range: ${start} to ${end}`)

    try {
        // 1. Fetch Payments
        console.log('\n[1] Querying "payments"...')
        const { data: payments, error: payError } = await supabase
            .from('payments')
            .select('amount, date_paid, payment_method, status')
            .gte('date_paid', start)
            .lte('date_paid', end)

        if (payError) throw payError
        console.log(`   Found ${payments?.length || 0} payments.`)
        const totalPayments = (payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0)
        console.log(`   Total Payments: ${totalPayments}`)

        // 2. Fetch Cash Sales
        console.log('\n[2] Querying "cash_sales"...')
        const { data: cashSales, error: cashError } = await supabase
            .from('cash_sales')
            .select('amount_paid, date_created')
            .gte('date_created', start)
            .lte('date_created', end)

        if (cashError) throw cashError
        console.log(`   Found ${cashSales?.length || 0} cash sales.`)
        const totalCashSales = (cashSales || []).reduce((sum, c) => sum + Number(c.amount_paid || 0), 0)
        console.log(`   Total Cash Sales: ${totalCashSales}`)

        // 3. Fetch Expenses
        console.log('\n[3] Querying "expenses"...')
        const { data: expenses, error: expError } = await supabase
            .from('expenses')
            .select('amount, date_created, category, expense_type')
            .gte('date_created', start)
            .lte('date_created', end)

        if (expError) throw expError
        console.log(`   Found ${expenses?.length || 0} expenses.`)
        const totalExpenses = (expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0)
        console.log(`   Total Expenses: ${totalExpenses}`)

        // 4. Aggregate
        const totalRevenue = totalPayments + totalCashSales
        const netProfit = totalRevenue - totalExpenses

        console.log('\n--- Financial Summary ---')
        console.log(`Total Revenue: ${totalRevenue}`)
        console.log(`Total Expenses: (${totalExpenses})`)
        console.log(`Net Profit:    ${netProfit}`)

        console.log('\n✅ Verification Successful: Queries execute without error and return data structure.')

    } catch (err) {
        console.error('\n❌ Verification Failed:', err)
    }
}

verifyFinancialLogic()
