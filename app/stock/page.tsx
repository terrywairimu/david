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
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null)
  
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
      return <span className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-full">Out of Stock</span>
    } else if (item.quantity <= item.reorder_level) {
      return <span className="px-2 py-1 text-xs font-medium text-white bg-yellow-500 rounded-full">Low Stock</span>
    } else {
      return <span className="px-2 py-1 text-xs font-medium text-white bg-green-500 rounded-full">In Stock</span>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="card">
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div
                className={`card cursor-pointer transition-all duration-300 hover:scale-105 ${
                  activeFilter === "all" ? "ring-4 ring-blue-300" : ""
                }`}
                onClick={() => setActiveFilter("all")}
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: "20px",
                  border: "none"
                }}
              >
                <div className="card-body p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h6 className="text-white mb-1 text-sm font-medium">Total Items</h6>
                      <h2 className="text-white mb-0 text-3xl font-bold">{stockCounts.totalItems}</h2>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full">
                      <Package size={24} className="text-white" />
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`card cursor-pointer transition-all duration-300 hover:scale-105 ${
                  activeFilter === "inStock" ? "ring-4 ring-green-300" : ""
                }`}
                onClick={() => setActiveFilter("inStock")}
                style={{
                  background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                  borderRadius: "20px",
                  border: "none"
                }}
              >
                <div className="card-body p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h6 className="text-white mb-1 text-sm font-medium">In Stock</h6>
                      <h2 className="text-white mb-0 text-3xl font-bold">{stockCounts.inStock}</h2>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full">
                      <CheckCircle size={24} className="text-white" />
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`card cursor-pointer transition-all duration-300 hover:scale-105 ${
                  activeFilter === "lowStock" ? "ring-4 ring-yellow-300" : ""
                }`}
                onClick={() => setActiveFilter("lowStock")}
                style={{
                  background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                  borderRadius: "20px",
                  border: "none"
                }}
              >
                <div className="card-body p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h6 className="text-white mb-1 text-sm font-medium">Low Stock</h6>
                      <h2 className="text-white mb-0 text-3xl font-bold">{stockCounts.lowStock}</h2>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full">
                      <AlertTriangle size={24} className="text-white" />
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`card cursor-pointer transition-all duration-300 hover:scale-105 ${
                  activeFilter === "outOfStock" ? "ring-4 ring-red-300" : ""
                }`}
                onClick={() => setActiveFilter("outOfStock")}
                style={{
                  background: "linear-gradient(135deg, #fc466b 0%, #3f5efb 100%)",
                  borderRadius: "20px",
                  border: "none"
                }}
              >
                <div className="card-body p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h6 className="text-white mb-1 text-sm font-medium">Out of Stock</h6>
                      <h2 className="text-white mb-0 text-3xl font-bold">{stockCounts.outOfStock}</h2>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full">
                      <XCircle size={24} className="text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="form-control pl-10 border-0 shadow-sm"
                  placeholder="Search stock..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ borderRadius: "16px", height: "45px" }}
                />
              </div>

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
                  className="form-control border-0 shadow-sm"
                  value={specificDate}
                  onChange={(e) => setSpecificDate(e.target.value)}
                  style={{ borderRadius: "16px", height: "45px" }}
                />
              )}

              {dateFilter === "period" && (
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="form-control border-0 shadow-sm"
                    value={periodStartDate}
                    onChange={(e) => setPeriodStartDate(e.target.value)}
                    style={{ borderRadius: "16px", height: "45px", width: "calc(50% - 4px)" }}
                  />
                  <input
                    type="date"
                    className="form-control border-0 shadow-sm"
                    value={periodEndDate}
                    onChange={(e) => setPeriodEndDate(e.target.value)}
                    style={{ borderRadius: "16px", height: "45px", width: "calc(50% - 4px)" }}
                  />
                </div>
              )}

              <button
                className="btn btn-outline-primary shadow-sm"
                onClick={exportToCSV}
                style={{ borderRadius: "16px", height: "45px" }}
              >
                <Download size={16} className="mr-2" />
                Export
              </button>
            </div>

            {/* Stock Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="table table-hover mb-0">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
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
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                        No stock items found.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.category || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          KES {item.unit_price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          KES {(item.quantity * item.unit_price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStockStatus(item)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => openStockInModal(item)}
                            className="btn btn-sm btn-outline-success"
                            title="Stock In Entry"
                          >
                            <TrendingUp size={14} />
                          </button>
                          <button
                            onClick={() => openStockOutModal(item)}
                            className="btn btn-sm btn-outline-danger"
                            title="Stock Out Entry"
                          >
                            <TrendingDown size={14} />
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

      {/* Add New Stock Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Add New Stock Item</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                  <input
                    type="text"
                    className="form-control border-0 shadow-sm"
                    placeholder="Enter item name"
                    value={newItemData.name}
                    onChange={(e) => setNewItemData({ ...newItemData, name: e.target.value })}
                    style={{ borderRadius: "16px", height: "45px" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    className="form-select border-0 shadow-sm"
                    value={newItemData.category}
                    onChange={(e) => setNewItemData({ ...newItemData, category: e.target.value })}
                    style={{ borderRadius: "16px", height: "45px" }}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    className="form-control border-0 shadow-sm"
                    placeholder="e.g., pieces, boxes, kg"
                    value={newItemData.unit}
                    onChange={(e) => setNewItemData({ ...newItemData, unit: e.target.value })}
                    style={{ borderRadius: "16px", height: "45px" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock Level</label>
                  <input
                    type="number"
                    className="form-control border-0 shadow-sm"
                    placeholder="Minimum quantity"
                    value={newItemData.minimumLevel}
                    onChange={(e) => setNewItemData({ ...newItemData, minimumLevel: e.target.value })}
                    style={{ borderRadius: "16px", height: "45px" }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (KES)</label>
                <input
                  type="number"
                  className="form-control border-0 shadow-sm"
                  placeholder="Enter selling price"
                  value={newItemData.sellingPrice}
                  onChange={(e) => setNewItemData({ ...newItemData, sellingPrice: e.target.value })}
                  style={{ borderRadius: "16px", height: "45px" }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="form-control border-0 shadow-sm"
                  rows={3}
                  placeholder="Enter item description"
                  value={newItemData.description}
                  onChange={(e) => setNewItemData({ ...newItemData, description: e.target.value })}
                  style={{ borderRadius: "16px" }}
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end space-x-3">
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
      )}

      {/* Stock In Modal */}
      {showStockInModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Stock In Entry</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  className="form-control border-0 shadow-sm"
                  value={selectedItem.name}
                  readOnly
                  style={{ borderRadius: "16px", height: "45px" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Quantity</label>
                <input
                  type="text"
                  className="form-control border-0 shadow-sm"
                  value={`${selectedItem.quantity} ${selectedItem.unit || ""}`}
                  readOnly
                  style={{ borderRadius: "16px", height: "45px" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Add *</label>
                <input
                  type="number"
                  className="form-control border-0 shadow-sm"
                  value={stockInData.quantityToAdd}
                  onChange={(e) => setStockInData({ ...stockInData, quantityToAdd: e.target.value })}
                  style={{ borderRadius: "16px", height: "45px" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price (KES) *</label>
                <input
                  type="number"
                  className="form-control border-0 shadow-sm"
                  value={stockInData.purchasePrice}
                  onChange={(e) => setStockInData({ ...stockInData, purchasePrice: e.target.value })}
                  style={{ borderRadius: "16px", height: "45px" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (KES) *</label>
                <input
                  type="number"
                  className="form-control border-0 shadow-sm"
                  value={stockInData.sellingPrice}
                  onChange={(e) => setStockInData({ ...stockInData, sellingPrice: e.target.value })}
                  style={{ borderRadius: "16px", height: "45px" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                <input
                  type="text"
                  className="form-control border-0 shadow-sm"
                  value={stockInData.batchNumber}
                  onChange={(e) => setStockInData({ ...stockInData, batchNumber: e.target.value })}
                  style={{ borderRadius: "16px", height: "45px" }}
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end space-x-3">
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
      )}

      {/* Stock Out Modal */}
      {showStockOutModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Stock Out Entry</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  className="form-control border-0 shadow-sm"
                  value={selectedItem.name}
                  readOnly
                  style={{ borderRadius: "16px", height: "45px" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Quantity</label>
                <input
                  type="text"
                  className="form-control border-0 shadow-sm"
                  value={`${selectedItem.quantity} ${selectedItem.unit || ""}`}
                  readOnly
                  style={{ borderRadius: "16px", height: "45px" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Remove</label>
                <input
                  type="number"
                  className="form-control border-0 shadow-sm"
                  value={stockOutData.quantityToRemove}
                  max={selectedItem.quantity}
                  onChange={(e) => setStockOutData({ ...stockOutData, quantityToRemove: e.target.value })}
                  style={{ borderRadius: "16px", height: "45px" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  className="form-control border-0 shadow-sm"
                  rows={3}
                  value={stockOutData.reason}
                  onChange={(e) => setStockOutData({ ...stockOutData, reason: e.target.value })}
                  style={{ borderRadius: "16px" }}
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end space-x-3">
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
      )}
    </div>
  )
}

export default StockPage
