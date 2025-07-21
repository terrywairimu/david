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
      setStockItems(data || [])
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
    setNotes(quotation.notes || "")
    setTermsConditions(quotation.terms_conditions || "")
    
    // Load items by category
    if (quotation.items) {
      const cabinet = quotation.items.filter((item: any) => item.category === "cabinet")
      const worktop = quotation.items.filter((item: any) => item.category === "worktop")
      const accessories = quotation.items.filter((item: any) => item.category === "accessories")
      const appliances = quotation.items.filter((item: any) => item.category === "appliances")
      
      setCabinetItems(cabinet.length > 0 ? cabinet : [createNewItem("cabinet")])
      setWorktopItems(worktop)
      setAccessoriesItems(accessories)
      setAppliancesItems(appliances)
    }
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
      const category = item.category
      const index = allItems.findIndex(item => item.id?.toString() === itemId)
      
      updateItem(category, index, "stock_item_id", stockItem.id)
      updateItem(category, index, "description", stockItem.name)
      updateItem(category, index, "unit", stockItem.unit)
      updateItem(category, index, "unit_price", stockItem.selling_price)
      
      setItemDropdownVisible(prev => ({ ...prev, [itemId]: false }))
      setItemSearches(prev => ({ ...prev, [itemId]: "" }))
    }
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">
            {mode === "create" ? "New Quotation" : mode === "edit" ? "Edit Quotation" : "View Quotation"}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="quotationNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Quotation Number
              </label>
              <input
                type="text"
                id="quotationNumber"
                value={quotationNumber}
                onChange={(e) => setQuotationNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                readOnly={isReadOnly}
              />
            </div>
            <div>
              <label htmlFor="quotationDate" className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                id="quotationDate"
                value={new Date().toISOString().slice(0, 10)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                readOnly={isReadOnly}
              />
            </div>
            <div>
              <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
                Client
              </label>
              <div ref={clientInputRef} className="relative">
                <input
                  type="text"
                  id="client"
                  value={clientSearchTerm}
                  onChange={(e) => handleClientSearch(e.target.value)}
                  onClick={() => setClientDropdownVisible(true)}
                  onBlur={() => setTimeout(() => setClientDropdownVisible(false), 100)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search clients..."
                  readOnly={isReadOnly}
                />
                {clientDropdownVisible && (
                  <PortalDropdown
                    isVisible={clientDropdownVisible}
                    triggerRef={clientInputRef}
                    onClose={() => setClientDropdownVisible(false)}
                  >
                    {filteredClients.map(client => (
                      <li
                        key={client.id}
                        onClick={() => handleClientSelect(client)}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                      >
                        {client.name}
                        {client.phone && ` (${client.phone})`}
                        {client.location && `, ${client.location}`}
                      </li>
                    ))}
                  </PortalDropdown>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={quotation?.status || "pending"}
                onChange={(e) => {}}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                readOnly={isReadOnly}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label htmlFor="labourPercentage" className="block text-sm font-medium text-gray-700 mb-1">
                Labour Percentage
              </label>
              <input
                type="number"
                id="labourPercentage"
                value={labourPercentage}
                onChange={(e) => setLabourPercentage(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                readOnly={isReadOnly}
              />
            </div>
            <div>
              <label htmlFor="includeWorktop" className="block text-sm font-medium text-gray-700 mb-1">
                Include Worktop
              </label>
              <input
                type="checkbox"
                id="includeWorktop"
                checked={includeWorktop}
                onChange={(e) => setIncludeWorktop(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                readOnly={isReadOnly}
              />
            </div>
            <div>
              <label htmlFor="includeAccessories" className="block text-sm font-medium text-gray-700 mb-1">
                Include Accessories
              </label>
              <input
                type="checkbox"
                id="includeAccessories"
                checked={includeAccessories}
                onChange={(e) => setIncludeAccessories(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                readOnly={isReadOnly}
              />
            </div>
            <div>
              <label htmlFor="includeAppliances" className="block text-sm font-medium text-gray-700 mb-1">
                Include Appliances
              </label>
              <input
                type="checkbox"
                id="includeAppliances"
                checked={includeAppliances}
                onChange={(e) => setIncludeAppliances(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                readOnly={isReadOnly}
              />
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                readOnly={isReadOnly}
              />
            </div>
            <div>
              <label htmlFor="termsConditions" className="block text-sm font-medium text-gray-700 mb-1">
                Terms & Conditions
              </label>
              <textarea
                id="termsConditions"
                value={termsConditions}
                onChange={(e) => setTermsConditions(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                readOnly={isReadOnly}
              />
            </div>
          </div>

          <div className="mt-4 border-t pt-4">
            <h4 className="text-lg font-semibold mb-2">Items</h4>
            <div className="flex space-x-2 mb-2">
              <button
                onClick={() => addItem("cabinet")}
                className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                disabled={isReadOnly}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Cabinet
              </button>
              <button
                onClick={() => addItem("worktop")}
                className="flex items-center px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                disabled={isReadOnly}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Worktop
              </button>
              <button
                onClick={() => addItem("accessories")}
                className="flex items-center px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                disabled={isReadOnly}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Accessories
              </button>
              <button
                onClick={() => addItem("appliances")}
                className="flex items-center px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                disabled={isReadOnly}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Appliances
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="text-md font-semibold mb-2">Cabinets</h5>
                {cabinetItems.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md mb-2">
                    <div className="flex items-center">
                      <ChevronRight className="h-4 w-4 text-gray-500 mr-2" />
                      <span>{item.description || "New Item"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>{item.quantity} {item.unit}</span>
                      <span>${item.unit_price.toFixed(2)}</span>
                      <span>${item.total_price.toFixed(2)}</span>
                      {!isReadOnly && (
                        <button
                          onClick={() => removeItem("cabinet", index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <h5 className="text-md font-semibold mb-2">Worktops</h5>
                {worktopItems.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md mb-2">
                    <div className="flex items-center">
                      <ChevronRight className="h-4 w-4 text-gray-500 mr-2" />
                      <span>{item.description || "New Item"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>{item.quantity} {item.unit}</span>
                      <span>${item.unit_price.toFixed(2)}</span>
                      <span>${item.total_price.toFixed(2)}</span>
                      {!isReadOnly && (
                        <button
                          onClick={() => removeItem("worktop", index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <h5 className="text-md font-semibold mb-2">Accessories</h5>
                {accessoriesItems.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md mb-2">
                    <div className="flex items-center">
                      <ChevronRight className="h-4 w-4 text-gray-500 mr-2" />
                      <span>{item.description || "New Item"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>{item.quantity} {item.unit}</span>
                      <span>${item.unit_price.toFixed(2)}</span>
                      <span>${item.total_price.toFixed(2)}</span>
                      {!isReadOnly && (
                        <button
                          onClick={() => removeItem("accessories", index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <h5 className="text-md font-semibold mb-2">Appliances</h5>
                {appliancesItems.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md mb-2">
                    <div className="flex items-center">
                      <ChevronRight className="h-4 w-4 text-gray-500 mr-2" />
                      <span>{item.description || "New Item"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>{item.quantity} {item.unit}</span>
                      <span>${item.unit_price.toFixed(2)}</span>
                      <span>${item.total_price.toFixed(2)}</span>
                      {!isReadOnly && (
                        <button
                          onClick={() => removeItem("appliances", index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 border-t pt-4 flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Quotation"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 