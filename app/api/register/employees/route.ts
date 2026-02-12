import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/** Server-proxy for employees. Uses request cookies so RLS works. */
export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("status", "active")
    .order("date_added", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
