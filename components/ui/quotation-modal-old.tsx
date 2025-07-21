"use client"

import React, { useState, useEffect, useRef } from "react"
import { X, Plus, Trash2, Search, User, Calculator, FileText, ChevronDown, ChevronRight, Package, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import { createPortal } from "react-dom"

interface Client {
  id: number
  name: string
  phone?: string
  location?: string
}

interface StockItem {
  id: number
  name: string
  description?: string
  unit_price: number
  selling_price: number
  unit: string
  category: string
  sku?: string
}

interface QuotationItem {
  id?: number
  category: "cabinet" | "worktop" | "accessories" | "appliances"
  description: string
  unit: string
  quantity: number
  unit_price: number
  total_price: number
  stock_item_id?: number
  stock_item?: StockItem
}

interface QuotationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (quotation: any) => void
  quotation?: any
  mode: "view" | "edit" | "create"
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

// Quotation number generation logic from old implementation
const generateQuotationNumber = () => {
  try {
    const lastNumbers = JSON.parse(localStorage.getItem('lastNumbers') || '{}')
    const currentYear = new Date().getFullYear().toString().slice(-2)
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0')
    
    if (!lastNumbers[currentYear]) {
      lastNumbers[currentYear] = {}
    }
    if (!lastNumbers[currentYear][currentMonth]) {
      lastNumbers[currentYear][currentMonth] = {
        QT: 0,
        lastGenerated: {
          QT: null
        }
      }
    }
    
    if (typeof lastNumbers[currentYear][currentMonth].QT !== 'number') {
      lastNumbers[currentYear][currentMonth].QT = 0
    }
    
    if (!lastNumbers[currentYear][currentMonth].lastGenerated) {
      lastNumbers[currentYear][currentMonth].lastGenerated = {}
    }
    
    const nextNumber = lastNumbers[currentYear][currentMonth].QT + 1
    const formattedNumber = `QT${currentYear}${currentMonth}${nextNumber.toString().padStart(3, '0')}`
    
    lastNumbers[currentYear][currentMonth].lastGenerated.QT = formattedNumber
    localStorage.setItem('lastNumbers', JSON.stringify(lastNumbers))
    
    return formattedNumber
  } catch (error) {
    console.error('Error generating quotation number:', error)
    const timestamp = Date.now()
    const currentYear = new Date().getFullYear().toString().slice(-2)
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0')
    return `QT${currentYear}${currentMonth}${timestamp.toString().slice(-3)}`
  }
}

const confirmQuotationNumber = (quotationNumber: string) => {
  const lastNumbers = JSON.parse(localStorage.getItem('lastNumbers') || '{}')
  const year = quotationNumber.slice(2, 4)
  const month = quotationNumber.slice(4, 6)
  
  if (lastNumbers[year]?.[month]?.lastGenerated?.QT === quotationNumber) {
    lastNumbers[year][month].QT++
    localStorage.setItem('lastNumbers', JSON.stringify(lastNumbers))
    return true
  }
  return false
}

const QuotationModal: React.FC<QuotationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  quotation,
  mode = "create"
}) => {
  const [quotationNumber, setQuotationNumber] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [clientSearchTerm, setClientSearchTerm] = useState("")
  const [showClientResults, setShowClientResults] = useState(false)
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [labourPercentage, setLabourPercentage] = useState(30)
  const [includeWorktop, setIncludeWorktop] = useState(false)
  const [includeAccessories, setIncludeAccessories] = useState(false)
  const [includeAppliances, setIncludeAppliances] = useState(false)
  const [notes, setNotes] = useState("")
  const [termsConditions, setTermsConditions] = useState(
    "1. All work to be completed within agreed timeframe.\n2. Client to provide necessary measurements and specifications.\n3. Final payment due upon completion.\n4. Any changes to the original design may incur additional charges."
  )
  const [loading, setLoading] = useState(false)
  
  // Items state for each section
  const [cabinetItems, setCabinetItems] = useState<QuotationItem[]>([])
  const [worktopItems, setWorktopItems] = useState<QuotationItem[]>([])
  const [accessoriesItems, setAccessoriesItems] = useState<QuotationItem[]>([])
  const [appliancesItems, setAppliancesItems] = useState<QuotationItem[]>([])
  
  // Search states for each section
  const [itemSearches, setItemSearches] = useState<{[key: string]: string}>({})
  const [filteredStockItems, setFilteredStockItems] = useState<{[key: string]: StockItem[]}>({})
  const [itemDropdownVisible, setItemDropdownVisible] = useState<{[key: string]: boolean}>({})
  
  // Client dropdown states
  const [clientDropdownVisible, setClientDropdownVisible] = useState(false)
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  
  // Input handling states for better UX
  const [quantityInputFocused, setQuantityInputFocused] = useState<{[key: string]: boolean}>({})
  const [priceInputFocused, setPriceInputFocused] = useState<{[key: string]: boolean}>({})
  const [rawQuantityValues, setRawQuantityValues] = useState<{[key: string]: string}>({})
  const [rawPriceValues, setRawPriceValues] = useState<{[key: string]: string}>({})
  
  // Refs for dropdown positioning
  const clientInputRef = useRef<HTMLDivElement>(null)
  const itemInputRefs = useRef<{[key: string]: React.RefObject<HTMLDivElement | null>}>({})
  
  // Function to get or create ref for item
  const getItemInputRef = (itemId: string): React.RefObject<HTMLDivElement | null> => {
    if (!itemInputRefs.current[itemId]) {
      itemInputRefs.current[itemId] = { current: null }
    }
    return itemInputRefs.current[itemId]
  }

  useEffect(() => {
    if (isOpen) {
      fetchClients()
      fetchStockItems()
      if (mode === "create") {
        setQuotationNumber(generateQuotationNumber())
        resetForm()
      } else if (quotation) {
        loadQuotationData()
      }
    }
  }, [isOpen, mode, quotation])

  useEffect(() => {
    // Update filtered items when searches change
    const newFilteredItems: {[key: string]: StockItem[]} = {}
    Object.keys(itemSearches).forEach(itemId => {
      const search = itemSearches[itemId]
      if (search.trim() === "") {
        newFilteredItems[itemId] = stockItems
      } else {
        newFilteredItems[itemId] = stockItems.filter(stockItem => 
          stockItem.name.toLowerCase().includes(search.toLowerCase()) ||
          stockItem.description?.toLowerCase().includes(search.toLowerCase()) ||
          stockItem.sku?.toLowerCase().includes(search.toLowerCase())
        )
      }
    })
    setFilteredStockItems(newFilteredItems)
  }, [itemSearches, stockItems])

  // Filter clients based on search
  useEffect(() => {
    if (clientSearchTerm.trim() === "") {
      setFilteredClients(clients)
    } else {
      const filtered = clients.filter(client => 
        client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
        client.phone?.includes(clientSearchTerm) ||
        client.location?.toLowerCase().includes(clientSearchTerm.toLowerCase())
      )
      setFilteredClients(filtered)
    }
  }, [clientSearchTerm, clients])

  const resetForm = () => {
    setSelectedClient(null)
    setClientSearchTerm("")
    setCabinetItems([createNewItem("cabinet")])
    setWorktopItems([])
    setAccessoriesItems([])
    setAppliancesItems([])
    setLabourPercentage(30)
    setIncludeWorktop(false)
    setIncludeAccessories(false)
    setIncludeAppliances(false)
    setNotes("")
    setItemSearches({})
    setItemDropdownVisible({})
    setFilteredStockItems({})
  }

  const createNewItem = (category: "cabinet" | "worktop" | "accessories" | "appliances"): QuotationItem => {
    const newId = Date.now() + Math.random()
    return {
      id: newId,
      category,
      description: "",
      unit: "pieces",
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      stock_item_id: null,
      stock_item: null
    }
  }

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("registered_entities")
        .select("id, name, phone, location")
        .eq("type", "client")
        .order("name")

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error("Error fetching clients:", error)
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

  const loadQuotationData = () => {
    if (!quotation) return
    
      setQuotationNumber(quotation.quotation_number)
      setSelectedClient(quotation.client)
    setLabourPercentage(quotation.labour_percentage || 30)
    setIncludeWorktop(quotation.include_worktop || false)
      setIncludeAccessories(quotation.include_accessories || false)
    setIncludeAppliances(quotation.include_appliances || false)
      setNotes(quotation.notes || "")
      setTermsConditions(quotation.terms_conditions || "")
    
    if (quotation.items && quotation.items.length > 0) {
      const cabinet = quotation.items.filter((item: any) => item.category === "cabinet")
      const worktop = quotation.items.filter((item: any) => item.category === "worktop")
      const accessories = quotation.items.filter((item: any) => item.category === "accessories")
      const appliances = quotation.items.filter((item: any) => item.category === "appliances")
      
      setCabinetItems(cabinet.length > 0 ? cabinet : [createNewItem("cabinet")])
      setWorktopItems(worktop)
      setAccessoriesItems(accessories)
      setAppliancesItems(appliances)
    } else {
      setCabinetItems([createNewItem("cabinet")])
      setWorktopItems([])
      setAccessoriesItems([])
      setAppliancesItems([])
    }
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    client.phone?.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    client.location?.toLowerCase().includes(clientSearchTerm.toLowerCase())
  )

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    setClientSearchTerm(client.name)
    setClientDropdownVisible(false)
  }

  const handleClientSearch = (searchTerm: string) => {
    setClientSearchTerm(searchTerm)
    setClientDropdownVisible(searchTerm.length > 0)
  }

  const addItem = (category: "cabinet" | "worktop" | "accessories" | "appliances") => {
    const newItem = createNewItem(category)
    switch (category) {
      case "cabinet":
        setCabinetItems([...cabinetItems, newItem])
        break
      case "worktop":
        setWorktopItems([...worktopItems, newItem])
        break
      case "accessories":
        setAccessoriesItems([...accessoriesItems, newItem])
        break
      case "appliances":
        setAppliancesItems([...appliancesItems, newItem])
        break
    }
  }

  const removeItem = (category: "cabinet" | "worktop" | "accessories" | "appliances", index: number) => {
    switch (category) {
      case "cabinet":
        if (cabinetItems.length > 1) {
          setCabinetItems(cabinetItems.filter((_, i) => i !== index))
        }
        break
      case "worktop":
        setWorktopItems(worktopItems.filter((_, i) => i !== index))
        break
      case "accessories":
        setAccessoriesItems(accessoriesItems.filter((_, i) => i !== index))
        break
      case "appliances":
        setAppliancesItems(appliancesItems.filter((_, i) => i !== index))
        break
    }
  }

  const updateItem = (category: "cabinet" | "worktop" | "accessories" | "appliances", index: number, field: keyof QuotationItem, value: any) => {
    const updateItems = (items: QuotationItem[]) => {
      return items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value }
          
          if (field === 'stock_item_id') {
            const stockItem = stockItems.find(si => si.id === value)
            updatedItem.stock_item = stockItem || null
            updatedItem.description = stockItem?.name || ""
            updatedItem.unit = stockItem?.unit || "pieces"
            updatedItem.unit_price = stockItem?.selling_price || 0
            updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price
          } else if (field === 'quantity' || field === 'unit_price') {
            updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price
          }
          
          return updatedItem
        }
        return item
      })
    }

    switch (category) {
      case "cabinet":
        setCabinetItems(updateItems(cabinetItems))
        break
      case "worktop":
        setWorktopItems(updateItems(worktopItems))
        break
      case "accessories":
        setAccessoriesItems(updateItems(accessoriesItems))
        break
      case "appliances":
        setAppliancesItems(updateItems(appliancesItems))
        break
    }
  }

  const handleItemSearch = (itemId: string, searchTerm: string) => {
    setItemSearches(prev => ({ ...prev, [itemId]: searchTerm }))
  }

  const toggleItemDropdown = (itemId: string) => {
    setItemDropdownVisible(prev => ({ ...prev, [itemId]: !prev[itemId] }))
  }

  const selectStockItem = (itemId: string, stockItem: StockItem) => {
    // Find which category this item belongs to
    const allItems = [...cabinetItems, ...worktopItems, ...accessoriesItems, ...appliancesItems]
    const item = allItems.find(item => item.id?.toString() === itemId)
    
    if (item) {
      const index = allItems.indexOf(item)
      updateItem(item.category, index, 'stock_item_id', stockItem.id)
    }
    
    setItemSearches(prev => ({ ...prev, [itemId]: stockItem.name }))
    setItemDropdownVisible(prev => ({ ...prev, [itemId]: false }))
  }

  const calculateTotals = () => {
    const cabinetTotal = cabinetItems.reduce((sum, item) => sum + item.total_price, 0)
    const worktopTotal = worktopItems.reduce((sum, item) => sum + item.total_price, 0)
    const accessoriesTotal = accessoriesItems.reduce((sum, item) => sum + item.total_price, 0)
    const appliancesTotal = appliancesItems.reduce((sum, item) => sum + item.total_price, 0)
    
    const subtotal = cabinetTotal + worktopTotal + accessoriesTotal + appliancesTotal
    const labourAmount = (subtotal * labourPercentage) / 100
    const grandTotal = subtotal + labourAmount

    return {
      cabinetTotal,
      worktopTotal,
      accessoriesTotal,
      appliancesTotal,
      subtotal,
      labourAmount,
      grandTotal
    }
  }

  const getFilteredItems = (itemId: string) => {
    return filteredStockItems[itemId] || stockItems
  }

  const handleSave = async () => {
    if (!selectedClient) {
      toast.error("Please select a client")
      return
    }

    if (cabinetItems.length === 0 && worktopItems.length === 0 && accessoriesItems.length === 0 && appliancesItems.length === 0) {
      toast.error("Please add at least one item")
      return
    }

    setLoading(true)
    try {
    const totals = calculateTotals()
      
      // Add labour item to cabinet items if not exists
      let finalCabinetItems = [...cabinetItems]
      const labourItemExists = finalCabinetItems.some(item => item.description.includes("Labour Charge"))
      
      if (!labourItemExists && totals.labourAmount > 0) {
        finalCabinetItems.push({
          id: Date.now() + Math.random(),
          category: "cabinet",
          description: `Labour Charge (${labourPercentage}%)`,
          unit: "sum",
          quantity: 1,
          unit_price: totals.labourAmount,
          total_price: totals.labourAmount,
          stock_item_id: null
        })
      }

    const quotationData = {
      quotation_number: quotationNumber,
      client_id: selectedClient.id,
        date_created: new Date().toISOString(),
      cabinet_total: totals.cabinetTotal,
      worktop_total: totals.worktopTotal,
      accessories_total: totals.accessoriesTotal,
        appliances_total: totals.appliancesTotal,
      labour_percentage: labourPercentage,
        labour_total: totals.labourAmount,
        total_amount: totals.subtotal,
      grand_total: totals.grandTotal,
        include_worktop: includeWorktop,
      include_accessories: includeAccessories,
        include_appliances: includeAppliances,
      status: "pending",
      notes,
      terms_conditions: termsConditions,
        items: [...finalCabinetItems, ...worktopItems, ...accessoriesItems, ...appliancesItems]
      }

      // Confirm quotation number if it's a new quotation
      if (mode === "create") {
        confirmQuotationNumber(quotationNumber)
    }

    onSave(quotationData)
      onClose()
    } catch (error) {
      console.error("Error saving quotation:", error)
      toast.error("Failed to save quotation")
    } finally {
      setLoading(false)
    }
  }

  const totals = calculateTotals()
  const isReadOnly = mode === "view"

  if (!isOpen) return null

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content" style={{ borderRadius: "20px", border: "none", boxShadow: "0 20px 60px rgba(0,0,0,0.1)" }}>
          {/* Header */}
          <div className="modal-header border-0" style={{ padding: "24px 32px 16px" }}>
            <div className="d-flex align-items-center">
              <div className="me-3" style={{ 
                width: "48px", 
                height: "48px", 
                borderRadius: "16px", 
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <FileText size={24} color="white" />
              </div>
              <div>
                <h5 className="modal-title mb-1 fw-bold" style={{ color: "#2c3e50" }}>
                  {mode === "create" ? "New Quotation" : mode === "edit" ? "Edit Quotation" : "View Quotation"}
            </h5>
                <p className="mb-0 text-muted small">Create a detailed quotation for your client</p>
              </div>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              style={{ borderRadius: "12px", padding: "8px" }}
            />
                </div>

          {/* Body */}
          <div className="modal-body" style={{ padding: "0 32px 24px", maxHeight: "70vh", overflowY: "auto" }}>
            {/* Client and Quotation Number Section */}
            <div className="row mb-4">
              <div className="col-md-8">
                <div className="card" style={{ borderRadius: "16px", border: "1px solid #e9ecef", boxShadow: "none" }}>
                  <div className="card-body p-4">
                    <h6 className="card-title mb-3 fw-bold" style={{ color: "#495057" }}>
                      <User size={18} className="me-2" />
                      Client Information
                    </h6>
                    <div className="position-relative" ref={clientInputRef}>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search client..."
                          value={clientSearchTerm}
                          onChange={(e) => handleClientSearch(e.target.value)}
                          onFocus={() => setClientDropdownVisible(true)}
                          style={{ borderRadius: "16px 0 0 16px", height: "45px", paddingLeft: "15px", color: "#000000" }}
                          readOnly={isReadOnly}
                        />
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => setClientDropdownVisible(!clientDropdownVisible)}
                          style={{ borderRadius: "0 16px 16px 0", borderLeft: "none" }}
                          disabled={isReadOnly}
                        >
                          <User size={16} />
                          <ChevronDown size={12} className="ms-1" />
                        </button>
                      </div>
                      
                      <PortalDropdown
                        isVisible={clientDropdownVisible && !isReadOnly}
                        triggerRef={clientInputRef}
                        onClose={() => setClientDropdownVisible(false)}
                      >
                        {filteredClients.slice(0, 5).map(client => (
                          <li
                            key={client.id}
                            style={{
                              padding: "12px 16px",
                              cursor: "pointer",
                              borderBottom: "1px solid #f1f3f4"
                            }}
                            onClick={() => handleClientSelect(client)}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                          >
                            <div style={{ fontWeight: "600", color: "#495057" }}>{client.name}</div>
                            {client.phone && <div style={{ fontSize: "12px", color: "#6c757d" }}>{client.phone}</div>}
                            {client.location && <div style={{ fontSize: "12px", color: "#6c757d" }}>{client.location}</div>}
                          </li>
                        ))}
                        {filteredClients.length === 0 && (
                          <li style={{ padding: "12px 16px", color: "#6c757d", fontStyle: "italic" }}>
                            No clients found
                          </li>
                        )}
                      </PortalDropdown>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-md-4">
                <div className="card" style={{ borderRadius: "16px", border: "1px solid #e9ecef", boxShadow: "none" }}>
                  <div className="card-body p-4">
                    <h6 className="card-title mb-3 fw-bold" style={{ color: "#495057" }}>
                      <FileText size={18} className="me-2" />
                      Quotation Details
                    </h6>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold" style={{ color: "#6c757d" }}>
                        Quotation Number
                      </label>
                    <input
                      type="text"
                        className="form-control"
                        value={quotationNumber}
                      readOnly
                        style={{ borderRadius: "12px", height: "45px", backgroundColor: "#f8f9fa", border: "1px solid #e9ecef" }}
                    />
                  </div>
                    <div>
                      <label className="form-label small fw-semibold" style={{ color: "#6c757d" }}>
                        Date
                      </label>
                      <div className="input-group">
                        <input
                          type="date"
                          className="form-control"
                          value={new Date().toISOString().split('T')[0]}
                          onChange={(e) => {
                            // Handle date change if needed
                          }}
                          style={{ borderRadius: "12px 0 0 12px", height: "45px", border: "1px solid #e9ecef" }}
                          readOnly={isReadOnly}
                        />
                        <span className="input-group-text" style={{ borderRadius: "0 12px 12px 0", borderLeft: "none", backgroundColor: "#f8f9fa" }}>
                          <Calendar size={16} />
                        </span>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              </div>

            {/* Cabinet Items Section */}
            <div className="mb-4">
              <div className="card" style={{ borderRadius: "16px", border: "1px solid #e9ecef", boxShadow: "none" }}>
                <div className="card-body p-4">
                  <h6 className="card-title mb-3 fw-bold" style={{ color: "#495057" }}>
                    <Calculator size={18} className="me-2" />
                    Kitchen Cabinets
                  </h6>
                  
                  <div className="table-responsive" style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid #e9ecef" }}>
                    <table className="table table-sm mb-0">
                      <thead style={{ background: "#f8f9fa" }}>
                        <tr>
                          <th style={{ border: "none", padding: "12px", fontSize: "13px", fontWeight: "600" }}>Description</th>
                          <th style={{ border: "none", padding: "12px", fontSize: "13px", fontWeight: "600" }}>Units</th>
                          <th style={{ border: "none", padding: "12px", fontSize: "13px", fontWeight: "600" }}>Quantity</th>
                          <th style={{ border: "none", padding: "12px", fontSize: "13px", fontWeight: "600" }}>Unit Price</th>
                          <th style={{ border: "none", padding: "12px", fontSize: "13px", fontWeight: "600" }}>Total</th>
                          {!isReadOnly && <th style={{ border: "none", padding: "12px", fontSize: "13px", fontWeight: "600" }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                        {cabinetItems.map((item, index) => (
                          <tr key={item.id} style={{ borderBottom: "1px solid #f1f3f4" }}>
                            <td style={{ padding: "12px" }}>
                              <div className="position-relative">
                          <input
                            type="text"
                            className="form-control border-0"
                            value={item.description}
                                  onChange={(e) => updateItem("cabinet", index, "description", e.target.value)}
                            readOnly={isReadOnly}
                                  style={{ background: "transparent", fontSize: "13px" }}
                                  placeholder="Enter description or search stock items"
                                />
                                {!isReadOnly && (
                                  <div className="position-absolute top-0 end-0 h-100 d-flex align-items-center pe-2">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-secondary"
                                      onClick={() => toggleItemDropdown(item.id?.toString() || "")}
                                      style={{ borderRadius: "8px", padding: "4px 8px" }}
                                    >
                                      <Search size={12} />
                                    </button>
                                  </div>
                                )}
                                {itemDropdownVisible[item.id?.toString() || ""] && !isReadOnly && (
                                  <div className="position-absolute top-100 start-0 w-100 mt-1" style={{ zIndex: 1000 }}>
                                    <div className="card" style={{ borderRadius: "8px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
                                      <div className="card-body p-2">
                                        <input
                                          type="text"
                                          className="form-control form-control-sm mb-2"
                                          placeholder="Search stock items..."
                                          value={itemSearches[item.id?.toString() || ""] || ""}
                                          onChange={(e) => handleItemSearch(item.id?.toString() || "", e.target.value)}
                                          style={{ borderRadius: "8px" }}
                                        />
                                        <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                                          {getFilteredItems(item.id?.toString() || "").map(stockItem => (
                                            <div
                                              key={stockItem.id}
                                              className="p-2 border-bottom cursor-pointer"
                                              style={{ cursor: "pointer" }}
                                              onClick={() => selectStockItem(item.id?.toString() || "", stockItem)}
                                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                            >
                                              <div className="fw-semibold small">{stockItem.name}</div>
                                              <div className="text-muted small">
                                                Selling Price: KES {stockItem.selling_price?.toFixed(2) || stockItem.unit_price?.toFixed(2)}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                        </td>
                            <td style={{ padding: "12px" }}>
                          <input
                            type="text"
                            className="form-control border-0"
                            value={item.unit}
                                onChange={(e) => updateItem("cabinet", index, "unit", e.target.value)}
                            readOnly={isReadOnly}
                                style={{ background: "transparent", fontSize: "13px" }}
                                placeholder="e.g., pcs"
                          />
                        </td>
                            <td style={{ padding: "12px" }}>
                          <input
                            type="number"
                            className="form-control border-0"
                            value={item.quantity}
                                onChange={(e) => updateItem("cabinet", index, "quantity", parseFloat(e.target.value) || 0)}
                            readOnly={isReadOnly}
                                style={{ background: "transparent", fontSize: "13px" }}
                                min="0"
                                step="0.01"
                          />
                        </td>
                            <td style={{ padding: "12px" }}>
                          <input
                            type="number"
                            className="form-control border-0"
                            value={item.unit_price}
                                onChange={(e) => updateItem("cabinet", index, "unit_price", parseFloat(e.target.value) || 0)}
                            readOnly={isReadOnly}
                                style={{ background: "transparent", fontSize: "13px" }}
                                min="0"
                                step="0.01"
                          />
                        </td>
                            <td style={{ padding: "12px", fontWeight: "600", color: "#495057" }}>
                              KES {item.total_price.toFixed(2)}
                            </td>
                        {!isReadOnly && (
                              <td style={{ padding: "12px" }}>
                            <button
                              type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => removeItem("cabinet", index)}
                                  style={{ borderRadius: "8px", padding: "4px 8px" }}
                            >
                                  <Trash2 size={12} />
                            </button>
                          </td>
                        )}
                      </tr>
                        ))}
                </tbody>
                      <tfoot style={{ background: "#f8f9fa" }}>
                        <tr>
                          <td colSpan={isReadOnly ? 4 : 5} style={{ padding: "12px", fontWeight: "600" }}>
                            Cabinet Total
                          </td>
                          <td style={{ padding: "12px", fontWeight: "700", color: "#495057" }}>
                            KES {totals.cabinetTotal.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  
                      {!isReadOnly && (
                    <div className="mt-3">
                        <button
                          type="button"
                        className="btn btn-outline-primary"
                          onClick={() => addItem("cabinet")}
                        style={{ borderRadius: "12px", fontSize: "13px" }}
                        >
                        <Plus size={16} className="me-2" />
                          Add Cabinet Item
                        </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

              {/* Worktop Section */}
            <div className="mb-4">
              <div className="card" style={{ borderRadius: "16px", border: "1px solid #e9ecef", boxShadow: "none" }}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="card-title mb-0 fw-bold" style={{ color: "#495057" }}>
                      <Calculator size={18} className="me-2" />
                      Worktop
                    </h6>
                    {!isReadOnly && (
                      <div className="d-flex align-items-center gap-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={includeWorktop}
                            onChange={(e) => setIncludeWorktop(e.target.checked)}
                            style={{ borderRadius: "4px" }}
                          />
                          <label className="form-check-label small">Include Worktop</label>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => addItem("worktop")}
                          style={{ borderRadius: "12px", fontSize: "12px" }}
                        >
                          <Plus size={14} className="me-1" />
                          Add Item
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {includeWorktop && (
                    <div className="table-responsive" style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid #e9ecef" }}>
                      <table className="table table-sm mb-0">
                        <thead style={{ background: "#f8f9fa" }}>
                          <tr>
                            <th style={{ border: "none", padding: "12px", fontSize: "13px", fontWeight: "600" }}>Description</th>
                            <th style={{ border: "none", padding: "12px", fontSize: "13px", fontWeight: "600" }}>Units</th>
                            <th style={{ border: "none", padding: "12px", fontSize: "13px", fontWeight: "600" }}>Quantity</th>
                            <th style={{ border: "none", padding: "12px", fontSize: "13px", fontWeight: "600" }}>Unit Price</th>
                            <th style={{ border: "none", padding: "12px", fontSize: "13px", fontWeight: "600" }}>Total</th>
                            {!isReadOnly && <th style={{ border: "none", padding: "12px", fontSize: "13px", fontWeight: "600" }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                          {worktopItems.map((item, index) => (
                            <tr key={item.id} style={{ borderBottom: "1px solid #f1f3f4" }}>
                              <td style={{ padding: "12px" }}>
                                <div className="position-relative">
                          <input
                            type="text"
                            className="form-control border-0"
                            value={item.description}
                                    onChange={(e) => updateItem("worktop", index, "description", e.target.value)}
                            readOnly={isReadOnly}
                                    style={{ background: "transparent", fontSize: "13px" }}
                                    placeholder="Enter description or search stock items"
                                  />
                                  {!isReadOnly && (
                                    <div className="position-absolute top-0 end-0 h-100 d-flex align-items-center pe-2">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => toggleItemDropdown(item.id?.toString() || "")}
                                        style={{ borderRadius: "8px", padding: "4px 8px" }}
                                      >
                                        <Search size={12} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                        </td>
                              <td style={{ padding: "12px" }}>
                          <input
                            type="text"
                            className="form-control border-0"
                            value={item.unit}
                                  onChange={(e) => updateItem("worktop", index, "unit", e.target.value)}
                            readOnly={isReadOnly}
                                  style={{ background: "transparent", fontSize: "13px" }}
                                  placeholder="e.g., pcs"
                          />
                        </td>
                              <td style={{ padding: "12px" }}>
                          <input
                            type="number"
                            className="form-control border-0"
                            value={item.quantity}
                                  onChange={(e) => updateItem("worktop", index, "quantity", parseFloat(e.target.value) || 0)}
                            readOnly={isReadOnly}
                                  style={{ background: "transparent", fontSize: "13px" }}
                                  min="0"
                                  step="0.01"
                          />
                        </td>
                              <td style={{ padding: "12px" }}>
                          <input
                            type="number"
                            className="form-control border-0"
                            value={item.unit_price}
                                  onChange={(e) => updateItem("worktop", index, "unit_price", parseFloat(e.target.value) || 0)}
                            readOnly={isReadOnly}
                                  style={{ background: "transparent", fontSize: "13px" }}
                                  min="0"
                                  step="0.01"
                          />
                        </td>
                              <td style={{ padding: "12px", fontWeight: "600", color: "#495057" }}>
                                KES {item.total_price.toFixed(2)}
                              </td>
                        {!isReadOnly && (
                                <td style={{ padding: "12px" }}>
                            <button
                              type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => removeItem("worktop", index)}
                                    style={{ borderRadius: "8px", padding: "4px 8px" }}
                            >
                                    <Trash2 size={12} />
                            </button>
                          </td>
                        )}
                      </tr>
                          ))}
                          {worktopItems.length === 0 && (
                            <tr>
                              <td colSpan={isReadOnly ? 5 : 6} className="text-center text-muted py-4">
                                No worktop items added
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot style={{ background: "#f8f9fa" }}>
                          <tr>
                            <td colSpan={isReadOnly ? 4 : 5} style={{ padding: "12px", fontWeight: "600" }}>
                              Worktop Total
                    </td>
                            <td style={{ padding: "12px", fontWeight: "700", color: "#495057" }}>
                              KES {totals.worktopTotal.toFixed(2)}
                            </td>
                  </tr>
                </tfoot>
              </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

              {/* Accessories Section */}
            <div className="mb-4">
              <div className="card" style={{ borderRadius: "16px", border: "1px solid #e9ecef", boxShadow: "none" }}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="card-title mb-0 fw-bold" style={{ color: "#495057" }}>
                      <Calculator size={18} className="me-2" />
                Accessories
                    </h6>
                {!isReadOnly && (
                      <div className="d-flex align-items-center gap-3">
                        <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={includeAccessories}
                      onChange={(e) => setIncludeAccessories(e.target.checked)}
                            style={{ borderRadius: "4px" }}
                          />
                          <label className="form-check-label small">Include Accessories</label>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => addItem("accessories")}
                          style={{ borderRadius: "12px", fontSize: "12px" }}
                        >
                          <Plus size={14} className="me-1" />
                          Add Item
                        </button>
                  </div>
                )}
              </div>
                  
                  {includeAccessories && (
                    <div className="table-responsive" style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid #e9ecef" }}>
                      <table className="table table-sm mb-0">
                        <thead style={{ background: "#f8f9fa" }}>
                          <tr>
                            <th style={{ border: "none", padding: "12px", fontSize: "13px", fontWeight: "600" }}>Description</th>
                            <th style={{ border: "none", padding: "12px", fontSize: "13px", fontWeight: "600" }}>Units</th>
                            <th style={{ border: "none", padding: "12px", fontSize: "13px", fontWeight: "600" }}>Quantity</th>
                            <th style={{ border: "none", padding: "12px", fontSize: "13px", fontWeight: "600" }}>Unit Price</th>
                            <th style={{ border: "none", padding: "12px", fontSize: "13px", fontWeight: "600" }}>Total</th>
                            {!isReadOnly && <th style={{ border: "none", padding: "12px", fontSize: "13px", fontWeight: "600" }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                          {accessoriesItems.map((item, index) => (
                            <tr key={item.id} style={{ borderBottom: "1px solid #f1f3f4" }}>
                              <td style={{ padding: "12px" }}>
                                <div className="position-relative">
                          <input
                            type="text"
                            className="form-control border-0"
                            value={item.description}
                                    onChange={(e) => updateItem("accessories", index, "description", e.target.value)}
                            readOnly={isReadOnly}
                                    style={{ background: "transparent", fontSize: "13px" }}
                                    placeholder="Enter description or search stock items"
                                  />
                                  {!isReadOnly && (
                                    <div className="position-absolute top-0 end-0 h-100 d-flex align-items-center pe-2">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => toggleItemDropdown(item.id?.toString() || "")}
                                        style={{ borderRadius: "8px", padding: "4px 8px" }}
                                      >
                                        <Search size={12} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                        </td>
                              <td style={{ padding: "12px" }}>
                          <input
                            type="text"
                            className="form-control border-0"
                            value={item.unit}
                                  onChange={(e) => updateItem("accessories", index, "unit", e.target.value)}
                            readOnly={isReadOnly}
                                  style={{ background: "transparent", fontSize: "13px" }}
                                  placeholder="e.g., pcs"
                          />
                        </td>
                              <td style={{ padding: "12px" }}>
                          <input
                            type="number"
                            className="form-control border-0"
                            value={item.quantity}
                                  onChange={(e) => updateItem("accessories", index, "quantity", parseFloat(e.target.value) || 0)}
                            readOnly={isReadOnly}
                                  style={{ background: "transparent", fontSize: "13px" }}
                                  min="0"
                                  step="0.01"
                          />
                        </td>
                              <td style={{ padding: "12px" }}>
                          <input
                            type="number"
                            className="form-control border-0"
                            value={item.unit_price}
                                  onChange={(e) => updateItem("accessories", index, "unit_price", parseFloat(e.target.value) || 0)}
                            readOnly={isReadOnly}
                                  style={{ background: "transparent", fontSize: "13px" }}
                                  min="0"
                                  step="0.01"
                          />
                        </td>
                              <td style={{ padding: "12px", fontWeight: "600", color: "#495057" }}>
                                KES {item.total_price.toFixed(2)}
                              </td>
                        {!isReadOnly && (
                                <td style={{ padding: "12px" }}>
                            <button
                              type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => removeItem("accessories", index)}
                                    style={{ borderRadius: "8px", padding: "4px 8px" }}
                            >
                                    <Trash2 size={12} />
                            </button>
                          </td>
                        )}
                      </tr>
                          ))}
                          {accessoriesItems.length === 0 && (
                            <tr>
                              <td colSpan={isReadOnly ? 5 : 6} className="text-center text-muted py-4">
                                No accessories items added
                              </td>
                            </tr>
                          )}
                </tbody>
                        <tfoot style={{ background: "#f8f9fa" }}>
                          <tr>
                            <td colSpan={isReadOnly ? 4 : 5} style={{ padding: "12px", fontWeight: "600" }}>
                              Accessories Total
                            </td>
                            <td style={{ padding: "12px", fontWeight: "700", color: "#495057" }}>
                              KES {totals.accessoriesTotal.toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Appliances Section */}
            <div className="mb-4">
              <div className="card" style={{ borderRadius: "16px", border: "1px solid #e9ecef", boxShadow: "none" }}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="card-title mb-0 fw-bold" style={{ color: "#495057" }}>
                      <Calculator size={18} className="me-2" />
                      Appliances
                    </h6>
                      {!isReadOnly && (
                      <div className="d-flex align-items-center gap-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={includeAppliances}
                            onChange={(e) => setIncludeAppliances(e.target.checked)}
                            style={{ borderRadius: "4px" }}
                          />
                          <label className="form-check-label small">Include Appliances</label>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => addItem("appliances")}
                          style={{ borderRadius: "12px", fontSize: "12px" }}
                        >
                          <Plus size={14} className="me-1" />
                          Add Item
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {includeAppliances && (
                    <div className="table-responsive" style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid #e9ecef" }}>
                      <table className="table table-sm mb-0">
                        <thead style={{ background: "#f8f9fa" }}>
                          <tr>
                            <th style={{ border: "none", padding: "12px", fontSize: "13px", fontWeight: "600" }}>Description</th>
                            <th style={{ border: "none", padding: "12px", fontSize: "13px", fontWeight: "600" }}>Units</th>
                            <th style={{ border: "none", padding: "12px", fontSize: "13px", fontWeight: "600" }}>Quantity</th>
                            <th style={{ border: "none", padding: "12px", fontSize: "13px", fontWeight: "600" }}>Unit Price</th>
                            <th style={{ border: "none", padding: "12px", fontSize: "13px", fontWeight: "600" }}>Total</th>
                            {!isReadOnly && <th style={{ border: "none", padding: "12px", fontSize: "13px", fontWeight: "600" }}>Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {appliancesItems.map((item, index) => (
                            <tr key={item.id} style={{ borderBottom: "1px solid #f1f3f4" }}>
                              <td style={{ padding: "12px" }}>
                                <div className="position-relative">
                                  <input
                                    type="text"
                                    className="form-control border-0"
                                    value={item.description}
                                    onChange={(e) => updateItem("appliances", index, "description", e.target.value)}
                                    readOnly={isReadOnly}
                                    style={{ background: "transparent", fontSize: "13px" }}
                                    placeholder="Enter description or search stock items"
                                  />
                                  {!isReadOnly && (
                                    <div className="position-absolute top-0 end-0 h-100 d-flex align-items-center pe-2">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => toggleItemDropdown(item.id?.toString() || "")}
                                        style={{ borderRadius: "8px", padding: "4px 8px" }}
                                      >
                                        <Search size={12} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td style={{ padding: "12px" }}>
                                <input
                                  type="text"
                                  className="form-control border-0"
                                  value={item.unit}
                                  onChange={(e) => updateItem("appliances", index, "unit", e.target.value)}
                                  readOnly={isReadOnly}
                                  style={{ background: "transparent", fontSize: "13px" }}
                                  placeholder="e.g., pcs"
                                />
                              </td>
                              <td style={{ padding: "12px" }}>
                      <input
                        type="number"
                        className="form-control border-0"
                                  value={item.quantity}
                                  onChange={(e) => updateItem("appliances", index, "quantity", parseFloat(e.target.value) || 0)}
                        readOnly={isReadOnly}
                                  style={{ background: "transparent", fontSize: "13px" }}
                                  min="0"
                                  step="0.01"
                      />
                    </td>
                              <td style={{ padding: "12px" }}>
                                <input
                                  type="number"
                                  className="form-control border-0"
                                  value={item.unit_price}
                                  onChange={(e) => updateItem("appliances", index, "unit_price", parseFloat(e.target.value) || 0)}
                                  readOnly={isReadOnly}
                                  style={{ background: "transparent", fontSize: "13px" }}
                                  min="0"
                                  step="0.01"
                                />
                              </td>
                              <td style={{ padding: "12px", fontWeight: "600", color: "#495057" }}>
                                KES {item.total_price.toFixed(2)}
                              </td>
                              {!isReadOnly && (
                                <td style={{ padding: "12px" }}>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => removeItem("appliances", index)}
                                    style={{ borderRadius: "8px", padding: "4px 8px" }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </td>
                              )}
                  </tr>
                          ))}
                          {appliancesItems.length === 0 && (
                            <tr>
                              <td colSpan={isReadOnly ? 5 : 6} className="text-center text-muted py-4">
                                No appliances items added
                              </td>
                  </tr>
                          )}
                </tbody>
                        <tfoot style={{ background: "#f8f9fa" }}>
                          <tr>
                            <td colSpan={isReadOnly ? 4 : 5} style={{ padding: "12px", fontWeight: "600" }}>
                              Appliances Total
                            </td>
                            <td style={{ padding: "12px", fontWeight: "700", color: "#495057" }}>
                              KES {totals.appliancesTotal.toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
              </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Labour Section */}
            <div className="mb-4">
              <div className="card" style={{ borderRadius: "16px", border: "1px solid #e9ecef", boxShadow: "none" }}>
                <div className="card-body p-4">
                  <h6 className="card-title mb-3 fw-bold" style={{ color: "#495057" }}>
                    <Calculator size={18} className="me-2" />
                    Labour Charges
                  </h6>
                  <div className="row">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold" style={{ color: "#6c757d" }}>
                        Labour Percentage
                      </label>
                      <div className="input-group">
                        <input
                          type="number"
                className="form-control"
                          value={labourPercentage}
                          onChange={(e) => setLabourPercentage(parseFloat(e.target.value) || 0)}
                readOnly={isReadOnly}
                          style={{ borderRadius: "12px 0 0 12px", height: "45px" }}
                          min="0"
                          max="100"
                          step="0.01"
                        />
                        <span className="input-group-text" style={{ borderRadius: "0 12px 12px 0", borderLeft: "none" }}>
                          %
                        </span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold" style={{ color: "#6c757d" }}>
                        Labour Amount
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={`KES ${totals.labourAmount.toFixed(2)}`}
                        readOnly
                        style={{ borderRadius: "12px", height: "45px", backgroundColor: "#f8f9fa", border: "1px solid #e9ecef" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes and Terms */}
            <div className="row mb-4">
              <div className="col-md-6">
                <div className="card" style={{ borderRadius: "16px", border: "1px solid #e9ecef", boxShadow: "none" }}>
                  <div className="card-body p-4">
                    <h6 className="card-title mb-3 fw-bold" style={{ color: "#495057" }}>
                      <FileText size={18} className="me-2" />
                      Notes
                    </h6>
              <textarea
                className="form-control"
                      rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                readOnly={isReadOnly}
                      style={{ borderRadius: "12px", border: "1px solid #e9ecef", resize: "none" }}
                      placeholder="Add any additional notes..."
              />
          </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card" style={{ borderRadius: "16px", border: "1px solid #e9ecef", boxShadow: "none" }}>
                  <div className="card-body p-4">
                    <h6 className="card-title mb-3 fw-bold" style={{ color: "#495057" }}>
                      <FileText size={18} className="me-2" />
                      Terms & Conditions
                    </h6>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={termsConditions}
                      onChange={(e) => setTermsConditions(e.target.value)}
                      readOnly={isReadOnly}
                      style={{ borderRadius: "12px", border: "1px solid #e9ecef", resize: "none" }}
                      placeholder="Enter terms and conditions..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="card" style={{ borderRadius: "16px", border: "1px solid #e9ecef", boxShadow: "none" }}>
              <div className="card-body p-4">
                <h6 className="card-title mb-3 fw-bold" style={{ color: "#495057" }}>
                  <Calculator size={18} className="me-2" />
                  Summary
                </h6>
                <div className="row">
                  <div className="col-md-8">
                    <div className="d-flex justify-content-between mb-2">
                      <strong style={{ fontSize: "14px" }}>Cabinet Total:</strong>
                      <span style={{ fontSize: "14px" }}>KES {totals.cabinetTotal.toFixed(2)}</span>
                    </div>
                    {includeWorktop && (
                      <div className="d-flex justify-content-between mb-2">
                        <strong style={{ fontSize: "14px" }}>Worktop Total:</strong>
                        <span style={{ fontSize: "14px" }}>KES {totals.worktopTotal.toFixed(2)}</span>
                      </div>
                    )}
                    {includeAccessories && (
                      <div className="d-flex justify-content-between mb-2">
                        <strong style={{ fontSize: "14px" }}>Accessories Total:</strong>
                        <span style={{ fontSize: "14px" }}>KES {totals.accessoriesTotal.toFixed(2)}</span>
                      </div>
                    )}
                    {includeAppliances && (
                      <div className="d-flex justify-content-between mb-2">
                        <strong style={{ fontSize: "14px" }}>Appliances Total:</strong>
                        <span style={{ fontSize: "14px" }}>KES {totals.appliancesTotal.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="d-flex justify-content-between mb-2">
                      <strong style={{ fontSize: "14px" }}>Labour:</strong>
                      <span style={{ fontSize: "14px" }}>KES {totals.labourAmount.toFixed(2)}</span>
                    </div>
                    <hr style={{ margin: "12px 0" }} />
                    <div className="d-flex justify-content-between">
                      <strong style={{ fontSize: "16px", color: "#495057" }}>Grand Total:</strong>
                      <span style={{ fontSize: "18px", fontWeight: "700", color: "#495057" }}>
                        KES {totals.grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer border-0" style={{ padding: "16px 32px 24px" }}>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onClose}
              style={{ borderRadius: "12px", padding: "10px 20px" }}
            >
              Cancel
            </button>
            {!isReadOnly && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
                disabled={loading}
                style={{ 
                  borderRadius: "12px", 
                  padding: "10px 24px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none"
                }}
              >
                {loading ? "Saving..." : mode === "create" ? "Create Quotation" : "Update Quotation"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuotationModal 