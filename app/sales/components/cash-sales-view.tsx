"use client"

import { useEffect, useState } from "react"
import { Plus, Edit, Trash2, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import SearchFilterRow from "@/components/ui/search-filter-row"

interface CashSale {
  id: number
  sale_number: string
  client_id: number
  sales_order_id?: number
  date_created: string
  total_amount: number
  amount_paid: number
  change_amount: number
  payment_method: "cash" | "card" | "mobile"
  notes?: string
  client?: {
    id: number
    name: string
    type: string
  }
}

const CashSalesView = () => {
  const [cashSales, setCashSales] = useState<CashSale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [clientFilter, setClientFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [clients, setClients] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    fetchCashSales()
    fetchClients()
  }, [])

  const fetchCashSales = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("cash_sales")
        .select(`
          *,
          client:registered_entities(*)
        `)
        .order("date_created", { ascending: false })

      if (error) {
        console.error("Error fetching cash sales:", error)
        toast.error("Failed to fetch cash sales")
      } else {
        setCashSales(data || [])
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

  const filteredSales = cashSales.filter((sale) => {
    const matchesSearch =
      sale.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.client?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesClient = clientFilter === "" || sale.client_id.toString() === clientFilter

    const matchesDate =
      dateFilter === "" ||
      (dateFilter === "today" && new Date(sale.date_created).toDateString() === new Date().toDateString()) ||
      (dateFilter === "week" && isThisWeek(new Date(sale.date_created))) ||
      (dateFilter === "month" && isThisMonth(new Date(sale.date_created)))

    return matchesSearch && matchesClient && matchesDate
  })

  const getPaymentMethodBadge = (method: string) => {
    const methodClasses = {
      cash: "badge bg-success",
      card: "badge bg-info",
      mobile: "badge bg-warning",
    }
    return methodClasses[method as keyof typeof methodClasses] || "badge bg-secondary"
  }

  const exportToCSV = () => {
    const csvContent = [
      ["Sale #", "Client", "Date", "Total Amount", "Amount Paid", "Change", "Payment Method"],
      ...filteredSales.map((sale) => [
        sale.sale_number,
        sale.client?.name || "",
        new Date(sale.date_created).toLocaleDateString(),
        sale.total_amount.toFixed(2),
        sale.amount_paid.toFixed(2),
        sale.change_amount.toFixed(2),
        sale.payment_method,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "cash_sales.csv"
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
      {/* Add New Cash Sale Button */}
      <div className="d-flex mb-4">
        <button className="btn btn-add">
          <Plus size={16} className="me-2" />
          New Cash Sale
        </button>
      </div>

      {/* Search and Filter Controls */}
      <SearchFilterRow
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search cash sales..."
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

      {/* Cash Sales Table */}
      <div className="table-responsive">
        <table className="table" id="cashSaleTable">
          <thead>
            <tr>
              <th>Sale #</th>
              <th>Date</th>
              <th>Client</th>
              <th>Total Amount</th>
              <th>Amount Paid</th>
              <th>Change</th>
              <th>Payment Method</th>
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
            ) : filteredSales.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center">
                  No cash sales found
                </td>
              </tr>
            ) : (
              filteredSales.map((sale) => (
                <tr key={sale.id}>
                  <td className="fw-bold">{sale.sale_number}</td>
                  <td>{new Date(sale.date_created).toLocaleDateString()}</td>
                  <td>{sale.client?.name}</td>
                  <td>${sale.total_amount.toFixed(2)}</td>
                  <td>${sale.amount_paid.toFixed(2)}</td>
                  <td>${sale.change_amount.toFixed(2)}</td>
                  <td>
                    <span className={getPaymentMethodBadge(sale.payment_method)}>
                      {sale.payment_method}
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

export default CashSalesView
