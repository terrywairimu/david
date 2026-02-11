"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export type AppRole =
  | "superadmin"
  | "ceo"
  | "deputy_ceo"
  | "sales"
  | "finance"
  | "design"
  | null

export interface AppUserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  provider: "email" | "google"
  role: AppRole
  sections: string[]
  action_buttons: string[]
}

const ADMIN_ROLES: AppRole[] = ["superadmin", "ceo", "deputy_ceo"]

// Fallback: known admin emails (in case profile fetch fails or is stale)
const ADMIN_EMAILS = ["allanmwangin@gmail.com", "cabinetmasters2024@gmail.com"]

export function isAdmin(role: AppRole) {
  return role && ADMIN_ROLES.includes(role)
}

function isKnownAdminEmail(email: string | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase())
}

// Section order for "first allowed" redirect (must match PATH_TO_SECTION keys)
const SECTION_ORDER = [
  "register", "sales", "payments", "expenses", "purchases", "stock", "reports", "analytics", "settings",
] as const

interface AuthContextType {
  user: User | null
  profile: AppUserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  canAccessSettings: boolean
  canAccessSection: (sectionId: string) => boolean
  canPerformAction: (actionId: string) => boolean
  needsAdminApproval: boolean
  getFirstAllowedSection: () => string
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  canAccessSettings: false,
  canAccessSection: () => false,
  canPerformAction: () => false,
  needsAdminApproval: false,
  getFirstAllowedSection: () => "register",
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AppUserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchProfile = useCallback(
    async (userId: string, userData?: { email?: string; full_name?: string; avatar_url?: string; provider?: string }) => {
      const { data, error } = await supabase
        .from("app_user_profiles")
        .select("*")
        .eq("id", userId)
        .single()
      if (data) return data as AppUserProfile
      if (userData && error?.code === "PGRST116") {
        const provider = (userData.provider === "google" ? "google" : "email") as "email" | "google"
        const { error: insertError } = await supabase.from("app_user_profiles").insert({
          id: userId,
          email: userData.email ?? "",
          full_name: userData.full_name ?? null,
          avatar_url: userData.avatar_url ?? null,
          provider,
        })
        if (!insertError || insertError.code === "23505") {
          const { data: created } = await supabase
            .from("app_user_profiles")
            .select("*")
            .eq("id", userId)
            .single()
          return created as AppUserProfile
        }
      }
      return null
    },
    [supabase]
  )

  const refreshProfile = useCallback(
    async (userToFetch?: { id: string; email?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> }) => {
      const u = userToFetch ?? (await supabase.auth.getUser()).data.user
      setUser(u ?? null)
      if (u) {
        const p = await fetchProfile(u.id, {
          email: u.email,
          full_name: (u.user_metadata?.full_name ?? u.user_metadata?.name) as string | undefined,
          avatar_url: u.user_metadata?.avatar_url as string | undefined,
          provider: u.app_metadata?.provider as string | undefined,
        })
        setProfile(p)
        return !!p
      }
      setProfile(null)
      return false
    },
    [supabase, fetchProfile]
  )

  useEffect(() => {
    let mounted = true
    let initialAuthReceived = false

    const finishLoading = () => {
      if (mounted && initialAuthReceived) setLoading(false)
    }

    // getSession reads from cookies immediately (no server call) - use for fast initial restore
    const initFromSession = async () => {
      let { data: { session } } = await supabase.auth.getSession()
      let userToLoad = session?.user
      // Fallback: if getSession returns null on reload, try getUser() (validates with server)
      if (!userToLoad) {
        const { data: { user } } = await supabase.auth.getUser()
        userToLoad = user ?? undefined
      }
      if (!mounted) return
      if (userToLoad) {
        const u = userToLoad
        let ok = await refreshProfile(u)
        if (!mounted) return
        if (!ok) {
          // Profile fetch failed - retry with backoff (500ms, 1s, 2s) for reload edge cases
          const delays = [500, 1000, 2000]
          for (const d of delays) {
            await new Promise((r) => setTimeout(r, d))
            if (!mounted) break
            ok = await refreshProfile(u)
            if (ok) break
          }
        }
      } else {
        setUser(null)
        setProfile(null)
      }
      initialAuthReceived = true
      finishLoading()
    }

    initFromSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      if (!initialAuthReceived && event === "INITIAL_SESSION") {
        initialAuthReceived = true
        if (session?.user) {
          let ok = await refreshProfile(session.user)
          if (!ok) {
            const delays = [500, 1000, 2000]
            for (const d of delays) {
              await new Promise((r) => setTimeout(r, d))
              if (!mounted) break
              ok = await refreshProfile(session.user)
              if (ok) break
            }
          }
        }
        finishLoading()
        return
      }
      setUser(session?.user ?? null)
      if (session?.user) {
        await refreshProfile(session.user)
      } else {
        setProfile(null)
      }
    })

    // Fallback: if initFromSession hangs, allow loading to finish after 12s
    const t = setTimeout(() => {
      if (mounted && !initialAuthReceived) {
        initialAuthReceived = true
        finishLoading()
      }
    }, 12000)

    // Refetch profile when tab becomes visible (e.g. after role was updated in another tab/dashboard)
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && supabase) {
        refreshProfile()
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      mounted = false
      clearTimeout(t)
      subscription.unsubscribe()
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [supabase, fetchProfile, refreshProfile])

  const signOut = async () => {
    // Use server route to properly clear auth cookies (Supabase SSR)
    window.location.assign("/auth/signout")
  }

  const canAccessSettings =
    !!(profile && isAdmin(profile.role)) || isKnownAdminEmail(user?.email ?? undefined)
  const needsAdminApproval = !!(
    user &&
    profile &&
    !canAccessSettings &&
    (!profile.role || (profile.sections?.length ?? 0) === 0)
  )
  const canAccessSection = (sectionId: string) => {
    if (canAccessSettings) return true
    if (!profile) return false
    if (needsAdminApproval) return false
    const sections = profile.sections ?? []
    return sections.includes(sectionId)
  }
  const getFirstAllowedSection = () => {
    if (!profile || needsAdminApproval) return "register"
    if (canAccessSettings) return "register"
    const sections = profile.sections ?? []
    const first = SECTION_ORDER.find((s) => sections.includes(s))
    return first ?? "register"
  }
  const canPerformAction = (actionId: string) => {
    if (canAccessSettings) return true
    if (!profile) return false
    if (isAdmin(profile.role)) return true
    if (needsAdminApproval) return false
    const actions = profile.action_buttons ?? []
    return actions.includes(actionId)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signOut,
        canAccessSettings,
        canAccessSection,
        canPerformAction,
        needsAdminApproval,
        getFirstAllowedSection,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  return ctx ?? {
    user: null,
    profile: null,
    loading: true,
    signOut: async () => {},
    canAccessSettings: false,
    canAccessSection: () => false,
    canPerformAction: () => false,
    needsAdminApproval: false,
    getFirstAllowedSection: () => "register",
  }
}
