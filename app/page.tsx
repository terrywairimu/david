"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

const HomePage = () => {
  const router = useRouter()
  const { loading, getFirstAllowedSection } = useAuth()

  useEffect(() => {
    if (loading) return
    const first = getFirstAllowedSection()
    const path = first === "register" ? "/register" : `/${first}`
    router.replace(path)
  }, [router, loading, getFirstAllowedSection])

  return null
}

export default HomePage
