import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/** Server-proxy for quotations with client, items, and payment totals. */
export async function GET() {
  const supabase = await createClient()
  const { data: quotations, error } = await supabase
    .from("quotations")
    .select(`
      *,
      client:registered_entities(id, name, phone, location),
      items:quotation_items(*)
    `)
    .order("date_created", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!quotations?.length) return NextResponse.json([])

  const qNumbers = quotations.map(q => q.quotation_number)
  const { data: payments } = await supabase
    .from("payments")
    .select("quotation_number, amount")
    .in("quotation_number", qNumbers)
    .eq("status", "completed")
  const paidByQ = (payments ?? []).reduce<Record<string, number>>((acc, p) => {
    acc[p.quotation_number] = (acc[p.quotation_number] ?? 0) + p.amount
    return acc
  }, {})
  const result = quotations.map(q => ({
    ...q,
    total_paid: paidByQ[q.quotation_number] ?? 0,
    has_payments: (paidByQ[q.quotation_number] ?? 0) > 0,
    payment_percentage: q.grand_total > 0 ? ((paidByQ[q.quotation_number] ?? 0) / q.grand_total) * 100 : 0,
  }))
  return NextResponse.json(result)
}
