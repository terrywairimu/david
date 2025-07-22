"use client"

import React, { useState, useEffect, useRef } from "react"
import { X, Plus, Truck, Package } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import { RegisteredEntity, StockItem } from "@/lib/types"
import { createPortal } from "react-dom"

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

// Portal Dropdown Component
const PortalDropdown: React.FC<{
  isVisible: boolean
  triggerRef: React.RefObject<HTMLDivElement | null>
  onClose: () => void
  children: React.ReactNode
}> = ({ isVisible, triggerRef, onClose, children }) => {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }, [isVisible, triggerRef])

  const dropdownRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node) && 
          dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isVisible, triggerRef, onClose])

  if (!isVisible) return null

  return createPortal(
    <ul 
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        width: position.width,
        maxHeight: '200px',
        overflowY: 'auto',
        backgroundColor: 'white',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 9999,
        listStyle: 'none',
        margin: 0,
        padding: 0
      }}
      className="portal-dropdown"
    >
      {children}
    </ul>,
    document.body
  )
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
  const [lastPurchasePrices, setLastPurchasePrices] = useState<{[key: number]: number}>({})
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  // Item search states
  const [itemSearches, setItemSearches] = useState<{[key: number]: string}>({})
  const [itemDropdownVisible, setItemDropdownVisible] = useState<{[key: number]: boolean}>({})
  const [filteredStockItems, setFilteredStockItems] = useState<{[key: number]: StockItem[]}>({})
  const [quantityInputFocused, setQuantityInputFocused] = useState<{[key: number]: boolean}>({})
  const [priceInputFocused, setPriceInputFocused] = useState<{[key: number]: boolean}>({})
  const [rawQuantityValues, setRawQuantityValues] = useState<{[key: number]: string}>({})
  const [rawPriceValues, setRawPriceValues] = useState<{[key: number]: string}>({})

  // Refs for dropdown positioning
  const supplierInputRef = useRef<HTMLDivElement>(null)
  const itemInputRefs = useRef<{[key: number]: React.RefObject<HTMLDivElement | null>}>({})

  // Function to get or create ref for item
  const getItemInputRef = (itemId: number): React.RefObject<HTMLDivElement | null> => {
    if (!itemInputRefs.current[itemId]) {
      itemInputRefs.current[itemId] = { current: null }
    }
    return itemInputRefs.current[itemId]
  }

  // Fetch last purchase prices for all stock items
  const fetchLastPurchasePrices = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_last_purchase_prices')

      if (error) {
        console.error("Error fetching last purchase prices:", error)
        return
      }

      // Convert to map for easy lookup
      const pricesMap: {[key: number]: number} = {}
      if (data) {
        data.forEach((item: any) => {
          pricesMap[item.stock_item_id] = parseFloat(item.unit_price)
        })
      }

      setLastPurchasePrices(pricesMap)
    } catch (error) {
      console.error("Error fetching last purchase prices:", error)
    }
  }

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
      fetchLastPurchasePrices()
    }
    // Real-time subscription for stock_items
    const stockItemsChannel = supabase
      .channel('stock_items_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_items' }, (payload) => {
        fetchStockItems();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(stockItemsChannel);
    };
  }, [isOpen, mode, purchase]);

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
          stockItem.sku?.toLowerCase().includes(search.toLowerCase())
        )
      }
    })
    setFilteredStockItems(newFilteredItems)
  }, [itemSearches, stockItems, items])

  // Portal dropdowns handle their own click outside logic

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
    setQuantityInputFocused({})
    setPriceInputFocused({})
    setRawQuantityValues({})
    setRawPriceValues({})
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
      setItems(purchase.items.map((item: any) => {
        let stock_item = item.stock_item;
        // Patch: If stock_item is missing but stock_item_id is present, try to find it from stockItems
        if (!stock_item && item.stock_item_id) {
          stock_item = stockItems.find(si => si.id === item.stock_item_id) || null;
        }
        return {
          id: item.id || Date.now(),
          stock_item_id: item.stock_item_id,
          stock_item,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          total_price: item.total_price || 0
        }
      }))
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
          
          // If stock item changed, update the stock_item object
          if (field === 'stock_item_id') {
            const stockItem = stockItems.find(si => si.id === value)
            updatedItem.stock_item = stockItem || null
            // Don't reset unit_price here - it's handled by handleItemSelect
            updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price
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
    
    // Clean up focus states
    setQuantityInputFocused(prev => {
      const newFocused = { ...prev }
      delete newFocused[itemId]
      return newFocused
    })
    
    setPriceInputFocused(prev => {
      const newFocused = { ...prev }
      delete newFocused[itemId]
      return newFocused
    })
    
    // Clean up raw value states
    setRawQuantityValues(prev => {
      const newRaw = { ...prev }
      delete newRaw[itemId]
      return newRaw
    })
    
    setRawPriceValues(prev => {
      const newRaw = { ...prev }
      delete newRaw[itemId]
      return newRaw
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
    
    // Auto-populate unit price with last purchase price if available
    const lastPrice = lastPurchasePrices[stockItem.id]
    if (lastPrice && lastPrice > 0) {
      updateItem(itemId, 'unit_price', lastPrice)
    }
    
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
                    readOnly={mode === "view"}
                  />
                </div>
                <div className="col-md-6">
                    <label htmlFor="supplier" className="form-label">Supplier</label>
                    <div className="input-group shadow-sm supplier-search-container" style={{ position: "relative" }} ref={supplierInputRef}>
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
                      readOnly={mode === "view"}
                    />
                    <button
                      className="btn btn-outline-secondary border-0 supplier-dropdown"
                      type="button"
                        onClick={() => {
                          setSupplierDropdownVisible(!supplierDropdownVisible)
                          if (!supplierDropdownVisible) {
                            setSupplierSearch("")  // Clear search when opening dropdown to show all
                          }
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
                      <PortalDropdown
                        isVisible={supplierDropdownVisible}
                        triggerRef={supplierInputRef}
                        onClose={() => setSupplierDropdownVisible(false)}
                      >
                        {filteredSuppliers.length > 0 ? (
                          filteredSuppliers.map((supplier) => (
                            <li key={supplier.id}>
                              <a
                                href="#"
                                className="dropdown-item"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleSupplierSelect(supplier)
                                }}
                              >
                                <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <strong>{supplier.name}</strong>
                                    <div className="small text-dark">{supplier.location || ''}</div>
                                  </div>
                                  <div className="small text-dark">{supplier.phone || ''}</div>
                                </div>
                              </a>
                            </li>
                          ))
                        ) : (
                          <li><span className="dropdown-item">No suppliers found</span></li>
                    )}
                      </PortalDropdown>
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
                    disabled={mode === "view"}
                  >
                    <option value="">Select Payment Method</option>
                    <option value="cash">Cash</option>
                    <option value="cooperative_bank">Cooperative Bank</option>
                    <option value="credit">Credit</option>
                    <option value="cheque">Cheque</option>
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
                  {mode === "view" ? (
  items.map((item) => (
    <div key={item.id} className="row mb-2 align-items-center" data-item-container={item.id}>
      <div className="col-md-4">
        <div className="form-control-plaintext">
          {(
            item.stock_item?.description && item.stock_item.description.trim() !== ''
              ? item.stock_item.description
              : (item.stock_item?.name && item.stock_item.name.trim() !== ''
                  ? item.stock_item.name
                  : 'N/A')
          )}
        </div>
      </div>
      <div className="col-md-2">
        <div className="form-control-plaintext">{item.stock_item?.unit || 'N/A'}</div>
      </div>
      <div className="col-md-2">
        <div className="form-control-plaintext">{item.quantity}</div>
      </div>
      <div className="col-md-2">
        <div className="form-control-plaintext">KES {item.unit_price.toFixed(2)}</div>
      </div>
      <div className="col-md-1">
        <div className="form-control-plaintext">KES {item.total_price.toFixed(2)}</div>
      </div>
      <div className="col-md-1"></div>
    </div>
  ))
) : (
  items.map((item) => (
                    <div key={item.id} className="row mb-2 align-items-center" data-item-container={item.id}>
                      <div className="col-md-4">
                        <div className="input-group shadow-sm item-search-container" style={{ position: "relative" }} ref={getItemInputRef(item.id)}>
                          <input
                            type="text"
                            className="form-control border-0 item-search"
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
                            className="btn btn-outline-secondary border-0 item-dropdown"
                            type="button"
                            onClick={() => {
                              setItemDropdownVisible(prev => ({ ...prev, [item.id]: !prev[item.id] }))
                              if (!itemDropdownVisible[item.id]) {
                                setItemSearches(prev => ({ ...prev, [item.id]: "" }))  // Clear search when opening dropdown
                              }
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
                                                     <PortalDropdown
                             isVisible={itemDropdownVisible[item.id]}
                             triggerRef={getItemInputRef(item.id)}
                             onClose={() => setItemDropdownVisible(prev => ({ ...prev, [item.id]: false }))}
                           >
                            {(filteredStockItems[item.id] || []).length > 0 ? (
                              (filteredStockItems[item.id] || []).map((stockItem) => (
                                <li key={stockItem.id}>
                                  <a
                                    href="#"
                                    className="dropdown-item"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      handleItemSelect(item.id, stockItem)
                                    }}
                                  >
                                    <div className="d-flex flex-column">
                                      <div>
                                        <strong>{stockItem.name}</strong>
                                      </div>
                                      <div className="small text-muted">Code: {stockItem.sku || `STK${stockItem.id.toString().padStart(4, '0')}`}</div>
                                      <div className="small text-muted">Last Price: KES {lastPurchasePrices[stockItem.id]?.toFixed(2) || 'N/A'}</div>
                                    </div>
                                  </a>
                                </li>
                              ))
                            ) : (
                              <li><span className="dropdown-item">No items found</span></li>
                            )}
                          </PortalDropdown>
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
                          value={
                            quantityInputFocused[item.id]
                              ? (rawQuantityValues[item.id] ?? "")
                              : (item.quantity === 1 ? "" : item.quantity)
                          }
                          onChange={e => {
                            const value = e.target.value;
                            setRawQuantityValues(prev => ({ ...prev, [item.id]: value }));
                          }}
                          onFocus={e => {
                            setQuantityInputFocused(prev => ({ ...prev, [item.id]: true }));
                            setRawQuantityValues(prev => ({ ...prev, [item.id]: "" }));
                            e.target.select();
                          }}
                          onBlur={e => {
                            setQuantityInputFocused(prev => ({ ...prev, [item.id]: false }));
                            const value = e.target.value;
                            const finalValue = value === '' ? 1 : parseInt(value) || 1;
                            updateItem(item.id, 'quantity', finalValue);
                            setRawQuantityValues(prev => {
                              const copy = { ...prev };
                              delete copy[item.id];
                              return copy;
                            });
                          }}
                          placeholder="1"
                          min="1"
                          style={{ borderRadius: "16px", height: "45px" }}
                        />
                      </div>
                      <div className="col-md-2">
                        <input
                          type="number"
                          step="0.01"
                          className="form-control border-0 shadow-sm"
                          value={
                            priceInputFocused[item.id]
                              ? (rawPriceValues[item.id] ?? "")
                              : (item.unit_price === 0 ? "" : item.unit_price)
                          }
                          onChange={e => {
                            const value = e.target.value;
                            setRawPriceValues(prev => ({ ...prev, [item.id]: value }));
                          }}
                          onFocus={e => {
                            setPriceInputFocused(prev => ({ ...prev, [item.id]: true }));
                            setRawPriceValues(prev => ({ ...prev, [item.id]: "" }));
                            e.target.select();
                          }}
                          onBlur={e => {
                            setPriceInputFocused(prev => ({ ...prev, [item.id]: false }));
                            const value = e.target.value;
                            const finalValue = value === '' ? 0 : parseFloat(value) || 0;
                            updateItem(item.id, 'unit_price', finalValue);
                            setRawPriceValues(prev => {
                              const copy = { ...prev };
                              delete copy[item.id];
                              return copy;
                            });
                          }}
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
                  ))
                )}

                  {/* Add Item Button */}
                  {mode !== "view" && (
                  <div className="text-start mb-3">
                <button
                  type="button"
                      className="btn-add shadow-sm"
                  onClick={addItem}
                      style={{ borderRadius: "16px", height: "45px" }}
                >
                      <Plus size={16} className="me-2" />
                  Add Item
                </button>
              </div>
                )}
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
            {mode !== "view" && (
            <button
              type="button"
                className="btn-add shadow-sm"
              onClick={handleSave}
              disabled={loading}
                style={{ borderRadius: "12px", height: "45px" }}
            >
              {loading ? "Saving..." : "Save Purchase"}
            </button>
            )}
          </div>
        </div>
      </div>
    </div>
      

    </>
  )
}

export default PurchaseModal 