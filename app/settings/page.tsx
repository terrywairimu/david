"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuth, isAdmin, type AppRole } from "@/lib/auth-context"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users,
  Shield,
  Mail,
  Globe,
  ChevronDown,
  Save,
  Loader2,
  Settings as SettingsIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  APP_SECTIONS,
  ACTION_BUTTONS,
  ROLES,
} from "@/lib/settings-constants"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface UserProfileRow {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  provider: "email" | "google"
  role: AppRole
  sections: string[]
  action_buttons: string[]
}

export default function SettingsPage() {
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()
  const [profiles, setProfiles] = useState<UserProfileRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && (!profile || !isAdmin(profile.role))) {
      router.replace("/register")
      return
    }
  }, [authLoading, profile, router])

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from("app_user_profiles")
        .select("*")
        .order("created_at", { ascending: false })
      if (!error) setProfiles((data as UserProfileRow[]) ?? [])
      setLoading(false)
    }
    if (profile && isAdmin(profile.role)) {
      fetchProfiles()
    }
  }, [profile, supabase])

  const handleUpdateProfile = async (userId: string, updates: Partial<UserProfileRow>) => {
    setSaving(userId)
    const { error } = await supabase
      .from("app_user_profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
    if (!error) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, ...updates } : p))
      )
      setExpandedUser(null)
    }
    setSaving(null)
  }

  const toggleSection = (userId: string, sectionId: string) => {
    const p = profiles.find((x) => x.id === userId)
    if (!p) return
    const sections = p.sections || []
    const next = sections.includes(sectionId)
      ? sections.filter((s) => s !== sectionId)
      : [...sections, sectionId]
    handleUpdateProfile(userId, { sections: next })
  }

  const toggleAction = (userId: string, actionId: string) => {
    const p = profiles.find((x) => x.id === userId)
    if (!p) return
    const actions = p.action_buttons || []
    const next = actions.includes(actionId)
      ? actions.filter((a) => a !== actionId)
      : [...actions, actionId]
    handleUpdateProfile(userId, { action_buttons: next })
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <SettingsIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground text-sm">
              Manage users, roles, sections and permissions
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Registered Users</h2>
            <span className="text-sm text-muted-foreground">({profiles.length} users)</span>
          </div>
        </div>

        <div className="divide-y divide-border">
          <AnimatePresence>
            {profiles.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 hover:bg-muted/20 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* User info */}
                  <div className="flex-1 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {p.avatar_url ? (
                        <img
                          src={p.avatar_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Mail className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {p.full_name || "—"}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        {p.email}
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted text-xs">
                          {p.provider === "google" ? (
                            <Globe className="w-3 h-3" />
                          ) : (
                            <Mail className="w-3 h-3" />
                          )}
                          {p.provider}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Role & expand */}
                  <div className="flex items-center gap-3">
                    <div className="w-40">
                      <Select
                        value={p.role ?? "none"}
                        onValueChange={(v) =>
                          handleUpdateProfile(p.id, {
                            role:
                              v === "none" ? null : (v as AppRole),
                          })
                        }
                        disabled={saving === p.id}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem
                              key={r.id ?? "none"}
                              value={r.id ?? "none"}
                            >
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setExpandedUser(expandedUser === p.id ? null : p.id)
                      }
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          expandedUser === p.id ? "rotate-180" : ""
                        }`}
                      />
                    </Button>
                    {saving === p.id && (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded: sections & action buttons */}
                <AnimatePresence>
                  {expandedUser === p.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-6 pt-6 border-t border-border grid md:grid-cols-2 gap-6">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Shield className="w-4 h-4 text-primary" />
                            <span className="font-medium text-sm">Sections Access</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {APP_SECTIONS.map((s) => (
                              <label
                                key={s.id}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Checkbox
                                  checked={(p.sections || []).includes(s.id)}
                                  onCheckedChange={() =>
                                    toggleSection(p.id, s.id)
                                  }
                                  disabled={saving === p.id}
                                />
                                <span className="text-sm">{s.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Shield className="w-4 h-4 text-primary" />
                            <span className="font-medium text-sm">Action Buttons</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {ACTION_BUTTONS.map((a) => (
                              <label
                                key={a.id}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Checkbox
                                  checked={(p.action_buttons || []).includes(a.id)}
                                  onCheckedChange={() =>
                                    toggleAction(p.id, a.id)
                                  }
                                  disabled={saving === p.id}
                                />
                                <span className="text-sm">{a.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {profiles.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            No users found. Sign in to create your profile.
          </div>
        )}
      </motion.div>
    </div>
  )
}
