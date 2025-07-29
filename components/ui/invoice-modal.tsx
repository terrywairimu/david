"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { X, Plus, Trash2, Search, User, Calculator, FileText, ChevronDown, ChevronRight, Package, Calendar, Download, CreditCard, Printer } from "lucide-react"
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

interface InvoiceItem {
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

interface InvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (invoiceData: any) => void
  invoice?: any
  mode: "view" | "edit" | "create"
  onProceedToCashSale?: (invoice: any) => Promise<void>
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
        borderRadius: '4px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: 1000,
        listStyle: 'none',
        margin: 0,
        padding: 0
      }}
    >
      {children}
    </ul>,
    document.body
  )
}

const generateInvoiceNumber = async () => {
  try {
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .order('invoice_number', { ascending: false })
      .limit(1)

    let nextNumber = 1
    if (lastInvoice && lastInvoice.length > 0) {
      const lastNumber = parseInt(lastInvoice[0].invoice_number.replace('INV', ''))
      nextNumber = lastNumber + 1
    }

    return `INV${nextNumber.toString().padStart(4, '0')}`
  } catch (error) {
    console.error('Error generating invoice number:', error)
    return `INV${Date.now()}`
  }
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  invoice,
  mode = "create",
  onProceedToCashSale
}) => {
  // State management
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [originalQuotationNumber, setOriginalQuotationNumber] = useState("")
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [termsConditions, setTermsConditions] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState({
    paidAmount: 0,
    balanceAmount: 0,
    paymentPercentage: 0
  })

  // Items state
  const [cabinetItems, setCabinetItems] = useState<InvoiceItem[]>([])
  const [worktopItems, setWorktopItems] = useState<InvoiceItem[]>([])
  const [accessoriesItems, setAccessoriesItems] = useState<InvoiceItem[]>([])
  const [appliancesItems, setAppliancesItems] = useState<InvoiceItem[]>([])
  const [wardrobesItems, setWardrobesItems] = useState<InvoiceItem[]>([])
  const [tvUnitItems, setTvUnitItems] = useState<InvoiceItem[]>([])

  // Section names
  const [sectionNames, setSectionNames] = useState({
    cabinet: "CABINET",
    worktop: "WORKTOP",
    accessories: "ACCESSORIES",
    appliances: "APPLIANCES",
    wardrobes: "WARDROBES",
    tvunit: "TV UNIT"
  })

  // Labour percentages
  const [cabinetLabourPercentage, setCabinetLabourPercentage] = useState(15)
  const [accessoriesLabourPercentage, setAccessoriesLabourPercentage] = useState(15)
  const [appliancesLabourPercentage, setAppliancesLabourPercentage] = useState(15)
  const [wardrobesLabourPercentage, setWardrobesLabourPercentage] = useState(15)
  const [tvUnitLabourPercentage, setTvUnitLabourPercentage] = useState(15)

  // Worktop installation
  const [includeWorktop, setIncludeWorktop] = useState(false)
  const [worktopLaborQty, setWorktopLaborQty] = useState(1)
  const [worktopLaborUnitPrice, setWorktopLaborUnitPrice] = useState(0)

  // Include flags
  const [includeAppliances, setIncludeAppliances] = useState(false)
  const [includeWardrobes, setIncludeWardrobes] = useState(false)
  const [includeTvUnit, setIncludeTvUnit] = useState(false)

  // Section totals
  const [appliancesTotal, setAppliancesTotal] = useState(0)
  const [wardrobesTotal, setWardrobesTotal] = useState(0)
  const [tvUnitTotal, setTvUnitTotal] = useState(0)

  // VAT
  const [vatPercentage, setVatPercentage] = useState("16")
  const [vatAmount, setVatAmount] = useState(0)

  // Section name editing
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  // Client search
  const [clientSearchTerm, setClientSearchTerm] = useState("")
  const [showClientDropdown, setShowClientDropdown] = useState(false)

  // Item search
  const [itemSearchTerms, setItemSearchTerms] = useState<{ [key: string]: string }>({})
  const [itemDropdowns, setItemDropdowns] = useState<{ [key: string]: boolean }>({})

  // Refs
  const clientSearchRef = useRef<HTMLDivElement>(null)
  const itemSearchRefs = useRef<{ [key: string]: React.RefObject<HTMLDivElement> }>({})

  // PDF states
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  // Calculate totals
  const totals = useMemo(() => {
    const calculateSectionTotal = (items: InvoiceItem[]) => {
      return items.reduce((sum, item) => sum + item.total_price, 0)
    }

    const cabinetTotal = calculateSectionTotal(cabinetItems)
    const worktopTotal = calculateSectionTotal(worktopItems)
    const accessoriesTotal = calculateSectionTotal(accessoriesItems)
    const appliancesTotal = calculateSectionTotal(appliancesItems)
    const wardrobesTotal = calculateSectionTotal(wardrobesItems)
    const tvUnitTotal = calculateSectionTotal(tvUnitItems)

    const subtotal = cabinetTotal + worktopTotal + accessoriesTotal + appliancesTotal + wardrobesTotal + tvUnitTotal

    return {
      cabinetTotal,
      worktopTotal,
      accessoriesTotal,
      appliancesTotal,
      wardrobesTotal,
      tvUnitTotal,
      subtotal
    }
  }, [cabinetItems, worktopItems, accessoriesItems, appliancesItems, wardrobesItems, tvUnitItems])

  // Get item input ref
  const getItemInputRef = (itemId: string): React.RefObject<HTMLDivElement | null> => {
    if (!itemSearchRefs.current[itemId]) {
      itemSearchRefs.current[itemId] = { current: null }
    }
    return itemSearchRefs.current[itemId]
  }

  // Generate PDF for viewing when modal opens in view mode
  useEffect(() => {
    if (isOpen && mode === "view" && invoice) {
      generatePDFForViewing();
    }
    
    // Cleanup PDF URL when component unmounts or modal closes
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    }
  }, [isOpen, mode, invoice?.id]);

  // Section name editing handlers
  const handleSectionNameEdit = (sectionKey: string) => {
    setEditingSection(sectionKey)
    setEditingName(sectionNames[sectionKey as keyof typeof sectionNames])
  }

  const handleSectionNameSave = (sectionKey: string) => {
    setSectionNames(prev => ({
      ...prev,
      [sectionKey]: editingName
    }))
    setEditingSection(null)
    setEditingName("")
  }

  const handleSectionNameCancel = () => {
    setEditingSection(null)
    setEditingName("")
  }

  const handleSectionNameKeyPress = (e: React.KeyboardEvent, sectionKey: string) => {
    if (e.key === 'Enter') {
      handleSectionNameSave(sectionKey)
    } else if (e.key === 'Escape') {
      handleSectionNameCancel()
    }
  }

  // Editable section header component
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
    if (isReadOnly) {
      return <h6 className="fw-bold text-primary mb-2">{currentName}</h6>
    }

    if (isEditing) {
      return (
        <div className="d-flex align-items-center gap-2 mb-2">
          <input
            type="text"
            className="form-control form-control-sm"
            value={editingName}
            onChange={(e) => onEditingNameChange(e.target.value)}
            onKeyDown={onKeyPress}
            autoFocus
          />
          <button className="btn btn-sm btn-success" onClick={onSave}>
            <i className="bi bi-check"></i>
          </button>
          <button className="btn btn-sm btn-secondary" onClick={onCancel}>
            <i className="bi bi-x"></i>
          </button>
        </div>
      )
    }

    return (
      <div className="d-flex align-items-center gap-2 mb-2">
        <h6 className="fw-bold text-primary mb-0">{currentName}</h6>
        <button className="btn btn-sm btn-link p-0" onClick={onEdit}>
          <i className="bi bi-pencil"></i>
        </button>
      </div>
    )
  }

  // Fetch payment information
  const fetchPaymentInfo = async () => {
    if (!invoice?.id) return

    try {
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('invoice_id', invoice.id)

      const totalPaid = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
      const balance = invoice.total_amount - totalPaid
      const percentage = invoice.total_amount > 0 ? (totalPaid / invoice.total_amount) * 100 : 0

      setPaymentInfo({
        paidAmount: totalPaid,
        balanceAmount: balance,
        paymentPercentage: percentage
      })
    } catch (error) {
      console.error('Error fetching payment info:', error)
    }
  }

  // Reset form
  const resetForm = () => {
    setInvoiceNumber("")
    setOriginalQuotationNumber("")
    setInvoiceDate(new Date().toISOString().split('T')[0])
    setDueDate("")
    setSelectedClient(null)
    setTermsConditions("")
    setNotes("")
    setCabinetItems([])
    setWorktopItems([])
    setAccessoriesItems([])
    setAppliancesItems([])
    setWardrobesItems([])
    setTvUnitItems([])
    setSectionNames({
      cabinet: "CABINET",
      worktop: "WORKTOP",
      accessories: "ACCESSORIES",
      appliances: "APPLIANCES",
      wardrobes: "WARDROBES",
      tvunit: "TV UNIT"
    })
    setCabinetLabourPercentage(15)
    setAccessoriesLabourPercentage(15)
    setAppliancesLabourPercentage(15)
    setWardrobesLabourPercentage(15)
    setTvUnitLabourPercentage(15)
    setIncludeWorktop(false)
    setWorktopLaborQty(1)
    setWorktopLaborUnitPrice(0)
    setIncludeAppliances(false)
    setIncludeWardrobes(false)
    setIncludeTvUnit(false)
    setAppliancesTotal(0)
    setWardrobesTotal(0)
    setTvUnitTotal(0)
    setVatPercentage("16")
    setVatAmount(0)
  }

  // Create new item
  const createNewItem = (category: "cabinet" | "worktop" | "accessories" | "appliances" | "wardrobes" | "tvunit"): InvoiceItem => {
    return {
      category,
      description: "",
      unit: "",
      quantity: 1,
      unit_price: 0,
      total_price: 0
    }
  }

  // Fetch clients
  const fetchClients = async () => {
    try {
      const { data } = await supabase
        .from('registered_entities')
        .select('*')
        .eq('entity_type', 'client')
        .order('name')

      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  // Fetch stock items
  const fetchStockItems = async () => {
    try {
      const { data } = await supabase
        .from('stock')
        .select('*')
        .order('name')

      setStockItems(data || [])
    } catch (error) {
      console.error('Error fetching stock items:', error)
    }
  }

  // Load invoice data
  const loadInvoiceData = () => {
    if (!invoice) return

    setInvoiceNumber(invoice.invoice_number || "")
    setOriginalQuotationNumber(invoice.original_quotation_number || "")
    setInvoiceDate(invoice.date_created ? new Date(invoice.date_created).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
    setDueDate(invoice.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : "")
    setSelectedClient(invoice.client || null)
    setTermsConditions(invoice.terms_conditions || "")
    setNotes(invoice.notes || "")
    
    // Load custom section names if available
    if (invoice.section_names) {
      setSectionNames(prev => ({
        ...prev,
        ...invoice.section_names
      }))
    }
    
    // Load VAT percentage from database
    if (invoice.vat_percentage) {
      setVatPercentage(invoice.vat_percentage.toString())
    }
    
    // Load items by category (same as sales order modal)
    if (invoice.items) {
      const cabinet = invoice.items.filter((item: any) => item.category === "cabinet" && !item.description.includes("Labour Charge"));
      const worktop = invoice.items.filter((item: any) => item.category === "worktop");
      const accessories = invoice.items.filter((item: any) => item.category === "accessories");
      const appliances = invoice.items.filter((item: any) => item.category === "appliances");
      const wardrobes = invoice.items.filter((item: any) => item.category === "wardrobes");
      const tvunit = invoice.items.filter((item: any) => item.category === "tvunit");
      setCabinetItems(cabinet.length > 0 ? cabinet : [createNewItem("cabinet")]);
      setWorktopItems(worktop);
      setAccessoriesItems(accessories);
      setAppliancesItems(appliances);
      setWardrobesItems(wardrobes);
      setTvUnitItems(tvunit);
    }
    
    setCabinetLabourPercentage(invoice.cabinet_labour_percentage || 15)
    setAccessoriesLabourPercentage(invoice.accessories_labour_percentage || 15)
    setAppliancesLabourPercentage(invoice.appliances_labour_percentage || 15)
    setWardrobesLabourPercentage(invoice.wardrobes_labour_percentage || 15)
    setTvUnitLabourPercentage(invoice.tvunit_labour_percentage || 15)
    setIncludeWorktop(invoice.include_worktop || false)
    setWorktopLaborQty(invoice.worktop_labor_qty || 1)
    setWorktopLaborUnitPrice(invoice.worktop_labor_unit_price || 0)
    setIncludeAppliances(invoice.include_appliances || false)
    setIncludeWardrobes(invoice.include_wardrobes || false)
    setIncludeTvUnit(invoice.include_tvunit || false)
    setAppliancesTotal(invoice.appliances_total || 0)
    setWardrobesTotal(invoice.wardrobes_total || 0)
    setTvUnitTotal(invoice.tvunit_total || 0)
    setVatAmount(invoice.vat_amount || 0)
  }

  // Client handlers
  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    setShowClientDropdown(false)
    setClientSearchTerm("")
  }

  const handleClientSearch = (searchTerm: string) => {
    setClientSearchTerm(searchTerm)
    setShowClientDropdown(true)
  }

  // Item handlers
  const addItem = (category: "cabinet" | "worktop" | "accessories" | "appliances" | "wardrobes" | "tvunit") => {
    const newItem = createNewItem(category)
    const itemId = `${category}-${Date.now()}-${Math.random()}`
    
    switch (category) {
      case "cabinet":
        setCabinetItems(prev => [...prev, { ...newItem, id: undefined }])
        break
      case "worktop":
        setWorktopItems(prev => [...prev, { ...newItem, id: undefined }])
        break
      case "accessories":
        setAccessoriesItems(prev => [...prev, { ...newItem, id: undefined }])
        break
      case "appliances":
        setAppliancesItems(prev => [...prev, { ...newItem, id: undefined }])
        break
      case "wardrobes":
        setWardrobesItems(prev => [...prev, { ...newItem, id: undefined }])
        break
      case "tvunit":
        setTvUnitItems(prev => [...prev, { ...newItem, id: undefined }])
        break
    }
  }

  const removeItem = (category: "cabinet" | "worktop" | "accessories" | "appliances" | "wardrobes" | "tvunit", index: number) => {
    switch (category) {
      case "cabinet":
        setCabinetItems(prev => prev.filter((_, i) => i !== index))
        break
      case "worktop":
        setWorktopItems(prev => prev.filter((_, i) => i !== index))
        break
      case "accessories":
        setAccessoriesItems(prev => prev.filter((_, i) => i !== index))
        break
      case "appliances":
        setAppliancesItems(prev => prev.filter((_, i) => i !== index))
        break
      case "wardrobes":
        setWardrobesItems(prev => prev.filter((_, i) => i !== index))
        break
      case "tvunit":
        setTvUnitItems(prev => prev.filter((_, i) => i !== index))
        break
    }
  }

  const updateItem = (category: "cabinet" | "worktop" | "accessories" | "appliances" | "wardrobes" | "tvunit", index: number, field: keyof InvoiceItem, value: any) => {
    const updateItems = (items: InvoiceItem[]) => {
      const updatedItems = [...items]
      updatedItems[index] = { ...updatedItems[index], [field]: value }
      
      // Recalculate total_price if quantity or unit_price changed
      if (field === 'quantity' || field === 'unit_price') {
        const item = updatedItems[index]
        updatedItems[index] = {
          ...item,
          total_price: item.quantity * item.unit_price
        }
      }
      
      return updatedItems
    }

    switch (category) {
      case "cabinet":
        setCabinetItems(updateItems)
        break
      case "worktop":
        setWorktopItems(updateItems)
        break
      case "accessories":
        setAccessoriesItems(updateItems)
        break
      case "appliances":
        setAppliancesItems(updateItems)
        break
      case "wardrobes":
        setWardrobesItems(updateItems)
        break
      case "tvunit":
        setTvUnitItems(updateItems)
        break
    }
  }

  // Item search handlers
  const handleItemSearch = (itemId: string, searchTerm: string) => {
    setItemSearchTerms(prev => ({ ...prev, [itemId]: searchTerm }))
    setItemDropdowns(prev => ({ ...prev, [itemId]: true }))
  }

  const toggleItemDropdown = (itemId: string) => {
    setItemDropdowns(prev => ({ ...prev, [itemId]: !prev[itemId] }))
  }

  const selectStockItem = (itemId: string, stockItem: StockItem) => {
    // Find the item and update it
    const [category, indexStr] = itemId.split('-')
    const index = parseInt(indexStr)
    
    updateItem(category as any, index, 'description', stockItem.name)
    updateItem(category as any, index, 'unit_price', stockItem.unit_price)
    updateItem(category as any, index, 'unit', stockItem.unit)
    updateItem(category as any, index, 'stock_item_id', stockItem.id)
    updateItem(category as any, index, 'stock_item', stockItem)
    
    setItemDropdowns(prev => ({ ...prev, [itemId]: false }))
    setItemSearchTerms(prev => ({ ...prev, [itemId]: "" }))
  }

  // Get filtered items for search
  const getFilteredItems = (itemId: string) => {
    const searchTerm = itemSearchTerms[itemId] || ""
    return stockItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // PDF Generation
  const generatePDF = async () => {
    try {
      const { generate } = await import('@pdfme/generator');
      const { text, rectangle, line, image } = await import('@pdfme/schemas');
      const { generateQuotationPDF } = await import('@/lib/pdf-template');
      
      // Calculate labour amounts
      const cabinetLabour = (totals.cabinetTotal * cabinetLabourPercentage) / 100;
      const accessoriesLabour = (totals.accessoriesTotal * accessoriesLabourPercentage) / 100;
      const appliancesLabour = (totals.appliancesTotal * appliancesLabourPercentage) / 100;
      const wardrobesLabour = (totals.wardrobesTotal * wardrobesLabourPercentage) / 100;
      const tvUnitLabour = (totals.tvUnitTotal * tvUnitLabourPercentage) / 100;
      
      // Calculate subtotal with labour
      const subtotalWithLabour = totals.subtotal + cabinetLabour + accessoriesLabour + appliancesLabour + wardrobesLabour + tvUnitLabour;
      
      // Calculate VAT
      const vatPercentageNum = Number(vatPercentage);
      const originalAmount = subtotalWithLabour / (1 + (vatPercentageNum / 100));
      const vat = subtotalWithLabour - originalAmount;
      const grandTotal = subtotalWithLabour;
      
      // Prepare items data
      const items: Array<{isSection?: boolean, isSectionSummary?: boolean, quantity: number, unit: string, description: string, unitPrice: number, total: number}> = [];
      
      // Add cabinet section header and items
      if (cabinetItems.length > 0) {
        items.push({
          isSection: true,
          description: sectionNames.cabinet,
          quantity: 0, unit: "", unitPrice: 0, total: 0
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
            quantity: 0, unit: "", unitPrice: totals.cabinetTotal,
            total: totals.cabinetTotal + cabinetLabour
          });
        }
      }
      
      // Add worktop section header and items
      if (worktopItems.length > 0) {
        items.push({
          isSection: true,
          description: sectionNames.worktop,
          quantity: 0, unit: "", unitPrice: 0, total: 0
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
            quantity: 0, unit: "", unitPrice: totals.worktopTotal,
            total: totals.worktopTotal
          });
        }
      }
      
      // Add accessories section header and items
      if (accessoriesItems.length > 0) {
        items.push({
          isSection: true,
          description: sectionNames.accessories,
          quantity: 0, unit: "", unitPrice: 0, total: 0
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
            quantity: 0, unit: "", unitPrice: totals.accessoriesTotal,
            total: totals.accessoriesTotal + accessoriesLabour
          });
        }
      }
      
      // Add appliances section header and items
      if (appliancesItems.length > 0) {
        items.push({
          isSection: true,
          description: sectionNames.appliances,
          quantity: 0, unit: "", unitPrice: 0, total: 0
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
            quantity: 0, unit: "", unitPrice: totals.appliancesTotal,
            total: totals.appliancesTotal + appliancesLabour
          });
        }
      }
      
      // Add wardrobes section header and items
      if (wardrobesItems.length > 0) {
        items.push({
          isSection: true,
          description: sectionNames.wardrobes,
          quantity: 0, unit: "", unitPrice: 0, total: 0
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
            quantity: 0, unit: "", unitPrice: totals.wardrobesTotal,
            total: totals.wardrobesTotal + wardrobesLabour
          });
        }
      }
      
      // Add TV Unit section header and items
      if (tvUnitItems.length > 0) {
        items.push({
          isSection: true,
          description: sectionNames.tvunit,
          quantity: 0, unit: "", unitPrice: 0, total: 0
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
            quantity: 0, unit: "", unitPrice: totals.tvUnitTotal,
            total: totals.tvUnitTotal + tvUnitLabour
          });
        }
      }
      
      // Fetch watermark image
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

      // Prepare invoice data
      const invoiceData = {
        companyName: "CABINET MASTER STYLES & FINISHES",
        companyLocation: "Location: Ruiru Eastern By-Pass",
        companyPhone: "Tel: +254729554475",
        companyEmail: "Email: cabinetmasterstyles@gmail.com",
        clientNames: selectedClient?.name || "",
        siteLocation: selectedClient?.location || "",
        mobileNo: selectedClient?.phone || "",
        date: invoiceDate || new Date().toLocaleDateString(),
        deliveryNoteNo: "Invoice No.",
        quotationNumber: invoiceNumber,
        originalQuotationNumber: originalQuotationNumber,
        documentTitle: "INVOICE",
        items: items,
        section_names: sectionNames,
        subtotal: originalAmount,
        vat: vat,
        vatPercentage: vatPercentageNum,
        total: subtotalWithLabour,
        terms: termsConditions.split('\n').filter(line => line.trim()),
        preparedBy: "",
        approvedBy: "",
        watermarkLogo: watermarkLogoBase64,
        companyLogo: watermarkLogoBase64,
      };

      // Generate PDF
      const { template, inputs } = await generateQuotationPDF(invoiceData);
      const pdf = await generate({ template, inputs, plugins: { text, rectangle, line, image } });
      
      // Download the PDF
      const blob = new Blob([new Uint8Array(pdf.buffer)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceNumber}.pdf`;
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

  // Print PDF
  const printPDF = async () => {
    try {
      const { generate } = await import('@pdfme/generator');
      const { text, rectangle, line, image } = await import('@pdfme/schemas');
      const { generateQuotationPDF, imageToBase64 } = await import('@/lib/pdf-template');
      
      // Calculate labour amounts
      const cabinetLabour = (totals.cabinetTotal * cabinetLabourPercentage) / 100;
      const accessoriesLabour = (totals.accessoriesTotal * accessoriesLabourPercentage) / 100;
      const appliancesLabour = (totals.appliancesTotal * appliancesLabourPercentage) / 100;
      const wardrobesLabour = (totals.wardrobesTotal * wardrobesLabourPercentage) / 100;
      const tvUnitLabour = (totals.tvUnitTotal * tvUnitLabourPercentage) / 100;
      
      // Calculate subtotal with labour
      const subtotalWithLabour = totals.subtotal + cabinetLabour + accessoriesLabour + appliancesLabour + wardrobesLabour + tvUnitLabour;
      
      // Calculate VAT
      const vatAmount = (subtotalWithLabour * parseFloat(vatPercentage)) / 100;
      
      // Calculate grand total
      const grandTotal = subtotalWithLabour + vatAmount;
      
      // Convert logo to base64
      const logoBase64 = await imageToBase64('/logo.png');
      // Convert watermark logo to base64
      const watermarkBase64 = await imageToBase64('/logowatermark.png');

      // Prepare items data with section headings
      const items: any[] = [];
      const grouped = {
        cabinet: cabinetItems,
        worktop: worktopItems,
        accessories: accessoriesItems,
        appliances: appliancesItems,
        wardrobes: wardrobesItems,
        tvunit: tvUnitItems
      };

      Object.entries(grouped).forEach(([category, itemsInCategory]) => {
        // Section mapping
        const sectionLabels: { [key: string]: string } = {
          cabinet: sectionNames.cabinet,
          worktop: sectionNames.worktop,
          accessories: sectionNames.accessories,
          appliances: sectionNames.appliances,
          wardrobes: sectionNames.wardrobes,
          tvunit: sectionNames.tvunit
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

        // Add worktop installation labor if exists
        if (category === 'worktop' && worktopLaborQty && worktopLaborUnitPrice) {
          items.push({
            itemNumber: String(itemNumber),
            quantity: worktopLaborQty,
            unit: "per slab",
            description: "Worktop Installation Labor",
            unitPrice: worktopLaborUnitPrice.toFixed(2),
            total: (worktopLaborQty * worktopLaborUnitPrice).toFixed(2)
          });
          itemNumber++;
        }

        // Add labour charge for each section that has items (except worktop which has its own labor)
        if (itemsInCategory.length > 0 && category !== 'worktop') {
          const sectionItemsTotal = itemsInCategory.reduce((sum, item) => sum + (item.total_price || 0), 0);
          
          // Get the correct labour percentage for this specific section
          let labourPercentage = 30; // Default
          switch (category) {
            case 'accessories':
              labourPercentage = accessoriesLabourPercentage;
              break;
            case 'appliances':
              labourPercentage = appliancesLabourPercentage;
              break;
            case 'wardrobes':
              labourPercentage = wardrobesLabourPercentage;
              break;
            case 'tvunit':
              labourPercentage = tvUnitLabourPercentage;
              break;
            default:
              labourPercentage = 30;
          }
          
          const labourAmount = (sectionItemsTotal * labourPercentage) / 100;
          
          if (labourAmount > 0) {
            items.push({
              itemNumber: String(itemNumber),
              quantity: "1",
              unit: "sum",
              description: `Labour Charge (${labourPercentage}%)`,
              unitPrice: labourAmount.toFixed(2),
              total: labourAmount.toFixed(2)
            });
            itemNumber++;
          }
        }

        // Insert section summary row
        let sectionTotal = itemsInCategory.reduce((sum, item) => sum + (item.total_price || 0), 0);
        
        // Add worktop labor to section total if it exists
        if (category === 'worktop' && worktopLaborQty && worktopLaborUnitPrice) {
          sectionTotal += worktopLaborQty * worktopLaborUnitPrice;
        }

        // Add labour charge to section total if it exists (for non-worktop sections)
        if (category !== 'worktop' && category !== 'cabinet' && itemsInCategory.length > 0) {
          const sectionItemsTotal = itemsInCategory.reduce((sum, item) => sum + (item.total_price || 0), 0);
          
          // Get the correct labour percentage for this specific section
          let labourPercentage = 30; // Default
          switch (category) {
            case 'accessories':
              labourPercentage = accessoriesLabourPercentage;
              break;
            case 'appliances':
              labourPercentage = appliancesLabourPercentage;
              break;
            case 'wardrobes':
              labourPercentage = wardrobesLabourPercentage;
              break;
            case 'tvunit':
              labourPercentage = tvUnitLabourPercentage;
              break;
            default:
              labourPercentage = 30;
          }
          
          const labourCharge = (sectionItemsTotal * labourPercentage) / 100;
          if (labourCharge > 0) {
            sectionTotal += labourCharge;
          }
        }
        
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

      // Parse terms and conditions
      const parseTermsAndConditions = (termsText: string) => {
        return (termsText || "").split('\n').filter(line => line.trim());
      };

      // Prepare invoice data
      const { template, inputs } = await generateQuotationPDF({
        companyName: "CABINET MASTER STYLES & FINISHES",
        companyLocation: "Location: Ruiru Eastern By-Pass",
        companyPhone: "Tel: +254729554475",
        companyEmail: "Email: cabinetmasterstyles@gmail.com",
        clientNames: selectedClient?.name || "",
        siteLocation: selectedClient?.location || "",
        mobileNo: selectedClient?.phone || "",
        date: new Date().toLocaleDateString(),
        deliveryNoteNo: "Delivery Note No.",
        quotationNumber: invoiceNumber,
        originalQuotationNumber: originalQuotationNumber || "",
        documentTitle: "INVOICE",
        items,
        subtotal: subtotalWithLabour,
        vat: vatAmount,
        vatPercentage: parseFloat(vatPercentage),
        total: grandTotal,
        notes: notes || "",
        terms: parseTermsAndConditions(termsConditions || ""),
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
      
      // Create blob URL for printing
      const blob = new Blob([new Uint8Array(pdf.buffer)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Open in new window for printing
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      
    } catch (error) {
      console.error('Error generating PDF for printing:', error);
      toast.error("Failed to generate PDF for printing. Please try again.");
    }
  }

  const generatePDFForViewing = async () => {
    if (!invoice) return;
    
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
      const grouped = invoice.items?.reduce((acc, item) => {
        (acc[item.category] = acc[item.category] || []).push(item);
        return acc;
      }, {} as Record<string, typeof invoice.items>) || {};

      Object.entries(grouped).forEach(([category, itemsInCategory]) => {
        // Section mapping
        const sectionLabels: { [key: string]: string } = {
          cabinet: invoice.section_names?.cabinet || "General",
          worktop: invoice.section_names?.worktop || "Worktop", 
          accessories: invoice.section_names?.accessories || "Accessories",
          appliances: invoice.section_names?.appliances || "Appliances",
          wardrobes: invoice.section_names?.wardrobes || "Wardrobes",
          tvunit: invoice.section_names?.tvunit || "TV Unit"
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

        // Add worktop installation labor if exists
        if (category === 'worktop' && invoice.worktop_labor_qty && invoice.worktop_labor_unit_price) {
          items.push({
            itemNumber: String(itemNumber),
            quantity: invoice.worktop_labor_qty,
            unit: "per slab",
            description: "Worktop Installation Labor",
            unitPrice: invoice.worktop_labor_unit_price.toFixed(2),
            total: (invoice.worktop_labor_qty * invoice.worktop_labor_unit_price).toFixed(2)
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
            let labourPercentage = invoice.labour_percentage || 30; // Use general labour_percentage as default
            switch (category) {
              case 'cabinet':
                labourPercentage = invoice.cabinet_labour_percentage || invoice.labour_percentage || 30;
                break;
              case 'accessories':
                labourPercentage = invoice.accessories_labour_percentage || invoice.labour_percentage || 30;
                break;
              case 'appliances':
                labourPercentage = invoice.appliances_labour_percentage || invoice.labour_percentage || 30;
                break;
              case 'wardrobes':
                labourPercentage = invoice.wardrobes_labour_percentage || invoice.labour_percentage || 30;
                break;
              case 'tvunit':
                labourPercentage = invoice.tvunit_labour_percentage || invoice.labour_percentage || 30;
                break;
            }
            
            const labourAmount = (sectionItemsTotal * labourPercentage) / 100;
            
            if (labourAmount > 0) {
              items.push({
                itemNumber: String(itemNumber),
                quantity: "1",
                unit: "sum",
                description: `Labour Charge (${labourPercentage}%)`,
                unitPrice: labourAmount.toFixed(2),
                total: labourAmount.toFixed(2)
              });
              itemNumber++;
            }
          }
        }

        // Insert section summary row
        let sectionTotal = itemsInCategory.reduce((sum, item) => sum + (item.total_price || 0), 0);
        
        // Add worktop labor to section total if it exists
        if (category === 'worktop' && invoice.worktop_labor_qty && invoice.worktop_labor_unit_price) {
          sectionTotal += invoice.worktop_labor_qty * invoice.worktop_labor_unit_price;
        }

        // Add labour charge to section total if it exists (for non-worktop sections)
        if (category !== 'worktop' && category !== 'cabinet' && itemsInCategory.length > 0) {
          const sectionItemsTotal = itemsInCategory.reduce((sum, item) => sum + (item.total_price || 0), 0);
          
          // Get the correct labour percentage for this specific section
          let labourPercentage = invoice.labour_percentage || 30; // Use general labour_percentage as default
          switch (category) {
            case 'accessories':
              labourPercentage = invoice.accessories_labour_percentage || invoice.labour_percentage || 30;
              break;
            case 'appliances':
              labourPercentage = invoice.appliances_labour_percentage || invoice.labour_percentage || 30;
              break;
            case 'wardrobes':
              labourPercentage = invoice.wardrobes_labour_percentage || invoice.labour_percentage || 30;
              break;
            case 'tvunit':
              labourPercentage = invoice.tvunit_labour_percentage || invoice.labour_percentage || 30;
              break;
            default:
              labourPercentage = invoice.labour_percentage || 30;
          }
          
          const labourCharge = (sectionItemsTotal * labourPercentage) / 100;
          if (labourCharge > 0) {
            sectionTotal += labourCharge;
          }
        }
        
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

      // Parse terms and conditions
      const parseTermsAndConditions = (termsText: string) => {
        return (termsText || "").split('\n').filter(line => line.trim());
      };

      // Prepare invoice data (same as working download PDF)
      const { template, inputs } = await generateQuotationPDF({
        companyName: "CABINET MASTER STYLES & FINISHES",
        companyLocation: "Location: Ruiru Eastern By-Pass",
        companyPhone: "Tel: +254729554475",
        companyEmail: "Email: cabinetmasterstyles@gmail.com",
        clientNames: invoice.client?.name || "",
        siteLocation: invoice.client?.location || "",
        mobileNo: invoice.client?.phone || "",
        date: new Date(invoice.date_created).toLocaleDateString(),
        deliveryNoteNo: "Delivery Note No.",
        quotationNumber: invoice.invoice_number,
        originalQuotationNumber: invoice.original_quotation_number || "",
        documentTitle: "INVOICE",
        items,
        subtotal: invoice.total_amount || 0,
        vat: invoice.vat_amount || 0,
        vatPercentage: invoice.vat_percentage || 16,
        total: invoice.grand_total || 0,
        notes: invoice.notes || "",
        terms: parseTermsAndConditions(invoice.terms_conditions || ""),
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

  // Save handler
  const handleSave = async () => {
    if (!selectedClient) {
      toast.error("Please select a client")
      return
    }

    if (!invoiceNumber) {
      toast.error("Please enter an invoice number")
      return
    }

    setLoading(true)

    try {
      // Calculate totals
      const cabinetLabour = (totals.cabinetTotal * cabinetLabourPercentage) / 100;
      const accessoriesLabour = (totals.accessoriesTotal * accessoriesLabourPercentage) / 100;
      const appliancesLabour = (totals.appliancesTotal * appliancesLabourPercentage) / 100;
      const wardrobesLabour = (totals.wardrobesTotal * wardrobesLabourPercentage) / 100;
      const tvUnitLabour = (totals.tvUnitTotal * tvUnitLabourPercentage) / 100;
      
      const subtotalWithLabour = totals.subtotal + cabinetLabour + accessoriesLabour + appliancesLabour + wardrobesLabour + tvUnitLabour;
      const vatPercentageNum = Number(vatPercentage);
      const vat = (subtotalWithLabour * vatPercentageNum) / 100;
      const grandTotal = subtotalWithLabour + vat;

      const invoiceData = {
        invoice_number: invoiceNumber,
        original_quotation_number: originalQuotationNumber,
        date_created: invoiceDate,
        due_date: dueDate,
        client_id: selectedClient.id,
        total_amount: grandTotal,
        subtotal: subtotalWithLabour,
        vat_percentage: vatPercentageNum,
        vat_amount: vat,
        terms_conditions: termsConditions,
        notes: notes,
        status: "pending",
        cabinet_items: cabinetItems,
        worktop_items: worktopItems,
        accessories_items: accessoriesItems,
        appliances_items: appliancesItems,
        wardrobes_items: wardrobesItems,
        tvunit_items: tvUnitItems,
        section_names: sectionNames,
        cabinet_labour_percentage: cabinetLabourPercentage,
        accessories_labour_percentage: accessoriesLabourPercentage,
        appliances_labour_percentage: appliancesLabourPercentage,
        wardrobes_labour_percentage: wardrobesLabourPercentage,
        tvunit_labour_percentage: tvUnitLabourPercentage,
        include_worktop: includeWorktop,
        worktop_labor_qty: worktopLaborQty,
        worktop_labor_unit_price: worktopLaborUnitPrice,
        include_appliances: includeAppliances,
        include_wardrobes: includeWardrobes,
        include_tvunit: includeTvUnit,
        appliances_total: appliancesTotal,
        wardrobes_total: wardrobesTotal,
        tvunit_total: tvUnitTotal,
        paid_amount: 0,
        balance_amount: grandTotal
      }

      await onSave(invoiceData)
      toast.success("Invoice saved successfully!")
      onClose()
    } catch (error) {
      console.error('Error saving invoice:', error)
      toast.error("Failed to save invoice")
    } finally {
      setLoading(false)
    }
  }

  // Calculate totals
  const calculateTotals = () => totals

  // Effects
  useEffect(() => {
    if (isOpen) {
      fetchClients()
      fetchStockItems()
      if (mode === "create") {
        generateInvoiceNumber().then(setInvoiceNumber)
        resetForm()
      } else {
        loadInvoiceData()
        fetchPaymentInfo()
      }
    }
  }, [isOpen, mode, invoice])

  if (!isOpen) return null

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {mode === "create" ? "Create Invoice" : mode === "edit" ? "Edit Invoice" : "View Invoice"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <div className="modal-body" style={{ 
            padding: mode === "view" && pdfUrl ? "0" : "0 32px 24px", 
            maxHeight: "70vh", 
            overflowY: mode === "view" && pdfUrl ? "hidden" : "auto",
            display: mode === "view" && pdfUrl ? "flex" : "block",
            justifyContent: mode === "view" && pdfUrl ? "center" : "flex-start"
          }}>
            {mode === "view" && pdfUrl ? (
              <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center" }}>
                <iframe
                  src={pdfUrl}
                  style={{
                    width: "794px", // Exact A4 width
                    height: "70vh",
                    border: "none",
                    borderRadius: "0"
                  }}
                  title="Invoice PDF"
                />
              </div>
            ) : mode === "view" && pdfLoading ? (
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
            ) : (
              <>
                {/* Basic Information */}
                <div className="row mb-3">
                  <div className="col-md-3">
                    <label className="form-label">Invoice Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      readOnly={mode === "view"}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Original Quotation No.</label>
                    <input
                      type="text"
                      className="form-control"
                      value={originalQuotationNumber}
                      onChange={(e) => setOriginalQuotationNumber(e.target.value)}
                      readOnly={mode === "view"}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Invoice Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      readOnly={mode === "view"}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Due Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      readOnly={mode === "view"}
                    />
                  </div>
                </div>

                {/* Client Selection */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Client</label>
                    <div className="position-relative" ref={clientSearchRef}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search client..."
                        value={clientSearchTerm}
                        onChange={(e) => handleClientSearch(e.target.value)}
                        onFocus={() => setShowClientDropdown(true)}
                        readOnly={mode === "view"}
                      />
                      {selectedClient && (
                        <div className="mt-2">
                          <strong>{selectedClient.name}</strong>
                          {selectedClient.phone && <div>Phone: {selectedClient.phone}</div>}
                          {selectedClient.location && <div>Location: {selectedClient.location}</div>}
                        </div>
                      )}
                      <PortalDropdown
                        isVisible={showClientDropdown}
                        triggerRef={clientSearchRef}
                        onClose={() => setShowClientDropdown(false)}
                      >
                        {clients
                          .filter(client =>
                            client.name.toLowerCase().includes(clientSearchTerm.toLowerCase())
                          )
                          .map(client => (
                            <li key={client.id}>
                              <button
                                className="dropdown-item"
                                onClick={() => handleClientSelect(client)}
                              >
                                {client.name}
                              </button>
                            </li>
                          ))}
                      </PortalDropdown>
                    </div>
                  </div>
                </div>

                {/* Items Sections */}
                {/* Cabinet Section */}
                <div className="card mb-3">
                  <div className="card-header">
                    <EditableSectionHeader
                      sectionKey="cabinet"
                      currentName={sectionNames.cabinet}
                      onEdit={() => handleSectionNameEdit("cabinet")}
                      onSave={() => handleSectionNameSave("cabinet")}
                      onCancel={handleSectionNameCancel}
                      onKeyPress={(e) => handleSectionNameKeyPress(e, "cabinet")}
                      isEditing={editingSection === "cabinet"}
                      editingName={editingName}
                      onEditingNameChange={setEditingName}
                      isReadOnly={mode === "view"}
                    />
                    {mode !== "view" && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => addItem("cabinet")}
                      >
                        <Plus size={14} /> Add Item
                      </button>
                    )}
                  </div>
                  <div className="card-body">
                    {cabinetItems.map((item, index) => (
                      <div key={index} className="row mb-2">
                        <div className="col-md-4">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => updateItem("cabinet", index, "description", e.target.value)}
                            readOnly={mode === "view"}
                          />
                        </div>
                        <div className="col-md-2">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Unit"
                            value={item.unit}
                            onChange={(e) => updateItem("cabinet", index, "unit", e.target.value)}
                            readOnly={mode === "view"}
                          />
                        </div>
                        <div className="col-md-2">
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => updateItem("cabinet", index, "quantity", parseFloat(e.target.value) || 0)}
                            readOnly={mode === "view"}
                          />
                        </div>
                        <div className="col-md-2">
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Unit Price"
                            value={item.unit_price}
                            onChange={(e) => updateItem("cabinet", index, "unit_price", parseFloat(e.target.value) || 0)}
                            readOnly={mode === "view"}
                          />
                        </div>
                        <div className="col-md-1">
                          <span className="form-control-plaintext">
                            {item.total_price.toLocaleString()}
                          </span>
                        </div>
                        {mode !== "view" && (
                          <div className="col-md-1">
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => removeItem("cabinet", index)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {cabinetItems.length > 0 && (
                      <div className="row">
                        <div className="col-md-10 text-end">
                          <strong>Cabinet Total: {totals.cabinetTotal.toLocaleString()}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Worktop Section */}
                <div className="card mb-3">
                  <div className="card-header">
                    <EditableSectionHeader
                      sectionKey="worktop"
                      currentName={sectionNames.worktop}
                      onEdit={() => handleSectionNameEdit("worktop")}
                      onSave={() => handleSectionNameSave("worktop")}
                      onCancel={handleSectionNameCancel}
                      onKeyPress={(e) => handleSectionNameKeyPress(e, "worktop")}
                      isEditing={editingSection === "worktop"}
                      editingName={editingName}
                      onEditingNameChange={setEditingName}
                      isReadOnly={mode === "view"}
                    />
                    {mode !== "view" && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => addItem("worktop")}
                      >
                        <Plus size={14} /> Add Item
                      </button>
                    )}
                  </div>
                  <div className="card-body">
                    {worktopItems.map((item, index) => (
                      <div key={index} className="row mb-2">
                        <div className="col-md-4">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => updateItem("worktop", index, "description", e.target.value)}
                            readOnly={mode === "view"}
                          />
                        </div>
                        <div className="col-md-2">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Unit"
                            value={item.unit}
                            onChange={(e) => updateItem("worktop", index, "unit", e.target.value)}
                            readOnly={mode === "view"}
                          />
                        </div>
                        <div className="col-md-2">
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => updateItem("worktop", index, "quantity", parseFloat(e.target.value) || 0)}
                            readOnly={mode === "view"}
                          />
                        </div>
                        <div className="col-md-2">
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Unit Price"
                            value={item.unit_price}
                            onChange={(e) => updateItem("worktop", index, "unit_price", parseFloat(e.target.value) || 0)}
                            readOnly={mode === "view"}
                          />
                        </div>
                        <div className="col-md-1">
                          <span className="form-control-plaintext">
                            {item.total_price.toLocaleString()}
                          </span>
                        </div>
                        {mode !== "view" && (
                          <div className="col-md-1">
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => removeItem("worktop", index)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {worktopItems.length > 0 && (
                      <div className="row">
                        <div className="col-md-10 text-end">
                          <strong>Worktop Total: {totals.worktopTotal.toLocaleString()}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Accessories Section */}
                <div className="card mb-3">
                  <div className="card-header">
                    <EditableSectionHeader
                      sectionKey="accessories"
                      currentName={sectionNames.accessories}
                      onEdit={() => handleSectionNameEdit("accessories")}
                      onSave={() => handleSectionNameSave("accessories")}
                      onCancel={handleSectionNameCancel}
                      onKeyPress={(e) => handleSectionNameKeyPress(e, "accessories")}
                      isEditing={editingSection === "accessories"}
                      editingName={editingName}
                      onEditingNameChange={setEditingName}
                      isReadOnly={mode === "view"}
                    />
                    {mode !== "view" && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => addItem("accessories")}
                      >
                        <Plus size={14} /> Add Item
                      </button>
                    )}
                  </div>
                  <div className="card-body">
                    {accessoriesItems.map((item, index) => (
                      <div key={index} className="row mb-2">
                        <div className="col-md-4">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => updateItem("accessories", index, "description", e.target.value)}
                            readOnly={mode === "view"}
                          />
                        </div>
                        <div className="col-md-2">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Unit"
                            value={item.unit}
                            onChange={(e) => updateItem("accessories", index, "unit", e.target.value)}
                            readOnly={mode === "view"}
                          />
                        </div>
                        <div className="col-md-2">
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => updateItem("accessories", index, "quantity", parseFloat(e.target.value) || 0)}
                            readOnly={mode === "view"}
                          />
                        </div>
                        <div className="col-md-2">
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Unit Price"
                            value={item.unit_price}
                            onChange={(e) => updateItem("accessories", index, "unit_price", parseFloat(e.target.value) || 0)}
                            readOnly={mode === "view"}
                          />
                        </div>
                        <div className="col-md-1">
                          <span className="form-control-plaintext">
                            {item.total_price.toLocaleString()}
                          </span>
                        </div>
                        {mode !== "view" && (
                          <div className="col-md-1">
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => removeItem("accessories", index)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {accessoriesItems.length > 0 && (
                      <div className="row">
                        <div className="col-md-10 text-end">
                          <strong>Accessories Total: {totals.accessoriesTotal.toLocaleString()}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Appliances Section */}
                <div className="card mb-3">
                  <div className="card-header">
                    <EditableSectionHeader
                      sectionKey="appliances"
                      currentName={sectionNames.appliances}
                      onEdit={() => handleSectionNameEdit("appliances")}
                      onSave={() => handleSectionNameSave("appliances")}
                      onCancel={handleSectionNameCancel}
                      onKeyPress={(e) => handleSectionNameKeyPress(e, "appliances")}
                      isEditing={editingSection === "appliances"}
                      editingName={editingName}
                      onEditingNameChange={setEditingName}
                      isReadOnly={mode === "view"}
                    />
                    {mode !== "view" && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => addItem("appliances")}
                      >
                        <Plus size={14} /> Add Item
                      </button>
                    )}
                  </div>
                  <div className="card-body">
                    {appliancesItems.map((item, index) => (
                      <div key={index} className="row mb-2">
                        <div className="col-md-4">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => updateItem("appliances", index, "description", e.target.value)}
                            readOnly={mode === "view"}
                          />
                        </div>
                        <div className="col-md-2">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Unit"
                            value={item.unit}
                            onChange={(e) => updateItem("appliances", index, "unit", e.target.value)}
                            readOnly={mode === "view"}
                          />
                        </div>
                        <div className="col-md-2">
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => updateItem("appliances", index, "quantity", parseFloat(e.target.value) || 0)}
                            readOnly={mode === "view"}
                          />
                        </div>
                        <div className="col-md-2">
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Unit Price"
                            value={item.unit_price}
                            onChange={(e) => updateItem("appliances", index, "unit_price", parseFloat(e.target.value) || 0)}
                            readOnly={mode === "view"}
                          />
                        </div>
                        <div className="col-md-1">
                          <span className="form-control-plaintext">
                            {item.total_price.toLocaleString()}
                          </span>
                        </div>
                        {mode !== "view" && (
                          <div className="col-md-1">
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => removeItem("appliances", index)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {appliancesItems.length > 0 && (
                      <div className="row">
                        <div className="col-md-10 text-end">
                          <strong>Appliances Total: {totals.appliancesTotal.toLocaleString()}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Wardrobes Section */}
                <div className="card mb-3">
                  <div className="card-header">
                    <EditableSectionHeader
                      sectionKey="wardrobes"
                      currentName={sectionNames.wardrobes}
                      onEdit={() => handleSectionNameEdit("wardrobes")}
                      onSave={() => handleSectionNameSave("wardrobes")}
                      onCancel={handleSectionNameCancel}
                      onKeyPress={(e) => handleSectionNameKeyPress(e, "wardrobes")}
                      isEditing={editingSection === "wardrobes"}
                      editingName={editingName}
                      onEditingNameChange={setEditingName}
                      isReadOnly={mode === "view"}
                    />
                    {mode !== "view" && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => addItem("wardrobes")}
                      >
                        <Plus size={14} /> Add Item
                      </button>
                    )}
                  </div>
                  <div className="card-body">
                    {wardrobesItems.map((item, index) => (
                      <div key={index} className="row mb-2">
                        <div className="col-md-4">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => updateItem("wardrobes", index, "description", e.target.value)}
                            readOnly={mode === "view"}
                          />
                        </div>
                        <div className="col-md-2">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Unit"
                            value={item.unit}
                            onChange={(e) => updateItem("wardrobes", index, "unit", e.target.value)}
                            readOnly={mode === "view"}
                          />
                        </div>
                        <div className="col-md-2">
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => updateItem("wardrobes", index, "quantity", parseFloat(e.target.value) || 0)}
                            readOnly={mode === "view"}
                          />
                        </div>
                        <div className="col-md-2">
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Unit Price"
                            value={item.unit_price}
                            onChange={(e) => updateItem("wardrobes", index, "unit_price", parseFloat(e.target.value) || 0)}
                            readOnly={mode === "view"}
                          />
                        </div>
                        <div className="col-md-1">
                          <span className="form-control-plaintext">
                            {item.total_price.toLocaleString()}
                          </span>
                        </div>
                        {mode !== "view" && (
                          <div className="col-md-1">
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => removeItem("wardrobes", index)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {wardrobesItems.length > 0 && (
                      <div className="row">
                        <div className="col-md-10 text-end">
                          <strong>Wardrobes Total: {totals.wardrobesTotal.toLocaleString()}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* TV Unit Section */}
                <div className="card mb-3">
                  <div className="card-header">
                    <EditableSectionHeader
                      sectionKey="tvunit"
                      currentName={sectionNames.tvunit}
                      onEdit={() => handleSectionNameEdit("tvunit")}
                      onSave={() => handleSectionNameSave("tvunit")}
                      onCancel={handleSectionNameCancel}
                      onKeyPress={(e) => handleSectionNameKeyPress(e, "tvunit")}
                      isEditing={editingSection === "tvunit"}
                      editingName={editingName}
                      onEditingNameChange={setEditingName}
                      isReadOnly={mode === "view"}
                    />
                    {mode !== "view" && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => addItem("tvunit")}
                      >
                        <Plus size={14} /> Add Item
                      </button>
                    )}
                  </div>
                  <div className="card-body">
                    {tvUnitItems.map((item, index) => (
                      <div key={index} className="row mb-2">
                        <div className="col-md-4">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => updateItem("tvunit", index, "description", e.target.value)}
                            readOnly={mode === "view"}
                          />
                        </div>
                        <div className="col-md-2">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Unit"
                            value={item.unit}
                            onChange={(e) => updateItem("tvunit", index, "unit", e.target.value)}
                            readOnly={mode === "view"}
                          />
                        </div>
                        <div className="col-md-2">
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => updateItem("tvunit", index, "quantity", parseFloat(e.target.value) || 0)}
                            readOnly={mode === "view"}
                          />
                        </div>
                        <div className="col-md-2">
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Unit Price"
                            value={item.unit_price}
                            onChange={(e) => updateItem("tvunit", index, "unit_price", parseFloat(e.target.value) || 0)}
                            readOnly={mode === "view"}
                          />
                        </div>
                        <div className="col-md-1">
                          <span className="form-control-plaintext">
                            {item.total_price.toLocaleString()}
                          </span>
                        </div>
                        {mode !== "view" && (
                          <div className="col-md-1">
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => removeItem("tvunit", index)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {tvUnitItems.length > 0 && (
                      <div className="row">
                        <div className="col-md-10 text-end">
                          <strong>TV Unit Total: {totals.tvUnitTotal.toLocaleString()}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Labour & Installation Section */}
                <div className="card mb-3">
                  <div className="card-header">
                    <h6 className="mb-0">Labour & Installation</h6>
                  </div>
                  <div className="card-body">
                    <div className="row mb-2">
                      <div className="col-md-6">
                        <label className="form-label">Cabinet Labour %</label>
                        <input
                          type="number"
                          className="form-control"
                          value={cabinetLabourPercentage}
                          onChange={(e) => setCabinetLabourPercentage(parseFloat(e.target.value) || 0)}
                          readOnly={mode === "view"}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Accessories Labour %</label>
                        <input
                          type="number"
                          className="form-control"
                          value={accessoriesLabourPercentage}
                          onChange={(e) => setAccessoriesLabourPercentage(parseFloat(e.target.value) || 0)}
                          readOnly={mode === "view"}
                        />
                      </div>
                    </div>
                    {/* Add other labour percentage fields */}
                  </div>
                </div>

                {/* Totals Section */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header">
                        <h6 className="mb-0">Totals</h6>
                      </div>
                      <div className="card-body">
                        <div className="row mb-2">
                          <div className="col-md-6">Subtotal:</div>
                          <div className="col-md-6 text-end">{totals.subtotal.toLocaleString()}</div>
                        </div>
                        <div className="row mb-2">
                          <div className="col-md-6">VAT ({vatPercentage}%):</div>
                          <div className="col-md-6 text-end">{vatAmount.toLocaleString()}</div>
                        </div>
                        <div className="row">
                          <div className="col-md-6"><strong>Total:</strong></div>
                          <div className="col-md-6 text-end"><strong>{(totals.subtotal + vatAmount).toLocaleString()}</strong></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header">
                        <h6 className="mb-0">Payment Information</h6>
                      </div>
                      <div className="card-body">
                        <div className="row mb-2">
                          <div className="col-md-6">Total Paid:</div>
                          <div className="col-md-6 text-end">KES {paymentInfo.paidAmount.toLocaleString()}</div>
                        </div>
                        <div className="row mb-2">
                          <div className="col-md-6">Payment Percentage:</div>
                          <div className="col-md-6 text-end">{paymentInfo.paymentPercentage.toFixed(1)}%</div>
                        </div>
                        <div className="row">
                          <div className="col-md-6">Balance:</div>
                          <div className="col-md-6 text-end">KES {paymentInfo.balanceAmount.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms and Notes */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Terms & Conditions</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={termsConditions}
                      onChange={(e) => setTermsConditions(e.target.value)}
                      readOnly={mode === "view"}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      readOnly={mode === "view"}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

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
                <button
                  type="button"
                  className="btn btn-info"
                  onClick={printPDF}
                  style={{ 
                    borderRadius: "12px", 
                    padding: "10px 24px",
                    background: "linear-gradient(135deg, #17a2b8 0%, #138496 100%)",
                    border: "none"
                  }}
                >
                  <Printer className="me-2" size={16} />
                  Print
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
                    "Save Invoice"
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

export default InvoiceModal 