"use client"

import React, { useState, useEffect } from "react"
import { X, Search, Plus, Minus } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import { generatePaymentNumber } from "@/lib/workflow-utils"

interface PaymentModalProps {
  payment?: any
  mode: "view" | "edit" | "create"
  onClose: () => void
  onSave: (payment: any) => void
  clients: any[]
  invoices: any[]
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  payment,
  mode,
  onClose,
  onSave,
  clients,
  invoices,
}) => {
  const [formData, setFormData] = useState({
    payment_number: "",
    client_id: "",
    date_created: new Date().toISOString().split('T')[0],
    description: "",
    amount: "",
    paid_to: "",
    account_credited: "",
    status: "completed"
  })
  const [loading, setLoading] = useState(false)
  const [clientSearch, setClientSearch] = useState("")
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [filteredClients, setFilteredClients] = useState(clients)

  useEffect(() => {
    if (payment && mode !== "create") {
      setFormData({
        payment_number: payment.payment_number || "",
        client_id: payment.client_id?.toString() || "",
        date_created: payment.date_created ? new Date(payment.date_created).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        description: payment.description || "",
        amount: payment.amount?.toString() || "",
        paid_to: payment.paid_to || "",
        account_credited: payment.account_credited || "",
        status: payment.status || "completed"
      })
      
      // Set client search to selected client name
      const selectedClient = clients.find(c => c.id === payment.client_id)
      if (selectedClient) {
        setClientSearch(selectedClient.name)
      }
    } else {
      // Generate new payment number for create mode
      generatePaymentNumber().then(number => {
        setFormData(prev => ({ ...prev, payment_number: number }))
      })
    }
  }, [payment, mode, clients])

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
      const paymentData = {
        ...formData,
        client_id: formData.client_id ? parseInt(formData.client_id) : null,
        amount: parseFloat(formData.amount),
        date_created: new Date(formData.date_created).toISOString(),
      }

      if (mode === "create") {
        const { data, error } = await supabase
          .from("payments")
          .insert([paymentData])
          .select(`
            *,
            client:registered_entities(*),
            invoice:invoices(*)
          `)
          .single()

        if (error) throw error
        
        toast.success("Payment created successfully")
        onSave(data)
      } else if (mode === "edit") {
        const { data, error } = await supabase
          .from("payments")
          .update(paymentData)
          .eq("id", payment.id)
          .select(`
            *,
            client:registered_entities(*),
            invoice:invoices(*)
          `)
          .single()

        if (error) throw error
        
        toast.success("Payment updated successfully")
        onSave(data)
      }

      onClose()
    } catch (error) {
      console.error("Error saving payment:", error)
      toast.error("Failed to save payment")
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
            <h5 className="modal-title">Make Payment</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <div className="position-relative">
                    <label className="form-label">Client</label>
                    <div className="client-search-wrapper">
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="fas fa-search"></i>
                        </span>
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
                          autoComplete="off"
                        />
                        <button
                          className="btn btn-light"
                          type="button"
                          onClick={() => setShowClientDropdown(!showClientDropdown)}
                          disabled={isReadOnly}
                        >
                          <i className="fas fa-chevron-down"></i>
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
                </div>
                <div className="col-md-6">
                  <label className="form-label">Payment Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.date_created}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_created: e.target.value }))}
                    disabled={isReadOnly}
                    required
                  />
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-striped">
                  <colgroup>
                    <col style={{ width: "35%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "25%" }} />
                    <col style={{ width: "20%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Paid To</th>
                      <th>Account Credited</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          disabled={isReadOnly}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          step="0.01"
                          value={formData.amount}
                          onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                          disabled={isReadOnly}
                          required
                        />
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={formData.paid_to}
                          onChange={(e) => setFormData(prev => ({ ...prev, paid_to: e.target.value }))}
                          disabled={isReadOnly}
                          required
                        >
                          <option value="">Select Quotation</option>
                          {/* Add quotation options here */}
                        </select>
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={formData.account_credited}
                          onChange={(e) => setFormData(prev => ({ ...prev, account_credited: e.target.value }))}
                          disabled={isReadOnly}
                          required
                        >
                          <option value="">Select Account</option>
                          <option value="kim">Kim</option>
                          <option value="david">David</option>
                          <option value="bank">Bank</option>
                        </select>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
              {!isReadOnly && (
                <button
                  type="submit"
                  className="btn btn-add"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Payment"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PaymentModal 