import { supabase } from "./supabase-client"

export const COMPLETED_PROJECT_STATUS = "completed"

const PROJECT_REFERENCE_PATTERN = /^(QT|SO|INV)/i

export interface OngoingProject {
  id: number
  quotationId: number
  salesOrderId: number | null
  salesOrderNumber: string
  originalQuotationNumber: string
  clientName: string
  projectLocation: string
  quoteAmount: number
  amountPaid: number
  amountSpent: number
  profitLoss: number
  status?: string
  dateCreated?: string
}

type PaymentRow = {
  amount: number | null
  quotation_number: string | null
  paid_to: string | null
  status: string | null
}

type ExpenseRow = {
  amount: number | null
  client_id: number | null
  expense_type: string | null
  status: string | null
}

type PurchaseRow = {
  total_amount: number | null
  client_id: number | null
  status: string | null
}

type SalesOrderRow = {
  id: number
  order_number: string
  quotation_id: number | null
  original_quotation_number: string | null
  client_id: number
  grand_total: number | null
  status: string | null
  date_created: string | null
}

type InvoiceRow = {
  invoice_number: string
  sales_order_id: number | null
  original_quotation_number: string | null
}

function normalizeReference(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function isProjectDocumentReference(value: string | null | undefined): boolean {
  const ref = normalizeReference(value)
  return !!ref && PROJECT_REFERENCE_PATTERN.test(ref)
}

/** Payments with no QT/SO/INV link are treated as design fees or unrelated receipts. */
export function isDesignFeeOrUnlinkedPayment(payment: PaymentRow): boolean {
  if (payment.status !== "completed") return true
  const quotationRef = normalizeReference(payment.quotation_number)
  const paidToRef = normalizeReference(payment.paid_to)
  if (!quotationRef && !paidToRef) return true
  return !isProjectDocumentReference(quotationRef) && !isProjectDocumentReference(paidToRef)
}

export function buildProjectReferences(
  quotationNumber: string,
  salesOrderNumber?: string | null,
  invoiceNumbers: string[] = []
): Set<string> {
  const references = new Set<string>()
  const quotationRef = normalizeReference(quotationNumber)
  const orderRef = normalizeReference(salesOrderNumber)

  if (quotationRef) references.add(quotationRef)
  if (orderRef) references.add(orderRef)
  invoiceNumbers.forEach((invoiceNumber) => {
    const invoiceRef = normalizeReference(invoiceNumber)
    if (invoiceRef) references.add(invoiceRef)
  })

  return references
}

export function sumPaymentsForProject(
  payments: PaymentRow[],
  references: Set<string>
): number {
  return payments
    .filter((payment) => {
      if (payment.status !== "completed") return false
      if (isDesignFeeOrUnlinkedPayment(payment)) return false
      const quotationRef = normalizeReference(payment.quotation_number)
      const paidToRef = normalizeReference(payment.paid_to)
      return (
        (quotationRef && references.has(quotationRef)) ||
        (paidToRef && references.has(paidToRef))
      )
    })
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
}

function buildSpentByClient(expenses: ExpenseRow[], purchases: PurchaseRow[]): Map<number, number> {
  const spentByClient = new Map<number, number>()

  for (const expense of expenses) {
    if (!expense.client_id || expense.status === "cancelled") continue
    const current = spentByClient.get(expense.client_id) || 0
    spentByClient.set(expense.client_id, current + Number(expense.amount || 0))
  }

  for (const purchase of purchases) {
    if (!purchase.client_id || purchase.status === "cancelled") continue
    const current = spentByClient.get(purchase.client_id) || 0
    spentByClient.set(purchase.client_id, current + Number(purchase.total_amount || 0))
  }

  return spentByClient
}

function getInvoiceNumbersForProject(
  quotationNumber: string,
  salesOrder: SalesOrderRow | undefined,
  invoices: InvoiceRow[]
): string[] {
  const numbers = new Set<string>()

  invoices.forEach((invoice) => {
    const matchesSalesOrder = salesOrder?.id && invoice.sales_order_id === salesOrder.id
    const matchesQuotation = invoice.original_quotation_number === quotationNumber
    if (matchesSalesOrder || matchesQuotation) {
      numbers.add(invoice.invoice_number)
    }
  })

  return Array.from(numbers)
}

export async function fetchOngoingProjects(): Promise<OngoingProject[]> {
  const [salesOrdersRes, invoicesRes, paymentsRes, expensesRes, purchasesRes] =
    await Promise.all([
      supabase
        .from("sales_orders")
        .select(`
          id,
          order_number,
          quotation_id,
          original_quotation_number,
          client_id,
          grand_total,
          status,
          date_created,
          client:registered_entities(name, location)
        `)
        .neq("status", COMPLETED_PROJECT_STATUS)
        .neq("status", "cancelled")
        .neq("status", "converted_to_cash_sale")
        .order("date_created", { ascending: false }),
      supabase
        .from("invoices")
        .select("invoice_number, sales_order_id, original_quotation_number"),
      supabase
        .from("payments")
        .select("amount, quotation_number, paid_to, status"),
      supabase
        .from("expenses")
        .select("amount, client_id, expense_type, status")
        .eq("expense_type", "client"),
      supabase
        .from("purchases")
        .select("total_amount, client_id, status")
        .not("client_id", "is", null),
    ])

  if (salesOrdersRes.error) throw salesOrdersRes.error
  if (invoicesRes.error) throw invoicesRes.error
  if (paymentsRes.error) throw paymentsRes.error
  if (expensesRes.error) throw expensesRes.error
  if (purchasesRes.error) throw purchasesRes.error

  const payments = (paymentsRes.data || []) as PaymentRow[]
  const expenses = (expensesRes.data || []) as ExpenseRow[]
  const purchases = (purchasesRes.data || []) as PurchaseRow[]
  const salesOrders = (salesOrdersRes.data || []) as (SalesOrderRow & {
    client: { name: string; location: string | null } | { name: string; location: string | null }[] | null
  })[]
  const invoices = (invoicesRes.data || []) as InvoiceRow[]
  const spentByClient = buildSpentByClient(expenses, purchases)

  return salesOrders.map((salesOrder) => {
    const client = Array.isArray(salesOrder.client) ? salesOrder.client[0] : salesOrder.client
    const quotationNumber = salesOrder.original_quotation_number || ""
    const invoiceNumbers = getInvoiceNumbersForProject(
      quotationNumber,
      salesOrder,
      invoices
    )
    const references = buildProjectReferences(
      quotationNumber,
      salesOrder.order_number,
      invoiceNumbers
    )
    const amountPaid = sumPaymentsForProject(payments, references)
    const amountSpent = spentByClient.get(salesOrder.client_id) || 0

    return {
      id: salesOrder.id,
      quotationId: salesOrder.quotation_id ?? 0,
      salesOrderId: salesOrder.id,
      salesOrderNumber: salesOrder.order_number,
      originalQuotationNumber: quotationNumber,
      clientName: client?.name || "Unknown Client",
      projectLocation: client?.location || "-",
      quoteAmount: Number(salesOrder.grand_total ?? 0),
      amountPaid,
      amountSpent,
      profitLoss: amountPaid - amountSpent,
      status: salesOrder.status ?? undefined,
      dateCreated: salesOrder.date_created ?? undefined,
    }
  })
}

export async function completeOngoingProject(quotationId: number, salesOrderId?: number | null): Promise<void> {
  if (quotationId > 0) {
    const { error: quotationError } = await supabase
      .from("quotations")
      .update({ status: COMPLETED_PROJECT_STATUS })
      .eq("id", quotationId)

    if (quotationError) throw quotationError
  }

  if (salesOrderId) {
    const { error: salesOrderError } = await supabase
      .from("sales_orders")
      .update({ status: COMPLETED_PROJECT_STATUS })
      .eq("id", salesOrderId)

    if (salesOrderError) throw salesOrderError
  }
}
