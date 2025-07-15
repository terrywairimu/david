"use client"

import { useEffect, useState } from "react"
import { Plus, Search, Download, Edit, Trash2, Eye, ShoppingBasket } from "lucide-react"
import { supabase, type Purchase } from "@/lib/supabase-client"
import { toast } from "sonner"

const PurchasesPage = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "received" | "cancelled">("all")

  useEffect(() => {
    fetchPurchases()
  }, [])

  const fetchPurchases = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("purchases")
        .select(`
          *,
          supplier:registered_entities(*)
        `)
        .order("date_created", { ascending: false })

      if (error) {
        console.error("Error fetching purchases:", error)
        toast.error("Failed to fetch purchases")
      } else {
        setPurchases(data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch =
      purchase.purchase_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || purchase.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="badge bg-warning">Pending</span>
      case "received":
        return <span className="badge bg-success">Received</span>
      case "cancelled":
        return <span className="badge bg-danger">Cancelled</span>
      default:
        return <span className="badge bg-secondary">Unknown</span>
    }
  }

  const exportToCSV = () => {
    const csvData = filteredPurchases.map(purchase => ({
      Purchase_Number: purchase.purchase_number,
      Supplier: purchase.supplier?.name || "N/A",
      Date: new Date(purchase.date_created).toLocaleDateString(),
      Total: purchase.total_amount,
      Status: purchase.status
    }))

    const csvString = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map(row => Object.values(row).join(","))
    ].join("\n")

    const blob = new Blob([csvString], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "purchases.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div id="purchasesSection" className="card">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <h2 className="mb-0">Purchase Management</h2>
          <button type="button" className="btn btn-add">
            <ShoppingBasket className="me-2" size={16} />
            Add New Purchase
          </button>
        </div>
      </div>
      
      <div className="card-body">
        {/* Search and Filter Controls */}
        <div className="row mb-4">
          <div className="col-md-4">
            <div className="input-group shadow-sm">
              <span className="input-group-text border-0 bg-white" style={{ borderRadius: "16px 0 0 16px", height: "45px" }}>
                <Search className="text-muted" size={16} />
              </span>
              <input
                type="text"
                className="form-control border-0"
                placeholder="Search purchases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ borderRadius: "0 16px 16px 0", height: "45px" }}
              />
            </div>
          </div>
          <div className="col-md-3">
            <select
              className="form-select border-0 shadow-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              style={{ borderRadius: "16px", height: "45px" }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="col-md-3">
            <select
              className="form-select border-0 shadow-sm"
              style={{ borderRadius: "16px", height: "45px" }}
            >
              <option value="">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <div className="col-md-2">
            <button 
              className="btn w-100 shadow-sm export-btn" 
              onClick={exportToCSV}
              style={{ borderRadius: "16px", height: "45px" }}
            >
              <Download size={16} className="me-1" />
              Export
            </button>
          </div>
        </div>

        {/* Purchases Table */}
        <div className="table-responsive">
          <table className="table" id="purchasesTable">
            <thead>
              <tr>
                <th>Purchase #</th>
                <th>Supplier</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center">
                    No purchases found.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td>{purchase.purchase_number}</td>
                    <td>{purchase.supplier?.name || "N/A"}</td>
                    <td>{new Date(purchase.date_created).toLocaleDateString()}</td>
                    <td>${purchase.total_amount.toFixed(2)}</td>
                    <td>{getStatusBadge(purchase.status)}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <button className="btn btn-sm btn-outline-primary" title="View">
                          <Eye size={14} />
                        </button>
                        <button className="btn btn-sm btn-outline-warning" title="Edit">
                          <Edit size={14} />
                        </button>
                        <button className="btn btn-sm btn-outline-danger" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default PurchasesPage
