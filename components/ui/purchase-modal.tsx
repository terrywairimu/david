"use client"

import React, { useState, useEffect } from "react"
import { X, Plus, Search, Truck, Box } from "lucide-react"
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

const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  purchase,
  mode = "create"
}) => {
  const [purchaseDate, setPurchaseDate] = useState("")
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState("")
  const [supplier, setSupplier] = useState<RegisteredEntity | null>(null)
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("")
  const [suppliers, setSuppliers] = useState<RegisteredEntity[]>([])
  const [showSupplierResults, setShowSupplierResults] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("")
  const [items, setItems] = useState<any[]>([])
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

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

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0]
    setPurchaseDate(today)
    setPurchaseOrderNumber("")
    setSupplier(null)
    setSupplierSearchTerm("")
    setPaymentMethod("")
    setItems([{ id: Date.now(), stock_item_id: null, description: "", unit: "", quantity: 1, unit_price: 0, total_price: 0 }])
    setTotal(0)
  }

  const generatePurchaseOrderNumber = async () => {
    try {
      // Get current date components
      const now = new Date()
      const year = now.getFullYear().toString().slice(-2)
      const month = (now.getMonth() + 1).toString().padStart(2, '0')
      
      // Get existing purchases for this month to find highest number
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
      // Fallback to timestamp-based generation
      const timestamp = Date.now().toString().slice(-6)
      setPurchaseOrderNumber(`PO-${timestamp}`)
    }
  }

  const loadPurchaseData = () => {
    if (purchase) {
      setPurchaseDate(purchase.purchase_date)
      setPurchaseOrderNumber(purchase.purchase_order_number)
      setSupplier(purchase.supplier)
      setSupplierSearchTerm(purchase.supplier?.name || "")
      setPaymentMethod(purchase.payment_method || "")
      setItems(purchase.items || [])
      calculateTotal(purchase.items || [])
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
    }
  }

  const fetchStockItems = async () => {
    try {
      const { data, error } = await supabase
        .from("stock_items")
        .select("*")
        .order("name")

      if (error) throw error
      setStockItems(data || [])
    } catch (error) {
      console.error("Error fetching stock items:", error)
    }
  }

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
    supplier.phone?.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
    supplier.location?.toLowerCase().includes(supplierSearchTerm.toLowerCase())
  )

  const handleSupplierSelect = (selectedSupplier: RegisteredEntity) => {
    setSupplier(selectedSupplier)
    setSupplierSearchTerm(selectedSupplier.name)
    setShowSupplierResults(false)
  }

  const addItem = () => {
    const newItem = {
      id: Date.now(),
      stock_item_id: null,
      description: "",
      unit: "",
      quantity: 1,
      unit_price: 0,
      total_price: 0
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: number) => {
    if (items.length > 1) {
      const newItems = items.filter(item => item.id !== id)
      setItems(newItems)
      calculateTotal(newItems)
    }
  }

  const updateItem = (id: number, field: string, value: any) => {
    const newItems = items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
        
        // If stock item is selected, update description, unit, and price
        if (field === "stock_item_id" && value) {
          const stockItem = stockItems.find(s => s.id === value)
          if (stockItem) {
            updatedItem.description = stockItem.name
            updatedItem.unit = stockItem.unit
            updatedItem.unit_price = stockItem.unit_price || 0
          }
        }
        
        // Calculate total for this item
        updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price
        
        return updatedItem
      }
      return item
    })
    
    setItems(newItems)
    calculateTotal(newItems)
  }

  const calculateTotal = (itemsList: any[]) => {
    const newTotal = itemsList.reduce((sum, item) => sum + (item.total_price || 0), 0)
    setTotal(newTotal)
  }

  const handleSave = async () => {
    if (!supplier) {
      toast.error("Please select a supplier")
      return
    }

    if (!paymentMethod) {
      toast.error("Please select a payment method")
      return
    }

    if (items.length === 0 || items.some(item => !item.description || item.quantity <= 0)) {
      toast.error("Please add at least one valid item")
      return
    }

    setLoading(true)
    try {
      const purchaseData = {
        purchase_date: purchaseDate,
        purchase_order_number: purchaseOrderNumber,
        supplier_id: supplier.id,
        payment_method: paymentMethod,
        total_amount: total,
        status: "pending",
        items: items.map(item => ({
          stock_item_id: item.stock_item_id,
          description: item.description,
          unit: item.unit,
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

  const ItemRow: React.FC<{ item: any, index: number }> = ({ item, index }) => {
    const [showItemResults, setShowItemResults] = useState(false)
    const [itemSearchTerm, setItemSearchTerm] = useState(item.description || "")

    const filteredStockItems = stockItems.filter(stockItem =>
      stockItem.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
      stockItem.description?.toLowerCase().includes(itemSearchTerm.toLowerCase())
    )

    const handleItemSelect = (selectedItem: StockItem) => {
      updateItem(item.id, "stock_item_id", selectedItem.id)
      setItemSearchTerm(selectedItem.name)
      setShowItemResults(false)
    }

    return (
      <div className="row mb-2 purchase-item">
        <div className="col-md-4" style={{ paddingLeft: "12px", paddingRight: "6px" }}>
          <div className="input-group shadow-sm item-search-container position-relative">
            <input
              type="text"
              className="form-control border-0"
              placeholder="Search and select item..."
              value={itemSearchTerm}
              onChange={(e) => {
                setItemSearchTerm(e.target.value)
                setShowItemResults(true)
              }}
              onFocus={() => setShowItemResults(true)}
              style={{ borderRadius: "16px 0 0 16px", height: "45px" }}
            />
            <button
              className="btn btn-outline-secondary border-0"
              type="button"
              onClick={() => setShowItemResults(!showItemResults)}
              style={{
                borderRadius: "0 16px 16px 0",
                height: "45px",
                width: "20%",
                background: "white",
                transition: "all 0.3s ease"
              }}
            >
              <Box size={16} style={{ color: "#6c757d" }} />
            </button>
            {showItemResults && (
              <ul
                className="dropdown-menu show w-100 position-absolute"
                style={{
                  top: "100%",
                  left: 0,
                  zIndex: 1000,
                  maxHeight: "300px",
                  overflowY: "auto"
                }}
              >
                {filteredStockItems.map((stockItem) => (
                  <li key={stockItem.id}>
                    <button
                      className="dropdown-item py-2 px-3"
                      type="button"
                      onClick={() => handleItemSelect(stockItem)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{stockItem.name}</strong>
                          <div className="small text-muted">{stockItem.description}</div>
                        </div>
                        <div className="text-end">
                          <div>{stockItem.current_stock || 0} {stockItem.unit}</div>
                          <div className="small text-muted">KES {(stockItem.unit_price || 0).toFixed(2)}</div>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
                {filteredStockItems.length === 0 && (
                  <li><span className="dropdown-item py-2">No items found</span></li>
                )}
              </ul>
            )}
          </div>
        </div>
        <div className="col-md-2" style={{ paddingLeft: "3px", paddingRight: "3px" }}>
          <select
            className="form-select border-0 shadow-sm"
            value={item.unit}
            onChange={(e) => updateItem(item.id, "unit", e.target.value)}
            style={{ borderRadius: "16px", height: "45px" }}
          >
            <option value="">Units</option>
            <option value="pcs">Pieces</option>
            <option value="kg">Kilograms</option>
            <option value="m">Meters</option>
            <option value="sqm">Square Meters</option>
            <option value="ltr">Liters</option>
          </select>
        </div>
        <div className="col-md-2" style={{ paddingLeft: "3px", paddingRight: "3px" }}>
          <input
            type="number"
            className="form-control border-0 shadow-sm"
            placeholder="Qty"
            value={item.quantity}
            onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
            min="1"
            style={{ borderRadius: "16px", height: "45px" }}
          />
        </div>
        <div className="col-md-2" style={{ paddingLeft: "3px", paddingRight: "3px" }}>
          <input
            type="number"
            className="form-control border-0 shadow-sm"
            placeholder="Unit Price"
            value={item.unit_price}
            onChange={(e) => updateItem(item.id, "unit_price", parseFloat(e.target.value) || 0)}
            step="0.01"
            min="0"
            style={{ borderRadius: "16px", height: "45px" }}
          />
        </div>
        <div className="col-md-2" style={{ paddingLeft: "0px" }}>
          <div className="d-flex align-items-center h-100">
            <input
              type="number"
              className="form-control text-center"
              placeholder="0.00"
              value={item.total_price.toFixed(2)}
              readOnly
              style={{
                border: "none",
                height: "45px",
                color: "#ffffff",
                backgroundColor: "transparent",
                padding: "0px"
              }}
            />
            <button
              type="button"
              className="btn btn-danger btn-sm ms-2"
              onClick={() => removeItem(item.id)}
              style={{ height: "45px", width: "45px", borderRadius: "12px" }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content" style={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">Add New Purchase</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>
          <div className="modal-body pt-2">
            <form className="needs-validation" noValidate>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Purchase Date</label>
                  <input
                    type="date"
                    className="form-control border-0 shadow-sm"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    required
                    style={{ borderRadius: "16px", height: "45px" }}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Supplier</label>
                  <div className="input-group shadow-sm supplier-search-container position-relative">
                    <input
                      type="text"
                      className="form-control border-0"
                      placeholder="Search supplier..."
                      value={supplierSearchTerm}
                      onChange={(e) => {
                        setSupplierSearchTerm(e.target.value)
                        setShowSupplierResults(true)
                      }}
                      onFocus={() => setShowSupplierResults(true)}
                      style={{ borderRadius: "16px 0 0 16px", height: "45px" }}
                    />
                    <button
                      className="btn btn-outline-secondary border-0"
                      type="button"
                      onClick={() => setShowSupplierResults(!showSupplierResults)}
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
                    {showSupplierResults && (
                      <ul
                        className="dropdown-menu show w-100 position-absolute"
                        style={{
                          top: "100%",
                          left: 0,
                          zIndex: 1000,
                          maxHeight: "300px",
                          overflowY: "auto"
                        }}
                      >
                        {filteredSuppliers.map((supplier) => (
                          <li key={supplier.id}>
                            <button
                              className="dropdown-item py-2 px-3"
                              type="button"
                              onClick={() => handleSupplierSelect(supplier)}
                              style={{ cursor: "pointer" }}
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <strong>{supplier.name}</strong>
                                  <div className="small text-muted">{supplier.location || ""}</div>
                                </div>
                                <div className="small text-muted">{supplier.phone || ""}</div>
                              </div>
                            </button>
                          </li>
                        ))}
                        {filteredSuppliers.length === 0 && (
                          <li><span className="dropdown-item py-2">No suppliers found</span></li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Purchase Order Number</label>
                  <input
                    type="text"
                    className="form-control border-0 shadow-sm"
                    value={purchaseOrderNumber}
                    readOnly
                    style={{ borderRadius: "16px", height: "45px" }}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Payment Method</label>
                  <select
                    className="form-select border-0 shadow-sm"
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
              <div className="mb-3">
                <label className="form-label">Items</label>
                <div className="mb-2">
                  {items.map((item, index) => (
                    <ItemRow key={item.id} item={item} index={index} />
                  ))}
                </div>
                <div className="text-start mb-3">
                  <button
                    type="button"
                    className="btn btn-add shadow-sm"
                    onClick={addItem}
                    style={{ borderRadius: "16px", height: "45px" }}
                  >
                    <Plus size={16} className="me-2" />
                    Add Item
                  </button>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-8"></div>
                <div className="col-md-4">
                  <label className="form-label">Total</label>
                  <div className="input-group shadow-sm">
                    <span
                      className="input-group-text border-0"
                      style={{
                        background: "white",
                        borderRadius: "16px 0 0 16px",
                        height: "45px"
                      }}
                    >
                      KES
                    </span>
                    <input
                      type="number"
                      className="form-control border-0"
                      value={total.toFixed(2)}
                      readOnly
                      style={{
                        borderRadius: "0 16px 16px 0",
                        height: "45px",
                        textAlign: "right"
                      }}
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
              className="btn btn-add shadow-sm"
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
  )
}

export default PurchaseModal 