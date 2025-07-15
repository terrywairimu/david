"use client"

import React, { useState, useEffect } from "react"
import { X, Plus, Trash2 } from "lucide-react"
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
  const [labourPercentage, setLabourPercentage] = useState(0)
  const [includeAccessories, setIncludeAccessories] = useState(false)
  const [notes, setNotes] = useState("")
  const [termsConditions, setTermsConditions] = useState(
    "1. All work to be completed within agreed timeframe.\n2. Client to provide necessary measurements and specifications.\n3. Final payment due upon completion.\n4. Any changes to the original design may incur additional charges."
  )

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
      setLabourPercentage(quotation.labour_percentage || 0)
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

  const handleSave = () => {
    if (!selectedClient) {
      toast.error("Please select a client")
      return
    }

    if (items.length === 0) {
      toast.error("Please add at least one item")
      return
    }

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
  }

  if (!isOpen) return null

  const totals = calculateTotals()
  const isReadOnly = mode === "view"

  return (
    <div className="modal fade show" style={{ display: "block" }} tabIndex={-1}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {mode === "view" ? "View" : mode === "edit" ? "Edit" : "New"} Quotation
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <form className="a4-document" id={`quotation-${quotation?.id || 'new'}`}>
              {/* Company Header */}
              <div className="document-header">
                <div className="company-name">Cabinet Master Styles And Finishes</div>
                <div className="company-details">
                  <div>cabinetmasterstyles@gmail.com</div>
                  <div>Kamakis-Ruiru, Kenya</div>
                  <div>Phone No: 0729554475</div>
                </div>
              </div>

              {/* Document Info */}
              <div className="document-info">
                <div className="document-info-group">
                  <h3>QUOTATION</h3>
                  <div className="info-row">
                    <span className="info-label">Quotation #</span>
                    <input
                      type="text"
                      className="info-value"
                      value={quotationNumber}
                      readOnly
                    />
                  </div>
                  <div className="info-row">
                    <span className="info-label">Date</span>
                    <input
                      type="text"
                      className="info-value"
                      value={new Date().toLocaleDateString()}
                      readOnly
                    />
                  </div>
                  <div className="info-row">
                    <span className="info-label">Valid Until</span>
                    <input
                      type="text"
                      className="info-value"
                      value={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      readOnly
                    />
                  </div>
                </div>

                <div className="document-info-group">
                  <div className="info-row">
                    <span className="info-label">Client</span>
                    <div className="client-search-wrapper">
                      <input
                        type="text"
                        className="info-value"
                        value={clientSearchTerm}
                        onChange={(e) => {
                          setClientSearchTerm(e.target.value)
                          setShowClientResults(true)
                        }}
                        placeholder="Search client..."
                        readOnly={isReadOnly}
                      />
                      {showClientResults && !isReadOnly && (
                        <div className="client-search-results">
                          {filteredClients.map((client) => (
                            <div
                              key={client.id}
                              className="dropdown-item"
                              onClick={() => handleClientSelect(client)}
                            >
                              {client.name}
                              {client.phone && <small className="text-muted d-block">{client.phone}</small>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Phone No</span>
                    <input
                      type="text"
                      className="info-value"
                      value={selectedClient?.phone || ""}
                      readOnly
                    />
                  </div>
                  <div className="info-row">
                    <span className="info-label">Location</span>
                    <input
                      type="text"
                      className="info-value"
                      value={selectedClient?.location || ""}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Kitchen Cabinets Section */}
              <div className="section-title">Kitchen Cabinets</div>
              <table className="quotation-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Units</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                    {!isReadOnly && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {items.filter(item => item.category === "cabinet").map((item, index) => {
                    const actualIndex = items.findIndex(i => i === item)
                    return (
                      <tr key={actualIndex}>
                        <td>
                          <input
                            type="text"
                            className="form-control border-0"
                            value={item.description}
                            onChange={(e) => updateItemTotal(actualIndex, "description", e.target.value)}
                            readOnly={isReadOnly}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control border-0"
                            value={item.unit}
                            onChange={(e) => updateItemTotal(actualIndex, "unit", e.target.value)}
                            readOnly={isReadOnly}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control border-0"
                            value={item.quantity}
                            onChange={(e) => updateItemTotal(actualIndex, "quantity", parseFloat(e.target.value) || 0)}
                            readOnly={isReadOnly}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control border-0"
                            value={item.unit_price}
                            onChange={(e) => updateItemTotal(actualIndex, "unit_price", parseFloat(e.target.value) || 0)}
                            readOnly={isReadOnly}
                          />
                        </td>
                        <td>KES {item.total_price.toFixed(2)}</td>
                        {!isReadOnly && (
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => removeItem(actualIndex)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={isReadOnly ? 4 : 5}>
                      {!isReadOnly && (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => addItem("cabinet")}
                        >
                          <Plus size={14} className="me-1" />
                          Add Cabinet Item
                        </button>
                      )}
                    </td>
                    <td><strong>KES {totals.cabinetTotal.toFixed(2)}</strong></td>
                  </tr>
                </tfoot>
              </table>

              {/* Worktop Section */}
              <div className="section-title">Worktop</div>
              <table className="quotation-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Units</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                    {!isReadOnly && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {items.filter(item => item.category === "worktop").map((item, index) => {
                    const actualIndex = items.findIndex(i => i === item)
                    return (
                      <tr key={actualIndex}>
                        <td>
                          <input
                            type="text"
                            className="form-control border-0"
                            value={item.description}
                            onChange={(e) => updateItemTotal(actualIndex, "description", e.target.value)}
                            readOnly={isReadOnly}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control border-0"
                            value={item.unit}
                            onChange={(e) => updateItemTotal(actualIndex, "unit", e.target.value)}
                            readOnly={isReadOnly}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control border-0"
                            value={item.quantity}
                            onChange={(e) => updateItemTotal(actualIndex, "quantity", parseFloat(e.target.value) || 0)}
                            readOnly={isReadOnly}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control border-0"
                            value={item.unit_price}
                            onChange={(e) => updateItemTotal(actualIndex, "unit_price", parseFloat(e.target.value) || 0)}
                            readOnly={isReadOnly}
                          />
                        </td>
                        <td>KES {item.total_price.toFixed(2)}</td>
                        {!isReadOnly && (
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => removeItem(actualIndex)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={isReadOnly ? 4 : 5}>
                      {!isReadOnly && (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => addItem("worktop")}
                        >
                          <Plus size={14} className="me-1" />
                          Add Worktop Item
                        </button>
                      )}
                    </td>
                    <td><strong>KES {totals.worktopTotal.toFixed(2)}</strong></td>
                  </tr>
                </tfoot>
              </table>

              {/* Accessories Section */}
              <div className="section-title d-flex align-items-center">
                Accessories
                {!isReadOnly && (
                  <div className="form-check ms-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={includeAccessories}
                      onChange={(e) => setIncludeAccessories(e.target.checked)}
                    />
                    <label className="form-check-label">Include in totals</label>
                  </div>
                )}
              </div>
              <table className="quotation-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Units</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                    {!isReadOnly && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {items.filter(item => item.category === "accessories").map((item, index) => {
                    const actualIndex = items.findIndex(i => i === item)
                    return (
                      <tr key={actualIndex}>
                        <td>
                          <input
                            type="text"
                            className="form-control border-0"
                            value={item.description}
                            onChange={(e) => updateItemTotal(actualIndex, "description", e.target.value)}
                            readOnly={isReadOnly}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control border-0"
                            value={item.unit}
                            onChange={(e) => updateItemTotal(actualIndex, "unit", e.target.value)}
                            readOnly={isReadOnly}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control border-0"
                            value={item.quantity}
                            onChange={(e) => updateItemTotal(actualIndex, "quantity", parseFloat(e.target.value) || 0)}
                            readOnly={isReadOnly}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control border-0"
                            value={item.unit_price}
                            onChange={(e) => updateItemTotal(actualIndex, "unit_price", parseFloat(e.target.value) || 0)}
                            readOnly={isReadOnly}
                          />
                        </td>
                        <td>KES {item.total_price.toFixed(2)}</td>
                        {!isReadOnly && (
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => removeItem(actualIndex)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={isReadOnly ? 4 : 5}>
                      {!isReadOnly && (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => addItem("accessories")}
                        >
                          <Plus size={14} className="me-1" />
                          Add Accessory Item
                        </button>
                      )}
                    </td>
                    <td><strong>KES {totals.accessoriesTotal.toFixed(2)}</strong></td>
                  </tr>
                </tfoot>
              </table>

              {/* Labour Section */}
              <div className="section-title">Labour</div>
              <table className="quotation-table">
                <tbody>
                  <tr>
                    <td><strong>LABOUR</strong></td>
                    <td>%</td>
                    <td>
                      <input
                        type="number"
                        className="form-control border-0"
                        value={labourPercentage}
                        onChange={(e) => setLabourPercentage(parseFloat(e.target.value) || 0)}
                        readOnly={isReadOnly}
                      />
                    </td>
                    <td></td>
                    <td><strong>KES {totals.labourTotal.toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>

              {/* Grand Total */}
              <div className="section-title">Summary</div>
              <table className="quotation-table">
                <tbody>
                  <tr>
                    <td colSpan={4}><strong>GRAND TOTAL</strong></td>
                    <td><strong>KES {totals.grandTotal.toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>

              {/* Terms and Conditions */}
              <div className="section-title">Terms and Conditions</div>
              <textarea
                className="form-control"
                rows={4}
                value={termsConditions}
                onChange={(e) => setTermsConditions(e.target.value)}
                readOnly={isReadOnly}
              />

              {/* Notes */}
              <div className="section-title">Notes</div>
              <textarea
                className="form-control"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                readOnly={isReadOnly}
                placeholder="Additional notes..."
              />
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            {!isReadOnly && (
              <button type="button" className="btn btn-add" onClick={handleSave}>
                Save Quotation
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuotationModal 