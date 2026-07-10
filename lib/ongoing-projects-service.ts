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
  salesOrderAmount: number
  amountPaid: number
  balance: number
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
  expense_number: string
  quotation_number: string | null
}

type PurchaseRow = {
  purchase_order_number: string
  paid_to: string | null
}

type OutflowPaymentRow = {
  amount: number | null
  paid_to: string | null
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

function tokensFromPaidTo(value: string | null | undefined): string[] {
  if (!value) return []
  return value
    .split(/,\s*/)
    .map((token) => token.trim())
    .filter(Boolean)
}

function outflowPaymentMatchesProject(
  payment: OutflowPaymentRow,
  matchTokens: Set<string>
): boolean {
  if (payment.status !== "completed") return false
  const paidToTokens = tokensFromPaidTo(payment.paid_to)
  return paidToTokens.some((token) => matchTokens.has(token))
}

function sumSpentForProject(
  references: Set<string>,
  purchaseOrders: PurchaseRow[],
  expenses: ExpenseRow[],
  supplierPayments: OutflowPaymentRow[],
  employeePayments: OutflowPaymentRow[]
): number {
  const linkedPurchaseOrders = new Set(
    purchaseOrders
      .filter((purchase) => purchase.paid_to && references.has(purchase.paid_to))
      .map((purchase) => purchase.purchase_order_number)
  )
  const linkedExpenseNumbers = new Set(
    expenses
      .filter((expense) => expense.quotation_number && references.has(expense.quotation_number))
      .map((expense) => expense.expense_number)
  )

  const matchTokens = new Set<string>([
    ...references,
    ...linkedPurchaseOrders,
    ...linkedExpenseNumbers,
  ])

  const sumOutflows = (payments: OutflowPaymentRow[]) =>
    payments
      .filter((payment) => outflowPaymentMatchesProject(payment, matchTokens))
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)

  return sumOutflows(supplierPayments) + sumOutflows(employeePayments)
}

