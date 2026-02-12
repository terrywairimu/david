import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/** Debug route: visit /api/debug-auth while logged in to verify session and data access. */
export async function GET() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const cookieNames = cookieStore.getAll().map((c) => c.name).filter((n) => n.includes("supabase") || n.includes("auth"))

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const hasSession = !!session
  const hasUser = !!user

  let profile: unknown = null
  let profileError: string | null = null
  let entitiesCount: number | null = null
  let entitiesError: string | null = null

  if (user?.id) {
    const { data: prof, error: pe } = await supabase
      .from("app_user_profiles")
      .select("id, email, role")
      .eq("id", user.id)
      .single()
    profile = prof
    profileError = pe?.message ?? null
  }

  if (user?.id) {
    const { count, error: ee } = await supabase
      .from("registered_entities")
      .select("id", { count: "exact", head: true })
    entitiesCount = count
    entitiesError = ee?.message ?? null
  }

  return NextResponse.json({
    ok: true,
    debug: {
      hasSession,
      hasUser,
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
      cookieNames,
      profile,
      profileError,
      entitiesCount,
      entitiesError,
      userError: userError?.message ?? null,
    },
  })
}
