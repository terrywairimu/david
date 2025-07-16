"use client"

import { useState, useEffect } from "react"
import { X, Search, ShoppingBasket, Plus, Minus, Truck, Box } from "lucide-react"
import { supabase, type RegisteredEntity } from "@/lib/supabase-client"
import { toast } from "sonner"

interface PurchaseItem {
  id: string
  itemId?: string
  description: string
  unit: string
  quantity: number
  rate: number
  amount: number
}

interface PurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (purchaseData: any) => void
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseOrderNumber: '',
    paymentMethod: '',
    total: 0
  })
  
  const [selectedSupplier, setSelectedSupplier] = useState<RegisteredEntity | null>(null)
  const [supplierSearch, setSupplierSearch] = useState('')
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false)
  const [suppliers, setSuppliers] = useState<RegisteredEntity[]>([])
  const [filteredSuppliers, setFilteredSuppliers] = useState<RegisteredEntity[]>([])
  
  const [items, setItems] = useState<PurchaseItem[]>([{
    id: '1',
    description: '',
    unit: '',
    quantity: 1,
    rate: 0,
    amount: 0
  }])
  
  const [availableItems, setAvailableItems] = useState<any[]>([])
  const [availableUnits] = useState(['pcs', 'kg', 'ltr', 'box', 'pack', 'meter', 'dozen'])

  useEffect(() => {
    if (isOpen) {
      generatePurchaseOrderNumber()
      fetchSuppliers()
      fetchAvailableItems()
    }
  }, [isOpen])

  useEffect(() => {
    if (supplierSearch) {
      const filtered = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
        supplier.email.toLowerCase().includes(supplierSearch.toLowerCase())
      )
      setFilteredSuppliers(filtered)
      setShowSupplierDropdown(true)
    } else {
      setFilteredSuppliers([])
      setShowSupplierDropdown(false)
    }
  }, [supplierSearch, suppliers])

  useEffect(() => {
    calculateTotal()
  }, [items])

  const generatePurchaseOrderNumber = () => {
    const timestamp = Date.now().toString().slice(-6)
    const orderNumber = `PO-${timestamp}`
    setFormData(prev => ({ ...prev, purchaseOrderNumber: orderNumber }))
  }

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('registered_entities')
        .select('*')
        .eq('entity_type', 'supplier')
        .order('name')

      if (error) {
        console.error('Error fetching suppliers:', error)
        return
      }

      setSuppliers(data || [])
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const fetchAvailableItems = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching items:', error)
        return
      }

      setAvailableItems(data || [])
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  const handleSupplierSelect = (supplier: RegisteredEntity) => {
    setSelectedSupplier(supplier)
    setSupplierSearch(supplier.name)
    setShowSupplierDropdown(false)
  }

  const handleItemChange = (index: number, field: keyof PurchaseItem, value: string | number) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    // If selecting an item by description, try to find matching stock item
    if (field === 'description' && typeof value === 'string') {
      const matchingItem = availableItems.find(item => 
        item.name.toLowerCase() === value.toLowerCase() ||
        item.description?.toLowerCase() === value.toLowerCase()
      )
      
      if (matchingItem) {
        updatedItems[index].itemId = matchingItem.id
        updatedItems[index].rate = matchingItem.unit_price
      }
    }
    
    // Calculate amount when quantity or rate changes
    if (field === 'quantity' || field === 'rate') {
      const quantity = field === 'quantity' ? Number(value) : updatedItems[index].quantity
      const rate = field === 'rate' ? Number(value) : updatedItems[index].rate
      updatedItems[index].amount = quantity * rate
    }
    
    setItems(updatedItems)
  }

  const addItemRow = () => {
    const newItem: PurchaseItem = {
      id: Date.now().toString(),
      description: '',
      unit: '',
      quantity: 1,
      rate: 0,
      amount: 0
    }
    setItems([...items, newItem])
  }

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      const updatedItems = items.filter((_, i) => i !== index)
      setItems(updatedItems)
    }
  }

  const calculateTotal = () => {
    const total = items.reduce((sum, item) => sum + item.amount, 0)
    setFormData(prev => ({ ...prev, total }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedSupplier) {
      toast.error('Please select a supplier')
      return
    }

    const validItems = items.filter(item => 
      item.description && item.unit && item.quantity > 0 && item.rate > 0
    )

    if (validItems.length === 0) {
      toast.error('Please add at least one valid item')
      return
    }

    const purchaseData = {
      purchase_number: formData.purchaseOrderNumber,
      supplier_id: selectedSupplier.id,
      date_created: formData.purchaseDate,
      total_amount: formData.total,
      payment_method: formData.paymentMethod,
      status: 'pending',
      items: validItems
    }

    try {
      // Save purchase
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert([purchaseData])
        .select()
        .single()

      if (purchaseError) {
        console.error('Error saving purchase:', purchaseError)
        toast.error('Failed to save purchase')
        return
      }

      // Save purchase items
      const purchaseItems = validItems.map(item => ({
        purchase_id: purchase.id,
        stock_item_id: item.itemId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.rate,
        total_price: item.amount
      }))

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(purchaseItems)

      if (itemsError) {
        console.error('Error saving purchase items:', itemsError)
        toast.error('Failed to save purchase items')
        return
      }

      // Update stock levels
      await updateStockLevels(validItems)

      toast.success('Purchase saved successfully!')
      onSave(purchase)
      handleClose()
    } catch (error) {
      console.error('Error saving purchase:', error)
      toast.error('Failed to save purchase')
    }
  }

  const updateStockLevels = async (purchaseItems: PurchaseItem[]) => {
    for (const item of purchaseItems) {
      if (item.itemId) {
        // First get current quantity
        const { data: currentItem, error: fetchError } = await supabase
          .from('stock_items')
          .select('quantity')
          .eq('id', item.itemId)
          .single()

        if (fetchError) {
          console.error('Error fetching current stock:', fetchError)
          continue
        }

        // Update quantity
        const { error } = await supabase
          .from('stock_items')
          .update({ 
            quantity: (currentItem.quantity || 0) + item.quantity
          })
          .eq('id', item.itemId)

        if (error) {
          console.error('Error updating stock:', error)
        }
      }
    }
  }

  const handleClose = () => {
    setFormData({
      purchaseDate: new Date().toISOString().split('T')[0],
      purchaseOrderNumber: '',
      paymentMethod: '',
      total: 0
    })
    setSelectedSupplier(null)
    setSupplierSearch('')
    setItems([{
      id: '1',
      description: '',
      unit: '',
      quantity: 1,
      rate: 0,
      amount: 0
    }])
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Add New Purchase</h5>
            <button type="button" className="btn-close" onClick={handleClose}>
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Purchase Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Supplier</label>
                  <div className="position-relative">
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search supplier..."
                        value={supplierSearch}
                        onChange={(e) => setSupplierSearch(e.target.value)}
                        onFocus={() => setShowSupplierDropdown(true)}
                        required
                      />
                      <button 
                        className="btn btn-outline-secondary" 
                        type="button"
                        onClick={() => setShowSupplierDropdown(!showSupplierDropdown)}
                      >
                        <Truck size={16} />
                      </button>
                    </div>
                    {showSupplierDropdown && (
                      <div className="client-search-dropdown">
                        {filteredSuppliers.map((supplier) => (
                          <div
                            key={supplier.id}
                            className="client-search-item"
                            onClick={() => handleSupplierSelect(supplier)}
                          >
                            <div className="fw-bold">{supplier.name}</div>
                            <div className="text-muted small">{supplier.email}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Purchase Order Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.purchaseOrderNumber}
                    readOnly
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Payment Method</label>
                  <select
                    className="form-select"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    required
                  >
                    <option value="">Select Payment Method</option>
                    <option value="David">David</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="Kim">Kim</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Items</label>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Item Description</th>
                        <th>Unit</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={item.id}>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Item description..."
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              required
                            />
                          </td>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              value={item.unit}
                              onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                              required
                            >
                              <option value="">Units</option>
                              {availableUnits.map(unit => (
                                <option key={unit} value={unit}>{unit}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                              min="1"
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={item.rate}
                              onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                              min="0"
                              step="0.01"
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={item.amount.toFixed(2)}
                              readOnly
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => removeItemRow(index)}
                              disabled={items.length === 1}
                            >
                              <Minus size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={addItemRow}
                >
                  <Plus size={16} className="me-1" />
                  Add Item
                </button>
              </div>

              <div className="row">
                <div className="col-md-8"></div>
                <div className="col-md-4">
                  <label className="form-label">Total</label>
                  <div className="input-group">
                    <span className="input-group-text">KES</span>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.total.toFixed(2)}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleClose}>
                Close
              </button>
              <button type="submit" className="btn btn-primary">
                Save Purchase
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PurchaseModal 