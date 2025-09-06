"use client"

import React, { useState, useEffect, useRef } from "react"
import { X, Search, Plus, User } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import { generateSupplierPaymentNumber } from "@/lib/workflow-utils"
import { toNairobiTime, nairobiToUTC, utcToNairobi, dateInputToDateOnly } from "@/lib/timezone"

interface SupplierPaymentModalProps {
  payment?: any
  mode: "view" | "edit" | "create"
  onClose: () => void
  onSave: (payment: any) => void
  suppliers: any[]
  purchaseOrders: any[]
}

const SupplierPaymentModal: React.FC<SupplierPaymentModalProps> = ({
  payment,
  mode,
  onClose,
  onSave,
  suppliers,
  purchaseOrders,
}) => {
  const [formData, setFormData] = useState({
    payment_number: "",
    supplier_id: "",
    date_created: new Date().toISOString().split('T')[0],
    description: "",
    amount: "",
    paid_to: "",
    account_debited: "",
    status: "completed",
    balance: 0
  })
  const [loading, setLoading] = useState(false)
  const [supplierSearch, setSupplierSearch] = useState("")
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false)
  const [filteredSuppliers, setFilteredSuppliers] = useState(suppliers)
  const [availablePurchaseOrders, setAvailablePurchaseOrders] = useState<any[]>([])
  const [paidToSearch, setPaidToSearch] = useState("")
  const [showPaidToDropdown, setShowPaidToDropdown] = useState(false)
  const [creditPurchaseOrders, setCreditPurchaseOrders] = useState<any[]>([])
  const [filteredCreditOrders, setFilteredCreditOrders] = useState<any[]>([])

  const supplierInputGroupRef = useRef<HTMLDivElement>(null);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);
  const paidToInputGroupRef = useRef<HTMLDivElement>(null);
  const paidToDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (payment && mode !== "create") {
      setFormData({
        payment_number: payment.payment_number || "",
        supplier_id: payment.supplier_id || "",
        date_created: payment.date_created ? new Date(payment.date_created).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        description: payment.description || "",
        amount: payment.amount || "",
        paid_to: payment.paid_to || "",
        account_debited: payment.account_debited || "",
        status: payment.status || "completed",
        balance: payment.balance || 0
      })
      
      // Set supplier search text
      const supplier = suppliers.find(s => s.id === payment.supplier_id)
      if (supplier) {
        setSupplierSearch(supplier.name)
      }
      
      // Set paid to search text
      setPaidToSearch(payment.paid_to || "")
    } else if (mode === "create") {
      generateNewPaymentNumber()
    }
  }, [payment, mode, suppliers])

  useEffect(() => {
    setFilteredSuppliers(suppliers)
  }, [suppliers])

  // Supplier search filtering with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (supplierSearch.trim() === "") {
        setFilteredSuppliers(suppliers)
      } else {
        const filtered = suppliers.filter(supplier => {
          const searchLower = supplierSearch.toLowerCase()
          const nameLower = supplier.name?.toLowerCase() || ""
          const phoneLower = supplier.phone?.toLowerCase() || ""
          const locationLower = supplier.location?.toLowerCase() || ""
          return nameLower.includes(searchLower) ||
                 phoneLower.includes(searchLower) ||
                 locationLower.includes(searchLower)
        })
        setFilteredSuppliers(filtered)
      }
    }, 150) // 150ms debounce

    return () => clearTimeout(timeoutId)
  }, [supplierSearch, suppliers])

  useEffect(() => {
    fetchCreditPurchaseOrders()
  }, [])

  useEffect(() => {
    if (formData.supplier_id) {
      fetchCreditPurchaseOrders(formData.supplier_id)
    } else {
      // If no supplier selected, show all credit orders
      fetchCreditPurchaseOrders()
    }
  }, [formData.supplier_id])

  useEffect(() => {
    if (formData.supplier_id) {
      fetchPurchaseOrdersForSupplier(formData.supplier_id)
    } else {
      setAvailablePurchaseOrders([])
    }
  }, [formData.supplier_id])

  // Paid To search filtering with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (paidToSearch.trim() === "") {
        setFilteredCreditOrders(creditPurchaseOrders)
      } else {
        const filtered = creditPurchaseOrders.filter(order => {
          const searchLower = paidToSearch.toLowerCase()
          const orderNumberLower = order.purchase_order_number?.toLowerCase() || ""
          return orderNumberLower.includes(searchLower)
        })
        setFilteredCreditOrders(filtered)
      }
    }, 150) // 150ms debounce

    return () => clearTimeout(timeoutId)
  }, [paidToSearch, creditPurchaseOrders])

  const generateNewPaymentNumber = async () => {
    try {
      const paymentNumber = await generateSupplierPaymentNumber()
      setFormData(prev => ({ ...prev, payment_number: paymentNumber }))
    } catch (error) {
      console.error("Error generating payment number:", error)
      const timestamp = Date.now().toString().slice(-6)
      setFormData(prev => ({ ...prev, payment_number: `PNS2509003${timestamp}` }))
    }
  }

  const fetchPurchaseOrdersForSupplier = async (supplierId: string) => {
    try {
      const { data, error } = await supabase
        .from("purchases")
        .select("id, purchase_order_number, total_amount, purchase_date")
        .eq("supplier_id", supplierId)
        .order("purchase_date", { ascending: false })

      if (error) throw error
      setAvailablePurchaseOrders(data || [])
    } catch (error) {
      console.error("Error fetching purchase orders:", error)
      setAvailablePurchaseOrders([])
    }
  }

  const fetchCreditPurchaseOrders = async (supplierId?: string) => {
    try {
      let query = supabase
        .from("purchases")
        .select("purchase_order_number, total_amount, purchase_date, supplier_id")
        .eq("payment_status", "credit")
        .order("purchase_date", { ascending: false })

      // If supplierId is provided, filter by supplier
      if (supplierId) {
        query = query.eq("supplier_id", supplierId)
      }

      const { data, error } = await query

      if (error) throw error
      setCreditPurchaseOrders(data || [])
      setFilteredCreditOrders(data || [])
    } catch (error) {
      console.error("Error fetching credit purchase orders:", error)
      setCreditPurchaseOrders([])
      setFilteredCreditOrders([])
    }
  }

  const handleSupplierSearch = (searchTerm: string) => {
    setSupplierSearch(searchTerm)
    setShowSupplierDropdown(true)
  }

  const handleSupplierSelect = (supplier: any) => {
    setFormData(prev => ({ ...prev, supplier_id: supplier.id, paid_to: "" }))
    setSupplierSearch(supplier.name)
    setPaidToSearch("") // Clear paid to search when supplier changes
    setShowSupplierDropdown(false)
  }

  const handlePaidToSearch = (searchTerm: string) => {
    setPaidToSearch(searchTerm)
    setShowPaidToDropdown(true)
  }

  const handlePaidToSelect = (order: any) => {
    setFormData(prev => ({ ...prev, paid_to: order.purchase_order_number }))
    setPaidToSearch(order.purchase_order_number)
    setShowPaidToDropdown(false)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.supplier_id) {
      toast.error("Please select a supplier")
      return
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    setLoading(true)
    try {
      const paymentData = {
        ...formData,
        amount: parseFloat(formData.amount),
        date_created: dateInputToDateOnly(formData.date_created).toISOString(),
        type: "supplier_payment"
      }

      if (mode === "create") {
        const { error } = await supabase
          .from("supplier_payments")
          .insert([paymentData])

        if (error) throw error
        toast.success("Supplier payment created successfully")
      } else if (mode === "edit") {
        const { error } = await supabase
          .from("supplier_payments")
          .update(paymentData)
          .eq("id", payment.id)

        if (error) throw error
        toast.success("Supplier payment updated successfully")
      }

      onSave(paymentData)
    } catch (error) {
      console.error("Error saving supplier payment:", error)
      toast.error("Failed to save supplier payment")
    } finally {
      setLoading(false)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (supplierInputGroupRef.current && !supplierInputGroupRef.current.contains(event.target as Node)) {
        setShowSupplierDropdown(false)
      }
      if (paidToInputGroupRef.current && !paidToInputGroupRef.current.contains(event.target as Node)) {
        setShowPaidToDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="modal fade show" style={{ display: "block", zIndex: 1055, backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content" style={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">
              {mode === "create" ? "Add New Supplier Payment" : mode === "edit" ? "Edit Supplier Payment" : "View Supplier Payment"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
          
          <div className="modal-body pt-2">
            <form onSubmit={handleSubmit}>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="paymentNumber" className="form-label">Payment Number</label>
                  <input
                    type="text"
                    className="form-control"
                    id="paymentNumber"
                    value={formData.payment_number}
                    readOnly
                    style={{ backgroundColor: "#f8f9fa" }}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="paymentDate" className="form-label">Payment Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="paymentDate"
                    value={formData.date_created}
                    onChange={(e) => handleInputChange("date_created", e.target.value)}
                    required
                    readOnly={mode === "view"}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="supplier" className="form-label">Supplier</label>
                  <div className="position-relative" ref={supplierInputGroupRef}>
                    <div className="input-group shadow-sm">
                      <input
                        type="text"
                        className="form-control border-0" 
                        id="supplier"
                        placeholder="Search supplier..."
                        value={supplierSearch}
                        onChange={(e) => handleSupplierSearch(e.target.value)}
                        onFocus={() => setShowSupplierDropdown(true)}
                        style={{ borderRadius: "16px 0 0 16px", height: "45px", paddingLeft: "15px", color: "#000000" }}
                        autoComplete="off"
                        required
                        readOnly={mode === "view"}
                      />
                      <button
                        className="btn btn-light border-0 dropdown-toggle" 
                        type="button"
                        onClick={() => setShowSupplierDropdown(!showSupplierDropdown)}
                        style={{ borderRadius: "0 16px 16px 0", height: "45px", background: "white" }}
                        disabled={mode === "view"}
                      >
                        <User size={16} className="text-muted" />
                      </button>
                    </div>
                    {showSupplierDropdown && mode !== "view" && (
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
                        {filteredSuppliers.map((supplier) => (
                          <div
                            key={supplier.id}
                            className="dropdown-item"
                            onClick={() => handleSupplierSelect(supplier)}
                            style={{ cursor: "pointer", padding: "10px 15px", color: "#000000" }}
                          >
                            <strong style={{ color: "#000000" }}>{supplier.name}</strong>
                            <div className="small" style={{ color: "#6c757d" }}>
                              {supplier.phone && `${supplier.phone} • `}
                              {supplier.location}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <label htmlFor="amount" className="form-label">Amount (KES)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="amount"
                    value={formData.amount}
                    onChange={(e) => handleInputChange("amount", e.target.value)}
                    required
                    min="0"
                    step="0.01"
                    readOnly={mode === "view"}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="paidTo" className="form-label">Paid To</label>
                  <div className="position-relative" ref={paidToInputGroupRef}>
                    <div className="input-group shadow-sm">
                      <input
                        type="text"
                        className="form-control border-0" 
                        id="paidTo"
                        placeholder={formData.supplier_id ? "Search order number for this supplier..." : "Select supplier first..."}
                        value={paidToSearch}
                        onChange={(e) => handlePaidToSearch(e.target.value)}
                        onFocus={() => setShowPaidToDropdown(true)}
                        style={{ borderRadius: "16px 0 0 16px", height: "45px", paddingLeft: "15px", color: "#000000" }}
                        autoComplete="off"
                        required
                        readOnly={mode === "view" || !formData.supplier_id}
                      />
                      <button
                        className="btn btn-light border-0 dropdown-toggle" 
                        type="button"
                        onClick={() => setShowPaidToDropdown(!showPaidToDropdown)}
                        style={{ borderRadius: "0 16px 16px 0", height: "45px", background: "white" }}
                        disabled={mode === "view" || !formData.supplier_id}
                      >
                        <Search size={16} className="text-muted" />
                      </button>
                    </div>
                    {showPaidToDropdown && mode !== "view" && formData.supplier_id && (
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
                        {filteredCreditOrders.map((order) => (
                          <div
                            key={order.purchase_order_number}
                            className="dropdown-item"
                            onClick={() => handlePaidToSelect(order)}
                            style={{ cursor: "pointer", padding: "10px 15px", color: "#000000" }}
                          >
                            <strong style={{ color: "#000000" }}>{order.purchase_order_number}</strong>
                            <div className="small" style={{ color: "#6c757d" }}>
                              KES {parseFloat(order.total_amount).toLocaleString()} • {new Date(order.purchase_date).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <label htmlFor="accountDebited" className="form-label">Account Debited</label>
                  <select
                    className="form-select"
                    id="accountDebited"
                    value={formData.account_debited}
                    onChange={(e) => handleInputChange("account_debited", e.target.value)}
                    required
                    disabled={mode === "view"}
                  >
                    <option value="">Select Account</option>
                    <option value="Cash">Cash</option>
                    <option value="Cooperative Bank">Cooperative Bank</option>
                    <option value="Credit">Credit</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="balance" className="form-label">Balance (KES)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="balance"
                    value={formData.balance}
                    onChange={(e) => handleInputChange("balance", e.target.value)}
                    min="0"
                    step="0.01"
                    readOnly={mode === "view"}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="status" className="form-label">Status</label>
                  <select
                    className="form-select"
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleInputChange("status", e.target.value)}
                    disabled={mode === "view"}
                  >
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-12">
                  <label htmlFor="description" className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Enter payment description or notes"
                    readOnly={mode === "view"}
                  />
                </div>
              </div>

              {availablePurchaseOrders.length > 0 && (
                <div className="row mb-3">
                  <div className="col-12">
                    <label className="form-label">Related Purchase Orders</label>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Order Number</th>
                            <th>Date</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {availablePurchaseOrders.map((order) => (
                            <tr key={order.id}>
                              <td>{order.purchase_order_number}</td>
                              <td>{new Date(order.purchase_date).toLocaleDateString()}</td>
                              <td>KES {order.total_amount.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {mode !== "view" && (
                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : mode === "create" ? "Create Payment" : "Update Payment"}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupplierPaymentModal
