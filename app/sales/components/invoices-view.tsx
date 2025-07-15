"use client"

import { useEffect, useState } from "react"
import { Plus, Edit, Trash2, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import SearchFilterRow from "@/components/ui/search-filter-row"

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

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesClient = clientFilter === "" || invoice.client_id.toString() === clientFilter

    const matchesDate =
      dateFilter === "" ||
      (dateFilter === "today" && new Date(invoice.date_created).toDateString() === new Date().toDateString()) ||
      (dateFilter === "week" && isThisWeek(new Date(invoice.date_created))) ||
      (dateFilter === "month" && isThisMonth(new Date(invoice.date_created)))

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
      ["Invoice #", "Client", "Date Created", "Due Date", "Total Amount", "Amount Paid", "Balance", "Status"],
      ...filteredInvoices.map((invoice) => [
        invoice.invoice_number,
        invoice.client?.name || "",
        new Date(invoice.date_created).toLocaleDateString(),
        new Date(invoice.due_date).toLocaleDateString(),
        invoice.total_amount.toFixed(2),
        invoice.amount_paid.toFixed(2),
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

  const dateOptions = [
    { value: "", label: "All Dates" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
  ]

  return (
    <div className="card-body">
      {/* Add New Invoice Button */}
      <div className="d-flex mb-4">
        <button className="btn btn-add">
          <Plus size={16} className="me-2" />
          Add New Invoice
        </button>
      </div>

      {/* Search and Filter Controls */}
      <SearchFilterRow
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search invoices..."
        firstFilter={{
          value: clientFilter,
          onChange: setClientFilter,
          options: clients,
        }}
        secondFilter={{
          value: dateFilter,
          onChange: setDateFilter,
          options: dateOptions,
        }}
        onExport={exportToCSV}
        exportLabel="Export"
      />

      {/* Invoices Table */}
      <div className="table-responsive">
        <table className="table" id="invoiceTable">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Client</th>
              <th>Date Created</th>
              <th>Due Date</th>
              <th>Total Amount</th>
              <th>Amount Paid</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center">
                  Loading...
                </td>
              </tr>
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center">
                  No invoices found
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="fw-bold">{invoice.invoice_number}</td>
                  <td>
                    <div>{invoice.client?.name}</div>
                    {invoice.client?.phone && (
                      <small className="text-muted">{invoice.client.phone}</small>
                    )}
                  </td>
                  <td>{new Date(invoice.date_created).toLocaleDateString()}</td>
                  <td>{new Date(invoice.due_date).toLocaleDateString()}</td>
                  <td>${invoice.total_amount.toFixed(2)}</td>
                  <td>${invoice.amount_paid.toFixed(2)}</td>
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