export function projectMatchesSearch(project: OngoingProject, rawQuery: string): boolean {
  const query = rawQuery.trim().toLowerCase()
  if (!query) return true

  const searchable = [
    project.salesOrderNumber,
    project.originalQuotationNumber,
    project.clientName,
    project.projectLocation,
    project.status,
    project.salesOrderAmount,
    project.amountPaid,
    project.balance,
    project.amountSpent,
    project.profitLoss,
    Math.abs(project.profitLoss),
  ]
    .filter((value) => value != null && value !== "")
    .map((value) => String(value).toLowerCase())

  return searchable.some((value) => value.includes(query))
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
export const DESKTOP_BATCH_SIZE = 18
/** Visual grid size on desktop (3 columns x 2 rows). */
export const DESKTOP_GRID_PAGE_SIZE = 6
/** Prefetch the next batch once the viewer reaches this 1-based card index within the loaded set. */
export const MOBILE_PREFETCH_CARD_INDEX = 12
export const DESKTOP_PREFETCH_CARD_INDEX = 15

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
  purchaseOrders: PurchaseRow[],
  expenses: ExpenseRow[],
  supplierPayments: OutflowPaymentRow[],
  employeePayments: OutflowPaymentRow[]
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
    const amountSpent = sumSpentForProject(
      references,
      purchaseOrders,
      expenses,
      supplierPayments,
      employeePayments
    )
    const salesOrderAmount = Number(salesOrder.grand_total ?? 0)

    return {
      id: salesOrder.id,
      quotationId: salesOrder.quotation_id ?? 0,
      salesOrderId: salesOrder.id,
      salesOrderNumber: salesOrder.order_number,
      originalQuotationNumber: quotationNumber,
      clientName: client?.name || "Unknown Client",
      projectLocation: client?.location || "-",
      salesOrderAmount,
      amountPaid,
      balance: salesOrderAmount - amountPaid,
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

async function fetchBatchSpendingData(
  references: string[],
  quotationNumbers: string[]
): Promise<{
  purchaseOrders: PurchaseRow[]
  expenses: ExpenseRow[]
  supplierPayments: OutflowPaymentRow[]
  employeePayments: OutflowPaymentRow[]
}> {
  const [purchasesRes, expensesRes, supplierPaymentsRes, employeePaymentsRes] = await Promise.all([
    references.length > 0
      ? supabase
          .from("purchases")
          .select("purchase_order_number, paid_to")
          .in("paid_to", references)
      : Promise.resolve({ data: [], error: null }),
    quotationNumbers.length > 0
      ? supabase
          .from("expenses")
          .select("expense_number, quotation_number")
          .in("quotation_number", quotationNumbers)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("supplier_payments").select("amount, paid_to, status").eq("status", "completed"),
    supabase.from("employee_payments").select("amount, paid_to, status").eq("status", "completed"),
  ])

  if (purchasesRes.error) throw purchasesRes.error
  if (expensesRes.error) throw expensesRes.error
  if (supplierPaymentsRes.error) throw supplierPaymentsRes.error
  if (employeePaymentsRes.error) throw employeePaymentsRes.error

  return {
    purchaseOrders: (purchasesRes.data || []) as PurchaseRow[],
    expenses: (expensesRes.data || []) as ExpenseRow[],
    supplierPayments: (supplierPaymentsRes.data || []) as OutflowPaymentRow[],
    employeePayments: (employeePaymentsRes.data || []) as OutflowPaymentRow[],
  }
}

function collectQuotationNumbers(salesOrders: SalesOrderRow[]): string[] {
  return [
    ...new Set(
      salesOrders
        .map((salesOrder) => salesOrder.original_quotation_number)
        .filter((value): value is string => !!value)
    ),
  ]
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
  limit = MOBILE_BATCH_SIZE,
  searchQuery = ""
): Promise<OngoingProjectsPageResult> {
  const from = offset
  const to = offset + limit - 1
  const trimmedSearch = searchQuery.trim()

  let salesOrdersQuery = supabase
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

  if (trimmedSearch) {
    const like = `%${trimmedSearch}%`
    salesOrdersQuery = salesOrdersQuery.or(
      `order_number.ilike.${like},original_quotation_number.ilike.${like}`
    )
  }

  const salesOrdersRes = await salesOrdersQuery
    .order("date_created", { ascending: false })
    .range(from, to)

  if (salesOrdersRes.error) throw salesOrdersRes.error

  let salesOrders = (salesOrdersRes.data || []) as SalesOrderWithClient[]
  const totalCount = salesOrdersRes.count ?? salesOrders.length

  if (trimmedSearch) {
    salesOrders = salesOrders.filter((salesOrder) => {
      const client = Array.isArray(salesOrder.client) ? salesOrder.client[0] : salesOrder.client
      const probe = [
        salesOrder.order_number,
        salesOrder.original_quotation_number,
        client?.name,
        client?.location,
        salesOrder.grand_total,
        salesOrder.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return probe.includes(trimmedSearch.toLowerCase())
    })
  }

  if (salesOrders.length === 0) {
    return { projects: [], totalCount: trimmedSearch ? 0 : totalCount, hasMore: false }
  }

  const salesOrderIds = salesOrders.map((salesOrder) => salesOrder.id)
  const quotationNumbers = collectQuotationNumbers(salesOrders)

  const invoices = await Promise.all([
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

    return Array.from(merged.values())
  })

  const { references, invoiceIds } = collectProjectReferences(salesOrders, invoices)
  const [batchPayments, spendingData] = await Promise.all([
    fetchPaymentsForReferences(references, invoiceIds),
    fetchBatchSpendingData(references, quotationNumbers),
  ])

  let projects = mapSalesOrdersToProjects(
    salesOrders,
    invoices,
    batchPayments,
    spendingData.purchaseOrders,
    spendingData.expenses,
    spendingData.supplierPayments,
    spendingData.employeePayments
  )

  if (trimmedSearch) {
    projects = projects.filter((project) => projectMatchesSearch(project, trimmedSearch))
  }

  return {
    projects,
    totalCount: trimmedSearch ? projects.length : totalCount,
    hasMore: !trimmedSearch && offset + salesOrders.length < totalCount,
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

export async function completeOngoingProject(salesOrderId: number): Promise<{ badDebtRecorded: boolean; badDebtAmount: number }> {
  const { data: salesOrder, error: salesOrderFetchError } = await supabase
    .from("sales_orders")
    .select("id, order_number, quotation_id, original_quotation_number, client_id, grand_total, status")
    .eq("id", salesOrderId)
    .single()

  if (salesOrderFetchError) throw salesOrderFetchError
  if (!salesOrder) throw new Error("Sales order not found")

  const quotationNumber = salesOrder.original_quotation_number || ""
  const salesOrderAmount = Number(salesOrder.grand_total ?? 0)

  const invoicesRes = await Promise.all([
    supabase
      .from("invoices")
      .select("id, invoice_number, sales_order_id, original_quotation_number, paid_amount")
      .eq("sales_order_id", salesOrderId),
    quotationNumber
      ? supabase
          .from("invoices")
          .select("id, invoice_number, sales_order_id, original_quotation_number, paid_amount")
          .eq("original_quotation_number", quotationNumber)
      : Promise.resolve({ data: [], error: null }),
  ]).then(([bySalesOrderRes, byQuotationRes]) => {
    if (bySalesOrderRes.error) throw bySalesOrderRes.error
    if (byQuotationRes.error) throw byQuotationRes.error

    const merged = new Map<string, InvoiceRow>()
    for (const invoice of [...(bySalesOrderRes.data || []), ...(byQuotationRes.data || [])] as InvoiceRow[]) {
      merged.set(invoice.invoice_number, invoice)
    }

    return Array.from(merged.values())
  })

  const projectInvoices = getInvoicesForProject(quotationNumber, salesOrder as SalesOrderRow, invoicesRes)
  const invoiceNumbers = projectInvoices.map((invoice) => invoice.invoice_number)
  const references = buildProjectReferences(quotationNumber, salesOrder.order_number, invoiceNumbers)
  const invoiceIds = projectInvoices
    .map((invoice) => invoice.id)
    .filter((id): id is number => id != null)

  const batchPayments = await fetchPaymentsForReferences(Array.from(references), invoiceIds)
  const amountPaid = calculateProjectAmountPaid(batchPayments, references, projectInvoices)
  const balance = Math.max(0, salesOrderAmount - amountPaid)

  let badDebtRecorded = false

  if (balance > 0) {
    const { error: badDebtError } = await supabase.from("bad_debts").upsert(
      {
        client_id: salesOrder.client_id,
        quotation_id: salesOrder.quotation_id,
        sales_order_id: salesOrder.id,
        original_quotation_number: quotationNumber || null,
        sales_order_number: salesOrder.order_number,
        sales_order_amount: salesOrderAmount,
        amount_paid: amountPaid,
        bad_debt_amount: balance,
        status: "outstanding",
        notes: `Recorded when project ${salesOrder.order_number} was marked complete.`,
        date_recorded: new Date().toISOString(),
      },
      { onConflict: "sales_order_id" }
    )

    if (badDebtError) throw badDebtError
    badDebtRecorded = true
  }

  if (salesOrder.quotation_id) {
    const { error: quotationError } = await supabase
      .from("quotations")
      .update({ status: COMPLETED_PROJECT_STATUS })
      .eq("id", salesOrder.quotation_id)

    if (quotationError) throw quotationError
  }

  const { error: salesOrderError } = await supabase
    .from("sales_orders")
    .update({ status: COMPLETED_PROJECT_STATUS })
    .eq("id", salesOrderId)

  if (salesOrderError) throw salesOrderError

  return { badDebtRecorded, badDebtAmount: balance }
}
