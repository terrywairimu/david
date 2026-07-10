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
  id?: number
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
  id?: number
  invoice_number: string
  sales_order_id: number | null
  original_quotation_number: string | null
  paid_amount?: number | null
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

function getInvoicesForProject(
  quotationNumber: string,
  salesOrder: SalesOrderRow | undefined,
  invoices: InvoiceRow[]
): InvoiceRow[] {
  return invoices.filter((invoice) => {
    const matchesSalesOrder = salesOrder?.id && invoice.sales_order_id === salesOrder.id
    const matchesQuotation = invoice.original_quotation_number === quotationNumber
    return matchesSalesOrder || matchesQuotation
  })
}

function getInvoiceNumbersForProject(
  quotationNumber: string,
  salesOrder: SalesOrderRow | undefined,
  invoices: InvoiceRow[]
): string[] {
  return getInvoicesForProject(quotationNumber, salesOrder, invoices).map(
    (invoice) => invoice.invoice_number
  )
}

function sumInvoicePaidAmount(invoices: InvoiceRow[]): number {
  return invoices.reduce((sum, invoice) => sum + Number(invoice.paid_amount || 0), 0)
}

export function calculateProjectAmountPaid(
  payments: PaymentRow[],
  references: Set<string>,
  projectInvoices: InvoiceRow[]
): number {
  const paymentTotal = sumPaymentsForProject(payments, references)
  if (paymentTotal > 0) return paymentTotal

  // Fallback when payment rows were cleared but invoice balances remain populated.
  return sumInvoicePaidAmount(projectInvoices)
}

export const MOBILE_BATCH_SIZE = 15
export const DESKTOP_PAGE_SIZE = 6
/** Prefetch the next batch once the viewer reaches this 1-based card index within the loaded set. */
export const MOBILE_PREFETCH_CARD_INDEX = 12

export interface OngoingProjectsPageResult {
  projects: OngoingProject[]
  totalCount: number
  hasMore: boolean
}

type SalesOrderWithClient = SalesOrderRow & {
  client: { name: string; location: string | null } | { name: string; location: string | null }[] | null
}

