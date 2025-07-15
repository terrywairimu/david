import { supabase } from "./supabase-client"
import { toast } from "sonner"

export interface WorkflowItem {
  id?: number
  category: "cabinet" | "worktop" | "accessories"
  description: string
  unit: string
  quantity: number
  unit_price: number
  total_price: number
  stock_item_id?: number
}

export interface QuotationData {
  id: number
  quotation_number: string
  client_id: number
  date_created: string
  valid_until: string
  cabinet_total: number
  worktop_total: number
  accessories_total: number
  labour_percentage: number
  labour_total: number
  total_amount: number
  grand_total: number
  include_accessories: boolean
  status: string
  notes?: string
  terms_conditions?: string
  client?: {
    id: number
    name: string
    phone?: string
    location?: string
  }
  items?: WorkflowItem[]
}

export interface SalesOrderData {
  id?: number
  order_number: string
  client_id: number
  quotation_id?: number
  original_quotation_number?: string
  date_created: string
  cabinet_total: number
  worktop_total: number
  accessories_total: number
  labour_percentage: number
  labour_total: number
  total_amount: number
  grand_total: number
  include_accessories: boolean
  status: string
  notes?: string
  terms_conditions?: string
  client?: {
    id: number
    name: string
    phone?: string
    location?: string
  }
  items?: WorkflowItem[]
}

export interface PaymentData {
  id?: number
  payment_number: string
  client_id: number
  quotation_number: string
  amount: number
  payment_method: string
  account_paid_to: string
  date_paid: string
  description: string
  reference_number?: string
  status: string
}

// Generate next number in sequence
export const generateNextNumber = async (table: string, field: string, prefix: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(field)
      .order("id", { ascending: false })
      .limit(1)

    if (error) throw error

    let nextNumber = 1
    if (data && data.length > 0) {
      const lastNumber = data[0][field].match(/\d+/)
      if (lastNumber) {
        nextNumber = parseInt(lastNumber[0]) + 1
      }
    }

    return `${prefix}-${nextNumber.toString().padStart(4, "0")}`
  } catch (error) {
    console.error(`Error generating ${table} number:`, error)
    throw error
  }
}

// Check payment requirements for quotation
export const checkPaymentRequirements = async (quotationNumber: string, requiredPercentage: number = 0): Promise<{
  hasPayments: boolean
  totalPaid: number
  paymentPercentage: number
  quotationTotal: number
}> => {
  try {
    // Get quotation total
    const { data: quotationData, error: quotationError } = await supabase
      .from("quotations")
      .select("grand_total")
      .eq("quotation_number", quotationNumber)
      .single()

    if (quotationError) throw quotationError

    // Get payments for this quotation
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("amount")
      .eq("quotation_number", quotationNumber)
      .eq("status", "completed")

    if (paymentsError) throw paymentsError

    const totalPaid = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
    const paymentPercentage = quotationData.grand_total > 0 ? (totalPaid / quotationData.grand_total) * 100 : 0

    return {
      hasPayments: payments && payments.length > 0,
      totalPaid,
      paymentPercentage,
      quotationTotal: quotationData.grand_total
    }
  } catch (error) {
    console.error("Error checking payment requirements:", error)
    throw error
  }
}

