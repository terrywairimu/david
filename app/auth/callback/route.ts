import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  let next = searchParams.get("next") ?? "/"
  if (!next.startsWith("/")) next = "/"

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const isLocalEnv = process.env.NODE_ENV === "development"
      const forwardedHost = request.headers.get("x-forwarded-host")
      const redirectBase =
        isLocalEnv ? origin : forwardedHost ? `https://${forwardedHost}` : siteUrl
      return NextResponse.redirect(`${redirectBase}${next}`)
    }
  }

  return NextResponse.redirect(`${siteUrl}/login?error=auth_callback_error`)
}
