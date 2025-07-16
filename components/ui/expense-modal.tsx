"use client"

import React, { useState, useEffect } from "react"
import { X, Search, Plus, Minus } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import { generateExpenseNumber } from "@/lib/workflow-utils"

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
    amount: "",
    description: "",
    receipt_number: "",
    account_debited: "",
    date_created: new Date().toISOString().split('T')[0],
    expense_type: expenseType
  })
  const [loading, setLoading] = useState(false)
  const [clientSearch, setClientSearch] = useState("")
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [filteredClients, setFilteredClients] = useState(clients)

  const categories = [
    "Travel", "Meals", "Office Supplies", "Marketing", 
    "Professional Services", "Equipment", "Utilities", 
    "Rent", "Insurance", "Maintenance", "Other"
  ]

  useEffect(() => {
    if (expense && mode !== "create") {
      setFormData({
        expense_number: expense.expense_number || "",
        client_id: expense.client_id?.toString() || "",
        category: expense.category || "",
        amount: expense.amount?.toString() || "",
        description: expense.description || "",
        receipt_number: expense.receipt_number || "",
        account_debited: expense.account_debited || "",
        date_created: expense.date_created ? new Date(expense.date_created).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        expense_type: expense.expense_type || expenseType
      })
      
      // Set client search to selected client name
      if (expense.client_id) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const expenseData = {
        ...formData,
        client_id: formData.client_id ? parseInt(formData.client_id) : null,
        amount: parseFloat(formData.amount),
        date_created: new Date(formData.date_created).toISOString(),
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
    } catch (error) {
      console.error("Error saving expense:", error)
      toast.error("Failed to save expense")
    } finally {
      setLoading(false)
    }
  }

  const handleClientSelect = (client: any) => {
    setFormData(prev => ({ ...prev, client_id: client.id.toString() }))
    setClientSearch(client.name)
    setShowClientDropdown(false)
  }

  const isReadOnly = mode === "view"

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {mode === "create" ? `Add ${expenseType === "client" ? "Client" : "Company"} Expense` : 
               mode === "edit" ? "Edit Expense" : "View Expense"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row g-3">
                {/* Expense Number */}
                <div className="col-md-6">
                  <label className="form-label">Expense Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.expense_number}
                    readOnly
                    style={{ backgroundColor: "#f8f9fa" }}
                  />
                </div>

                {/* Date */}
                <div className="col-md-6">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.date_created}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_created: e.target.value }))}
                    disabled={isReadOnly}
                    required
                  />
                </div>

                {/* Client Selection (only for client expenses) */}
                {expenseType === "client" && (
                  <div className="col-md-12">
                    <label className="form-label">Client</label>
                    <div className="position-relative">
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search client..."
                          value={clientSearch}
                          onChange={(e) => {
                            setClientSearch(e.target.value)
                            setShowClientDropdown(true)
                          }}
                          onFocus={() => setShowClientDropdown(true)}
                          disabled={isReadOnly}
                          required
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowClientDropdown(!showClientDropdown)}
                          disabled={isReadOnly}
                        >
                          <Search size={16} />
                        </button>
                      </div>
                      
                      {showClientDropdown && !isReadOnly && (
                        <div className="client-search-results">
                          {filteredClients.map(client => (
                            <div
                              key={client.id}
                              className="dropdown-item"
                              onClick={() => handleClientSelect(client)}
                              style={{ cursor: "pointer" }}
                            >
                              <div className="fw-bold">{client.name}</div>
                              <div className="text-muted small">
                                {client.phone} • {client.location}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Category */}
                <div className="col-md-6">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    disabled={isReadOnly}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div className="col-md-6">
                  <label className="form-label">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    disabled={isReadOnly}
                    required
                  />
                </div>

                {/* Receipt Number */}
                <div className="col-md-6">
                  <label className="form-label">Receipt Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.receipt_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, receipt_number: e.target.value }))}
                    disabled={isReadOnly}
                    placeholder="Enter receipt number"
                  />
                </div>

                {/* Account Debited */}
                <div className="col-md-6">
                  <label className="form-label">Account Debited</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.account_debited}
                    onChange={(e) => setFormData(prev => ({ ...prev, account_debited: e.target.value }))}
                    disabled={isReadOnly}
                    placeholder="Enter account name"
                  />
                </div>

                {/* Description */}
                <div className="col-md-12">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    disabled={isReadOnly}
                    placeholder="Enter expense description"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              {!isReadOnly && (
                <button
                  type="submit"
                  className="btn btn-add"
                  disabled={loading}
                >
                  {loading ? "Saving..." : mode === "create" ? "Save Expense" : "Update Expense"}
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                {isReadOnly ? "Close" : "Cancel"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ExpenseModal 