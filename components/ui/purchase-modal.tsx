"use client"

import React, { useState, useEffect } from "react"
import { X, Plus, Truck, Package } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import { RegisteredEntity, StockItem } from "@/lib/types"

interface PurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (purchaseData: any) => void
  purchase?: any
  mode?: "create" | "edit" | "view"
}

interface PurchaseItem {
  id: number
  stock_item_id: number | null
  stock_item: StockItem | null
  quantity: number
  unit_price: number
  total_price: number
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  purchase,
  mode = "create"
}) => {
  const [purchaseDate, setPurchaseDate] = useState("")
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState("")
  const [supplierId, setSupplierId] = useState<number | null>(null)
  const [supplierName, setSupplierName] = useState("")
  const [supplierSearch, setSupplierSearch] = useState("")
  const [supplierDropdownVisible, setSupplierDropdownVisible] = useState(false)
  const [suppliers, setSuppliers] = useState<RegisteredEntity[]>([])
  const [filteredSuppliers, setFilteredSuppliers] = useState<RegisteredEntity[]>([])
  const [paymentMethod, setPaymentMethod] = useState("")
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  // Item search states
  const [itemSearches, setItemSearches] = useState<{[key: number]: string}>({})
  const [itemDropdownVisible, setItemDropdownVisible] = useState<{[key: number]: boolean}>({})
  const [filteredStockItems, setFilteredStockItems] = useState<{[key: number]: StockItem[]}>({})

  // Initialize form
  useEffect(() => {
    if (isOpen) {
      if (mode === "create") {
        resetForm()
        generatePurchaseOrderNumber()
      } else if (purchase) {
        loadPurchaseData()
      }
      fetchSuppliers()
      fetchStockItems()
    }
  }, [isOpen, mode, purchase])

  // Calculate total whenever items change
  useEffect(() => {
    const newTotal = items.reduce((sum, item) => sum + item.total_price, 0)
    setTotal(newTotal)
  }, [items])

  // Filter suppliers based on search
  useEffect(() => {
    if (supplierSearch.trim() === "") {
      setFilteredSuppliers(suppliers)
    } else {
      const filtered = suppliers.filter(supplier => 
        supplier.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
        supplier.phone?.includes(supplierSearch) ||
        supplier.location?.toLowerCase().includes(supplierSearch.toLowerCase())
      )
      setFilteredSuppliers(filtered)
    }
  }, [supplierSearch, suppliers])

  // Filter stock items for each item row
  useEffect(() => {
    const newFilteredItems: {[key: number]: StockItem[]} = {}
    items.forEach(item => {
      const search = itemSearches[item.id] || ""
      if (search.trim() === "") {
        newFilteredItems[item.id] = stockItems
      } else {
        newFilteredItems[item.id] = stockItems.filter(stockItem => 
          stockItem.name.toLowerCase().includes(search.toLowerCase()) ||
          stockItem.description?.toLowerCase().includes(search.toLowerCase()) ||
          stockItem.code?.toLowerCase().includes(search.toLowerCase())
        )
      }
    })
    setFilteredStockItems(newFilteredItems)
  }, [itemSearches, stockItems, items])

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.supplier-search-container')) {
        setSupplierDropdownVisible(false)
      }
      
      // Handle item dropdowns
      const newItemDropdownVisible = { ...itemDropdownVisible }
      let changed = false
      Object.keys(itemDropdownVisible).forEach(key => {
        if (!target.closest(`[data-item-container="${key}"]`) && itemDropdownVisible[parseInt(key)]) {
          newItemDropdownVisible[parseInt(key)] = false
          changed = true
        }
      })
      if (changed) {
        setItemDropdownVisible(newItemDropdownVisible)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, itemDropdownVisible])

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0]
    setPurchaseDate(today)
    setPurchaseOrderNumber("")
    setSupplierId(null)
    setSupplierName("")
    setSupplierSearch("")
    setPaymentMethod("")
    setItems([createNewItem()])
    setTotal(0)
    setItemSearches({})
    setItemDropdownVisible({})
    setFilteredStockItems({})
  }

  const createNewItem = (): PurchaseItem => {
    const newId = Date.now() + Math.random()
    return {
      id: newId,
      stock_item_id: null,
      stock_item: null,
      quantity: 1,
      unit_price: 0,
      total_price: 0
    }
  }

  const generatePurchaseOrderNumber = async () => {
    try {
      const now = new Date()
      const year = now.getFullYear().toString().slice(-2)
      const month = (now.getMonth() + 1).toString().padStart(2, '0')
      
      const { data: existingPurchases, error } = await supabase
        .from("purchases")
        .select("purchase_order_number")
        .ilike("purchase_order_number", `PO${year}${month}%`)
        .order("id", { ascending: false })
      
      if (error) throw error
      
      let nextNumber = 1
      if (existingPurchases && existingPurchases.length > 0) {
        const numbers = existingPurchases
          .map(p => {
            const match = p.purchase_order_number.match(/PO\d{4}(\d{3})/)
            return match ? parseInt(match[1]) : 0
          })
          .filter(num => num > 0)
        
        if (numbers.length > 0) {
          nextNumber = Math.max(...numbers) + 1
        }
      }
      
      const formattedNumber = `PO${year}${month}${nextNumber.toString().padStart(3, '0')}`
      setPurchaseOrderNumber(formattedNumber)
    } catch (error) {
      console.error("Error generating purchase order number:", error)
      const timestamp = Date.now().toString().slice(-6)
      setPurchaseOrderNumber(`PO-${timestamp}`)
    }
  }

  const loadPurchaseData = () => {
    if (!purchase) return
    
    setPurchaseDate(purchase.purchase_date?.split('T')[0] || "")
    setPurchaseOrderNumber(purchase.purchase_order_number || "")
    setSupplierId(purchase.supplier_id || null)
    setPaymentMethod(purchase.payment_method || "")
    
    if (purchase.items && purchase.items.length > 0) {
      setItems(purchase.items.map((item: any) => ({
        id: item.id || Date.now(),
        stock_item_id: item.stock_item_id,
        stock_item: item.stock_item,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        total_price: item.total_price || 0
      })))
    } else {
      setItems([createNewItem()])
    }
  }

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from("registered_entities")
        .select("*")
        .eq("type", "supplier")
        .order("name")

      if (error) throw error
      setSuppliers(data || [])
    } catch (error) {
      console.error("Error fetching suppliers:", error)
      toast.error("Failed to load suppliers")
    }
  }

  const fetchStockItems = async () => {
    try {
      const { data, error } = await supabase
        .from("stock_items")
        .select("*")
        .eq("status", "active")
        .order("name")

      if (error) throw error
      setStockItems(data || [])
    } catch (error) {
      console.error("Error fetching stock items:", error)
      toast.error("Failed to load stock items")
    }
  }

  const updateItem = (itemId: number, field: keyof PurchaseItem, value: any) => {
    setItems(prevItems => 
      prevItems.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value }
          
          // If stock item changed, update the stock_item object and reset price
          if (field === 'stock_item_id') {
            const stockItem = stockItems.find(si => si.id === value)
            updatedItem.stock_item = stockItem || null
            updatedItem.unit_price = 0
            updatedItem.total_price = 0
          }
          
          // Recalculate total price when quantity or unit_price changes
          if (field === 'quantity' || field === 'unit_price') {
            updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price
          }
          
          return updatedItem
        }
        return item
      })
    )
  }

  const addItem = () => {
    setItems(prevItems => [...prevItems, createNewItem()])
  }

  const removeItem = (itemId: number) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId))
    
    // Clean up search states
    setItemSearches(prev => {
      const newSearches = { ...prev }
      delete newSearches[itemId]
      return newSearches
    })
    
    setItemDropdownVisible(prev => {
      const newVisible = { ...prev }
      delete newVisible[itemId]
      return newVisible
    })
  }

  const handleSupplierSelect = (supplier: RegisteredEntity) => {
    setSupplierId(supplier.id)
    setSupplierName(supplier.name)
    setSupplierSearch(supplier.name)
    setSupplierDropdownVisible(false)
  }

  const handleItemSelect = (itemId: number, stockItem: StockItem) => {
    updateItem(itemId, 'stock_item_id', stockItem.id)
    setItemSearches(prev => ({ ...prev, [itemId]: stockItem.name }))
    setItemDropdownVisible(prev => ({ ...prev, [itemId]: false }))
  }

  const handleSave = async () => {
    // Validation
    if (!supplierId) {
      toast.error("Please select a supplier")
      return
    }

    if (!paymentMethod) {
      toast.error("Please select a payment method")
      return
    }

    if (items.length === 0 || items.some(item => !item.stock_item_id || item.quantity <= 0)) {
      toast.error("Please add at least one valid item")
      return
    }

    setLoading(true)
    try {
      const purchaseData = {
        purchase_date: purchaseDate,
        purchase_order_number: purchaseOrderNumber,
        supplier_id: supplierId,
        payment_method: paymentMethod,
        total_amount: total,
        status: "pending",
        items: items.map(item => ({
          stock_item_id: item.stock_item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }))
      }

      await onSave(purchaseData)
      onClose()
      toast.success("Purchase saved successfully")
    } catch (error) {
      console.error("Error saving purchase:", error)
      toast.error("Failed to save purchase")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="modal fade show" style={{ display: "block", zIndex: 1055 }} tabIndex={-1}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content" style={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title fw-bold">
                {mode === "create" ? "Add New Purchase" : mode === "edit" ? "Edit Purchase" : "View Purchase"}
              </h5>
              <button type="button" className="btn-close" onClick={onClose}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body pt-2">
              <form className="needs-validation" noValidate>
                {/* Basic Information */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="purchaseDate" className="form-label">Purchase Date</label>
                    <input
                      type="date"
                      className="form-control border-0 shadow-sm"
                      id="purchaseDate"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      required
                      style={{ borderRadius: "16px", height: "45px" }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="supplier" className="form-label">Supplier</label>
                    <div className="input-group shadow-sm supplier-search-container" style={{ position: "relative" }}>
                      <input
                        type="text"
                        className="form-control border-0"
                        placeholder="Search supplier..."
                        value={supplierSearch}
                        onChange={(e) => {
                          setSupplierSearch(e.target.value)
                          setSupplierDropdownVisible(true)
                        }}
                        onFocus={() => setSupplierDropdownVisible(true)}
                        style={{ borderRadius: "16px 0 0 16px", height: "45px" }}
                      />
                      <button
                        className="btn btn-outline-secondary border-0"
                        type="button"
                        onClick={() => {
                          setSupplierDropdownVisible(!supplierDropdownVisible)
                          setSupplierSearch("")
                        }}
                        style={{
                          borderRadius: "0 16px 16px 0",
                          height: "45px",
                          width: "20%",
                          background: "white",
                          transition: "all 0.3s ease"
                        }}
                      >
                        <Truck size={16} style={{ color: "#6c757d" }} />
                      </button>
                      
                      {/* Supplier Dropdown */}
                      <ul
                        className={`dropdown-menu w-100 ${supplierDropdownVisible ? 'show' : ''}`}
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          width: "100%",
                          maxHeight: "300px",
                          overflowY: "auto",
                          overflowX: "hidden",
                          marginTop: "2px",
                          borderRadius: "16px",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                          background: "white",
                          zIndex: 1070,
                          transform: "none"
                        }}
                      >
                        {filteredSuppliers.length > 0 ? (
                          filteredSuppliers.map((supplier) => (
                            <li key={supplier.id}>
                              <button
                                type="button"
                                className="dropdown-item"
                                onClick={() => handleSupplierSelect(supplier)}
                                style={{
                                  padding: "0.75rem 1rem",
                                  borderRadius: "12px",
                                  margin: "2px",
                                  transition: "all 0.2s ease",
                                  border: "none",
                                  background: "none",
                                  width: "100%",
                                  textAlign: "left"
                                }}
                              >
                                <div className="d-flex justify-content-between align-items-center">
                                  <div>
                                    <strong>{supplier.name}</strong>
                                    <div className="small text-dark">{supplier.location || ''}</div>
                                  </div>
                                  <div className="small text-dark">{supplier.phone || ''}</div>
                                </div>
                              </button>
                            </li>
                          ))
                        ) : (
                          <li><span className="dropdown-item">No suppliers found</span></li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="purchaseOrderNumber" className="form-label">Purchase Order Number</label>
                    <input
                      type="text"
                      className="form-control border-0 shadow-sm"
                      id="purchaseOrderNumber"
                      value={purchaseOrderNumber}
                      readOnly
                      style={{ borderRadius: "16px", height: "45px" }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="paymentMethod" className="form-label">Payment Method</label>
                    <select
                      className="form-select border-0 shadow-sm"
                      id="paymentMethod"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      required
                      style={{ borderRadius: "16px", height: "45px" }}
                    >
                      <option value="">Select Payment Method</option>
                      <option value="David">David</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="Kim">Kim</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>
                </div>

                {/* Items Section */}
                <div className="mb-3">
                  <label className="form-label">Items</label>
                  
                  {/* Items Header */}
                  <div className="row mb-2">
                    <div className="col-md-4"><small className="text-muted">Item</small></div>
                    <div className="col-md-2"><small className="text-muted">Units</small></div>
                    <div className="col-md-2"><small className="text-muted">Qty</small></div>
                    <div className="col-md-2"><small className="text-muted">Unit Price</small></div>
                    <div className="col-md-1"><small className="text-muted">Total</small></div>
                    <div className="col-md-1"></div>
                  </div>

                  {/* Items List */}
                  {items.map((item) => (
                    <div key={item.id} className="row mb-2 align-items-center" data-item-container={item.id}>
                      <div className="col-md-4">
                        <div className="input-group shadow-sm" style={{ position: "relative" }}>
                          <input
                            type="text"
                            className="form-control border-0"
                            placeholder="Search and select item..."
                            value={itemSearches[item.id] || ""}
                            onChange={(e) => {
                              setItemSearches(prev => ({ ...prev, [item.id]: e.target.value }))
                              setItemDropdownVisible(prev => ({ ...prev, [item.id]: true }))
                            }}
                            onFocus={() => setItemDropdownVisible(prev => ({ ...prev, [item.id]: true }))}
                            style={{ borderRadius: "16px 0 0 16px", height: "45px" }}
                          />
                          <button
                            className="btn btn-outline-secondary border-0"
                            type="button"
                            onClick={() => {
                              setItemDropdownVisible(prev => ({ ...prev, [item.id]: !prev[item.id] }))
                              setItemSearches(prev => ({ ...prev, [item.id]: "" }))
                            }}
                            style={{
                              borderRadius: "0 16px 16px 0",
                              height: "45px",
                              width: "20%",
                              background: "white",
                              transition: "all 0.3s ease"
                            }}
                          >
                            <Package size={16} style={{ color: "#6c757d" }} />
                          </button>
                          
                          {/* Item Dropdown */}
                          <ul
                            className={`dropdown-menu w-100 ${itemDropdownVisible[item.id] ? 'show' : ''}`}
                            style={{
                              position: "absolute",
                              top: "100%",
                              left: 0,
                              width: "100%",
                              maxHeight: "300px",
                              overflowY: "auto",
                              overflowX: "hidden",
                              marginTop: "2px",
                              borderRadius: "16px",
                              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                              background: "white",
                              zIndex: 1070,
                              transform: "none"
                            }}
                          >
                            {(filteredStockItems[item.id] || []).length > 0 ? (
                              (filteredStockItems[item.id] || []).map((stockItem) => (
                                <li key={stockItem.id}>
                                  <button
                                    type="button"
                                    className="dropdown-item"
                                    onClick={() => handleItemSelect(item.id, stockItem)}
                                    style={{
                                      padding: "0.75rem 1rem",
                                      borderRadius: "12px",
                                      margin: "2px",
                                      transition: "all 0.2s ease",
                                      border: "none",
                                      background: "none",
                                      width: "100%",
                                      textAlign: "left"
                                    }}
                                  >
                                    <div className="d-flex justify-content-between align-items-center">
                                      <div>
                                        <strong>{stockItem.name}</strong>
                                        <div className="small text-dark">{stockItem.code} - {stockItem.description}</div>
                                      </div>
                                      <div className="small text-dark">KES {stockItem.unit_price?.toFixed(2) || '0.00'}</div>
                                    </div>
                                  </button>
                                </li>
                              ))
                            ) : (
                              <li><span className="dropdown-item">No items found</span></li>
                            )}
                          </ul>
                        </div>
                      </div>
                      <div className="col-md-2">
                        <input
                          type="text"
                          className="form-control border-0 shadow-sm"
                          value={item.stock_item?.unit || ""}
                          placeholder="Units"
                          readOnly
                          style={{ borderRadius: "16px", height: "45px" }}
                        />
                      </div>
                      <div className="col-md-2">
                        <input
                          type="number"
                          className="form-control border-0 shadow-sm"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          placeholder="Qty"
                          min="1"
                          style={{ borderRadius: "16px", height: "45px" }}
                        />
                      </div>
                      <div className="col-md-2">
                        <input
                          type="number"
                          step="0.01"
                          className="form-control border-0 shadow-sm"
                          value={item.unit_price}
                          onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          placeholder="Unit Price"
                          min="0"
                          style={{ borderRadius: "16px", height: "45px" }}
                        />
                      </div>
                      <div className="col-md-1">
                        <span className="fw-bold small">KES {item.total_price.toFixed(2)}</span>
                      </div>
                      <div className="col-md-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeItem(item.id)}
                          style={{ borderRadius: "8px", height: "45px", width: "45px" }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add Item Button */}
                  <div className="text-start mb-3">
                    <button
                      type="button"
                      className="btn btn-outline-primary shadow-sm"
                      onClick={addItem}
                      style={{ borderRadius: "16px", height: "45px" }}
                    >
                      <Plus size={16} className="me-2" />
                      Add Item
                    </button>
                  </div>
                </div>

                {/* Total */}
                <div className="row mb-3">
                  <div className="col-md-8"></div>
                  <div className="col-md-4">
                    <label htmlFor="total" className="form-label">Total</label>
                    <div className="input-group shadow-sm">
                      <span 
                        className="input-group-text border-0" 
                        style={{ background: "white", borderRadius: "16px 0 0 16px", height: "45px" }}
                      >
                        KES
                      </span>
                      <input
                        type="number"
                        className="form-control border-0"
                        value={total.toFixed(2)}
                        readOnly
                        style={{ borderRadius: "0 16px 16px 0", height: "45px", textAlign: "right" }}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="modal-footer border-0">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                style={{ borderRadius: "12px", height: "45px" }}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary shadow-sm"
                onClick={handleSave}
                disabled={loading}
                style={{ borderRadius: "12px", height: "45px" }}
              >
                {loading ? "Saving..." : "Save Purchase"}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom CSS for dropdown styles */}
      <style jsx>{`
        .dropdown-item:hover {
          background-color: #f8f9fa !important;
        }
        
        .supplier-search-container .dropdown-menu.show {
          display: block !important;
        }
        
        .input-group .btn:hover {
          background-color: #f8f9fa !important;
        }
      `}</style>
    </>
  )
}

export default PurchaseModal 