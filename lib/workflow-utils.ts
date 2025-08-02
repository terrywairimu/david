import { supabase } from "./supabase-client"
import { toast } from "sonner"

// Number generation functions
export const generatePaymentNumber = async () => {
  try {
    const currentDate = new Date()
    const year = currentDate.getFullYear().toString().slice(-2) // Last 2 digits
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
    const prefix = `PN${year}${month}`
    
    const { data, error } = await supabase
      .from('payments')
      .select('payment_number')
      .like('payment_number', `PN${year}${month}%`)
      .order('payment_number', { ascending: false })
      .limit(1)
    
    if (error) throw error
    
    if (data && data.length > 0) {
      const lastNumber = data[0].payment_number
      // Extract the sequential part from PNYYMMNNN format
      const sequentialPart = lastNumber.slice(-3)
      const nextNumber = parseInt(sequentialPart) + 1
      return `${prefix}${nextNumber.toString().padStart(3, '0')}`
    }
    
    // First payment of the month
    return `${prefix}001`
  } catch (error) {
    console.error('Error generating payment number:', error)
    const currentDate = new Date()
    const year = currentDate.getFullYear().toString().slice(-2)
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
    const timestamp = Date.now().toString().slice(-3)
    return `PN${year}${month}${timestamp}`
  }
}

export const generateExpenseNumber = async (type: 'client' | 'company') => {
  try {
    const currentDate = new Date()
    const year = currentDate.getFullYear().toString().slice(-2) // Last 2 digits
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
    const prefix = `EN${year}${month}`
    
    const { data, error } = await supabase
      .from('expenses')
      .select('expense_number')
      .like('expense_number', `EN${year}${month}%`)
      .order('expense_number', { ascending: false })
      .limit(1)
    
    if (error) throw error
    
    if (data && data.length > 0) {
      const lastNumber = data[0].expense_number
      // Extract the sequential part from ENYYMMNNN format
      const sequentialPart = lastNumber.slice(-3)
      const nextNumber = parseInt(sequentialPart) + 1
      return `${prefix}${nextNumber.toString().padStart(3, '0')}`
    }
    
    // First expense of the month
    return `${prefix}001`
  } catch (error) {
    console.error('Error generating expense number:', error)
    const currentDate = new Date()
    const year = currentDate.getFullYear().toString().slice(-2)
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
    const timestamp = Date.now().toString().slice(-3)
    return `EN${year}${month}${timestamp}`
  }
}

// Export functions
export const exportQuotations = async (quotations: any[]) => {
  try {
    // Dynamic import for jsPDF
    const { jsPDF } = await import('jspdf')
    require('jspdf-autotable')
    
const doc = new jsPDF() as any as any
    
    // Add title
    doc.setFontSize(20)
    doc.text('Quotations Report', 105, 20, { align: 'center' })
    
    // Add date
    doc.setFontSize(12)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' })

    // Add summary section
    doc.setFontSize(14)
    doc.text('Quotation Summary', 20, 45)

    // Add quotations table
    const headers = [['Quotation #', 'Date', 'Client', 'Total Amount', 'Status']]
    const data = quotations.map(quotation => [
      quotation.quotation_number,
      new Date(quotation.date_created).toLocaleDateString(),
      quotation.client?.name || 'Unknown',
      `KES ${quotation.grand_total?.toFixed(2) || '0.00'}`,
      quotation.status
    ])

    doc.autoTable({
      startY: 55,
      head: headers,
      body: data,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 15, right: 15 },
    })

    // Add total at the bottom
    const total = quotations.reduce((sum, quotation) => {
      return sum + (quotation.grand_total || 0)
    }, 0)

    const finalY = doc.lastAutoTable.finalY + 10
    doc.text(`Total Quotations Value: KES ${total.toFixed(2)}`, 20, finalY)

    doc.save('quotations_report.pdf')
    toast.success('Quotations report exported successfully!')
  } catch (error) {
    console.error('Export error:', error)
    toast.error('Failed to export quotations report')
  }
}

