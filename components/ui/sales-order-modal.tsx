"use client"

import React, { useState, useEffect } from "react"
import { X, Plus, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"

interface SalesOrderItem {
  id?: number
  category: "cabinet" | "worktop" | "accessories"
  description: string
  unit: string
  quantity: number
  unit_price: number
  total_price: number
  stock_item_id?: number
}

interface SalesOrder {
  id?: number
  order_number: string
  client_id: number
  quotation_id?: number
  original_quotation_number?: string
  date_created: string
  cabinet_total: number
  worktop_total: number
  accessories_total: number
  labour_percentage: number
  labour_total: number
  total_amount: number
  grand_total: number
  include_accessories: boolean
  status: string
  notes?: string
  terms_conditions?: string
  client?: {
    id: number
    name: string
    phone?: string
    location?: string
  }
  items?: SalesOrderItem[]
}

interface SalesOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (salesOrder: SalesOrder) => void
  salesOrder?: SalesOrder
  mode: "view" | "edit" | "create"
}

const SalesOrderModal: React.FC<SalesOrderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  salesOrder,
  mode = "create"
}) => {
  const [formData, setFormData] = useState<SalesOrder>({
    order_number: "",
    client_id: 0,
    date_created: new Date().toISOString().split('T')[0],
    cabinet_total: 0,
    worktop_total: 0,
    accessories_total: 0,
    labour_percentage: 0,
    labour_total: 0,
    total_amount: 0,
    grand_total: 0,
    include_accessories: false,
    status: "pending",
    notes: "",
    terms_conditions: "1. All work to be completed within agreed timeframe.\n2. Client to provide necessary measurements and specifications.\n3. Final payment due upon completion.\n4. Any changes to the original design may incur additional charges.",
    items: []
  })

  const [clients, setClients] = useState<{ id: number; name: string; phone?: string; location?: string }[]>([])
  const [clientSearch, setClientSearch] = useState("")
  const [clientSearchResults, setClientSearchResults] = useState<{ id: number; name: string; phone?: string; location?: string }[]>([])
  const [showClientSearch, setShowClientSearch] = useState(false)
  const [cabinetItems, setCabinetItems] = useState<SalesOrderItem[]>([])
  const [worktopItems, setWorktopItems] = useState<SalesOrderItem[]>([])
  const [accessoriesItems, setAccessoriesItems] = useState<SalesOrderItem[]>([])

  useEffect(() => {
    if (isOpen) {
      fetchClients()
      generateOrderNumber()
      
      if (salesOrder) {
        setFormData(salesOrder)
        setClientSearch(salesOrder.client?.name || "")
        
        // Separate items by category
        const cabinet = salesOrder.items?.filter(item => item.category === "cabinet") || []
        const worktop = salesOrder.items?.filter(item => item.category === "worktop") || []
        const accessories = salesOrder.items?.filter(item => item.category === "accessories") || []
        
        setCabinetItems(cabinet)
        setWorktopItems(worktop)
        setAccessoriesItems(accessories)
      }
    }
  }, [isOpen, salesOrder])

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

  const generateOrderNumber = async () => {
    try {
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const prefix = `SO${year}${month}`;
      const { data, error } = await supabase
        .from('sales_orders')
        .select('order_number')
        .like('order_number', `${prefix}%`)
        .order('order_number', { ascending: false })
        .limit(1);
      if (error) throw error;
      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastNumber = data[0].order_number;
        const sequentialPart = lastNumber.slice(-3);
        nextNumber = parseInt(sequentialPart) + 1;
      }
      setFormData(prev => ({
        ...prev,
        order_number: `${prefix}${nextNumber.toString().padStart(3, '0')}`
      }));
    } catch (error) {
      console.error('Error generating order number:', error);
    }
  }

  const handleClientSearch = (value: string) => {
    setClientSearch(value)
    if (value.length >= 2) {
      const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(value.toLowerCase())
      )
      setClientSearchResults(filtered)
      setShowClientSearch(true)
    } else {
      setShowClientSearch(false)
    }
  }

  const selectClient = (client: { id: number; name: string; phone?: string; location?: string }) => {
    setFormData(prev => ({
      ...prev,
      client_id: client.id,
      client: client
    }))
    setClientSearch(client.name)
    setShowClientSearch(false)
  }

  const addItem = (category: "cabinet" | "worktop" | "accessories") => {
    const newItem: SalesOrderItem = {
      category,
      description: "",
      unit: "",
      quantity: 1,
      unit_price: 0,
      total_price: 0
    }

    if (category === "cabinet") {
      setCabinetItems(prev => [...prev, newItem])
    } else if (category === "worktop") {
      setWorktopItems(prev => [...prev, newItem])
    } else {
      setAccessoriesItems(prev => [...prev, newItem])
    }
  }

  const removeItem = (category: "cabinet" | "worktop" | "accessories", index: number) => {
    if (category === "cabinet") {
      setCabinetItems(prev => prev.filter((_, i) => i !== index))
    } else if (category === "worktop") {
      setWorktopItems(prev => prev.filter((_, i) => i !== index))
    } else {
      setAccessoriesItems(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateItem = (category: "cabinet" | "worktop" | "accessories", index: number, field: keyof SalesOrderItem, value: any) => {
    const updateItems = (items: SalesOrderItem[]) => {
      const updated = [...items]
      updated[index] = { ...updated[index], [field]: value }
      
      // Recalculate total price
      if (field === "quantity" || field === "unit_price") {
        updated[index].total_price = updated[index].quantity * updated[index].unit_price
      }
      
      return updated
    }

    if (category === "cabinet") {
      setCabinetItems(updateItems)
    } else if (category === "worktop") {
      setWorktopItems(updateItems)
    } else {
      setAccessoriesItems(updateItems)
    }
  }

  const calculateTotals = () => {
    const cabinetTotal = cabinetItems.reduce((sum, item) => sum + item.total_price, 0)
    const worktopTotal = worktopItems.reduce((sum, item) => sum + item.total_price, 0)
    const accessoriesTotal = accessoriesItems.reduce((sum, item) => sum + item.total_price, 0)
    
    const subtotal = cabinetTotal + worktopTotal + (formData.include_accessories ? accessoriesTotal : 0)
    const labourTotal = (subtotal * formData.labour_percentage) / 100
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
    try {
      if (!formData.client_id) {
        toast.error("Please select a client")
        return
      }

      const totals = calculateTotals()
      const allItems = [
        ...cabinetItems,
        ...worktopItems,
        ...(formData.include_accessories ? accessoriesItems : [])
      ]

      const salesOrderData = {
        ...formData,
        ...totals,
        total_amount: totals.grandTotal,
        items: allItems
      }

      onSave(salesOrderData)
      onClose()
    } catch (error) {
      console.error("Error saving sales order:", error)
      toast.error("Failed to save sales order")
    }
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
              {mode === "view" ? "View" : mode === "edit" ? "Edit" : "New"} Sales Order
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <form className="a4-document">
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
                  <h3>SALES ORDER</h3>
                  <div className="info-row">
                    <span className="info-label">Sales Order #</span>
                    <input
                      type="text"
                      className="info-value"
                      value={formData.order_number}
                      readOnly
                    />
                  </div>
                  <div className="info-row">
                    <span className="info-label">Date</span>
                    <input
                      type="date"
                      className="info-value"
                      value={formData.date_created}
                      onChange={(e) => setFormData(prev => ({ ...prev, date_created: e.target.value }))}
                      readOnly={isReadOnly}
                    />
                  </div>
                  {formData.original_quotation_number && (
                    <div className="info-row">
                      <span className="info-label">Original Quotation #</span>
                      <input
                        type="text"
                        className="info-value"
                        value={formData.original_quotation_number}
                        readOnly
                      />
                    </div>
                  )}
                </div>

                <div className="document-info-group">
                  <div className="info-row">
                    <span className="info-label">Client</span>
                    <div className="client-search-wrapper">
                      <input
                        type="text"
                        className="info-value"
                        value={clientSearch}
                        onChange={(e) => handleClientSearch(e.target.value)}
                        placeholder="Search client..."
                        readOnly={isReadOnly}
                      />
                      {showClientSearch && !isReadOnly && (
                        <div className="client-search-results">
                          {clientSearchResults.map((client) => (
                            <div
                              key={client.id}
                              className="dropdown-item"
                              onClick={() => selectClient(client)}
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
                      value={formData.client?.phone || ""}
                      readOnly
                    />
                  </div>
                  <div className="info-row">
                    <span className="info-label">Location</span>
                    <input
                      type="text"
                      className="info-value"
                      value={formData.client?.location || ""}
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
                  {cabinetItems.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          type="text"
                          className="form-control border-0"
                          value={item.description}
                          onChange={(e) => updateItem("cabinet", index, "description", e.target.value)}
                          readOnly={isReadOnly}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control border-0"
                          value={item.unit}
                          onChange={(e) => updateItem("cabinet", index, "unit", e.target.value)}
                          readOnly={isReadOnly}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control border-0"
                          value={item.quantity}
                          onChange={(e) => updateItem("cabinet", index, "quantity", parseFloat(e.target.value) || 0)}
                          readOnly={isReadOnly}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control border-0"
                          value={item.unit_price}
                          onChange={(e) => updateItem("cabinet", index, "unit_price", parseFloat(e.target.value) || 0)}
                          readOnly={isReadOnly}
                        />
                      </td>
                      <td>{item.total_price.toFixed(2)}</td>
                      {!isReadOnly && (
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => removeItem("cabinet", index)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
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
                          Add Item
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
                  {worktopItems.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          type="text"
                          className="form-control border-0"
                          value={item.description}
                          onChange={(e) => updateItem("worktop", index, "description", e.target.value)}
                          readOnly={isReadOnly}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control border-0"
                          value={item.unit}
                          onChange={(e) => updateItem("worktop", index, "unit", e.target.value)}
                          readOnly={isReadOnly}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control border-0"
                          value={item.quantity}
                          onChange={(e) => updateItem("worktop", index, "quantity", parseFloat(e.target.value) || 0)}
                          readOnly={isReadOnly}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control border-0"
                          value={item.unit_price}
                          onChange={(e) => updateItem("worktop", index, "unit_price", parseFloat(e.target.value) || 0)}
                          readOnly={isReadOnly}
                        />
                      </td>
                      <td>{item.total_price.toFixed(2)}</td>
                      {!isReadOnly && (
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => removeItem("worktop", index)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
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
                          Add Item
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
                      checked={formData.include_accessories}
                      onChange={(e) => setFormData(prev => ({ ...prev, include_accessories: e.target.checked }))}
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
                  {accessoriesItems.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          type="text"
                          className="form-control border-0"
                          value={item.description}
                          onChange={(e) => updateItem("accessories", index, "description", e.target.value)}
                          readOnly={isReadOnly}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control border-0"
                          value={item.unit}
                          onChange={(e) => updateItem("accessories", index, "unit", e.target.value)}
                          readOnly={isReadOnly}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control border-0"
                          value={item.quantity}
                          onChange={(e) => updateItem("accessories", index, "quantity", parseFloat(e.target.value) || 0)}
                          readOnly={isReadOnly}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control border-0"
                          value={item.unit_price}
                          onChange={(e) => updateItem("accessories", index, "unit_price", parseFloat(e.target.value) || 0)}
                          readOnly={isReadOnly}
                        />
                      </td>
                      <td>{item.total_price.toFixed(2)}</td>
                      {!isReadOnly && (
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => removeItem("accessories", index)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
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
                          Add Item
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
                        value={formData.labour_percentage}
                        onChange={(e) => setFormData(prev => ({ ...prev, labour_percentage: parseFloat(e.target.value) || 0 }))}
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
                value={formData.terms_conditions}
                onChange={(e) => setFormData(prev => ({ ...prev, terms_conditions: e.target.value }))}
                readOnly={isReadOnly}
              />

              {/* Notes */}
              <div className="section-title">Notes</div>
              <textarea
                className="form-control"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
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
                Save Sales Order
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SalesOrderModal 