"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

const HomePage = () => {
  const router = useRouter()

  useEffect(() => {
    // Redirect to register page as it's the default active section in the HTML
    router.push("/register")
  }, [router])

  return null
}

export default HomePage