export const exportSalesOrders = async (salesOrders: any[]) => {
  try {
    const { jsPDF } = await import('jspdf')
    require('jspdf-autotable')
    
    const doc = new jsPDF() as any
    
    doc.setFontSize(20)
    doc.text('Sales Orders Report', 105, 20, { align: 'center' })
    
    doc.setFontSize(12)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' })

    doc.setFontSize(14)
    doc.text('Sales Orders Summary', 20, 45)

    const headers = [['Order #', 'Date', 'Client', 'Total Amount', 'Status']]
    const data = salesOrders.map(order => [
      order.order_number,
      new Date(order.date_created).toLocaleDateString(),
      order.client?.name || 'Unknown',
      `KES ${order.grand_total?.toFixed(2) || '0.00'}`,
      order.status
    ])

    doc.autoTable({
      startY: 55,
      head: headers,
      body: data,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 15, right: 15 },
    })

    const total = salesOrders.reduce((sum, order) => {
      return sum + (order.grand_total || 0)
    }, 0)

    const finalY = doc.lastAutoTable.finalY + 10
    doc.text(`Total Sales Orders Value: KES ${total.toFixed(2)}`, 20, finalY)

    doc.save('sales_orders_report.pdf')
    toast.success('Sales orders report exported successfully!')
  } catch (error) {
    console.error('Export error:', error)
    toast.error('Failed to export sales orders report')
  }
}

export const exportInvoices = async (invoices: any[]) => {
  try {
    const { jsPDF } = await import('jspdf')
    require('jspdf-autotable')
    
    const doc = new jsPDF() as any
    
    doc.setFontSize(20)
    doc.text('Invoices Report', 105, 20, { align: 'center' })
    
    doc.setFontSize(12)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' })

    doc.setFontSize(14)
    doc.text('Invoices Summary', 20, 45)

    const headers = [['Invoice #', 'Date', 'Client', 'Total Amount', 'Paid Amount', 'Balance', 'Status']]
    const data = invoices.map(invoice => [
      invoice.invoice_number,
      new Date(invoice.date_created).toLocaleDateString(),
      invoice.client?.name || 'Unknown',
      `KES ${invoice.grand_total?.toFixed(2) || '0.00'}`,
      `KES ${invoice.paid_amount?.toFixed(2) || '0.00'}`,
      `KES ${invoice.balance_amount?.toFixed(2) || '0.00'}`,
      invoice.status
    ])

    doc.autoTable({
      startY: 55,
      head: headers,
      body: data,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 15, right: 15 },
    })

    const total = invoices.reduce((sum, invoice) => {
      return sum + (invoice.grand_total || 0)
    }, 0)

    const finalY = doc.lastAutoTable.finalY + 10
    doc.text(`Total Invoices Value: KES ${total.toFixed(2)}`, 20, finalY)

    doc.save('invoices_report.pdf')
    toast.success('Invoices report exported successfully!')
  } catch (error) {
    console.error('Export error:', error)
    toast.error('Failed to export invoices report')
  }
}

export const exportCashSales = async (cashSales: any[]) => {
  try {
    const { jsPDF } = await import('jspdf')
    require('jspdf-autotable')
    
    const doc = new jsPDF() as any
    
    doc.setFontSize(20)
    doc.text('Cash Sales Report', 105, 20, { align: 'center' })
    
    doc.setFontSize(12)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' })

    doc.setFontSize(14)
    doc.text('Cash Sales Summary', 20, 45)

    const headers = [['Receipt #', 'Date', 'Client', 'Total Amount', 'Status']]
    const data = cashSales.map(sale => [
      sale.sale_number,
      new Date(sale.date_created).toLocaleDateString(),
      sale.client?.name || 'Unknown',
      `KES ${sale.grand_total?.toFixed(2) || '0.00'}`,
      sale.status
    ])

    doc.autoTable({
      startY: 55,
      head: headers,
      body: data,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 15, right: 15 },
    })

    const total = cashSales.reduce((sum, sale) => {
      return sum + (sale.grand_total || 0)
    }, 0)

    const finalY = doc.lastAutoTable.finalY + 10
    doc.text(`Total Cash Sales Value: KES ${total.toFixed(2)}`, 20, finalY)

    doc.save('cash_sales_report.pdf')
    toast.success('Cash sales report exported successfully!')
  } catch (error) {
    console.error('Export error:', error)
    toast.error('Failed to export cash sales report')
  }
}

