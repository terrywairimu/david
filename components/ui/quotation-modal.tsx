"use client"

import React, { useState, useEffect } from "react"
import { X, Plus, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"

interface QuotationItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

interface Client {
  id: number
  name: string
  phone?: string
  location?: string
  pin_number?: string
}

interface QuotationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (quotation: any) => void
}

const QuotationModal: React.FC<QuotationModalProps> = ({ isOpen, onClose, onSave }) => {
  const [clients, setClients] = useState<Client[]>([])
  const [clientSearchTerm, setClientSearchTerm] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showClientResults, setShowClientResults] = useState(false)
  const [quotationNumber, setQuotationNumber] = useState("")
  const [dateCreated, setDateCreated] = useState("")
  const [validUntil, setValidUntil] = useState("")
  const [items, setItems] = useState<QuotationItem[]>([
    { id: "1", description: "", quantity: 1, unit_price: 0, total: 0 }
  ])
  const [labourPercentage, setLabourPercentage] = useState(0)
  const [termsConditions, setTermsConditions] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchClients()
      generateQuotationNumber()
      setDateCreated(new Date().toISOString().split('T')[0])
      // Set valid until to 30 days from now
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      setValidUntil(futureDate.toISOString().split('T')[0])
    }
  }, [isOpen])

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("registered_entities")
        .select("*")
        .eq("type", "client")
        .eq("status", "active")
        .order("name")

      if (error) {
        console.error("Error fetching clients:", error)
      } else {
        setClients(data || [])
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
    }
  }

  const generateQuotationNumber = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const time = String(now.getTime()).slice(-4)
    setQuotationNumber(`QUO-${year}${month}${day}-${time}`)
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

  const updateItemTotal = (index: number, field: keyof QuotationItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      [field]: value
    }
    
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price
    }
    
    setItems(newItems)
  }

  const addItem = () => {
    const newItem: QuotationItem = {
      id: String(items.length + 1),
      description: "",
      quantity: 1,
      unit_price: 0,
      total: 0
    }
    setItems([...items, newItem])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index)
      setItems(newItems)
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const labourTotal = subtotal * (labourPercentage / 100)
  const grandTotal = subtotal + labourTotal

  const handleSave = async () => {
    if (!selectedClient) {
      toast.error("Please select a client")
      return
    }

    if (items.filter(item => item.description.trim()).length === 0) {
      toast.error("Please add at least one item")
      return
    }

    setLoading(true)
    try {
      const quotationData = {
        quotation_number: quotationNumber,
        client_id: selectedClient.id,
        date_created: dateCreated,
        valid_until: validUntil,
        subtotal: subtotal,
        labour_percentage: labourPercentage,
        labour_total: labourTotal,
        total_amount: grandTotal,
        grand_total: grandTotal,
        terms_conditions: termsConditions,
        status: "draft"
      }

      const { data: quotation, error: quotationError } = await supabase
        .from("quotations")
        .insert([quotationData])
        .select()
        .single()

      if (quotationError) {
        console.error("Error saving quotation:", quotationError)
        toast.error("Failed to save quotation")
        return
      }

      // Save quotation items
      const quotationItems = items
        .filter(item => item.description.trim())
        .map(item => ({
          quotation_id: quotation.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total
        }))

      const { error: itemsError } = await supabase
        .from("quotation_items")
        .insert(quotationItems)

      if (itemsError) {
        console.error("Error saving quotation items:", itemsError)
        toast.error("Failed to save quotation items")
        return
      }

      toast.success("Quotation saved successfully")
      onSave(quotation)
      onClose()
      resetForm()
    } catch (error) {
      console.error("Error saving quotation:", error)
      toast.error("Failed to save quotation")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedClient(null)
    setClientSearchTerm("")
    setShowClientResults(false)
    setItems([{ id: "1", description: "", quantity: 1, unit_price: 0, total: 0 }])
    setLabourPercentage(0)
    setTermsConditions("")
  }

  if (!isOpen) return null

  return (
    <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg a4-modal">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">New Quotation</h5>
            <button type="button" className="btn-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div className="modal-body">
            <form className="a4-document" onSubmit={(e) => e.preventDefault()}>
              {/* Document Header */}
              <div className="document-header">
                <h1 className="company-name">Your Company Name</h1>
                <div className="company-details">
                  <p>123 Business Street, City, State 12345</p>
                  <p>Phone: (555) 123-4567 | Email: info@yourcompany.com</p>
                </div>
              </div>

              {/* Document Info */}
              <div className="document-info">
                <div className="document-info-group">
                  <h3>Quotation Details</h3>
                  <div className="info-row">
                    <span className="info-label">Quotation #:</span>
                    <input
                      type="text"
                      className="info-value"
                      value={quotationNumber}
                      onChange={(e) => setQuotationNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div className="info-row">
                    <span className="info-label">Date:</span>
                    <input
                      type="date"
                      className="info-value"
                      value={dateCreated}
                      onChange={(e) => setDateCreated(e.target.value)}
                      required
                    />
                  </div>
                  <div className="info-row">
                    <span className="info-label">Valid Until:</span>
                    <input
                      type="date"
                      className="info-value"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="document-info-group">
                  <h3>Client Information</h3>
                  <div className="info-row">
                    <span className="info-label">Client:</span>
                    <div className="client-search-wrapper" style={{ flex: 1 }}>
                      <input
                        type="text"
                        className="info-value"
                        value={clientSearchTerm}
                        onChange={(e) => {
                          setClientSearchTerm(e.target.value)
                          setShowClientResults(e.target.value.length > 0)
                        }}
                        placeholder="Search client..."
                        onFocus={() => setShowClientResults(clientSearchTerm.length > 0)}
                        required
                      />
                      {showClientResults && filteredClients.length > 0 && (
                        <div className="client-search-results" style={{ display: "block" }}>
                          {filteredClients.map((client) => (
                            <div
                              key={client.id}
                              className="dropdown-item"
                              onClick={() => handleClientSelect(client)}
                            >
                              <div className="text-dark">{client.name}</div>
                              <small className="text-muted">
                                {client.phone} • {client.location}
                              </small>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedClient && (
                    <>
                      <div className="info-row">
                        <span className="info-label">Phone:</span>
                        <span className="info-value">{selectedClient.phone}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Location:</span>
                        <span className="info-value">{selectedClient.location}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="section-title">Quotation Items</div>
              <table className="quotation-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItemTotal(index, 'description', e.target.value)}
                          placeholder="Item description"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItemTotal(index, 'quantity', parseFloat(e.target.value) || 0)}
                          min="1"
                          step="1"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateItemTotal(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.total.toFixed(2)}
                          readOnly
                          className="text-end"
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5}>
                      <button
                        type="button"
                        className="btn btn-add"
                        onClick={addItem}
                      >
                        <Plus size={16} className="me-2" />
                        Add Item
                      </button>
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Totals Section */}
              <div className="totals-section">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>KES {subtotal.toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span>Labour ({labourPercentage}%):</span>
                  <span>KES {labourTotal.toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span>Labour %:</span>
                  <input
                    type="number"
                    className="labour-percentage"
                    value={labourPercentage}
                    onChange={(e) => setLabourPercentage(parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div className="total-row grand-total">
                  <span>Grand Total:</span>
                  <span>KES {grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="terms-section">
                <h5>Terms and Conditions</h5>
                <textarea
                  value={termsConditions}
                  onChange={(e) => setTermsConditions(e.target.value)}
                  placeholder="Enter terms and conditions..."
                  rows={4}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                />
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button 
              type="button" 
              className="btn btn-add" 
              onClick={handleSave}
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

export default QuotationModal 