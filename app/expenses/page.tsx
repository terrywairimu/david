"use client"

import { useState, useEffect } from "react"
import { User, Building } from "lucide-react"
import { supabase, type Expense, type RegisteredEntity } from "@/lib/supabase-client"
import { toast } from "sonner"
import ClientExpensesView from "./components/client-expenses-view"
import CompanyExpensesView from "./components/company-expenses-view"

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [clients, setClients] = useState<RegisteredEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<"client" | "company">("client")

  useEffect(() => {
    fetchData()
    
    // Set up real-time updates
    const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    await Promise.all([fetchExpenses(), fetchClients()])
  }

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select(`
          *,
          client:registered_entities(*)
        `)
        .order("date_created", { ascending: false })

      if (error) {
        console.error("Error fetching expenses:", error)
        toast.error("Failed to load expenses")
      } else {
        setExpenses(data || [])
      }
    } catch (error) {
      console.error("Error fetching expenses:", error)
      toast.error("Failed to load expenses")
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("registered_entities")
        .select("*")
        .eq("type", "client")
        .order("name")

      if (error) {
        console.error("Error fetching clients:", error)
      } else {
        setClients(data || [])
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
    }
  }

  const handleRefresh = () => {
    fetchData()
  }

  const renderActiveView = () => {
    switch (activeView) {
      case "client":
        return <ClientExpensesView expenses={expenses} clients={clients} onRefresh={handleRefresh} />
      case "company":
        return <CompanyExpensesView expenses={expenses} clients={clients} onRefresh={handleRefresh} />
      default:
        return <ClientExpensesView expenses={expenses} clients={clients} onRefresh={handleRefresh} />
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div id="expensesSection">
      {/* Main Header Card with Navigation */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h2 className="mb-0">Expenses Management</h2>
          {/* Navigation Buttons in Header */}
          <div className="d-flex gap-3">
            <button
              className={`btn btn-add ${activeView === "client" ? "active" : ""}`}
              onClick={() => setActiveView("client")}
            >
                              <User size={16} className="me-2" />
              Client Expenses
            </button>
            <button
              className={`btn btn-add ${activeView === "company" ? "active" : ""}`}
              onClick={() => setActiveView("company")}
            >
              <Building size={16} className="me-2" />
              Company Expenses
            </button>
          </div>
        </div>
      </div>

      {/* Active View Content */}
      {renderActiveView()}
    </div>
  )
}
