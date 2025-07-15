"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Building, Receipt } from "lucide-react"
import { supabase, type Expense, type RegisteredEntity } from "@/lib/supabase-client"
import { toast } from "sonner"
import ClientExpensesView from "./components/client-expenses-view"
import CompanyExpensesView from "./components/company-expenses-view"

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [clients, setClients] = useState<RegisteredEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeView, setActiveView] = useState<"client" | "company">("client")

  // Form state
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    amount: "",
    expense_type: "client" as "client" | "company",
    client_id: "",
    receipt_number: "",
    notes: "",
  })

  useEffect(() => {
    fetchExpenses()
    fetchClients()
  }, [])

  const fetchExpenses = async () => {
    setLoading(true)
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
        toast.error("Failed to fetch expenses")
      } else {
        setExpenses(data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase.from("registered_entities").select("*").eq("type", "client").order("name")

      if (error) {
        console.error("Error fetching clients:", error)
      } else {
        setClients(data || [])
      }
    } catch (error) {
      console.error("Unexpected error:", error)
    }
  }

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.client?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = expense.expense_type === activeView

    return matchesSearch && matchesType
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Generate expense number
      const expenseNumber = `EXP-${Date.now()}`

      const { data, error } = await supabase.from("expenses").insert([
        {
          ...formData,
          expense_number: expenseNumber,
          amount: Number.parseFloat(formData.amount),
          client_id: formData.client_id ? Number.parseInt(formData.client_id) : null,
          expense_type: activeView, // Use the active view as expense type
        },
      ])

      if (error) {
        console.error("Error inserting expense:", error)
        toast.error("Failed to add expense")
      } else {
        toast.success("Expense added successfully")
        setFormData({
          category: "",
          description: "",
          amount: "",
          expense_type: activeView,
          client_id: "",
          receipt_number: "",
          notes: "",
        })
        fetchExpenses()
      }
    } catch (error) {
      console.error("Unexpected error:", error)
      toast.error("An unexpected error occurred")
    }
  }

  const exportToCSV = () => {
    const csvContent = [
      ["Expense #", "Category", "Description", "Amount", "Type", "Client", "Date"],
      ...filteredExpenses.map((expense) => [
        expense.expense_number,
        expense.category,
        expense.description || "",
        expense.amount.toFixed(2),
        expense.expense_type,
        expense.client?.name || "",
        new Date(expense.date_created).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${activeView}_expenses.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleAddExpense = () => {
    setFormData({ ...formData, expense_type: activeView })
    // setShowForm(true) // This line is removed as it's not needed in the new structure
  }

  const renderActiveView = () => {
    switch (activeView) {
      case "client":
        return (
          <ClientExpensesView
            expenses={filteredExpenses}
            clients={clients}
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            handleSubmit={handleSubmit}
            exportToCSV={exportToCSV}
            handleAddExpense={handleAddExpense}
            formData={formData}
            setFormData={setFormData}
          />
        )
      case "company":
        return (
          <CompanyExpensesView
            expenses={filteredExpenses}
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            handleSubmit={handleSubmit}
            exportToCSV={exportToCSV}
            handleAddExpense={handleAddExpense}
            formData={formData}
            setFormData={setFormData}
          />
        )
      default:
        return (
          <ClientExpensesView
            expenses={filteredExpenses}
            clients={clients}
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            handleSubmit={handleSubmit}
            exportToCSV={exportToCSV}
            handleAddExpense={handleAddExpense}
            formData={formData}
            setFormData={setFormData}
          />
        )
    }
  }

  return (
    <div id="expensesSection">
      {/* Main Header Card with Navigation */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="mb-0">
            <Receipt className="me-2" size={20} />
            Expenses Management
          </h4>
          {/* Navigation Tabs in Header */}
          <div className="d-flex gap-2">
            <button
              className={`btn-add ${activeView === "client" ? "active" : ""}`}
              onClick={() => setActiveView("client")}
            >
              <Receipt size={16} className="me-1" />
              Client Expenses
            </button>
            <button
              className={`btn-add ${activeView === "company" ? "active" : ""}`}
              onClick={() => setActiveView("company")}
            >
              <Building size={16} className="me-1" />
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

export default ExpensesPage
