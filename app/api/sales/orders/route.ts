import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/** Server-proxy for sales_orders with client and items. Uses request cookies. */
export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sales_orders")
    .select(`
      *,
      client:registered_entities(id, name, phone, location),
      items:sales_order_items(*)
    `)
    .order("date_created", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
