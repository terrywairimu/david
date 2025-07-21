"use client"

import React, { useState, useEffect } from "react"
import { X, Plus, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import { CashSale, CashSaleItem } from "@/lib/types"

interface CashSaleModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (cashSale: CashSale) => void
  cashSale?: CashSale
  mode: "view" | "edit" | "create"
}

const CashSaleModal: React.FC<CashSaleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  cashSale,
  mode = "create"
}) => {
  const [formData, setFormData] = useState<CashSale>({
    sale_number: "",
    client_id: 0,
    date_created: new Date().toISOString().split('T')[0],
    cabinet_total: 0,
    worktop_total: 0,
    accessories_total: 0,
    labour_percentage: 0,
    labour_total: 0,
    total_amount: 0,
    grand_total: 0,
    amount_paid: 0,
    change_amount: 0,
    balance_amount: 0,
    include_accessories: false,
    payment_method: "cash",
    status: "completed",
    notes: "",
    terms_conditions: "1. All sales are final.\n2. No returns or exchanges on custom items.\n3. Warranty period is 1 year from date of purchase.\n4. Installation services available upon request.",
    items: []
  })

  const [clients, setClients] = useState<{ id: number; name: string; phone?: string; location?: string }[]>([])
  const [clientSearch, setClientSearch] = useState("")
  const [clientSearchResults, setClientSearchResults] = useState<{ id: number; name: string; phone?: string; location?: string }[]>([])
  const [showClientSearch, setShowClientSearch] = useState(false)
  const [cabinetItems, setCabinetItems] = useState<CashSaleItem[]>([])
  const [worktopItems, setWorktopItems] = useState<CashSaleItem[]>([])
  const [accessoriesItems, setAccessoriesItems] = useState<CashSaleItem[]>([])

  useEffect(() => {
    if (isOpen) {
      fetchClients()
      generateSaleNumber()
      
      if (cashSale) {
        setFormData(cashSale)
        setClientSearch(cashSale.client?.name || "")
        
        // Separate items by category
        const cabinet = cashSale.items?.filter(item => item.category === "cabinet") || []
        const worktop = cashSale.items?.filter(item => item.category === "worktop") || []
        const accessories = cashSale.items?.filter(item => item.category === "accessories") || []
        
        setCabinetItems(cabinet)
        setWorktopItems(worktop)
        setAccessoriesItems(accessories)
      }
    }
  }, [isOpen, cashSale])

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

  const generateSaleNumber = async () => {
    try {
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const prefix = `CS${year}${month}`;
      const { data, error } = await supabase
        .from('cash_sales')
        .select('sale_number')
        .like('sale_number', `${prefix}%`)
        .order('sale_number', { ascending: false })
        .limit(1);
      if (error) throw error;
      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastNumber = data[0].sale_number;
        const sequentialPart = lastNumber.slice(-3);
        nextNumber = parseInt(sequentialPart) + 1;
      }
      setFormData(prev => ({
        ...prev,
        sale_number: `${prefix}${nextNumber.toString().padStart(3, '0')}`
      }));
    } catch (error) {
      console.error('Error generating sale number:', error);
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
    const newItem: CashSaleItem = {
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

  const updateItem = (category: "cabinet" | "worktop" | "accessories", index: number, field: keyof CashSaleItem, value: any) => {
    const updateItems = (items: CashSaleItem[]) => {
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
    const changeAmount = Math.max(0, formData.amount_paid - grandTotal)
    const balanceAmount = Math.max(0, grandTotal - formData.amount_paid)

    return {
      cabinetTotal,
      worktopTotal,
      accessoriesTotal,
      labourTotal,
      grandTotal,
      changeAmount,
      balanceAmount
    }
  }

  const handleSave = async () => {
    try {
      if (!formData.client_id) {
        toast.error("Please select a client")
        return
      }

      if (formData.amount_paid <= 0) {
        toast.error("Amount paid must be greater than 0")
        return
      }

      const totals = calculateTotals()
      const allItems = [
        ...cabinetItems,
        ...worktopItems,
        ...(formData.include_accessories ? accessoriesItems : [])
      ]

      const cashSaleData = {
        ...formData,
        ...totals,
        total_amount: totals.grandTotal,
        change_amount: totals.changeAmount,
        balance_amount: totals.balanceAmount,
        items: allItems
      }

      onSave(cashSaleData)
      onClose()
    } catch (error) {
      console.error("Error saving cash sale:", error)
      toast.error("Failed to save cash sale")
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
              {mode === "view" ? "View" : mode === "edit" ? "Edit" : "New"} Cash Sale
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            >
              <i className="fas fa-times"></i>
            </button>
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
                  <h3>CASH SALE RECEIPT</h3>
                  <div className="info-row">
                    <span className="info-label">Receipt #</span>
                    <input
                      type="text"
                      className="info-value"
                      value={formData.sale_number}
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
                      <td>KES {item.total_price.toFixed(2)}</td>
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
                      <td>KES {item.total_price.toFixed(2)}</td>
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
                      <td>KES {item.total_price.toFixed(2)}</td>
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

              {/* Payment Section */}
              <div className="section-title">Payment Details</div>
              <table className="quotation-table">
                <tbody>
                  <tr>
                    <td><strong>Payment Method</strong></td>
                    <td colSpan={3}>
                      <select
                        className="form-select border-0"
                        value={formData.payment_method}
                        onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                        disabled={isReadOnly}
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="mobile">Mobile Money</option>
                      </select>
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <td><strong>Amount Paid</strong></td>
                    <td colSpan={3}>
                      <input
                        type="number"
                        className="form-control border-0"
                        value={formData.amount_paid}
                        onChange={(e) => setFormData(prev => ({ ...prev, amount_paid: parseFloat(e.target.value) || 0 }))}
                        readOnly={isReadOnly}
                      />
                    </td>
                    <td><strong>KES {formData.amount_paid.toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>

              {/* Summary */}
              <div className="section-title">Summary</div>
              <table className="quotation-table">
                <tbody>
                  <tr>
                    <td colSpan={4}><strong>TOTAL AMOUNT</strong></td>
                    <td><strong>KES {totals.grandTotal.toFixed(2)}</strong></td>
                  </tr>
                  <tr>
                    <td colSpan={4}><strong>AMOUNT PAID</strong></td>
                    <td><strong>KES {formData.amount_paid.toFixed(2)}</strong></td>
                  </tr>
                  {totals.changeAmount > 0 && (
                    <tr>
                      <td colSpan={4}><strong>CHANGE</strong></td>
                      <td><strong>KES {totals.changeAmount.toFixed(2)}</strong></td>
                    </tr>
                  )}
                  {totals.balanceAmount > 0 && (
                    <tr>
                      <td colSpan={4}><strong>BALANCE</strong></td>
                      <td><strong>KES {totals.balanceAmount.toFixed(2)}</strong></td>
                    </tr>
                  )}
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
                Save Cash Sale
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CashSaleModal 