function mapSalesOrdersToProjects(
  salesOrders: SalesOrderWithClient[],
  invoices: InvoiceRow[],
  payments: PaymentRow[],
  spentByClient: Map<number, number>
): OngoingProject[] {
  return salesOrders.map((salesOrder) => {
    const client = Array.isArray(salesOrder.client) ? salesOrder.client[0] : salesOrder.client
    const quotationNumber = salesOrder.original_quotation_number || ""
    const projectInvoices = getInvoicesForProject(quotationNumber, salesOrder, invoices)
    const invoiceNumbers = projectInvoices.map((invoice) => invoice.invoice_number)
    const references = buildProjectReferences(
      quotationNumber,
      salesOrder.order_number,
      invoiceNumbers
    )
    const amountPaid = calculateProjectAmountPaid(payments, references, projectInvoices)
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

async function fetchPaymentsForReferences(
  references: string[],
  invoiceIds: number[] = []
): Promise<PaymentRow[]> {
  if (references.length === 0 && invoiceIds.length === 0) return []

  const requests: Promise<{ data: PaymentRow[] | null; error: { message: string } | null }>[] = []

  if (references.length > 0) {
    requests.push(
      supabase
        .from("payments")
        .select("id, amount, quotation_number, paid_to, status")
        .eq("status", "completed")
        .in("paid_to", references) as Promise<{ data: PaymentRow[] | null; error: { message: string } | null }>,
      supabase
        .from("payments")
        .select("id, amount, quotation_number, paid_to, status")
        .eq("status", "completed")
        .in("quotation_number", references) as Promise<{ data: PaymentRow[] | null; error: { message: string } | null }>
    )
  }

  if (invoiceIds.length > 0) {
    requests.push(
      supabase
        .from("payments")
        .select("id, amount, quotation_number, paid_to, status")
        .eq("status", "completed")
        .in("invoice_id", invoiceIds) as Promise<{ data: PaymentRow[] | null; error: { message: string } | null }>
    )
  }

  const responses = await Promise.all(requests)
  for (const response of responses) {
    if (response.error) throw response.error
  }

  const merged = new Map<string, PaymentRow>()
  for (const response of responses) {
    for (const payment of (response.data || []) as PaymentRow[]) {
      const key =
        payment.id != null
          ? `id:${payment.id}`
          : `${payment.paid_to}|${payment.quotation_number}|${payment.amount}`
      if (!merged.has(key)) merged.set(key, payment)
    }
  }

  return Array.from(merged.values())
}

async function fetchSpentByClientIds(clientIds: number[]): Promise<Map<number, number>> {
  if (clientIds.length === 0) return new Map()

  const [expensesRes, purchasesRes] = await Promise.all([
    supabase
      .from("expenses")
      .select("amount, client_id, expense_type, status")
      .eq("expense_type", "client")
      .in("client_id", clientIds),
    supabase
      .from("purchases")
      .select("total_amount, client_id, status")
      .in("client_id", clientIds),
  ])

  if (expensesRes.error) throw expensesRes.error
  if (purchasesRes.error) throw purchasesRes.error

  return buildSpentByClient(
    (expensesRes.data || []) as ExpenseRow[],
    (purchasesRes.data || []) as PurchaseRow[]
  )
}

function collectProjectReferences(
  salesOrders: SalesOrderRow[],
  invoices: InvoiceRow[]
): { references: string[]; invoiceIds: number[] } {
  const references = new Set<string>()
  const invoiceIds = new Set<number>()

  for (const salesOrder of salesOrders) {
    const quotationNumber = salesOrder.original_quotation_number || ""
    const projectInvoices = getInvoicesForProject(quotationNumber, salesOrder, invoices)
    const invoiceNumbers = projectInvoices.map((invoice) => invoice.invoice_number)
    buildProjectReferences(quotationNumber, salesOrder.order_number, invoiceNumbers).forEach((ref) => {
      references.add(ref)
    })
    projectInvoices.forEach((invoice) => {
      if (invoice.id != null) invoiceIds.add(invoice.id)
    })
  }

  return {
    references: Array.from(references),
    invoiceIds: Array.from(invoiceIds),
  }
}

export async function fetchOngoingProjectsPage(
  offset = 0,
  limit = MOBILE_BATCH_SIZE
): Promise<OngoingProjectsPageResult> {
  const from = offset
  const to = offset + limit - 1

  const salesOrdersRes = await supabase
    .from("sales_orders")
    .select(
      `
          id,
          order_number,
          quotation_id,
          original_quotation_number,
          client_id,
          grand_total,
          status,
          date_created,
          client:registered_entities(name, location)
        `,
      { count: "exact" }
    )
    .neq("status", COMPLETED_PROJECT_STATUS)
    .neq("status", "cancelled")
    .neq("status", "converted_to_cash_sale")
    .order("date_created", { ascending: false })
    .range(from, to)

  if (salesOrdersRes.error) throw salesOrdersRes.error

  const salesOrders = (salesOrdersRes.data || []) as SalesOrderWithClient[]
  const totalCount = salesOrdersRes.count ?? salesOrders.length

  if (salesOrders.length === 0) {
    return { projects: [], totalCount, hasMore: false }
  }

  const salesOrderIds = salesOrders.map((salesOrder) => salesOrder.id)
  const quotationNumbers = salesOrders
    .map((salesOrder) => salesOrder.original_quotation_number)
    .filter((value): value is string => !!value)
  const clientIds = [...new Set(salesOrders.map((salesOrder) => salesOrder.client_id))]

  const [invoicesRes, spentByClient] = await Promise.all([
    Promise.all([
      supabase
        .from("invoices")
        .select("id, invoice_number, sales_order_id, original_quotation_number, paid_amount")
        .in("sales_order_id", salesOrderIds),
      quotationNumbers.length > 0
        ? supabase
            .from("invoices")
            .select("id, invoice_number, sales_order_id, original_quotation_number, paid_amount")
            .in("original_quotation_number", quotationNumbers)
        : Promise.resolve({ data: [], error: null }),
    ]).then(([bySalesOrderRes, byQuotationRes]) => {
      if (bySalesOrderRes.error) throw bySalesOrderRes.error
      if (byQuotationRes.error) throw byQuotationRes.error

      const merged = new Map<string, InvoiceRow>()
      for (const invoice of [...(bySalesOrderRes.data || []), ...(byQuotationRes.data || [])] as InvoiceRow[]) {
        merged.set(invoice.invoice_number, invoice)
      }

      return { data: Array.from(merged.values()), error: null }
    }),
    fetchSpentByClientIds(clientIds),
  ])

  if (invoicesRes.error) throw invoicesRes.error

  const invoices = (invoicesRes.data || []) as InvoiceRow[]
  const { references, invoiceIds } = collectProjectReferences(salesOrders, invoices)
  const batchPayments = await fetchPaymentsForReferences(references, invoiceIds)

  const projects = mapSalesOrdersToProjects(salesOrders, invoices, batchPayments, spentByClient)

  return {
    projects,
    totalCount,
    hasMore: offset + projects.length < totalCount,
  }
}

/** @deprecated Prefer fetchOngoingProjectsPage for paginated loading. */
export async function fetchOngoingProjects(): Promise<OngoingProject[]> {
  const firstPage = await fetchOngoingProjectsPage(0, 1000)
  if (!firstPage.hasMore) return firstPage.projects

  let projects = [...firstPage.projects]
  let offset = projects.length

  while (offset < firstPage.totalCount) {
    const nextPage = await fetchOngoingProjectsPage(offset, MOBILE_BATCH_SIZE)
    projects = projects.concat(nextPage.projects)
    offset += nextPage.projects.length
    if (!nextPage.hasMore || nextPage.projects.length === 0) break
  }

  return projects
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
