import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/** Forwards Supabase auth cookies from source to target response. Critical for session persistence on redirects and hard reloads. */
function forwardAuthCookies(
  source: NextResponse,
  target: NextResponse
): NextResponse {
  source.cookies.getAll().forEach((cookie) =>
    target.cookies.set(cookie.name, cookie.value)
  )
  return target
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // getClaims() validates JWT and triggers refresh; critical for session sync with browser
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims ?? null

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/auth")

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return forwardAuthCookies(supabaseResponse, NextResponse.redirect(url))
  }

  // Let /auth/signout run so session can be cleared before redirect
  // Redirect to / so client can route to user's first allowed section (avoids sending to register if they lack access)
  if (user && isAuthRoute && !request.nextUrl.pathname.startsWith("/auth/signout")) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return forwardAuthCookies(supabaseResponse, NextResponse.redirect(url))
  }

  // Protect /settings - only superadmin, ceo, deputy_ceo (checked in page)
  return supabaseResponse
}
