"use client"

import React, { useState, useEffect, useRef } from "react"
import { X, Search, Plus, User, Trash2, Package } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import { RegisteredEntity, StockItem } from "@/lib/types"
import { createPortal } from "react-dom"

interface ClientPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (purchaseData: any) => void
  purchase?: any
  mode?: "create" | "edit" | "view"
}

interface Client {
  id: number
  name: string
  phone?: string
  location?: string
}

interface PurchaseItem {
  id: number
  stock_item_id: number | null
  stock_item: StockItem | null
  quantity: number
  unit_price: number
  total_price: number
}

// Portal Dropdown Component for better positioning
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

const ClientPurchaseModal: React.FC<ClientPurchaseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  purchase,
  mode = "create"
}) => {
  const [purchaseDate, setPurchaseDate] = useState("")
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState("")
  const [supplierId, setSupplierId] = useState<number | null>(null)
  const [clientId, setClientId] = useState<number | null>(null)
  const [paidTo, setPaidTo] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [suppliers, setSuppliers] = useState<RegisteredEntity[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(false)
  const [itemSearches, setItemSearches] = useState<{ [key: number]: string }>({})
  const [itemDropdownVisible, setItemDropdownVisible] = useState<{ [key: number]: boolean }>({})
  const [clientSearch, setClientSearch] = useState("")
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [rawQuantityValues, setRawQuantityValues] = useState<{ [key: number]: string }>({})
  const [rawRateValues, setRawRateValues] = useState<{ [key: number]: string }>({})
  const [quantityInputFocused, setQuantityInputFocused] = useState<{ [key: number]: boolean }>({})
  const [rateInputFocused, setRateInputFocused] = useState<{ [key: number]: boolean }>({})
  const [availableDocuments, setAvailableDocuments] = useState<any[]>([])
  const [filteredStockItems, setFilteredStockItems] = useState<{ [key: number]: StockItem[] }>({})
  const [lastPurchasePrices, setLastPurchasePrices] = useState<{ [key: number]: number }>({})

  const clientInputGroupRef = useRef<HTMLDivElement>(null)
  const clientDropdownRef = useRef<HTMLDivElement>(null)
  const itemInputRefs = useRef<{ [key: number]: React.RefObject<HTMLDivElement | null> }>({})

  const getItemInputRef = (itemId: number): React.RefObject<HTMLDivElement | null> => {
    if (!itemInputRefs.current[itemId]) {
      itemInputRefs.current[itemId] = { current: null }
    }
    return itemInputRefs.current[itemId]
  }

  const fetchLastPurchasePrices = async () => {
    try {
      console.log('Attempting to fetch last purchase prices...')
      
      // First, try a simple count query to test access
      const { count, error: countError } = await supabase
        .from('purchase_items')
        .select('*', { count: 'exact', head: true })
      
      if (countError) {
        console.warn('Cannot access purchase_items table:', countError)
        return {}
      }
      
      console.log('Purchase items table accessible, count:', count)
      
      const { data, error } = await supabase
        .from('purchase_items')
        .select('stock_item_id, unit_price, created_at')
        .not('stock_item_id', 'is', null)
        .not('unit_price', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1000) // Add limit to prevent large queries

      if (error) {
        console.warn('Supabase error fetching last purchase prices (non-critical):', error)
        console.warn('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return {}
      }

      console.log('Successfully fetched purchase items:', data?.length || 0)

      if (!data || data.length === 0) {
        console.log('No purchase items found')
        return {}
      }

      const lastPrices: { [key: number]: number } = {}
      const processedItems = new Set<number>()

      data.forEach(item => {
        if (item.stock_item_id && !processedItems.has(item.stock_item_id)) {
          lastPrices[item.stock_item_id] = item.unit_price
          processedItems.add(item.stock_item_id)
        }
      })

      console.log('Processed last prices for items:', Object.keys(lastPrices).length)
      setLastPurchasePrices(lastPrices)
      return lastPrices
    } catch (error) {
      console.warn('Unexpected error fetching last purchase prices (non-critical):', error)
      return {}
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
        .ilike("purchase_order_number", `POCL${year}${month}%`)
        .order("id", { ascending: false })
      
      if (error) throw error
      
      let nextNumber = 1
      if (existingPurchases && existingPurchases.length > 0) {
        const numbers = existingPurchases
          .map(p => {
            const match = p.purchase_order_number.match(/POCL\d{4}(\d{3})/)
            return match ? parseInt(match[1]) : 0
          })
          .filter(num => num > 0)
        
        if (numbers.length > 0) {
          nextNumber = Math.max(...numbers) + 1
        }
      }
      
      const formattedNumber = `POCL${year}${month}${nextNumber.toString().padStart(3, '0')}`
      setPurchaseOrderNumber(formattedNumber)
    } catch (error) {
      console.error("Error generating purchase order number:", error)
      const timestamp = Date.now().toString().slice(-6)
      setPurchaseOrderNumber(`POCL-${timestamp}`)
    }
  }

  const loadClientDocuments = async (clientId: number) => {
    try {
      // Load quotations
      const { data: quotationsData } = await supabase
        .from("quotations")
        .select("*")
        .eq("client_id", clientId)
        .order("date_created", { ascending: false })

      // Load sales orders
      const { data: salesOrdersData } = await supabase
        .from("sales_orders")
        .select("*")
        .eq("client_id", clientId)
        .order("date_created", { ascending: false })

      // Load invoices
      const { data: invoicesData } = await supabase
        .from("invoices")
        .select("*")
        .eq("client_id", clientId)
        .order("date_created", { ascending: false })

      // Combine all documents for paid_to dropdown
      const allDocuments = [
        ...(quotationsData || []).map(q => ({ 
          id: q.quotation_number, 
          type: 'quotation', 
          number: q.quotation_number,
          amount: q.grand_total,
          date: q.date_created 
        })),
        ...(salesOrdersData || []).map(so => ({ 
          id: so.order_number, 
          type: 'sales_order', 
          number: so.order_number,
          amount: so.grand_total,
          date: so.date_created 
        })),
        ...(invoicesData || []).map(inv => ({ 
          id: inv.invoice_number, 
          type: 'invoice', 
          number: inv.invoice_number,
          amount: inv.grand_total,
          date: inv.date_created 
        }))
      ]

      setAvailableDocuments(allDocuments)
    } catch (error) {
      console.error("Error loading client documents:", error)
    }
  }

  const loadPurchaseData = () => {
    if (!purchase) return
    setPurchaseDate(purchase.purchase_date?.split('T')[0] || "")
    setPurchaseOrderNumber(purchase.purchase_order_number || "")
    setSupplierId(purchase.supplier_id || null)
    setClientId(purchase.client_id || null)
    setPaidTo(purchase.paid_to || "")
    setPaymentMethod(purchase.payment_method || "")

    if (purchase.items && purchase.items.length > 0) {
      setItems(purchase.items.map((item: any) => {
        let stock_item = item.stock_item;
        // Patch: If stock_item is missing but stock_item_id is present, try to find it from stockItems
        if (!stock_item && item.stock_item_id) {
          stock_item = stockItems.find(si => si.id === item.stock_item_id) || null;
        }
        return {
          id: item.id,
          stock_item_id: item.stock_item_id,
          stock_item: stock_item,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }
      }))

      // Set itemSearches for the loaded items
      const newItemSearches: { [key: number]: string } = {}
      purchase.items.forEach((item: any) => {
        let stock_item = item.stock_item;
        if (!stock_item && item.stock_item_id) {
          stock_item = stockItems.find(si => si.id === item.stock_item_id) || null;
        }
        if (stock_item) {
          newItemSearches[item.id] = stock_item.name || stock_item.description || ""
        }
      })
      setItemSearches(newItemSearches)
    }

    // Set client search to selected client name
    if (purchase.client_id) {
      const selectedClient = clients.find(c => c.id === purchase.client_id)
      if (selectedClient) {
        setClientSearch(selectedClient.name)
      }
    }
  }

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from("registered_entities")
        .select("id, name, type, date_added, status")
        .eq("type", "supplier")
        .order("name")

      if (error) throw error
      setSuppliers(data || [])
    } catch (error) {
      console.error("Error fetching suppliers:", error)
    }
  }

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("registered_entities")
        .select("id, name, phone, location, type, date_added, status")
        .eq("type", "client")
        .order("name")

      if (error) throw error
      setClients(data || [])
      setFilteredClients(data || [])
    } catch (error) {
      console.error("Error fetching clients:", error)
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

  const updateItem = (itemId: number, field: keyof PurchaseItem, value: any) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? {
              ...item,
              [field]: value,
              total_price: field === 'quantity' || field === 'unit_price'
                ? (field === 'quantity' ? value : item.quantity) * (field === 'unit_price' ? value : item.unit_price)
                : item.total_price
            }
          : item
      )
    )
  }

  const addItem = () => {
    const newItem: PurchaseItem = {
      id: Date.now(),
      stock_item_id: null,
      stock_item: null,
      quantity: 1,
      unit_price: 0,
      total_price: 0
    }
    setItems(prev => [...prev, newItem])
  }

  const removeItem = (itemId: number) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
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
    // Clean up refs
    if (itemInputRefs.current[itemId]) {
      delete itemInputRefs.current[itemId]
    }
  }

  const handleSupplierSelect = (supplier: RegisteredEntity) => {
    setSupplierId(supplier.id)
  }

  const handleClientSelect = (client: Client) => {
    setClientId(client.id)
    setClientSearch(client.name)
    setShowClientDropdown(false)
    // Load client documents for paid_to dropdown
    loadClientDocuments(client.id)
  }

  const handleItemSelect = (itemId: number, stockItem: StockItem) => {
    updateItem(itemId, 'stock_item_id', stockItem.id)
    updateItem(itemId, 'stock_item', stockItem)
    setItemSearches(prev => ({ ...prev, [itemId]: stockItem.name }))
    setItemDropdownVisible(prev => ({ ...prev, [itemId]: false }))
    
    // Set default unit price from stock item
    updateItem(itemId, 'unit_price', stockItem.unit_price || 0)
  }

  const handleSave = async () => {
    if (!supplierId) {
      toast.error("Please select a supplier")
      return
    }

    if (items.length === 0) {
      toast.error("Please add at least one item")
      return
    }

    const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0)
    const purchaseData = {
      purchase_order_number: purchaseOrderNumber,
      purchase_date: purchaseDate,
      supplier_id: supplierId,
      client_id: clientId,
      paid_to: paidTo,
      payment_method: paymentMethod,
      total_amount: totalAmount,
      status: "pending",
      items: items
    }

    onSave(purchaseData)
  }

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0]
    setPurchaseDate(today)
    setPurchaseOrderNumber("")
    setSupplierId(null)
    setClientId(null)
    setPaidTo("")
    setPaymentMethod("")
    setItems([])
    setItemSearches({})
    setItemDropdownVisible({})
    setClientSearch("")
    setShowClientDropdown(false)
    setRawQuantityValues({})
    setRawRateValues({})
    setQuantityInputFocused({})
    setRateInputFocused({})
    setAvailableDocuments([])
  }

  // Initialize form
  useEffect(() => {
    if (isOpen) {
      if (mode === "create") {
        resetForm()
        generatePurchaseOrderNumber()
      }
      fetchSuppliers()
      fetchClients()
      fetchStockItems()
      fetchLastPurchasePrices()
    }
  }, [isOpen, mode])

  // Load purchase data after stockItems are available
  useEffect(() => {
    if (isOpen && purchase && mode !== "create" && stockItems.length > 0) {
      loadPurchaseData()
      // Load client documents if client_id exists
      if (purchase.client_id) {
        loadClientDocuments(purchase.client_id)
      }
    }
  }, [isOpen, purchase, mode, stockItems])

  useEffect(() => {
    // Filter clients based on search with debouncing
    const timeoutId = setTimeout(() => {
      const searchLower = clientSearch.toLowerCase()
      const filtered = clients.filter(client => {
        const nameLower = client.name.toLowerCase()
        const phoneLower = client.phone?.toLowerCase() || ""
        const locationLower = client.location?.toLowerCase() || ""
        return nameLower.includes(searchLower) ||
               phoneLower.includes(searchLower) ||
               locationLower.includes(searchLower)
      })
      setFilteredClients(filtered)
    }, 150) // 150ms debounce

    return () => clearTimeout(timeoutId)
  }, [clientSearch, clients])

  // Filter stock items for each item row with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const newFilteredItems: {[key: number]: StockItem[]} = {}
      items.forEach(item => {
        const search = itemSearches[item.id] || ""
        if (search.trim() === "") {
          newFilteredItems[item.id] = stockItems
        } else {
          const searchLower = search.toLowerCase()
          newFilteredItems[item.id] = stockItems.filter(stockItem => {
            const nameLower = stockItem.name.toLowerCase()
            const descLower = stockItem.description?.toLowerCase() || ""
            const skuLower = stockItem.sku?.toLowerCase() || ""
            return nameLower.includes(searchLower) ||
                   descLower.includes(searchLower) ||
                   skuLower.includes(searchLower)
          })
        }
      })
      setFilteredStockItems(newFilteredItems)
    }, 150) // 150ms debounce

    return () => clearTimeout(timeoutId)
  }, [itemSearches, stockItems, items])

  useEffect(() => {
    if (!showClientDropdown) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        clientInputGroupRef.current &&
        !clientInputGroupRef.current.contains(event.target as Node) &&
        clientDropdownRef.current &&
        !clientDropdownRef.current.contains(event.target as Node)
      ) {
        setShowClientDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showClientDropdown])

  if (!isOpen) return null

  return (
    <div className="modal fade show" style={{ display: "block", zIndex: 1055, backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content" style={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">
              {mode === "create" ? "Add New Client Purchase" : mode === "edit" ? "Edit Client Purchase" : "View Client Purchase"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
          <div className="modal-body pt-2">
            <form id="clientPurchaseForm">
              {/* Basic Information */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <label className="form-label">Purchase Date</label>
                  <input
                    type="date"
                    className="form-control border-0 shadow-sm"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    required
                    style={{ borderRadius: "16px", height: "45px" }}
                    readOnly={mode === "view"}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Order Number</label>
                  <input
                    type="text"
                    className="form-control border-0 shadow-sm"
                    value={purchaseOrderNumber}
                    onChange={(e) => setPurchaseOrderNumber(e.target.value)}
                    required
                    style={{ borderRadius: "16px", height: "45px" }}
                    readOnly={mode === "view"}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Supplier</label>
                  <select
                    className="form-select border-0 shadow-sm"
                    value={supplierId || ""}
                    onChange={(e) => setSupplierId(e.target.value ? parseInt(e.target.value) : null)}
                    required
                    style={{ borderRadius: "16px", height: "45px" }}
                    disabled={mode === "view"}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Payment Method</label>
                  <select
                    className="form-select border-0 shadow-sm"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                    style={{ borderRadius: "16px", height: "45px" }}
                    disabled={mode === "view"}
                  >
                    <option value="">Select Payment Method</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>
              </div>

              {/* Client and Paid To Section */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <label className="form-label">Client</label>
                  <div className="position-relative">
                    <div className="input-group shadow-sm" ref={clientInputGroupRef}>
                      <input 
                        type="text" 
                        className="form-control border-0" 
                        placeholder="Search client..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        onFocus={() => setShowClientDropdown(true)}
                        style={{ borderRadius: "16px 0 0 16px", height: "45px", paddingLeft: "15px", color: "#000000" }}
                        autoComplete="off"
                        required
                        disabled={mode === "view"}
                      />
                      <button 
                        className="btn btn-light border-0 dropdown-toggle" 
                        type="button"
                        onClick={() => setShowClientDropdown(!showClientDropdown)}
                        style={{ borderRadius: "0 16px 16px 0", height: "45px", background: "white" }}
                        disabled={mode === "view"}
                      >
                        <User size={16} className="text-muted" />
                      </button>
                    </div>
                    {showClientDropdown && mode !== "view" && (
                      <div 
                        className="shadow-sm"
                        ref={clientDropdownRef}
                        style={{
                          display: "block",
                          maxHeight: "200px",
                          overflowY: "auto",
                          position: "absolute",
                          width: "100%",
                          zIndex: 1000,
                          background: "white",
                          borderRadius: "16px",
                          marginTop: "5px",
                          border: "1px solid #e0e0e0"
                        }}
                      >
                        {filteredClients.map((client) => (
                          <div
                            key={client.id}
                            className="dropdown-item"
                            onClick={() => handleClientSelect(client)}
                            style={{ cursor: "pointer", padding: "10px 15px", color: "#000000" }}
                          >
                            <strong style={{ color: "#000000" }}>{client.name}</strong>
                            <div className="small" style={{ color: "#6c757d" }}>
                              {client.phone && `${client.phone} • `}
                              {client.location}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Paid To (Optional)</label>
                  <select 
                    className="form-select border-0 shadow-sm"
                    value={paidTo}
                    onChange={(e) => setPaidTo(e.target.value)}
                    style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                    disabled={mode === "view"}
                  >
                    <option value="">Select Quotation/Order/Invoice (Optional)</option>
                    {availableDocuments.map((doc) => (
                      <option key={doc.id} value={doc.number}>
                        {doc.type === 'quotation' ? 'QT' : doc.type === 'sales_order' ? 'SO' : 'INV'} - {doc.number} (KES {doc.amount?.toFixed(2) || '0.00'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Section */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0 fw-bold" style={{ color: "white" }}>Purchase Items</h6>
                </div>

                {/* Items Header */}
                <div className="row mb-2">
                  <div className="col-md-4"><small className="text-white">Item</small></div>
                  <div className="col-md-2"><small className="text-white">Unit</small></div>
                  <div className="col-md-2"><small className="text-white">Qty</small></div>
                  <div className="col-md-2"><small className="text-white">Rate</small></div>
                  <div className="col-md-1"><small className="text-white">Total</small></div>
                  <div className="col-md-1"></div>
                </div>

                {mode === "view" ? (
                  items.map((item) => (
                    <div key={item.id} className="row mb-2 align-items-center" data-item-container={item.id}>
                      <div className="col-md-4">
                        <div className="form-control-plaintext" style={{ color: "white" }}>
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
                        <div className="form-control-plaintext" style={{ color: "white" }}>{item.stock_item?.unit || 'N/A'}</div>
                      </div>
                      <div className="col-md-2">
                        <div className="form-control-plaintext" style={{ color: "white" }}>{item.quantity}</div>
                      </div>
                      <div className="col-md-2">
                        <div className="form-control-plaintext" style={{ color: "white" }}>KES {item.unit_price.toFixed(2)}</div>
                      </div>
                      <div className="col-md-1">
                        <div className="form-control-plaintext" style={{ color: "white" }}>KES {item.total_price.toFixed(2)}</div>
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
                                    style={{ 
                                      color: "#000000",
                                      transition: "background-color 0.2s ease"
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = "#f8f9fa"
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = "transparent"
                                    }}
                                  >
                                    <div className="d-flex flex-column">
                                      <div>
                                        <strong style={{ color: "#000000" }}>{stockItem.name}</strong>
                                      </div>
                                      <div className="small" style={{ color: "#6c757d" }}>Code: {stockItem.sku || `STK${stockItem.id.toString().padStart(4, '0')}`}</div>
                                      <div className="small" style={{ color: "#6c757d" }}>
                                        Last Price: KES {lastPurchasePrices[stockItem.id]?.toFixed(2) || stockItem.unit_price?.toFixed(2) || 'N/A'}
                                      </div>
                                    </div>
                                  </a>
                                </li>
                              ))
                            ) : (
                              <li><span className="dropdown-item" style={{ color: "#000000" }}>No items found</span></li>
                            )}
                          </PortalDropdown>
                        </div>
                      </div>
                      <div className="col-md-2">
                        <input
                          type="text"
                          className="form-control border-0 shadow-sm"
                          placeholder="Unit"
                          value={item.stock_item?.unit || ""}
                          readOnly
                          style={{ borderRadius: "16px", height: "45px" }}
                        />
                      </div>
                      <div className="col-md-2">
                        <input
                          type="number"
                          className="form-control border-0 shadow-sm"
                          placeholder="Quantity"
                          min="1"
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
                            const numValue = value === "" ? 1 : parseFloat(value) || 1;
                            updateItem(item.id, 'quantity', numValue);
                          }}
                          style={{ borderRadius: "16px", height: "45px" }}
                        />
                      </div>
                      <div className="col-md-2">
                        <input
                          type="number"
                          className="form-control border-0 shadow-sm"
                          placeholder="Rate"
                          min="0"
                          step="0.01"
                          value={
                            rateInputFocused[item.id]
                              ? (rawRateValues[item.id] ?? "")
                              : (item.unit_price === 0 ? "" : item.unit_price)
                          }
                          onChange={e => {
                            const value = e.target.value;
                            setRawRateValues(prev => ({ ...prev, [item.id]: value }));
                          }}
                          onFocus={e => {
                            setRateInputFocused(prev => ({ ...prev, [item.id]: true }));
                            setRawRateValues(prev => ({ ...prev, [item.id]: "" }));
                            e.target.select();
                          }}
                          onBlur={e => {
                            setRateInputFocused(prev => ({ ...prev, [item.id]: false }));
                            const value = e.target.value;
                            const numValue = value === "" ? 0 : parseFloat(value) || 0;
                            updateItem(item.id, 'unit_price', numValue);
                          }}
                          style={{ borderRadius: "16px", height: "45px" }}
                        />
                      </div>
                      <div className="col-md-1">
                        <span className="fw-bold small" style={{ color: "white" }}>KES {item.total_price.toFixed(2)}</span>
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
              <div className="row">
                <div className="col-md-8"></div>
                <div className="col-md-4">
                  <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                    <span className="fw-bold" style={{ color: "black" }}>Total Amount:</span>
                    <span className="fw-bold fs-5" style={{ color: "black" }}>KES {items.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)}</span>
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
                className="btn-add"
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
  )
}

export default ClientPurchaseModal 