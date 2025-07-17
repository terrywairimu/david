"use client"

import React, { useState, useEffect } from "react"
import { X, Plus } from "lucide-react"
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
  const [suppliers, setSuppliers] = useState<RegisteredEntity[]>([])
  const [paymentMethod, setPaymentMethod] = useState("")
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

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

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0]
    setPurchaseDate(today)
    setPurchaseOrderNumber("")
    setSupplierId(null)
    setPaymentMethod("")
    setItems([createNewItem()])
    setTotal(0)
  }

  const createNewItem = (): PurchaseItem => ({
    id: Date.now(),
    stock_item_id: null,
    stock_item: null,
    quantity: 1,
    unit_price: 0,
    total_price: 0
  })

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
    <div className="modal fade show" style={{ display: "block", zIndex: 1055 }} tabIndex={-1}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
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
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="supplier" className="form-label">Supplier</label>
                  <select
                    className="form-select border-0 shadow-sm"
                    id="supplier"
                    value={supplierId || ""}
                    onChange={(e) => setSupplierId(e.target.value ? parseInt(e.target.value) : null)}
                    required
                    style={{ borderRadius: "16px", height: "45px" }}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name} - {supplier.phone}
                      </option>
                    ))}
                  </select>
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
                  <div className="col-md-2"><small className="text-muted">Unit</small></div>
                  <div className="col-md-2"><small className="text-muted">Quantity</small></div>
                  <div className="col-md-2"><small className="text-muted">Unit Price</small></div>
                  <div className="col-md-2"><small className="text-muted">Total</small></div>
                </div>

                {/* Items List */}
                {items.map((item, index) => (
                  <div key={item.id} className="row mb-2 align-items-center">
                    <div className="col-md-4">
                      <select
                        className="form-select border-0 shadow-sm"
                        value={item.stock_item_id || ""}
                        onChange={(e) => updateItem(item.id, 'stock_item_id', e.target.value ? parseInt(e.target.value) : null)}
                        style={{ borderRadius: "16px", height: "45px" }}
                      >
                        <option value="">Select Item</option>
                        {stockItems.map((stockItem) => (
                          <option key={stockItem.id} value={stockItem.id}>
                            {stockItem.name} - {stockItem.description}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-2">
                      <input
                        type="text"
                        className="form-control border-0 shadow-sm"
                        value={item.stock_item?.unit || ""}
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
                        min="0"
                        style={{ borderRadius: "16px", height: "45px" }}
                      />
                    </div>
                    <div className="col-md-1">
                      <span className="fw-bold">KES {item.total_price.toFixed(2)}</span>
                    </div>
                    <div className="col-md-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removeItem(item.id)}
                        style={{ borderRadius: "8px" }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add Item Button */}
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={addItem}
                  style={{ borderRadius: "16px" }}
                >
                  <Plus size={16} className="me-1" />
                  Add Item
                </button>
              </div>

              {/* Total */}
              <div className="row">
                <div className="col-md-8"></div>
                <div className="col-md-4">
                  <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                    <strong>Total Amount:</strong>
                    <strong className="text-primary">KES {total.toFixed(2)}</strong>
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
              style={{ borderRadius: "16px" }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={loading}
              style={{ borderRadius: "16px" }}
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