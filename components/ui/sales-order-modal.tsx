"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { X, Plus, Trash2, Search, User, Calculator, FileText, ChevronDown, ChevronRight, Package, Calendar, Download, CreditCard, Receipt } from "lucide-react"
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

interface SalesOrderItem {
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

interface SalesOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (salesOrder: any) => void
  salesOrder?: any
  mode: "view" | "edit" | "create"
  onProceedToInvoice?: (salesOrder: any) => Promise<void>
  onProceedToCashSale?: (salesOrder: any) => Promise<void>
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

// Sales order number generation logic (using Supabase, similar to quotations)
const generateOrderNumber = async () => {
  try {
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    // Query Supabase for the latest order number for this year/month
    const { data, error } = await supabase
      .from("sales_orders")
      .select("order_number")
      .ilike("order_number", `SO${year}${month}%`)
      .order("order_number", { ascending: false })
      .limit(1)
    if (error) throw error
    let nextNumber = 1
    if (data && data.length > 0) {
      const match = data[0].order_number.match(/SO\d{4}(\d{3})/)
      if (match) {
        nextNumber = parseInt(match[1]) + 1
      }
    }
    return `SO${year}${month}${nextNumber.toString().padStart(3, '0')}`
  } catch (error) {
    const timestamp = Date.now().toString().slice(-3)
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    return `SO${year}${month}${timestamp}`
  }
}

const SalesOrderModal: React.FC<SalesOrderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  salesOrder,
  mode = "create",
  onProceedToInvoice,
  onProceedToCashSale
}) => {
  const [orderNumber, setOrderNumber] = useState("")
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
  
  // Payment tracking state (for invoice/cash sale criteria)
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
  const [cabinetItems, setCabinetItems] = useState<SalesOrderItem[]>([])
  const [worktopItems, setWorktopItems] = useState<SalesOrderItem[]>([])
  const [accessoriesItems, setAccessoriesItems] = useState<SalesOrderItem[]>([])
  const [appliancesItems, setAppliancesItems] = useState<SalesOrderItem[]>([])
  const [wardrobesItems, setWardrobesItems] = useState<SalesOrderItem[]>([])
  const [tvUnitItems, setTvUnitItems] = useState<SalesOrderItem[]>([])
  
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

  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);

  // Add state for Worktop Installation Labor
  const [worktopLaborQty, setWorktopLaborQty] = useState(1);
  const [worktopLaborUnitPrice, setWorktopLaborUnitPrice] = useState(3000);

  // Add state for raw editing values for Worktop Installation Labor
  const [rawWorktopLaborQty, setRawWorktopLaborQty] = useState<string | undefined>(undefined);
  const [rawWorktopLaborUnitPrice, setRawWorktopLaborUnitPrice] = useState<string | undefined>(undefined);

  // Add individual labour percentage states for each section
  const [cabinetLabourPercentage, setCabinetLabourPercentage] = useState(30);
  const [accessoriesLabourPercentage, setAccessoriesLabourPercentage] = useState(30);
  const [appliancesLabourPercentage, setAppliancesLabourPercentage] = useState(30);
  const [wardrobesLabourPercentage, setWardrobesLabourPercentage] = useState(30);
  const [tvUnitLabourPercentage, setTvUnitLabourPercentage] = useState(30);
  
  // Add VAT percentage state
  const [vatPercentage, setVatPercentage] = useState(16);

  // Function to fetch payment information for original quotation
  const fetchPaymentInfo = async () => {
    if (!salesOrder?.original_quotation_number) return;
    
    try {
      const { data: payments } = await supabase
        .from("payments")
        .select("amount")
        .eq("quotation_number", salesOrder.original_quotation_number)
        .eq("status", "completed")
      
      const totalPaidAmount = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
      const hasPaymentsValue = totalPaidAmount > 0
      const paymentPercentageValue = salesOrder.grand_total > 0 ? (totalPaidAmount / salesOrder.grand_total) * 100 : 0
      
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
        generateOrderNumber().then(setOrderNumber)
        resetForm()
        setOrderDate(new Date().toISOString().split('T')[0])
      } else if (salesOrder) {
        loadSalesOrderData().catch(error => {
          console.error('Error loading sales order data:', error);
        });
        fetchPaymentInfo() // Fetch payment info when viewing/editing sales order
        if (salesOrder.date_created) {
          setOrderDate(salesOrder.date_created.split('T')[0])
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
  }, [isOpen, mode, salesOrder]);

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
    if (isOpen && mode === "view" && salesOrder && salesOrder.id) {
      // Add a small delay to ensure data is fully loaded
      const timer = setTimeout(() => {
        generatePDFForViewing();
      }, 500);
      
      return () => clearTimeout(timer);
    }
    
    // Cleanup PDF URL when component unmounts or modal closes
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    }
  }, [isOpen, mode, salesOrder?.id]);

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

  const createNewItem = (category: "cabinet" | "worktop" | "accessories" | "appliances" | "wardrobes" | "tvunit"): SalesOrderItem => {
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

  const loadSalesOrderData = async () => {
    if (!salesOrder) return
    
    console.log('Loading sales order data:', salesOrder);
    
    // If items are not loaded, try to fetch them
    if (!salesOrder.items || salesOrder.items.length === 0) {
      console.log('Sales order items not loaded, fetching from database...');
      try {
        const { data: salesOrderWithItems, error } = await supabase
          .from('sales_orders')
          .select(`
            *,
            client:registered_entities(id, name, phone, location),
            items:sales_order_items(*)
          `)
          .eq('id', salesOrder.id)
          .single();
          
        if (error) throw error;
        
        if (salesOrderWithItems?.items) {
          salesOrder.items = salesOrderWithItems.items;
          console.log('Successfully loaded items:', salesOrderWithItems.items);
        }
      } catch (error) {
        console.error('Error fetching sales order items:', error);
        toast.error('Failed to load sales order items');
      }
    }
    
    setOrderNumber(salesOrder.order_number || "")
    setSelectedClient(salesOrder.client || null)
    setClientSearchTerm(salesOrder.client?.name || "")
    setLabourPercentage(salesOrder.labour_percentage || 30)
    setIncludeWorktop(salesOrder.include_worktop || false)
    setIncludeAccessories(salesOrder.include_accessories || false)
    setIncludeAppliances(salesOrder.include_appliances || false)
    setIncludeWardrobes(salesOrder.include_wardrobes || false)
    setIncludeTvUnit(salesOrder.include_tvunit || false)
    setNotes(salesOrder.notes || "")
    setTermsConditions(salesOrder.terms_conditions || "")
    
    // Load custom section names if available
    if (salesOrder.section_names) {
      setSectionNames(prev => ({
        ...prev,
        ...salesOrder.section_names
      }))
    }
    
    // Load items by category
    if (salesOrder.items && salesOrder.items.length > 0) {
      console.log('Processing items by category:', salesOrder.items);
      const cabinet = salesOrder.items.filter((item: any) => item.category === "cabinet" && !item.description.includes("Labour Charge"));
      const worktop = salesOrder.items.filter((item: any) => item.category === "worktop");
      const accessories = salesOrder.items.filter((item: any) => item.category === "accessories");
      const appliances = salesOrder.items.filter((item: any) => item.category === "appliances");
      const wardrobes = salesOrder.items.filter((item: any) => item.category === "wardrobes");
      const tvunit = salesOrder.items.filter((item: any) => item.category === "tvunit");
      
      console.log('Cabinet items:', cabinet);
      console.log('Worktop items:', worktop);
      console.log('Accessories items:', accessories);
      
      setCabinetItems(cabinet.length > 0 ? cabinet : [createNewItem("cabinet")]);
      setWorktopItems(worktop);
      setAccessoriesItems(accessories);
      setAppliancesItems(appliances);
      setWardrobesItems(wardrobes);
      setTvUnitItems(tvunit);
    } else {
      console.log('No items found, setting default cabinet item');
      setCabinetItems([createNewItem("cabinet")]);
      setWorktopItems([]);
      setAccessoriesItems([]);
      setAppliancesItems([]);
      setWardrobesItems([]);
      setTvUnitItems([]);
    }

    setCabinetLabourPercentage(salesOrder.cabinet_labour_percentage ?? 30)
    setAccessoriesLabourPercentage(salesOrder.accessories_labour_percentage ?? 30)
    setAppliancesLabourPercentage(salesOrder.appliances_labour_percentage ?? 30)
    setWardrobesLabourPercentage(salesOrder.wardrobes_labour_percentage ?? 30)
    setTvUnitLabourPercentage(salesOrder.tvunit_labour_percentage ?? 30)
    setWorktopLaborQty(salesOrder.worktop_labor_qty ?? 1)
    setWorktopLaborUnitPrice(salesOrder.worktop_labor_unit_price ?? 3000)
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

  const updateItem = (category: "cabinet" | "worktop" | "accessories" | "appliances" | "wardrobes" | "tvunit", index: number, field: keyof SalesOrderItem, value: any) => {
    const updateItems = (items: SalesOrderItem[]) => {
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
    }
  }

  const getFilteredItems = (itemId: string) => {
    return filteredStockItems[itemId] || stockItems
  }

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

  const generatePDF = async () => {
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
      
      // Prepare items data in CORRECT FORMAT for QuotationData (like quotation modal)
      const items: any[] = [];
      
      // Add cabinet section header and items - CORRECT FORMAT
      if (cabinetItems.length > 0) {
        // Section header
        items.push({
          isSection: true,
          itemNumber: "",
          quantity: "",
          unit: "",
          description: sectionNames.cabinet,
          unitPrice: "",
          total: ""
        });
        
        // Items
        cabinetItems.forEach((item, index) => {
          items.push({
            itemNumber: (index + 1).toString(),
            quantity: item.quantity.toString(),
            unit: item.unit,
            description: item.description,
            unitPrice: item.unit_price.toFixed(2),
            total: item.total_price.toFixed(2)
          });
        });
        
        // Add cabinet section summary
        if (totals.cabinetTotal > 0) {
          items.push({
            isSectionSummary: true,
            itemNumber: "",
            quantity: "",
            unit: "",
            description: `${sectionNames.cabinet} Total`,
            unitPrice: "",
            total: (totals.cabinetTotal + cabinetLabour).toFixed(2)
          });
        }
      }
      
      // Add worktop section header and items - CORRECT FORMAT
      if (worktopItems.length > 0 && includeWorktop) {
        // Section header
        items.push({
          isSection: true,
          itemNumber: "",
          quantity: "",
          unit: "",
          description: sectionNames.worktop,
          unitPrice: "",
          total: ""
        });
        
        // Items
        worktopItems.forEach((item, index) => {
          items.push({
            itemNumber: (index + 1).toString(),
            quantity: item.quantity.toString(),
            unit: item.unit,
            description: item.description,
            unitPrice: item.unit_price.toFixed(2),
            total: item.total_price.toFixed(2)
          });
        });
        
        // Add worktop installation labor if exists
        if (worktopLaborQty > 0 && worktopLaborUnitPrice > 0) {
          items.push({
            itemNumber: (worktopItems.length + 1).toString(),
            quantity: worktopLaborQty.toString(),
            unit: "slab",
            description: "Worktop Installation Labor",
            unitPrice: worktopLaborUnitPrice.toFixed(2),
            total: (worktopLaborQty * worktopLaborUnitPrice).toFixed(2)
          });
        }
        
        // Add worktop section summary
        if (totals.worktopTotal > 0) {
          items.push({
            isSectionSummary: true,
            itemNumber: "",
            quantity: "",
            unit: "",
            description: `${sectionNames.worktop} Total`,
            unitPrice: "",
            total: totals.worktopTotal.toFixed(2)
          });
        }
      }
      
      // Add accessories section header and items - CORRECT FORMAT
      if (accessoriesItems.length > 0 && includeAccessories) {
        // Section header
        items.push({
          isSection: true,
          itemNumber: "",
          quantity: "",
          unit: "",
          description: sectionNames.accessories,
          unitPrice: "",
          total: ""
        });
        
        // Items
        accessoriesItems.forEach((item, index) => {
          items.push({
            itemNumber: (index + 1).toString(),
            quantity: item.quantity.toString(),
            unit: item.unit,
            description: item.description,
            unitPrice: item.unit_price.toFixed(2),
            total: item.total_price.toFixed(2)
          });
        });
        
        // Add accessories section summary
        if (totals.accessoriesTotal > 0) {
          items.push({
            isSectionSummary: true,
            itemNumber: "",
            quantity: "",
            unit: "",
            description: `${sectionNames.accessories} Total`,
            unitPrice: "",
            total: (totals.accessoriesTotal + accessoriesLabour).toFixed(2)
          });
        }
      }
      
      // Add appliances section header and items - CORRECT FORMAT
      if (appliancesItems.length > 0 && includeAppliances) {
        // Section header
        items.push({
          isSection: true,
          itemNumber: "",
          quantity: "",
          unit: "",
          description: sectionNames.appliances,
          unitPrice: "",
          total: ""
        });
        
        // Items
        appliancesItems.forEach((item, index) => {
          items.push({
            itemNumber: (index + 1).toString(),
            quantity: item.quantity.toString(),
            unit: item.unit,
            description: item.description,
            unitPrice: item.unit_price.toFixed(2),
            total: item.total_price.toFixed(2)
          });
        });
        
        // Add appliances section summary
        if (totals.appliancesTotal > 0) {
          items.push({
            isSectionSummary: true,
            itemNumber: "",
            quantity: "",
            unit: "",
            description: `${sectionNames.appliances} Total`,
            unitPrice: "",
            total: (totals.appliancesTotal + appliancesLabour).toFixed(2)
          });
        }
      }
      
      // Add wardrobes section header and items - CORRECT FORMAT
      if (wardrobesItems.length > 0 && includeWardrobes) {
        // Section header
        items.push({
          isSection: true,
          itemNumber: "",
          quantity: "",
          unit: "",
          description: sectionNames.wardrobes,
          unitPrice: "",
          total: ""
        });
        
        // Items
        wardrobesItems.forEach((item, index) => {
          items.push({
            itemNumber: (index + 1).toString(),
            quantity: item.quantity.toString(),
            unit: item.unit,
            description: item.description,
            unitPrice: item.unit_price.toFixed(2),
            total: item.total_price.toFixed(2)
          });
        });
        
        // Add wardrobes section summary
        if (totals.wardrobesTotal > 0) {
          items.push({
            isSectionSummary: true,
            itemNumber: "",
            quantity: "",
            unit: "",
            description: `${sectionNames.wardrobes} Total`,
            unitPrice: "",
            total: (totals.wardrobesTotal + wardrobesLabour).toFixed(2)
          });
        }
      }
      
      // Add TV Unit section header and items - CORRECT FORMAT
      if (tvUnitItems.length > 0 && includeTvUnit) {
        // Section header
        items.push({
          isSection: true,
          itemNumber: "",
          quantity: "",
          unit: "",
          description: sectionNames.tvunit,
          unitPrice: "",
          total: ""
        });
        
        // Items
        tvUnitItems.forEach((item, index) => {
          items.push({
            itemNumber: (index + 1).toString(),
            quantity: item.quantity.toString(),
            unit: item.unit,
            description: item.description,
            unitPrice: item.unit_price.toFixed(2),
            total: item.total_price.toFixed(2)
          });
        });
        
        // Add TV Unit section summary
        if (totals.tvUnitTotal > 0) {
          items.push({
            isSectionSummary: true,
            itemNumber: "",
            quantity: "",
            unit: "",
            description: `${sectionNames.tvunit} Total`,
            unitPrice: "",
            total: (totals.tvUnitTotal + tvUnitLabour).toFixed(2)
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

      // Prepare sales order data (same structure as quotation but adapted for sales order)
      const salesOrderData = {
        companyName: "CABINET MASTER STYLES & FINISHES",
        companyLocation: "Location: Ruiru Eastern By-Pass",
        companyPhone: "Tel: +254729554475",
        companyEmail: "Email: cabinetmasterstyles@gmail.com",
        clientNames: selectedClient?.name || "",
        siteLocation: selectedClient?.location || "",
        mobileNo: selectedClient?.phone || "",
        date: orderDate || new Date().toLocaleDateString(),
        deliveryNoteNo: "Delivery Note No.",
        quotationNumber: orderNumber, // Use order number as main number
        originalQuotationNumber: salesOrder?.original_quotation_number || "", // Add original quotation number
        documentTitle: "SALES ORDER", // Add document title to override QUOTATION
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

      // Generate PDF using PDF.me template (adapted for sales order)
      const { template, inputs } = await generateQuotationPDF(salesOrderData);
      const pdf = await generate({ template, inputs, plugins: { text, rectangle, line, image } });
      
      // Download the PDF
      const blob = new Blob([new Uint8Array(pdf.buffer)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-order-${orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("PDF generated successfully!");
      
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  }

  const generatePDFForViewing = async () => {
    // Enhanced validation
    if (!salesOrder || !salesOrder.id) {
      console.error('Invalid sales order data:', salesOrder);
      toast.error('Sales order data is not loaded properly. Please try refreshing the page.');
      return;
    }
    
    try {
      setPdfLoading(true)
      
      const { generate } = await import('@pdfme/generator');
      const { text, rectangle, line, image } = await import('@pdfme/schemas');
      const { generateQuotationPDF, imageToBase64 } = await import('@/lib/pdf-template');

      // Convert logo to base64
      const logoBase64 = await imageToBase64('/logo.png');
      // Convert watermark logo to base64
      const watermarkBase64 = await imageToBase64('/logowatermark.png');

      // DEBUG: Log the salesOrder items to understand the structure
      console.log('Sales Order items:', salesOrder.items);
      console.log('Sales Order full data:', salesOrder);

      // If items are not loaded, try to fetch them directly
      let itemsToProcess = salesOrder.items;
      if (!itemsToProcess || itemsToProcess.length === 0) {
        console.log('Items not found in salesOrder, fetching from database...');
        try {
          const { data: fetchedItems, error } = await supabase
            .from('sales_order_items')
            .select('*')
            .eq('sales_order_id', salesOrder.id);
            
          if (error) throw error;
          
          if (fetchedItems && fetchedItems.length > 0) {
            itemsToProcess = fetchedItems;
            console.log('Successfully fetched items from database:', fetchedItems);
          } else {
            console.error('No items found for sales order ID:', salesOrder.id);
            toast.error('No items found in sales order. This sales order appears to be empty.');
            return;
          }
        } catch (fetchError) {
          console.error('Error fetching sales order items:', fetchError);
          toast.error('Failed to load sales order items from database.');
          return;
        }
      }

      // Prepare items data with section headings and improved formatting (same as quotation modal format)
      const items: any[] = [];

      const grouped = itemsToProcess?.reduce((acc, item) => {
        (acc[item.category] = acc[item.category] || []).push(item);
        return acc;
      }, {} as Record<string, typeof itemsToProcess>) || {};

      console.log('Grouped items:', grouped);

      Object.entries(grouped).forEach(([category, itemsInCategory]) => {
        // Section mapping
        const sectionLabels: { [key: string]: string } = {
          cabinet: salesOrder.section_names?.cabinet || "General",
          worktop: salesOrder.section_names?.worktop || "Worktop", 
          accessories: salesOrder.section_names?.accessories || "Accessories",
          appliances: salesOrder.section_names?.appliances || "Appliances",
          wardrobes: salesOrder.section_names?.wardrobes || "Wardrobes",
          tvunit: salesOrder.section_names?.tvunit || "TV Unit"
        };

        const sectionLabel = sectionLabels[category] || category;

        // Insert section header - CORRECT FORMAT
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

        // Insert items for this section - CORRECT FORMAT
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

        // Insert section summary row after all items in this section - CORRECT FORMAT
        let sectionTotal = itemsInCategory.reduce((sum, item) => sum + (item.total_price || 0), 0);
        
        // Add worktop labor to section total if it exists
        if (category === 'worktop' && salesOrder.worktop_labor_qty && salesOrder.worktop_labor_unit_price) {
          sectionTotal += salesOrder.worktop_labor_qty * salesOrder.worktop_labor_unit_price;
        }
        
        const summaryRow = {
          isSectionSummary: true,
          itemNumber: "",
          quantity: "",
          unit: "",
          description: `${sectionLabel} Total`,
          unitPrice: "",
          total: sectionTotal !== 0 ? sectionTotal.toFixed(2) : ""
        };
        
        items.push(summaryRow);
      });

      console.log('Final items array for PDF:', items);

      // Parse terms and conditions from database
      const parseTermsAndConditions = (termsText: string) => {
        return (termsText || "").split('\n').filter(line => line.trim());
      };

      // Prepare sales order data (same as working quotation modal but adapted for sales order)
      const { template, inputs } = await generateQuotationPDF({
        companyName: "CABINET MASTER STYLES & FINISHES",
        companyLocation: "Location: Ruiru Eastern By-Pass",
        companyPhone: "Tel: +254729554475",
        companyEmail: "Email: cabinetmasterstyles@gmail.com",
        clientNames: salesOrder.client?.name || "",
        siteLocation: salesOrder.client?.location || "",
        mobileNo: salesOrder.client?.phone || "",
        date: new Date(salesOrder.date_created).toLocaleDateString(),
        deliveryNoteNo: "Delivery Note No.",
        quotationNumber: salesOrder.order_number, // Use order number as main number
        originalQuotationNumber: salesOrder.original_quotation_number || "", // Add original quotation number
        documentTitle: "SALES ORDER", // Add document title to override QUOTATION
        items,
        subtotal: salesOrder.total_amount || 0,
        vat: salesOrder.vat_amount || 0,
        vatPercentage: salesOrder.vat_percentage || 16,
        total: salesOrder.grand_total || 0,
        notes: salesOrder.notes || "",
        terms: parseTermsAndConditions(salesOrder.terms_conditions || ""),
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

      const salesOrderData = {
        order_number: orderNumber,
        client_id: selectedClient.id,
        quotation_id: salesOrder?.quotation_id || null,
        original_quotation_number: salesOrder?.original_quotation_number || null,
        date_created: orderDate ? new Date(orderDate).toISOString() : new Date().toISOString(),
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

      await onSave(salesOrderData)
      onClose()
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save sales order")
    } finally {
      setLoading(false)
    }
  }

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
                <Package size={24} color="white" />
              </div>
              <div>
                <h5 className="modal-title mb-1 fw-bold" style={{ color: "#ffffff" }}>
                  {mode === "create" ? "New Sales Order" : mode === "edit" ? "Edit Sales Order" : "View Sales Order"}
                </h5>
                {mode !== "view" && (
                  <p className="mb-0 text-white small">Create a detailed sales order for your client</p>
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
          {mode === "view" && !salesOrder?.id ? (
            <div className="modal-body" style={{ 
              padding: "0 32px 24px", 
              maxHeight: "70vh", 
              overflowY: "auto",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "300px"
            }}>
              <div style={{ 
                display: "flex", 
                flexDirection: "column",
                alignItems: "center",
                color: "#ffffff"
              }}>
                <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading sales order data...</p>
              </div>
            </div>
          ) : mode === "view" && pdfUrl ? (
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
                  title="Sales Order PDF"
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
              {/* Client and Sales Order Number Section */}
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
                          Sales Order Number
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={orderNumber}
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
                            value={orderDate}
                            onChange={e => setOrderDate(e.target.value)}
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
                      {isReadOnly && includeWorktop && (
                        <h6 className="card-title mb-0 fw-bold" style={{ color: "#ffffff" }}>
                          <Calculator size={18} className="me-2" />
                          {sectionNames.worktop}
                        </h6>
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

                        {/* Worktop Installation Labor footer row */}
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
                                value={rawWorktopLaborUnitPrice !== undefined ? rawWorktopLaborUnitPrice : (worktopLaborUnitPrice === 3000 ? "" : worktopLaborUnitPrice)}
                                onFocus={e => setRawWorktopLaborUnitPrice(worktopLaborUnitPrice === 3000 ? "" : String(worktopLaborUnitPrice))}
                                onChange={e => setRawWorktopLaborUnitPrice(e.target.value)}
                                onBlur={e => {
                                  const val = rawWorktopLaborUnitPrice ?? "";
                                  const num = val === '' ? 3000 : Number(val);
                                  setWorktopLaborUnitPrice(isNaN(num) ? 3000 : num);
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

                        {/* Add Item Button */}
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
                          
                          <div 
                            className="d-flex align-items-center"
                            style={{
                              marginLeft: includeAccessories ? "auto" : "0",
                              transition: "all 0.3s ease"
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
                      {isReadOnly && includeAccessories && (
                        <h6 className="card-title mb-0 fw-bold" style={{ color: "#ffffff" }}>
                          <Calculator size={18} className="me-2" />
                          {sectionNames.accessories}
                        </h6>
                      )}
                    </div>
                    
                    {includeAccessories && (
                      <div className="mb-3">
                        {/* Similar structure as worktop section but for accessories items */}
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

                        {/* Labour Footer for Accessories Section */}
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
                          
                          <div 
                            className="d-flex align-items-center"
                            style={{
                              marginLeft: includeAppliances ? "auto" : "0",
                              transition: "all 0.3s ease"
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
                      {isReadOnly && includeAppliances && (
                        <h6 className="card-title mb-0 fw-bold" style={{ color: "#ffffff" }}>
                          <Calculator size={18} className="me-2" />
                          {sectionNames.appliances}
                        </h6>
                      )}
                    </div>
                    
                    {includeAppliances && (
                      <div className="mb-3">
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
                          
                          <div 
                            className="d-flex align-items-center"
                            style={{
                              marginLeft: includeWardrobes ? "auto" : "0",
                              transition: "all 0.3s ease"
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
                      {isReadOnly && includeWardrobes && (
                        <h6 className="card-title mb-0 fw-bold" style={{ color: "#ffffff" }}>
                          <Calculator size={18} className="me-2" />
                          {sectionNames.wardrobes}
                        </h6>
                      )}
                    </div>
                    
                    {includeWardrobes && (
                      <div className="mb-3">
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
                        ))}

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
                          
                          <div 
                            className="d-flex align-items-center"
                            style={{
                              marginLeft: includeTvUnit ? "auto" : "0",
                              transition: "all 0.3s ease"
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
                      {isReadOnly && includeTvUnit && (
                        <h6 className="card-title mb-0 fw-bold" style={{ color: "#ffffff" }}>
                          <Calculator size={18} className="me-2" />
                          {sectionNames.tvunit}
                        </h6>
                      )}
                    </div>
                    
                    {includeTvUnit && (
                      <div className="mb-3">
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
                        ))}

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

              {/* Summary and Totals Section */}
              <div className="mb-4">
                <div className="card" style={{ borderRadius: "16px", border: "1px solid #e9ecef", boxShadow: "none" }}>
                  <div className="card-body p-4">
                    <h6 className="card-title mb-3 fw-bold" style={{ color: "#ffffff" }}>
                      <Calculator size={18} className="me-2" />
                      Summary
                    </h6>
                    
                    <div className="row">
                      <div className="col-md-6">
                      </div>
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

                    {!isReadOnly && (
                      <div className="mt-4">
                        <div className="row">
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold mb-2" style={{ color: "#ffffff" }}>
                              Notes
                            </label>
                            <textarea
                              className="form-control"
                              rows={3}
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Additional notes..."
                              style={{ borderRadius: "12px", fontSize: "13px" }}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold mb-2" style={{ color: "#ffffff" }}>
                              Terms & Conditions
                            </label>
                            <textarea
                              className="form-control"
                              rows={3}
                              value={termsConditions}
                              onChange={(e) => setTermsConditions(e.target.value)}
                              placeholder="Terms and conditions..."
                              style={{ borderRadius: "12px", fontSize: "13px" }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
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
                {salesOrder?.id && (
                  <>
                {paymentPercentage >= 80 && salesOrder?.status !== "converted_to_invoice" && onProceedToInvoice && (
                  <button
                    type="button"
                    className="btn btn-success me-2"
                    onClick={() => onProceedToInvoice(salesOrder)}
                    style={{ 
                      borderRadius: "12px", 
                      padding: "10px 24px",
                      background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
                      border: "none"
                    }}
                  >
                    <Receipt className="me-2" size={16} />
                    Proceed to Invoice
                  </button>
                )}
                {paymentPercentage >= 100 && salesOrder?.status !== "converted_to_cash_sale" && onProceedToCashSale && (
                  <button
                    type="button"
                    className="btn btn-warning me-2"
                    onClick={() => onProceedToCashSale(salesOrder)}
                    style={{ 
                      borderRadius: "12px", 
                      padding: "10px 24px",
                      background: "linear-gradient(135deg, #ffc107 0%, #e0a800 100%)",
                      border: "none"
                    }}
                  >
                    <CreditCard className="me-2" size={16} />
                    Proceed to Cash Sale
                  </button>
                )}
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
                )}
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
                {paymentPercentage >= 80 && salesOrder?.status !== "converted_to_invoice" && onProceedToInvoice && (
                  <button
                    type="button"
                    className="btn btn-success me-2"
                    onClick={() => onProceedToInvoice(salesOrder)}
                    style={{ 
                      borderRadius: "12px", 
                      padding: "10px 24px",
                      background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
                      border: "none"
                    }}
                    disabled={loading}
                  >
                    <Receipt className="me-2" size={16} />
                    Proceed to Invoice
                  </button>
                )}
                {paymentPercentage >= 100 && salesOrder?.status !== "converted_to_cash_sale" && onProceedToCashSale && (
                  <button
                    type="button"
                    className="btn btn-warning me-2"
                    onClick={() => onProceedToCashSale(salesOrder)}
                    style={{ 
                      borderRadius: "12px", 
                      padding: "10px 24px",
                      background: "linear-gradient(135deg, #ffc107 0%, #e0a800 100%)",
                      border: "none"
                    }}
                    disabled={loading}
                  >
                    <CreditCard className="me-2" size={16} />
                    Proceed to Cash Sale
                  </button>
                )}
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
                    "Save Sales Order"
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

export default SalesOrderModal 