import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/** Server-proxy for client list. Uses request cookies. */
export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("registered_entities")
    .select("id, name")
    .eq("type", "client")
    .order("name")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