export const exportPayments = async (payments: any[]) => {
  try {
    const { jsPDF } = await import('jspdf')
    require('jspdf-autotable')
    
    const doc = new jsPDF() as any
    
    // Add title
    doc.setFontSize(20)
    doc.text('Payments Report', 105, 20, { align: 'center' })
    
    // Add date
    doc.setFontSize(12)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' })

    // Add summary section
    doc.setFontSize(14)
    doc.text('Payment Summary', 20, 45)

    // Add payments table
    const headers = [['Payment #', 'Client', 'Date', 'Paid To', 'Description', 'Amount', 'Account Credited']]
    const data = payments.map(payment => [
      payment.payment_number || 'N/A',
      payment.client?.name || 'Unknown',
      new Date(payment.date_created).toLocaleDateString(),
      payment.paid_to || '-',
      payment.description || '-',
      `KES ${payment.amount?.toFixed(2) || '0.00'}`,
      payment.account_credited || '-'
    ])

    doc.autoTable({
      startY: 55,
      head: headers,
      body: data,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 15, right: 15 },
    })

    // Add total at the bottom
    const total = payments.reduce((sum, payment) => {
      return sum + (payment.amount || 0)
    }, 0)

    const finalY = doc.lastAutoTable.finalY + 10
    doc.text(`Total Payments: KES ${total.toFixed(2)}`, 20, finalY)

    doc.save('payments_report.pdf')
    toast.success('Payments report exported successfully!')
  } catch (error) {
    console.error('Export error:', error)
    toast.error('Failed to export payments report')
  }
}

export const exportClientExpenses = async (expenses: any[]) => {
  try {
    const { jsPDF } = await import('jspdf')
    require('jspdf-autotable')
    
    const doc = new jsPDF() as any
    
    // Add title
    doc.setFontSize(20)
    doc.text('Client Expenses Report', 105, 20, { align: 'center' })
    
    // Add date
    doc.setFontSize(12)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' })

    // Add summary section
    doc.setFontSize(14)
    doc.text('Client Expenses Summary', 20, 45)

    // Add expenses table
    const headers = [['Expense #', 'Date', 'Client', 'Category', 'Description', 'Amount', 'Account Debited']]
    const data = expenses.map(expense => [
      expense.expense_number || 'N/A',
      new Date(expense.date_created).toLocaleDateString(),
      expense.client?.name || 'Unknown',
      expense.category || '-',
      expense.description || '-',
      `KES ${expense.amount?.toFixed(2) || '0.00'}`,
      expense.account_debited || '-'
    ])

    doc.autoTable({
      startY: 55,
      head: headers,
      body: data,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 15, right: 15 },
    })

    // Add total at the bottom
    const total = expenses.reduce((sum, expense) => {
      return sum + (expense.amount || 0)
    }, 0)

    const finalY = doc.lastAutoTable.finalY + 10
    doc.text(`Total Client Expenses: KES ${total.toFixed(2)}`, 20, finalY)

    doc.save('client_expenses_report.pdf')
    toast.success('Client expenses report exported successfully!')
  } catch (error) {
    console.error('Export error:', error)
    toast.error('Failed to export client expenses report')
  }
}

