// Script to investigate cash sales and their related quotations
// This will check the document flow and fix any inconsistencies

import { supabase } from '../lib/supabase-client'
import { 
  proceedToSalesOrder, 
  proceedToInvoice, 
  proceedToCashSaleFromSalesOrder,
  proceedToCashSaleFromInvoice 
} from '../lib/workflow-utils'

async function investigateCashSalesQuotations() {
  console.log('🔍 Investigating cash sales and their related quotations...')
  
  // The specific cash sales mentioned by the user
  const cashSalesToInvestigate = [
    { number: 'CS2509001', client: 'MARY KALOKI', amount: 20384.00 },
    { number: 'CS2509002', client: 'IRISH VILLAGE', amount: 93762.50 },
    { number: 'CS2509003', client: 'IRISH VILLAGE', amount: 522712.50 }
  ]

  for (const cashSale of cashSalesToInvestigate) {
    try {
      console.log(`\n🔍 Investigating Cash Sale: ${cashSale.number}`)
      console.log(`   Client: ${cashSale.client}`)
      console.log(`   Amount: KES ${cashSale.amount}`)
      
      // Find the cash sale record
      const { data: cashSaleRecord, error: cashSaleError } = await supabase
        .from('cash_sales')
        .select(`
          *,
          client:registered_entities(name, phone)
        `)
        .eq('cash_sale_number', cashSale.number)
        .single()

      if (cashSaleError) {
        console.error(`❌ Error fetching cash sale ${cashSale.number}:`, cashSaleError)
        continue
      }

      if (!cashSaleRecord) {
        console.log(`⚠️ Cash sale ${cashSale.number} not found`)
        continue
      }

      console.log(`✅ Found cash sale: ${cashSaleRecord.client?.name} - KES ${cashSaleRecord.grand_total}`)
      console.log(`   Original Quotation: ${cashSaleRecord.original_quotation_number}`)
      console.log(`   Date Created: ${cashSaleRecord.date_created}`)

      // Find the original quotation
      if (cashSaleRecord.original_quotation_number) {
        const { data: quotation, error: quotationError } = await supabase
          .from('quotations')
          .select(`
            *,
            client:registered_entities(name, phone)
          `)
          .eq('quotation_number', cashSaleRecord.original_quotation_number)
          .single()

        if (quotationError) {
          console.error(`❌ Error fetching quotation ${cashSaleRecord.original_quotation_number}:`, quotationError)
          continue
        }

        if (!quotation) {
          console.log(`⚠️ Original quotation ${cashSaleRecord.original_quotation_number} not found`)
          continue
        }

        console.log(`📋 Found quotation: ${quotation.client?.name} - KES ${quotation.grand_total}`)
        console.log(`   Quotation Status: ${quotation.status}`)
        console.log(`   Quotation Date: ${quotation.date_created}`)

        // Check payments for this quotation
        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select('amount, status, payment_date')
          .or(`quotation_number.eq.${quotation.quotation_number},paid_to.eq.${quotation.quotation_number}`)
          .eq('status', 'completed')

        if (paymentsError) {
          console.error(`❌ Error fetching payments:`, paymentsError)
          continue
        }

        const totalPaid = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
        const paymentPercentage = quotation.grand_total > 0 ? (totalPaid / quotation.grand_total) * 100 : 0

        console.log(`💰 Payment Summary:`)
        console.log(`   Total Paid: KES ${totalPaid}`)
        console.log(`   Payment Percentage: ${paymentPercentage.toFixed(2)}%`)
        console.log(`   Number of Payments: ${payments?.length || 0}`)

        if (payments && payments.length > 0) {
          payments.forEach((payment, index) => {
            console.log(`   Payment ${index + 1}: KES ${payment.amount} (${payment.payment_date})`)
          })
        }

        // Check if there are intermediate documents (Sales Order, Invoice)
        const { data: salesOrder } = await supabase
          .from('sales_orders')
          .select('id, order_number, status, date_created')
          .eq('original_quotation_number', quotation.quotation_number)
          .single()

        const { data: invoice } = await supabase
          .from('invoices')
          .select('id, invoice_number, status, date_created')
          .eq('original_quotation_number', quotation.quotation_number)
          .single()

        console.log(`📄 Document Flow Check:`)
        console.log(`   Sales Order: ${salesOrder ? `${salesOrder.order_number} (${salesOrder.status})` : 'Not found'}`)
        console.log(`   Invoice: ${invoice ? `${invoice.invoice_number} (${invoice.status})` : 'Not found'}`)
        console.log(`   Cash Sale: ${cashSaleRecord.cash_sale_number} (${cashSaleRecord.status || 'active'})`)

        // Determine what needs to be fixed
        console.log(`🔧 Analysis:`)
        
        if (quotation.status === 'pending' && totalPaid > 0) {
          console.log(`   ❌ ISSUE: Quotation is still 'pending' but has payments`)
          console.log(`   🔧 FIX: Need to create proper document flow (Quotation → Sales Order → Cash Sale)`)
          
          // Fix the quotation status and document flow
          await fixQuotationDocumentFlow(quotation, totalPaid, paymentPercentage, salesOrder, invoice, cashSaleRecord)
        } else if (quotation.status === 'converted_to_cash_sale' && !salesOrder) {
          console.log(`   ❌ ISSUE: Quotation marked as converted to cash sale but no Sales Order exists`)
          console.log(`   🔧 FIX: Need to create Sales Order first, then proper flow`)
          
          // Fix the document flow
          await fixQuotationDocumentFlow(quotation, totalPaid, paymentPercentage, salesOrder, invoice, cashSaleRecord)
        } else {
          console.log(`   ✅ Document flow appears correct`)
        }

      } else {
        console.log(`⚠️ No original quotation number found for cash sale ${cashSale.number}`)
      }

    } catch (error) {
      console.error(`❌ Error investigating cash sale ${cashSale.number}:`, error)
    }
  }

  console.log(`\n🎉 Investigation completed!`)
}