// Convert quotation to sales order
export const proceedToSalesOrder = async (quotationId: number): Promise<SalesOrderData> => {
  try {
    // Get quotation data with items
    const { data: quotation, error: quotationError } = await supabase
      .from("quotations")
      .select(`
        *,
        client:registered_entities(id, name, phone, location),
        items:quotation_items(*)
      `)
      .eq("id", quotationId)
      .single()

    if (quotationError) throw quotationError

    // Check payment requirements
    const paymentInfo = await checkPaymentRequirements(quotation.quotation_number)
    
    if (!paymentInfo.hasPayments) {
      throw new Error("Cannot convert to sales order. At least one payment must be made for this quotation.")
    }

    if (paymentInfo.totalPaid <= 0) {
      throw new Error("Invalid payment amount. Payment must be greater than 0.")
    }

    // Generate sales order number
    const orderNumber = await generateNextNumber("sales_orders", "order_number", "SO")

    // Create sales order
    const salesOrderData: SalesOrderData = {
      order_number: orderNumber,
      client_id: quotation.client_id,
      quotation_id: quotation.id,
      original_quotation_number: quotation.quotation_number,
      date_created: new Date().toISOString().split('T')[0],
      cabinet_total: quotation.cabinet_total,
      worktop_total: quotation.worktop_total,
      accessories_total: quotation.accessories_total,
      labour_percentage: quotation.labour_percentage,
      labour_total: quotation.labour_total,
      total_amount: quotation.total_amount,
      grand_total: quotation.grand_total,
      include_accessories: quotation.include_accessories,
      status: "pending",
      notes: quotation.notes,
      terms_conditions: quotation.terms_conditions,
      client: quotation.client,
      items: quotation.items
    }

    // Insert sales order
    const { data: newSalesOrder, error: salesOrderError } = await supabase
      .from("sales_orders")
      .insert({
        order_number: salesOrderData.order_number,
        client_id: salesOrderData.client_id,
        quotation_id: salesOrderData.quotation_id,
        original_quotation_number: salesOrderData.original_quotation_number,
        date_created: salesOrderData.date_created,
        cabinet_total: salesOrderData.cabinet_total,
        worktop_total: salesOrderData.worktop_total,
        accessories_total: salesOrderData.accessories_total,
        labour_percentage: salesOrderData.labour_percentage,
        labour_total: salesOrderData.labour_total,
        total_amount: salesOrderData.total_amount,
        grand_total: salesOrderData.grand_total,
        include_accessories: salesOrderData.include_accessories,
        status: salesOrderData.status,
        notes: salesOrderData.notes,
        terms_conditions: salesOrderData.terms_conditions
      })
      .select()
      .single()

    if (salesOrderError) throw salesOrderError

    // Insert sales order items
    if (salesOrderData.items && salesOrderData.items.length > 0) {
      const salesOrderItems = salesOrderData.items.map(item => ({
        sales_order_id: newSalesOrder.id,
        category: item.category,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        stock_item_id: item.stock_item_id
      }))

      const { error: itemsError } = await supabase
        .from("sales_order_items")
        .insert(salesOrderItems)

      if (itemsError) throw itemsError
    }

    // Update quotation status
    const { error: updateError } = await supabase
      .from("quotations")
      .update({ status: "converted_to_sales_order" })
      .eq("id", quotationId)

    if (updateError) throw updateError

    toast.success("Successfully converted quotation to sales order")
    return { ...salesOrderData, id: newSalesOrder.id }
  } catch (error) {
    console.error("Error converting quotation to sales order:", error)
    toast.error(error instanceof Error ? error.message : "Failed to convert quotation to sales order")
    throw error
  }
}

