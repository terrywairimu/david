"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Plus, Search, Download, Edit, Trash2, AlertTriangle, Boxes, CheckCircle, XCircle } from "lucide-react"
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

    switch (activeFilter) {
      case "in-stock":
        matchesFilter = item.quantity > item.reorder_level
        break
      case "low-stock":
        matchesFilter = item.quantity <= item.reorder_level && item.quantity > 0
        break
      case "out-of-stock":
        matchesFilter = item.quantity === 0
        break
      default:
        matchesFilter = true
    }

    return matchesSearch && matchesFilter
  })

  const stockCounts = {
    totalItems: stockItems.length,
    inStock: stockItems.filter(item => item.quantity > item.reorder_level).length,
    lowStock: stockItems.filter(item => item.quantity <= item.reorder_level && item.quantity > 0).length,
    outOfStock: stockItems.filter(item => item.quantity === 0).length,
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { error } = await supabase.from("stock_items").insert([
        {
          name: formData.name,
          description: formData.description,
          unit_price: Number(formData.unit_price),
          quantity: Number(formData.quantity),
          reorder_level: Number(formData.reorder_level),
        },
      ])

      if (error) {
        console.error("Error adding stock item:", error)
        toast.error("Failed to add stock item")
      } else {
        toast.success("Stock item added successfully")
        setShowForm(false)
        setFormData({
          name: "",
          description: "",
          unit_price: "",
          quantity: "",
          reorder_level: "",
        })
        fetchStockItems()
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to add stock item")
    }
  }

  const exportToCSV = () => {
    const csvData = filteredItems.map(item => ({
      Name: item.name,
      Description: item.description || "",
      Unit_Price: item.unit_price,
      Quantity: item.quantity,
      Reorder_Level: item.reorder_level,
      Status: item.quantity === 0 ? "Out of Stock" : item.quantity <= item.reorder_level ? "Low Stock" : "In Stock"
    }))

    const csvString = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map(row => Object.values(row).join(","))
    ].join("\n")

    const blob = new Blob([csvString], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "stock_items.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getStockStatus = (item: StockItem) => {
    if (item.quantity === 0) {
      return <span className="badge bg-danger">Out of Stock</span>
    } else if (item.quantity <= item.reorder_level) {
      return <span className="badge bg-warning">Low Stock</span>
    } else {
      return <span className="badge bg-success">In Stock</span>
    }
  }

  return (
    <div id="stockSection" className="card">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <h2 className="mb-0">Stock Management</h2>
          <div className="d-flex gap-3">
            <button className="btn btn-add" onClick={() => setShowForm(!showForm)}>
              <Plus className="me-2" size={16} />
              Add New Item
            </button>
          </div>
        </div>
      </div>

      <div className="card-body">
        {/* Stock Summary Cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div
              className={`card stock-summary-card total-items ${activeFilter === "all" ? "active" : ""}`}
              onClick={() => setActiveFilter("all")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-white mb-1">Total Items</h6>
                    <h2 className="mb-0 text-white">{stockCounts.totalItems}</h2>
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
              className={`card stock-summary-card in-stock ${activeFilter === "in-stock" ? "active" : ""}`}
              onClick={() => setActiveFilter("in-stock")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-white mb-1">In Stock</h6>
                    <h2 className="mb-0 text-white">{stockCounts.inStock}</h2>
                  </div>
                  <div className="icon-box">
                    <CheckCircle size={24} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div
              className={`card stock-summary-card low-stock ${activeFilter === "low-stock" ? "active" : ""}`}
              onClick={() => setActiveFilter("low-stock")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-white mb-1">Low Stock</h6>
                    <h2 className="mb-0 text-white">{stockCounts.lowStock}</h2>
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
              className={`card stock-summary-card out-of-stock ${activeFilter === "out-of-stock" ? "active" : ""}`}
              onClick={() => setActiveFilter("out-of-stock")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-white mb-1">Out of Stock</h6>
                    <h2 className="mb-0 text-white">{stockCounts.outOfStock}</h2>
                  </div>
                  <div className="icon-box">
                    <XCircle size={24} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Stock Item Form */}
        {showForm && (
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Add New Stock Item</h5>
            </div>
            <div className="card-body">
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
          </div>
        )}

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
                placeholder="Search stock..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ borderRadius: "0 16px 16px 0", height: "45px" }}
              />
            </div>
          </div>
          <div className="col-md-3">
            <select
              className="form-select border-0 shadow-sm"
              style={{ borderRadius: "16px", height: "45px" }}
            >
              <option value="">All Categories</option>
              <option value="kitchen">Kitchen Cabinets</option>
              <option value="worktop">Worktops</option>
              <option value="accessories">Accessories</option>
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

        {/* Stock Table */}
        <div className="table-responsive">
          <table className="table" id="stockTable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Unit Price</th>
                <th>Quantity</th>
                <th>Reorder Level</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center">
                    No stock items found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.description || "-"}</td>
                    <td>${item.unit_price.toFixed(2)}</td>
                    <td>{item.quantity}</td>
                    <td>{item.reorder_level}</td>
                    <td>{getStockStatus(item)}</td>
                    <td>
                      <div className="d-flex gap-1">
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

export default StockPage
