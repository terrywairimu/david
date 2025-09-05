"use client"

import React, { useState, useEffect, useRef } from "react"
import { X, Search, Plus, User } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import { generatePaymentNumber } from "@/lib/workflow-utils"
import { toNairobiTime, nairobiToUTC, utcToNairobi, dateInputToDateOnly } from "@/lib/timezone"

interface EmployeePaymentModalProps {
  payment?: any
  mode: "view" | "edit" | "create"
  onClose: () => void
  onSave: (payment: any) => void
  employees: any[]
}

const EmployeePaymentModal: React.FC<EmployeePaymentModalProps> = ({
  payment,
  mode,
  onClose,
  onSave,
  employees,
}) => {
  const [formData, setFormData] = useState({
    payment_number: "",
    employee_id: "",
    date_created: new Date().toISOString().split('T')[0],
    description: "",
    amount: "",
    paid_to: "",
    account_debited: "",
    status: "completed",
    payment_method: "cash",
    category: "wages"
  })
  const [loading, setLoading] = useState(false)
  const [employeeSearch, setEmployeeSearch] = useState("")
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false)
  const [filteredEmployees, setFilteredEmployees] = useState(employees)

  const employeeInputGroupRef = useRef<HTMLDivElement>(null);
  const employeeDropdownRef = useRef<HTMLDivElement>(null);

  const paymentCategories = [
    { value: "wages", label: "Wages" },
    { value: "transport", label: "Transport" },
    { value: "fair", label: "Fair" },
    { value: "client_expenses", label: "Client Expenses" }
  ]

  useEffect(() => {
    if (payment && mode !== "create") {
      setFormData({
        payment_number: payment.payment_number || "",
        employee_id: payment.employee_id || "",
        date_created: payment.date_created ? new Date(payment.date_created).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        description: payment.description || "",
        amount: payment.amount || "",
        paid_to: payment.paid_to || "",
        account_debited: payment.account_debited || "",
        status: payment.status || "completed",
        payment_method: payment.payment_method || "cash",
        category: payment.category || "wages"
      })
      
      // Set employee search text
      const employee = employees.find(e => e.id === payment.employee_id)
      if (employee) {
        setEmployeeSearch(employee.name)
      }
    } else if (mode === "create") {
      generateNewPaymentNumber()
    }
  }, [payment, mode, employees])

  useEffect(() => {
    setFilteredEmployees(employees)
  }, [employees])

  const generateNewPaymentNumber = async () => {
    try {
      const paymentNumber = await generatePaymentNumber()
      setFormData(prev => ({ ...prev, payment_number: paymentNumber }))
    } catch (error) {
      console.error("Error generating payment number:", error)
      const timestamp = Date.now().toString().slice(-6)
      setFormData(prev => ({ ...prev, payment_number: `EP-${timestamp}` }))
    }
  }

  const handleEmployeeSearch = (searchTerm: string) => {
    setEmployeeSearch(searchTerm)
    setShowEmployeeDropdown(true)
    
    if (searchTerm.trim() === "") {
      setFilteredEmployees(employees)
    } else {
      const filtered = employees.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredEmployees(filtered)
    }
  }

  const handleEmployeeSelect = (employee: any) => {
    setFormData(prev => ({ ...prev, employee_id: employee.id }))
    setEmployeeSearch(employee.name)
    setShowEmployeeDropdown(false)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.employee_id) {
      toast.error("Please select an employee")
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
        type: "employee_payment"
      }

      if (mode === "create") {
        const { error } = await supabase
          .from("employee_payments")
          .insert([paymentData])

        if (error) throw error
        toast.success("Employee payment created successfully")
      } else if (mode === "edit") {
        const { error } = await supabase
          .from("employee_payments")
          .update(paymentData)
          .eq("id", payment.id)

        if (error) throw error
        toast.success("Employee payment updated successfully")
      }

      onSave(paymentData)
    } catch (error) {
      console.error("Error saving employee payment:", error)
      toast.error("Failed to save employee payment")
    } finally {
      setLoading(false)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (employeeInputGroupRef.current && !employeeInputGroupRef.current.contains(event.target as Node)) {
        setShowEmployeeDropdown(false)
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
              {mode === "create" ? "Add New Employee Payment" : mode === "edit" ? "Edit Employee Payment" : "View Employee Payment"}
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
                  <label htmlFor="employee" className="form-label">Employee</label>
                  <div className="input-group" ref={employeeInputGroupRef}>
                    <input
                      type="text"
                      className="form-control"
                      id="employee"
                      placeholder="Search employee..."
                      value={employeeSearch}
                      onChange={(e) => handleEmployeeSearch(e.target.value)}
                      onFocus={() => setShowEmployeeDropdown(true)}
                      required
                      readOnly={mode === "view"}
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
                      disabled={mode === "view"}
                    >
                      <Search size={16} />
                    </button>
                  </div>
                  
                  {showEmployeeDropdown && filteredEmployees.length > 0 && (
                    <div 
                      className="dropdown-menu show w-100" 
                      ref={employeeDropdownRef}
                      style={{ maxHeight: "200px", overflowY: "auto" }}
                    >
                      {filteredEmployees.map((employee) => (
                        <button
                          key={employee.id}
                          type="button"
                          className="dropdown-item"
                          onClick={() => handleEmployeeSelect(employee)}
                        >
                          <User size={16} className="me-2" />
                          {employee.name}
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
                  <label htmlFor="category" className="form-label">Payment Category</label>
                  <select
                    className="form-select"
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange("category", e.target.value)}
                    required
                    disabled={mode === "view"}
                  >
                    {paymentCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
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
              </div>

              <div className="row mb-3">
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
              </div>

              <div className="row mb-3">
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

export default EmployeePaymentModal
