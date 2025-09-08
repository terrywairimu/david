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
      
      // Check if sales order already exists
      const { data: existingSalesOrder } = await supabase
        .from('sales_orders')
        .select('id')
        .eq('original_quotation_number', quotation.quotation_number)
        .single()

      if (existingSalesOrder) {
        console.log(`Sales order already exists for quotation ${quotation.quotation_number}`)
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
