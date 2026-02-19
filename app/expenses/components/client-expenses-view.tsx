"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Edit, Trash2, Eye, Download } from "lucide-react"
import { supabase, type Expense, type RegisteredEntity } from "@/lib/supabase-client"
import { useAuth } from "@/lib/auth-context"
import { ActionGuard } from "@/components/ActionGuard"
import { useGlobalProgress } from "@/components/GlobalProgressManager"
import { toast } from "sonner"
import SearchFilterRow from "@/components/ui/search-filter-row"
import { exportExpensesReport } from "@/lib/workflow-utils"
import ExpenseModal from "@/components/ui/expense-modal"

interface ClientExpensesViewProps {
  clients: RegisteredEntity[]
}

const ClientExpensesView = ({ clients }: ClientExpensesViewProps) => {
  const { canPerformAction } = useAuth()
  const { startDownload, completeDownload, setError } = useGlobalProgress()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [expenseItems, setExpenseItems] = useState<{[key: number]: any[]}>({}) // Store items by expense_id
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [clientFilter, setClientFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [specificDate, setSpecificDate] = useState("")
  const [periodStartDate, setPeriodStartDate] = useState("")
  const [periodEndDate, setPeriodEndDate] = useState("")
  const [clientOptions, setClientOptions] = useState<{ value: string; label: string }[]>([])
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create")

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true)
      const { data: expensesData, error } = await supabase
        .from("expenses")
        .select(`
          *,
          client:registered_entities(*),
          employee:employees(*)
        `)
        .eq("expense_type", "client")
        .order("date_created", { ascending: false })

      if (error) throw error

      setExpenses(expensesData || [])

      // Fetch expense items for all expenses
      if (expensesData && expensesData.length > 0) {
        const expenseIds = expensesData.map(e => e.id)
        const { data: itemsData, error: itemsError } = await supabase
          .from("expense_items")
          .select("*")
          .in("expense_id", expenseIds)

        if (itemsError) throw itemsError

        // Group items by expense_id
        const itemsByExpense: {[key: number]: any[]} = {}
        itemsData?.forEach(item => {
          if (!itemsByExpense[item.expense_id]) {
            itemsByExpense[item.expense_id] = []
          }
          itemsByExpense[item.expense_id].push(item)
        })
        setExpenseItems(itemsByExpense)
      }
    } catch (error) {
      console.error("Error fetching expenses:", error)
      toast.error("Failed to fetch expenses")
    } finally {
      setLoading(false)
    }
  }, [])

  const formatExpenseItems = (expenseId: number) => {
    const items = expenseItems[expenseId] || []
    if (items.length === 0) return "-"
    if (items.length === 1) {
      const item = items[0]
      return item.quantity === 1 ? `${item.description} @ ${item.rate}` : `${item.quantity} ${item.description} @ ${item.rate}`
    }
    return `${items.length} items: ${items.map(i => i.quantity === 1 ? `${i.description} @ ${i.rate}` : `${i.quantity} ${i.description} @ ${i.rate}`).join(", ")}`
  }

  const getExpenseQuantity = (expenseId: number) => {
    const items = expenseItems[expenseId] || []
    if (items.length === 0) return "-"
    if (items.length === 1) {
      return items[0].quantity || "-"
    }
    return items.reduce((sum, item) => sum + (item.quantity || 0), 0)
  }

  const getExpenseRate = (expenseId: number) => {
    const items = expenseItems[expenseId] || []
    if (items.length === 0) return "-"
    if (items.length === 1) {
      return items[0].rate || "-"
    }
    return `${items.length} rates: ${items.map(i => i.rate).join(", ")}`
  }

  useEffect(() => {
    setupClientOptions()
    fetchExpenses()
  }, [clients, fetchExpenses])

  const setupClientOptions = () => {
    const options = clients.map(client => ({
      value: client.id.toString(),
      label: client.name
    }))
    setClientOptions(options)
  }

  const getFilteredExpenses = () => {
    let filtered = expenses.filter(expense => expense.expense_type === "client")

    // Search filter - search across ALL visible columns
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(expense => {
        const dateStr = expense.date_created ? new Date(expense.date_created).toLocaleDateString().toLowerCase() : ""
        const amountStr = expense.amount != null ? String(expense.amount).toLowerCase() : ""
        const itemsStr = formatExpenseItems(expense.id).toLowerCase()
        return (
          expense.expense_number?.toLowerCase().includes(term) ||
          expense.client?.name?.toLowerCase().includes(term) ||
          expense.description?.toLowerCase().includes(term) ||
          expense.category?.toLowerCase().includes(term) ||
          expense.expense_category?.toLowerCase().includes(term) ||
          expense.employee?.name?.toLowerCase().includes(term) ||
          (expense.account_debited?.toLowerCase().includes(term)) ||
          dateStr.includes(term) ||
          amountStr.includes(term) ||
          itemsStr.includes(term)
        )
      })
    }

    // Client filter
    if (clientFilter) {
      filtered = filtered.filter(expense => 
        expense.client_id?.toString() === clientFilter
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
        fetchExpenses() // Refresh expenses after deletion
      } catch (error) {
        console.error("Error deleting expense:", error)
        toast.error("Failed to delete expense")
      }
    }
  }

  const handleExport = async (format: 'pdf' | 'csv') => {
    const filteredExpenses = getFilteredExpenses()
    // Enrich with Description from expense_items (same as UI table uses formatExpenseItems)
    const toExport = filteredExpenses.map(e => ({ ...e, description: formatExpenseItems(e.id) }))
    startDownload(`client_expenses_${new Date().toISOString().split('T')[0]}`, format)
    try {
      await exportExpensesReport(toExport, format, 'client')
      setTimeout(() => completeDownload(), 500)
    } catch (error) {
      setError('Failed to export client expenses')
      toast.error('Failed to export client expenses')
    }
  }

  const handleSaveExpense = (expense: any) => {
    fetchExpenses()
    setShowExpenseModal(false)
  }

  const filteredExpenses = getFilteredExpenses()

  return (
    <div className="card">
      <div>
        {/* Add New Client Expense Button */}
        <div className="d-flex mb-3">
          <ActionGuard actionId="add">
            <button className="btn-add" onClick={handleNewExpense}>
              <Plus size={16} className="me-2" />
              Add New Client Expense
            </button>
          </ActionGuard>
        </div>

        {/* Enhanced Search and Filter Row */}
        <SearchFilterRow
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search client expenses..."
          firstFilter={{
            value: clientFilter,
            onChange: setClientFilter,
            options: clientOptions,
            placeholder: "All Clients"
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
          onExport={canPerformAction("export") ? handleExport : undefined}
          exportLabel="Export Client Expenses"
        />

        {/* Client Expenses Table */}
        <div className="card table-section">
          <div className="w-full overflow-x-auto">
            <table className="table table-hover">
          <thead>
            <tr>
              <th>Expense #</th>
                <th>Date</th>
              <th>Client</th>
              <th>Category</th>
              <th>Employee</th>
              <th>Description</th>
              <th>Amount</th>
                <th>Account Debited</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-4">
                    <div className="text-muted">Loading client expenses...</div>
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-4">
                    <div className="text-muted">
                      {searchTerm || clientFilter || dateFilter
                        ? "No client expenses found matching your criteria"
                        : "No client expenses found"}
                    </div>
                </td>
              </tr>
            ) : (
              filteredExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="fw-bold">{expense.expense_number}</td>
                    <td>{new Date(expense.date_created).toLocaleDateString()}</td>
                    <td>{expense.client?.name || "Unknown"}</td>
                    <td>{expense.expense_category ? expense.expense_category.charAt(0).toUpperCase() + expense.expense_category.slice(1) : "-"}</td>
                    <td>{expense.employee?.name || "-"}</td>
                    <td>{formatExpenseItems(expense.id)}</td>
                    <td className={`fw-bold ${
                      expense.status === "fully_paid" ? "text-danger" : 
                      expense.status === "partially_paid" ? "text-warning" : 
                      "text-warning"
                    }`} style={{
                      color: expense.status === "fully_paid" ? "#dc3545" : 
                             expense.status === "partially_paid" ? "#6f42c1" : 
                             "#ffc107"
                    }}>
                      KES {expense.amount.toFixed(2)}
                    </td>
                    <td>{expense.account_debited || "-"}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <ActionGuard actionId="view">
                          <button
                            className="btn btn-sm action-btn"
                            onClick={() => handleViewExpense(expense)}
                            title="View"
                          >
                            <Eye size={14} />
                          </button>
                        </ActionGuard>
                        <ActionGuard actionId="edit">
                          <button
                            className="btn btn-sm action-btn"
                            onClick={() => handleEditExpense(expense)}
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                        </ActionGuard>
                        <ActionGuard actionId="delete">
                          <button
                            className="btn btn-sm action-btn"
                            onClick={() => handleDeleteExpense(expense)}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </ActionGuard>
                      </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
                </table>
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
            expenseType="client"
          />
        )}
      </div>
    </div>
  )
}

export default ClientExpensesView
