"use client"

import React, { useState, useEffect } from "react"
import { X, Search, ChevronDown } from "lucide-react"
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

  const handleClientSelect = (client: any) => {
    setClientSearch(client.name)
    setFormData(prev => ({ ...prev, client_id: client.id.toString() }))
    setShowClientDropdown(false)
  }

  const toggleClientDropdown = () => {
    setShowClientDropdown(!showClientDropdown)
  }

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
    } catch (error: any) {
      console.error("Error saving payment:", error)
      toast.error(error.message || "Failed to save payment")
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
              {mode === "create" ? "Make Payment" : mode === "edit" ? "Edit Payment" : "View Payment"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
          <div className="modal-body pt-2">
            <form id="paymentForm" onSubmit={handleSubmit}>
              <div className="row mb-3">
                <div className="col-md-6">
                  <div className="position-relative">
                    <label className="form-label">Client</label>
                    <div className="client-search-wrapper">
                      <div className="input-group">
                        <span className="input-group-text">
                          <Search size={16} />
                        </span>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Search client..." 
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          onFocus={() => setShowClientDropdown(true)}
                          autoComplete="off" 
                          required 
                          disabled={mode === "view"}
                        />
                        <button 
                          className="btn btn-light" 
                          type="button" 
                          onClick={toggleClientDropdown}
                          disabled={mode === "view"}
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>
                      {showClientDropdown && mode !== "view" && (
                        <div className="client-search-results">
                          {filteredClients.map((client) => (
                            <div
                              key={client.id}
                              className="dropdown-item"
                              onClick={() => handleClientSelect(client)}
                            >
                              <div>
                                <strong>{client.name}</strong>
                                <div className="small text-muted">
                                  {client.phone && `${client.phone} • `}
                                  {client.location}
                                </div>
                              </div>
                            </div>
                          ))}
                          {filteredClients.length === 0 && (
                            <div className="dropdown-item">
                              <div className="text-muted">No clients found</div>
                            </div>
                          )}
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
                    required
                    disabled={mode === "view"}
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
                          required
                          disabled={mode === "view"}
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className="form-control" 
                          step="0.01"
                          value={formData.amount}
                          onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                          required
                          disabled={mode === "view"}
                        />
                      </td>
                      <td>
                        <select 
                          className="form-select"
                          value={formData.paid_to}
                          onChange={(e) => setFormData(prev => ({ ...prev, paid_to: e.target.value }))}
                          required
                          disabled={mode === "view"}
                        >
                          <option value="">Select Quotation</option>
                          {invoices.map((invoice) => (
                            <option key={invoice.id} value={invoice.invoice_number}>
                              {invoice.invoice_number}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select 
                          className="form-select"
                          value={formData.account_credited}
                          onChange={(e) => setFormData(prev => ({ ...prev, account_credited: e.target.value }))}
                          required
                          disabled={mode === "view"}
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
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            {mode !== "view" && (
              <button 
                type="submit" 
                className="btn btn-add"
                form="paymentForm"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Payment"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentModal 