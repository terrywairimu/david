"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, isAdmin, type AppRole } from "@/lib/auth-context"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users,
  Shield,
  Mail,
  Globe,
  ChevronDown,
  Loader2,
  Settings as SettingsIcon,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  APP_SECTIONS,
  ACTION_BUTTONS,
  ROLES,
  ALL_SECTION_IDS,
  ALL_ACTION_IDS,
  getDefaultsForAdminRole,
  isAdminRole,
} from "@/lib/settings-constants"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

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
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!authLoading && (!profile || !isAdmin(profile.role))) {
      router.replace("/register")
      return
    }
  }, [authLoading, profile, router])

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const res = await fetch("/api/settings/profiles", { credentials: "include" })
        if (!res.ok) return
        const data = await res.json()
        setProfiles(Array.isArray(data) ? (data as UserProfileRow[]) : [])
      } finally {
        setLoading(false)
      }
    }
    if (profile && isAdmin(profile.role)) {
      fetchProfiles()
    }
  }, [profile])

  const handleUpdateProfile = async (
    userId: string,
    updates: Partial<UserProfileRow>,
    { optimistic = true }: { optimistic?: boolean } = {}
  ) => {
    const prev = profiles.find((p) => p.id === userId)
    if (!prev) return

    // When role changes to admin, apply defaults for sections/action_buttons if empty
    if (updates.role !== undefined && isAdminRole(updates.role)) {
      const defaults = getDefaultsForAdminRole()
      if (!updates.sections && (!prev.sections || prev.sections.length === 0))
        updates.sections = defaults.sections
      if (!updates.action_buttons && (!prev.action_buttons || prev.action_buttons.length === 0))
        updates.action_buttons = defaults.action_buttons
    }

    const merged = { ...prev, ...updates }
    if (optimistic) {
      setProfiles((p) => p.map((x) => (x.id === userId ? merged : x)))
    }

    try {
      const res = await fetch("/api/settings/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: userId, ...updates }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to save")
      }
    } catch (e) {
      if (optimistic) setProfiles((p) => p.map((x) => (x.id === userId ? prev : x)))
      toast.error(e instanceof Error ? e.message : "Failed to save")
    }
  }

  const toggleSection = (userId: string, sectionId: string) => {
    const p = profiles.find((x) => x.id === userId)
    if (!p) return
    const sections = p.sections || []
    const hasAll = isAdminRole(p.role) && sections.length === 0
    const currentlyChecked = hasAll || sections.includes(sectionId)
    const next = currentlyChecked
      ? (hasAll ? ALL_SECTION_IDS.filter((s) => s !== sectionId) : sections.filter((s) => s !== sectionId))
      : [...sections, sectionId]
    handleUpdateProfile(userId, { sections: next })
  }

  const toggleAction = (userId: string, actionId: string) => {
    const p = profiles.find((x) => x.id === userId)
    if (!p) return
    const actions = p.action_buttons || []
    const hasAll = isAdminRole(p.role) && actions.length === 0
    const currentlyChecked = hasAll || actions.includes(actionId)
    const next = currentlyChecked
      ? (hasAll ? ALL_ACTION_IDS.filter((a) => a !== actionId) : actions.filter((a) => a !== actionId))
      : [...actions, actionId]
    handleUpdateProfile(userId, { action_buttons: next })
  }

  const handleDeleteUser = async () => {
    if (!deleteUserId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/settings/profiles?id=${encodeURIComponent(deleteUserId)}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to remove user")
      }
      setProfiles((p) => p.filter((x) => x.id !== deleteUserId))
      toast.success("User removed from database")
      setDeleteUserId(null)
    } catch (err: unknown) {
      console.error("Delete user failed:", err)
      const msg = err && typeof err === "object" && "message" in err
        ? (err as { message: string }).message
        : "Failed to remove user"
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteUserId(p.id)}
                      disabled={p.id === profile?.id}
                      title={p.id === profile?.id ? "Cannot remove yourself" : "Remove user"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <div className="w-40">
                      <Select
                        value={p.role ?? "none"}
                        onValueChange={(v) =>
                          handleUpdateProfile(p.id, {
                            role:
                              v === "none" ? null : (v as AppRole),
                          })
                        }
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
                                  checked={
                                    isAdminRole(p.role)
                                      ? (p.sections?.length ?? 0) === 0 || (p.sections || []).includes(s.id)
                                      : (p.sections || []).includes(s.id)
                                  }
                                  onCheckedChange={() =>
                                    toggleSection(p.id, s.id)
                                  }
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
                                  checked={
                                    isAdminRole(p.role)
                                      ? (p.action_buttons?.length ?? 0) === 0 || (p.action_buttons || []).includes(a.id)
                                      : (p.action_buttons || []).includes(a.id)
                                  }
                                  onCheckedChange={() =>
                                    toggleAction(p.id, a.id)
                                  }
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

      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div className="space-y-2">
                <AlertDialogTitle>Remove registered user</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the user from the database. They can sign in again to create a new profile. This cannot be undone.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault()
                handleDeleteUser()
              }}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Removing…
                </>
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
