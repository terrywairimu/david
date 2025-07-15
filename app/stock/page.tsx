"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Plus, Search, Download, Edit, Trash2, AlertTriangle, Boxes } from "lucide-react"
import { supabase, type StockItem } from "@/lib/supabase-client"
import { toast } from "sonner"

const StockPage = () => {
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [activeFilter, setActiveFilter] = useState<"all" | "in-stock" | "low-stock" | "out-of-stock">("all")

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    unit_price: "",
    quantity: "",
    reorder_level: "",
  })

  useEffect(() => {
    fetchStockItems()
  }, [])

  const fetchStockItems = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("stock_items").select("*").order("name")

      if (error) {
        console.error("Error fetching stock items:", error)
        toast.error("Failed to fetch stock items")
      } else {
        setStockItems(data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = stockItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())

    let matchesFilter = true
    if (activeFilter === "in-stock") {
      matchesFilter = item.quantity > item.reorder_level
    } else if (activeFilter === "low-stock") {
      matchesFilter = item.quantity > 0 && item.quantity <= item.reorder_level
    } else if (activeFilter === "out-of-stock") {
      matchesFilter = item.quantity === 0
    }

    return matchesSearch && matchesFilter
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { data, error } = await supabase.from("stock_items").insert([
        {
          ...formData,
          unit_price: Number.parseFloat(formData.unit_price),
          quantity: Number.parseInt(formData.quantity),
          reorder_level: Number.parseInt(formData.reorder_level),
        },
      ])

      if (error) {
        console.error("Error inserting stock item:", error)
        toast.error("Failed to add stock item")
      } else {
        toast.success("Stock item added successfully")
        setFormData({
          name: "",
          description: "",
          unit_price: "",
          quantity: "",
          reorder_level: "",
        })
        setShowForm(false)
        fetchStockItems()
      }
    } catch (error) {
      console.error("Unexpected error:", error)
      toast.error("An unexpected error occurred")
    }
  }

  const getStockStatus = (quantity: number, reorderLevel: number) => {
    if (quantity === 0) {
      return { status: "Out of Stock", color: "badge bg-danger" }
    } else if (quantity <= reorderLevel) {
      return { status: "Low Stock", color: "badge bg-warning" }
    } else {
      return { status: "In Stock", color: "badge bg-success" }
    }
  }

  const getStockCounts = () => {
    const totalItems = stockItems.length
    const inStock = stockItems.filter((item) => item.quantity > item.reorder_level).length
    const lowStock = stockItems.filter((item) => item.quantity > 0 && item.quantity <= item.reorder_level).length
    const outOfStock = stockItems.filter((item) => item.quantity === 0).length

    return { totalItems, inStock, lowStock, outOfStock }
  }

  const stockCounts = getStockCounts()

  const exportToCSV = () => {
    const csvContent = [
      ["Name", "Description", "Unit Price", "Quantity", "Reorder Level", "Status", "Date Added"],
      ...filteredItems.map((item) => {
        const stockStatus = getStockStatus(item.quantity, item.reorder_level)
        return [
          item.name,
          item.description || "",
          item.unit_price.toFixed(2),
          item.quantity.toString(),
          item.reorder_level.toString(),
          stockStatus.status,
          new Date(item.date_added).toLocaleDateString(),
        ]
      }),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "stock_items.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div id="stockSection">
      {/* Header Card */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="mb-0">
            <Boxes className="me-2" size={20} />
            Stock Management
          </h4>
          <div className="d-flex gap-2">
            <button className={`btn-add ${showForm ? "active" : ""}`} onClick={() => setShowForm(!showForm)}>
              <Plus size={16} className="me-1" />
              Add Stock Item
            </button>
            <button className="export-btn" onClick={exportToCSV}>
              <Download size={16} className="me-1" />
              Export
            </button>
          </div>
        </div>
        <div className="card-body">
          {/* Stock Summary Cards */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div
                className={`stock-summary-card total-items card text-white ${activeFilter === "all" ? "active" : ""}`}
                onClick={() => setActiveFilter("all")}
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6>Total Items</h6>
                      <h2>{stockCounts.totalItems}</h2>
                    </div>
                    <div className="icon-box">
                      <Boxes size={24} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div
                className={`stock-summary-card in-stock card text-white ${activeFilter === "in-stock" ? "active" : ""}`}
                onClick={() => setActiveFilter("in-stock")}
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6>In Stock</h6>
                      <h2>{stockCounts.inStock}</h2>
                    </div>
                    <div className="icon-box">
                      <Boxes size={24} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div
                className={`stock-summary-card low-stock card text-white ${activeFilter === "low-stock" ? "active" : ""}`}
                onClick={() => setActiveFilter("low-stock")}
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6>Low Stock</h6>
                      <h2>{stockCounts.lowStock}</h2>
                    </div>
                    <div className="icon-box">
                      <AlertTriangle size={24} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div
                className={`stock-summary-card out-of-stock card text-white ${activeFilter === "out-of-stock" ? "active" : ""}`}
                onClick={() => setActiveFilter("out-of-stock")}
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6>Out of Stock</h6>
                      <h2>{stockCounts.outOfStock}</h2>
                    </div>
                    <div className="icon-box">
                      <AlertTriangle size={24} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Add Form */}
          {showForm && (
            <div className="mb-4">
              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Unit Price</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Reorder Level</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="col-12">
                  <button type="submit" className="btn btn-primary">
                    Submit
                  </button>
                  <button type="button" className="btn btn-secondary ms-2" onClick={() => setShowForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search */}
          <div className="row g-3 mb-4">
            <div className="col-md-12">
              <div className="input-group">
                <span className="input-group-text">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search stock items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Unit Price</th>
                  <th>Quantity</th>
                  <th>Reorder Level</th>
                  <th>Status</th>
                  <th>Date Added</th>
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
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center">
                      No stock items found
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const stockStatus = getStockStatus(item.quantity, item.reorder_level)
                    return (
                      <tr key={item.id}>
                        <td className="fw-bold">{item.name}</td>
                        <td>{item.description || "-"}</td>
                        <td>${item.unit_price.toFixed(2)}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {item.quantity}
                            {item.quantity <= item.reorder_level && (
                              <AlertTriangle size={16} className="text-warning" />
                            )}
                          </div>
                        </td>
                        <td>{item.reorder_level}</td>
                        <td>
                          <span className={stockStatus.color}>{stockStatus.status}</span>
                        </td>
                        <td>{new Date(item.date_added).toLocaleDateString()}</td>
                        <td>
                          <button className="action-btn me-1">
                            <Edit size={14} />
                          </button>
                          <button className="action-btn">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StockPage
