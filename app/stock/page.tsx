"use client"

import React, { useState, useEffect } from "react"
import { Plus, Search, Download, Edit, Trash2, TrendingUp, TrendingDown, Package, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import { StockItem } from "@/lib/types"

const StockPage = () => {
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [specificDate, setSpecificDate] = useState("")
  const [periodStartDate, setPeriodStartDate] = useState("")
  const [periodEndDate, setPeriodEndDate] = useState("")
  const [activeFilter, setActiveFilter] = useState<"all" | "inStock" | "lowStock" | "outOfStock">("all")
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showStockInModal, setShowStockInModal] = useState(false)
  const [showStockOutModal, setShowStockOutModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null)
  const [editItemData, setEditItemData] = useState({
    name: "",
    category: "",
    unit: "",
    minimumLevel: "",
    sellingPrice: "",
    description: ""
  })
  
  // Add new stock item form
  const [newItemData, setNewItemData] = useState({
    name: "",
    category: "",
    unit: "",
    minimumLevel: "",
    sellingPrice: "",
    description: ""
  })
  
  // Stock in form
  const [stockInData, setStockInData] = useState({
    quantityToAdd: "",
    purchasePrice: "",
    sellingPrice: "",
    batchNumber: ""
  })
  
  // Stock out form
  const [stockOutData, setStockOutData] = useState({
    quantityToRemove: "",
    reason: ""
  })

  useEffect(() => {
    fetchStockItems()
    
    // Set up real-time subscription for stock updates
    const stockSubscription = supabase
      .channel('stock-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stock_items'
      }, (payload) => {
        console.log('Stock change detected:', payload)
        fetchStockItems() // Refresh stock items when changes occur
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'purchase_items'
      }, (payload) => {
        console.log('Purchase item change detected:', payload)
        fetchStockItems() // Refresh stock items when purchase items change
      })
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(stockSubscription)
    }
  }, [])

  const fetchStockItems = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("stock_items")
        .select("*")
        .order("name")

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

  // Generate sequential item code
  const generateItemCode = () => {
    const currentYear = new Date().getFullYear().toString().slice(-2)
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0')
    
    // Get existing item codes for this month to find the next number
    const existingCodes = stockItems
      .filter(item => item.id && item.id.toString().startsWith(`ITM${currentYear}${currentMonth}`))
      .map(item => {
        const code = item.id.toString()
        const numberPart = code.slice(-3)
        return parseInt(numberPart) || 0
      })
      .sort((a, b) => b - a)
    
    const nextNumber = existingCodes.length > 0 ? existingCodes[0] + 1 : 1
    return `ITM${currentYear}${currentMonth}${nextNumber.toString().padStart(3, '0')}`
  }

  const filteredItems = stockItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = !categoryFilter || item.category === categoryFilter
    
    let matchesDate = true
    if (dateFilter === "specific" && specificDate) {
      const itemDate = new Date(item.date_added || "").toDateString()
      const filterDate = new Date(specificDate).toDateString()
      matchesDate = itemDate === filterDate
    } else if (dateFilter === "period" && periodStartDate && periodEndDate) {
      const itemDate = new Date(item.date_added || "")
      const startDate = new Date(periodStartDate)
      const endDate = new Date(periodEndDate)
      matchesDate = itemDate >= startDate && itemDate <= endDate
    }
    
    let matchesFilter = true
    switch (activeFilter) {
      case "inStock":
        matchesFilter = item.quantity > item.reorder_level
        break
      case "lowStock":
        matchesFilter = item.quantity <= item.reorder_level && item.quantity > 0
        break
      case "outOfStock":
        matchesFilter = item.quantity === 0
        break
      default:
        matchesFilter = true
    }
    
    return matchesSearch && matchesCategory && matchesDate && matchesFilter
  })

  const stockCounts = {
    totalItems: stockItems.length,
    inStock: stockItems.filter(item => item.quantity > item.reorder_level).length,
    lowStock: stockItems.filter(item => item.quantity <= item.reorder_level && item.quantity > 0).length,
    outOfStock: stockItems.filter(item => item.quantity === 0).length
  }

  const handleAddNewItem = async () => {
    if (!newItemData.name || !newItemData.category || !newItemData.unit || 
        !newItemData.minimumLevel || !newItemData.sellingPrice) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const itemCode = generateItemCode()
      
      const { error } = await supabase
        .from("stock_items")
        .insert([{
          name: newItemData.name,
          description: newItemData.description,
          unit_price: parseFloat(newItemData.sellingPrice),
          quantity: 0,
          reorder_level: parseInt(newItemData.minimumLevel),
          status: "active"
        }])

      if (error) {
        console.error("Error adding stock item:", error)
        toast.error("Failed to add stock item")
      } else {
        toast.success("Stock item added successfully")
        setShowAddModal(false)
        resetNewItemForm()
        fetchStockItems()
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to add stock item")
    }
  }

  const handleStockIn = async () => {
    if (!selectedItem || !stockInData.quantityToAdd || !stockInData.purchasePrice || !stockInData.sellingPrice) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const newQuantity = selectedItem.quantity + parseInt(stockInData.quantityToAdd)
      
      const { error } = await supabase
        .from("stock_items")
        .update({
          quantity: newQuantity,
          unit_price: parseFloat(stockInData.sellingPrice)
        })
        .eq("id", selectedItem.id)

      if (error) {
        console.error("Error updating stock:", error)
        toast.error("Failed to update stock")
      } else {
        // Record stock movement
        await supabase
          .from("stock_movements")
          .insert([{
            stock_item_id: selectedItem.id,
            movement_type: "in",
            quantity: parseInt(stockInData.quantityToAdd),
            reference_type: "manual",
            notes: `Stock in entry - Batch: ${stockInData.batchNumber || 'N/A'}`
          }])

        toast.success("Stock in entry recorded successfully")
        setShowStockInModal(false)
        resetStockInForm()
        fetchStockItems()
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to record stock in")
    }
  }

  const handleStockOut = async () => {
    if (!selectedItem || !stockOutData.quantityToRemove || !stockOutData.reason) {
      toast.error("Please fill in all required fields")
      return
    }

    const quantityToRemove = parseInt(stockOutData.quantityToRemove)
    if (quantityToRemove > selectedItem.quantity) {
      toast.error("Cannot remove more than available quantity")
      return
    }

    try {
      const newQuantity = selectedItem.quantity - quantityToRemove
      
      const { error } = await supabase
        .from("stock_items")
        .update({ quantity: newQuantity })
        .eq("id", selectedItem.id)

      if (error) {
        console.error("Error updating stock:", error)
        toast.error("Failed to update stock")
      } else {
        // Record stock movement
        await supabase
          .from("stock_movements")
          .insert([{
            stock_item_id: selectedItem.id,
            movement_type: "out",
            quantity: quantityToRemove,
            reference_type: "manual",
            notes: `Stock out entry - Reason: ${stockOutData.reason}`
          }])

        toast.success("Stock out entry recorded successfully")
        setShowStockOutModal(false)
        resetStockOutForm()
        fetchStockItems()
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to record stock out")
    }
  }

  const resetNewItemForm = () => {
    setNewItemData({
      name: "",
      category: "",
      unit: "",
      minimumLevel: "",
      sellingPrice: "",
      description: ""
    })
  }

  const resetStockInForm = () => {
    setStockInData({
      quantityToAdd: "",
      purchasePrice: "",
      sellingPrice: "",
      batchNumber: ""
    })
    setSelectedItem(null)
  }

  const resetStockOutForm = () => {
    setStockOutData({
      quantityToRemove: "",
      reason: ""
    })
    setSelectedItem(null)
  }

  const openStockInModal = (item: StockItem) => {
    setSelectedItem(item)
    setStockInData({
      ...stockInData,
      sellingPrice: item.unit_price.toString()
    })
    setShowStockInModal(true)
  }

  const openStockOutModal = (item: StockItem) => {
    setSelectedItem(item)
    setShowStockOutModal(true)
  }

  const openEditModal = (item: StockItem) => {
    setSelectedItem(item)
    setEditItemData({
      name: item.name,
      category: item.category || "",
      unit: item.unit || "",
      minimumLevel: item.reorder_level.toString(),
      sellingPrice: item.unit_price.toString(),
      description: item.description || ""
    })
    setShowEditModal(true)
  }

  const handleEditItem = async () => {
    if (!selectedItem || !editItemData.name || !editItemData.category || !editItemData.unit || 
        !editItemData.minimumLevel || !editItemData.sellingPrice) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const { error } = await supabase
        .from("stock_items")
        .update({
          name: editItemData.name,
          category: editItemData.category,
          unit: editItemData.unit,
          reorder_level: parseInt(editItemData.minimumLevel),
          unit_price: parseFloat(editItemData.sellingPrice),
          description: editItemData.description
        })
        .eq("id", selectedItem.id)

      if (error) {
        console.error("Error updating stock item:", error)
        toast.error("Failed to update stock item")
      } else {
        toast.success("Stock item updated successfully")
        setShowEditModal(false)
        fetchStockItems()
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to update stock item")
    }
  }

  const exportToCSV = () => {
    const csvData = filteredItems.map(item => ({
      "Item Code": item.id,
      "Product": item.name,
      "Category": item.category || "N/A",
      "Quantity": item.quantity,
      "Unit Price": item.unit_price,
      "Total Value": (item.quantity * item.unit_price).toFixed(2),
      "Status": item.quantity === 0 ? "Out of Stock" : 
                item.quantity <= item.reorder_level ? "Low Stock" : "In Stock"
    }))

    const csvString = [
      Object.keys(csvData[0] || {}).join(","),
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
    <div id="stockSection">
      <div className="card mb-4">
          <SectionHeader 
            title="Stock Management" 
            icon={<Package size={24} />}
          >
            <button
              className="btn btn-add"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={16} className="me-2" />
              Add New Item
            </button>
          </SectionHeader>

          <div className="card-body">
            {/* Stock Summary Cards */}
            <div className="row mb-4">
              <div className="col-md-3 mb-3">
                <div
                  className={`stock-summary-card total-items ${
                    activeFilter === "all" ? "active" : ""
                  }`}
                  onClick={() => setActiveFilter("all")}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-white mb-1">Total Items</h6>
                        <h2 className="mb-0 text-white">{stockCounts.totalItems}</h2>
                      </div>
                      <div className="icon-box">
                        <i className="fas fa-boxes"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-3 mb-3">
                <div
                  className={`stock-summary-card in-stock ${
                    activeFilter === "inStock" ? "active" : ""
                  }`}
                  onClick={() => setActiveFilter("inStock")}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-white mb-1">In Stock</h6>
                        <h2 className="mb-0 text-white">{stockCounts.inStock}</h2>
                      </div>
                      <div className="icon-box">
                        <i className="fas fa-check-circle"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-3 mb-3">
                <div
                  className={`stock-summary-card low-stock ${
                    activeFilter === "lowStock" ? "active" : ""
                  }`}
                  onClick={() => setActiveFilter("lowStock")}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-white mb-1">Low Stock</h6>
                        <h2 className="mb-0 text-white">{stockCounts.lowStock}</h2>
                      </div>
                      <div className="icon-box">
                        <i className="fas fa-exclamation-triangle"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-3 mb-3">
                <div
                  className={`stock-summary-card out-of-stock ${
                    activeFilter === "outOfStock" ? "active" : ""
                  }`}
                  onClick={() => setActiveFilter("outOfStock")}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-white mb-1">Out of Stock</h6>
                        <h2 className="mb-0 text-white">{stockCounts.outOfStock}</h2>
                      </div>
                      <div className="icon-box">
                        <i className="fas fa-times-circle"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="row mb-4">
              <div className="col-md-4">
                <div className="input-group shadow-sm">
                  <span className="input-group-text border-0 bg-white" style={{ borderRadius: "16px 0 0 16px", height: "45px" }}>
                    <Search size={16} className="text-muted" />
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
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{ borderRadius: "16px", height: "45px" }}
                >
                  <option value="">All Categories</option>
                  <option value="electronics">Electronics</option>
                  <option value="office">Office Supplies</option>
                  <option value="furniture">Furniture</option>
                  <option value="tools">Tools & Equipment</option>
                  <option value="consumables">Consumables</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="col-md-3">
                <select
                  className="form-select border-0 shadow-sm"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
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

            {/* Stock Table */}
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Item Code</th>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total Value</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-muted">
                        No stock items found.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id}>
                        <td>
                          {item.id}
                        </td>
                        <td>
                          {item.name}
                        </td>
                        <td>
                          {item.category || "N/A"}
                        </td>
                        <td>
                          {item.quantity} {item.unit || ""}
                        </td>
                        <td>
                          KES {item.unit_price.toFixed(2)}
                        </td>
                        <td>
                          KES {(item.quantity * item.unit_price).toFixed(2)}
                        </td>
                        <td>
                          {getStockStatus(item)}
                        </td>
                        <td>
                          <button
                            onClick={() => openEditModal(item)}
                            className="action-btn me-2"
                            title="Edit Stock Item"
                          >
                            <i className="fas fa-edit text-primary"></i>
                          </button>
                          <button
                            onClick={() => openStockInModal(item)}
                            className="action-btn me-2"
                            title="Stock In Entry"
                          >
                            <i className="fas fa-arrow-up text-success"></i>
                          </button>
                          <button
                            onClick={() => openStockOutModal(item)}
                            className="action-btn"
                            title="Stock Out Entry"
                          >
                            <i className="fas fa-arrow-down text-danger"></i>
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

      {/* Add New Stock Item Modal */}
      {showAddModal && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title">Add New Stock Item</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <form>
                  {/* Item Details Section */}
                  <div className="mb-4">
                    <div className="row">
                      <div className="col-md-6">
                        <label className="form-label">Item Name</label>
                        <input
                          type="text"
                          className="form-control border-0 shadow-sm"
                          placeholder="Enter item name"
                          value={newItemData.name}
                          onChange={(e) => setNewItemData({ ...newItemData, name: e.target.value })}
                          style={{ borderRadius: "16px", height: "45px" }}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Category</label>
                        <select
                          className="form-select border-0 shadow-sm"
                          value={newItemData.category}
                          onChange={(e) => setNewItemData({ ...newItemData, category: e.target.value })}
                          style={{ borderRadius: "16px", height: "45px" }}
                          required
                        >
                          <option value="">Select Category</option>
                          <option value="electronics">Electronics</option>
                          <option value="office">Office Supplies</option>
                          <option value="furniture">Furniture</option>
                          <option value="tools">Tools & Equipment</option>
                          <option value="consumables">Consumables</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="row">
                      <div className="col-md-6">
                        <label className="form-label">Unit of Measure</label>
                        <input
                          type="text"
                          className="form-control border-0 shadow-sm"
                          placeholder="e.g., pieces, boxes, kg"
                          value={newItemData.unit}
                          onChange={(e) => setNewItemData({ ...newItemData, unit: e.target.value })}
                          style={{ borderRadius: "16px", height: "45px" }}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Minimum Stock Level</label>
                        <input
                          type="number"
                          className="form-control border-0 shadow-sm"
                          placeholder="Minimum quantity"
                          value={newItemData.minimumLevel}
                          onChange={(e) => setNewItemData({ ...newItemData, minimumLevel: e.target.value })}
                          min="0"
                          style={{ borderRadius: "16px", height: "45px" }}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="row">
                      <div className="col-md-6">
                        <label className="form-label">Selling Price (KES)</label>
                        <input
                          type="number"
                          className="form-control border-0 shadow-sm"
                          placeholder="Enter selling price"
                          value={newItemData.sellingPrice}
                          onChange={(e) => setNewItemData({ ...newItemData, sellingPrice: e.target.value })}
                          min="0"
                          step="0.01"
                          style={{ borderRadius: "16px", height: "45px" }}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control border-0 shadow-sm"
                      rows={3}
                      placeholder="Enter item description"
                      value={newItemData.description}
                      onChange={(e) => setNewItemData({ ...newItemData, description: e.target.value })}
                      style={{ borderRadius: "16px" }}
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                  style={{ borderRadius: "12px", height: "45px" }}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-add"
                  onClick={handleAddNewItem}
                  style={{ borderRadius: "12px", height: "45px" }}
                >
                  Save Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Stock Item Modal */}
      {showEditModal && selectedItem && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title">Edit Stock Item</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <form>
                  <input type="hidden" value={selectedItem.id} />
                  <div className="mb-4">
                    <div className="row">
                      <div className="col-md-6">
                        <label className="form-label">Item Name</label>
                        <input
                          type="text"
                          className="form-control border-0 shadow-sm"
                          placeholder="Enter item name"
                          value={editItemData.name}
                          onChange={(e) => setEditItemData({ ...editItemData, name: e.target.value })}
                          style={{ borderRadius: "16px", height: "45px" }}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Category</label>
                        <select
                          className="form-select border-0 shadow-sm"
                          value={editItemData.category}
                          onChange={(e) => setEditItemData({ ...editItemData, category: e.target.value })}
                          style={{ borderRadius: "16px", height: "45px" }}
                          required
                        >
                          <option value="">Select Category</option>
                          <option value="electronics">Electronics</option>
                          <option value="office">Office Supplies</option>
                          <option value="furniture">Furniture</option>
                          <option value="tools">Tools & Equipment</option>
                          <option value="consumables">Consumables</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="row">
                      <div className="col-md-6">
                        <label className="form-label">Unit of Measure</label>
                        <input
                          type="text"
                          className="form-control border-0 shadow-sm"
                          placeholder="e.g., pieces, boxes, kg"
                          value={editItemData.unit}
                          onChange={(e) => setEditItemData({ ...editItemData, unit: e.target.value })}
                          style={{ borderRadius: "16px", height: "45px" }}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Minimum Stock Level</label>
                        <input
                          type="number"
                          className="form-control border-0 shadow-sm"
                          placeholder="Minimum quantity"
                          value={editItemData.minimumLevel}
                          onChange={(e) => setEditItemData({ ...editItemData, minimumLevel: e.target.value })}
                          min="0"
                          style={{ borderRadius: "16px", height: "45px" }}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="row">
                      <div className="col-md-6">
                        <label className="form-label">Selling Price (KES)</label>
                        <input
                          type="number"
                          className="form-control border-0 shadow-sm"
                          placeholder="Enter selling price"
                          value={editItemData.sellingPrice}
                          onChange={(e) => setEditItemData({ ...editItemData, sellingPrice: e.target.value })}
                          min="0"
                          step="0.01"
                          style={{ borderRadius: "16px", height: "45px" }}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control border-0 shadow-sm"
                      rows={3}
                      placeholder="Enter item description"
                      value={editItemData.description}
                      onChange={(e) => setEditItemData({ ...editItemData, description: e.target.value })}
                      style={{ borderRadius: "16px" }}
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                  style={{ borderRadius: "12px", height: "45px" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-add"
                  onClick={handleEditItem}
                  style={{ borderRadius: "12px", height: "45px" }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock In Modal */}
      {showStockInModal && selectedItem && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title">Stock In Entry</h5>
                <button type="button" className="btn-close" onClick={() => setShowStockInModal(false)} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <form>
                  <input type="hidden" value={selectedItem.id} />
                  <div className="mb-3">
                    <label className="form-label">Product Name</label>
                    <input
                      type="text"
                      className="form-control border-0 shadow-sm"
                      value={selectedItem.name}
                      readOnly
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Current Quantity</label>
                    <input
                      type="text"
                      className="form-control border-0 shadow-sm"
                      value={`${selectedItem.quantity} ${selectedItem.unit || ""}`}
                      readOnly
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Quantity to Add *</label>
                    <input
                      type="number"
                      className="form-control border-0 shadow-sm"
                      value={stockInData.quantityToAdd}
                      onChange={(e) => setStockInData({ ...stockInData, quantityToAdd: e.target.value })}
                      min="1"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Purchase Price (KES) *</label>
                    <input
                      type="number"
                      className="form-control border-0 shadow-sm"
                      value={stockInData.purchasePrice}
                      onChange={(e) => setStockInData({ ...stockInData, purchasePrice: e.target.value })}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Selling Price (KES) *</label>
                    <input
                      type="number"
                      className="form-control border-0 shadow-sm"
                      value={stockInData.sellingPrice}
                      onChange={(e) => setStockInData({ ...stockInData, sellingPrice: e.target.value })}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Batch Number</label>
                    <input
                      type="text"
                      className="form-control border-0 shadow-sm"
                      value={stockInData.batchNumber}
                      onChange={(e) => setStockInData({ ...stockInData, batchNumber: e.target.value })}
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowStockInModal(false)}
                  style={{ borderRadius: "12px", height: "45px" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-add"
                  onClick={handleStockIn}
                  style={{ borderRadius: "12px", height: "45px" }}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Out Modal */}
      {showStockOutModal && selectedItem && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title">Stock Out Entry</h5>
                <button type="button" className="btn-close" onClick={() => setShowStockOutModal(false)} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <form>
                  <input type="hidden" value={selectedItem.id} />
                  <div className="mb-3">
                    <label className="form-label">Product Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedItem.name}
                      readOnly
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Current Quantity</label>
                    <input
                      type="text"
                      className="form-control"
                      value={`${selectedItem.quantity} ${selectedItem.unit || ""}`}
                      readOnly
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Quantity to Remove</label>
                    <input
                      type="number"
                      className="form-control"
                      value={stockOutData.quantityToRemove}
                      onChange={(e) => setStockOutData({ ...stockOutData, quantityToRemove: e.target.value })}
                      min="1"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Reason</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={stockOutData.reason}
                      onChange={(e) => setStockOutData({ ...stockOutData, reason: e.target.value })}
                      required
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowStockOutModal(false)}
                  style={{ borderRadius: "12px", height: "45px" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-add"
                  onClick={handleStockOut}
                  style={{ borderRadius: "12px", height: "45px" }}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StockPage
