"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Plus, Search, Download, Edit, Trash2, Eye } from "lucide-react"
import { supabase, type RegisteredEntity } from "@/lib/supabase-client"
import { toast } from "sonner"

interface Payment {
  id: number
  payment_number: string
  client_id: number
  invoice_id?: number
  amount: number
  payment_method: "cash" | "card" | "bank_transfer" | "mobile"
  reference_number?: string
  notes?: string
  date_created: string
  client?: RegisteredEntity
}

interface Invoice {
  id: number
  invoice_number: string
  client_id: number
  total_amount: number
  paid_amount: number
  status: string
}

const MakePaymentView = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [clients, setClients] = useState<RegisteredEntity[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    client_id: "",
    invoice_id: "",
    amount: 0,
    payment_method: "cash" as "cash" | "card" | "bank_transfer" | "mobile",
    reference_number: "",
    notes: "",
  })

  useEffect(() => {
    fetchPayments()
    fetchClients()
    fetchInvoices()
  }, [])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      // Check if Supabase is properly configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl || supabaseUrl === "https://placeholder.supabase.co") {
        console.warn("Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.")
        toast.error("Database not configured. Please set up Supabase credentials.")
        setPayments([])
        return
      }

      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          client:registered_entities(*)
        `)
        .order("date_created", { ascending: false })

      if (error) {
        console.error("Error fetching payments:", error)
        toast.error("Failed to fetch payments. Please check your database connection.")
      } else {
        setPayments(data || [])
      }
    } catch (err) {
      console.error("Database connection error:", err)
      toast.error("Database connection failed. Please check your Supabase configuration.")
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase.from("registered_entities").select("*").eq("type", "client").order("name")

      if (error) {
        console.error("Error fetching clients:", error)
      } else {
        setClients(data || [])
      }
    } catch (error) {
      console.error("Unexpected error:", error)
    }
  }

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase.from("invoices").select("*").order("invoice_number")

      if (error) {
        console.error("Error fetching invoices:", error)
      } else {
        setInvoices(data || [])
      }
    } catch (error) {
      console.error("Unexpected error:", error)
    }
  }

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.payment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.client?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPaymentMethod = paymentMethodFilter === "all" || payment.payment_method === paymentMethodFilter

    return matchesSearch && matchesPaymentMethod
  })

  const getPaymentMethodBadge = (method: string) => {
    const methodClasses = {
      cash: "badge bg-success",
      card: "badge bg-info",
      bank_transfer: "badge bg-primary",
      mobile: "badge bg-warning",
    }
    return methodClasses[method as keyof typeof methodClasses] || "badge bg-secondary"
  }

  const exportToCSV = () => {
    const csvContent = [
      ["Payment #", "Client", "Date", "Amount", "Payment Method", "Reference"],
      ...filteredPayments.map((payment) => [
        payment.payment_number,
        payment.client?.name || "",
        new Date(payment.date_created).toLocaleDateString(),
        payment.amount.toFixed(2),
        payment.payment_method,
        payment.reference_number || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "payments.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const paymentNumber = `PAY-${Date.now()}`

      const { data, error } = await supabase.from("payments").insert([
        {
          payment_number: paymentNumber,
          client_id: Number.parseInt(formData.client_id),
          invoice_id: formData.invoice_id ? Number.parseInt(formData.invoice_id) : null,
          amount: formData.amount,
          payment_method: formData.payment_method,
          reference_number: formData.reference_number,
          notes: formData.notes,
        },
      ])

      if (error) {
        console.error("Error creating payment:", error)
        toast.error("Failed to create payment")
      } else {
        toast.success("Payment created successfully")
        setFormData({
          client_id: "",
          invoice_id: "",
          amount: 0,
          payment_method: "cash",
          reference_number: "",
          notes: "",
        })
        setShowForm(false)
        fetchPayments()
      }
    } catch (error) {
      console.error("Unexpected error:", error)
      toast.error("An unexpected error occurred")
    }
  }

  const clientInvoices = invoices.filter((invoice) =>
    formData.client_id ? invoice.client_id.toString() === formData.client_id : false,
  )

  return (
    <div>
      {/* Add New Payment Button */}
      <div className="mb-4">
        <button className="btn-add" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} className="me-2" />
          Add New Payment
        </button>
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Make New Payment</h5>
                <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Client</label>
                      <select
                        className="form-select"
                        value={formData.client_id}
                        onChange={(e) => setFormData({ ...formData, client_id: e.target.value, invoice_id: "" })}
                        required
                      >
                        <option value="">Select Client</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Invoice (Optional)</label>
                      <select
                        className="form-select"
                        value={formData.invoice_id}
                        onChange={(e) => setFormData({ ...formData, invoice_id: e.target.value })}
                      >
                        <option value="">Select Invoice</option>
                        {clientInvoices.map((invoice) => (
                          <option key={invoice.id} value={invoice.id}>
                            {invoice.invoice_number} - ${(invoice.total_amount - invoice.paid_amount).toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
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
                    <div className="col-md-6">
                      <label className="form-label">Payment Method</label>
                      <select
                        className="form-select"
                        value={formData.payment_method}
                        onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as any })}
                        required
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="mobile">Mobile Payment</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Reference Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.reference_number}
                      onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>

                  <div className="modal-footer">
                    <button type="submit" className="btn btn-primary">
                      Create Payment
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
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-4">
          <select
            className="form-select"
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
          >
            <option value="all">All Payment Methods</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="mobile">Mobile Payment</option>
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
              <th>Payment #</th>
              <th>Date</th>
              <th>Client</th>
              <th>Amount</th>
              <th>Payment Method</th>
              <th>Reference</th>
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
            ) : filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center">
                  No payments found
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td className="fw-bold">{payment.payment_number}</td>
                  <td>{new Date(payment.date_created).toLocaleDateString()}</td>
                  <td>{payment.client?.name}</td>
                  <td>${payment.amount.toFixed(2)}</td>
                  <td>
                    <span className={getPaymentMethodBadge(payment.payment_method)}>{payment.payment_method}</span>
                  </td>
                  <td>{payment.reference_number || "-"}</td>
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

export default MakePaymentView
