"use client"

import React, { useState, useEffect } from "react"
import { X, Search, Plus, Minus, User } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import { generateExpenseNumber } from "@/lib/workflow-utils"

interface ExpenseItem {
  id: string
  description: string
  unit: string
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

const ExpenseModal: React.FC<ExpenseModalProps> = ({
  expense,
  mode,
  onClose,
  onSave,
  clients,
  expenseType,
}) => {
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
      id: "1",
      description: "",
      unit: "",
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
      setFormData({
        expense_number: expense.expense_number || "",
        client_id: expense.client_id?.toString() || "",
        category: expense.category || "",
        department: expense.department || "",
        amount: expense.amount || 0,
        description: expense.description || "",
        receipt_number: expense.receipt_number || "",
        account_debited: expense.account_debited || "",
        date_created: expense.date_created ? new Date(expense.date_created).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        expense_type: expense.expense_type || expenseType
      })
      
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
    // Filter clients based on search
    const filtered = clients.filter(client =>
      client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      client.phone?.toLowerCase().includes(clientSearch.toLowerCase()) ||
      client.location?.toLowerCase().includes(clientSearch.toLowerCase())
    )
    setFilteredClients(filtered)
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

  const updateExpenseItem = (id: string, field: keyof ExpenseItem, value: any) => {
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
      id: Date.now().toString(),
      description: "",
      unit: "",
      quantity: 1,
      rate: 0,
      amount: 0
    }
    setExpenseItems(prev => [...prev, newItem])
  }

  const removeExpenseItem = (id: string) => {
    if (expenseItems.length > 1) {
      setExpenseItems(prev => prev.filter(item => item.id !== id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const expenseData = {
        ...formData,
        client_id: formData.client_id ? parseInt(formData.client_id) : null,
        date_created: new Date(formData.date_created).toISOString(),
        // Store expense items as JSON in description field for now
        description: JSON.stringify(expenseItems)
      }

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
        
        toast.success("Expense created successfully")
        onSave(data)
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
        
        toast.success("Expense updated successfully")
        onSave(data)
      }

      onClose()
    } catch (error: any) {
      console.error("Error saving expense:", error)
      toast.error(error.message || "Failed to save expense")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {expenseType === "client" ? "Add New Client Expenses" : "Add New Company Expenses"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
          <div className="modal-body">
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
                              style={{ borderRadius: "16px 0 0 16px", height: "45px", paddingLeft: "15px" }}
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
                                  style={{ cursor: "pointer", padding: "10px 15px" }}
                                >
                                  <strong>{client.name}</strong>
                                  <div className="small text-muted">
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
                          style={{ borderRadius: "16px", height: "45px" }}
                          required
                          disabled={mode === "view"}
                        >
                          <option value="">Select Quotation</option>
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
                          style={{ borderRadius: "16px", height: "45px" }}
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
                          style={{ borderRadius: "16px", height: "45px" }}
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
                      style={{ borderRadius: "16px", height: "45px" }}
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
                      style={{ borderRadius: "16px", height: "45px" }}
                      required
                      disabled={mode === "view"}
                    >
                      <option value="">Select Account</option>
                      <option value="David">David</option>
                      <option value="Kim">Kim</option>
                      <option value="bank">Bank</option>
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
                        <div className="col-md-4">
                          <input 
                            type="text" 
                            className="form-control border-0 shadow-sm"
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => updateExpenseItem(item.id, 'description', e.target.value)}
                            style={{ borderRadius: "16px", height: "45px" }}
                            required
                            disabled={mode === "view"}
                          />
                        </div>
                        <div className="col-md-2">
                          <input 
                            type="text" 
                            className="form-control border-0 shadow-sm"
                            placeholder="Unit"
                            value={item.unit}
                            onChange={(e) => updateExpenseItem(item.id, 'unit', e.target.value)}
                            style={{ borderRadius: "16px", height: "45px" }}
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
                            value={item.quantity}
                            onChange={(e) => updateExpenseItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            style={{ borderRadius: "16px", height: "45px" }}
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
                            value={item.rate}
                            onChange={(e) => updateExpenseItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                            style={{ borderRadius: "16px", height: "45px" }}
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
                    className="btn btn-add mt-2"
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
                      style={{ borderRadius: "0 16px 16px 0", height: "45px", textAlign: "right" }}
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
                className="btn btn-add"
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