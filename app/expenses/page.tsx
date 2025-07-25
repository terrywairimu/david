"use client"

import { useState, useEffect } from "react"
import { User, Building } from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"
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
    
    // Set up real-time subscription for expenses
    const expensesSubscription = supabase
      .channel('expenses_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, (payload) => {
        console.log('Expenses change detected:', payload)
        fetchExpenses() // Refresh expenses when changes occur
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registered_entities' }, (payload) => {
        console.log('Registered entities change detected:', payload)
        fetchClients() // Refresh clients when changes occur
      })
      .subscribe()

    return () => {
      supabase.removeChannel(expensesSubscription)
    }
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
        return <ClientExpensesView 
          clients={clients} 
        />
      case "company":
        return <CompanyExpensesView 
          clients={clients} 
        />
      default:
        return <ClientExpensesView 
          clients={clients} 
        />
    }
  }

  return (
    <div id="expensesSection">
      {/* Main Header Card with Navigation */}
      <div className="card">
        <SectionHeader 
          title="Expenses Management" 
          icon={<Building size={20} />}
        >
          <button
            className={`btn-add ${activeView === "client" ? "active" : ""}`}
            onClick={() => setActiveView("client")}
          >
            <User size={16} className="me-1" />
            Client Expenses
          </button>
          <button
            className={`btn-add ${activeView === "company" ? "active" : ""}`}
            onClick={() => setActiveView("company")}
          >
            <Building size={16} className="me-1" />
            Company Expenses
          </button>
        </SectionHeader>
        
        {/* Active View Content */}
        <div className="card-body p-0">
      {renderActiveView()}
        </div>
      </div>
    </div>
  )
}
