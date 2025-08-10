import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Initialize from matchMedia on first client render to avoid a false desktop branch on mobile
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false
    try {
      return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches
    } catch {
      return window.innerWidth < MOBILE_BREAKPOINT
    }
  })

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }
    // Set current state and subscribe
    setIsMobile(mql.matches)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