// Convert sales order to invoice
export const proceedToInvoice = async (salesOrderId: number): Promise<any> => {
  try {
    // Get sales order data
    const { data: salesOrder, error: salesOrderError } = await supabase
      .from("sales_orders")
      .select(`
        *,
        client:registered_entities(id, name, phone, location),
        items:sales_order_items(*)
      `)
      .eq("id", salesOrderId)
      .single()

    if (salesOrderError) throw salesOrderError

    // Check payment requirements (80% minimum)
    const paymentInfo = await checkPaymentRequirements(salesOrder.original_quotation_number || "", 80)
    
    if (paymentInfo.paymentPercentage < 80) {
      const requiredAmount = salesOrder.grand_total * 0.8
      const remainingAmount = requiredAmount - paymentInfo.totalPaid
      throw new Error(`Cannot proceed to invoice. At least 80% payment (KES ${requiredAmount.toFixed(2)}) is required.\nRemaining amount needed: KES ${remainingAmount.toFixed(2)}`)
    }

    // Generate invoice number
    const invoiceNumber = await generateNextNumber("invoices", "invoice_number", "INV")

    // Calculate due date (30 days from today)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    // Create invoice
    const invoiceData = {
      invoice_number: invoiceNumber,
      client_id: salesOrder.client_id,
      sales_order_id: salesOrder.id,
      original_quotation_number: salesOrder.original_quotation_number,
      date_created: new Date().toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      cabinet_total: salesOrder.cabinet_total,
      worktop_total: salesOrder.worktop_total,
      accessories_total: salesOrder.accessories_total,
      labour_percentage: salesOrder.labour_percentage,
      labour_total: salesOrder.labour_total,
      total_amount: salesOrder.total_amount,
      grand_total: salesOrder.grand_total,
      paid_amount: paymentInfo.totalPaid,
      balance_amount: salesOrder.grand_total - paymentInfo.totalPaid,
      include_accessories: salesOrder.include_accessories,
      status: "pending",
      notes: salesOrder.notes,
      terms_conditions: salesOrder.terms_conditions
    }

    // Insert invoice
    const { data: newInvoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert(invoiceData)
      .select()
      .single()

    if (invoiceError) throw invoiceError

    // Insert invoice items
    if (salesOrder.items && salesOrder.items.length > 0) {
      const invoiceItems = salesOrder.items.map(item => ({
        invoice_id: newInvoice.id,
        category: item.category,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        stock_item_id: item.stock_item_id
      }))

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(invoiceItems)

      if (itemsError) throw itemsError
    }

    // Update sales order status
    const { error: updateError } = await supabase
      .from("sales_orders")
      .update({ status: "converted_to_invoice" })
      .eq("id", salesOrderId)

    if (updateError) throw updateError

    toast.success("Successfully converted sales order to invoice")
    return { ...invoiceData, id: newInvoice.id, client: salesOrder.client, items: salesOrder.items }
  } catch (error) {
    console.error("Error converting sales order to invoice:", error)
    toast.error(error instanceof Error ? error.message : "Failed to convert sales order to invoice")
    throw error
  }
}

// Convert quotation directly to cash sale
export const proceedToCashSale = async (quotationId: number): Promise<any> => {
  try {
    // Get quotation data
    const { data: quotation, error: quotationError } = await supabase
      .from("quotations")
      .select(`
        *,
        client:registered_entities(id, name, phone, location),
        items:quotation_items(*)
      `)
      .eq("id", quotationId)
      .single()

    if (quotationError) throw quotationError

    // Generate cash sale number
    const saleNumber = await generateNextNumber("cash_sales", "sale_number", "CS")

    // Create cash sale
    const cashSaleData = {
      sale_number: saleNumber,
      client_id: quotation.client_id,
      original_quotation_number: quotation.quotation_number,
      date_created: new Date().toISOString().split('T')[0],
      cabinet_total: quotation.cabinet_total,
      worktop_total: quotation.worktop_total,
      accessories_total: quotation.accessories_total,
      labour_percentage: quotation.labour_percentage,
      labour_total: quotation.labour_total,
      total_amount: quotation.total_amount,
      grand_total: quotation.grand_total,
      amount_paid: quotation.grand_total, // Full payment for cash sale
      change_amount: 0,
      balance_amount: 0,
      include_accessories: quotation.include_accessories,
      payment_method: "cash",
      status: "completed",
      notes: quotation.notes,
      terms_conditions: quotation.terms_conditions
    }

    // Insert cash sale
    const { data: newCashSale, error: cashSaleError } = await supabase
      .from("cash_sales")
      .insert(cashSaleData)
      .select()
      .single()

    if (cashSaleError) throw cashSaleError

    // Insert cash sale items
    if (quotation.items && quotation.items.length > 0) {
      const cashSaleItems = quotation.items.map(item => ({
        cash_sale_id: newCashSale.id,
        category: item.category,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        stock_item_id: item.stock_item_id
      }))

      const { error: itemsError } = await supabase
        .from("cash_sale_items")
        .insert(cashSaleItems)

      if (itemsError) throw itemsError
    }

    // Update quotation status
    const { error: updateError } = await supabase
      .from("quotations")
      .update({ status: "converted_to_cash_sale" })
      .eq("id", quotationId)

    if (updateError) throw updateError

    toast.success("Successfully converted quotation to cash sale")
    return { ...cashSaleData, id: newCashSale.id, client: quotation.client, items: quotation.items }
  } catch (error) {
    console.error("Error converting quotation to cash sale:", error)
    toast.error(error instanceof Error ? error.message : "Failed to convert quotation to cash sale")
    throw error
  }
}

// Convert sales order to cash sale
export const proceedToCashSaleFromSalesOrder = async (salesOrderId: number): Promise<any> => {
  try {
    // Get sales order data
    const { data: salesOrder, error: salesOrderError } = await supabase
      .from("sales_orders")
      .select(`
        *,
        client:registered_entities(id, name, phone, location),
        items:sales_order_items(*)
      `)
      .eq("id", salesOrderId)
      .single()

    if (salesOrderError) throw salesOrderError

    // Generate cash sale number
    const saleNumber = await generateNextNumber("cash_sales", "sale_number", "CS")

    // Create cash sale
    const cashSaleData = {
      sale_number: saleNumber,
      client_id: salesOrder.client_id,
      sales_order_id: salesOrder.id,
      original_quotation_number: salesOrder.original_quotation_number,
      date_created: new Date().toISOString().split('T')[0],
      cabinet_total: salesOrder.cabinet_total,
      worktop_total: salesOrder.worktop_total,
      accessories_total: salesOrder.accessories_total,
      labour_percentage: salesOrder.labour_percentage,
      labour_total: salesOrder.labour_total,
      total_amount: salesOrder.total_amount,
      grand_total: salesOrder.grand_total,
      amount_paid: salesOrder.grand_total, // Full payment for cash sale
      change_amount: 0,
      balance_amount: 0,
      include_accessories: salesOrder.include_accessories,
      payment_method: "cash",
      status: "completed",
      notes: salesOrder.notes,
      terms_conditions: salesOrder.terms_conditions
    }

    // Insert cash sale
    const { data: newCashSale, error: cashSaleError } = await supabase
      .from("cash_sales")
      .insert(cashSaleData)
      .select()
      .single()

    if (cashSaleError) throw cashSaleError

    // Insert cash sale items
    if (salesOrder.items && salesOrder.items.length > 0) {
      const cashSaleItems = salesOrder.items.map(item => ({
        cash_sale_id: newCashSale.id,
        category: item.category,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        stock_item_id: item.stock_item_id
      }))

      const { error: itemsError } = await supabase
        .from("cash_sale_items")
        .insert(cashSaleItems)

      if (itemsError) throw itemsError
    }

    // Update sales order status
    const { error: updateError } = await supabase
      .from("sales_orders")
      .update({ status: "converted_to_cash_sale" })
      .eq("id", salesOrderId)

    if (updateError) throw updateError

    toast.success("Successfully converted sales order to cash sale")
    return { ...cashSaleData, id: newCashSale.id, client: salesOrder.client, items: salesOrder.items }
  } catch (error) {
    console.error("Error converting sales order to cash sale:", error)
    toast.error(error instanceof Error ? error.message : "Failed to convert sales order to cash sale")
    throw error
  }
}

// Print document
export const printDocument = (elementId: string, documentTitle: string) => {
  const element = document.getElementById(elementId)
  if (!element) {
    toast.error("Document not found")
    return
  }

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    toast.error("Failed to open print window")
    return
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>${documentTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .a4-document { max-width: 210mm; margin: 0 auto; }
          .document-header { text-align: center; margin-bottom: 20px; }
          .company-name { font-size: 24px; font-weight: bold; }
          .company-details { font-size: 14px; margin-top: 10px; }
          .document-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .section-title { font-size: 18px; font-weight: bold; margin: 20px 0 10px 0; }
          .quotation-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .quotation-table th, .quotation-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .quotation-table th { background-color: #f2f2f2; }
          @media print {
            body { margin: 0; }
            .btn { display: none; }
          }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `)

  printWindow.document.close()
  printWindow.print()
}

// Download document as PDF (requires html2pdf library)
export const downloadDocument = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId)
  if (!element) {
    toast.error("Document not found")
    return
  }

  try {
    // This would require html2pdf library to be installed
    // For now, we'll just trigger a print dialog
    toast.info("PDF download feature will be available soon. Please use print for now.")
    printDocument(elementId, filename)
  } catch (error) {
    console.error("Error downloading document:", error)
    toast.error("Failed to download document")
  }
} 