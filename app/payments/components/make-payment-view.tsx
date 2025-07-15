"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Eye } from "lucide-react"
import { supabase, type Payment, type RegisteredEntity, type Invoice } from "@/lib/supabase-client"
import { toast } from "sonner"
import SearchFilterRow from "@/components/ui/search-filter-row"

interface MakePaymentViewProps {
  clients: RegisteredEntity[]
  invoices: Invoice[]
  fetchPayments: () => void
}

const MakePaymentView = ({ clients, invoices, fetchPayments }: MakePaymentViewProps) => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [clientFilter, setClientFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [clientOptions, setClientOptions] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    fetchPaymentsList()
    setupClientOptions()
  }, [clients])

  const fetchPaymentsList = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          client:registered_entities(*),
          invoice:invoices(*)
        `)
        .order("date_created", { ascending: false })

      if (error) {
        console.error("Error fetching payments:", error)
        toast.error("Failed to fetch payments")
      } else {
        setPayments(data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const setupClientOptions = () => {
    const options = [
      { value: "", label: "All Clients" },
      ...clients.map((client) => ({
        value: client.id.toString(),
        label: client.name,
      })),
    ]
    setClientOptions(options)
  }

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.invoice?.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.payment_method.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesClient = clientFilter === "" || payment.client_id.toString() === clientFilter

    const matchesDate =
      dateFilter === "" ||
      (dateFilter === "today" && new Date(payment.date_created).toDateString() === new Date().toDateString()) ||
      (dateFilter === "week" && isThisWeek(new Date(payment.date_created))) ||
      (dateFilter === "month" && isThisMonth(new Date(payment.date_created)))

    return matchesSearch && matchesClient && matchesDate
  })

  const getPaymentMethodBadge = (method: string) => {
    const methodClasses = {
      cash: "badge bg-success",
      card: "badge bg-info",
      bank_transfer: "badge bg-primary",
      mobile: "badge bg-warning",
      cheque: "badge bg-secondary",
    }
    return methodClasses[method as keyof typeof methodClasses] || "badge bg-secondary"
  }

  const exportToCSV = () => {
    const csvContent = [
      ["Client", "Invoice", "Amount", "Payment Method", "Reference", "Date", "Status"],
      ...filteredPayments.map((payment) => [
        payment.client?.name || "",
        payment.invoice?.invoice_number || "",
        payment.amount.toFixed(2),
        payment.payment_method,
        payment.reference || "",
        new Date(payment.date_created).toLocaleDateString(),
        payment.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "payments_report.csv"
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
      {/* Add New Payment Button */}
      <div className="d-flex mb-4">
        <button className="btn btn-add">
          <Plus size={16} className="me-2" />
          Make Payment
        </button>
      </div>

      {/* Search and Filter Controls */}
      <SearchFilterRow
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search payments..."
        firstFilter={{
          value: clientFilter,
          onChange: setClientFilter,
          options: clientOptions,
        }}
        secondFilter={{
          value: dateFilter,
          onChange: setDateFilter,
          options: dateOptions,
        }}
        onExport={exportToCSV}
        exportLabel="Export"
      />

      {/* Payments Table */}
      <div className="table-responsive">
        <table className="table" id="paymentsTable">
          <thead>
            <tr>
              <th>Client</th>
              <th>Invoice</th>
              <th>Amount</th>
              <th>Payment Method</th>
              <th>Reference</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center">
                  Loading...
                </td>
              </tr>
            ) : filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center">
                  No payments found
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.client?.name}</td>
                  <td className="fw-bold">{payment.invoice?.invoice_number || "N/A"}</td>
                  <td>${payment.amount.toFixed(2)}</td>
                  <td>
                    <span className={getPaymentMethodBadge(payment.payment_method)}>
                      {payment.payment_method.replace("_", " ")}
                    </span>
                  </td>
                  <td>{payment.reference || "-"}</td>
                  <td>{new Date(payment.date_created).toLocaleDateString()}</td>
                  <td>
                    <span className="badge bg-success">
                      {payment.status}
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

export default MakePaymentView
