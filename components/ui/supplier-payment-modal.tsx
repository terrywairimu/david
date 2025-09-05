"use client"

import React, { useState, useEffect, useRef } from "react"
import { X, Search, Plus, User } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import { generatePaymentNumber } from "@/lib/workflow-utils"
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
    payment_method: "cash"
  })
  const [loading, setLoading] = useState(false)
  const [supplierSearch, setSupplierSearch] = useState("")
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false)
  const [filteredSuppliers, setFilteredSuppliers] = useState(suppliers)
  const [availablePurchaseOrders, setAvailablePurchaseOrders] = useState<any[]>([])

  const supplierInputGroupRef = useRef<HTMLDivElement>(null);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);

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
        payment_method: payment.payment_method || "cash"
      })
      
      // Set supplier search text
      const supplier = suppliers.find(s => s.id === payment.supplier_id)
      if (supplier) {
        setSupplierSearch(supplier.name)
      }
    } else if (mode === "create") {
      generateNewPaymentNumber()
    }
  }, [payment, mode, suppliers])

  useEffect(() => {
    setFilteredSuppliers(suppliers)
  }, [suppliers])

  useEffect(() => {
    if (formData.supplier_id) {
      fetchPurchaseOrdersForSupplier(formData.supplier_id)
    } else {
      setAvailablePurchaseOrders([])
    }
  }, [formData.supplier_id])

  const generateNewPaymentNumber = async () => {
    try {
      const paymentNumber = await generatePaymentNumber()
      setFormData(prev => ({ ...prev, payment_number: paymentNumber }))
    } catch (error) {
      console.error("Error generating payment number:", error)
      const timestamp = Date.now().toString().slice(-6)
      setFormData(prev => ({ ...prev, payment_number: `SP-${timestamp}` }))
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

  const handleSupplierSearch = (searchTerm: string) => {
    setSupplierSearch(searchTerm)
    setShowSupplierDropdown(true)
    
    if (searchTerm.trim() === "") {
      setFilteredSuppliers(suppliers)
    } else {
      const filtered = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredSuppliers(filtered)
    }
  }

  const handleSupplierSelect = (supplier: any) => {
    setFormData(prev => ({ ...prev, supplier_id: supplier.id }))
    setSupplierSearch(supplier.name)
    setShowSupplierDropdown(false)
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
                  <div className="input-group" ref={supplierInputGroupRef}>
                    <input
                      type="text"
                      className="form-control"
                      id="supplier"
                      placeholder="Search supplier..."
                      value={supplierSearch}
                      onChange={(e) => handleSupplierSearch(e.target.value)}
                      onFocus={() => setShowSupplierDropdown(true)}
                      required
                      readOnly={mode === "view"}
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setShowSupplierDropdown(!showSupplierDropdown)}
                      disabled={mode === "view"}
                    >
                      <Search size={16} />
                    </button>
                  </div>
                  
                  {showSupplierDropdown && filteredSuppliers.length > 0 && (
                    <div 
                      className="dropdown-menu show w-100" 
                      ref={supplierDropdownRef}
                      style={{ maxHeight: "200px", overflowY: "auto" }}
                    >
                      {filteredSuppliers.map((supplier) => (
                        <button
                          key={supplier.id}
                          type="button"
                          className="dropdown-item"
                          onClick={() => handleSupplierSelect(supplier)}
                        >
                          <User size={16} className="me-2" />
                          {supplier.name}
                        </button>
                      ))}
                    </div>
                  )}
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
                  <input
                    type="text"
                    className="form-control"
                    id="paidTo"
                    value={formData.paid_to}
                    onChange={(e) => handleInputChange("paid_to", e.target.value)}
                    placeholder="Enter recipient name"
                    readOnly={mode === "view"}
                  />
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
                    <option value="bank">Bank</option>
                    <option value="david">David</option>
                    <option value="kim">Kim</option>
                  </select>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="paymentMethod" className="form-label">Payment Method</label>
                  <select
                    className="form-select"
                    id="paymentMethod"
                    value={formData.payment_method}
                    onChange={(e) => handleInputChange("payment_method", e.target.value)}
                    required
                    disabled={mode === "view"}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="mobile_money">Mobile Money</option>
                  </select>
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
