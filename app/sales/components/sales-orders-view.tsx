"use client"

import { useEffect, useState } from "react"
import { Plus, Edit, Trash2, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import SearchFilterRow from "@/components/ui/search-filter-row"

interface SalesOrder {
  id: number
  order_number: string
  client_id: number
  quotation_id?: number
  date_created: string
  delivery_date: string
  total_amount: number
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled"
  notes?: string
  client?: {
    id: number
    name: string
    phone?: string
  }
}

const SalesOrdersView = () => {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [clientFilter, setClientFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [clients, setClients] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    fetchSalesOrders()
    fetchClients()
  }, [])

  const fetchSalesOrders = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("sales_orders")
        .select(`
          *,
          client:registered_entities(*)
        `)
        .order("date_created", { ascending: false })

      if (error) {
        console.error("Error fetching sales orders:", error)
        toast.error("Failed to fetch sales orders")
      } else {
        setSalesOrders(data || [])
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

  const filteredSalesOrders = salesOrders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesClient = clientFilter === "" || order.client_id.toString() === clientFilter

    const matchesDate =
      dateFilter === "" ||
      (dateFilter === "today" && new Date(order.date_created).toDateString() === new Date().toDateString()) ||
      (dateFilter === "week" && isThisWeek(new Date(order.date_created))) ||
      (dateFilter === "month" && isThisMonth(new Date(order.date_created)))

    return matchesSearch && matchesClient && matchesDate
  })

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: "badge bg-warning",
      confirmed: "badge bg-info",
      in_progress: "badge bg-primary",
      completed: "badge bg-success",
      cancelled: "badge bg-danger",
    }
    return statusClasses[status as keyof typeof statusClasses] || "badge bg-secondary"
  }

  const exportToCSV = () => {
    const csvContent = [
      ["Order #", "Client", "Date Created", "Delivery Date", "Total Amount", "Status"],
      ...filteredSalesOrders.map((order) => [
        order.order_number,
        order.client?.name || "",
        new Date(order.date_created).toLocaleDateString(),
        new Date(order.delivery_date).toLocaleDateString(),
        order.total_amount.toFixed(2),
        order.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sales_orders.csv"
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
      {/* Add New Sales Order Button */}
      <div className="d-flex mb-4">
        <button className="btn btn-add">
          <Plus size={16} className="me-2" />
          Add New Sales Order
        </button>
      </div>

      {/* Search and Filter Controls */}
      <SearchFilterRow
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search sales orders..."
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

      {/* Sales Orders Table */}
      <div className="table-responsive">
        <table className="table" id="salesOrderTable">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Client</th>
              <th>Date Created</th>
              <th>Delivery Date</th>
              <th>Total Amount</th>
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
            ) : filteredSalesOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center">
                  No sales orders found
                </td>
              </tr>
            ) : (
              filteredSalesOrders.map((order) => (
                <tr key={order.id}>
                  <td className="fw-bold">{order.order_number}</td>
                  <td>
                    <div>{order.client?.name}</div>
                    {order.client?.phone && (
                      <small className="text-muted">{order.client.phone}</small>
                    )}
                  </td>
                  <td>{new Date(order.date_created).toLocaleDateString()}</td>
                  <td>{new Date(order.delivery_date).toLocaleDateString()}</td>
                  <td>${order.total_amount.toFixed(2)}</td>
                  <td>
                    <span className={getStatusBadge(order.status)}>
                      {order.status.replace("_", " ")}
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

export default SalesOrdersView
