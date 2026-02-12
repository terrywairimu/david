"use client"

import { useAuth } from "@/lib/auth-context"

/** Renders children only when the user has the specified action permission. */
export function ActionGuard({
  actionId,
  children,
}: {
  actionId: "add" | "edit" | "delete" | "export" | "view"
  children: React.ReactNode
}) {
  const { canPerformAction } = useAuth()
  if (!canPerformAction(actionId)) return null
  return <>{children}</>
}
