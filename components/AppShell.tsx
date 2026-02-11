"use client"

import { usePathname } from "next/navigation"
import Sidebar from "@/components/sidebar"
import { useAuth } from "@/lib/auth-context"
import { UserX } from "lucide-react"

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { needsAdminApproval, loading } = useAuth()
  const isAuthRoute = pathname?.startsWith("/login") || pathname?.startsWith("/auth")

  if (isAuthRoute) {
    return <>{children}</>
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

  return (
    <div className="app-container">
      <Sidebar />
      <div className="content">{children}</div>
    </div>
  )
}
