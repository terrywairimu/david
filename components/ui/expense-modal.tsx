"use client"

import React, { useState, useEffect } from "react"
import { X, Search, Plus, Minus, User } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import { generateExpenseNumber } from "@/lib/workflow-utils"
import { toNairobiTime, nairobiToUTC, utcToNairobi, dateInputToDateOnly } from "@/lib/timezone"
import { Expense } from "@/lib/types"

interface ExpenseItem {
  id: number
  description: string
  quantity: number
  rate: number
  amount: number
}

interface ExpenseModalProps {
  expense?: any
  mode: "view" | "edit" | "create"
  onClose: () => void
  onSave: (expense: any) => void
  clients: any[]
  expenseType: "client" | "company"
}

const ExpenseModal = ({
  expense,
  mode,
  onClose,
  onSave,
  clients,
  expenseType,
}: ExpenseModalProps) => {
  const [formData, setFormData] = useState({
    expense_number: "",
    client_id: "",
    category: "",
    department: "",
    amount: 0,
    description: "",
    receipt_number: "",
    account_debited: "",
    date_created: new Date().toISOString().split('T')[0],
    expense_type: expenseType
  })
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([
    {
      id: 1,
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0
    }
  ])
  const [loading, setLoading] = useState(false)
  const [clientSearch, setClientSearch] = useState("")
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [filteredClients, setFilteredClients] = useState(clients)
  const [selectedQuotation, setSelectedQuotation] = useState("")
  const [clientQuotations, setClientQuotations] = useState<{quotation_number: string, grand_total?: number}[]>([])
  
  // Input handling states for quantity and rate
  const [quantityInputFocused, setQuantityInputFocused] = useState<{[key: number]: boolean}>({})
  const [rateInputFocused, setRateInputFocused] = useState<{[key: number]: boolean}>({})
  const [rawQuantityValues, setRawQuantityValues] = useState<{[key: number]: string}>({})
  const [rawRateValues, setRawRateValues] = useState<{[key: number]: string}>({})

  const clientCategories = [
    "Travel", "Meals", "Office Supplies", "Marketing", 
    "Professional Services", "Equipment", "Utilities", 
    "Rent", "Insurance", "Maintenance", "Other"
  ]

  const companyCategories = [
    { value: "utilities", label: "Utilities" },
    { value: "rent", label: "Rent" },
    { value: "supplies", label: "Office Supplies" },
    { value: "perdm", label: "Fare, meals & Accommodation" },
    { value: "salaries", label: "Salaries & Wages" },
    { value: "maintenance", label: "Repair & Maintenance" },
    { value: "fuel", label: "Fuel" },
    { value: "assets", label: "Assets" },
    { value: "other", label: "Miscellaneous" }
  ]

  const departments = [
    { value: "administration", label: "Administration" },
    { value: "operations", label: "Operations" },
    { value: "marketing", label: "Marketing" },
    { value: "finance", label: "Finance" },
    { value: "it", label: "IT" }
  ]

  useEffect(() => {
    if (expense && mode !== "create") {
      // Convert UTC from database to Nairobi time for display
      const expenseDate = new Date(expense.date_created)
      const nairobiDate = utcToNairobi(expenseDate)
      
      setFormData({
        expense_number: expense.expense_number || "",
        client_id: expense.client_id?.toString() || "",
        category: expense.category || "",
        department: expense.department || "",
        amount: expense.amount || 0,
        description: expense.description || "",
        receipt_number: expense.receipt_number || "",
        account_debited: expense.account_debited || "",
        date_created: nairobiDate.toISOString().split('T')[0],
        expense_type: expense.expense_type || expenseType
      })
      setSelectedQuotation(expense.quotation_number || "");
      
      // Load expense items from expense_items table
      loadExpenseItems(expense.id)
      
      // Set client search to selected client name
      if (expense.client_id && expenseType === "client") {
        const selectedClient = clients.find(c => c.id === expense.client_id)
        if (selectedClient) {
          setClientSearch(selectedClient.name)
        }
      }
    } else {
      // Generate new expense number for create mode
      generateExpenseNumber(expenseType).then(number => {
        setFormData(prev => ({ ...prev, expense_number: number }))
      })
    }
  }, [expense, mode, clients, expenseType])

  useEffect(() => {
    if (formData.client_id) {
      supabase
        .from("quotations")
        .select("*")
        .eq("client_id", formData.client_id)
        .order("date_created", { ascending: false })
        .then(({ data }) => setClientQuotations(data || []))
    } else {
      setClientQuotations([])
    }
  }, [formData.client_id])

  const loadExpenseItems = async (expenseId: number) => {
    try {
      const { data, error } = await supabase
        .from('expense_items')
        .select('*')
        .eq('expense_id', expenseId)
        .order('id', { ascending: true })

      if (error) throw error

      if (data && data.length > 0) {
        setExpenseItems(data.map(item => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount
        })))
      }
    } catch (error) {
      console.error('Error loading expense items:', error)
    }
  }

  useEffect(() => {
    // Filter clients based on search with debouncing
    const timeoutId = setTimeout(() => {
      const searchLower = clientSearch.toLowerCase()
      const filtered = clients.filter(client => {
        const nameLower = client.name.toLowerCase()
        const phoneLower = client.phone?.toLowerCase() || ""
        const locationLower = client.location?.toLowerCase() || ""
        return nameLower.includes(searchLower) ||
               phoneLower.includes(searchLower) ||
               locationLower.includes(searchLower)
      })
      setFilteredClients(filtered)
    }, 150) // 150ms debounce

    return () => clearTimeout(timeoutId)
  }, [clientSearch, clients])

  useEffect(() => {
    // Calculate total amount whenever expense items change
    const total = expenseItems.reduce((sum, item) => sum + item.amount, 0)
    setFormData(prev => ({ ...prev, amount: total }))
  }, [expenseItems])

  const handleClientSelect = (client: any) => {
    setClientSearch(client.name)
    setFormData(prev => ({ ...prev, client_id: client.id.toString() }))
    setShowClientDropdown(false)
  }

  const updateExpenseItem = (id: number, field: keyof ExpenseItem, value: any) => {
    setExpenseItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
        
        // Recalculate amount when quantity or rate changes
        if (field === 'quantity' || field === 'rate') {
          updatedItem.amount = updatedItem.quantity * updatedItem.rate
        }
        
        return updatedItem
      }
      return item
    }))
  }

  const addExpenseItem = () => {
    const newItem: ExpenseItem = {
      id: Date.now(),
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0
    }
    setExpenseItems(prev => [...prev, newItem])
  }

  const removeExpenseItem = (id: number) => {
    if (expenseItems.length > 1) {
      setExpenseItems(prev => prev.filter(item => item.id !== id))
      // Clean up input focus states
      setQuantityInputFocused(prev => {
        const newState = { ...prev }
        delete newState[id]
        return newState
      })
      setRateInputFocused(prev => {
        const newState = { ...prev }
        delete newState[id]
        return newState
      })
      setRawQuantityValues(prev => {
        const newState = { ...prev }
        delete newState[id]
        return newState
      })
      setRawRateValues(prev => {
        const newState = { ...prev }
        delete newState[id]
        return newState
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Convert date input to date-only value for database storage
      // This prevents the "one day less" issue by treating the date as a pure calendar date
      const dateToSave = dateInputToDateOnly(formData.date_created)
      
      const expenseData = {
        ...formData,
        client_id: formData.client_id ? parseInt(formData.client_id) : null,
        date_created: dateToSave.toISOString(),
        quotation_number: selectedQuotation || null
      }

      let savedExpense: Expense | null = null

      if (mode === "create") {
        const { data, error } = await supabase
          .from("expenses")
          .insert([expenseData])
          .select(`
            *,
            client:registered_entities(*)
          `)
          .single()

        if (error) throw error
        savedExpense = data
        
        // Save expense items
        const itemsToInsert = expenseItems.map(item => ({
          expense_id: savedExpense!.id,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount
        }))

        const { error: itemsError } = await supabase
          .from("expense_items")
          .insert(itemsToInsert)

        if (itemsError) throw itemsError
        
        toast.success("Expense created successfully")
      } else if (mode === "edit") {
        const { data, error } = await supabase
          .from("expenses")
          .update(expenseData)
          .eq("id", expense.id)
          .select(`
            *,
            client:registered_entities(*)
          `)
          .single()

        if (error) throw error
        savedExpense = data
        
        // Delete existing expense items and insert new ones
        await supabase
          .from("expense_items")
          .delete()
          .eq("expense_id", expense.id)

        const itemsToInsert = expenseItems.map(item => ({
          expense_id: expense.id,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount
        }))

        const { error: itemsError } = await supabase
          .from("expense_items")
          .insert(itemsToInsert)

        if (itemsError) throw itemsError
        
        toast.success("Expense updated successfully")
      }

      if (savedExpense) {
        onSave(savedExpense)
        onClose()
      }
    } catch (error: any) {
      console.error("Error saving expense:", error)
      toast.error(error.message || "Failed to save expense")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal fade show" style={{ display: "block", zIndex: 1055, backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content" style={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">
              {expenseType === "client" ? "Add New Client Expenses" : "Add New Company Expenses"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
          <div className="modal-body pt-2">
            <form id="expenseForm" onSubmit={handleSubmit}>
              {expenseType === "client" ? (
                <>
                  {/* Client Selection Section */}
                  <div className="mb-4">
                    <div className="row">
                      <div className="col-md-6">
                        <label className="form-label">Client</label>
                        <div className="position-relative">
                          <div className="input-group shadow-sm">
                            <input
                              type="text"
                              className="form-control border-0" 
                              placeholder="Search client..."
                              value={clientSearch}
                              onChange={(e) => setClientSearch(e.target.value)}
                              onFocus={() => setShowClientDropdown(true)}
                              style={{ borderRadius: "16px 0 0 16px", height: "45px", paddingLeft: "15px", color: "#000000" }}
                              autoComplete="off"
                              required
                              disabled={mode === "view"}
                            />
                            <button
                              className="btn btn-light border-0 dropdown-toggle" 
                              type="button"
                              onClick={() => setShowClientDropdown(!showClientDropdown)}
                              style={{ borderRadius: "0 16px 16px 0", height: "45px", background: "white" }}
                              disabled={mode === "view"}
                            >
                              <User size={16} className="text-muted" />
                            </button>
                          </div>
                          {showClientDropdown && mode !== "view" && (
                            <div 
                              className="shadow-sm"
                              style={{
                                display: "block",
                                maxHeight: "200px",
                                overflowY: "auto",
                                position: "absolute",
                                width: "100%",
                                zIndex: 1000,
                                background: "white",
                                borderRadius: "16px",
                                marginTop: "5px",
                                border: "1px solid #e0e0e0"
                              }}
                            >
                              {filteredClients.map((client) => (
                                <div
                                  key={client.id}
                                  className="dropdown-item"
                                  onClick={() => handleClientSelect(client)}
                                  style={{ cursor: "pointer", padding: "10px 15px", color: "#000000" }}
                                >
                                  <strong style={{ color: "#000000" }}>{client.name}</strong>
                                  <div className="small" style={{ color: "#6c757d" }}>
                                    {client.phone && `${client.phone} • `}
                                    {client.location}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Quotation</label>
                        <select 
                          className="form-select border-0 shadow-sm"
                          value={selectedQuotation}
                          onChange={(e) => setSelectedQuotation(e.target.value)}
                          style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                          required
                          disabled={mode === "view"}
                        >
                          <option value="">Select Quotation</option>
                          {clientQuotations.map(q => (
                            <option key={q.quotation_number} value={q.quotation_number}>
                              {q.quotation_number} (KES {q.grand_total?.toFixed(2) || '0.00'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Department and Category Selection Section */}
                  <div className="mb-4">
                    <div className="row">
                      <div className="col-md-6">
                        <label className="form-label">Department</label>
                        <select 
                          className="form-select border-0 shadow-sm"
                          value={formData.department}
                          onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                          style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                          required
                          disabled={mode === "view"}
                        >
                          <option value="">Select Department</option>
                          {departments.map(dept => (
                            <option key={dept.value} value={dept.value}>{dept.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Category</label>
                        <select
                          className="form-select border-0 shadow-sm"
                          value={formData.category}
                          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                          style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                          required
                          disabled={mode === "view"}
                        >
                          <option value="">Select Category</option>
                          {companyCategories.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Expense Details Section */}
              <div className="mb-4">
                <div className="row">
                  <div className="col-md-6">
                    <label className="form-label">Date</label>
                    <input
                      type="date" 
                      className="form-control border-0 shadow-sm"
                      value={formData.date_created}
                      onChange={(e) => setFormData(prev => ({ ...prev, date_created: e.target.value }))}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                      required
                      disabled={mode === "view"}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Account Debited</label>
                    <select 
                      className="form-select border-0 shadow-sm"
                      value={formData.account_debited}
                      onChange={(e) => setFormData(prev => ({ ...prev, account_debited: e.target.value }))}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                      required
                      disabled={mode === "view"}
                    >
                      <option value="">Select Account</option>
                      <option value="Cash">Cash</option>
                      <option value="Cooperative Bank">Cooperative Bank</option>
                      <option value="Credit">Credit</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Expense Items Section */}
              <div className="mb-4">
                <label className="form-label">Expense Items</label>
                <div id="expenseItemsContainer">
                  {expenseItems.map((item, index) => (
                    <div key={item.id} className="expense-item mb-3">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <input
                            type="text"
                            className="form-control border-0 shadow-sm"
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => updateExpenseItem(item.id, 'description', e.target.value)}
                            style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                            required
                            disabled={mode === "view"}
                          />
                        </div>
                        <div className="col-md-2">
                          <input 
                            type="number" 
                            className="form-control border-0 shadow-sm"
                            placeholder="Quantity"
                            min="1"
                            value={
                              quantityInputFocused[item.id]
                                ? (rawQuantityValues[item.id] ?? "")
                                : (item.quantity === 0 ? "" : item.quantity)
                            }
                            onChange={e => {
                              const value = e.target.value;
                              setRawQuantityValues(prev => ({ ...prev, [item.id]: value }));
                            }}
                            onFocus={e => {
                              setQuantityInputFocused(prev => ({ ...prev, [item.id]: true }));
                              setRawQuantityValues(prev => ({ ...prev, [item.id]: "" }));
                              e.target.select();
                            }}
                            onBlur={e => {
                              setQuantityInputFocused(prev => ({ ...prev, [item.id]: false }));
                              const value = e.target.value;
                              const finalValue = value === '' ? 1 : parseInt(value) || 1;
                              updateExpenseItem(item.id, 'quantity', finalValue);
                              setRawQuantityValues(prev => {
                                const copy = { ...prev };
                                delete copy[item.id];
                                return copy;
                              });
                            }}
                            style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                            required
                            disabled={mode === "view"}
                          />
                        </div>
                        <div className="col-md-2">
                          <input 
                            type="number" 
                            className="form-control border-0 shadow-sm"
                            placeholder="Rate"
                            step="0.01"
                            min="0"
                            value={
                              rateInputFocused[item.id]
                                ? (rawRateValues[item.id] ?? "")
                                : (item.rate === 0 ? "" : item.rate)
                            }
                            onChange={e => {
                              const value = e.target.value;
                              setRawRateValues(prev => ({ ...prev, [item.id]: value }));
                            }}
                            onFocus={e => {
                              setRateInputFocused(prev => ({ ...prev, [item.id]: true }));
                              setRawRateValues(prev => ({ ...prev, [item.id]: "" }));
                              e.target.select();
                            }}
                            onBlur={e => {
                              setRateInputFocused(prev => ({ ...prev, [item.id]: false }));
                              const value = e.target.value;
                              const finalValue = value === '' ? 0 : parseFloat(value) || 0;
                              updateExpenseItem(item.id, 'rate', finalValue);
                              setRawRateValues(prev => {
                                const copy = { ...prev };
                                delete copy[item.id];
                                return copy;
                              });
                            }}
                            style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                            required
                            disabled={mode === "view"}
                          />
                        </div>
                        <div className="col-md-2">
                          <div className="d-flex align-items-center h-100">
                            <span className="amount me-2">{item.amount.toFixed(2)}</span>
                            {expenseItems.length > 1 && mode !== "view" && (
                              <button 
                                type="button" 
                                className="btn btn-sm btn-danger"
                                onClick={() => removeExpenseItem(item.id)}
                                style={{ borderRadius: "12px", width: "35px", height: "35px" }}
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {mode !== "view" && (
                  <button 
                    type="button" 
                    className="btn-add mt-2"
                    onClick={addExpenseItem}
                    style={{ borderRadius: "16px", height: "45px" }}
                  >
                    <Plus size={16} className="me-2" />Add Item
                  </button>
                )}
              </div>

              {/* Total Section */}
              <div className="row mb-3">
                <div className="col-md-8"></div>
                <div className="col-md-4">
                  <label className="form-label">Total Amount</label>
                  <div className="input-group shadow-sm">
                    <span 
                      className="input-group-text border-0"
                      style={{ background: "white", borderRadius: "16px 0 0 16px", height: "45px" }}
                    >
                      KES
                    </span>
                    <input 
                      type="number" 
                      className="form-control border-0"
                      value={formData.amount.toFixed(2)}
                      readOnly
                      style={{ borderRadius: "0 16px 16px 0", height: "45px", textAlign: "right", color: "#000000" }}
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div className="modal-footer border-0">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
              style={{ borderRadius: "12px", height: "45px" }}
            >
              Close
            </button>
            {mode !== "view" && (
              <button
                type="submit"
                className="btn-add"
                form="expenseForm"
                disabled={loading}
                style={{ borderRadius: "12px", height: "45px" }}
              >
                {loading ? "Saving..." : "Save Expense"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExpenseModal 