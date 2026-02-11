"use client"

import { usePathname } from "next/navigation"
import Sidebar from "@/components/sidebar"

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthRoute = pathname?.startsWith("/login") || pathname?.startsWith("/auth")

  if (isAuthRoute) {
    return <>{children}</>
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="content">{children}</div>
    </div>
  )
}
