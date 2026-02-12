import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/** Server-proxy for invoices with client and items. */
export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("invoices")
    .select(`
      *,
      client:registered_entities(id, name, phone, location),
      items:invoice_items(*)
    `)
    .order("date_created", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
