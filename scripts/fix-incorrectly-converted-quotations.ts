// Script to fix quotations that were incorrectly converted directly to cash_sale
// These should be converted to Sales Orders first, then progressed based on payment thresholds

import { supabase } from '../lib/supabase-client'
import { 
  proceedToSalesOrder, 
  proceedToInvoice, 
  proceedToCashSaleFromSalesOrder,
  proceedToCashSaleFromInvoice 
} from '../lib/workflow-utils'

async function fixIncorrectlyConvertedQuotations() {
  console.log('🔧 Starting to fix incorrectly converted quotations...')
  
  // List of quotations that were incorrectly converted
  const incorrectQuotations = [
    'QT2508002', // MARY KALOKI - KES 20384.00
    'QT2507010'  // IRISH VILLAGE - KES 93762.50
  ]

  for (const quotationNumber of incorrectQuotations) {
    try {
      console.log(`\n🔄 Processing quotation: ${quotationNumber}`)
      
      // Get quotation details
      const { data: quotation, error: quotationError } = await supabase
        .from('quotations')
        .select('*')
        .eq('quotation_number', quotationNumber)
        .single()

      if (quotationError) {
        console.error(`❌ Error fetching quotation ${quotationNumber}:`, quotationError)
        continue
      }

      if (!quotation) {
        console.log(`⚠️ Quotation ${quotationNumber} not found`)
        continue
      }

      console.log(`📋 Found quotation: ${quotation.client?.name || 'Unknown'} - KES ${quotation.grand_total}`)

      // Get payments for this quotation
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, status')
        .or(`quotation_number.eq.${quotationNumber},paid_to.eq.${quotationNumber}`)
        .eq('status', 'completed')

      if (paymentsError) {
        console.error(`❌ Error fetching payments for ${quotationNumber}:`, paymentsError)
        continue
      }

      const totalPaid = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
      const quotationTotal = quotation.grand_total || quotation.total_amount || 0
      const paymentPercentage = quotationTotal > 0 ? (totalPaid / quotationTotal) * 100 : 0

      console.log(`💰 Payment status: ${totalPaid}/${quotationTotal} (${paymentPercentage.toFixed(2)}%)`)

      // Check what documents already exist
      const { data: salesOrder } = await supabase
        .from('sales_orders')
        .select('id, order_number')
        .eq('original_quotation_number', quotationNumber)
        .single()

      const { data: invoice } = await supabase
        .from('invoices')
        .select('id, invoice_number')
        .eq('original_quotation_number', quotationNumber)
        .single()

      const { data: cashSale } = await supabase
        .from('cash_sales')
        .select('id, sale_number')
        .eq('original_quotation_number', quotationNumber)
        .single()

      console.log(`📄 Existing documents:`)
      console.log(`   Sales Order: ${salesOrder ? salesOrder.order_number : 'None'}`)
      console.log(`   Invoice: ${invoice ? invoice.invoice_number : 'None'}`)
      console.log(`   Cash Sale: ${cashSale ? cashSale.sale_number : 'None'}`)

      // Reset quotation status to pending first
      await supabase
        .from('quotations')
        .update({ status: 'pending' })
        .eq('id', quotation.id)

      console.log(`✅ Reset quotation ${quotationNumber} status to pending`)

      // Now follow the correct conversion flow
      if (paymentPercentage > 0 && !salesOrder && !invoice && !cashSale) {
        // Any payment → Create Sales Order
        console.log(`🔄 Creating Sales Order for quotation ${quotationNumber}...`)
        await proceedToSalesOrder(quotation.id)
        
        // Get the newly created sales order
        const { data: newSalesOrder } = await supabase
          .from('sales_orders')
          .select('id, order_number')
          .eq('original_quotation_number', quotationNumber)
          .single()

        if (newSalesOrder) {
          console.log(`✅ Created Sales Order: ${newSalesOrder.order_number}`)
          
          // Now check if we need to progress further based on payment percentage
          if (paymentPercentage >= 100) {
            // 100% paid → Convert Sales Order to Cash Sale
            console.log(`🔄 Converting Sales Order to Cash Sale (100% payment)...`)
            await proceedToCashSaleFromSalesOrder(newSalesOrder.id)
            console.log(`✅ Converted to Cash Sale`)
          } else if (paymentPercentage >= 75) {
            // 75% paid → Convert Sales Order to Invoice
            console.log(`🔄 Converting Sales Order to Invoice (75% payment)...`)
            await proceedToInvoice(newSalesOrder.id)
            console.log(`✅ Converted to Invoice`)
          }
        }
      } else if (salesOrder && !invoice && !cashSale) {
        // We have a sales order, check if we need to convert it
        if (paymentPercentage >= 100) {
          // 100% paid → Convert Sales Order to Cash Sale
          console.log(`🔄 Converting existing Sales Order to Cash Sale (100% payment)...`)
          await proceedToCashSaleFromSalesOrder(salesOrder.id)
          console.log(`✅ Converted to Cash Sale`)
        } else if (paymentPercentage >= 75) {
          // 75% paid → Convert Sales Order to Invoice
          console.log(`🔄 Converting existing Sales Order to Invoice (75% payment)...`)
          await proceedToInvoice(salesOrder.id)
          console.log(`✅ Converted to Invoice`)
        }
      } else if (invoice && !cashSale && paymentPercentage >= 100) {
        // We have an invoice and 100% paid → Convert Invoice to Cash Sale
        console.log(`🔄 Converting existing Invoice to Cash Sale (100% payment)...`)
        await proceedToCashSaleFromInvoice(invoice.id)
        console.log(`✅ Converted to Cash Sale`)
      }

      console.log(`✅ Successfully processed quotation ${quotationNumber}`)

    } catch (error) {
      console.error(`❌ Error processing quotation ${quotationNumber}:`, error)
    }
  }

  console.log('\n🎉 Finished fixing incorrectly converted quotations!')
}

// Run the script
fixIncorrectlyConvertedQuotations()
