"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { X, Plus, Trash2, Search, User, Calculator, FileText, ChevronDown, ChevronRight, Package, Calendar, Download, CreditCard } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import { createPortal } from "react-dom"
import jsPDF from "jspdf"
import "jspdf-autotable"
import type { QuotationData } from '@/lib/pdf-template';

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
  unit: string
  category: string
  sku?: string
}

interface QuotationItem {
  id?: number
  category: "cabinet" | "worktop" | "accessories" | "appliances" | "wardrobes" | "tvunit"
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
  onProceedToSalesOrder?: (quotation: any) => Promise<void>
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

// Quotation number generation logic (now using Supabase, not localStorage)
const generateQuotationNumber = async () => {
  try {
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    // Query Supabase for the latest quotation number for this year/month
    const { data, error } = await supabase
      .from("quotations")
      .select("quotation_number")
      .ilike("quotation_number", `QT${year}${month}%`)
      .order("quotation_number", { ascending: false })
      .limit(1)
    if (error) throw error
    let nextNumber = 1
    if (data && data.length > 0) {
      const match = data[0].quotation_number.match(/QT\d{4}(\d{3})/)
      if (match) {
        nextNumber = parseInt(match[1]) + 1
      }
    }
    return `QT${year}${month}${nextNumber.toString().padStart(3, '0')}`
  } catch (error) {
    const timestamp = Date.now().toString().slice(-3)
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    return `QT${year}${month}${timestamp}`
  }
}

const QuotationModal: React.FC<QuotationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  quotation,
  mode = "create",
  onProceedToSalesOrder
}) => {
  const [quotationNumber, setQuotationNumber] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [clientSearchTerm, setClientSearchTerm] = useState("")
  const [clientDropdownVisible, setClientDropdownVisible] = useState(false)
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [labourPercentage, setLabourPercentage] = useState(30)
  const [includeWorktop, setIncludeWorktop] = useState(false)
  const [includeAccessories, setIncludeAccessories] = useState(false)
  const [includeAppliances, setIncludeAppliances] = useState(false)
  const [includeWardrobes, setIncludeWardrobes] = useState(false)
  const [includeTvUnit, setIncludeTvUnit] = useState(false)
  const [notes, setNotes] = useState("")
  const [termsConditions, setTermsConditions] = useState(
    "1. All work to be completed within agreed timeframe.\n2. Client to provide necessary measurements and specifications.\n3. Final payment due upon completion.\n4. Any changes to the original design may incur additional charges."
  )
  const [loading, setLoading] = useState(false)
  
  // PDF viewing state
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  
  // Payment tracking state
  const [totalPaid, setTotalPaid] = useState(0)
  const [hasPayments, setHasPayments] = useState(false)
  const [paymentPercentage, setPaymentPercentage] = useState(0)
  
  // Custom section names state
  const [sectionNames, setSectionNames] = useState({
    cabinet: "General",
    worktop: "Worktop",
    accessories: "Accessories",
    appliances: "Appliances",
    wardrobes: "Wardrobes",
    tvunit: "TV Unit"
  })
  
  // Section name editing state
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editingSectionName, setEditingSectionName] = useState("")
  
  // Items state for each section
  const [cabinetItems, setCabinetItems] = useState<QuotationItem[]>([])
  const [worktopItems, setWorktopItems] = useState<QuotationItem[]>([])
  const [accessoriesItems, setAccessoriesItems] = useState<QuotationItem[]>([])
  const [appliancesItems, setAppliancesItems] = useState<QuotationItem[]>([])
  const [wardrobesItems, setWardrobesItems] = useState<QuotationItem[]>([])
  const [tvUnitItems, setTvUnitItems] = useState<QuotationItem[]>([])
  
  // Search states for each section
  const [itemSearches, setItemSearches] = useState<{[key: string]: string}>({})
  const [filteredStockItems, setFilteredStockItems] = useState<{[key: string]: StockItem[]}>({})
  const [itemDropdownVisible, setItemDropdownVisible] = useState<{[key: string]: boolean}>({})
  
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

  // Function to handle section name editing
  const handleSectionNameEdit = (sectionKey: string) => {
    setEditingSection(sectionKey)
    setEditingSectionName(sectionNames[sectionKey as keyof typeof sectionNames])
  }

  const handleSectionNameSave = (sectionKey: string) => {
    if (editingSectionName.trim()) {
      setSectionNames(prev => ({
        ...prev,
        [sectionKey]: editingSectionName.trim()
      }))
    }
    setEditingSection(null)
    setEditingSectionName("")
  }

  const handleSectionNameCancel = () => {
    setEditingSection(null)
    setEditingSectionName("")
  }

  const handleSectionNameKeyPress = (e: React.KeyboardEvent, sectionKey: string) => {
    if (e.key === 'Enter') {
      handleSectionNameSave(sectionKey)
    } else if (e.key === 'Escape') {
      handleSectionNameCancel()
    }
  }

  // Editable Section Header Component
  const EditableSectionHeader = ({ sectionKey, currentName, onEdit, onSave, onCancel, onKeyPress, isEditing, editingName, onEditingNameChange, isReadOnly }: {
    sectionKey: string
    currentName: string
    onEdit: () => void
    onSave: () => void
    onCancel: () => void
    onKeyPress: (e: React.KeyboardEvent) => void
    isEditing: boolean
    editingName: string
    onEditingNameChange: (value: string) => void
    isReadOnly: boolean
  }) => {
    if (isEditing) {
      return (
        <div className="d-flex align-items-center">
          <input
            type="text"
            value={editingName}
            onChange={(e) => onEditingNameChange(e.target.value)}
            onKeyDown={onKeyPress}
            onBlur={onSave}
            autoFocus
            style={{
              background: "transparent",
              border: "none",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: "bold",
              outline: "none",
              borderBottom: "2px solid #ffffff",
              padding: "2px 4px",
              marginRight: "8px"
            }}
          />
          <button
            type="button"
            onClick={onSave}
            style={{
              background: "none",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              fontSize: "12px",
              padding: "2px 6px",
              marginRight: "4px"
            }}
          >
            ✓
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: "none",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              fontSize: "12px",
              padding: "2px 6px"
            }}
          >
            ✕
          </button>
        </div>
      )
    }

    return (
      <div 
        className="d-flex align-items-center"
        style={{ cursor: isReadOnly ? "default" : "pointer" }}
        onClick={() => !isReadOnly && onEdit()}
        title={isReadOnly ? "" : "Click to edit section name"}
      >
        <span className="fw-bold" style={{ color: "#ffffff" }}>
          {currentName}
        </span>
        {!isReadOnly && (
          <span 
            style={{ 
              color: "#ffffff", 
              fontSize: "12px", 
              marginLeft: "8px",
              opacity: 0.7 
            }}
          >
            ✏️
          </span>
        )}
      </div>
    )
  }

  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);

  // Add state at the top of QuotationModal:
  const [worktopLaborQty, setWorktopLaborQty] = useState(1);
  const [worktopLaborUnitPrice, setWorktopLaborUnitPrice] = useState(3000);

  // Add state for raw editing values for Worktop Installation Labor
  const [rawWorktopLaborQty, setRawWorktopLaborQty] = useState<string | undefined>(undefined);
  const [rawWorktopLaborUnitPrice, setRawWorktopLaborUnitPrice] = useState<string | undefined>(undefined);

  // Function to fetch payment information
  const fetchPaymentInfo = async () => {
    if (!quotation?.quotation_number) return;
    
    try {
      // First, check all payments for this quotation regardless of status - check both fields
      const { data: allPayments } = await supabase
        .from("payments")
        .select("*")
        .or(`quotation_number.eq.${quotation.quotation_number},paid_to.eq.${quotation.quotation_number}`)

      // Then get only completed payments - check both quotation_number and paid_to fields
      const { data: payments } = await supabase
        .from("payments")
        .select("amount, status")
        .or(`quotation_number.eq.${quotation.quotation_number},paid_to.eq.${quotation.quotation_number}`)
        .eq("status", "completed")
      
      const totalPaidAmount = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
      const hasPaymentsValue = totalPaidAmount > 0
      const paymentPercentageValue = quotation.grand_total > 0 ? (totalPaidAmount / quotation.grand_total) * 100 : 0
      
      // Enhanced debug logging for payment detection
      console.log('Payment Info Debug:', {
        quotation_number: quotation.quotation_number,
        quotation_status: quotation.status,
        all_payments_found: allPayments?.length || 0,
        all_payments_details: allPayments || [],
        completed_payments_found: payments?.length || 0,
        completed_payments_details: payments || [],
        total_paid: totalPaidAmount,
        has_payments: hasPaymentsValue,
        payment_percentage: paymentPercentageValue,
        grand_total: quotation.grand_total
      })
      
      // Also check if there are payments with different quotation_number formats
      const { data: similarPayments } = await supabase
        .from("payments")
        .select("*")
        .ilike("quotation_number", `%${quotation.quotation_number.slice(-4)}%`)
      
      if (similarPayments && similarPayments.length > 0) {
        console.log('Similar Payment Numbers Found:', similarPayments)
      }
      
      setTotalPaid(totalPaidAmount)
      setHasPayments(hasPaymentsValue)
      setPaymentPercentage(paymentPercentageValue)
    } catch (error) {
      console.error("Error fetching payment info:", error)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchClients()
      fetchStockItems()
      if (mode === "create") {
        generateQuotationNumber().then(setQuotationNumber)
        resetForm()
        setQuotationDate(new Date().toISOString().split('T')[0])
      } else if (quotation) {
        loadQuotationData()
        fetchPaymentInfo() // Fetch payment info when viewing/editing quotation
        if (quotation.date_created) {
          setQuotationDate(quotation.date_created.split('T')[0])
        }
      }
    }
    // Real-time subscription for stock_items and payments
    const stockItemsChannel = supabase
      .channel('stock_items_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_items' }, (payload) => {
        fetchStockItems();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, (payload) => {
        fetchPaymentInfo(); // Refresh payment info when payments change
      })
      .subscribe();
    return () => {
      supabase.removeChannel(stockItemsChannel);
    };
  }, [isOpen, mode, quotation]);

  useEffect(() => {
    // Debounce expensive filtering operations to prevent main thread blocking
    const timeoutId = setTimeout(() => {
      const newFilteredItems: {[key: string]: StockItem[]} = {}
      Object.keys(itemSearches).forEach(itemId => {
        const search = itemSearches[itemId]
        if (search.trim() === "") {
          newFilteredItems[itemId] = stockItems
        } else {
          // Optimize filtering by pre-converting to lowercase once
          const searchLower = search.toLowerCase()
          newFilteredItems[itemId] = stockItems.filter(stockItem => {
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
    }, 150) // 150ms debounce to prevent blocking

    return () => clearTimeout(timeoutId)
  }, [itemSearches, stockItems])

  // Filter clients based on search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (clientSearchTerm.trim() === "") {
        setFilteredClients(clients)
      } else {
        // Optimize client filtering
        const searchLower = clientSearchTerm.toLowerCase()
        const filtered = clients.filter(client => {
          const nameLower = client.name.toLowerCase()
          const locationLower = client.location?.toLowerCase() || ""
          return nameLower.includes(searchLower) ||
                 client.phone?.includes(clientSearchTerm) ||
                 locationLower.includes(searchLower)
        })
        setFilteredClients(filtered)
      }
    }, 150) // 150ms debounce

    return () => clearTimeout(timeoutId)
  }, [clientSearchTerm, clients])

  // Generate PDF for viewing when modal opens in view mode
  useEffect(() => {
    if (isOpen && mode === "view" && quotation) {
      generatePDFForViewing();
    }
    
    // Cleanup PDF URL when component unmounts or modal closes
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    }
  }, [isOpen, mode, quotation?.id]);

  const resetForm = () => {
    setSelectedClient(null)
    setClientSearchTerm("")
    setCabinetItems([createNewItem("cabinet")])
    setWorktopItems([])
    setAccessoriesItems([])
    setAppliancesItems([])
    setWardrobesItems([])
    setTvUnitItems([])
    setLabourPercentage(30)
    setIncludeWorktop(false)
    setIncludeAccessories(false)
    setIncludeAppliances(false)
    setIncludeWardrobes(false)
    setIncludeTvUnit(false)
    setWardrobesLabourPercentage(30)
    setTvUnitLabourPercentage(30)
    setNotes("")
    setItemSearches({})
    setItemDropdownVisible({})
    // Reset section names to defaults
    setSectionNames({
      cabinet: "General",
      worktop: "Worktop",
      accessories: "Accessories",
      appliances: "Appliances",
      wardrobes: "Wardrobes",
      tvunit: "TV Unit"
    })
    setEditingSection(null)
    setEditingSectionName("")
    setFilteredStockItems({})
  }

  const createNewItem = (category: "cabinet" | "worktop" | "accessories" | "appliances" | "wardrobes" | "tvunit"): QuotationItem => {
    return {
      id: Date.now() + Math.random(),
      category,
      description: "",
      unit: "pcs",
      quantity: 1,
      unit_price: 0,
      total_price: 0
    }
  }

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("registered_entities")
        .select("*")
        .eq("type", "client")
        .order("name")

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      toast.error("Failed to fetch clients")
    }
  }

  const fetchStockItems = async () => {
    try {
      const { data, error } = await supabase
        .from("stock_items")
        .select("*")
        .order("name")

      if (error) throw error
      
      // Convert numeric strings to numbers for unit_price
      const processedData = (data || []).map(item => ({
        ...item,
        unit_price: parseFloat(item.unit_price) || 0
      }))
      

      setStockItems(processedData)
    } catch (error) {

      toast.error("Failed to fetch stock items")
    }
  }

  const loadQuotationData = () => {
    if (!quotation) return
    
    setQuotationNumber(quotation.quotation_number || "")
    setSelectedClient(quotation.client || null)
      setClientSearchTerm(quotation.client?.name || "")
    setLabourPercentage(Number(quotation.labour_percentage) || 30)
    setIncludeWorktop(quotation.include_worktop || false)
      setIncludeAccessories(quotation.include_accessories || false)
    setIncludeAppliances(quotation.include_appliances || false)
    setIncludeWardrobes(quotation.include_wardrobes || false)
    setIncludeTvUnit(quotation.include_tvunit || false)
      setNotes(quotation.notes || "")
      setTermsConditions(quotation.terms_conditions || "")
    
    // Load custom section names if available
    if (quotation.section_names) {
      setSectionNames(prev => ({
        ...prev,
        ...quotation.section_names
      }))
    }
    
    // Load VAT percentage from database
    if (quotation.vat_percentage) {
      setVatPercentage(quotation.vat_percentage)
    }
    
    // Load items by category
    if (quotation.items) {
      const cabinet = quotation.items.filter((item: any) => item.category === "cabinet" && !item.description.includes("Labour Charge"));
      const worktop = quotation.items.filter((item: any) => item.category === "worktop");
      const accessories = quotation.items.filter((item: any) => item.category === "accessories");
      const appliances = quotation.items.filter((item: any) => item.category === "appliances");
      const wardrobes = quotation.items.filter((item: any) => item.category === "wardrobes");
      const tvunit = quotation.items.filter((item: any) => item.category === "tvunit");
      setCabinetItems(cabinet.length > 0 ? cabinet : [createNewItem("cabinet")]);
      setWorktopItems(worktop);
      setAccessoriesItems(accessories);
      setAppliancesItems(appliances);
      setWardrobesItems(wardrobes);
      setTvUnitItems(tvunit);
    }

    setCabinetLabourPercentage(Number(quotation.cabinet_labour_percentage) || 30)
    setAccessoriesLabourPercentage(Number(quotation.accessories_labour_percentage) || 30)
          setAppliancesLabourPercentage(Number(quotation.appliances_labour_percentage) || 30)
      setWardrobesLabourPercentage(Number(quotation.wardrobes_labour_percentage) || 30)
      setTvUnitLabourPercentage(Number(quotation.tvunit_labour_percentage) || 30)
    setWorktopLaborQty(quotation.worktop_labor_qty ?? 1)
    setWorktopLaborUnitPrice(quotation.worktop_labor_unit_price ?? 3000)
  }

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    setClientSearchTerm(client.name)
    setClientDropdownVisible(false)
  }

  const handleClientSearch = (searchTerm: string) => {
    setClientSearchTerm(searchTerm)
    setClientDropdownVisible(searchTerm.length > 0)
  }

  const addItem = (category: "cabinet" | "worktop" | "accessories" | "appliances" | "wardrobes" | "tvunit") => {
    const newItem = createNewItem(category)
    
    // Use functional updates for better performance and avoiding stale closures
    switch (category) {
      case "cabinet":
        setCabinetItems(prev => [...prev, newItem])
        break
      case "worktop":
        setWorktopItems(prev => [...prev, newItem])
        break
      case "accessories":
        setAccessoriesItems(prev => [...prev, newItem])
        break
      case "appliances":
        setAppliancesItems(prev => [...prev, newItem])
        break
      case "wardrobes":
        setWardrobesItems(prev => [...prev, newItem])
        break
      case "tvunit":
        setTvUnitItems(prev => [...prev, newItem])
        break
    }
  }

  const removeItem = (category: "cabinet" | "worktop" | "accessories" | "appliances" | "wardrobes" | "tvunit", index: number) => {
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
      case "wardrobes":
        setWardrobesItems(wardrobesItems.filter((_, i) => i !== index))
        break
      case "tvunit":
        setTvUnitItems(tvUnitItems.filter((_, i) => i !== index))
        break
    }
  }

  const updateItem = (category: "cabinet" | "worktop" | "accessories" | "appliances" | "wardrobes" | "tvunit", index: number, field: keyof QuotationItem, value: any) => {
    const updateItems = (items: QuotationItem[]) => {
      return items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value }
          
          if (field === 'stock_item_id') {
            const stockItem = stockItems.find(si => si.id === value)
            
            
            updatedItem.stock_item = stockItem || undefined
            updatedItem.description = stockItem?.name || ""
            updatedItem.unit = stockItem?.unit || "pieces"
            updatedItem.unit_price = Number(stockItem?.unit_price) || 0
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
      case "wardrobes":
        setWardrobesItems(updateItems(wardrobesItems))
        break
      case "tvunit":
        setTvUnitItems(updateItems(tvUnitItems))
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
    
    
    // Find which category this item belongs to and get the correct index within that category
    let category: "cabinet" | "worktop" | "accessories" | "appliances" | "wardrobes" | "tvunit" | null = null
    let index = -1
    
    // Check cabinet items
    const cabinetIndex = cabinetItems.findIndex(item => item.id?.toString() === itemId)
    if (cabinetIndex !== -1) {
      category = "cabinet"
      index = cabinetIndex
    } else {
      // Check worktop items
      const worktopIndex = worktopItems.findIndex(item => item.id?.toString() === itemId)
      if (worktopIndex !== -1) {
        category = "worktop"
        index = worktopIndex
      } else {
        // Check accessories items
        const accessoriesIndex = accessoriesItems.findIndex(item => item.id?.toString() === itemId)
        if (accessoriesIndex !== -1) {
          category = "accessories"
          index = accessoriesIndex
        } else {
          // Check appliances items
          const appliancesIndex = appliancesItems.findIndex(item => item.id?.toString() === itemId)
          if (appliancesIndex !== -1) {
            category = "appliances"
            index = appliancesIndex
          } else {
            // Check wardrobes items
            const wardrobesIndex = wardrobesItems.findIndex(item => item.id?.toString() === itemId)
            if (wardrobesIndex !== -1) {
              category = "wardrobes"
              index = wardrobesIndex
            } else {
              // Check tvunit items
              const tvunitIndex = tvUnitItems.findIndex(item => item.id?.toString() === itemId)
              if (tvunitIndex !== -1) {
                category = "tvunit"
                index = tvunitIndex
              }
            }
          }
        }
      }
    }
    
    if (category && index !== -1) {

      
      // Single call to updateItem with stock_item_id will automatically populate all fields
      updateItem(category, index, "stock_item_id", stockItem.id)
      
      setItemDropdownVisible(prev => ({ ...prev, [itemId]: false }))
      setItemSearches(prev => ({ ...prev, [itemId]: "" }))
    } else {

    }
  }



  const getFilteredItems = (itemId: string) => {
    return filteredStockItems[itemId] || stockItems
  }

  const generatePDF = async () => {
    alert('generatePDF function called');

    try {
  
      const { generate } = await import('@pdfme/generator');
      const { text, rectangle, line, image } = await import('@pdfme/schemas');
      const { generateQuotationPDF } = await import('@/lib/pdf-template');
      
      // Use the same calculation as the UI display for consistency
      const cabinetLabour = (totals.cabinetTotal * cabinetLabourPercentage) / 100;
      const accessoriesLabour = (totals.accessoriesTotal * accessoriesLabourPercentage) / 100;
      const appliancesLabour = (totals.appliancesTotal * appliancesLabourPercentage) / 100;
      const wardrobesLabour = (totals.wardrobesTotal * wardrobesLabourPercentage) / 100;
      const tvUnitLabour = (totals.tvUnitTotal * tvUnitLabourPercentage) / 100;
      
      // Calculate subtotal with all labour included (consistent with UI display)
      const subtotalWithLabour = totals.subtotal + cabinetLabour + accessoriesLabour + appliancesLabour + wardrobesLabour + tvUnitLabour;
      
      // Calculate VAT using reverse calculation (extract VAT from total since items already include VAT)
      const vatPercentageNum = Number(vatPercentage);
      
      // Reverse calculate VAT: if total includes VAT, extract the VAT amount
      const originalAmount = subtotalWithLabour / (1 + (vatPercentageNum / 100));
      const vat = subtotalWithLabour - originalAmount;
      const grandTotal = subtotalWithLabour; // Grand total remains the same
      
      // Prepare items data as objects for QuotationData with custom section names
      const items: Array<{isSection?: boolean, isSectionSummary?: boolean, quantity: number, unit: string, description: string, unitPrice: number, total: number}> = [];
      
      // Add cabinet section header and items
      if (cabinetItems.length > 0) {
        items.push({
          isSection: true,
          description: sectionNames.cabinet,
          quantity: 0,
          unit: "",
          unitPrice: 0,
          total: 0
        });
        cabinetItems.forEach(item => {
          items.push({
            quantity: item.quantity,
            unit: item.unit,
            description: item.description,
            unitPrice: item.unit_price,
            total: item.total_price
          });
        });
        // Add cabinet section summary
        if (totals.cabinetTotal > 0) {
          items.push({
            isSectionSummary: true,
            description: `${sectionNames.cabinet} Total`,
            quantity: 0,
            unit: "",
            unitPrice: totals.cabinetTotal,
            total: totals.cabinetTotal + cabinetLabour
          });
        }
      }
      
      // Add worktop section header and items
      if (worktopItems.length > 0) {
        items.push({
          isSection: true,
          description: sectionNames.worktop,
          quantity: 0,
          unit: "",
          unitPrice: 0,
          total: 0
        });
        worktopItems.forEach(item => {
          items.push({
            quantity: item.quantity,
            unit: item.unit,
            description: item.description,
            unitPrice: item.unit_price,
            total: item.total_price
          });
        });
        // Add worktop section summary
        if (totals.worktopTotal > 0) {
          items.push({
            isSectionSummary: true,
            description: `${sectionNames.worktop} Total`,
            quantity: 0,
            unit: "",
            unitPrice: totals.worktopTotal,
            total: totals.worktopTotal
          });
        }
      }
      
      // Add accessories section header and items
      if (accessoriesItems.length > 0) {
        items.push({
          isSection: true,
          description: sectionNames.accessories,
          quantity: 0,
          unit: "",
          unitPrice: 0,
          total: 0
        });
        accessoriesItems.forEach(item => {
          items.push({
            quantity: item.quantity,
            unit: item.unit,
            description: item.description,
            unitPrice: item.unit_price,
            total: item.total_price
          });
        });
        // Add accessories section summary
        if (totals.accessoriesTotal > 0) {
          items.push({
            isSectionSummary: true,
            description: `${sectionNames.accessories} Total`,
            quantity: 0,
            unit: "",
            unitPrice: totals.accessoriesTotal,
            total: totals.accessoriesTotal + accessoriesLabour
          });
        }
      }
      
      // Add appliances section header and items
      if (appliancesItems.length > 0) {
        items.push({
          isSection: true,
          description: sectionNames.appliances,
          quantity: 0,
          unit: "",
          unitPrice: 0,
          total: 0
        });
        appliancesItems.forEach(item => {
          items.push({
            quantity: item.quantity,
            unit: item.unit,
            description: item.description,
            unitPrice: item.unit_price,
            total: item.total_price
          });
        });
        // Add appliances section summary
        if (totals.appliancesTotal > 0) {
          items.push({
            isSectionSummary: true,
            description: `${sectionNames.appliances} Total`,
            quantity: 0,
            unit: "",
            unitPrice: totals.appliancesTotal,
            total: totals.appliancesTotal + appliancesLabour
          });
        }
      }
      
      // Add wardrobes section header and items
      if (wardrobesItems.length > 0) {
        items.push({
          isSection: true,
          description: sectionNames.wardrobes,
          quantity: 0,
          unit: "",
          unitPrice: 0,
          total: 0
        });
        wardrobesItems.forEach(item => {
          items.push({
            quantity: item.quantity,
            unit: item.unit,
            description: item.description,
            unitPrice: item.unit_price,
            total: item.total_price
          });
        });
        // Add wardrobes section summary
        if (totals.wardrobesTotal > 0) {
          items.push({
            isSectionSummary: true,
            description: `${sectionNames.wardrobes} Total`,
            quantity: 0,
            unit: "",
            unitPrice: totals.wardrobesTotal,
            total: totals.wardrobesTotal + wardrobesLabour
          });
        }
      }
      
      // Add TV Unit section header and items
      if (tvUnitItems.length > 0) {
        items.push({
          isSection: true,
          description: sectionNames.tvunit,
          quantity: 0,
          unit: "",
          unitPrice: 0,
          total: 0
        });
        tvUnitItems.forEach(item => {
          items.push({
            quantity: item.quantity,
            unit: item.unit,
            description: item.description,
            unitPrice: item.unit_price,
            total: item.total_price
          });
        });
        // Add TV Unit section summary
        if (totals.tvUnitTotal > 0) {
          items.push({
            isSectionSummary: true,
            description: `${sectionNames.tvunit} Total`,
            quantity: 0,
            unit: "",
            unitPrice: totals.tvUnitTotal,
            total: totals.tvUnitTotal + tvUnitLabour
          });
        }
      }
      
      // Fetch watermark image as base64
      async function fetchImageAsBase64(url: string): Promise<string> {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
      const watermarkLogoBase64 = await fetchImageAsBase64('/logowatermark.png');

      // Prepare quotation data
      const quotationData = {
        companyName: "CABINET MASTER STYLES & FINISHES",
        companyLocation: "Location: Ruiru Eastern By-Pass",
        companyPhone: "Tel: +254729554475",
        companyEmail: "Email: cabinetmasterstyles@gmail.com",
        clientNames: selectedClient?.name || "",
        siteLocation: selectedClient?.location || "",
        mobileNo: selectedClient?.phone || "",
        date: quotationDate || new Date().toLocaleDateString(),
        deliveryNoteNo: "Delivery Note No.",
        quotationNumber: quotationNumber,
        items: items,
        section_names: sectionNames, // Add custom section names
        subtotal: originalAmount, // Amount before VAT
        vat: vat, // Extracted VAT amount
        vatPercentage: vatPercentageNum,
        total: subtotalWithLabour, // Total amount including VAT
        terms: termsConditions.split('\n').filter(line => line.trim()),
        preparedBy: "",
        approvedBy: "",
        watermarkLogo: watermarkLogoBase64,
        companyLogo: watermarkLogoBase64,
      };

      
      // Generate PDF using PDF.me template
      const { template, inputs } = await generateQuotationPDF(quotationData);
      const pdf = await generate({ template, inputs, plugins: { text, rectangle, line, image } });
      
      // Download the PDF
      const blob = new Blob([new Uint8Array(pdf.buffer)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quotation-${quotationNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("PDF generated successfully!");
      
    } catch (error) {

      toast.error("Failed to generate PDF. Please try again.");
    }
  }

  const generatePDFForViewing = async () => {
    if (!quotation) return;
    
    try {
      setPdfLoading(true)
      
      const { generate } = await import('@pdfme/generator');
      const { text, rectangle, line, image } = await import('@pdfme/schemas');
      const { generateQuotationPDF, imageToBase64 } = await import('@/lib/pdf-template');

      // Convert logo to base64
      const logoBase64 = await imageToBase64('/logo.png');
      // Convert watermark logo to base64
      const watermarkBase64 = await imageToBase64('/logowatermark.png');

      // Prepare items data with section headings and improved formatting (same as working download PDF)
      const items: any[] = [];
      const grouped = quotation.items?.reduce((acc, item) => {
        (acc[item.category] = acc[item.category] || []).push(item);
        return acc;
      }, {} as Record<string, typeof quotation.items>) || {};

      Object.entries(grouped).forEach(([category, itemsInCategory]) => {
        // Section mapping
        const sectionLabels: { [key: string]: string } = {
          cabinet: quotation.section_names?.cabinet || "General",
          worktop: quotation.section_names?.worktop || "Worktop", 
          accessories: quotation.section_names?.accessories || "Accessories",
          appliances: quotation.section_names?.appliances || "Appliances",
          wardrobes: quotation.section_names?.wardrobes || "Wardrobes",
          tvunit: quotation.section_names?.tvunit || "TV Unit"
        };

        const sectionLabel = sectionLabels[category] || category;

        // Insert section header
        const sectionHeaderRow = {
          isSection: true,
          itemNumber: "",
          quantity: "",
          unit: "",
          description: sectionLabel,
          unitPrice: "",
          total: ""
        };
        items.push(sectionHeaderRow);

        // Insert items for this section
        let itemNumber = 1;
        itemsInCategory.forEach((item: any) => {
          const itemRow = {
            itemNumber: itemNumber.toString(),
            quantity: item.quantity?.toString() || "",
            unit: item.unit || "",
            description: item.description || "",
            unitPrice: item.unit_price?.toFixed(2) || "",
            total: item.total_price?.toFixed(2) || ""
          };
          items.push(itemRow);
          itemNumber++;
        });

        // Add labour charge logic to quotation modal PDF generation

        // In handlePrint function, after items are added but before section summary
        // Add worktop installation labor if exists
        if (category === 'worktop' && quotation.worktop_labor_qty && quotation.worktop_labor_unit_price) {
          items.push({
            itemNumber: String(itemNumber),
            quantity: quotation.worktop_labor_qty,
            unit: "per slab",
            description: "Worktop Installation Labor",
            unitPrice: quotation.worktop_labor_unit_price.toFixed(2),
            total: (quotation.worktop_labor_qty * quotation.worktop_labor_unit_price).toFixed(2)
          });
          itemNumber++;
        }

        // Add labour charge for each section that has items (except worktop which has its own labor)
        if (itemsInCategory.length > 0 && category !== 'worktop') {
          // Check if labour charge items already exist in this category
          const hasExistingLabourCharge = itemsInCategory.some(item => 
            item.description && item.description.toLowerCase().includes('labour charge')
          );
          
          // Only calculate labour charge if no labour charge items exist
          if (!hasExistingLabourCharge) {
            const sectionItemsTotal = itemsInCategory.reduce((sum, item) => sum + (item.total_price || 0), 0);
            
            // Get the correct labour percentage for this specific section from database
            let labourPercentage = quotation.labour_percentage || 30; // Use general labour_percentage as default
            switch (category) {
              case 'cabinet':
                labourPercentage = quotation.cabinet_labour_percentage || quotation.labour_percentage || 30;
                break;
              case 'accessories':
                labourPercentage = quotation.accessories_labour_percentage || quotation.labour_percentage || 30;
                break;
              case 'appliances':
                labourPercentage = quotation.appliances_labour_percentage || quotation.labour_percentage || 30;
                break;
              case 'wardrobes':
                labourPercentage = quotation.wardrobes_labour_percentage || quotation.labour_percentage || 30;
                break;
              case 'tvunit':
                labourPercentage = quotation.tvunit_labour_percentage || quotation.labour_percentage || 30;
                break;
              default:
                labourPercentage = quotation.labour_percentage || 30;
            }
            
            const labourCharge = (sectionItemsTotal * labourPercentage) / 100;
            
            if (labourCharge > 0) {
              items.push({
                itemNumber: String(itemNumber),
                quantity: 1,
                unit: "sum",
                description: `Labour Charge (${labourPercentage}%)`,
                unitPrice: labourCharge.toFixed(2),
                total: labourCharge.toFixed(2)
              });
              itemNumber++;
            }
          }
        }

        // Insert section summary row
        let sectionTotal = itemsInCategory.reduce((sum, item) => sum + (item.total_price || 0), 0);
        
        // Add worktop labor to section total if it exists
        if (category === 'worktop' && quotation.worktop_labor_qty && quotation.worktop_labor_unit_price) {
          sectionTotal += quotation.worktop_labor_qty * quotation.worktop_labor_unit_price;
        }

        // Note: Labour charge is already added as a separate line item above, so we don't need to add it to section total again
        
        const summaryRow = {
          isSectionSummary: true,
          itemNumber: "",
          quantity: "",
          unit: "",
          description: `${sectionLabel} Total`,
          unitPrice: "",
          total: sectionTotal.toFixed(2) // Always show total, even if 0.00
        };
        
        items.push(summaryRow);
      });

      // Parse terms and conditions from database
      const parseTermsAndConditions = (termsText: string) => {
        return (termsText || "").split('\n').filter(line => line.trim());
      };

      // Prepare quotation data (same as working download PDF)
      const { template, inputs } = await generateQuotationPDF({
        companyName: "CABINET MASTER STYLES & FINISHES",
        companyLocation: "Location: Ruiru Eastern By-Pass",
        companyPhone: "Tel: +254729554475",
        companyEmail: "Email: cabinetmasterstyles@gmail.com",
        clientNames: quotation.client?.name || "",
        siteLocation: quotation.client?.location || "",
        mobileNo: quotation.client?.phone || "",
        date: new Date(quotation.date_created).toLocaleDateString(),
        deliveryNoteNo: "Delivery Note No.",
        quotationNumber: quotation.quotation_number,
        items,
        subtotal: quotation.total_amount || 0,
        vat: quotation.vat_amount || 0,
        vatPercentage: quotation.vat_percentage || 16,
        total: quotation.grand_total || 0,
        notes: quotation.notes || "",
        terms: parseTermsAndConditions(quotation.terms_conditions || ""),
        preparedBy: "",
        approvedBy: "",
        companyLogo: logoBase64,
        watermarkLogo: watermarkBase64
      });

      const pdf = await generate({
        template,
        inputs,
        plugins: { text, rectangle, line, image }
      });
      
      // Create blob URL for viewing
      const blob = new Blob([new Uint8Array(pdf.buffer)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Clean up previous URL
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      
      setPdfUrl(url);
      
    } catch (error) {
      console.error('Error generating PDF for viewing:', error);
      toast.error("Failed to generate PDF for viewing. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  }

  const handleSave = async () => {
    if (!selectedClient) {
      toast.error("Please select a client")
      return
    }

    if (cabinetItems.length === 0 && worktopItems.length === 0 && accessoriesItems.length === 0 && appliancesItems.length === 0 && wardrobesItems.length === 0 && tvUnitItems.length === 0) {
      toast.error("Please add at least one item")
      return
    }

    setLoading(true)
    try {
      // Add labour item to cabinet items if not exists
      let finalCabinetItems = [...cabinetItems].filter(item => !item.description.includes("Labour Charge"));
      
      const cabinetSectionTotal = cabinetItems.reduce((sum, item) => sum + item.total_price, 0);
      const cabinetLabour = (cabinetSectionTotal * cabinetLabourPercentage) / 100;
      
      if (
        !finalCabinetItems.some(item => item.description.includes("Labour Charge")) &&
        cabinetItems.length > 0 &&
        cabinetSectionTotal > 0 &&
        cabinetLabour > 0
      ) {
        finalCabinetItems.push({
          id: Date.now() + Math.random(),
          category: "cabinet",
          description: `Labour Charge (${cabinetLabourPercentage}%)`,
          unit: "sum",
          quantity: 1,
          unit_price: cabinetLabour,
          total_price: cabinetLabour,
          stock_item_id: undefined
        });
      }

    // Calculate totals with VAT (consistent with UI display and PDF generation)
    const saveCabinetLabour = (totals.cabinetTotal * cabinetLabourPercentage) / 100;
    const saveAccessoriesLabour = (totals.accessoriesTotal * accessoriesLabourPercentage) / 100;
    const saveAppliancesLabour = (totals.appliancesTotal * appliancesLabourPercentage) / 100;
    const saveWardrobesLabour = (totals.wardrobesTotal * wardrobesLabourPercentage) / 100;
    const saveTvUnitLabour = (totals.tvUnitTotal * tvUnitLabourPercentage) / 100;
    
    const saveSubtotalWithLabour = totals.subtotal + saveCabinetLabour + saveAccessoriesLabour + saveAppliancesLabour + saveWardrobesLabour + saveTvUnitLabour;
    const saveVatPercentageNum = Number(vatPercentage);
    // Reverse calculate VAT: if total includes VAT, extract the VAT amount
    const saveOriginalAmount = saveSubtotalWithLabour / (1 + (saveVatPercentageNum / 100));
    const saveVatAmount = saveSubtotalWithLabour - saveOriginalAmount;
    const saveGrandTotalWithVAT = saveSubtotalWithLabour; // Grand total remains the same

    const quotationData = {
      quotation_number: quotationNumber,
      client_id: selectedClient.id,
      date_created: quotationDate ? new Date(quotationDate).toISOString() : new Date().toISOString(),
      cabinet_total: totals.cabinetTotal,
      worktop_total: totals.worktopTotal,
      accessories_total: totals.accessoriesTotal,
      appliances_total: totals.appliancesTotal,
      wardrobes_total: totals.wardrobesTotal,
      tvunit_total: totals.tvUnitTotal,
      labour_percentage: labourPercentage,
      labour_total: totals.labourAmount,
      total_amount: saveOriginalAmount, // Amount before VAT
      grand_total: saveSubtotalWithLabour, // Total amount including VAT
      vat_amount: saveVatAmount, // VAT amount
      vat_percentage: saveVatPercentageNum, // VAT percentage
      include_worktop: includeWorktop,
      include_accessories: includeAccessories,
      include_appliances: includeAppliances,
      include_wardrobes: includeWardrobes,
      include_tvunit: includeTvUnit,
      status: "pending",
      notes,
      terms_conditions: termsConditions,
      items: [...finalCabinetItems, ...worktopItems, ...accessoriesItems, ...appliancesItems, ...wardrobesItems, ...tvUnitItems],
      cabinet_labour_percentage: cabinetLabourPercentage,
      accessories_labour_percentage: accessoriesLabourPercentage,
      appliances_labour_percentage: appliancesLabourPercentage,
      wardrobes_labour_percentage: wardrobesLabourPercentage,
      tvunit_labour_percentage: tvUnitLabourPercentage,
      worktop_labor_qty: worktopLaborQty,
      worktop_labor_unit_price: worktopLaborUnitPrice,
      section_names: sectionNames
    }

      // Confirm quotation number if it's a new quotation
      // Removed localStorage logic, so this block is effectively removed.
      // The generateQuotationNumber function now handles the number generation.

    await onSave(quotationData)
    onClose()
    } catch (error) {

      toast.error("Failed to save quotation")
    } finally {
      setLoading(false)
    }
  }

  const [labourPercentageInput, setLabourPercentageInput] = useState(labourPercentage.toString());

  // Add individual labour percentage states for each section
  const [cabinetLabourPercentage, setCabinetLabourPercentage] = useState(30);
  const [accessoriesLabourPercentage, setAccessoriesLabourPercentage] = useState(30);
  const [appliancesLabourPercentage, setAppliancesLabourPercentage] = useState(30);
  const [wardrobesLabourPercentage, setWardrobesLabourPercentage] = useState(30);
  const [tvUnitLabourPercentage, setTvUnitLabourPercentage] = useState(30);
  
  // Add VAT percentage state
  const [vatPercentage, setVatPercentage] = useState(16);

  // Memoize expensive calculations to prevent performance issues (after all dependencies are declared)
  const totals = useMemo(() => {
    const cabinetTotal = cabinetItems.reduce((sum, item) => sum + item.total_price, 0)
    const worktopTotal = includeWorktop ? (worktopItems.reduce((sum, item) => sum + item.total_price, 0) + (worktopLaborQty * worktopLaborUnitPrice)) : 0;
    const accessoriesTotal = accessoriesItems.reduce((sum, item) => sum + item.total_price, 0)
    const appliancesTotal = appliancesItems.reduce((sum, item) => sum + item.total_price, 0)
    const wardrobesTotal = wardrobesItems.reduce((sum, item) => sum + item.total_price, 0)
    const tvUnitTotal = tvUnitItems.reduce((sum, item) => sum + item.total_price, 0)
    
    const subtotal = cabinetTotal + worktopTotal + accessoriesTotal + appliancesTotal + wardrobesTotal + tvUnitTotal
    
    // Calculate individual labour amounts (no worktopLabour)
    const cabinetLabour = (cabinetTotal * cabinetLabourPercentage) / 100
    const accessoriesLabour = (accessoriesTotal * accessoriesLabourPercentage) / 100
    const appliancesLabour = (appliancesTotal * appliancesLabourPercentage) / 100
    const wardrobesLabour = (wardrobesTotal * wardrobesLabourPercentage) / 100
    const tvUnitLabour = (tvUnitTotal * tvUnitLabourPercentage) / 100
    
    const totalLabour = cabinetLabour + accessoriesLabour + appliancesLabour + wardrobesLabour + tvUnitLabour
    const grandTotal = subtotal + totalLabour

    return {
      cabinetTotal,
      worktopTotal,
      accessoriesTotal,
      appliancesTotal,
      wardrobesTotal,
      tvUnitTotal,
      subtotal,
      labourAmount: totalLabour,
      grandTotal,
      cabinetLabour,
      accessoriesLabour,
      appliancesLabour,
      wardrobesLabour,
      tvUnitLabour
    }
  }, [cabinetItems, worktopItems, accessoriesItems, appliancesItems, wardrobesItems, tvUnitItems, 
      includeWorktop, worktopLaborQty, worktopLaborUnitPrice, cabinetLabourPercentage, 
      accessoriesLabourPercentage, appliancesLabourPercentage, wardrobesLabourPercentage, tvUnitLabourPercentage])
  
  // Legacy function for backward compatibility - now just returns memoized values
  const calculateTotals = () => totals

  const isReadOnly = mode === "view"

  if (!isOpen) return null

  // Calculate section totals with labour included (consistent with PDF generation)
  const cabinetLabour = (totals.cabinetTotal * cabinetLabourPercentage) / 100;
  const accessoriesLabour = (totals.accessoriesTotal * accessoriesLabourPercentage) / 100;
  const appliancesLabour = (totals.appliancesTotal * appliancesLabourPercentage) / 100;
  const wardrobesLabour = (totals.wardrobesTotal * wardrobesLabourPercentage) / 100;
  const tvUnitLabour = (totals.tvUnitTotal * tvUnitLabourPercentage) / 100;
  
  // Calculate subtotal with all labour included (consistent with PDF generation)
  const subtotalWithLabour = totals.subtotal + cabinetLabour + accessoriesLabour + appliancesLabour + wardrobesLabour + tvUnitLabour;
  
  // Calculate VAT using reverse calculation (extract VAT from total since items already include VAT)
  const originalAmount = subtotalWithLabour / (1 + (vatPercentage / 100));
  const vatAmount = subtotalWithLabour - originalAmount;
  const grandTotal = subtotalWithLabour; // Grand total remains the same

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div 
        className={`modal-dialog ${mode === "view" ? (pdfUrl ? "" : "modal-xl") : "modal-xl"} modal-dialog-centered`}
        style={mode === "view" && pdfUrl ? {
          maxWidth: "794px", // A4 width at 96 DPI (210mm = 794px)
          width: "794px",
          margin: "1.75rem auto"
        } : {}}
      >
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
                <h5 className="modal-title mb-1 fw-bold" style={{ color: "#ffffff" }}>
                  {mode === "create" ? "New Quotation" : mode === "edit" ? "Edit Quotation" : "View Quotation"}
            </h5>
                {mode !== "view" && (
                  <p className="mb-0 text-white small">Create a detailed quotation for your client</p>
                )}
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
          {mode === "view" && pdfUrl ? (
            <div className="modal-body" style={{ 
              padding: "0", 
              maxHeight: "70vh", 
              overflowY: "hidden",
              display: "flex",
              justifyContent: "center"
            }}>
              <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center" }}>
                <iframe
                  src={pdfUrl}
                  style={{
                    width: "794px", // Exact A4 width
                    height: "70vh",
                    border: "none",
                    borderRadius: "0"
                  }}
                  title="Quotation PDF"
                />
              </div>
            </div>
          ) : mode === "view" && pdfLoading ? (
            <div className="modal-body" style={{ 
              padding: "0 32px 24px", 
              maxHeight: "70vh", 
              overflowY: "auto",
              display: "flex",
              justifyContent: "center"
            }}>
              <div style={{ 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center", 
                height: "50vh",
                flexDirection: "column"
              }}>
                <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Generating PDF...</p>
              </div>
            </div>
          ) : (
            <div className="modal-body" style={{ padding: "0 32px 24px", maxHeight: "70vh", overflowY: "auto" }}>
              {/* Client and Quotation Number Section */}
            <div className="row mb-4">
              <div className="col-md-8">
                <div className="card" style={{ borderRadius: "16px", border: "1px solid #e9ecef", boxShadow: "none" }}>
                  <div className="card-body p-4">
                    <h6 className="card-title mb-3 fw-bold" style={{ color: "#ffffff" }}>
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
                          style={{ borderRadius: "16px 0 0 16px", height: "45px", paddingLeft: "15px", color: "#ffffff" }}
                          readOnly={isReadOnly}
                    />
                  </div>
                      
                      <PortalDropdown
                        isVisible={clientDropdownVisible && !isReadOnly}
                        triggerRef={clientInputRef}
                        onClose={() => setClientDropdownVisible(false)}
                      >
                        <div style={{
                          marginTop: "5px",
                          borderRadius: "16px",
                          boxShadow: "0 2px 12px rgba(0,0,0,0.10)",
                          background: "#fff",
                          minWidth: "100%",
                          padding: "8px 0"
                        }}>
                          {filteredClients.map(client => (
                            <div
                              key={client.id}
                              style={{
                                padding: "12px 20px",
                                cursor: "pointer",
                                background: "#fff",
                                color: "#212529",
                                transition: "background 0.2s"
                              }}
                              onClick={() => handleClientSelect(client)}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = "#fff"}
                            >
                              <div style={{ fontWeight: "700", fontSize: "16px", marginBottom: "2px", letterSpacing: "0.01em" }}>{client.name}</div>
                              {(client.phone || client.location) && (
                                <div style={{ fontSize: "14px", color: "#6c757d", fontWeight: 400 }}>
                                  {client.phone}
                                  {client.phone && client.location && <span style={{ margin: "0 4px" }}>•</span>}
                                  {client.location}
                                </div>
                              )}
                            </div>
                          ))}
                          {filteredClients.length === 0 && (
                            <div style={{ padding: "12px 20px", color: "#495057", fontStyle: "italic", background: "#fff" }}>
                              No clients found
                            </div>
                          )}
                        </div>
                      </PortalDropdown>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card" style={{ borderRadius: "16px", border: "1px solid #e9ecef", boxShadow: "none" }}>
                  <div className="card-body p-4">
                    
                    <div className="mb-3">
                      <label className="form-label small fw-semibold" style={{ color: "#ffffff" }}>
                        Quotation Number
                      </label>
                    <input
                      type="text"
                        className="form-control"
                      value={quotationNumber}
                      readOnly
                        style={{ borderRadius: "12px 0 0 12px", height: "45px", backgroundColor: "#f8f9fa", border: "1px solid #e9ecef" }}
                    />
                  </div>
                    <div>
                      <label className="form-label small fw-semibold" style={{ color: "#ffffff" }}>
                        Date
                      </label>
                      <div className="input-group">
                    <input
                          type="date"
                          className="form-control"
                          value={quotationDate}
                          onChange={e => setQuotationDate(e.target.value)}
                          style={{ borderRadius: "12px 0 0 12px", height: "45px", border: "1px solid #e9ecef" }}
                          readOnly={isReadOnly}
                        />
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
                  <h6 className="card-title mb-3 fw-bold" style={{ color: "#ffffff" }}>
                    <Calculator size={18} className="me-2" />
                    <EditableSectionHeader
                      sectionKey="cabinet"
                      currentName={sectionNames.cabinet}
                      onEdit={() => handleSectionNameEdit("cabinet")}
                      onSave={() => handleSectionNameSave("cabinet")}
                      onCancel={handleSectionNameCancel}
                      onKeyPress={(e) => handleSectionNameKeyPress(e, "cabinet")}
                      isEditing={editingSection === "cabinet"}
                      editingName={editingSectionName}
                      onEditingNameChange={setEditingSectionName}
                      isReadOnly={isReadOnly}
                    />
                  </h6>
                  
                  {/* Items Section - Div based design */}
                  <div className="mb-3">
                    
                    {/* Column Headers */}
                    <div className="d-flex mb-3" style={{ 
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "white"
                    }}>
                      <div style={{ flex: "2", marginRight: "16px" }}>Item</div>
                      <div style={{ flex: "1", marginRight: "16px" }}>Units</div>
                      <div style={{ flex: "1", marginRight: "16px" }}>Qty</div>
                      <div style={{ flex: "1", marginRight: "16px" }}>Unit Price</div>
                      <div style={{ flex: "1", marginRight: "16px" }}>Total</div>
                      {!isReadOnly && <div style={{ flex: "0 0 40px" }}></div>}
                </div>

                    {/* Item Rows */}
                    {cabinetItems.map((item, index) => (
                      <div key={item.id} className="d-flex align-items-center mb-2">
                        <div style={{ flex: "2", marginRight: "16px" }}>
                          <div className="position-relative" ref={getItemInputRef(item.id?.toString() || "")}>
                      <input
                        type="text"
                              className="form-control"
                              value={item.description}
                        onChange={(e) => {
                                updateItem("cabinet", index, "description", e.target.value)
                                handleItemSearch(item.id?.toString() || "", e.target.value)
                                setItemDropdownVisible(prev => ({ ...prev, [item.id?.toString() || ""]: true }))
                        }}
                              onFocus={() => setItemDropdownVisible(prev => ({ ...prev, [item.id?.toString() || ""]: true }))}
                              placeholder="Search and select item"
                              style={{ borderRadius: "12px", height: "40px", fontSize: "13px" }}
                        readOnly={isReadOnly}
                      />
                            
                            <PortalDropdown
                              isVisible={itemDropdownVisible[item.id?.toString() || ""] && !isReadOnly}
                              triggerRef={getItemInputRef(item.id?.toString() || "")}
                              onClose={() => setItemDropdownVisible(prev => ({ ...prev, [item.id?.toString() || ""]: false }))}
                            >
                              {getFilteredItems(item.id?.toString() || "").map(stockItem => (
                                <li
                                  key={stockItem.id}
                                  style={{
                                    padding: "8px 12px",
                                    cursor: "pointer",
                                    borderBottom: "1px solid #f1f3f4",
                                    background: "#fff",
                                    color: "#212529"
                                  }}
                                  onClick={() => selectStockItem(item.id?.toString() || "", stockItem)}
                                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "#fff"}
                                >
                                  <div style={{ fontWeight: "600", fontSize: "13px", color: "#212529" }}>{stockItem.name}</div>
                                  <div style={{ fontSize: "11px", color: "#495057" }}>
                                    Unit Price: KES {stockItem.unit_price?.toFixed(2)}
                            </div>
                                </li>
                          ))}
                            </PortalDropdown>
                        </div>
                    </div>
                        
                        <div style={{ flex: "1", marginRight: "16px" }}>
                    <input
                      type="text"
                            className="form-control"
                            value={item.unit}
                            onChange={(e) => updateItem("cabinet", index, "unit", e.target.value)}
                            placeholder="Units"
                            style={{ borderRadius: "12px", height: "40px", fontSize: "13px" }}
                            readOnly={isReadOnly}
                    />
                  </div>
                        
                        <div style={{ flex: "1", marginRight: "16px" }}>
                    <input
                      type="number"
                            value={
                              rawQuantityValues[item.id?.toString() || ""] !== undefined
                                ? rawQuantityValues[item.id?.toString() || ""]
                                : (item.quantity === 1 ? "" : item.quantity)
                            }
                            onFocus={e => {
                              setRawQuantityValues(prev => ({ ...prev, [item.id?.toString() || ""]: prev[item.id?.toString() || ""] ?? (item.quantity === 1 ? "" : String(item.quantity)) }));
                            }}
                            onChange={e => {
                              const val = e.target.value;
                              setRawQuantityValues(prev => ({ ...prev, [item.id?.toString() || ""]: val }));
                            }}
                            onBlur={e => {
                              const val = e.target.value;
                              const num = val === '' ? 1 : Number(val);
                              updateItem("cabinet", index, "quantity", isNaN(num) ? 1 : num);
                              setRawQuantityValues(prev => {
                                const copy = { ...prev };
                                delete copy[item.id?.toString() || ""];
                                return copy;
                              });
                            }}
                            placeholder="1"
                            style={{ 
                              width: "100%",
                              borderRadius: "12px", 
                              height: "40px", 
                              fontSize: "13px",
                              background: "transparent", 
                              color: "#fff", 
                              border: "none",
                              padding: "8px 12px",
                              boxShadow: "none",
                              backgroundColor: "transparent",
                              WebkitAppearance: "none",
                              MozAppearance: "textfield",
                              outline: "none"
                            }}
                            readOnly={isReadOnly}
                            min="0"
                            step="0.01"
                    />
                  </div>
                        
                        <div style={{ flex: "1", marginRight: "16px" }}>
                          <input
                            type="number"
                            className="form-control"
                            value={item.unit_price || ""}
                            onChange={(e) => updateItem("cabinet", index, "unit_price", parseFloat(e.target.value) || 0)}
                            placeholder="Unit Price"
                            style={{ borderRadius: "12px", height: "40px", fontSize: "13px" }}
                            readOnly={isReadOnly}
                            min="0"
                            step="0.01"
                          />
                </div>
                        
                        <div style={{ flex: "1", marginRight: "16px", fontWeight: "600", color: "#ffffff" }}>
                          KES {item.total_price.toFixed(2)}
              </div>

                        {!isReadOnly && (
                          <div style={{ flex: "0 0 40px" }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeItem("cabinet", index)}
                              style={{ borderRadius: "8px", padding: "4px 8px" }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Minimalistic Labour Footer for Cabinet Section */}
                    {mode !== "view" && (
                      <div className="d-flex align-items-center mt-2 p-2" style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px" }}>
                        <div style={{ flex: "2", marginRight: "16px", fontWeight: 600, color: "#fff" }}>Add Labour</div>
                        <div style={{ flex: "1", marginRight: "16px", color: "#fff", paddingLeft: "12px" }}>%</div>
                        <div style={{ flex: "1", marginRight: "16px", paddingLeft: "12px" }}>
                          <input
                            type="number"
                            value={cabinetLabourPercentage === 30 ? "" : (cabinetLabourPercentage === 0 ? "" : cabinetLabourPercentage)}
                            onFocus={e => {
                              e.target.value = "";
                              setCabinetLabourPercentage(0);
                            }}
                            onChange={e => setCabinetLabourPercentage(Number(e.target.value) || 0)}
                            onBlur={e => setCabinetLabourPercentage(Number(e.target.value) || 30)}
                            placeholder="30"
                            style={{ 
                              width: "100%",
                              borderRadius: "8px", 
                              fontSize: "13px", 
                              background: "transparent", 
                              color: "#fff", 
                              border: "none",
                              padding: "8px 0",
                              boxShadow: "none",
                              backgroundColor: "transparent",
                              WebkitAppearance: "none",
                              MozAppearance: "textfield",
                              outline: "none"
                            }}
                            min="0"
                            max="100"
                            step="0.01"
                          />
                        </div>
                        <div style={{ flex: "1", marginRight: "16px" }}></div>
                        <div style={{ flex: "1", marginRight: "16px", color: "#fff", fontWeight: 600, paddingLeft: "12px" }}>KES {totals.cabinetLabour.toFixed(2)}</div>
                        {!isReadOnly && <div style={{ flex: "0 0 40px" }}></div>}
                      </div>
                    )}

                    {/* Add Item Button */}
                    {!isReadOnly && (
                      <div className="mt-3">
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => addItem("cabinet")}
                          style={{ 
                            borderRadius: "12px", 
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            border: "none",
                            padding: "10px 20px"
                          }}
                        >
                          <Plus size={14} className="me-1" />
                          Add Item
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Worktop Section with Animated Toggle */}
            <div className="mb-4">
              <div className="card" style={{ borderRadius: "16px", border: "1px solid #e9ecef", boxShadow: "none" }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    {!isReadOnly && (
                      <div className="d-flex align-items-center w-100">
                        {/* Section Title - Hidden when toggle is off */}
                        <div 
                          style={{
                            display: includeWorktop ? "flex" : "none",
                            alignItems: "center",
                            marginRight: "12px",
                            transition: "all 0.3s ease",
                            transform: includeWorktop ? "translateX(0)" : "translateX(-20px)",
                            opacity: includeWorktop ? 1 : 0
                          }}
                        >
                          <Calculator size={18} className="me-2" style={{ color: "#ffffff" }} />
                          <EditableSectionHeader
                            sectionKey="worktop"
                            currentName={sectionNames.worktop}
                            onEdit={() => handleSectionNameEdit("worktop")}
                            onSave={() => handleSectionNameSave("worktop")}
                            onCancel={handleSectionNameCancel}
                            onKeyPress={(e) => handleSectionNameKeyPress(e, "worktop")}
                            isEditing={editingSection === "worktop"}
                            editingName={editingSectionName}
                            onEditingNameChange={setEditingSectionName}
                            isReadOnly={isReadOnly}
                          />
                        </div>
                        
                        {/* Toggle Text and Switch */}
                        <div 
                          className="d-flex align-items-center"
                          style={{
                            marginLeft: includeWorktop ? "auto" : "0",
                            transition: "all 0.3s ease",
                            transform: includeWorktop ? "translateX(0)" : "translateX(0)"
                          }}
                        >
                          <span 
                            className="me-2 small fw-semibold" 
                            style={{ 
                              color: "#ffffff",
                              transition: "all 0.3s ease"
                            }}
                          >
                            {includeWorktop ? "Remove Worktop" : "Include Worktop"}
                          </span>
                          <div 
                            className="position-relative"
                            style={{
                              width: "44px",
                              height: "24px",
                              borderRadius: "12px",
                              background: includeWorktop ? "#667eea" : "#e9ecef",
                              cursor: isReadOnly ? "default" : "pointer",
                              transition: "background-color 0.2s"
                            }}
                            onClick={() => !isReadOnly && setIncludeWorktop(!includeWorktop)}
                          >
                            <div
                              style={{
                                position: "absolute",
                                top: "2px",
                                left: includeWorktop ? "22px" : "2px",
                                width: "20px",
                                height: "20px",
                                borderRadius: "50%",
                                background: "white",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                transition: "left 0.2s"
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {includeWorktop && (
                    <div className="mb-3">
                      
                      {/* Column Headers */}
                      <div className="d-flex mb-3" style={{ 
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "white"
                      }}>
                        <div style={{ flex: "2", marginRight: "16px" }}>Item</div>
                        <div style={{ flex: "1", marginRight: "16px" }}>Units</div>
                        <div style={{ flex: "1", marginRight: "16px" }}>Qty</div>
                        <div style={{ flex: "1", marginRight: "16px" }}>Unit Price</div>
                        <div style={{ flex: "1", marginRight: "16px" }}>Total</div>
                        {!isReadOnly && <div style={{ flex: "0 0 40px" }}></div>}
                      </div>

                      {/* Item Rows */}
                      {worktopItems.map((item, index) => (
                        <div key={item.id} className="d-flex align-items-center mb-2">
                          <div style={{ flex: "2", marginRight: "16px" }}>
                            <div className="position-relative" ref={getItemInputRef(item.id?.toString() || "")}>
                          <input
                            type="text"
                                className="form-control"
                            value={item.description}
                                onChange={(e) => {
                                  updateItem("worktop", index, "description", e.target.value)
                                  handleItemSearch(item.id?.toString() || "", e.target.value)
                                  setItemDropdownVisible(prev => ({ ...prev, [item.id?.toString() || ""]: true }))
                                }}
                                onFocus={() => setItemDropdownVisible(prev => ({ ...prev, [item.id?.toString() || ""]: true }))}
                                placeholder="Search and select item"
                                style={{ borderRadius: "12px", height: "40px", fontSize: "13px" }}
                            readOnly={isReadOnly}
                          />
                              
                              <PortalDropdown
                                isVisible={itemDropdownVisible[item.id?.toString() || ""] && !isReadOnly}
                                triggerRef={getItemInputRef(item.id?.toString() || "")}
                                onClose={() => setItemDropdownVisible(prev => ({ ...prev, [item.id?.toString() || ""]: false }))}
                              >
                                {getFilteredItems(item.id?.toString() || "").map(stockItem => (
                                  <li
                                    key={stockItem.id}
                                    style={{
                                      padding: "8px 12px",
                                      cursor: "pointer",
                                      borderBottom: "1px solid #f1f3f4",
                                      background: "#fff",
                                      color: "#212529"
                                    }}
                                    onClick={() => selectStockItem(item.id?.toString() || "", stockItem)}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "#fff"}
                                  >
                                    <div style={{ fontWeight: "600", fontSize: "13px", color: "#212529" }}>{stockItem.name}</div>
                                    <div style={{ fontSize: "11px", color: "#495057" }}>
                                      Unit Price: KES {stockItem.unit_price?.toFixed(2) || stockItem.unit_price?.toFixed(2)}
                                    </div>
                                  </li>
                                ))}
                              </PortalDropdown>
                            </div>
                          </div>
                          
                          <div style={{ flex: "1", marginRight: "16px" }}>
                          <input
                            type="text"
                              className="form-control"
                            value={item.unit}
                              onChange={(e) => updateItem("worktop", index, "unit", e.target.value)}
                              placeholder="Units"
                              style={{ borderRadius: "12px", height: "40px", fontSize: "13px" }}
                            readOnly={isReadOnly}
                          />
                          </div>
                          
                          <div style={{ flex: "1", marginRight: "16px" }}>
                          <input
                            type="number"
                            value={
                              rawQuantityValues[item.id?.toString() || ""] !== undefined
                                ? rawQuantityValues[item.id?.toString() || ""]
                                : (item.quantity === 1 ? "" : item.quantity)
                            }
                            onFocus={e => {
                              setRawQuantityValues(prev => ({ ...prev, [item.id?.toString() || ""]: prev[item.id?.toString() || ""] ?? (item.quantity === 1 ? "" : String(item.quantity)) }));
                            }}
                            onChange={e => {
                              const val = e.target.value;
                              setRawQuantityValues(prev => ({ ...prev, [item.id?.toString() || ""]: val }));
                            }}
                            onBlur={e => {
                              const val = e.target.value;
                              const num = val === '' ? 1 : Number(val);
                              updateItem("worktop", index, "quantity", isNaN(num) ? 1 : num);
                              setRawQuantityValues(prev => {
                                const copy = { ...prev };
                                delete copy[item.id?.toString() || ""];
                                return copy;
                              });
                            }}
                            placeholder="1"
                            style={{ 
                              width: "100%",
                              borderRadius: "12px", 
                              height: "40px", 
                              fontSize: "13px",
                              background: "transparent", 
                              color: "#fff", 
                              border: "none",
                              padding: "8px 12px",
                              boxShadow: "none",
                              backgroundColor: "transparent",
                              WebkitAppearance: "none",
                              MozAppearance: "textfield",
                              outline: "none"
                            }}
                            readOnly={isReadOnly}
                            min="0"
                            step="0.01"
                          />
                          </div>
                          
                          <div style={{ flex: "1", marginRight: "16px" }}>
                          <input
                            type="number"
                              className="form-control"
                            value={item.unit_price || ""}
                            onChange={(e) => updateItem("worktop", index, "unit_price", parseFloat(e.target.value) || 0)}
                            placeholder="Unit Price"
                            style={{ borderRadius: "12px", height: "40px", fontSize: "13px" }}
                            readOnly={isReadOnly}
                            min="0"
                            step="0.01"
                          />
                          </div>
                          
                          <div style={{ flex: "1", marginRight: "16px", fontWeight: "600", color: "#ffffff" }}>
                            KES {item.total_price.toFixed(2)}
                          </div>
                          
                        {!isReadOnly && (
                            <div style={{ flex: "0 0 40px" }}>
                            <button
                              type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeItem("worktop", index)}
                                style={{ borderRadius: "8px", padding: "4px 8px" }}
                            >
                                <X size={12} />
                            </button>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Render the Worktop Installation Labor footer row after the item rows: */}
                      {mode !== "view" && (
                        <div className="d-flex align-items-center mt-2 p-2" style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px" }}>
                          <div style={{ flex: "2", marginRight: "16px", fontWeight: 600, color: "#fff" }}>Worktop Installation Labor</div>
                          <div style={{ flex: "1", marginRight: "16px", color: "#fff", paddingLeft: "12px" }}>per slab</div>
                          <div style={{ flex: "1", marginRight: "16px", paddingLeft: "12px" }}>
                            <input
                              type="number"
                              value={rawWorktopLaborQty !== undefined ? rawWorktopLaborQty : (worktopLaborQty === 1 ? "" : worktopLaborQty)}
                              onFocus={e => setRawWorktopLaborQty(worktopLaborQty === 1 ? "" : String(worktopLaborQty))}
                              onChange={e => setRawWorktopLaborQty(e.target.value)}
                              onBlur={e => {
                                const val = rawWorktopLaborQty ?? "";
                                const num = val === '' ? 1 : Number(val);
                                setWorktopLaborQty(isNaN(num) ? 1 : num);
                                setRawWorktopLaborQty(undefined);
                              }}
                              placeholder="1"
                              style={{
                                width: "100%",
                                borderRadius: "8px",
                                fontSize: "13px",
                                background: "transparent",
                                color: "#fff",
                                border: "none",
                                padding: "8px 0",
                                boxShadow: "none",
                                backgroundColor: "transparent",
                                WebkitAppearance: "none",
                                MozAppearance: "textfield",
                                outline: "none",
                                textAlign: "left"
                              }}
                              min="1"
                              step="1"
                            />
                          </div>
                          <div style={{ flex: "1", marginRight: "16px", paddingLeft: "12px" }}>
                            <input
                              type="number"
                              value={rawWorktopLaborUnitPrice !== undefined ? rawWorktopLaborUnitPrice : (worktopLaborUnitPrice === 3000? "" : worktopLaborUnitPrice)}
                              onFocus={e => setRawWorktopLaborUnitPrice(worktopLaborUnitPrice === 3000? "" : String(worktopLaborUnitPrice))}
                              onChange={e => setRawWorktopLaborUnitPrice(e.target.value)}
                              onBlur={e => {
                                const val = rawWorktopLaborUnitPrice ?? "";
                                const num = val === '' ? 3000: Number(val);
                                setWorktopLaborUnitPrice(isNaN(num) ? 3000: num);
                                setRawWorktopLaborUnitPrice(undefined);
                              }}
                              placeholder="3000"
                              style={{
                                width: "100%",
                                borderRadius: "8px",
                                fontSize: "13px",
                                background: "transparent",
                                color: "#fff",
                                border: "none",
                                padding: "8px 0",
                                boxShadow: "none",
                                backgroundColor: "transparent",
                                WebkitAppearance: "none",
                                MozAppearance: "textfield",
                                outline: "none",
                                textAlign: "left"
                              }}
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div style={{ flex: "1", marginRight: "16px", color: "#fff", fontWeight: 600, paddingLeft: "12px" }}>
                            KES {(worktopLaborQty * worktopLaborUnitPrice).toFixed(2)}
                          </div>
                          {!isReadOnly && <div style={{ flex: "0 0 40px" }}></div>}
                        </div>
                      )}

                      {/* Move the Add Item button to be the last element: */}
                      {!isReadOnly && (
                        <div className="mt-3">
                        <button
                          type="button"
                            className="btn btn-primary"
                            onClick={() => addItem("worktop")}
                            style={{
                              borderRadius: "12px",
                              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              border: "none",
                              padding: "10px 20px"
                            }}
                        >
                          <Plus size={14} className="me-1" />
                            Add Item
                        </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Accessories Section with Animated Toggle */}
            <div className="mb-4">
              <div className="card" style={{ borderRadius: "16px", border: "1px solid #e9ecef", boxShadow: "none" }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    {!isReadOnly && (
                      <div className="d-flex align-items-center w-100">
                        {/* Section Title - Hidden when toggle is off */}
                        <div 
                          style={{
                            display: includeAccessories ? "flex" : "none",
                            alignItems: "center",
                            marginRight: "12px",
                            transition: "all 0.3s ease",
                            transform: includeAccessories ? "translateX(0)" : "translateX(-20px)",
                            opacity: includeAccessories ? 1 : 0
                          }}
                        >
                          <Calculator size={18} className="me-2" style={{ color: "#ffffff" }} />
                          <EditableSectionHeader
                            sectionKey="accessories"
                            currentName={sectionNames.accessories}
                            onEdit={() => handleSectionNameEdit("accessories")}
                            onSave={() => handleSectionNameSave("accessories")}
                            onCancel={handleSectionNameCancel}
                            onKeyPress={(e) => handleSectionNameKeyPress(e, "accessories")}
                            isEditing={editingSection === "accessories"}
                            editingName={editingSectionName}
                            onEditingNameChange={setEditingSectionName}
                            isReadOnly={isReadOnly}
                          />
                        </div>
                        
                        {/* Toggle Text and Switch */}
                        <div 
                          className="d-flex align-items-center"
                          style={{
                            marginLeft: includeAccessories ? "auto" : "0",
                            transition: "all 0.3s ease",
                            transform: includeAccessories ? "translateX(0)" : "translateX(0)"
                          }}
                        >
                          <span 
                            className="me-2 small fw-semibold" 
                            style={{ 
                              color: "#ffffff",
                              transition: "all 0.3s ease"
                            }}
                          >
                            {includeAccessories ? "Remove Accessories" : "Include Accessories"}
                          </span>
                          <div 
                            className="position-relative"
                            style={{
                              width: "44px",
                              height: "24px",
                              borderRadius: "12px",
                              background: includeAccessories ? "#667eea" : "#e9ecef",
                              cursor: isReadOnly ? "default" : "pointer",
                              transition: "background-color 0.2s"
                            }}
                            onClick={() => !isReadOnly && setIncludeAccessories(!includeAccessories)}
                          >
                            <div
                              style={{
                                position: "absolute",
                                top: "2px",
                                left: includeAccessories ? "22px" : "2px",
                                width: "20px",
                                height: "20px",
                                borderRadius: "50%",
                                background: "white",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                transition: "left 0.2s"
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {includeAccessories && (
                    <div className="mb-3">
                      
                      {/* Column Headers */}
                      <div className="d-flex mb-3" style={{ 
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "white"
                      }}>
                        <div style={{ flex: "2", marginRight: "16px" }}>Item</div>
                        <div style={{ flex: "1", marginRight: "16px" }}>Units</div>
                        <div style={{ flex: "1", marginRight: "16px" }}>Qty</div>
                        <div style={{ flex: "1", marginRight: "16px" }}>Unit Price</div>
                        <div style={{ flex: "1", marginRight: "16px" }}>Total</div>
                        {!isReadOnly && <div style={{ flex: "0 0 40px" }}></div>}
                      </div>

                      {/* Item Rows */}
                      {accessoriesItems.map((item, index) => (
                        <div key={item.id} className="d-flex align-items-center mb-2">
                          <div style={{ flex: "2", marginRight: "16px" }}>
                            <div className="position-relative" ref={getItemInputRef(item.id?.toString() || "")}>
                          <input
                            type="text"
                                className="form-control"
                            value={item.description}
                                onChange={(e) => {
                                  updateItem("accessories", index, "description", e.target.value)
                                  handleItemSearch(item.id?.toString() || "", e.target.value)
                                  setItemDropdownVisible(prev => ({ ...prev, [item.id?.toString() || ""]: true }))
                                }}
                                onFocus={() => setItemDropdownVisible(prev => ({ ...prev, [item.id?.toString() || ""]: true }))}
                                placeholder="Search and select item"
                                style={{ borderRadius: "12px", height: "40px", fontSize: "13px" }}
                            readOnly={isReadOnly}
                          />
                              
                              <PortalDropdown
                                isVisible={itemDropdownVisible[item.id?.toString() || ""] && !isReadOnly}
                                triggerRef={getItemInputRef(item.id?.toString() || "")}
                                onClose={() => setItemDropdownVisible(prev => ({ ...prev, [item.id?.toString() || ""]: false }))}
                              >
                                {getFilteredItems(item.id?.toString() || "").map(stockItem => (
                                  <li
                                    key={stockItem.id}
                                    style={{
                                      padding: "8px 12px",
                                      cursor: "pointer",
                                      borderBottom: "1px solid #f1f3f4",
                                      background: "#fff",
                                      color: "#212529"
                                    }}
                                    onClick={() => selectStockItem(item.id?.toString() || "", stockItem)}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "#fff"}
                                  >
                                    <div style={{ fontWeight: "600", fontSize: "13px", color: "#212529" }}>{stockItem.name}</div>
                                    <div style={{ fontSize: "11px", color: "#495057" }}>
                                      Unit Price: KES {stockItem.unit_price?.toFixed(2) || stockItem.unit_price?.toFixed(2)}
                                    </div>
                                  </li>
                                ))}
                              </PortalDropdown>
                            </div>
                          </div>
                          
                          <div style={{ flex: "1", marginRight: "16px" }}>
                          <input
                            type="text"
                              className="form-control"
                            value={item.unit}
                              onChange={(e) => updateItem("accessories", index, "unit", e.target.value)}
                              placeholder="Units"
                              style={{ borderRadius: "12px", height: "40px", fontSize: "13px" }}
                            readOnly={isReadOnly}
                          />
                          </div>
                          
                          <div style={{ flex: "1", marginRight: "16px" }}>
                          <input
                            type="number"
                            value={
                              rawQuantityValues[item.id?.toString() || ""] !== undefined
                                ? rawQuantityValues[item.id?.toString() || ""]
                                : (item.quantity === 1 ? "" : item.quantity)
                            }
                            onFocus={e => {
                              setRawQuantityValues(prev => ({ ...prev, [item.id?.toString() || ""]: prev[item.id?.toString() || ""] ?? (item.quantity === 1 ? "" : String(item.quantity)) }));
                            }}
                            onChange={e => {
                              const val = e.target.value;
                              setRawQuantityValues(prev => ({ ...prev, [item.id?.toString() || ""]: val }));
                            }}
                            onBlur={e => {
                              const val = e.target.value;
                              const num = val === '' ? 1 : Number(val);
                              updateItem("accessories", index, "quantity", isNaN(num) ? 1 : num);
                              setRawQuantityValues(prev => {
                                const copy = { ...prev };
                                delete copy[item.id?.toString() || ""];
                                return copy;
                              });
                            }}
                            placeholder="1"
                            style={{ 
                              width: "100%",
                              borderRadius: "12px", 
                              height: "40px", 
                              fontSize: "13px",
                              background: "transparent", 
                              color: "#fff", 
                              border: "none",
                              padding: "8px 12px",
                              boxShadow: "none",
                              backgroundColor: "transparent",
                              WebkitAppearance: "none",
                              MozAppearance: "textfield",
                              outline: "none"
                            }}
                            readOnly={isReadOnly}
                            min="0"
                            step="0.01"
                          />
                          </div>
                          
                          <div style={{ flex: "1", marginRight: "16px" }}>
                          <input
                            type="number"
                              className="form-control"
                            value={item.unit_price || ""}
                            onChange={(e) => updateItem("accessories", index, "unit_price", parseFloat(e.target.value) || 0)}
                            placeholder="Unit Price"
                            style={{ borderRadius: "12px", height: "40px", fontSize: "13px" }}
                            readOnly={isReadOnly}
                            min="0"
                            step="0.01"
                          />
                          </div>
                          
                          <div style={{ flex: "1", marginRight: "16px", fontWeight: "600", color: "#ffffff" }}>
                            KES {item.total_price.toFixed(2)}
                          </div>
                          
                        {!isReadOnly && (
                            <div style={{ flex: "0 0 40px" }}>
                            <button
                              type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeItem("accessories", index)}
                                style={{ borderRadius: "8px", padding: "4px 8px" }}
                            >
                                <X size={12} />
                            </button>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Minimalistic Labour Footer for Accessories Section */}
                      {mode !== "view" && (
                        <div className="d-flex align-items-center mt-2 p-2" style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px" }}>
                          <div style={{ flex: "2", marginRight: "16px", fontWeight: 600, color: "#fff" }}>Add Labour</div>
                          <div style={{ flex: "1", marginRight: "16px", color: "#fff", paddingLeft: "12px" }}>%</div>
                          <div style={{ flex: "1", marginRight: "16px", paddingLeft: "12px" }}>
                            <input
                              type="number"
                              value={accessoriesLabourPercentage === 30 ? "" : (accessoriesLabourPercentage === 0 ? "" : accessoriesLabourPercentage)}
                              onFocus={e => {
                                e.target.value = "";
                                setAccessoriesLabourPercentage(0);
                              }}
                              onChange={e => setAccessoriesLabourPercentage(Number(e.target.value) || 0)}
                              onBlur={e => setAccessoriesLabourPercentage(Number(e.target.value) || 30)}
                              placeholder="30"
                              style={{ 
                                width: "100%",
                                borderRadius: "8px", 
                                fontSize: "13px", 
                                background: "transparent", 
                                color: "#fff", 
                                border: "none",
                                padding: "8px 0",
                                boxShadow: "none",
                                backgroundColor: "transparent",
                                WebkitAppearance: "none",
                                MozAppearance: "textfield",
                                outline: "none"
                              }}
                              min="0"
                              max="100"
                              step="0.01"
                            />
                          </div>
                          <div style={{ flex: "1", marginRight: "16px" }}></div>
                          <div style={{ flex: "1", marginRight: "16px", color: "#fff", fontWeight: 600, paddingLeft: "12px" }}>KES {totals.accessoriesLabour.toFixed(2)}</div>
                          {!isReadOnly && <div style={{ flex: "0 0 40px" }}></div>}
                        </div>
                      )}

                      {/* Add Item Button */}
                      {!isReadOnly && (
                        <div className="mt-3">
                        <button
                          type="button"
                            className="btn btn-primary"
                            onClick={() => addItem("accessories")}
                            style={{ 
                              borderRadius: "12px", 
                              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              border: "none",
                              padding: "10px 20px"
                            }}
                        >
                          <Plus size={14} className="me-1" />
                            Add Item
                        </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Appliances Section with Animated Toggle */}
            <div className="mb-4">
              <div className="card" style={{ borderRadius: "16px", border: "1px solid #e9ecef", boxShadow: "none" }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                {!isReadOnly && (
                      <div className="d-flex align-items-center w-100">
                        {/* Section Title - Hidden when toggle is off */}
                        <div 
                          style={{
                            display: includeAppliances ? "flex" : "none",
                            alignItems: "center",
                            marginRight: "12px",
                            transition: "all 0.3s ease",
                            transform: includeAppliances ? "translateX(0)" : "translateX(-20px)",
                            opacity: includeAppliances ? 1 : 0
                          }}
                        >
                          <Calculator size={18} className="me-2" style={{ color: "#ffffff" }} />
                          <EditableSectionHeader
                            sectionKey="appliances"
                            currentName={sectionNames.appliances}
                            onEdit={() => handleSectionNameEdit("appliances")}
                            onSave={() => handleSectionNameSave("appliances")}
                            onCancel={handleSectionNameCancel}
                            onKeyPress={(e) => handleSectionNameKeyPress(e, "appliances")}
                            isEditing={editingSection === "appliances"}
                            editingName={editingSectionName}
                            onEditingNameChange={setEditingSectionName}
                            isReadOnly={isReadOnly}
                          />
                        </div>
                        
                        {/* Toggle Text and Switch */}
                        <div 
                          className="d-flex align-items-center"
                          style={{
                            marginLeft: includeAppliances ? "auto" : "0",
                            transition: "all 0.3s ease",
                            transform: includeAppliances ? "translateX(0)" : "translateX(0)"
                          }}
                        >
                          <span 
                            className="me-2 small fw-semibold" 
                            style={{ 
                              color: "#ffffff",
                              transition: "all 0.3s ease"
                            }}
                          >
                            {includeAppliances ? "Remove Appliances" : "Include Appliances"}
                          </span>
                          <div 
                            className="position-relative"
                            style={{
                              width: "44px",
                              height: "24px",
                              borderRadius: "12px",
                              background: includeAppliances ? "#667eea" : "#e9ecef",
                              cursor: isReadOnly ? "default" : "pointer",
                              transition: "background-color 0.2s"
                            }}
                            onClick={() => !isReadOnly && setIncludeAppliances(!includeAppliances)}
                          >
                            <div
                              style={{
                                position: "absolute",
                                top: "2px",
                                left: includeAppliances ? "22px" : "2px",
                                width: "20px",
                                height: "20px",
                                borderRadius: "50%",
                                background: "white",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                transition: "left 0.2s"
                              }}
                            />
                          </div>
                        </div>
                  </div>
                )}
              </div>
                  
                  {includeAppliances && (
                    <div className="mb-3">
                      
                      {/* Column Headers */}
                      <div className="d-flex mb-3" style={{ 
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "white"
                      }}>
                        <div style={{ flex: "2", marginRight: "16px" }}>Item</div>
                        <div style={{ flex: "1", marginRight: "16px" }}>Units</div>
                        <div style={{ flex: "1", marginRight: "16px" }}>Qty</div>
                        <div style={{ flex: "1", marginRight: "16px" }}>Unit Price</div>
                        <div style={{ flex: "1", marginRight: "16px" }}>Total</div>
                        {!isReadOnly && <div style={{ flex: "0 0 40px" }}></div>}
                      </div>

                      {/* Item Rows */}
                      {appliancesItems.map((item, index) => (
                        <div key={item.id} className="d-flex align-items-center mb-2">
                          <div style={{ flex: "2", marginRight: "16px" }}>
                            <div className="position-relative" ref={getItemInputRef(item.id?.toString() || "")}>
                          <input
                            type="text"
                                className="form-control"
                            value={item.description}
                                onChange={(e) => {
                                  updateItem("appliances", index, "description", e.target.value)
                                  handleItemSearch(item.id?.toString() || "", e.target.value)
                                  setItemDropdownVisible(prev => ({ ...prev, [item.id?.toString() || ""]: true }))
                                }}
                                onFocus={() => setItemDropdownVisible(prev => ({ ...prev, [item.id?.toString() || ""]: true }))}
                                placeholder="Search and select item"
                                style={{ borderRadius: "12px", height: "40px", fontSize: "13px" }}
                            readOnly={isReadOnly}
                          />
                              
                              <PortalDropdown
                                isVisible={itemDropdownVisible[item.id?.toString() || ""] && !isReadOnly}
                                triggerRef={getItemInputRef(item.id?.toString() || "")}
                                onClose={() => setItemDropdownVisible(prev => ({ ...prev, [item.id?.toString() || ""]: false }))}
                              >
                                {getFilteredItems(item.id?.toString() || "").map(stockItem => (
                                  <li
                                    key={stockItem.id}
                                    style={{
                                      padding: "8px 12px",
                                      cursor: "pointer",
                                      borderBottom: "1px solid #f1f3f4",
                                      background: "#fff",
                                      color: "#212529"
                                    }}
                                    onClick={() => selectStockItem(item.id?.toString() || "", stockItem)}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "#fff"}
                                  >
                                    <div style={{ fontWeight: "600", fontSize: "13px", color: "#212529" }}>{stockItem.name}</div>
                                    <div style={{ fontSize: "11px", color: "#495057" }}>
                                      Unit Price: KES {stockItem.unit_price?.toFixed(2) || stockItem.unit_price?.toFixed(2)}
                                    </div>
                                  </li>
                                ))}
                              </PortalDropdown>
                            </div>
                          </div>
                          
                          <div style={{ flex: "1", marginRight: "16px" }}>
                          <input
                            type="text"
                              className="form-control"
                            value={item.unit}
                              onChange={(e) => updateItem("appliances", index, "unit", e.target.value)}
                              placeholder="Units"
                              style={{ borderRadius: "12px", height: "40px", fontSize: "13px" }}
                            readOnly={isReadOnly}
                          />
                          </div>
                          
                          <div style={{ flex: "1", marginRight: "16px" }}>
                          <input
                            type="number"
                            value={
                              rawQuantityValues[item.id?.toString() || ""] !== undefined
                                ? rawQuantityValues[item.id?.toString() || ""]
                                : (item.quantity === 1 ? "" : item.quantity)
                            }
                            onFocus={e => {
                              setRawQuantityValues(prev => ({ ...prev, [item.id?.toString() || ""]: prev[item.id?.toString() || ""] ?? (item.quantity === 1 ? "" : String(item.quantity)) }));
                            }}
                            onChange={e => {
                              const val = e.target.value;
                              setRawQuantityValues(prev => ({ ...prev, [item.id?.toString() || ""]: val }));
                            }}
                            onBlur={e => {
                              const val = e.target.value;
                              const num = val === '' ? 1 : Number(val);
                              updateItem("appliances", index, "quantity", isNaN(num) ? 1 : num);
                              setRawQuantityValues(prev => {
                                const copy = { ...prev };
                                delete copy[item.id?.toString() || ""];
                                return copy;
                              });
                            }}
                            placeholder="1"
                            style={{ 
                              width: "100%",
                              borderRadius: "12px", 
                              height: "40px", 
                              fontSize: "13px",
                              background: "transparent", 
                              color: "#fff", 
                              border: "none",
                              padding: "8px 12px",
                              boxShadow: "none",
                              backgroundColor: "transparent",
                              WebkitAppearance: "none",
                              MozAppearance: "textfield",
                              outline: "none"
                            }}
                            readOnly={isReadOnly}
                            min="0"
                            step="0.01"
                          />
                          </div>
                          
                          <div style={{ flex: "1", marginRight: "16px" }}>
                          <input
                            type="number"
                              className="form-control"
                            value={item.unit_price || ""}
                            onChange={(e) => updateItem("appliances", index, "unit_price", parseFloat(e.target.value) || 0)}
                            placeholder="Unit Price"
                            style={{ borderRadius: "12px", height: "40px", fontSize: "13px" }}
                            readOnly={isReadOnly}
                            min="0"
                            step="0.01"
                          />
                          </div>
                          
                          <div style={{ flex: "1", marginRight: "16px", fontWeight: "600", color: "#ffffff" }}>
                            KES {item.total_price.toFixed(2)}
                          </div>
                          
                        {!isReadOnly && (
                            <div style={{ flex: "0 0 40px" }}>
                            <button
                              type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeItem("appliances", index)}
                                style={{ borderRadius: "8px", padding: "4px 8px" }}
                            >
                                <X size={12} />
                            </button>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Minimalistic Labour Footer for Appliances Section */}
                      {mode !== "view" && (
                        <div className="d-flex align-items-center mt-2 p-2" style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px" }}>
                          <div style={{ flex: "2", marginRight: "16px", fontWeight: 600, color: "#fff" }}>Add Labour</div>
                          <div style={{ flex: "1", marginRight: "16px", color: "#fff", paddingLeft: "12px" }}>%</div>
                          <div style={{ flex: "1", marginRight: "16px", paddingLeft: "12px" }}>
                            <input
                              type="number"
                              value={appliancesLabourPercentage === 30 ? "" : (appliancesLabourPercentage === 0 ? "" : appliancesLabourPercentage)}
                              onFocus={e => {
                                e.target.value = "";
                                setAppliancesLabourPercentage(0);
                              }}
                              onChange={e => setAppliancesLabourPercentage(Number(e.target.value) || 0)}
                              onBlur={e => setAppliancesLabourPercentage(Number(e.target.value) || 30)}
                              placeholder="30"
                              style={{ 
                                width: "100%",
                                borderRadius: "8px", 
                                fontSize: "13px", 
                                background: "transparent", 
                                color: "#fff", 
                                border: "none",
                                padding: "8px 0",
                                boxShadow: "none",
                                backgroundColor: "transparent",
                                WebkitAppearance: "none",
                                MozAppearance: "textfield",
                                outline: "none"
                              }}
                              min="0"
                              max="100"
                              step="0.01"
                            />
                          </div>
                          <div style={{ flex: "1", marginRight: "16px" }}></div>
                          <div style={{ flex: "1", marginRight: "16px", color: "#fff", fontWeight: 600, paddingLeft: "12px" }}>KES {totals.appliancesLabour.toFixed(2)}</div>
                          {!isReadOnly && <div style={{ flex: "0 0 40px" }}></div>}
                        </div>
                      )}

                      {/* Add Item Button */}
                      {!isReadOnly && (
                        <div className="mt-3">
                        <button
                          type="button"
                            className="btn btn-primary"
                            onClick={() => addItem("appliances")}
                            style={{ 
                              borderRadius: "12px", 
                              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              border: "none",
                              padding: "10px 20px"
                            }}
                        >
                          <Plus size={14} className="me-1" />
                            Add Item
                        </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Wardrobes Section with Animated Toggle */}
            <div className="mb-4">
              <div className="card" style={{ borderRadius: "16px", border: "1px solid #e9ecef", boxShadow: "none" }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                {!isReadOnly && (
                      <div className="d-flex align-items-center w-100">
                        {/* Section Title - Hidden when toggle is off */}
                        <div 
                          style={{
                            display: includeWardrobes ? "flex" : "none",
                            alignItems: "center",
                            marginRight: "12px",
                            transition: "all 0.3s ease",
                            transform: includeWardrobes ? "translateX(0)" : "translateX(-20px)",
                            opacity: includeWardrobes ? 1 : 0
                          }}
                        >
                          <Calculator size={18} className="me-2" style={{ color: "#ffffff" }} />
                          <EditableSectionHeader
                            sectionKey="wardrobes"
                            currentName={sectionNames.wardrobes}
                            onEdit={() => handleSectionNameEdit("wardrobes")}
                            onSave={() => handleSectionNameSave("wardrobes")}
                            onCancel={handleSectionNameCancel}
                            onKeyPress={(e) => handleSectionNameKeyPress(e, "wardrobes")}
                            isEditing={editingSection === "wardrobes"}
                            editingName={editingSectionName}
                            onEditingNameChange={setEditingSectionName}
                            isReadOnly={isReadOnly}
                          />
                        </div>
                        
                        {/* Toggle Text and Switch */}
                        <div 
                          className="d-flex align-items-center"
                          style={{
                            marginLeft: includeWardrobes ? "auto" : "0",
                            transition: "all 0.3s ease",
                            transform: includeWardrobes ? "translateX(0)" : "translateX(0)"
                          }}
                        >
                          <span 
                            className="me-2 small fw-semibold" 
                            style={{ 
                              color: "#ffffff",
                              transition: "all 0.3s ease"
                            }}
                          >
                            {includeWardrobes ? "Remove Wardrobes" : "Include Wardrobes"}
                          </span>
                          <div 
                            className="position-relative"
                            style={{
                              width: "44px",
                              height: "24px",
                              borderRadius: "12px",
                              background: includeWardrobes ? "#667eea" : "#e9ecef",
                              cursor: isReadOnly ? "default" : "pointer",
                              transition: "background-color 0.2s"
                            }}
                            onClick={() => !isReadOnly && setIncludeWardrobes(!includeWardrobes)}
                          >
                            <div
                              style={{
                                position: "absolute",
                                top: "2px",
                                left: includeWardrobes ? "22px" : "2px",
                                width: "20px",
                                height: "20px",
                                borderRadius: "50%",
                                background: "white",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                transition: "left 0.2s"
                              }}
                            />
                          </div>
                        </div>
                  </div>
                )}
              </div>
                  
                  {includeWardrobes && (
                    <div className="mb-3">
                      
                      {/* Column Headers */}
                      <div className="d-flex mb-3" style={{ 
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "white"
                      }}>
                        <div style={{ flex: "2", marginRight: "16px" }}>Item</div>
                        <div style={{ flex: "1", marginRight: "16px" }}>Units</div>
                        <div style={{ flex: "1", marginRight: "16px" }}>Qty</div>
                        <div style={{ flex: "1", marginRight: "16px" }}>Unit Price</div>
                        <div style={{ flex: "1", marginRight: "16px" }}>Total</div>
                        {!isReadOnly && <div style={{ flex: "0 0 40px" }}></div>}
                      </div>

                      {/* Item Rows */}
                      {wardrobesItems.map((item, index) => (
                        <div key={item.id} className="d-flex align-items-center mb-2">
                          <div style={{ flex: "2", marginRight: "16px" }}>
                            <div className="position-relative" ref={getItemInputRef(item.id?.toString() || "")}>
                          <input
                            type="text"
                                className="form-control"
                            value={item.description}
                                onChange={(e) => {
                                  updateItem("wardrobes", index, "description", e.target.value)
                                  handleItemSearch(item.id?.toString() || "", e.target.value)
                                  setItemDropdownVisible(prev => ({ ...prev, [item.id?.toString() || ""]: true }))
                                }}
                                onFocus={() => setItemDropdownVisible(prev => ({ ...prev, [item.id?.toString() || ""]: true }))}
                                placeholder="Search and select item"
                                style={{ borderRadius: "12px", height: "40px", fontSize: "13px" }}
                            readOnly={isReadOnly}
                          />
                              
                              <PortalDropdown
                                isVisible={itemDropdownVisible[item.id?.toString() || ""] && !isReadOnly}
                                triggerRef={getItemInputRef(item.id?.toString() || "")}
                                onClose={() => setItemDropdownVisible(prev => ({ ...prev, [item.id?.toString() || ""]: false }))}
                              >
                                {getFilteredItems(item.id?.toString() || "").map(stockItem => (
                                  <li
                                    key={stockItem.id}
                                    style={{
                                      padding: "8px 12px",
                                      cursor: "pointer",
                                      borderBottom: "1px solid #f1f3f4",
                                      background: "#fff",
                                      color: "#212529"
                                    }}
                                    onClick={() => selectStockItem(item.id?.toString() || "", stockItem)}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "#fff"}
                                  >
                                    <div style={{ fontWeight: "600", fontSize: "13px", color: "#212529" }}>{stockItem.name}</div>
                                    <div style={{ fontSize: "11px", color: "#495057" }}>
                                      Unit Price: KES {stockItem.unit_price?.toFixed(2) || stockItem.unit_price?.toFixed(2)}
                                    </div>
                                  </li>
                                ))}
                              </PortalDropdown>
                            </div>
                          </div>
                          
                          <div style={{ flex: "1", marginRight: "16px" }}>
                          <input
                            type="text"
                              className="form-control"
                            value={item.unit}
                              onChange={(e) => updateItem("wardrobes", index, "unit", e.target.value)}
                              placeholder="Units"
                              style={{ borderRadius: "12px", height: "40px", fontSize: "13px" }}
                            readOnly={isReadOnly}
                          />
                          </div>
                          
                          <div style={{ flex: "1", marginRight: "16px" }}>
                          <input
                            type="number"
                            value={
                              rawQuantityValues[item.id?.toString() || ""] !== undefined
                                ? rawQuantityValues[item.id?.toString() || ""]
                                : (item.quantity === 1 ? "" : item.quantity)
                            }
                            onFocus={e => {
                              setRawQuantityValues(prev => ({ ...prev, [item.id?.toString() || ""]: prev[item.id?.toString() || ""] ?? (item.quantity === 1 ? "" : String(item.quantity)) }));
                            }}
                            onChange={e => {
                              const val = e.target.value;
                              setRawQuantityValues(prev => ({ ...prev, [item.id?.toString() || ""]: val }));
                            }}
                            onBlur={e => {
                              const val = e.target.value;
                              const num = val === '' ? 1 : Number(val);
                              updateItem("wardrobes", index, "quantity", isNaN(num) ? 1 : num);
                              setRawQuantityValues(prev => {
                                const copy = { ...prev };
                                delete copy[item.id?.toString() || ""];
                                return copy;
                              });
                            }}
                            placeholder="1"
                            style={{ 
                              width: "100%",
                              borderRadius: "12px", 
                              height: "40px", 
                              fontSize: "13px",
                              background: "transparent", 
                              color: "#fff", 
                              border: "none",
                              padding: "8px 12px",
                              boxShadow: "none",
                              backgroundColor: "transparent",
                              WebkitAppearance: "none",
                              MozAppearance: "textfield",
                              outline: "none"
                            }}
                            readOnly={isReadOnly}
                            min="0"
                            step="0.01"
                          />
                          </div>
                          
                          <div style={{ flex: "1", marginRight: "16px" }}>
                          <input
                            type="number"
                              className="form-control"
                            value={item.unit_price || ""}
                            onChange={(e) => updateItem("wardrobes", index, "unit_price", parseFloat(e.target.value) || 0)}
                            placeholder="Unit Price"
                            style={{ borderRadius: "12px", height: "40px", fontSize: "13px" }}
                            readOnly={isReadOnly}
                            min="0"
                            step="0.01"
                          />
                          </div>
                          
                          <div style={{ flex: "1", marginRight: "16px", fontWeight: "600", color: "#ffffff" }}>
                            KES {item.total_price.toFixed(2)}
                          </div>
                          
                        {!isReadOnly && (
                            <div style={{ flex: "0 0 40px" }}>
                            <button
                              type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeItem("wardrobes", index)}
                                style={{ borderRadius: "8px", padding: "4px 8px" }}
                            >
                                <X size={12} />
                            </button>
                            </div>
                          )}
                        </div>
                      )                      )}

                      {/* Minimalistic Labour Footer for Wardrobes Section */}
                      {mode !== "view" && (
                        <div className="d-flex align-items-center mt-2 p-2" style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px" }}>
                          <div style={{ flex: "2", marginRight: "16px", fontWeight: 600, color: "#fff" }}>Add Labour</div>
                          <div style={{ flex: "1", marginRight: "16px", color: "#fff", paddingLeft: "12px" }}>%</div>
                          <div style={{ flex: "1", marginRight: "16px", paddingLeft: "12px" }}>
                            <input
                              type="number"
                              value={wardrobesLabourPercentage === 30 ? "" : (wardrobesLabourPercentage === 0 ? "" : wardrobesLabourPercentage)}
                              onFocus={e => {
                                e.target.value = "";
                                setWardrobesLabourPercentage(0);
                              }}
                              onChange={e => setWardrobesLabourPercentage(Number(e.target.value) || 0)}
                              onBlur={e => setWardrobesLabourPercentage(Number(e.target.value) || 30)}
                              placeholder="30"
                              style={{ 
                                width: "100%",
                                borderRadius: "8px", 
                                fontSize: "13px", 
                                background: "transparent", 
                                color: "#fff", 
                                border: "none",
                                padding: "8px 0",
                                boxShadow: "none",
                                backgroundColor: "transparent",
                                WebkitAppearance: "none",
                                MozAppearance: "textfield",
                                outline: "none"
                              }}
                              min="0"
                              max="100"
                              step="0.01"
                            />
                          </div>
                          <div style={{ flex: "1", marginRight: "16px" }}></div>
                          <div style={{ flex: "1", marginRight: "16px", color: "#fff", fontWeight: 600, paddingLeft: "12px" }}>KES {totals.wardrobesLabour.toFixed(2)}</div>
                          {!isReadOnly && <div style={{ flex: "0 0 40px" }}></div>}
                        </div>
                      )}

                      {/* Add Item Button */}
                      {!isReadOnly && (
                        <div className="mt-3">
                        <button
                          type="button"
                            className="btn btn-primary"
                            onClick={() => addItem("wardrobes")}
                            style={{ 
                              borderRadius: "12px", 
                              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              border: "none",
                              padding: "10px 20px"
                            }}
                        >
                          <Plus size={14} className="me-1" />
                            Add Item
                        </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* TV Unit Section with Animated Toggle */}
            <div className="mb-4">
              <div className="card" style={{ borderRadius: "16px", border: "1px solid #e9ecef", boxShadow: "none" }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                {!isReadOnly && (
                      <div className="d-flex align-items-center w-100">
                        {/* Section Title - Hidden when toggle is off */}
                        <div 
                          style={{
                            display: includeTvUnit ? "flex" : "none",
                            alignItems: "center",
                            marginRight: "12px",
                            transition: "all 0.3s ease",
                            transform: includeTvUnit ? "translateX(0)" : "translateX(-20px)",
                            opacity: includeTvUnit ? 1 : 0
                          }}
                        >
                          <Calculator size={18} className="me-2" style={{ color: "#ffffff" }} />
                          <EditableSectionHeader
                            sectionKey="tvunit"
                            currentName={sectionNames.tvunit}
                            onEdit={() => handleSectionNameEdit("tvunit")}
                            onSave={() => handleSectionNameSave("tvunit")}
                            onCancel={handleSectionNameCancel}
                            onKeyPress={(e) => handleSectionNameKeyPress(e, "tvunit")}
                            isEditing={editingSection === "tvunit"}
                            editingName={editingSectionName}
                            onEditingNameChange={setEditingSectionName}
                            isReadOnly={isReadOnly}
                          />
                        </div>
                        
                        {/* Toggle Text and Switch */}
                        <div 
                          className="d-flex align-items-center"
                          style={{
                            marginLeft: includeTvUnit ? "auto" : "0",
                            transition: "all 0.3s ease",
                            transform: includeTvUnit ? "translateX(0)" : "translateX(0)"
                          }}
                        >
                          <span 
                            className="me-2 small fw-semibold" 
                            style={{ 
                              color: "#ffffff",
                              transition: "all 0.3s ease"
                            }}
                          >
                            {includeTvUnit ? "Remove TV Unit" : "Include TV Unit"}
                          </span>
                          <div 
                            className="position-relative"
                            style={{
                              width: "44px",
                              height: "24px",
                              borderRadius: "12px",
                              background: includeTvUnit ? "#667eea" : "#e9ecef",
                              cursor: isReadOnly ? "default" : "pointer",
                              transition: "background-color 0.2s"
                            }}
                            onClick={() => !isReadOnly && setIncludeTvUnit(!includeTvUnit)}
                          >
                            <div
                              style={{
                                position: "absolute",
                                top: "2px",
                                left: includeTvUnit ? "22px" : "2px",
                                width: "20px",
                                height: "20px",
                                borderRadius: "50%",
                                background: "white",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                transition: "left 0.2s"
                              }}
                            />
                          </div>
                        </div>
                  </div>
                )}
              </div>
                  
                  {includeTvUnit && (
                    <div className="mb-3">
                      
                      {/* Column Headers */}
                      <div className="d-flex mb-3" style={{ 
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "white"
                      }}>
                        <div style={{ flex: "2", marginRight: "16px" }}>Item</div>
                        <div style={{ flex: "1", marginRight: "16px" }}>Units</div>
                        <div style={{ flex: "1", marginRight: "16px" }}>Qty</div>
                        <div style={{ flex: "1", marginRight: "16px" }}>Unit Price</div>
                        <div style={{ flex: "1", marginRight: "16px" }}>Total</div>
                        {!isReadOnly && <div style={{ flex: "0 0 40px" }}></div>}
                      </div>

                      {/* Item Rows */}
                      {tvUnitItems.map((item, index) => (
                        <div key={item.id} className="d-flex align-items-center mb-2">
                          <div style={{ flex: "2", marginRight: "16px" }}>
                            <div className="position-relative" ref={getItemInputRef(item.id?.toString() || "")}>
                          <input
                            type="text"
                                className="form-control"
                            value={item.description}
                                onChange={(e) => {
                                  updateItem("tvunit", index, "description", e.target.value)
                                  handleItemSearch(item.id?.toString() || "", e.target.value)
                                  setItemDropdownVisible(prev => ({ ...prev, [item.id?.toString() || ""]: true }))
                                }}
                                onFocus={() => setItemDropdownVisible(prev => ({ ...prev, [item.id?.toString() || ""]: true }))}
                                placeholder="Search and select item"
                                style={{ borderRadius: "12px", height: "40px", fontSize: "13px" }}
                            readOnly={isReadOnly}
                          />
                              
                              <PortalDropdown
                                isVisible={itemDropdownVisible[item.id?.toString() || ""] && !isReadOnly}
                                triggerRef={getItemInputRef(item.id?.toString() || "")}
                                onClose={() => setItemDropdownVisible(prev => ({ ...prev, [item.id?.toString() || ""]: false }))}
                              >
                                {getFilteredItems(item.id?.toString() || "").map(stockItem => (
                                  <li
                                    key={stockItem.id}
                                    style={{
                                      padding: "8px 12px",
                                      cursor: "pointer",
                                      borderBottom: "1px solid #f1f3f4",
                                      background: "#fff",
                                      color: "#212529"
                                    }}
                                    onClick={() => selectStockItem(item.id?.toString() || "", stockItem)}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "#fff"}
                                  >
                                    <div style={{ fontWeight: "600", fontSize: "13px", color: "#212529" }}>{stockItem.name}</div>
                                    <div style={{ fontSize: "11px", color: "#495057" }}>
                                      Unit Price: KES {stockItem.unit_price?.toFixed(2) || stockItem.unit_price?.toFixed(2)}
                                    </div>
                                  </li>
                                ))}
                              </PortalDropdown>
                            </div>
                          </div>
                          
                          <div style={{ flex: "1", marginRight: "16px" }}>
                          <input
                            type="text"
                              className="form-control"
                            value={item.unit}
                              onChange={(e) => updateItem("tvunit", index, "unit", e.target.value)}
                              placeholder="Units"
                              style={{ borderRadius: "12px", height: "40px", fontSize: "13px" }}
                            readOnly={isReadOnly}
                          />
                          </div>
                          
                          <div style={{ flex: "1", marginRight: "16px" }}>
                          <input
                            type="number"
                            value={
                              rawQuantityValues[item.id?.toString() || ""] !== undefined
                                ? rawQuantityValues[item.id?.toString() || ""]
                                : (item.quantity === 1 ? "" : item.quantity)
                            }
                            onFocus={e => {
                              setRawQuantityValues(prev => ({ ...prev, [item.id?.toString() || ""]: prev[item.id?.toString() || ""] ?? (item.quantity === 1 ? "" : String(item.quantity)) }));
                            }}
                            onChange={e => {
                              const val = e.target.value;
                              setRawQuantityValues(prev => ({ ...prev, [item.id?.toString() || ""]: val }));
                            }}
                            onBlur={e => {
                              const val = e.target.value;
                              const num = val === '' ? 1 : Number(val);
                              updateItem("tvunit", index, "quantity", isNaN(num) ? 1 : num);
                              setRawQuantityValues(prev => {
                                const copy = { ...prev };
                                delete copy[item.id?.toString() || ""];
                                return copy;
                              });
                            }}
                            placeholder="1"
                            style={{ 
                              width: "100%",
                              borderRadius: "12px", 
                              height: "40px", 
                              fontSize: "13px",
                              background: "transparent", 
                              color: "#fff", 
                              border: "none",
                              padding: "8px 12px",
                              boxShadow: "none",
                              backgroundColor: "transparent",
                              WebkitAppearance: "none",
                              MozAppearance: "textfield",
                              outline: "none"
                            }}
                            readOnly={isReadOnly}
                            min="0"
                            step="0.01"
                          />
                          </div>
                          
                          <div style={{ flex: "1", marginRight: "16px" }}>
                          <input
                            type="number"
                              className="form-control"
                            value={item.unit_price || ""}
                            onChange={(e) => updateItem("tvunit", index, "unit_price", parseFloat(e.target.value) || 0)}
                            placeholder="Unit Price"
                            style={{ borderRadius: "12px", height: "40px", fontSize: "13px" }}
                            readOnly={isReadOnly}
                            min="0"
                            step="0.01"
                          />
                          </div>
                          
                          <div style={{ flex: "1", marginRight: "16px", fontWeight: "600", color: "#ffffff" }}>
                            KES {item.total_price.toFixed(2)}
                          </div>
                          
                        {!isReadOnly && (
                            <div style={{ flex: "0 0 40px" }}>
                            <button
                              type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeItem("tvunit", index)}
                                style={{ borderRadius: "8px", padding: "4px 8px" }}
                            >
                                <X size={12} />
                            </button>
                            </div>
                          )}
                        </div>
                      )                      )}

                      {/* Minimalistic Labour Footer for TV Unit Section */}
                      {mode !== "view" && (
                        <div className="d-flex align-items-center mt-2 p-2" style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px" }}>
                          <div style={{ flex: "2", marginRight: "16px", fontWeight: 600, color: "#fff" }}>Add Labour</div>
                          <div style={{ flex: "1", marginRight: "16px", color: "#fff", paddingLeft: "12px" }}>%</div>
                          <div style={{ flex: "1", marginRight: "16px", paddingLeft: "12px" }}>
                            <input
                              type="number"
                              value={tvUnitLabourPercentage === 30 ? "" : (tvUnitLabourPercentage === 0 ? "" : tvUnitLabourPercentage)}
                              onFocus={e => {
                                e.target.value = "";
                                setTvUnitLabourPercentage(0);
                              }}
                              onChange={e => setTvUnitLabourPercentage(Number(e.target.value) || 0)}
                              onBlur={e => setTvUnitLabourPercentage(Number(e.target.value) || 30)}
                              placeholder="30"
                              style={{ 
                                width: "100%",
                                borderRadius: "8px", 
                                fontSize: "13px", 
                                background: "transparent", 
                                color: "#fff", 
                                border: "none",
                                padding: "8px 0",
                                boxShadow: "none",
                                backgroundColor: "transparent",
                                WebkitAppearance: "none",
                                MozAppearance: "textfield",
                                outline: "none"
                              }}
                              min="0"
                              max="100"
                              step="0.01"
                            />
                          </div>
                          <div style={{ flex: "1", marginRight: "16px" }}></div>
                          <div style={{ flex: "1", marginRight: "16px", color: "#fff", fontWeight: 600, paddingLeft: "12px" }}>KES {totals.tvUnitLabour.toFixed(2)}</div>
                          {!isReadOnly && <div style={{ flex: "0 0 40px" }}></div>}
                        </div>
                      )}

                      {/* Add Item Button */}
                      {!isReadOnly && (
                        <div className="mt-3">
                        <button
                          type="button"
                            className="btn btn-primary"
                            onClick={() => addItem("tvunit")}
                            style={{ 
                              borderRadius: "12px", 
                              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              border: "none",
                              padding: "10px 20px"
                            }}
                        >
                          <Plus size={14} className="me-1" />
                            Add Item
                        </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Totals Section */}
            <div className="mb-4">
              <div className="card" style={{ borderRadius: "16px", border: "1px solid #e9ecef", boxShadow: "none" }}>
                <div className="card-body p-4">
                  <h6 className="card-title mb-3 fw-bold" style={{ color: "#ffffff" }}>
                    <Calculator size={18} className="me-2" />
                    Summary
                  </h6>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="d-flex justify-content-between mb-2">
                        <span style={{ color: "#ffffff" }}>{sectionNames.cabinet} Total:</span>
                        <span style={{ fontWeight: "600", color: "#ffffff" }}>KES {(totals.cabinetTotal + cabinetLabour).toFixed(2)}</span>
                      </div>
                      {includeWorktop && (
                        <div className="d-flex justify-content-between mb-2">
                          <span style={{ color: "#ffffff" }}>{sectionNames.worktop} Total:</span>
                          <span style={{ fontWeight: "600", color: "#ffffff" }}>KES {totals.worktopTotal.toFixed(2)}</span>
                        </div>
                      )}
                      {includeAccessories && (
                        <div className="d-flex justify-content-between mb-2">
                          <span style={{ color: "#ffffff" }}>{sectionNames.accessories} Total:</span>
                          <span style={{ fontWeight: "600", color: "#ffffff" }}>KES {(totals.accessoriesTotal + accessoriesLabour).toFixed(2)}</span>
                        </div>
                      )}
                      {includeAppliances && (
                        <div className="d-flex justify-content-between mb-2">
                          <span style={{ color: "#ffffff" }}>{sectionNames.appliances} Total:</span>
                          <span style={{ fontWeight: "600", color: "#ffffff" }}>KES {(totals.appliancesTotal + appliancesLabour).toFixed(2)}</span>
                        </div>
                      )}
                      {includeWardrobes && (
                        <div className="d-flex justify-content-between mb-2">
                          <span style={{ color: "#ffffff" }}>{sectionNames.wardrobes} Total:</span>
                          <span style={{ fontWeight: "600", color: "#ffffff" }}>KES {(totals.wardrobesTotal + (totals.wardrobesTotal * (wardrobesLabourPercentage || 30)) / 100).toFixed(2)}</span>
                        </div>
                      )}
                      {includeTvUnit && (
                        <div className="d-flex justify-content-between mb-2">
                          <span style={{ color: "#ffffff" }}>{sectionNames.tvunit} Total:</span>
                          <span style={{ fontWeight: "600", color: "#ffffff" }}>KES {(totals.tvUnitTotal + (totals.tvUnitTotal * (tvUnitLabourPercentage || 30)) / 100).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex justify-content-between mb-2">
                        <span style={{ color: "#ffffff" }}>Subtotal:</span>
                        <span style={{ fontWeight: "600", color: "#ffffff" }}>KES {originalAmount.toFixed(2)}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <div className="d-flex align-items-center">
                          <span style={{ color: "#ffffff", marginRight: "8px" }}>VAT:</span>
                      <input
                        type="number"
                            value={vatPercentage === 16 ? "" : (vatPercentage === 0 ? "" : vatPercentage)}
                            onFocus={e => {
                              e.target.value = "";
                              setVatPercentage(0);
                            }}
                            onChange={e => setVatPercentage(Number(e.target.value) || 0)}
                            onBlur={e => setVatPercentage(Number(e.target.value) || 16)}
                            placeholder="16"
                            style={{ 
                              width: "60px",
                              borderRadius: "8px", 
                              fontSize: "13px", 
                              background: "transparent", 
                              color: "#fff", 
                              border: "none",
                              padding: "4px 8px",
                              boxShadow: "none",
                              backgroundColor: "transparent",
                              WebkitAppearance: "none",
                              MozAppearance: "textfield",
                              outline: "none",
                              textAlign: "center"
                            }}
                            min="0"
                            max="100"
                            step="0.01"
                        readOnly={isReadOnly}
                      />
                          <span style={{ color: "#ffffff", marginLeft: "4px" }}>%</span>
                        </div>
                        <span style={{ fontWeight: "600", color: "#ffffff" }}>KES {vatAmount.toFixed(2)}</span>
                      </div>
                      <div className="d-flex justify-content-between" style={{ borderTop: "2px solid #e9ecef", paddingTop: "8px" }}>
                        <span style={{ fontWeight: "700", color: "#ffffff" }}>Grand Total:</span>
                        <span style={{ fontWeight: "700", color: "#ffffff", fontSize: "18px" }}>KES {subtotalWithLabour.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes and Terms Section */}
            <div className="row mb-4">
              <div className="col-md-6">
                <div className="card" style={{ borderRadius: "16px", border: "1px solid #e9ecef", boxShadow: "none" }}>
                  <div className="card-body p-4">
                    <h6 className="card-title mb-3 fw-bold" style={{ color: "#ffffff" }}>
                      Notes
                    </h6>
              <textarea
                className="form-control"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Additional notes..."
                      style={{ borderRadius: "12px", border: "1px solid #e9ecef", minHeight: "100px" }}
                readOnly={isReadOnly}
              />
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card" style={{ borderRadius: "16px", border: "1px solid #e9ecef", boxShadow: "none" }}>
                  <div className="card-body p-4">
                    <h6 className="card-title mb-3 fw-bold" style={{ color: "#ffffff" }}>
                      Terms & Conditions
                    </h6>
              <textarea
                className="form-control"
                      value={termsConditions}
                      onChange={(e) => setTermsConditions(e.target.value)}
                      placeholder="Terms and conditions..."
                      style={{ borderRadius: "12px", border: "1px solid #e9ecef", minHeight: "100px" }}
                readOnly={isReadOnly}
              />
          </div>
                </div>
              </div>
            </div>
            </div>
          )}

          {/* Footer */}
          <div className="modal-footer border-0" style={{ padding: "16px 32px 24px" }}>
            {mode === "view" ? (
              <>
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={onClose}
                  style={{ borderRadius: "12px", padding: "10px 24px" }}
                >
                  Close
                </button>
                {(() => {
                  const showButton = hasPayments && quotation?.status !== "converted_to_sales_order" && onProceedToSalesOrder;
                  
                  // Debug logging for button visibility
                  console.log('Proceed to Sales Order Button Debug:', {
                    hasPayments,
                    quotation_status: quotation?.status,
                    onProceedToSalesOrder: !!onProceedToSalesOrder,
                    showButton,
                    quotation_number: quotation?.quotation_number
                  });
                  
                  return showButton ? (
                  <button
                    type="button"
                    className="btn btn-primary me-2"
                    onClick={() => onProceedToSalesOrder(quotation)}
                    style={{ 
                      borderRadius: "12px", 
                      padding: "10px 24px",
                      background: "linear-gradient(135deg, #007bff 0%, #0056b3 100%)",
                      border: "none"
                    }}
                  >
                    <CreditCard className="me-2" size={16} />
                    Proceed to Sales Order
                  </button>
                  ) : null;
                })()}
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={generatePDF}
                  style={{ 
                    borderRadius: "12px", 
                    padding: "10px 24px",
                    background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
                    border: "none"
                  }}
                >
                  <Download className="me-2" size={16} />
                  Download
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={onClose}
                  style={{ borderRadius: "12px", padding: "10px 24px" }}
                  disabled={loading}
                >
                  Cancel
                </button>
                {(() => {
                  const showButton = hasPayments && quotation?.status !== "converted_to_sales_order" && onProceedToSalesOrder;
                  
                  return showButton ? (
                  <button
                    type="button"
                    className="btn btn-primary me-2"
                    onClick={() => onProceedToSalesOrder(quotation)}
                    style={{ 
                      borderRadius: "12px", 
                      padding: "10px 24px",
                      background: "linear-gradient(135deg, #007bff 0%, #0056b3 100%)",
                      border: "none"
                    }}
                    disabled={loading}
                  >
                    <CreditCard className="me-2" size={16} />
                    Proceed to Sales Order
                  </button>
                  ) : null;
                })()}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSave}
                  style={{ 
                    borderRadius: "12px", 
                    padding: "10px 24px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none"
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    "Save Quotation"
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuotationModal 