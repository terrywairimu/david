"use client"

import { usePathname } from "next/navigation"
import Sidebar from "@/components/sidebar"
import { useAuth } from "@/lib/auth-context"
import { UserX, Loader2 } from "lucide-react"

const PATH_TO_SECTION: Record<string, string> = {
  "/": "register",
  "/register": "register",
  "/sales": "sales",
  "/payments": "payments",
  "/expenses": "expenses",
  "/purchases": "purchases",
  "/stock": "stock",
  "/reports": "reports",
  "/analytics": "analytics",
  "/settings": "settings",
}

function getSectionForPath(pathname: string | null): string | null {
  if (!pathname) return null
  const path = pathname.split("?")[0] || "/"
  if (PATH_TO_SECTION[path]) return PATH_TO_SECTION[path]
  const segment = path.split("/").filter(Boolean)[0]
  return segment ? PATH_TO_SECTION[`/${segment}`] ?? null : PATH_TO_SECTION["/"]
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { needsAdminApproval, canAccessSection, loading, user, profile } = useAuth()
  const isAuthRoute = pathname?.startsWith("/login") || pathname?.startsWith("/auth")

  if (isAuthRoute) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="app-container">
        <Sidebar />
        <div className="content flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  // User logged in but profile not loaded yet (fetch failed or pending) - don't show Access denied
  if (user && !profile) {
    return (
      <div className="app-container">
        <Sidebar />
        <div className="content flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (needsAdminApproval) {
    return (
      <div className="app-container">
        <Sidebar />
        <div className="content flex items-center justify-center min-h-[60vh]">
          <div className="text-center p-8 max-w-md">
            <UserX className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No access assigned</h2>
            <p className="text-muted-foreground">
              Contact the admin to add you.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const section = getSectionForPath(pathname)
  const hasAccess = !section || canAccessSection(section)

  const showNoAccess = section && !hasAccess
  if (showNoAccess) {
    return (
      <div className="app-container">
        <Sidebar />
        <div className="content flex items-center justify-center min-h-[60vh]">
          <div className="text-center p-8 max-w-md">
            <UserX className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access denied</h2>
            <p className="text-muted-foreground">
              You don&apos;t have permission to view this section. Contact the admin if you need access.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="content">{children}</div>
    </div>
  )
}
