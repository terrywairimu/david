"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Plus, Search, Download, Edit, Trash2, Eye, Receipt } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"

interface Expense {
  id: number
  expense_number: string
  client_id?: number
  category: string
  amount: number
  description: string
  receipt_number?: string
  date_created: string
  type: "client" | "company"
}

const CompanyExpensesView = () => {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    category: "",
    amount: 0,
    description: "",
    receipt_number: "",
  })

  const categories = [
    "Office Rent",
    "Utilities",
    "Insurance",
    "Legal & Professional",
    "Marketing & Advertising",
    "Equipment & Software",
    "Travel & Transportation",
    "Office Supplies",
    "Maintenance",
    "Other",
  ]

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      // Check if Supabase is properly configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl || supabaseUrl === "https://placeholder.supabase.co") {
        console.warn("Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.")
        toast.error("Database not configured. Please set up Supabase credentials.")
        setExpenses([])
        return
      }

      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("type", "company")
        .order("date_created", { ascending: false })

      if (error) {
        console.error("Error fetching expenses:", error)
        toast.error("Failed to fetch expenses. Please check your database connection.")
      } else {
        setExpenses(data || [])
      }
    } catch (err) {
      console.error("Database connection error:", err)
      toast.error("Database connection failed. Please check your Supabase configuration.")
    } finally {
      setLoading(false)
    }
  }

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.expense_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  const exportToCSV = () => {
    const csvContent = [
      ["Expense #", "Category", "Description", "Amount", "Receipt #", "Date"],
      ...filteredExpenses.map((expense) => [
        expense.expense_number,
        expense.category,
        expense.description,
        expense.amount.toFixed(2),
        expense.receipt_number || "",
        new Date(expense.date_created).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "company_expenses.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const expenseNumber = `EXP-CO-${Date.now()}`

      const { data, error } = await supabase.from("expenses").insert([
        {
          expense_number: expenseNumber,
          category: formData.category,
          amount: formData.amount,
          description: formData.description,
          receipt_number: formData.receipt_number,
          type: "company",
        },
      ])

      if (error) {
        console.error("Error creating expense:", error)
        toast.error("Failed to create expense")
      } else {
        toast.success("Company expense created successfully")
        setFormData({
          category: "",
          amount: 0,
          description: "",
          receipt_number: "",
        })
        setShowForm(false)
        fetchExpenses()
      }
    } catch (error) {
      console.error("Unexpected error:", error)
      toast.error("An unexpected error occurred")
    }
  }

  return (
    <div>
      {/* Summary Card */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card stock-summary-card in-stock">
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Total Company Expenses</h6>
                  <h2 className="mb-0">${totalExpenses.toFixed(2)}</h2>
                  <small>({filteredExpenses.length} expenses)</small>
                </div>
                <div className="icon-box">
                  <Receipt size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Expense Button */}
      <div className="mb-4">
        <button className="btn-add" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} className="me-2" />
          Add Company Expense
        </button>
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Company Expense</h5>
                <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Category</label>
                      <select
                        className="form-select"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: Number.parseFloat(e.target.value) })}
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Receipt Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.receipt_number}
                      onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>

                  <div className="modal-footer">
                    <button type="submit" className="btn btn-primary">
                      Add Expense
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters Row */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">
              <Search size={16} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-4">
          <select className="form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <button className="export-btn w-100" onClick={exportToCSV}>
            <Download size={16} className="me-1" />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Expense #</th>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Receipt #</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center">
                  Loading...
                </td>
              </tr>
            ) : filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center">
                  No company expenses found
                </td>
              </tr>
            ) : (
              filteredExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="fw-bold">{expense.expense_number}</td>
                  <td>
                    <span className="badge bg-primary">{expense.category}</span>
                  </td>
                  <td>{expense.description}</td>
                  <td>${expense.amount.toFixed(2)}</td>
                  <td>{expense.receipt_number || "-"}</td>
                  <td>{new Date(expense.date_created).toLocaleDateString()}</td>
                  <td>
                    <button className="action-btn me-1">
                      <Eye size={14} />
                    </button>
                    <button className="action-btn me-1">
                      <Edit size={14} />
                    </button>
                    <button className="action-btn">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CompanyExpensesView
