"use client"

import React, { useState, useEffect } from "react"
import { X, Plus, Trash2, Search, User, Calculator, FileText } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import { generateNextNumber } from "@/lib/workflow-utils"

interface Client {
  id: number
  name: string
  phone?: string
  location?: string
}

interface QuotationItem {
  id?: number
  category: "cabinet" | "worktop" | "accessories"
  description: string
  unit: string
  quantity: number
  unit_price: number
  total_price: number
  stock_item_id?: number
}

interface QuotationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (quotation: any) => void
  quotation?: any
  mode: "view" | "edit" | "create"
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
  const [items, setItems] = useState<QuotationItem[]>([])
  const [labourPercentage, setLabourPercentage] = useState(30)
  const [includeAccessories, setIncludeAccessories] = useState(false)
  const [notes, setNotes] = useState("")
  const [termsConditions, setTermsConditions] = useState(
    "1. All work to be completed within agreed timeframe.\n2. Client to provide necessary measurements and specifications.\n3. Final payment due upon completion.\n4. Any changes to the original design may incur additional charges."
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchClients()
      if (mode === "create") {
        generateQuotationNumber()
      } else if (quotation) {
        loadQuotationData()
      }
    }
  }, [isOpen, mode, quotation])

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

  const generateQuotationNumber = async () => {
    try {
      const number = await generateNextNumber("quotations", "quotation_number", "QUO")
      setQuotationNumber(number)
    } catch (error) {
      console.error("Error generating quotation number:", error)
      // Fallback to time-based generation
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const time = String(now.getTime()).slice(-4)
      setQuotationNumber(`QUO-${year}${month}${day}-${time}`)
    }
  }

  const loadQuotationData = () => {
    if (quotation) {
      setQuotationNumber(quotation.quotation_number)
      setSelectedClient(quotation.client)
      setClientSearchTerm(quotation.client?.name || "")
      setItems(quotation.items || [])
      setLabourPercentage(quotation.labour_percentage || 30)
      setIncludeAccessories(quotation.include_accessories || false)
      setNotes(quotation.notes || "")
      setTermsConditions(quotation.terms_conditions || "")
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
    setShowClientResults(false)
  }

  const addItem = (category: "cabinet" | "worktop" | "accessories") => {
    const newItem: QuotationItem = {
      category,
      description: "",
      unit: "",
      quantity: 1,
      unit_price: 0,
      total_price: 0
    }
    setItems([...items, newItem])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItemTotal = (index: number, field: keyof QuotationItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      [field]: value
    }
    
    // Recalculate total price
    if (field === "quantity" || field === "unit_price") {
      newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price
    }
    
    setItems(newItems)
  }

  const calculateTotals = () => {
    const cabinetItems = items.filter(item => item.category === "cabinet")
    const worktopItems = items.filter(item => item.category === "worktop")
    const accessoriesItems = items.filter(item => item.category === "accessories")

    const cabinetTotal = cabinetItems.reduce((sum, item) => sum + item.total_price, 0)
    const worktopTotal = worktopItems.reduce((sum, item) => sum + item.total_price, 0)
    const accessoriesTotal = accessoriesItems.reduce((sum, item) => sum + item.total_price, 0)

    const subtotal = cabinetTotal + worktopTotal + (includeAccessories ? accessoriesTotal : 0)
    const labourTotal = (subtotal * labourPercentage) / 100
    const grandTotal = subtotal + labourTotal

    return {
      cabinetTotal,
      worktopTotal,
      accessoriesTotal,
      labourTotal,
      grandTotal
    }
  }

  const handleSave = async () => {
    if (!selectedClient) {
      toast.error("Please select a client")
      return
    }

    if (items.length === 0) {
      toast.error("Please add at least one item")
      return
    }

    setLoading(true)
    try {
      const totals = calculateTotals()
      const quotationData = {
        quotation_number: quotationNumber,
        client_id: selectedClient.id,
        client: selectedClient,
        date_created: new Date().toISOString().split('T')[0],
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        cabinet_total: totals.cabinetTotal,
        worktop_total: totals.worktopTotal,
        accessories_total: totals.accessoriesTotal,
        labour_percentage: labourPercentage,
        labour_total: totals.labourTotal,
        total_amount: totals.grandTotal,
        grand_total: totals.grandTotal,
        include_accessories: includeAccessories,
        status: "pending",
        notes,
        terms_conditions: termsConditions,
        items
      }

      onSave(quotationData)
    } catch (error) {
      console.error("Error saving quotation:", error)
      toast.error("Failed to save quotation")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const totals = calculateTotals()
  const isReadOnly = mode === "view"

  return (
    <div className="modal fade show" style={{ display: "block", zIndex: 1055, backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content" style={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">
              {mode === "view" ? "View" : mode === "edit" ? "Edit" : "New"} Quotation
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
          <div className="modal-body pt-2">
            <form id="quotationForm">
              {/* Client and Quotation Number Section */}
              <div className="mb-4">
                <div className="row">
                  <div className="col-md-6">
                    <label className="form-label">Client</label>
                    <div className="position-relative">
                      <div className="input-group shadow-sm">
                        <input 
                          type="text" 
                          className="form-control border-0" 
                          placeholder="Search client..."
                          value={clientSearchTerm}
                          onChange={(e) => {
                            setClientSearchTerm(e.target.value)
                            setShowClientResults(true)
                          }}
                          onFocus={() => setShowClientResults(true)}
                          style={{ borderRadius: "16px 0 0 16px", height: "45px", paddingLeft: "15px", color: "#000000" }}
                          autoComplete="off"
                          required
                          disabled={isReadOnly}
                        />
                        <button 
                          className="btn btn-light border-0 dropdown-toggle" 
                          type="button"
                          onClick={() => setShowClientResults(!showClientResults)}
                          style={{ borderRadius: "0 16px 16px 0", height: "45px", background: "white" }}
                          disabled={isReadOnly}
                        >
                          <User size={16} className="text-muted" />
                        </button>
                      </div>
                      {showClientResults && !isReadOnly && (
                        <div 
                          className="shadow-sm"
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
                    <label className="form-label">Quotation Number</label>
                    <input 
                      type="text" 
                      className="form-control border-0 shadow-sm"
                      value={quotationNumber}
                      readOnly
                      style={{ borderRadius: "16px", height: "45px", background: "#f8f9fa" }}
                    />
                  </div>
                </div>
              </div>

              {/* Kitchen Cabinets Section */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0 fw-bold" style={{ color: "#495057" }}>
                    <FileText size={16} className="me-2" />
                    Kitchen Cabinets
                  </h6>
                  {!isReadOnly && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => addItem("cabinet")}
                      style={{ borderRadius: "12px", fontSize: "12px" }}
                    >
                      <Plus size={14} className="me-1" />
                      Add Item
                    </button>
                  )}
                </div>
                <div className="table-responsive" style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid #e9ecef" }}>
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
                      {items.filter(item => item.category === "cabinet").map((item, index) => {
                        const actualIndex = items.findIndex(i => i === item)
                        return (
                          <tr key={actualIndex} style={{ borderBottom: "1px solid #f1f3f4" }}>
                            <td style={{ padding: "12px" }}>
                              <input
                                type="text"
                                className="form-control border-0"
                                value={item.description}
                                onChange={(e) => updateItemTotal(actualIndex, "description", e.target.value)}
                                readOnly={isReadOnly}
                                style={{ background: "transparent", fontSize: "13px" }}
                                placeholder="Enter description"
                              />
                            </td>
                            <td style={{ padding: "12px" }}>
                              <input
                                type="text"
                                className="form-control border-0"
                                value={item.unit}
                                onChange={(e) => updateItemTotal(actualIndex, "unit", e.target.value)}
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
                                onChange={(e) => updateItemTotal(actualIndex, "quantity", parseFloat(e.target.value) || 0)}
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
                                onChange={(e) => updateItemTotal(actualIndex, "unit_price", parseFloat(e.target.value) || 0)}
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
                                  onClick={() => removeItem(actualIndex)}
                                  style={{ borderRadius: "8px", padding: "4px 8px" }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            )}
                          </tr>
                        )
                      })}
                      {items.filter(item => item.category === "cabinet").length === 0 && (
                        <tr>
                          <td colSpan={isReadOnly ? 5 : 6} className="text-center text-muted py-4">
                            No cabinet items added
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot style={{ background: "#f8f9fa" }}>
                      <tr>
                        <td colSpan={isReadOnly ? 4 : 5} style={{ padding: "12px", fontWeight: "600" }}>
                          Cabinet Subtotal
                        </td>
                        <td style={{ padding: "12px", fontWeight: "700", color: "#495057" }}>
                          KES {totals.cabinetTotal.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Worktop Section */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0 fw-bold" style={{ color: "#495057" }}>
                    <FileText size={16} className="me-2" />
                    Worktop
                  </h6>
                  {!isReadOnly && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => addItem("worktop")}
                      style={{ borderRadius: "12px", fontSize: "12px" }}
                    >
                      <Plus size={14} className="me-1" />
                      Add Item
                    </button>
                  )}
                </div>
                <div className="table-responsive" style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid #e9ecef" }}>
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
                      {items.filter(item => item.category === "worktop").map((item, index) => {
                        const actualIndex = items.findIndex(i => i === item)
                        return (
                          <tr key={actualIndex} style={{ borderBottom: "1px solid #f1f3f4" }}>
                            <td style={{ padding: "12px" }}>
                              <input
                                type="text"
                                className="form-control border-0"
                                value={item.description}
                                onChange={(e) => updateItemTotal(actualIndex, "description", e.target.value)}
                                readOnly={isReadOnly}
                                style={{ background: "transparent", fontSize: "13px" }}
                                placeholder="Enter description"
                              />
                            </td>
                            <td style={{ padding: "12px" }}>
                              <input
                                type="text"
                                className="form-control border-0"
                                value={item.unit}
                                onChange={(e) => updateItemTotal(actualIndex, "unit", e.target.value)}
                                readOnly={isReadOnly}
                                style={{ background: "transparent", fontSize: "13px" }}
                                placeholder="e.g., m²"
                              />
                            </td>
                            <td style={{ padding: "12px" }}>
                              <input
                                type="number"
                                className="form-control border-0"
                                value={item.quantity}
                                onChange={(e) => updateItemTotal(actualIndex, "quantity", parseFloat(e.target.value) || 0)}
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
                                onChange={(e) => updateItemTotal(actualIndex, "unit_price", parseFloat(e.target.value) || 0)}
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
                                  onClick={() => removeItem(actualIndex)}
                                  style={{ borderRadius: "8px", padding: "4px 8px" }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            )}
                          </tr>
                        )
                      })}
                      {items.filter(item => item.category === "worktop").length === 0 && (
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
              </div>

              {/* Accessories Section */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0 fw-bold" style={{ color: "#495057" }}>
                    <FileText size={16} className="me-2" />
                    Accessories
                  </h6>
                  <div className="d-flex align-items-center gap-3">
                    {!isReadOnly && (
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={includeAccessories}
                          onChange={(e) => setIncludeAccessories(e.target.checked)}
                          style={{ borderRadius: "4px" }}
                        />
                        <label className="form-check-label small">Include in totals</label>
                      </div>
                    )}
                    {!isReadOnly && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => addItem("accessories")}
                        style={{ borderRadius: "12px", fontSize: "12px" }}
                      >
                        <Plus size={14} className="me-1" />
                        Add Item
                      </button>
                    )}
                  </div>
                </div>
                <div className="table-responsive" style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid #e9ecef" }}>
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
                      {items.filter(item => item.category === "accessories").map((item, index) => {
                        const actualIndex = items.findIndex(i => i === item)
                        return (
                          <tr key={actualIndex} style={{ borderBottom: "1px solid #f1f3f4" }}>
                            <td style={{ padding: "12px" }}>
                              <input
                                type="text"
                                className="form-control border-0"
                                value={item.description}
                                onChange={(e) => updateItemTotal(actualIndex, "description", e.target.value)}
                                readOnly={isReadOnly}
                                style={{ background: "transparent", fontSize: "13px" }}
                                placeholder="Enter description"
                              />
                            </td>
                            <td style={{ padding: "12px" }}>
                              <input
                                type="text"
                                className="form-control border-0"
                                value={item.unit}
                                onChange={(e) => updateItemTotal(actualIndex, "unit", e.target.value)}
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
                                onChange={(e) => updateItemTotal(actualIndex, "quantity", parseFloat(e.target.value) || 0)}
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
                                onChange={(e) => updateItemTotal(actualIndex, "unit_price", parseFloat(e.target.value) || 0)}
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
                                  onClick={() => removeItem(actualIndex)}
                                  style={{ borderRadius: "8px", padding: "4px 8px" }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            )}
                          </tr>
                        )
                      })}
                      {items.filter(item => item.category === "accessories").length === 0 && (
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
              </div>

              {/* Labour Section */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0 fw-bold" style={{ color: "#495057" }}>
                    <Calculator size={16} className="me-2" />
                    Labour
                  </h6>
                </div>
                <div className="table-responsive" style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid #e9ecef" }}>
                  <table className="table table-sm mb-0">
                    <tbody>
                      <tr style={{ borderBottom: "1px solid #f1f3f4" }}>
                        <td style={{ padding: "12px", fontWeight: "600" }}>Labour Percentage</td>
                        <td style={{ padding: "12px" }}>
                          <div className="input-group">
                            <input
                              type="number"
                              className="form-control border-0"
                              value={labourPercentage}
                              onChange={(e) => setLabourPercentage(parseFloat(e.target.value) || 0)}
                              readOnly={isReadOnly}
                              style={{ background: "transparent", fontSize: "13px" }}
                              min="0"
                              max="100"
                            />
                            <span className="input-group-text border-0" style={{ background: "transparent", fontSize: "13px" }}>%</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px" }}></td>
                        <td style={{ padding: "12px" }}></td>
                        <td style={{ padding: "12px", fontWeight: "700", color: "#495057" }}>
                          KES {totals.labourTotal.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Grand Total Section */}
              <div className="mb-4">
                <div className="row">
                  <div className="col-md-6 offset-md-6">
                    <div className="card" style={{ borderRadius: "16px", border: "1px solid #e9ecef", background: "#f8f9fa" }}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between mb-2">
                          <strong style={{ fontSize: "14px" }}>Cabinets Total:</strong>
                          <span style={{ fontSize: "14px" }}>KES {totals.cabinetTotal.toFixed(2)}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <strong style={{ fontSize: "14px" }}>Worktop Total:</strong>
                          <span style={{ fontSize: "14px" }}>KES {totals.worktopTotal.toFixed(2)}</span>
                        </div>
                        {includeAccessories && (
                          <div className="d-flex justify-content-between mb-2">
                            <strong style={{ fontSize: "14px" }}>Accessories Total:</strong>
                            <span style={{ fontSize: "14px" }}>KES {totals.accessoriesTotal.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="d-flex justify-content-between mb-2">
                          <strong style={{ fontSize: "14px" }}>Labour:</strong>
                          <span style={{ fontSize: "14px" }}>KES {totals.labourTotal.toFixed(2)}</span>
                        </div>
                        <hr style={{ margin: "12px 0" }} />
                        <div className="d-flex justify-content-between fw-bold">
                          <strong style={{ fontSize: "16px" }}>GRAND TOTAL:</strong>
                          <span style={{ fontSize: "16px", color: "#495057" }}>KES {totals.grandTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="mb-4">
                <label className="form-label fw-bold" style={{ color: "#495057" }}>Terms and Conditions</label>
                <textarea
                  className="form-control border-0 shadow-sm"
                  rows={4}
                  value={termsConditions}
                  onChange={(e) => setTermsConditions(e.target.value)}
                  readOnly={isReadOnly}
                  style={{ borderRadius: "16px", fontSize: "13px" }}
                  placeholder="Enter terms and conditions..."
                />
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="form-label fw-bold" style={{ color: "#495057" }}>Notes</label>
                <textarea
                  className="form-control border-0 shadow-sm"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  readOnly={isReadOnly}
                  style={{ borderRadius: "16px", fontSize: "13px" }}
                  placeholder="Additional notes..."
                />
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
            {!isReadOnly && (
              <button 
                type="button" 
                className="btn btn-add"
                onClick={handleSave}
                disabled={loading}
                style={{ borderRadius: "12px", height: "45px" }}
              >
                {loading ? "Saving..." : "Save Quotation"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuotationModal 