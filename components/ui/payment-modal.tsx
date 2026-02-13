"use client"

import React, { useState, useEffect, useRef } from "react"
import { X, Search, Plus, User } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import { paymentMonitor } from "@/lib/real-time-payment-monitor"
import { generatePaymentNumber } from "@/lib/workflow-utils"
import { toNairobiTime, nairobiToUTC, utcToNairobi, dateInputToDateOnly } from "@/lib/timezone"

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
    status: "completed",
    payment_method: "cash"
  })
  const [loading, setLoading] = useState(false)
  const [clientSearch, setClientSearch] = useState("")
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [filteredClients, setFilteredClients] = useState(clients)
  const [quotations, setQuotations] = useState<any[]>([])
  const [salesOrders, setSalesOrders] = useState<any[]>([])
  const [availableDocuments, setAvailableDocuments] = useState<any[]>([])

  const clientInputGroupRef = useRef<HTMLDivElement>(null);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (payment && mode !== "create") {
      // Convert UTC from database to Nairobi time for display
      const paymentDate = new Date(payment.date_created)
      const nairobiDate = utcToNairobi(paymentDate)
      
      setFormData({
        payment_number: payment.payment_number || "",
        client_id: payment.client_id?.toString() || "",
        date_created: nairobiDate.toISOString().split('T')[0],
        description: payment.description || "",
        amount: payment.amount?.toString() || "",
        paid_to: payment.paid_to || "",
        account_credited: payment.account_credited || "",
        status: payment.status || "completed",
        payment_method: payment.payment_method || "cash"
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

  useEffect(() => {
    // Load quotations and sales orders for the selected client
    if (formData.client_id) {
      loadClientDocuments(parseInt(formData.client_id))
    }
  }, [formData.client_id])

  useEffect(() => {
    if (!showClientDropdown) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        clientInputGroupRef.current &&
        !clientInputGroupRef.current.contains(event.target as Node) &&
        clientDropdownRef.current &&
        !clientDropdownRef.current.contains(event.target as Node)
      ) {
        setShowClientDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showClientDropdown]);

  const loadClientDocuments = async (clientId: number) => {
    try {
      // Load quotations
      const { data: quotationsData } = await supabase
        .from("quotations")
        .select("*")
        .eq("client_id", clientId)
        .order("date_created", { ascending: false })

      // Load sales orders
      const { data: salesOrdersData } = await supabase
        .from("sales_orders")
        .select("*")
        .eq("client_id", clientId)
        .order("date_created", { ascending: false })

      // Load invoices
      const { data: invoicesData } = await supabase
        .from("invoices")
        .select("*")
        .eq("client_id", clientId)
        .order("date_created", { ascending: false })

      // Combine all documents for paid_to dropdown
      const allDocuments = [
        ...(quotationsData || []).map(q => ({ 
          id: q.quotation_number, 
          type: 'quotation', 
          number: q.quotation_number,
          amount: q.grand_total,
          date: q.date_created 
        })),
        ...(salesOrdersData || []).map(so => ({ 
          id: so.order_number, 
          type: 'sales_order', 
          number: so.order_number,
          amount: so.grand_total,
          date: so.date_created 
        })),
        ...(invoicesData || []).map(inv => ({ 
          id: inv.invoice_number, 
          type: 'invoice', 
          number: inv.invoice_number,
          amount: inv.grand_total,
          date: inv.date_created 
        }))
      ]

      setAvailableDocuments(allDocuments)
    } catch (error) {
      console.error("Error loading client documents:", error)
    }
  }

  const handleClientSelect = (client: any) => {
    setClientSearch(client.name)
    setFormData(prev => ({ ...prev, client_id: client.id.toString() }))
    setShowClientDropdown(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Convert date input to date-only value for database storage
      // This prevents the "one day less" issue by treating the date as a pure calendar date
      const dateToSave = dateInputToDateOnly(formData.date_created)
      
      const paymentData = {
        payment_number: formData.payment_number,
        client_id: formData.client_id ? parseInt(formData.client_id) : null,
        description: formData.description,
        amount: parseFloat(formData.amount),
        paid_to: formData.paid_to || null,
        account_credited: formData.account_credited,
        status: formData.status,
        payment_method: formData.payment_method,
        date_created: dateToSave.toISOString(),
        date_paid: dateToSave.toISOString()
      }

      if (mode === "create") {
        const { data, error } = await supabase
          .from("payments")
          .insert([paymentData])
          .select(`
            *,
            client:registered_entities(*)
          `)
          .single()

        if (error) throw error
        
        // Update related documents if paid_to is specified
        if (paymentData.paid_to) {
          await updateRelatedDocuments(paymentData)
          // Trigger real-time monitoring for automatic document conversion
          setTimeout(() => {
            paymentMonitor.processNewPayment(paymentData)
          }, 1000)
        }
        
        toast.success("Payment created successfully")
        onSave(data)
      } else if (mode === "edit") {
        const { data, error } = await supabase
          .from("payments")
          .update(paymentData)
          .eq("id", payment.id)
          .select(`
            *,
            client:registered_entities(*)
          `)
          .single()

        if (error) throw error
        
        // Update related documents if paid_to is specified
        if (paymentData.paid_to) {
          await updateRelatedDocuments(paymentData)
          // Trigger real-time monitoring for automatic document conversion
          setTimeout(() => {
            paymentMonitor.processPaymentUpdate(paymentData)
          }, 1000)
        }
        
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

  const updateRelatedDocuments = async (paymentData: any) => {
    try {
      const paidTo = paymentData.paid_to
      const amount = paymentData.amount

      // Update quotations
      const { data: quotation } = await supabase
        .from("quotations")
        .select("*")
        .eq("quotation_number", paidTo)
        .single()

      if (quotation) {
        const totalPaid = (quotation.total_paid || 0) + amount
        const balance = quotation.grand_total - totalPaid
        
        await supabase
          .from("quotations")
          .update({
            total_paid: totalPaid,
            balance: balance,
            status: balance <= 0 ? 'paid' : 'pending'
          })
          .eq("id", quotation.id)
      }

      // Update sales orders
      const { data: salesOrder } = await supabase
        .from("sales_orders")
        .select("*")
        .eq("order_number", paidTo)
        .single()

      if (salesOrder) {
        const totalPaid = (salesOrder.total_paid || 0) + amount
        const balance = salesOrder.grand_total - totalPaid
        
        await supabase
          .from("sales_orders")
          .update({
            total_paid: totalPaid,
            balance: balance,
            status: balance <= 0 ? 'paid' : 'pending'
          })
          .eq("id", salesOrder.id)
      }

      // Update invoices
      const { data: invoice } = await supabase
        .from("invoices")
        .select("*")
        .eq("invoice_number", paidTo)
        .single()

      if (invoice) {
        const totalPaid = (invoice.total_paid || 0) + amount
        const balance = invoice.grand_total - totalPaid
        
        await supabase
          .from("invoices")
          .update({
            total_paid: totalPaid,
            balance: balance,
            status: balance <= 0 ? 'paid' : 'pending'
          })
          .eq("id", invoice.id)
      }
    } catch (error) {
      console.error("Error updating related documents:", error)
    }
  }

  return (
    <div className="modal fade show" style={{ display: "block", zIndex: 1055, backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content" style={{ borderRadius: "20px", border: "none", boxShadow: "0 20px 60px rgba(0,0,0,0.1)" }}>
          <div className="modal-header border-0" style={{ padding: "24px 32px 16px" }}>
            <h5 className="modal-title fw-bold">
              {mode === "create" ? "Make Payment" : mode === "edit" ? "Edit Payment" : "View Payment"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
          <div className="modal-body" style={{ 
            padding: "0 32px 24px", 
            maxHeight: "70vh", 
            overflowY: "auto" 
          }}>
            <form id="paymentForm" onSubmit={handleSubmit}>
              {/* Client Selection Section */}
              <div className="mb-4">
                <div className="row">
                  <div className="col-md-6">
                    <label className="form-label">Client</label>
                    <div className="position-relative">
                      <div className="input-group shadow-sm" ref={clientInputGroupRef}>
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
                          ref={clientDropdownRef}
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
                    <label className="form-label">Payment Date</label>
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
                </div>
              </div>

              {/* Payment Details Section */}
              <div className="mb-4">
                <div className="row">
                  <div className="col-md-6">
                    <label className="form-label">Description</label>
                                            <input 
                          type="text" 
                          className="form-control border-0 shadow-sm"
                          placeholder="Enter payment description"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                          required
                          disabled={mode === "view"}
                        />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Amount</label>
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
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        value={formData.amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                        style={{ borderRadius: "0 16px 16px 0", height: "45px", color: "#000000" }}
                        required
                        disabled={mode === "view"}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quotation and Account Section */}
              <div className="mb-4">
                <div className="row">
                  <div className="col-md-6">
                    <label className="form-label">Paid To (Optional)</label>
                                          <select 
                        className="form-select border-0 shadow-sm"
                        value={formData.paid_to}
                        onChange={(e) => setFormData(prev => ({ ...prev, paid_to: e.target.value }))}
                        style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                        disabled={mode === "view"}
                      >
                      <option value="">Select Quotation/Order/Invoice (Optional)</option>
                      {availableDocuments.map((doc) => (
                        <option key={doc.id} value={doc.number}>
                          {doc.type === 'quotation' ? 'QT' : doc.type === 'sales_order' ? 'SO' : 'INV'} - {doc.number} (KES {doc.amount?.toFixed(2) || '0.00'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Account Credited</label>
                    <select 
                      className="form-select border-0 shadow-sm"
                      value={formData.account_credited}
                      onChange={(e) => setFormData(prev => ({ ...prev, account_credited: e.target.value }))}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                      required
                      disabled={mode === "view"}
                    >
                      <option value="">Select Account</option>
                      <option value="Cash">Cash</option>
                      <option value="Cooperative Bank">Cooperative Bank</option>
                      <option value="Credit">Credit</option>
                      <option value="Cheque">Cheque</option>
                      <option value="M-Pesa">M-Pesa</option>
                      <option value="Petty Cash">Petty Cash</option>
                    </select>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div className="modal-footer border-0" style={{ padding: "16px 24px 16px" }}>
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
                form="paymentForm"
                disabled={loading}
                style={{ borderRadius: "12px", height: "45px" }}
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