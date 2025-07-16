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
    invoice_id: "",
    amount: "",
    payment_method: "cash",
    reference: "",
    description: "",
    paid_to: "",
    account_credited: "",
    date_created: new Date().toISOString().split('T')[0],
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
        invoice_id: payment.invoice_id?.toString() || "",
        amount: payment.amount?.toString() || "",
        payment_method: payment.payment_method || "cash",
        reference: payment.reference || "",
        description: payment.description || "",
        paid_to: payment.paid_to || "",
        account_credited: payment.account_credited || "",
        date_created: payment.date_created ? new Date(payment.date_created).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
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
        invoice_id: formData.invoice_id ? parseInt(formData.invoice_id) : null,
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
    
    // Filter invoices for selected client
    const clientInvoices = invoices.filter(inv => inv.client_id === client.id)
    if (clientInvoices.length > 0) {
      setFormData(prev => ({ ...prev, invoice_id: clientInvoices[0].id.toString() }))
    }
  }

  const isReadOnly = mode === "view"

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {mode === "create" ? "Make Payment" : mode === "edit" ? "Edit Payment" : "View Payment"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row g-3">
                {/* Payment Number */}
                <div className="col-md-6">
                  <label className="form-label">Payment Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.payment_number}
                    readOnly
                    style={{ backgroundColor: "#f8f9fa" }}
                  />
                </div>

                {/* Date */}
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

                {/* Client Selection */}
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

                {/* Payment Method */}
                <div className="col-md-6">
                  <label className="form-label">Payment Method</label>
                  <select
                    className="form-select"
                    value={formData.payment_method}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                    disabled={isReadOnly}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile">Mobile Payment</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                {/* Paid To */}
                <div className="col-md-6">
                  <label className="form-label">Paid To</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.paid_to}
                    onChange={(e) => setFormData(prev => ({ ...prev, paid_to: e.target.value }))}
                    disabled={isReadOnly}
                    placeholder="Enter recipient name"
                  />
                </div>

                {/* Account Credited */}
                <div className="col-md-6">
                  <label className="form-label">Account Credited</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.account_credited}
                    onChange={(e) => setFormData(prev => ({ ...prev, account_credited: e.target.value }))}
                    disabled={isReadOnly}
                    placeholder="Enter account name"
                  />
                </div>

                {/* Reference */}
                <div className="col-md-6">
                  <label className="form-label">Reference</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.reference}
                    onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                    disabled={isReadOnly}
                    placeholder="Enter reference number"
                  />
                </div>

                {/* Status */}
                <div className="col-md-6">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    disabled={isReadOnly}
                  >
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
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
                    placeholder="Enter payment description"
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
                  {loading ? "Saving..." : mode === "create" ? "Save Payment" : "Update Payment"}
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

export default PaymentModal 