"use client"

import React, { useState, useEffect, useRef } from "react"
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
  const [purchasePriceHistory, setPurchasePriceHistory] = useState<any[]>([])
  
  // Refs for click outside detection
  const supplierDropdownRef = useRef<HTMLDivElement>(null)
  const itemDropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // Real-time subscription
  useEffect(() => {
    if (isOpen) {
      // Subscribe to purchase changes for real-time updates
      const subscription = supabase
        .channel('purchase_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases' }, (payload) => {
          console.log('Purchase change detected:', payload)
          // Optionally refresh data or update UI
        })
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [isOpen])



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
      fetchPurchasePriceHistory()
    }
  }, [isOpen, mode, purchase])

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      
      // Don't close if clicking on dropdown buttons, dropdown content, or inside the dropdowns
      if (target.closest('.supplier-dropdown') || 
          target.closest('.item-dropdown') || 
          target.closest('.dropdown-menu') ||
          target.closest('.supplier-list')) {
        console.log('Clicked on dropdown button or content, not closing')
        return
      }
      
      // Close supplier dropdown if clicking outside
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(target)) {
        console.log('Closing supplier dropdown - clicked outside')
        setShowSupplierResults(false)
      }
      
      // Close item dropdowns if clicking outside
      Object.entries(itemDropdownRefs.current).forEach(([itemId, ref]) => {
        if (ref && !ref.contains(target)) {
          console.log('Closing item dropdown for item:', itemId, '- clicked outside')
          setItems(prevItems => prevItems.map(item => 
            item.id === itemId ? { ...item, showDropdown: false } : item
          ))
        }
      })
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0]
    setPurchaseDate(today)
    setPurchaseOrderNumber("")
    setSupplier(null)
    setSupplierSearchTerm("")
    setPaymentMethod("")
    setItems([{ 
      id: Date.now(), 
      stock_item_id: null, 
      stock_item: null,
      quantity: 1, 
      unit_price: 0, 
      total_price: 0,
      showDropdown: false 
    }])
    setTotal(0)
  }

  const fetchPurchasePriceHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("purchase_price_history")
        .select("*")
        .order("purchase_date", { ascending: false })

      if (error) throw error
      setPurchasePriceHistory(data || [])
    } catch (error) {
      console.error("Error fetching purchase price history:", error)
    }
  }

  const getLastPurchasePrice = (stockItemId: number, supplierId?: number) => {
    if (!stockItemId) return 0
    
    const history = purchasePriceHistory.filter(h => {
      if (supplierId) {
        return h.stock_item_id === stockItemId && h.supplier_id === supplierId
      }
      return h.stock_item_id === stockItemId
    })
    
    return history.length > 0 ? history[0].purchase_price : 0
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
    setSupplier(purchase.supplier || null)
    setSupplierSearchTerm(purchase.supplier?.name || "")
    setPaymentMethod(purchase.payment_method || "")
    setItems(purchase.items?.map((item: any) => ({
      ...item,
      id: item.id || Date.now(),
      showDropdown: false
    })) || [])
    setTotal(purchase.total_amount || 0)
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
        .eq("status", "active")
        .order("name")

      if (error) throw error
      setStockItems(data || [])
    } catch (error) {
      console.error("Error fetching stock items:", error)
    }
  }

  const handleSupplierSelect = (selectedSupplier: RegisteredEntity) => {
    setSupplier(selectedSupplier)
    setSupplierSearchTerm(selectedSupplier.name)
    setShowSupplierResults(false)
    
    // Update prices for all items based on new supplier
    setItems(prevItems => prevItems.map(item => {
      if (item.stock_item_id) {
        const lastPrice = getLastPurchasePrice(item.stock_item_id, selectedSupplier.id)
        return {
          ...item,
          unit_price: lastPrice,
          total_price: lastPrice * item.quantity
        }
      }
      return item
    }))
  }

  const handleItemSelect = (item: any, selectedStockItem: StockItem) => {
    const lastPrice = getLastPurchasePrice(selectedStockItem.id, supplier?.id)
    
    const updatedItems = items.map(i => {
      if (i.id === item.id) {
        return {
          ...i,
          stock_item_id: selectedStockItem.id,
          stock_item: selectedStockItem,
          unit_price: lastPrice,
          total_price: lastPrice * i.quantity,
          showDropdown: false
        }
      }
      return i
    })
    
    setItems(updatedItems)
    calculateTotal(updatedItems)
  }

  const updateItem = (itemId: any, field: string, value: any) => {
    console.log('Updating item:', itemId, 'field:', field, 'value:', value)
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value }
        if (field === "quantity" || field === "unit_price") {
          updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price
        }
        if (field === "showDropdown") {
          console.log('Dropdown state changed for item:', itemId, 'to:', value)
        }
        return updatedItem
      }
      return item
    })
    setItems(updatedItems)
    calculateTotal(updatedItems)
  }

  const addItem = () => {
    const newItem = {
      id: Date.now(),
      stock_item_id: null,
      stock_item: null,
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      showDropdown: false
    }
    setItems([...items, newItem])
  }

  const removeItem = (itemId: any) => {
    console.log('Removing item with ID:', itemId, 'Current items:', items.length)
    const updatedItems = items.filter(item => item.id !== itemId)
    console.log('Items after removal:', updatedItems.length)
    setItems(updatedItems)
    calculateTotal(updatedItems)
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

    if (items.length === 0 || items.some(item => !item.stock_item_id || item.quantity <= 0)) {
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
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }))
      }

      // Save purchase price history
      for (const item of items) {
        if (item.stock_item_id && item.unit_price > 0) {
          await supabase
            .from("purchase_price_history")
            .insert({
              stock_item_id: item.stock_item_id,
              supplier_id: supplier.id,
              purchase_price: item.unit_price,
              purchase_date: purchaseDate
            })
        }
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
    console.log('Rendering ItemRow for item:', item.id, 'showDropdown:', item.showDropdown)
    const [itemSearchTerm, setItemSearchTerm] = useState(item.stock_item?.name || "")
    const [priceInputValue, setPriceInputValue] = useState(item.unit_price.toString())
    const [quantityInputValue, setQuantityInputValue] = useState(item.quantity.toString())

    const filteredStockItems = stockItems.filter(stockItem =>
      stockItem.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
      stockItem.description?.toLowerCase().includes(itemSearchTerm.toLowerCase())
    )

    const handleItemSearchFocus = () => {
      console.log('Item search focused, opening dropdown')
      setItemSearchTerm("")
      updateItem(item.id, "showDropdown", true)
    }

    const handleItemSearchChange = (value: string) => {
      console.log('Item search changed:', value, 'opening dropdown')
      setItemSearchTerm(value)
      updateItem(item.id, "showDropdown", true)
    }

    const handlePriceFocus = () => {
      if (priceInputValue === "0") {
        setPriceInputValue("")
      }
    }

    const handlePriceChange = (value: string) => {
      setPriceInputValue(value)
      const numValue = parseFloat(value) || 0
      updateItem(item.id, "unit_price", numValue)
    }

    const handleQuantityFocus = () => {
      setQuantityInputValue("")
    }

    const handleQuantityChange = (value: string) => {
      setQuantityInputValue(value)
      const numValue = parseInt(value) || 0
      updateItem(item.id, "quantity", numValue)
    }

    return (
      <div className="row mb-2 purchase-item">
        <div className="col-md-4" style={{ paddingLeft: "12px", paddingRight: "6px" }}>
          <div 
            className="input-group shadow-sm item-search-container position-relative"
            ref={(el) => {
              itemDropdownRefs.current[item.id] = el
            }}
          >
            <input
              type="text"
              className="form-control border-0"
              placeholder="Search and select item..."
              value={itemSearchTerm}
              onChange={(e) => handleItemSearchChange(e.target.value)}
              onFocus={handleItemSearchFocus}
              style={{ borderRadius: "16px 0 0 16px", height: "45px" }}
            />
            <button
              className="btn btn-outline-secondary border-0 item-dropdown"
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('Item dropdown clicked, current state:', item.showDropdown)
                setItemSearchTerm("")  // Clear search to show all items
                updateItem(item.id, "showDropdown", !item.showDropdown)
              }}
              style={{
                borderRadius: "0 16px 16px 0",
                height: "45px",
                width: "20%",
                background: "white",
                transition: "all 0.3s ease"
              }}
            >
              <i className="fas fa-box" style={{ color: "#6c757d" }}></i>
            </button>
            {item.showDropdown && (
              <ul
                className="dropdown-menu show w-100 position-absolute"
                style={{
                  top: "100%",
                  left: 0,
                  zIndex: 1050,
                  maxHeight: "200px",
                  overflowY: "auto",
                  background: "white",
                  border: "1px solid #dee2e6",
                  borderRadius: "0.375rem",
                  boxShadow: "0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)",
                  marginTop: "2px"
                }}
              >
                {filteredStockItems.map((stockItem) => (
                  <li key={stockItem.id}>
                    <button
                      className="dropdown-item"
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleItemSelect(item, stockItem)
                      }}
                      style={{
                        padding: "0.5rem 1rem",
                        border: "none",
                        background: "none",
                        width: "100%",
                        textAlign: "left",
                        cursor: "pointer"
                      }}
                    >
                      <div>
                        <strong>{stockItem.name}</strong>
                        <br />
                        <small className="text-muted">{stockItem.description}</small>
                        <br />
                        <small>Stock: {stockItem.quantity} {stockItem.unit}</small>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="col-md-2" style={{ paddingLeft: "6px", paddingRight: "6px" }}>
          <input
            type="text"
            className="form-control border-0 shadow-sm"
            placeholder="Unit"
            value={item.stock_item?.unit || ""}
            readOnly
            style={{ borderRadius: "16px", height: "45px" }}
          />
        </div>
        <div className="col-md-2" style={{ paddingLeft: "6px", paddingRight: "6px" }}>
          <input
            type="number"
            className="form-control border-0 shadow-sm"
            placeholder="Quantity"
            value={quantityInputValue}
            onChange={(e) => handleQuantityChange(e.target.value)}
            onFocus={handleQuantityFocus}
            style={{ borderRadius: "16px", height: "45px" }}
          />
        </div>
        <div className="col-md-2" style={{ paddingLeft: "6px", paddingRight: "6px" }}>
          <input
            type="number"
            step="0.01"
            className="form-control border-0 shadow-sm"
            placeholder="Unit Price"
            value={priceInputValue}
            onChange={(e) => handlePriceChange(e.target.value)}
            onFocus={handlePriceFocus}
            style={{ borderRadius: "16px", height: "45px" }}
          />
        </div>
        <div className="col-md-2" style={{ paddingLeft: "6px", paddingRight: "12px" }}>
          <div className="d-flex align-items-center h-100">
            <span className="me-2">KES {item.total_price.toFixed(2)}</span>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('Delete button clicked for item:', item.id)
                removeItem(item.id)
              }}
              style={{ borderRadius: "8px" }}
            >
                                  <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="modal fade show" style={{ display: "block" }} tabIndex={-1}>
      <div className="modal-dialog modal-lg">
                  <div className="modal-content">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">
              {mode === "create" ? "Add New Purchase" : mode === "edit" ? "Edit Purchase" : "View Purchase"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="modal-body pt-2">
            <form className="needs-validation" noValidate>
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
                  <label htmlFor="supplierSearch" className="form-label">Supplier</label>
                  <div 
                    className="input-group shadow-sm supplier-search-container"
                    ref={supplierDropdownRef}
                  >
                    <input
                      type="text"
                      className="form-control border-0"
                      id="supplierSearch"
                      placeholder="Search supplier..."
                      value={supplierSearchTerm}
                      onChange={(e) => {
                        setSupplierSearchTerm(e.target.value)
                        setShowSupplierResults(true)
                      }}
                      onFocus={() => setShowSupplierResults(true)}
                      required
                      style={{ borderRadius: "16px 0 0 16px", height: "45px" }}
                    />
                    <button
                      className="btn btn-outline-secondary border-0 supplier-dropdown"
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log('Supplier dropdown clicked, current state:', showSupplierResults)
                        setSupplierSearchTerm("")  // Clear search to show all suppliers
                        setShowSupplierResults(!showSupplierResults)
                      }}
                      style={{
                        borderRadius: "0 16px 16px 0",
                        height: "45px",
                        width: "20%",
                        background: "white",
                        transition: "all 0.3s ease"
                      }}
                    >
                      <i className="fas fa-truck" style={{ color: "#6c757d" }}></i>
                    </button>
                    {showSupplierResults && (
                      <ul
                        className="dropdown-menu show supplier-list"
                        style={{
                          width: "100%",
                          maxHeight: "300px",
                          overflowY: "auto",
                          overflowX: "hidden",
                          marginTop: "2px",
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          zIndex: 1050,
                          background: "white",
                          border: "1px solid #dee2e6",
                          borderRadius: "0.375rem",
                          boxShadow: "0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)"
                        }}
                      >
                        {suppliers
                          .filter(s => s.name.toLowerCase().includes(supplierSearchTerm.toLowerCase()))
                          .map((supplier) => (
                            <li key={supplier.id}>
                              <button
                                className="dropdown-item"
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                }}
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleSupplierSelect(supplier)
                                }}
                                style={{
                                  padding: "0.75rem 1rem",
                                  border: "none",
                                  background: "none",
                                  width: "100%",
                                  textAlign: "left",
                                  cursor: "pointer"
                                }}
                              >
                                <div>
                                  <strong>{supplier.name}</strong>
                                  <br />
                                  <small className="text-muted">{supplier.phone}</small>
                                </div>
                              </button>
                            </li>
                          ))}
                      </ul>
                    )}
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
              <div className="mb-3">
                <label className="form-label">Items</label>
                <div id="purchaseItems" className="mb-2">
                  {items.map((item, index) => (
                    <ItemRow key={item.id} item={item} index={index} />
                  ))}
                </div>
                <button
                  type="button"
                  className="btn btn-add"
                  onClick={addItem}
                >
                  <i className="fas fa-plus me-2"></i>
                  Add Item
                </button>
              </div>
              <div className="row">
                <div className="col-md-6"></div>
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <strong>Total Amount:</strong>
                    <strong>KES {total.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div className="modal-footer border-0">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-add"
              onClick={handleSave}
              disabled={loading}
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