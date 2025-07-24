"use client"

import React, { useState, useEffect, useRef } from "react"
import { X, Plus, Trash2, Search, User, Calculator, FileText, ChevronDown, ChevronRight, Package, Calendar, Download } from "lucide-react"
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
    console.error('Error generating quotation number:', error)
    const timestamp = Date.now().toString().slice(-3)
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    return `QT${year}${month}${timestamp}`
  }
}

const QuotationModal = ({
  isOpen,
  onClose,
  onSave,
  quotation,
  mode = "create"
}: QuotationModalProps) => {
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

  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);

  // Add state at the top of QuotationModal:
  const [worktopLaborQty, setWorktopLaborQty] = useState(1);
  const [worktopLaborUnitPrice, setWorktopLaborUnitPrice] = useState(3000);

  // Add state for raw editing values for Worktop Installation Labor
  const [rawWorktopLaborQty, setRawWorktopLaborQty] = useState<string | undefined>(undefined);
  const [rawWorktopLaborUnitPrice, setRawWorktopLaborUnitPrice] = useState<string | undefined>(undefined);

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
        if (quotation.date_created) {
          setQuotationDate(quotation.date_created.split('T')[0])
        }
      }
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
  }, [isOpen, mode, quotation]);

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
      console.error("Error fetching clients:", error)
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
      
      console.log("Fetched stock items:", processedData)
      setStockItems(processedData)
    } catch (error) {
      console.error("Error fetching stock items:", error)
      toast.error("Failed to fetch stock items")
    }
  }

  const loadQuotationData = () => {
    if (!quotation) return
    
    setQuotationNumber(quotation.quotation_number || "")
    setSelectedClient(quotation.client || null)
      setClientSearchTerm(quotation.client?.name || "")
    setLabourPercentage(quotation.labour_percentage || 30)
    setIncludeWorktop(quotation.include_worktop || false)
      setIncludeAccessories(quotation.include_accessories || false)
    setIncludeAppliances(quotation.include_appliances || false)
    setIncludeWardrobes(quotation.include_wardrobes || false)
    setIncludeTvUnit(quotation.include_tvunit || false)
      setNotes(quotation.notes || "")
      setTermsConditions(quotation.terms_conditions || "")
    
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

    setCabinetLabourPercentage(quotation.cabinet_labour_percentage ?? 30)
    setAccessoriesLabourPercentage(quotation.accessories_labour_percentage ?? 30)
          setAppliancesLabourPercentage(quotation.appliances_labour_percentage ?? 30)
      setWardrobesLabourPercentage(quotation.wardrobes_labour_percentage ?? 30)
      setTvUnitLabourPercentage(quotation.tvunit_labour_percentage ?? 30)
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
      case "wardrobes":
        setWardrobesItems([...wardrobesItems, newItem])
        break
      case "tvunit":
        setTvUnitItems([...tvUnitItems, newItem])
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
            console.log("Found stock item for ID", value, ":", stockItem)
            console.log("Stock item unit_price:", stockItem?.unit_price, typeof stockItem?.unit_price)
            
            updatedItem.stock_item = stockItem || undefined
            updatedItem.description = stockItem?.name || ""
            updatedItem.unit = stockItem?.unit || "pieces"
            updatedItem.unit_price = Number(stockItem?.unit_price) || 0
            updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price
            
            console.log("Updated item unit_price:", updatedItem.unit_price)
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
    console.log("Selecting stock item:", stockItem)
    console.log("Stock item unit_price:", stockItem.unit_price, typeof stockItem.unit_price)
    
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
      console.log(`Updating ${category} item at index ${index}`)
      
      // Single call to updateItem with stock_item_id will automatically populate all fields
      updateItem(category, index, "stock_item_id", stockItem.id)
      
      setItemDropdownVisible(prev => ({ ...prev, [itemId]: false }))
      setItemSearches(prev => ({ ...prev, [itemId]: "" }))
    } else {
      console.error("Could not find item with ID:", itemId)
    }
  }

  const calculateTotals = () => {
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
      grandTotal
    }
  }

  const getFilteredItems = (itemId: string) => {
    return filteredStockItems[itemId] || stockItems
  }

  const generatePDF = async () => {
    alert('generatePDF function called');
    console.log('generatePDF function called');
    try {
      console.log('Starting PDF generation...');
      const { generate } = await import('@pdfme/generator');
      const { text, rectangle, line, image } = await import('@pdfme/schemas');
      const { generateQuotationPDF } = await import('@/lib/pdf-template');
      
      // Use the same calculation as the UI display for consistency
      const totals = calculateTotals();
      const cabinetLabour = (totals.cabinetTotal * cabinetLabourPercentage) / 100;
      const accessoriesLabour = (totals.accessoriesTotal * accessoriesLabourPercentage) / 100;
      const appliancesLabour = (totals.appliancesTotal * appliancesLabourPercentage) / 100;
      const wardrobesLabour = (totals.wardrobesTotal * wardrobesLabourPercentage) / 100;
      const tvUnitLabour = (totals.tvUnitTotal * tvUnitLabourPercentage) / 100;
      
      // Calculate subtotal with all labour included (consistent with UI display)
      const subtotalWithLabour = totals.subtotal + cabinetLabour + accessoriesLabour + appliancesLabour + wardrobesLabour + tvUnitLabour;
      
      // Calculate VAT using forward calculation (add VAT to subtotal)
      const vatPercentageNum = Number(vatPercentage);
      console.log('VAT Calculation Test:', {
        subtotalWithLabour,
        vatPercentage,
        vatPercentageNum,
        vatPercentageType: typeof vatPercentage,
        calculation: `${subtotalWithLabour} * (${vatPercentageNum} / 100)`,
        result: subtotalWithLabour * (vatPercentageNum / 100)
      });
      
      const vat = subtotalWithLabour * (vatPercentageNum / 100);
      const grandTotal = subtotalWithLabour + vat;
      
      console.log('PDF Generation Debug - Detailed:', {
        totals_subtotal: totals.subtotal,
        cabinetLabour,
        accessoriesLabour,
        appliancesLabour,
        wardrobesLabour,
        tvUnitLabour,
        subtotalWithLabour,
        vatPercentage,
        vat,
        grandTotal,
        calculation: `${subtotalWithLabour} * (${vatPercentage} / 100) = ${vat}`
      });
      

      
      // Prepare items data as objects for QuotationData
      const items: Array<{quantity: number, unit: string, description: string, unitPrice: number, total: number}> = [];
      [...cabinetItems, ...worktopItems, ...accessoriesItems, ...appliancesItems, ...wardrobesItems, ...tvUnitItems].forEach(item => {
        items.push({
          quantity: item.quantity,
          unit: item.unit,
          description: item.description,
          unitPrice: item.unit_price,
          total: item.total_price
        });
      });
      
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
      console.log('watermarkLogoBase64:', watermarkLogoBase64?.slice(0, 100));
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
        subtotal: subtotalWithLabour,
        vat: vat,
        vatPercentage: vatPercentageNum,
        total: grandTotal,
        terms: {
          term1: "1. Please NOTE, the above prices are subject to changes incase of VARIATION",
          term2: "   in quantity or specifications and market rates.",
          term3: "2. Material cost is payable either directly to the supplying company or through our Pay Bill No. below",
          term4: "3. DESIGN and LABOUR COST must be paid through our Pay Bill No. below PAYBILL NUMBER: 400200 ACCOUNT NUMBER: 845763"
        },
        preparedBy: "",
        approvedBy: "",
        watermarkLogo: watermarkLogoBase64,
        companyLogo: watermarkLogoBase64,
      };
      console.log('quotationData:', quotationData);
      console.log('Debug totals:', {
        subtotal: subtotalWithLabour,
        vat: vat,
        vatPercentage: vatPercentage,
        total: grandTotal
      });
      
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
      console.error('Error generating PDF:', error);
      toast.error("Failed to generate PDF. Please try again.");
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
    const totals = calculateTotals()
      
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
    const saveVatAmount = saveSubtotalWithLabour * (vatPercentage / 100);
    const saveGrandTotalWithVAT = saveSubtotalWithLabour + saveVatAmount;

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
      total_amount: saveSubtotalWithLabour, // Subtotal with labour included
      grand_total: saveGrandTotalWithVAT, // Grand total with VAT included
      vat_amount: saveVatAmount, // VAT amount
      vat_percentage: vatPercentage, // VAT percentage
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
      worktop_labor_unit_price: worktopLaborUnitPrice
    }

      // Confirm quotation number if it's a new quotation
      // Removed localStorage logic, so this block is effectively removed.
      // The generateQuotationNumber function now handles the number generation.

    await onSave(quotationData)
    onClose()
    } catch (error) {
      console.error("Error saving quotation:", error)
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

  const totals = calculateTotals()
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
  
  // Calculate VAT using forward calculation (add VAT to subtotal)
  const vatAmount = subtotalWithLabour * (vatPercentage / 100);
  const grandTotal = subtotalWithLabour + vatAmount;

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
                <h5 className="modal-title mb-1 fw-bold" style={{ color: "#ffffff" }}>
                  {mode === "create" ? "New Quotation" : mode === "edit" ? "Edit Quotation" : "View Quotation"}
            </h5>
                <p className="mb-0 text-white small">Create a detailed quotation for your client</p>
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
                    General
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
                        <div style={{ flex: "1", marginRight: "16px", color: "#fff", fontWeight: 600, paddingLeft: "12px" }}>KES {((calculateTotals().cabinetTotal * (cabinetLabourPercentage || 30)) / 100).toFixed(2)}</div>
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
                          <span className="fw-bold" style={{ color: "#ffffff" }}>Worktop</span>
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
                          <span className="fw-bold" style={{ color: "#ffffff" }}>Accessories</span>
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
                          <div style={{ flex: "1", marginRight: "16px", color: "#fff", fontWeight: 600, paddingLeft: "12px" }}>KES {((calculateTotals().accessoriesTotal * (accessoriesLabourPercentage || 30)) / 100).toFixed(2)}</div>
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
                          <span className="fw-bold" style={{ color: "#ffffff" }}>Appliances</span>
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
                          <div style={{ flex: "1", marginRight: "16px", color: "#fff", fontWeight: 600, paddingLeft: "12px" }}>KES {((calculateTotals().appliancesTotal * (appliancesLabourPercentage || 30)) / 100).toFixed(2)}</div>
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
                          <span className="fw-bold" style={{ color: "#ffffff" }}>Wardrobes</span>
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
                          <div style={{ flex: "1", marginRight: "16px", color: "#fff", fontWeight: 600, paddingLeft: "12px" }}>KES {((calculateTotals().wardrobesTotal * (wardrobesLabourPercentage || 30)) / 100).toFixed(2)}</div>
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
                          <span className="fw-bold" style={{ color: "#ffffff" }}>TV Unit</span>
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
                          <div style={{ flex: "1", marginRight: "16px", color: "#fff", fontWeight: 600, paddingLeft: "12px" }}>KES {((calculateTotals().tvUnitTotal * (tvUnitLabourPercentage || 30)) / 100).toFixed(2)}</div>
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
                        <span style={{ color: "#ffffff" }}>Cabinet Total:</span>
                        <span style={{ fontWeight: "600", color: "#ffffff" }}>KES {(totals.cabinetTotal + cabinetLabour).toFixed(2)}</span>
                      </div>
                      {includeWorktop && (
                        <div className="d-flex justify-content-between mb-2">
                          <span style={{ color: "#ffffff" }}>Worktop Total:</span>
                          <span style={{ fontWeight: "600", color: "#ffffff" }}>KES {totals.worktopTotal.toFixed(2)}</span>
                        </div>
                      )}
                      {includeAccessories && (
                        <div className="d-flex justify-content-between mb-2">
                          <span style={{ color: "#ffffff" }}>Accessories Total:</span>
                          <span style={{ fontWeight: "600", color: "#ffffff" }}>KES {(totals.accessoriesTotal + accessoriesLabour).toFixed(2)}</span>
                        </div>
                      )}
                      {includeAppliances && (
                        <div className="d-flex justify-content-between mb-2">
                          <span style={{ color: "#ffffff" }}>Appliances Total:</span>
                          <span style={{ fontWeight: "600", color: "#ffffff" }}>KES {(totals.appliancesTotal + appliancesLabour).toFixed(2)}</span>
                        </div>
                      )}
                      {includeWardrobes && (
                        <div className="d-flex justify-content-between mb-2">
                          <span style={{ color: "#ffffff" }}>Wardrobes Total:</span>
                          <span style={{ fontWeight: "600", color: "#ffffff" }}>KES {(totals.wardrobesTotal + (totals.wardrobesTotal * (wardrobesLabourPercentage || 30)) / 100).toFixed(2)}</span>
                        </div>
                      )}
                      {includeTvUnit && (
                        <div className="d-flex justify-content-between mb-2">
                          <span style={{ color: "#ffffff" }}>TV Unit Total:</span>
                          <span style={{ fontWeight: "600", color: "#ffffff" }}>KES {(totals.tvUnitTotal + (totals.tvUnitTotal * (tvUnitLabourPercentage || 30)) / 100).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex justify-content-between mb-2">
                        <span style={{ color: "#ffffff" }}>Subtotal:</span>
                        <span style={{ fontWeight: "600", color: "#ffffff" }}>KES {subtotalWithLabour.toFixed(2)}</span>
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
                        <span style={{ fontWeight: "700", color: "#ffffff", fontSize: "18px" }}>KES {grandTotal.toFixed(2)}</span>
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

          {/* Footer */}
          <div className="modal-footer border-0" style={{ padding: "16px 32px 24px" }}>
            <button
              type="button"
              className="btn btn-light"
              onClick={onClose}
              style={{ borderRadius: "12px", padding: "10px 24px" }}
              disabled={loading}
            >
              Cancel
            </button>
            {mode === "view" && (
              <button
                type="button"
                className="btn btn-success me-2"
                onClick={generatePDF}
                style={{ 
                  borderRadius: "12px", 
                  padding: "10px 24px",
                  background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
                  border: "none"
                }}
              >
                <Download className="me-2" size={16} />
                Download PDF
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
                "Save Quotation"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuotationModal 