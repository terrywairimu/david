"use client"

import { useEffect, useState } from "react"
import { Edit, Trash2, Eye, Download } from "lucide-react"
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
  const [clientFilter, setClientFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [specificDate, setSpecificDate] = useState("")
  const [periodStartDate, setPeriodStartDate] = useState("")
  const [periodEndDate, setPeriodEndDate] = useState("")
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

  const filteredSales = cashSales.filter((sale) => {
    const matchesSearch =
      sale.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.client?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesClient = clientFilter === "" || sale.client_id.toString() === clientFilter

    let matchesDate = true
    if (dateFilter === "today") {
      matchesDate = new Date(sale.date_created).toDateString() === new Date().toDateString()
    } else if (dateFilter === "week") {
      matchesDate = isThisWeek(new Date(sale.date_created))
    } else if (dateFilter === "month") {
      matchesDate = isThisMonth(new Date(sale.date_created))
    } else if (dateFilter === "year") {
      matchesDate = isThisYear(new Date(sale.date_created))
    } else if (dateFilter === "specific" && specificDate) {
      matchesDate = new Date(sale.date_created).toDateString() === new Date(specificDate).toDateString()
    } else if (dateFilter === "period" && periodStartDate && periodEndDate) {
      const saleDate = new Date(sale.date_created)
      const startDate = new Date(periodStartDate)
      const endDate = new Date(periodEndDate)
      matchesDate = saleDate >= startDate && saleDate <= endDate
    }

    return matchesSearch && matchesClient && matchesDate
  })

  const exportToCSV = () => {
    const csvContent = [
      ["Receipt #", "Date", "Client", "Total Amount"],
      ...filteredSales.map((sale) => [
        sale.sale_number,
        new Date(sale.date_created).toLocaleDateString(),
        sale.client?.name || "",
        sale.total_amount.toFixed(2),
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
              placeholder="Search cash sales..."
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

      {/* Cash Sales Table */}
      <div className="table-responsive">
        <table className="table" id="cashSalesTable">
          <thead>
            <tr>
              <th>Receipt #</th>
              <th>Date</th>
              <th>Client</th>
              <th>Total Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center">
                  Loading...
                </td>
              </tr>
            ) : filteredSales.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center">
                  No cash sales found
                </td>
              </tr>
            ) : (
              filteredSales.map((sale) => (
                <tr key={sale.id}>
                  <td className="fw-bold">{sale.sale_number}</td>
                  <td>{new Date(sale.date_created).toLocaleDateString()}</td>
                  <td>
                    <div>{sale.client?.name}</div>
                  </td>
                  <td>${sale.total_amount.toFixed(2)}</td>
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
