"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Eye, Download } from "lucide-react"
import { supabase, type Expense, type RegisteredEntity } from "@/lib/supabase-client"
import { toast } from "sonner"
import SearchFilterRow from "@/components/ui/search-filter-row"
import { exportCompanyExpenses } from "@/lib/workflow-utils"
import ExpenseModal from "@/components/ui/expense-modal"

interface CompanyExpensesViewProps {
  expenses: Expense[]
  clients: RegisteredEntity[]
  onRefresh: () => void
}

const CompanyExpensesView = ({ expenses, clients, onRefresh }: CompanyExpensesViewProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [specificDate, setSpecificDate] = useState("")
  const [periodStartDate, setPeriodStartDate] = useState("")
  const [periodEndDate, setPeriodEndDate] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("create")

  const categories = [
    { value: "Travel", label: "Travel" },
    { value: "Meals", label: "Meals" },
    { value: "Office Supplies", label: "Office Supplies" },
    { value: "Marketing", label: "Marketing" },
    { value: "Professional Services", label: "Professional Services" },
    { value: "Equipment", label: "Equipment" },
    { value: "Utilities", label: "Utilities" },
    { value: "Rent", label: "Rent" },
    { value: "Insurance", label: "Insurance" },
    { value: "Maintenance", label: "Maintenance" },
    { value: "Other", label: "Other" },
  ]

  const getFilteredExpenses = () => {
    let filtered = expenses.filter(expense => expense.expense_type === "company")

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(expense => 
        expense.expense_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(expense => 
        expense.category === categoryFilter
      )
    }

    // Date filter
    if (dateFilter) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date_created)
        const expenseDay = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), expenseDate.getDate())
        
        switch (dateFilter) {
          case "today":
            return expenseDay.getTime() === today.getTime()
          case "week":
            const weekStart = new Date(today)
            weekStart.setDate(today.getDate() - today.getDay())
            return expenseDay >= weekStart && expenseDay <= today
          case "month":
            return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()
          case "year":
            return expenseDate.getFullYear() === now.getFullYear()
          case "specific":
            if (specificDate) {
              const specDate = new Date(specificDate)
              const specDay = new Date(specDate.getFullYear(), specDate.getMonth(), specDate.getDate())
              return expenseDay.getTime() === specDay.getTime()
            }
            return true
          case "period":
            if (periodStartDate && periodEndDate) {
              const startDate = new Date(periodStartDate)
              const endDate = new Date(periodEndDate)
              const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
              const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
              return expenseDay >= startDay && expenseDay <= endDay
            }
            return true
          default:
            return true
        }
      })
    }

    return filtered
  }

  const handleNewExpense = () => {
    setSelectedExpense(null)
    setModalMode("create")
    setShowExpenseModal(true)
  }

  const handleViewExpense = (expense: Expense) => {
    setSelectedExpense(expense)
    setModalMode("view")
    setShowExpenseModal(true)
  }

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense)
    setModalMode("edit")
    setShowExpenseModal(true)
  }

  const handleDeleteExpense = async (expense: Expense) => {
    if (window.confirm(`Are you sure you want to delete expense ${expense.expense_number}?`)) {
      try {
        const { error } = await supabase
          .from("expenses")
          .delete()
          .eq("id", expense.id)

        if (error) throw error

        toast.success("Expense deleted successfully")
        onRefresh()
      } catch (error) {
        console.error("Error deleting expense:", error)
        toast.error("Failed to delete expense")
      }
    }
  }

  const handleExport = () => {
    exportCompanyExpenses(getFilteredExpenses())
  }

  const handleSaveExpense = (expense: any) => {
    onRefresh()
    setShowExpenseModal(false)
  }

  const filteredExpenses = getFilteredExpenses()

  return (
    <div className="card">
      <div className="card-body">
        {/* Add New Company Expense Button */}
        <div className="d-flex mb-4">
          <button className="btn btn-add" onClick={handleNewExpense}>
            <Plus size={16} className="me-2" />
            Add New Company Expense
          </button>
        </div>

        {/* Enhanced Search and Filter Row */}
        <SearchFilterRow
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search company expenses..."
          firstFilter={{
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: categories,
            placeholder: "All Categories"
          }}
          dateFilter={{
            value: dateFilter,
            onChange: setDateFilter,
            onSpecificDateChange: setSpecificDate,
            onPeriodStartChange: setPeriodStartDate,
            onPeriodEndChange: setPeriodEndDate,
            specificDate,
            periodStartDate,
            periodEndDate
          }}
          onExport={handleExport}
          exportLabel="Export"
        />

        {/* Company Expenses Table */}
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Expense #</th>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Unit</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Amount</th>
                <th>Account Debited</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-4">
                    <div className="text-muted">
                      {searchTerm || categoryFilter || dateFilter
                        ? "No company expenses found matching your criteria"
                        : "No company expenses found"}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="fw-bold">{expense.expense_number}</td>
                    <td>{new Date(expense.date_created).toLocaleDateString()}</td>
                    <td>
                      <span className="badge bg-secondary">{expense.category}</span>
                    </td>
                    <td>{expense.description || "-"}</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td className="fw-bold text-danger">
                      KES {expense.amount.toFixed(2)}
                    </td>
                    <td>{expense.account_debited || "-"}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-sm action-btn"
                          onClick={() => handleViewExpense(expense)}
                          title="View"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="btn btn-sm action-btn"
                          onClick={() => handleEditExpense(expense)}
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="btn btn-sm action-btn"
                          onClick={() => handleDeleteExpense(expense)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Expense Summary */}
        <div className="row mt-4">
          <div className="col-md-6 offset-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <span className="fw-bold">Total Company Expenses:</span>
                  <span className="fw-bold text-danger">
                    KES {filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)}
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Count:</span>
                  <span>{filteredExpenses.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expense Modal */}
        {showExpenseModal && (
          <ExpenseModal
            expense={selectedExpense}
            mode={modalMode}
            onClose={() => setShowExpenseModal(false)}
            onSave={handleSaveExpense}
            clients={clients}
            expenseType="company"
          />
        )}
      </div>
    </div>
  )
}

export default CompanyExpensesView
