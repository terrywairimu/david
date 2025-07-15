"use client"

import { useEffect, useState } from "react"
import { Edit, Trash2, Eye, Download } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"

interface Invoice {
  id: number
  invoice_number: string
  client_id: number
  sales_order_id?: number
  date_created: string
  due_date: string
  total_amount: number
  amount_paid: number
  balance: number
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
  notes?: string
  client?: {
    id: number
    name: string
    phone?: string
  }
}

const InvoicesView = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [clientFilter, setClientFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [specificDate, setSpecificDate] = useState("")
  const [periodStartDate, setPeriodStartDate] = useState("")
  const [periodEndDate, setPeriodEndDate] = useState("")
  const [clients, setClients] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    fetchInvoices()
    fetchClients()
  }, [])

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          client:registered_entities(*)
        `)
        .order("date_created", { ascending: false })

      if (error) {
        console.error("Error fetching invoices:", error)
        toast.error("Failed to fetch invoices")
      } else {
        setInvoices(data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("registered_entities")
        .select("id, name")
        .eq("type", "client")
        .eq("status", "active")
        .order("name")

      if (error) {
        console.error("Error fetching clients:", error)
      } else {
        const clientOptions = [
          { value: "", label: "All Clients" },
          ...(data || []).map((client) => ({
            value: client.id.toString(),
            label: client.name,
          })),
        ]
        setClients(clientOptions)
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
    }
  }

  const handleDateFilterChange = (value: string) => {
    setDateFilter(value)
    if (value !== "specific") {
      setSpecificDate("")
    }
    if (value !== "period") {
      setPeriodStartDate("")
      setPeriodEndDate("")
    }
  }

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesClient = clientFilter === "" || invoice.client_id.toString() === clientFilter

    let matchesDate = true
    if (dateFilter === "today") {
      matchesDate = new Date(invoice.date_created).toDateString() === new Date().toDateString()
    } else if (dateFilter === "week") {
      matchesDate = isThisWeek(new Date(invoice.date_created))
    } else if (dateFilter === "month") {
      matchesDate = isThisMonth(new Date(invoice.date_created))
    } else if (dateFilter === "year") {
      matchesDate = isThisYear(new Date(invoice.date_created))
    } else if (dateFilter === "specific" && specificDate) {
      matchesDate = new Date(invoice.date_created).toDateString() === new Date(specificDate).toDateString()
    } else if (dateFilter === "period" && periodStartDate && periodEndDate) {
      const invoiceDate = new Date(invoice.date_created)
      const startDate = new Date(periodStartDate)
      const endDate = new Date(periodEndDate)
      matchesDate = invoiceDate >= startDate && invoiceDate <= endDate
    }

    return matchesSearch && matchesClient && matchesDate
  })

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      draft: "badge bg-secondary",
      sent: "badge bg-info",
      paid: "badge bg-success",
      overdue: "badge bg-danger",
      cancelled: "badge bg-dark",
    }
    return statusClasses[status as keyof typeof statusClasses] || "badge bg-secondary"
  }

  const exportToCSV = () => {
    const csvContent = [
      ["Invoice #", "Date", "Client", "Total Amount", "Balance", "Status"],
      ...filteredInvoices.map((invoice) => [
        invoice.invoice_number,
        new Date(invoice.date_created).toLocaleDateString(),
        invoice.client?.name || "",
        invoice.total_amount.toFixed(2),
        invoice.balance.toFixed(2),
        invoice.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "invoices.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const isThisWeek = (date: Date) => {
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 6)
    return date >= startOfWeek && date <= endOfWeek
  }

  const isThisMonth = (date: Date) => {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    const endOfMonth = new Date(startOfMonth)
    endOfMonth.setMonth(endOfMonth.getMonth() + 1)
    endOfMonth.setDate(endOfMonth.getDate() - 1)
    return date >= startOfMonth && date <= endOfMonth
  }

  const isThisYear = (date: Date) => {
    return date.getFullYear() === new Date().getFullYear()
  }

  return (
    <div className="card-body">
      {/* Search and Filter Controls */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="input-group shadow-sm">
            <span 
              className="input-group-text border-0 bg-white" 
              style={{ borderRadius: "16px 0 0 16px", height: "45px" }}
            >
              <i className="fas fa-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-0"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ borderRadius: "0 16px 16px 0", height: "45px" }}
            />
          </div>
        </div>
        
        <div className="col-md-3">
          <select
            className="form-select border-0 shadow-sm"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            style={{ borderRadius: "16px", height: "45px" }}
          >
            {clients.map((client) => (
              <option key={client.value} value={client.value}>
                {client.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="col-md-3">
          <select
            className="form-select border-0 shadow-sm"
            value={dateFilter}
            onChange={(e) => handleDateFilterChange(e.target.value)}
            style={{ borderRadius: "16px", height: "45px" }}
          >
            <option value="">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="specific">Specific Date</option>
            <option value="period">Specific Period</option>
          </select>
          
          {dateFilter === "specific" && (
            <input
              type="date"
              className="form-control border-0 shadow-sm mt-2"
              value={specificDate}
              onChange={(e) => setSpecificDate(e.target.value)}
              style={{ borderRadius: "16px", height: "45px" }}
            />
          )}
          
          {dateFilter === "period" && (
            <div style={{ display: "block" }}>
              <div className="d-flex align-items-center justify-content-between mt-2">
                <input
                  type="date"
                  className="form-control border-0 shadow-sm"
                  value={periodStartDate}
                  onChange={(e) => setPeriodStartDate(e.target.value)}
                  style={{ borderRadius: "16px", height: "45px", width: "calc(50% - 10px)", minWidth: "0" }}
                />
                <div className="mx-1 text-center" style={{ width: "20px", flexShrink: "0" }}>
                  <div className="small text-muted mb-1">to</div>
                  <i className="fas fa-arrow-right"></i>
                </div>
                <input
                  type="date"
                  className="form-control border-0 shadow-sm"
                  value={periodEndDate}
                  onChange={(e) => setPeriodEndDate(e.target.value)}
                  style={{ borderRadius: "16px", height: "45px", width: "calc(50% - 10px)", minWidth: "0" }}
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="col-md-2">
          <button
            className="btn w-100 shadow-sm export-btn"
            onClick={exportToCSV}
            style={{ borderRadius: "16px", height: "45px" }}
          >
            <Download size={16} className="me-2" />
            Export
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="table-responsive">
        <table className="table" id="invoicesTable">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Client</th>
              <th>Total Amount</th>
              <th>Balance</th>
              <th>Status</th>
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
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center">
                  No invoices found
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="fw-bold">{invoice.invoice_number}</td>
                  <td>{new Date(invoice.date_created).toLocaleDateString()}</td>
                  <td>
                    <div>{invoice.client?.name}</div>
                    {invoice.client?.phone && (
                      <small className="text-muted">{invoice.client.phone}</small>
                    )}
                  </td>
                  <td>${invoice.total_amount.toFixed(2)}</td>
                  <td>${invoice.balance.toFixed(2)}</td>
                  <td>
                    <span className={getStatusBadge(invoice.status)}>
                      {invoice.status}
                    </span>
                  </td>
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

export default InvoicesView
