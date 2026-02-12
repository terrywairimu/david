import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/** Server-proxy for purchases. Uses request cookies. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const paymentType = searchParams.get("type") ?? "all"
  const viewType = searchParams.get("view") ?? "general"
  const supabase = await createClient()
  let query = supabase
    .from("purchases")
    .select(`
      *,
      supplier:registered_entities!purchases_supplier_id_fkey(id, name, phone, location),
      client:registered_entities!purchases_client_id_fkey(id, name, phone, location),
      items:purchase_items(
        *,
        stock_item:stock_items(name, description, unit)
      )
    `)
  if (paymentType === "credit") {
    query = query.in("payment_status", ["not_yet_paid", "partially_paid"])
  } else if (paymentType === "cash") {
    query = query.eq("payment_status", "fully_paid")
  }
  if (viewType === "client") {
    query = query.not("client_id", "is", null)
  } else if (viewType === "general") {
    query = query.is("client_id", null)
  }
  const { data, error } = await query.order("purchase_date", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
