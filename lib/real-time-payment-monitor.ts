import { supabase } from './supabase-client'
import { toast } from 'sonner'
import { 
  proceedToSalesOrder, 
  proceedToInvoice, 
  proceedToCashSale, 
  proceedToCashSaleFromSalesOrder,
  proceedToCashSaleFromInvoice 
} from './workflow-utils'

// Real-time payment monitoring and automatic document conversion
export class RealTimePaymentMonitor {
  private static instance: RealTimePaymentMonitor
  private isMonitoring = false
  private paymentChannel: any = null

  static getInstance(): RealTimePaymentMonitor {
    if (!RealTimePaymentMonitor.instance) {
      RealTimePaymentMonitor.instance = new RealTimePaymentMonitor()
    }
    return RealTimePaymentMonitor.instance
  }

  // Start monitoring payments in real-time
  startMonitoring() {
    if (this.isMonitoring) return

    this.isMonitoring = true
    console.log('🔄 Starting real-time payment monitoring...')

    // Subscribe to payments table changes
    this.paymentChannel = supabase
      .channel('payment-monitor')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payments'
        },
        async (payload) => {
          console.log('💰 New payment received:', payload.new)
          await this.processNewPayment(payload.new)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payments'
        },
        async (payload) => {
          console.log('💰 Payment updated:', payload.new)
          await this.processPaymentUpdate(payload.new)
        }
      )
      .subscribe()

    // Also monitor quotation_payments table if it exists
    this.monitorQuotationPayments()
  }

  // Monitor quotation_payments table
  private monitorQuotationPayments() {
    const quotationPaymentChannel = supabase
      .channel('quotation-payment-monitor')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quotation_payments'
        },
        async (payload) => {
          console.log('💰 Quotation payment change:', payload)
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            await this.processQuotationPayment(payload.new)
          }
        }
      )
      .subscribe()
  }

  // Process new payment
  private async processNewPayment(payment: any) {
    try {
      if (payment.status !== 'completed') return

      const paidTo = payment.paid_to || payment.quotation_number || payment.invoice_number
      if (!paidTo) return

      console.log(`🔍 Processing payment for: ${paidTo}`)
      
      // Check if this is a quotation payment
      await this.checkQuotationProgression(paidTo)
      
      // Check if this is a sales order payment
      await this.checkSalesOrderProgression(paidTo)
      
      // Check if this is an invoice payment
      await this.checkInvoiceProgression(paidTo)

    } catch (error) {
      console.error('❌ Error processing new payment:', error)
    }
  }

  // Process payment update
  private async processPaymentUpdate(payment: any) {
    try {
      if (payment.status !== 'completed') return

      const paidTo = payment.paid_to || payment.quotation_number || payment.invoice_number
      if (!paidTo) return

      console.log(`🔄 Processing payment update for: ${paidTo}`)
      
      // Re-check progression for this document
      await this.checkQuotationProgression(paidTo)
      await this.checkSalesOrderProgression(paidTo)
      await this.checkInvoiceProgression(paidTo)

    } catch (error) {
      console.error('❌ Error processing payment update:', error)
    }
  }

  // Process quotation payment
  private async processQuotationPayment(payment: any) {
    try {
      if (payment.status !== 'completed') return

      const quotationNumber = payment.quotation_number
      if (!quotationNumber) return

      console.log(`🔍 Processing quotation payment for: ${quotationNumber}`)
      await this.checkQuotationProgression(quotationNumber)

    } catch (error) {
      console.error('❌ Error processing quotation payment:', error)
    }
  }

  // Check quotation progression
  private async checkQuotationProgression(documentNumber: string) {
    try {
      // Get quotation details
      const { data: quotation, error: quotationError } = await supabase
        .from('quotations')
        .select('*')
        .eq('quotation_number', documentNumber)
        .single()

      if (quotationError || !quotation) return

      // Get all payments for this quotation
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, status')
        .or(`quotation_number.eq.${documentNumber},paid_to.eq.${documentNumber}`)
        .eq('status', 'completed')

      if (paymentsError) return

      const totalPaid = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
      const quotationTotal = quotation.grand_total || quotation.total_amount || 0
      const paymentPercentage = quotationTotal > 0 ? (totalPaid / quotationTotal) * 100 : 0

      console.log(`📊 Quotation ${documentNumber}: ${paymentPercentage.toFixed(2)}% paid (${totalPaid}/${quotationTotal})`)

      // Auto-convert based on payment percentage
      if (paymentPercentage > 0 && quotation.status !== 'converted_to_sales_order') {
        // Any payment received → Convert to Sales Order
        await this.convertQuotationToSalesOrder(quotation)
      }

    } catch (error) {
      console.error('❌ Error checking quotation progression:', error)
    }
  }

  // Check sales order progression
  private async checkSalesOrderProgression(documentNumber: string) {
    try {
      // Get sales order details
      const { data: salesOrder, error: salesOrderError } = await supabase
        .from('sales_orders')
        .select('*')
        .eq('order_number', documentNumber)
        .single()

      if (salesOrderError || !salesOrder) return

      // Get original quotation
      const { data: quotation, error: quotationError } = await supabase
        .from('quotations')
        .select('*')
        .eq('quotation_number', salesOrder.original_quotation_number)
        .single()

      if (quotationError || !quotation) return

      // Get all payments for the original quotation
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, status')
        .or(`quotation_number.eq.${quotation.quotation_number},paid_to.eq.${quotation.quotation_number}`)
        .eq('status', 'completed')

      if (paymentsError) return

      const totalPaid = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
      const quotationTotal = quotation.grand_total || quotation.total_amount || 0
      const paymentPercentage = quotationTotal > 0 ? (totalPaid / quotationTotal) * 100 : 0

      console.log(`📊 Sales Order ${documentNumber}: ${paymentPercentage.toFixed(2)}% paid (${totalPaid}/${quotationTotal})`)

      // Auto-convert based on payment percentage
      if (paymentPercentage >= 100) {
        // 100% paid → Convert Sales Order to Cash Sale
        await this.convertSalesOrderToCashSale(salesOrder)
      } else if (paymentPercentage >= 75) {
        // 75% paid → Convert Sales Order to Invoice
        await this.convertSalesOrderToInvoice(salesOrder)
      }

    } catch (error) {
      console.error('❌ Error checking sales order progression:', error)
    }
  }

  // Check invoice progression
  private async checkInvoiceProgression(documentNumber: string) {
    try {
      // Get invoice details
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('invoice_number', documentNumber)
        .single()

      if (invoiceError || !invoice) return

      // Get original quotation
      const { data: quotation, error: quotationError } = await supabase
        .from('quotations')
        .select('*')
        .eq('quotation_number', invoice.original_quotation_number)
        .single()

      if (quotationError || !quotation) return

      // Get all payments for the original quotation
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, status')
        .or(`quotation_number.eq.${quotation.quotation_number},paid_to.eq.${quotation.quotation_number}`)
        .eq('status', 'completed')

      if (paymentsError) return

      const totalPaid = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
      const quotationTotal = quotation.grand_total || quotation.total_amount || 0
      const paymentPercentage = quotationTotal > 0 ? (totalPaid / quotationTotal) * 100 : 0

      console.log(`📊 Invoice ${documentNumber}: ${paymentPercentage.toFixed(2)}% paid (${totalPaid}/${quotationTotal})`)

      // Auto-convert based on payment percentage
      if (paymentPercentage >= 100) {
        // 100% paid → Convert Invoice to Cash Sale
        await this.convertInvoiceToCashSale(invoice)
      }

    } catch (error) {
      console.error('❌ Error checking invoice progression:', error)
    }
  }

  // Convert quotation to sales order
  private async convertQuotationToSalesOrder(quotation: any) {
    try {
      console.log(`🔄 Converting quotation ${quotation.quotation_number} to Sales Order...`)
      
      // Check if sales order already exists (more comprehensive check)
      const { data: existingSalesOrders, error: checkError } = await supabase
        .from('sales_orders')
        .select('id, order_number, date_created')
        .eq('original_quotation_number', quotation.quotation_number)

      if (checkError) {
        console.error(`❌ Error checking existing sales orders:`, checkError)
        return
      }

      if (existingSalesOrders && existingSalesOrders.length > 0) {
        console.log(`⚠️ Sales order(s) already exist for quotation ${quotation.quotation_number}:`)
        existingSalesOrders.forEach(order => {
          console.log(`   - ${order.order_number} (${order.date_created})`)
        })
        
        // If there are multiple, clean up duplicates
        if (existingSalesOrders.length > 1) {
          console.log(`🧹 Cleaning up ${existingSalesOrders.length - 1} duplicate sales orders...`)
          await this.cleanupDuplicateSalesOrdersForQuotation(quotation.quotation_number, existingSalesOrders)
        }
        
        return
      }

      // Check if quotation is already converted
      if (quotation.status === 'converted_to_sales_order') {
        console.log(`⚠️ Quotation ${quotation.quotation_number} is already marked as converted to sales order`)
        return
      }

      // Create the actual sales order
      await proceedToSalesOrder(quotation.id)

      toast.success(`Quotation ${quotation.quotation_number} automatically converted to Sales Order (payment received)`)
      console.log(`✅ Quotation ${quotation.quotation_number} converted to Sales Order`)

    } catch (error) {
      console.error('❌ Error converting quotation to sales order:', error)
      toast.error(`Failed to convert quotation ${quotation.quotation_number} to Sales Order`)
    }
  }

  // Convert sales order to invoice
  private async convertSalesOrderToInvoice(salesOrder: any) {
    try {
      console.log(`🔄 Converting sales order ${salesOrder.order_number} to Invoice...`)
      
      // Check if invoice already exists
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('sales_order_id', salesOrder.id)
        .single()

      if (existingInvoice) {
        console.log(`Invoice already exists for sales order ${salesOrder.order_number}`)
        return
      }

      // Convert sales order to invoice
      await proceedToInvoice(salesOrder.id)

      toast.success(`Sales Order ${salesOrder.order_number} automatically converted to Invoice (75% payment received)`)
      console.log(`✅ Sales Order ${salesOrder.order_number} converted to Invoice`)

    } catch (error) {
      console.error('❌ Error converting sales order to invoice:', error)
      toast.error(`Failed to convert sales order ${salesOrder.order_number} to Invoice`)
    }
  }

  // Convert sales order to cash sale
  private async convertSalesOrderToCashSale(salesOrder: any) {
    try {
      console.log(`🔄 Converting sales order ${salesOrder.order_number} to Cash Sale...`)
      
      // Check if cash sale already exists
      const { data: existingCashSale } = await supabase
        .from('cash_sales')
        .select('id')
        .eq('sales_order_id', salesOrder.id)
        .single()

      if (existingCashSale) {
        console.log(`Cash sale already exists for sales order ${salesOrder.order_number}`)
        return
      }

      // Convert sales order to cash sale
      await proceedToCashSaleFromSalesOrder(salesOrder.id)

      toast.success(`Sales Order ${salesOrder.order_number} automatically converted to Cash Sale (100% payment received)`)
      console.log(`✅ Sales Order ${salesOrder.order_number} converted to Cash Sale`)

    } catch (error) {
      console.error('❌ Error converting sales order to cash sale:', error)
      toast.error(`Failed to convert sales order ${salesOrder.order_number} to Cash Sale`)
    }
  }

  // Convert invoice to cash sale
  private async convertInvoiceToCashSale(invoice: any) {
    try {
      console.log(`🔄 Converting invoice ${invoice.invoice_number} to Cash Sale...`)
      
      // Check if cash sale already exists
      const { data: existingCashSale } = await supabase
        .from('cash_sales')
        .select('id')
        .eq('invoice_id', invoice.id)
        .single()

      if (existingCashSale) {
        console.log(`Cash sale already exists for invoice ${invoice.invoice_number}`)
        return
      }

      // Convert invoice to cash sale
      await proceedToCashSaleFromInvoice(invoice.id)

      toast.success(`Invoice ${invoice.invoice_number} automatically converted to Cash Sale (100% payment received)`)
      console.log(`✅ Invoice ${invoice.invoice_number} converted to Cash Sale`)

    } catch (error) {
      console.error('❌ Error converting invoice to cash sale:', error)
      toast.error(`Failed to convert invoice ${invoice.invoice_number} to Cash Sale`)
    }
  }

  // Clean up duplicate sales orders for a specific quotation
  private async cleanupDuplicateSalesOrdersForQuotation(quotationNumber: string, existingOrders: any[]) {
    try {
      console.log(`🧹 Cleaning up duplicate sales orders for quotation ${quotationNumber}...`)
      
      // Sort by date created (keep the first one)
      const sortedOrders = existingOrders.sort((a, b) => 
        new Date(a.date_created).getTime() - new Date(b.date_created).getTime()
      )
      
      const keepOrder = sortedOrders[0]
      const deleteOrders = sortedOrders.slice(1)
      
      console.log(`   ✅ Keeping: ${keepOrder.order_number} (${keepOrder.date_created})`)
      
      for (const deleteOrder of deleteOrders) {
        console.log(`   ❌ Deleting: ${deleteOrder.order_number} (${deleteOrder.date_created})`)
        
        try {
          // Delete sales order items first
          const { error: itemsError } = await supabase
            .from('sales_order_items')
            .delete()
            .eq('sales_order_id', deleteOrder.id)
          
          if (itemsError) {
            console.error(`   ⚠️ Error deleting items for ${deleteOrder.order_number}:`, itemsError)
          }
          
          // Delete the sales order
          const { error: deleteError } = await supabase
            .from('sales_orders')
            .delete()
            .eq('id', deleteOrder.id)
          
          if (deleteError) {
            console.error(`   ❌ Error deleting ${deleteOrder.order_number}:`, deleteError)
          } else {
            console.log(`   ✅ Successfully deleted ${deleteOrder.order_number}`)
          }
        } catch (error) {
          console.error(`   ❌ Error processing ${deleteOrder.order_number}:`, error)
        }
      }
      
      console.log(`✅ Cleanup completed for quotation ${quotationNumber}`)
    } catch (error) {
      console.error(`❌ Error cleaning up duplicates for quotation ${quotationNumber}:`, error)
    }
  }

  // Fix cash sales that have quotations still showing as pending
  async fixCashSalesWithPendingQuotations() {
    try {
      console.log('🔧 Fixing cash sales with pending quotations...')
      
      // Get all cash sales
      const { data: cashSales, error } = await supabase
        .from('cash_sales')
        .select(`
          *,
          client:registered_entities(name, phone)
        `)
        .not('original_quotation_number', 'is', null)

      if (error) throw error

      if (!cashSales || cashSales.length === 0) {
        console.log('No cash sales found')
        return
      }

      let fixedCount = 0

      for (const cashSale of cashSales) {
        try {
          // Get the original quotation
          const { data: quotation, error: quotationError } = await supabase
            .from('quotations')
            .select('*')
            .eq('quotation_number', cashSale.original_quotation_number)
            .single()

          if (quotationError || !quotation) {
            console.log(`⚠️ Quotation ${cashSale.original_quotation_number} not found for cash sale ${cashSale.cash_sale_number}`)
            continue
          }

          // Check if quotation is still pending
          if (quotation.status === 'pending') {
            console.log(`🔧 Fixing quotation ${quotation.quotation_number} for cash sale ${cashSale.cash_sale_number}`)
            
            // Get payments for this quotation
            const { data: payments } = await supabase
              .from('payments')
              .select('amount, status')
              .or(`quotation_number.eq.${quotation.quotation_number},paid_to.eq.${quotation.quotation_number}`)
              .eq('status', 'completed')

            const totalPaid = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
            const paymentPercentage = quotation.grand_total > 0 ? (totalPaid / quotation.grand_total) * 100 : 0

            console.log(`   💰 Total paid: KES ${totalPaid} (${paymentPercentage.toFixed(2)}%)`)

            // Check what documents exist
            const { data: salesOrder } = await supabase
              .from('sales_orders')
              .select('id, order_number')
              .eq('original_quotation_number', quotation.quotation_number)
              .single()

            const { data: invoice } = await supabase
              .from('invoices')
              .select('id, invoice_number')
              .eq('original_quotation_number', quotation.quotation_number)
              .single()

            console.log(`   📄 Document flow check:`)
            console.log(`     Sales Order: ${salesOrder ? salesOrder.order_number : 'Not found'}`)
            console.log(`     Invoice: ${invoice ? invoice.invoice_number : 'Not found'}`)
            console.log(`     Cash Sale: ${cashSale.cash_sale_number}`)

            // CORRECT FLOW: Quotation → Sales Order → (Invoice OR Cash Sale)
            // If cash sale exists but no sales order, we need to create the proper flow
            if (!salesOrder && totalPaid > 0) {
              console.log(`   🔄 Creating missing Sales Order first...`)
              try {
                await proceedToSalesOrder(quotation.id)
                console.log(`   ✅ Sales Order created`)
                
                // Get the newly created sales order
                const { data: newSalesOrder } = await supabase
                  .from('sales_orders')
                  .select('id, order_number')
                  .eq('original_quotation_number', quotation.quotation_number)
                  .single()
                
                if (newSalesOrder) {
                  // Now create the cash sale from the sales order (not directly from quotation)
                  console.log(`   🔄 Creating Cash Sale from Sales Order...`)
                  await proceedToCashSaleFromSalesOrder(newSalesOrder.id)
                  console.log(`   ✅ Cash Sale created from Sales Order`)
                }
              } catch (error) {
                console.error(`   ❌ Error creating proper document flow:`, error)
              }
            } else if (salesOrder && !invoice && paymentPercentage >= 100) {
              // Sales order exists, payment is 100%, create cash sale from sales order
              console.log(`   🔄 Creating Cash Sale from existing Sales Order...`)
              try {
                await proceedToCashSaleFromSalesOrder(salesOrder.id)
                console.log(`   ✅ Cash Sale created from Sales Order`)
              } catch (error) {
                console.error(`   ❌ Error creating Cash Sale from Sales Order:`, error)
              }
            }

            // Update quotation status to reflect the proper conversion
            const { error: updateError } = await supabase
              .from('quotations')
              .update({ status: 'converted_to_cash_sale' })
              .eq('id', quotation.id)

            if (updateError) {
              console.error(`   ❌ Error updating quotation status:`, updateError)
            } else {
              console.log(`   ✅ Updated quotation status to: converted_to_cash_sale`)
              fixedCount++
            }
          }

        } catch (error) {
          console.error(`❌ Error processing cash sale ${cashSale.cash_sale_number}:`, error)
        }
      }

      console.log(`✅ Fixed ${fixedCount} quotations with incorrect status`)

    } catch (error) {
      console.error('❌ Error fixing cash sales with pending quotations:', error)
    }
  }

  // Clean up all duplicate sales orders
  async cleanupAllDuplicateSalesOrders() {
    try {
      console.log('🧹 Starting comprehensive cleanup of duplicate sales orders...')
      
      // Get all sales orders
      const { data: salesOrders, error } = await supabase
        .from('sales_orders')
        .select(`
          id,
          order_number,
          client_id,
          original_quotation_number,
          grand_total,
          date_created,
          status,
          client:registered_entities(name)
        `)
        .order('date_created', { ascending: true })

      if (error) throw error

      if (!salesOrders || salesOrders.length === 0) {
        console.log('No sales orders found')
        return
      }

      // Group by quotation number to find duplicates
      const quotationGroups = new Map<string, any[]>()
      
      for (const order of salesOrders) {
        if (order.original_quotation_number) {
          const key = order.original_quotation_number
          if (!quotationGroups.has(key)) {
            quotationGroups.set(key, [])
          }
          quotationGroups.get(key)!.push(order)
        }
      }

      // Find groups with duplicates
      const duplicateGroups = Array.from(quotationGroups.entries())
        .filter(([quotation, orders]) => orders.length > 1)

      console.log(`📊 Found ${duplicateGroups.length} quotations with duplicate sales orders`)

      let totalDeleted = 0
      let totalKept = 0

      for (const [quotationNumber, orders] of duplicateGroups) {
        console.log(`\n🔄 Processing quotation ${quotationNumber} with ${orders.length} sales orders`)
        
        await this.cleanupDuplicateSalesOrdersForQuotation(quotationNumber, orders)
        
        totalKept++
        totalDeleted += orders.length - 1
      }

      console.log(`\n🎉 Comprehensive cleanup completed!`)
      console.log(`   📊 Quotations processed: ${duplicateGroups.length}`)
      console.log(`   ✅ Sales orders kept: ${totalKept}`)
      console.log(`   ❌ Sales orders deleted: ${totalDeleted}`)

    } catch (error) {
      console.error('❌ Error during comprehensive cleanup:', error)
    }
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.paymentChannel) {
      supabase.removeChannel(this.paymentChannel)
      this.paymentChannel = null
    }
    this.isMonitoring = false
    console.log('🛑 Stopped real-time payment monitoring')
  }

  // Fix quotations that were incorrectly converted directly to cash_sale
  async fixIncorrectlyConvertedQuotations() {
    try {
      console.log('🔧 Fixing incorrectly converted quotations...')
      
      // Get quotations that were incorrectly converted directly to cash_sale
      const { data: incorrectQuotations, error } = await supabase
        .from('quotations')
        .select('*')
        .eq('status', 'converted_to_cash_sale')

      if (error) throw error

      let fixedCount = 0
      for (const quotation of incorrectQuotations || []) {
        try {
          console.log(`🔄 Fixing quotation ${quotation.quotation_number}...`)
          
          // Get payments for this quotation
          const { data: payments } = await supabase
            .from('payments')
            .select('amount, status')
            .or(`quotation_number.eq.${quotation.quotation_number},paid_to.eq.${quotation.quotation_number}`)
            .eq('status', 'completed')

          const totalPaid = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
          const quotationTotal = quotation.grand_total || quotation.total_amount || 0
          const paymentPercentage = quotationTotal > 0 ? (totalPaid / quotationTotal) * 100 : 0

          if (totalPaid > 0) {
            console.log(`📊 Quotation ${quotation.quotation_number}: ${paymentPercentage.toFixed(2)}% paid (${totalPaid}/${quotationTotal})`)
            
            // Check what documents already exist
            const { data: salesOrder } = await supabase
              .from('sales_orders')
              .select('id')
              .eq('original_quotation_number', quotation.quotation_number)
              .single()

            const { data: invoice } = await supabase
              .from('invoices')
              .select('id')
              .eq('original_quotation_number', quotation.quotation_number)
              .single()

            const { data: cashSale } = await supabase
              .from('cash_sales')
              .select('id')
              .eq('original_quotation_number', quotation.quotation_number)
              .single()

            // Reset quotation status to pending
            await supabase
              .from('quotations')
              .update({ status: 'pending' })
              .eq('id', quotation.id)

            // Follow correct conversion flow
            if (!salesOrder && !invoice && !cashSale) {
              // Create Sales Order first
              await proceedToSalesOrder(quotation.id)
              
              // Get the newly created sales order
              const { data: newSalesOrder } = await supabase
                .from('sales_orders')
                .select('id')
                .eq('original_quotation_number', quotation.quotation_number)
                .single()
              
              if (newSalesOrder) {
                if (paymentPercentage >= 100) {
                  // 100% paid → Convert Sales Order to Cash Sale
                  await proceedToCashSaleFromSalesOrder(newSalesOrder.id)
                } else if (paymentPercentage >= 75) {
                  // 75% paid → Convert Sales Order to Invoice
                  await proceedToInvoice(newSalesOrder.id)
                }
              }
              fixedCount++
            }
          }
        } catch (error) {
          console.error(`❌ Error fixing quotation ${quotation.quotation_number}:`, error)
        }
      }

      console.log(`✅ Fixed ${fixedCount} incorrectly converted quotations`)
    } catch (error) {
      console.error('❌ Error fixing incorrectly converted quotations:', error)
    }
  }

  // Process all existing quotations to catch up on missed conversions
  async processAllQuotations() {
    try {
      console.log('🔄 Processing all existing quotations for missed conversions...')
      
      // Get all quotations that might have payments
      const { data: quotations, error } = await supabase
        .from('quotations')
        .select('*')
        .in('status', ['pending', 'draft', 'converted_to_sales_order', 'converted_to_invoice', 'converted_to_cash_sale'])

      if (error) throw error

      let processedCount = 0
      for (const quotation of quotations || []) {
        try {
          // Get payments for this quotation
          const { data: payments } = await supabase
            .from('payments')
            .select('amount, status')
            .or(`quotation_number.eq.${quotation.quotation_number},paid_to.eq.${quotation.quotation_number}`)
            .eq('status', 'completed')

          const totalPaid = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
          const quotationTotal = quotation.grand_total || quotation.total_amount || 0
          const paymentPercentage = quotationTotal > 0 ? (totalPaid / quotationTotal) * 100 : 0

          if (totalPaid > 0) {
            console.log(`📊 Processing quotation ${quotation.quotation_number}: ${paymentPercentage.toFixed(2)}% paid (${totalPaid}/${quotationTotal})`)
            
            // Check what documents already exist
            const { data: salesOrder } = await supabase
              .from('sales_orders')
              .select('id')
              .eq('original_quotation_number', quotation.quotation_number)
              .single()

            const { data: invoice } = await supabase
              .from('invoices')
              .select('id')
              .eq('original_quotation_number', quotation.quotation_number)
              .single()

            const { data: cashSale } = await supabase
              .from('cash_sales')
              .select('id')
              .eq('original_quotation_number', quotation.quotation_number)
              .single()

            // Create missing documents based on payment percentage following correct flow:
            // Quotation → Sales Order (any payment) → Invoice (75%) OR Cash Sale (100%)
            // Invoice → Cash Sale (100%)
            
            if (paymentPercentage > 0 && !salesOrder && !invoice && !cashSale) {
              // Any payment → Create Sales Order
              await proceedToSalesOrder(quotation.id)
              processedCount++
            } else if (salesOrder && !invoice && !cashSale) {
              // We have a sales order, check if we need to convert it
              if (paymentPercentage >= 100) {
                // 100% paid → Convert Sales Order to Cash Sale
                await proceedToCashSaleFromSalesOrder(salesOrder.id)
                processedCount++
              } else if (paymentPercentage >= 75) {
                // 75% paid → Convert Sales Order to Invoice
                await proceedToInvoice(salesOrder.id)
                processedCount++
              }
            } else if (invoice && !cashSale && paymentPercentage >= 100) {
              // We have an invoice and 100% paid → Convert Invoice to Cash Sale
              await proceedToCashSaleFromInvoice(invoice.id)
              processedCount++
            }
          }
        } catch (error) {
          console.error(`❌ Error processing quotation ${quotation.quotation_number}:`, error)
        }
      }

      console.log(`✅ Processed ${processedCount} quotations with payments`)
    } catch (error) {
      console.error('❌ Error processing all quotations:', error)
    }
  }
}

// Export singleton instance
export const paymentMonitor = RealTimePaymentMonitor.getInstance()
