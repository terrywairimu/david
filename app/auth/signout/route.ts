import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL("/login", request.url), {
    status: 302,
    headers: { "Cache-Control": "no-store" },
  })
}

export async function GET(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL("/login", request.url), {
    status: 302,
    headers: { "Cache-Control": "no-store" },
  })
}
