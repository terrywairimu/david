import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/** Server-proxy for current user's profile. Uses request cookies. */
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { data: profile, error } = await supabase
    .from("app_user_profiles")
    .select("*")
    .eq("id", user.id)
    .single()
  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(profile ?? null)
}