export const exportCompanyExpenses = async (expenses: any[]) => {
  try {
    const { jsPDF } = await import('jspdf')
    require('jspdf-autotable')
    
    const doc = new jsPDF() as any
    
    // Add title
    doc.setFontSize(20)
    doc.text('Company Expenses Report', 105, 20, { align: 'center' })
    
    // Add date
    doc.setFontSize(12)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' })

    // Add summary section
    doc.setFontSize(14)
    doc.text('Company Expenses Summary', 20, 45)

    // Add expenses table
    const headers = [['Expense #', 'Date', 'Category', 'Description', 'Amount', 'Account Debited']]
    const data = expenses.map(expense => [
      expense.expense_number || 'N/A',
      new Date(expense.date_created).toLocaleDateString(),
      expense.category || '-',
      expense.description || '-',
      `KES ${expense.amount?.toFixed(2) || '0.00'}`,
      expense.account_debited || '-'
    ])

    doc.autoTable({
      startY: 55,
      head: headers,
      body: data,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 15, right: 15 },
    })

    // Add total at the bottom
    const total = expenses.reduce((sum, expense) => {
      return sum + (expense.amount || 0)
    }, 0)

    const finalY = doc.lastAutoTable.finalY + 10
    doc.text(`Total Company Expenses: KES ${total.toFixed(2)}`, 20, finalY)

    doc.save('company_expenses_report.pdf')
    toast.success('Company expenses report exported successfully!')
  } catch (error) {
    console.error('Export error:', error)
    toast.error('Failed to export company expenses report')
  }
}

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
  appliances_total?: number
  wardrobes_total?: number
  tvunit_total?: number
  labour_percentage: number
  labour_total: number
  total_amount: number
  grand_total: number
  vat_percentage: number
  vat_amount: number
  include_accessories: boolean
  include_worktop?: boolean
  include_appliances?: boolean
  include_wardrobes?: boolean
  include_tvunit?: boolean
  cabinet_labour_percentage?: number
  accessories_labour_percentage?: number
  appliances_labour_percentage?: number
  wardrobes_labour_percentage?: number
  tvunit_labour_percentage?: number
  worktop_labor_qty?: number
  worktop_labor_unit_price?: number
  status: string
  notes?: string
  terms_conditions?: string
  section_names?: {
    cabinet: string;
    worktop: string;
    accessories: string;
    appliances: string;
    wardrobes: string;
    tvunit: string;
  }
  client?: {
    id: number
    name: string
    phone?: string
    location?: string
  }
  items?: WorkflowItem[]
}

