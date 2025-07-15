"use client"

import { useEffect, useState } from "react"
import { Plus, Search, Download, Edit, Trash2, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"

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
  const [clientFilter, setClientFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")

  useEffect(() => {
    fetchCashSales()
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

  const filteredSales = cashSales.filter((sale) => {
    const matchesSearch =
      sale.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.client?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesClient = clientFilter === "all" || sale.client_id.toString() === clientFilter

    const matchesDate =
      dateFilter === "all" ||
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

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-white">
          <Plus size={20} className="me-2" />
          Cash Sales
        </h3>
        <div className="d-flex gap-2">
          <button className="btn-add">
            <Plus size={16} className="me-2" />
            New Cash Sale
          </button>
          <button className="export-btn" onClick={exportToCSV}>
            <Download size={16} className="me-2" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="input-group">
            <span className="input-group-text">
              <Search size={16} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search cash sales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-3">
          <select className="form-select" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
            <option value="all">All Clients</option>
            {/* Additional client options can be added here */}
          </select>
        </div>
        <div className="col-md-3">
          <select className="form-select" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
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
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table">
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
                        <span className={getPaymentMethodBadge(sale.payment_method)}>{sale.payment_method}</span>
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
      </div>
    </div>
  )
}

export default CashSalesView
