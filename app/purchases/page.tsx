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
    const statusClasses = {
      pending: "badge bg-warning",
      received: "badge bg-success",
      cancelled: "badge bg-danger",
    }
    return statusClasses[status as keyof typeof statusClasses] || "badge bg-secondary"
  }

  const exportToCSV = () => {
    const csvContent = [
      ["Purchase #", "Supplier", "Date", "Total Amount", "Status"],
      ...filteredPurchases.map((purchase) => [
        purchase.purchase_number,
        purchase.supplier?.name || "",
        new Date(purchase.date_created).toLocaleDateString(),
        purchase.total_amount.toFixed(2),
        purchase.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "purchases.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div id="purchasesSection">
      {/* Header Card */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="mb-0">
            <ShoppingBasket className="me-2" size={20} />
            Purchases Management
          </h4>
          <div className="d-flex gap-2">
            <button className="btn-add">
              <Plus size={16} className="me-1" />
              New Purchase
            </button>
            <button className="export-btn" onClick={exportToCSV}>
              <Download size={16} className="me-1" />
              Export
            </button>
          </div>
        </div>
        <div className="card-body">
          {/* Filters */}
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search purchases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Purchase #</th>
                  <th>Supplier</th>
                  <th>Date</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center">
                      Loading...
                    </td>
                  </tr>
                ) : filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center">
                      No purchases found
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((purchase) => (
                    <tr key={purchase.id}>
                      <td className="fw-bold">{purchase.purchase_number}</td>
                      <td>{purchase.supplier?.name}</td>
                      <td>{new Date(purchase.date_created).toLocaleDateString()}</td>
                      <td>${purchase.total_amount.toFixed(2)}</td>
                      <td>
                        <span className={getStatusBadge(purchase.status)}>{purchase.status}</span>
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

export default PurchasesPage