export interface InvoiceData {
  id?: number
  invoice_number: string
  client_id: number
  sales_order_id?: number
  original_quotation_number?: string
  date_created: string
  due_date: string
  cabinet_total: number
  worktop_total: number
  accessories_total: number
  appliances_total?: number
  wardrobes_total?: number
  tvunit_total?: number
  labour_percentage: number
  labour_total: number
  total_amount: number
  grand_total: number
  paid_amount: number
  balance_amount: number
  vat_percentage: number
  vat_amount: number
  include_accessories: boolean
  include_worktop?: boolean
  include_appliances?: boolean
  include_wardrobes?: boolean
  include_tvunit?: boolean
  cabinet_labour_percentage?: number
  accessories_labour_percentage?: number
  appliances_labour_percentage?: number
  wardrobes_labour_percentage?: number
  tvunit_labour_percentage?: number
  worktop_labor_qty?: number
  worktop_labor_unit_price?: number
  status: string
  notes?: string
  terms_conditions?: string
  section_names?: {
    cabinet: string;
    worktop: string;
    accessories: string;
    appliances: string;
    wardrobes: string;
    tvunit: string;
  }
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

// Generate next number in sequence using same format as quotations
export const generateNextNumber = async (table: string, field: string, prefix: string): Promise<string> => {
  try {
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    
    // Query database for the latest number for this year/month
    const { data, error } = await supabase
      .from(table)
      .select(field)
      .ilike(field, `${prefix}${year}${month}%`)
      .order(field, { ascending: false })
      .limit(1)

    if (error) throw error

    let nextNumber = 1
    if (data && data.length > 0) {
      const match = (data[0] as any)[field].match(new RegExp(`${prefix}\\d{4}(\\d{3})`))
      if (match) {
        nextNumber = parseInt(match[1]) + 1
      }
    }

    return `${prefix}${year}${month}${nextNumber.toString().padStart(3, '0')}`
  } catch (error) {
    console.error(`Error generating ${table} number:`, error)
    // Fallback to timestamp-based number
    const timestamp = Date.now().toString().slice(-3)
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    return `${prefix}${year}${month}${timestamp}`
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

    // Get payments for this quotation (check both quotation_number and paid_to fields)
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("amount")
      .or(`quotation_number.eq.${quotationNumber},paid_to.eq.${quotationNumber}`)
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
      appliances_total: quotation.appliances_total,
      wardrobes_total: quotation.wardrobes_total,
      tvunit_total: quotation.tvunit_total,
      labour_percentage: quotation.labour_percentage,
      labour_total: quotation.labour_total,
      total_amount: quotation.total_amount,
      grand_total: quotation.grand_total,
      vat_percentage: quotation.vat_percentage,
      vat_amount: quotation.vat_amount,
      include_accessories: quotation.include_accessories,
      include_worktop: quotation.include_worktop,
      include_appliances: quotation.include_appliances,
      include_wardrobes: quotation.include_wardrobes,
      include_tvunit: quotation.include_tvunit,
      cabinet_labour_percentage: quotation.cabinet_labour_percentage,
      accessories_labour_percentage: quotation.accessories_labour_percentage,
      appliances_labour_percentage: quotation.appliances_labour_percentage,
      wardrobes_labour_percentage: quotation.wardrobes_labour_percentage,
      tvunit_labour_percentage: quotation.tvunit_labour_percentage,
      worktop_labor_qty: quotation.worktop_labor_qty,
      worktop_labor_unit_price: quotation.worktop_labor_unit_price,
      status: "pending",
      notes: quotation.notes,
      terms_conditions: quotation.terms_conditions,
      section_names: quotation.section_names,
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
        appliances_total: salesOrderData.appliances_total,
        wardrobes_total: salesOrderData.wardrobes_total,
        tvunit_total: salesOrderData.tvunit_total,
        labour_percentage: salesOrderData.labour_percentage,
        labour_total: salesOrderData.labour_total,
        total_amount: salesOrderData.total_amount,
        grand_total: salesOrderData.grand_total,
        vat_percentage: salesOrderData.vat_percentage,
        vat_amount: salesOrderData.vat_amount,
        include_accessories: salesOrderData.include_accessories,
        include_worktop: salesOrderData.include_worktop,
        include_appliances: salesOrderData.include_appliances,
        include_wardrobes: salesOrderData.include_wardrobes,
        include_tvunit: salesOrderData.include_tvunit,
        cabinet_labour_percentage: salesOrderData.cabinet_labour_percentage,
        accessories_labour_percentage: salesOrderData.accessories_labour_percentage,
        appliances_labour_percentage: salesOrderData.appliances_labour_percentage,
        wardrobes_labour_percentage: salesOrderData.wardrobes_labour_percentage,
        tvunit_labour_percentage: salesOrderData.tvunit_labour_percentage,
        worktop_labor_qty: salesOrderData.worktop_labor_qty,
        worktop_labor_unit_price: salesOrderData.worktop_labor_unit_price,
        status: salesOrderData.status,
        notes: salesOrderData.notes,
        terms_conditions: salesOrderData.terms_conditions,
        section_names: salesOrderData.section_names
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
export const proceedToInvoice = async (salesOrderId: number): Promise<InvoiceData> => {
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

    // Check payment requirements (70% minimum)
    const paymentInfo = await checkPaymentRequirements(salesOrder.original_quotation_number || "", 70)
    
    if (paymentInfo.paymentPercentage < 70) {
      const requiredAmount = salesOrder.grand_total * 0.7
      const remainingAmount = requiredAmount - paymentInfo.totalPaid
      throw new Error(`Cannot proceed to invoice. At least 70% payment (KES ${requiredAmount.toFixed(2)}) is required.\nRemaining amount needed: KES ${remainingAmount.toFixed(2)}`)
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
      appliances_total: salesOrder.appliances_total,
      wardrobes_total: salesOrder.wardrobes_total,
      tvunit_total: salesOrder.tvunit_total,
      labour_percentage: salesOrder.labour_percentage,
      labour_total: salesOrder.labour_total,
      total_amount: salesOrder.total_amount,
      grand_total: salesOrder.grand_total,
      paid_amount: paymentInfo.totalPaid,
      balance_amount: salesOrder.grand_total - paymentInfo.totalPaid,
      include_accessories: salesOrder.include_accessories,
      include_worktop: salesOrder.include_worktop,
      include_appliances: salesOrder.include_appliances,
      include_wardrobes: salesOrder.include_wardrobes,
      include_tvunit: salesOrder.include_tvunit,
      cabinet_labour_percentage: salesOrder.cabinet_labour_percentage,
      accessories_labour_percentage: salesOrder.accessories_labour_percentage,
      appliances_labour_percentage: salesOrder.appliances_labour_percentage,
      wardrobes_labour_percentage: salesOrder.wardrobes_labour_percentage,
      tvunit_labour_percentage: salesOrder.tvunit_labour_percentage,
      worktop_labor_qty: salesOrder.worktop_labor_qty,
      worktop_labor_unit_price: salesOrder.worktop_labor_unit_price,
      vat_percentage: salesOrder.vat_percentage,
      vat_amount: salesOrder.vat_amount,
      status: "pending",
      notes: salesOrder.notes,
      terms_conditions: salesOrder.terms_conditions,
      section_names: salesOrder.section_names
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
      const invoiceItems = salesOrder.items.map((item: any) => ({
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
      const cashSaleItems = quotation.items.map((item: any) => ({
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
      const cashSaleItems = salesOrder.items.map((item: any) => ({
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

// Convert invoice to cash sale
export const proceedToCashSaleFromInvoice = async (invoiceId: number): Promise<any> => {
  try {
    // Get invoice data
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        *,
        client:registered_entities(id, name, phone, location),
        items:invoice_items(*)
      `)
      .eq("id", invoiceId)
      .single()

    if (invoiceError) throw invoiceError

    // Generate cash sale number
    const saleNumber = await generateNextNumber("cash_sales", "sale_number", "CS")

    // Create cash sale
    const cashSaleData = {
      sale_number: saleNumber,
      client_id: invoice.client_id,
      invoice_id: invoice.id,
      original_quotation_number: invoice.original_quotation_number,
      date_created: new Date().toISOString().split('T')[0],
      cabinet_total: invoice.cabinet_total,
      worktop_total: invoice.worktop_total,
      accessories_total: invoice.accessories_total,
      labour_percentage: invoice.labour_percentage,
      labour_total: invoice.labour_total,
      total_amount: invoice.total_amount,
      grand_total: invoice.grand_total,
      amount_paid: invoice.grand_total, // Full payment for cash sale
      change_amount: 0,
      balance_amount: 0,
      include_accessories: invoice.include_accessories,
      payment_method: "cash",
      status: "completed",
      notes: invoice.notes,
      terms_conditions: invoice.terms_conditions
    }

    // Insert cash sale
    const { data: newCashSale, error: cashSaleError } = await supabase
      .from("cash_sales")
      .insert(cashSaleData)
      .select()
      .single()

    if (cashSaleError) throw cashSaleError

    // Insert cash sale items
    if (invoice.items && invoice.items.length > 0) {
      const cashSaleItems = invoice.items.map((item: any) => ({
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

    // Update invoice status
    const { error: updateError } = await supabase
      .from("invoices")
      .update({ status: "converted_to_cash_sale" })
      .eq("id", invoiceId)

    if (updateError) throw updateError

    toast.success("Successfully converted invoice to cash sale")
    return { ...cashSaleData, id: newCashSale.id, client: invoice.client, items: invoice.items }
  } catch (error) {
    console.error("Error converting invoice to cash sale:", error)
    toast.error(error instanceof Error ? error.message : "Failed to convert invoice to cash sale")
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

// Account Transaction Management
export const createAccountTransaction = async (
  accountType: 'cash' | 'cooperative_bank' | 'credit' | 'cheque',
  transactionType: 'in' | 'out',
  amount: number,
  description: string,
  referenceType: 'payment' | 'expense' | 'purchase' | 'sale',
  referenceId: number
) => {
  try {
    const { data, error } = await supabase
      .from('account_transactions')
      .insert([{
        transaction_number: await generateTransactionNumber(),
        account_type: accountType,
        transaction_type: transactionType,
        amount,
        description,
        reference_type: referenceType,
        reference_id: referenceId
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating account transaction:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error creating account transaction:', error)
    return { success: false, error: (error as Error).message }
  }
}

export const generateTransactionNumber = async (): Promise<string> => {
  try {
    const { data } = await supabase
      .from('account_transactions')
      .select('transaction_number')
      .order('id', { ascending: false })
      .limit(1)

    let nextNumber = 1
    if (data && data.length > 0) {
      const lastNumber = parseInt(data[0].transaction_number.replace('TXN', ''))
      nextNumber = lastNumber + 1
    }

    return `TXN${nextNumber.toString().padStart(6, '0')}`
  } catch (error) {
    return `TXN${Date.now().toString().slice(-6)}`
  }
}

export const mapPaymentMethodToAccountType = (paymentMethod: string): 'cash' | 'cooperative_bank' | 'credit' | 'cheque' => {
  switch (paymentMethod.toLowerCase()) {
    case 'cash':
      return 'cash'
    case 'cooperative_bank':
    case 'bank':
    case 'bank_transfer':
      return 'cooperative_bank'
    case 'credit':
    case 'credit_card':
      return 'credit'
    case 'cheque':
    case 'check':
      return 'cheque'
    default:
      return 'cash'
  }
}

export const mapAccountDebitedToAccountType = (accountDebited: string): 'cash' | 'cooperative_bank' | 'credit' | 'cheque' => {
  switch (accountDebited.toLowerCase()) {
    case 'cash':
      return 'cash'
    case 'cooperative_bank':
    case 'bank':
      return 'cooperative_bank'
    case 'credit':
      return 'credit'
    case 'cheque':
    case 'check':
      return 'cheque'
    default:
      return 'cash'
  }
}

// Enhanced payment creation with automatic transaction
export const createPaymentWithTransaction = async (paymentData: any) => {
  try {
    // Create the payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single()

    if (paymentError) {
      return { success: false, error: paymentError.message }
    }

    // Create account transaction
    const accountType = mapPaymentMethodToAccountType(paymentData.payment_method)
    const transactionResult = await createAccountTransaction(
      accountType,
      'in',
      paymentData.amount,
      paymentData.description || 'Payment received',
      'payment',
      payment.id
    )

    if (!transactionResult.success) {
      console.error('Failed to create account transaction:', transactionResult.error)
    }

    return { success: true, data: payment }
  } catch (error) {
    console.error('Error creating payment with transaction:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Enhanced expense creation with automatic transaction
export const createExpenseWithTransaction = async (expenseData: any) => {
  try {
    // Create the expense
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert([expenseData])
      .select()
      .single()

    if (expenseError) {
      return { success: false, error: expenseError.message }
    }

    // Create account transaction
    const accountType = mapAccountDebitedToAccountType(expenseData.account_debited || 'cash')
    const transactionResult = await createAccountTransaction(
      accountType,
      'out',
      expenseData.amount,
      expenseData.description || 'Expense',
      'expense',
      expense.id
    )

    if (!transactionResult.success) {
      console.error('Failed to create account transaction:', transactionResult.error)
    }

    return { success: true, data: expense }
  } catch (error) {
    console.error('Error creating expense with transaction:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Enhanced purchase creation with automatic transaction
export const createPurchaseWithTransaction = async (purchaseData: any) => {
  try {
    // Create the purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert([purchaseData])
      .select()
      .single()

    if (purchaseError) {
      return { success: false, error: purchaseError.message }
    }

    // Create account transaction
    const accountType = mapPaymentMethodToAccountType(purchaseData.payment_method || 'Cash')
    const transactionResult = await createAccountTransaction(
      accountType,
      'out',
      purchaseData.total_amount,
      purchaseData.notes || 'Purchase',
      'purchase',
      purchase.id
    )

    if (!transactionResult.success) {
      console.error('Failed to create account transaction:', transactionResult.error)
    }

    return { success: true, data: purchase }
  } catch (error) {
    console.error('Error creating purchase with transaction:', error)
    return { success: false, error: (error as Error).message }
  }
} 