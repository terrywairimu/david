import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/** GET: Fetch all user profiles (admin only). */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { data: myProfile } = await supabase
    .from("app_user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  const isAdmin =
    myProfile?.role === "superadmin" ||
    myProfile?.role === "ceo" ||
    myProfile?.role === "deputy_ceo"
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { data, error } = await supabase
    .from("app_user_profiles")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

/** PATCH: Update a user profile (admin only). */
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { data: myProfile } = await supabase
    .from("app_user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  const isAdmin =
    myProfile?.role === "superadmin" ||
    myProfile?.role === "ceo" ||
    myProfile?.role === "deputy_ceo"
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  const { id, ...updates } = body
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id required" }, { status: 400 })
  }
  const { error } = await supabase
    .from("app_user_profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

/** DELETE: Remove a user profile (admin only). */
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { data: myProfile } = await supabase
    .from("app_user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  const isAdmin =
    myProfile?.role === "superadmin" ||
    myProfile?.role === "ceo" ||
    myProfile?.role === "deputy_ceo"
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  if (id === user.id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 })
  }
  const { error } = await supabase.from("app_user_profiles").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
