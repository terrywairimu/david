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

export function isAdmin(role: AppRole) {
  return role && ADMIN_ROLES.includes(role)
}

interface AuthContextType {
  user: User | null
  profile: AppUserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  canAccessSettings: boolean
  canPerformAction: (actionId: string) => boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  canAccessSettings: false,
  canPerformAction: () => true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AppUserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchProfile = useCallback(
    async (userId: string, userData?: { email?: string; full_name?: string; avatar_url?: string; provider?: string }) => {
      const { data } = await supabase
        .from("app_user_profiles")
        .select("*")
        .eq("id", userId)
        .single()
      if (data) return data as AppUserProfile
      if (userData) {
        const provider = (userData.provider === "google" ? "google" : "email") as "email" | "google"
        await supabase.from("app_user_profiles").insert({
          id: userId,
          email: userData.email ?? "",
          full_name: userData.full_name ?? null,
          avatar_url: userData.avatar_url ?? null,
          provider,
        })
        const { data: created } = await supabase
          .from("app_user_profiles")
          .select("*")
          .eq("id", userId)
          .single()
        return created as AppUserProfile
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
    refreshProfile().finally(() => setLoading(false))

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
      subscription.unsubscribe()
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [supabase, fetchProfile, refreshProfile])

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const canAccessSettings = !!(profile && isAdmin(profile.role))
  const canPerformAction = (actionId: string) => {
    if (!profile) return true
    if (isAdmin(profile.role)) return true
    const actions = profile.action_buttons ?? []
    return actions.length === 0 ? true : actions.includes(actionId)
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
    canPerformAction: () => true,
  }
}
