import React, { useState } from "react"
import { Search, Plus, Minus, Calculator, FileText, User, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { BaseModal, FormModal, ConfirmationModal, DocumentModal } from "./modal"
import { 
  RegisteredEntity, 
  StockItem, 
  QuotationFormData, 
  QuotationSectionFormData,
  QuotationSectionItemFormData 
} from "@/lib/types"

// Entity Search Modal Props
export interface EntitySearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (entity: RegisteredEntity) => void
  type: "client" | "supplier" | "all"
  title?: string
  searchPlaceholder?: string
  entities?: RegisteredEntity[]
  loading?: boolean
  onSearch?: (query: string) => void
}

// Entity Search Modal Component
const EntitySearchModal: React.FC<EntitySearchModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  type,
  title,
  searchPlaceholder = "Search entities...",
  entities = [],
  loading = false,
  onSearch
}) => {
  const [searchQuery, setSearchQuery] = useState("")
  
  const filteredEntities = entities.filter(entity => {
    const matchesSearch = entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entity.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entity.location?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = type === "all" || entity.type === type
    return matchesSearch && matchesType
  })

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (onSearch) {
      onSearch(query)
    }
  }

  const getEntityIcon = (entityType: string) => {
    return entityType === "client" ? <User className="h-4 w-4" /> : <Building className="h-4 w-4" />
  }

  const getEntityBadge = (entityType: string) => {
    return entityType === "client" ? (
      <Badge variant="default" className="bg-blue-100 text-blue-800">Client</Badge>
    ) : (
      <Badge variant="default" className="bg-purple-100 text-purple-800">Supplier</Badge>
    )
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title || `Select ${type === "all" ? "Entity" : type.charAt(0).toUpperCase() + type.slice(1)}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredEntities.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No entities found
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEntities.map((entity) => (
                <Card
                  key={entity.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    onSelect(entity)
                    onClose()
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getEntityIcon(entity.type)}
                        <div>
                          <div className="font-medium">{entity.name}</div>
                          <div className="text-sm text-gray-500">
                            {entity.phone} • {entity.location}
                          </div>
                        </div>
                      </div>
                      {getEntityBadge(entity.type)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  )
}

// Stock Item Search Modal Props
export interface StockSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (item: StockItem) => void
  title?: string
  searchPlaceholder?: string
  items?: StockItem[]
  loading?: boolean
  onSearch?: (query: string) => void
  allowQuantitySelection?: boolean
}

// Stock Item Search Modal Component
const StockSearchModal: React.FC<StockSearchModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = "Select Stock Item",
  searchPlaceholder = "Search stock items...",
  items = [],
  loading = false,
  onSearch,
  allowQuantitySelection = false
}) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (onSearch) {
      onSearch(query)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_stock":
        return <Badge variant="default" className="bg-green-100 text-green-800">In Stock</Badge>
      case "low_stock":
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Low Stock</Badge>
      case "out_of_stock":
        return <Badge variant="destructive">Out of Stock</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
    >
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No stock items found
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <Card
                  key={item.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    onSelect(item)
                    if (!allowQuantitySelection) {
                      onClose()
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">
                          {item.description}
                        </div>
                        <div className="text-sm font-medium mt-1">
                          ${item.unit_price.toFixed(2)} • Qty: {item.quantity}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(item.status)}
                        {allowQuantitySelection && (
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedQuantity(Math.max(1, selectedQuantity - 1))
                              }}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{selectedQuantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedQuantity(Math.min(item.quantity, selectedQuantity + 1))
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  )
}

// Quotation Modal Props
export interface QuotationModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: QuotationFormData) => void
  title?: string
  initialData?: QuotationFormData
  clients?: RegisteredEntity[]
  loading?: boolean
  mode?: "create" | "edit" | "view"
}

// Quotation Modal Component
const QuotationModal: React.FC<QuotationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title = "Create Quotation",
  initialData,
  clients = [],
  loading = false,
  mode = "create"
}) => {
  const [formData, setFormData] = useState<QuotationFormData>(
    initialData || {
      client_id: 0,
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: "",
      terms_conditions: "",
      kitchen_cabinets: { items: [], labour_cost: 0 },
      worktop: { items: [], labour_cost: 0 },
      accessories: { items: [], labour_cost: 0 }
    }
  )

  const [activeTab, setActiveTab] = useState("kitchen_cabinets")

  const addItem = (section: keyof typeof formData.kitchen_cabinets) => {
    const newItem: QuotationSectionItemFormData = {
      description: "",
      quantity: 1,
      unit: "pcs",
      unit_price: 0,
      specifications: "",
      notes: ""
    }
    
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        items: [...prev[section].items, newItem]
      }
    }))
  }

  const removeItem = (section: keyof typeof formData.kitchen_cabinets, index: number) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        items: prev[section].items.filter((_, i) => i !== index)
      }
    }))
  }

  const updateItem = (
    section: keyof typeof formData.kitchen_cabinets,
    index: number,
    field: keyof QuotationSectionItemFormData,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        items: prev[section].items.map((item, i) => 
          i === index ? { ...item, [field]: value } : item
        )
      }
    }))
  }

  const updateLabourCost = (section: keyof typeof formData.kitchen_cabinets, cost: number) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        labour_cost: cost
      }
    }))
  }

  const calculateSectionTotal = (section: QuotationSectionFormData) => {
    const itemsTotal = section.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    return itemsTotal + section.labour_cost
  }

  const calculateGrandTotal = () => {
    return calculateSectionTotal(formData.kitchen_cabinets) +
           calculateSectionTotal(formData.worktop) +
           calculateSectionTotal(formData.accessories)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const renderSection = (
    sectionKey: keyof typeof formData.kitchen_cabinets,
    sectionTitle: string
  ) => {
    const section = formData[sectionKey]
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{sectionTitle}</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addItem(sectionKey)}
            disabled={mode === "view"}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        <div className="space-y-3">
          {section.items.map((item, index) => (
            <Card key={index} className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor={`${sectionKey}-desc-${index}`}>Description</Label>
                  <Input
                    id={`${sectionKey}-desc-${index}`}
                    value={item.description}
                    onChange={(e) => updateItem(sectionKey, index, "description", e.target.value)}
                    disabled={mode === "view"}
                  />
                </div>
                <div>
                  <Label htmlFor={`${sectionKey}-qty-${index}`}>Quantity</Label>
                  <Input
                    id={`${sectionKey}-qty-${index}`}
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(sectionKey, index, "quantity", parseInt(e.target.value) || 0)}
                    disabled={mode === "view"}
                  />
                </div>
                <div>
                  <Label htmlFor={`${sectionKey}-unit-${index}`}>Unit</Label>
                  <Select
                    value={item.unit}
                    onValueChange={(value) => updateItem(sectionKey, index, "unit", value)}
                    disabled={mode === "view"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pcs">Pieces</SelectItem>
                      <SelectItem value="m">Meters</SelectItem>
                      <SelectItem value="sqm">Square Meters</SelectItem>
                      <SelectItem value="kg">Kilograms</SelectItem>
                      <SelectItem value="set">Set</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor={`${sectionKey}-price-${index}`}>Unit Price</Label>
                  <Input
                    id={`${sectionKey}-price-${index}`}
                    type="number"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateItem(sectionKey, index, "unit_price", parseFloat(e.target.value) || 0)}
                    disabled={mode === "view"}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor={`${sectionKey}-specs-${index}`}>Specifications</Label>
                  <Textarea
                    id={`${sectionKey}-specs-${index}`}
                    value={item.specifications}
                    onChange={(e) => updateItem(sectionKey, index, "specifications", e.target.value)}
                    disabled={mode === "view"}
                  />
                </div>
                <div>
                  <Label htmlFor={`${sectionKey}-notes-${index}`}>Notes</Label>
                  <Textarea
                    id={`${sectionKey}-notes-${index}`}
                    value={item.notes}
                    onChange={(e) => updateItem(sectionKey, index, "notes", e.target.value)}
                    disabled={mode === "view"}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Total: ${(item.quantity * item.unit_price).toFixed(2)}
                </div>
                {mode !== "view" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(sectionKey, index)}
                  >
                    <Minus className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <Label htmlFor={`${sectionKey}-labour`}>Labour Cost</Label>
            <Input
              id={`${sectionKey}-labour`}
              type="number"
              step="0.01"
              value={section.labour_cost}
              onChange={(e) => updateLabourCost(sectionKey, parseFloat(e.target.value) || 0)}
              className="w-32"
              disabled={mode === "view"}
            />
          </div>
        </Card>

        <div className="text-right">
          <div className="text-lg font-semibold">
            Section Total: ${calculateSectionTotal(section).toFixed(2)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={title}
      size="full"
      submitLabel={mode === "create" ? "Create Quotation" : "Update Quotation"}
      submitDisabled={loading || formData.client_id === 0}
      submitLoading={loading}
      showFooter={mode !== "view"}
    >
      <div className="space-y-6">
        {/* Client Selection */}
        <Card className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client">Client</Label>
              <Select
                value={formData.client_id.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: parseInt(value) }))}
                disabled={mode === "view"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="valid_until">Valid Until</Label>
              <Input
                id="valid_until"
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                disabled={mode === "view"}
              />
            </div>
          </div>
        </Card>

        {/* Quotation Sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="kitchen_cabinets">Kitchen Cabinets</TabsTrigger>
            <TabsTrigger value="worktop">Worktop</TabsTrigger>
            <TabsTrigger value="accessories">Accessories</TabsTrigger>
          </TabsList>
          
          <TabsContent value="kitchen_cabinets" className="mt-6">
            {renderSection("kitchen_cabinets", "Kitchen Cabinets")}
          </TabsContent>
          
          <TabsContent value="worktop" className="mt-6">
            {renderSection("worktop", "Worktop")}
          </TabsContent>
          
          <TabsContent value="accessories" className="mt-6">
            {renderSection("accessories", "Accessories")}
          </TabsContent>
        </Tabs>

        {/* Notes and Terms */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                disabled={mode === "view"}
              />
            </div>
            <div>
              <Label htmlFor="terms">Terms & Conditions</Label>
              <Textarea
                id="terms"
                value={formData.terms_conditions}
                onChange={(e) => setFormData(prev => ({ ...prev, terms_conditions: e.target.value }))}
                disabled={mode === "view"}
              />
            </div>
          </div>
        </Card>

        {/* Grand Total */}
        <Card className="p-4">
          <div className="text-right">
            <div className="text-2xl font-bold">
              Grand Total: ${calculateGrandTotal().toFixed(2)}
            </div>
          </div>
        </Card>
      </div>
    </FormModal>
  )
}

// Export all components
export {
  EntitySearchModal,
  StockSearchModal,
  QuotationModal
} 