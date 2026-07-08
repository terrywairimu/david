import { supabase } from "./supabase-client"

export interface OngoingProject {
  id: number
  quotationNumber: string
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

type QuotationRow = {
  id: number
  quotation_number: string
  client_id: number
  grand_total: number | null
  status: string | null
  date_created: string | null
  client: { name: string; location: string | null } | { name: string; location: string | null }[] | null
}

function sumPaymentsForQuotation(payments: PaymentRow[], quotationNumber: string): number {
  return payments
    .filter(
      (payment) =>
        payment.status === "completed" &&
        (payment.quotation_number === quotationNumber || payment.paid_to === quotationNumber)
    )
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

export async function fetchOngoingProjects(): Promise<OngoingProject[]> {
  const [quotationsRes, paymentsRes, expensesRes, purchasesRes] = await Promise.all([
    supabase
      .from("quotations")
      .select(`
        id,
        quotation_number,
        client_id,
        grand_total,
        status,
        date_created,
        client:registered_entities(name, location)
      `)
      .order("date_created", { ascending: false }),
    supabase.from("payments").select("amount, quotation_number, paid_to, status"),
    supabase
      .from("expenses")
      .select("amount, client_id, expense_type, status")
      .eq("expense_type", "client"),
    supabase
      .from("purchases")
      .select("total_amount, client_id, status")
      .not("client_id", "is", null),
  ])

  if (quotationsRes.error) throw quotationsRes.error
  if (paymentsRes.error) throw paymentsRes.error
  if (expensesRes.error) throw expensesRes.error
  if (purchasesRes.error) throw purchasesRes.error

  const payments = (paymentsRes.data || []) as PaymentRow[]
  const expenses = (expensesRes.data || []) as ExpenseRow[]
  const purchases = (purchasesRes.data || []) as PurchaseRow[]
  const spentByClient = buildSpentByClient(expenses, purchases)

  return ((quotationsRes.data || []) as QuotationRow[]).map((quotation) => {
    const client = Array.isArray(quotation.client) ? quotation.client[0] : quotation.client
    const amountPaid = sumPaymentsForQuotation(payments, quotation.quotation_number)
    const amountSpent = spentByClient.get(quotation.client_id) || 0

    return {
      id: quotation.id,
      quotationNumber: quotation.quotation_number,
      clientName: client?.name || "Unknown Client",
      projectLocation: client?.location || "-",
      quoteAmount: Number(quotation.grand_total || 0),
      amountPaid,
      amountSpent,
      profitLoss: amountPaid - amountSpent,
      status: quotation.status || undefined,
      dateCreated: quotation.date_created || undefined,
    }
  })
}
