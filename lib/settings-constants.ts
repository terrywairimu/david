// App sections (sidebar / page access)
export const APP_SECTIONS = [
  { id: "register", label: "Register" },
  { id: "sales", label: "Sales" },
  { id: "payments", label: "Payments" },
  { id: "expenses", label: "Expenses" },
  { id: "purchases", label: "Purchases" },
  { id: "stock", label: "Stock" },
  { id: "reports", label: "Reports" },
  { id: "analytics", label: "Analytics" },
  { id: "settings", label: "Settings" },
] as const

// Action buttons visible in tables/modals
export const ACTION_BUTTONS = [
  { id: "add", label: "Add / Create" },
  { id: "edit", label: "Edit" },
  { id: "delete", label: "Delete" },
  { id: "export", label: "Export" },
  { id: "view", label: "View" },
] as const

// Default: all sections and actions for superadmin, ceo, deputy_ceo (overridable per user)
export const ALL_SECTION_IDS = APP_SECTIONS.map((s) => s.id)
export const ALL_ACTION_IDS = ACTION_BUTTONS.map((a) => a.id)

const ADMIN_ROLES = ["superadmin", "ceo", "deputy_ceo"] as const
export function getDefaultsForAdminRole(): { sections: string[]; action_buttons: string[] } {
  return { sections: [...ALL_SECTION_IDS], action_buttons: [...ALL_ACTION_IDS] }
}
export function isAdminRole(role: string | null): role is (typeof ADMIN_ROLES)[number] {
  return !!role && ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number])
}

export const ROLES = [
  { id: "none", label: "No role" },
  { id: "superadmin", label: "Super Admin" },
  { id: "ceo", label: "CEO" },
  { id: "deputy_ceo", label: "Deputy CEO" },
  { id: "sales", label: "Sales" },
  { id: "finance", label: "Finance" },
  { id: "design", label: "Design" },
] as const