async function fixQuotationDocumentFlow(quotation: any, totalPaid: number, paymentPercentage: number, salesOrder: any, invoice: any, cashSale: any) {
  try {
    console.log(`\n🔧 Fixing document flow for quotation ${quotation.quotation_number}...`)
    console.log(`   📋 CORRECT FLOW: Quotation → Sales Order → (Invoice OR Cash Sale)`)
    
    // Reset quotation status to pending first
    const { error: resetError } = await supabase
      .from('quotations')
      .update({ status: 'pending' })
      .eq('id', quotation.id)

    if (resetError) {
      console.error(`❌ Error resetting quotation status:`, resetError)
      return
    }

    console.log(`   ✅ Reset quotation status to 'pending'`)

    // STEP 1: Create Sales Order first (any payment > 0)
    if (!salesOrder && totalPaid > 0) {
      console.log(`   🔄 STEP 1: Creating Sales Order...`)
      try {
        await proceedToSalesOrder(quotation.id)
        console.log(`   ✅ Sales Order created`)
      } catch (error) {
        console.error(`   ❌ Error creating Sales Order:`, error)
        return
      }
    }

    // Get the sales order (newly created or existing)
    const { data: currentSalesOrder } = await supabase
      .from('sales_orders')
      .select('id, order_number')
      .eq('original_quotation_number', quotation.quotation_number)
      .single()

    if (currentSalesOrder) {
      console.log(`   📄 Sales Order: ${currentSalesOrder.order_number}`)
      
      // STEP 2: From Sales Order, create either Invoice OR Cash Sale based on payment percentage
      if (paymentPercentage >= 100) {
        // 100% paid → Create Cash Sale from Sales Order
        console.log(`   🔄 STEP 2: Creating Cash Sale from Sales Order (${paymentPercentage.toFixed(2)}% paid)...`)
        try {
          await proceedToCashSaleFromSalesOrder(currentSalesOrder.id)
          console.log(`   ✅ Cash Sale created from Sales Order`)
        } catch (error) {
          console.error(`   ❌ Error creating Cash Sale from Sales Order:`, error)
        }
      } else if (paymentPercentage >= 75) {
        // 75% paid → Create Invoice from Sales Order
        console.log(`   🔄 STEP 2: Creating Invoice from Sales Order (${paymentPercentage.toFixed(2)}% paid)...`)
        try {
          await proceedToInvoice(currentSalesOrder.id)
          console.log(`   ✅ Invoice created from Sales Order`)
        } catch (error) {
          console.error(`   ❌ Error creating Invoice from Sales Order:`, error)
        }
      } else {
        console.log(`   ℹ️ Payment percentage (${paymentPercentage.toFixed(2)}%) is below 75%, no further conversion needed`)
      }
    } else {
      console.log(`   ❌ No Sales Order found after creation attempt`)
    }

    console.log(`   ✅ Document flow fixed for quotation ${quotation.quotation_number}`)

  } catch (error) {
    console.error(`❌ Error fixing document flow:`, error)
  }
}

// Run the investigation
investigateCashSalesQuotations()
