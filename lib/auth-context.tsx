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

interface AuthContextType {
  user: User | null
  profile: AppUserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  canAccessSettings: boolean
  canPerformAction: (actionId: string) => boolean
  needsAdminApproval: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  canAccessSettings: false,
  canPerformAction: () => false,
  needsAdminApproval: false,
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

  const refreshProfile = useCallback(async () => {
    const {
      data: { user: u },
    } = await supabase.auth.getUser()
    setUser(u)
    if (u) {
      const p = await fetchProfile(u.id, {
        email: u.email,
        full_name: u.user_metadata?.full_name ?? u.user_metadata?.name,
        avatar_url: u.user_metadata?.avatar_url,
        provider: u.app_metadata?.provider,
      })
      setProfile(p)
    } else {
      setProfile(null)
    }
  }, [supabase, fetchProfile])

  useEffect(() => {
    let mounted = true
    const done = () => { if (mounted) setLoading(false) }
    refreshProfile().finally(done)
    const t = setTimeout(done, 10000) // prevent infinite loading if profile fetch hangs
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const u = session.user
        const p = await fetchProfile(u.id, {
          email: u.email,
          full_name: u.user_metadata?.full_name ?? u.user_metadata?.name,
          avatar_url: u.user_metadata?.avatar_url,
          provider: u.app_metadata?.provider,
        })
        setProfile(p)
      } else {
        setProfile(null)
      }
    })

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
  const canPerformAction = (actionId: string) => {
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
        canPerformAction,
        needsAdminApproval,
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
    canPerformAction: () => false,
    needsAdminApproval: false,
  }
}
