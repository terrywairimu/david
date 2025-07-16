"use client"

import { useState, useEffect } from "react"
import { supabase, type Expense, type RegisteredEntity } from "@/lib/supabase-client"
import { toast } from "sonner"
import ClientExpensesView from "./components/client-expenses-view"
import CompanyExpensesView from "./components/company-expenses-view"

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [clients, setClients] = useState<RegisteredEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("client")
  const [searchTerm, setSearchTerm] = useState("")

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

  if (loading) {
    return (
      <div className="container-fluid mt-4">
        <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid mt-4" id="expensesSection">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title mb-0">Expenses Management</h4>
            </div>
            
            {/* Tab Navigation */}
            <div className="card-body">
              <div className="d-flex mb-4">
                <button
                  className={`btn btn-add me-2 ${activeTab === "client" ? "active" : ""}`}
                  onClick={() => setActiveTab("client")}
                >
                  Client Expenses
                </button>
                <button
                  className={`btn btn-add ${activeTab === "company" ? "active" : ""}`}
                  onClick={() => setActiveTab("company")}
                >
                  Company Expenses
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === "client" ? (
                <ClientExpensesView
                  expenses={expenses}
                  clients={clients}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  onRefresh={handleRefresh}
                />
              ) : (
                <CompanyExpensesView
                  expenses={expenses}
                  clients={clients}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  onRefresh={handleRefresh}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
