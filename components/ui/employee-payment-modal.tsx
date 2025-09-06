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
}

const EmployeePaymentModal: React.FC<EmployeePaymentModalProps> = ({
  payment,
  mode,
  onClose,
  onSave,
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
    category: "wages",
    balance: 0
  })
  const [loading, setLoading] = useState(false)
  const [employeeSearch, setEmployeeSearch] = useState("")
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false)
  const [employees, setEmployees] = useState<any[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([])
  const [paidToSearch, setPaidToSearch] = useState("")
  const [showPaidToDropdown, setShowPaidToDropdown] = useState(false)
  const [employeeExpenses, setEmployeeExpenses] = useState<any[]>([])
  const [filteredEmployeeExpenses, setFilteredEmployeeExpenses] = useState<any[]>([])

  const employeeInputGroupRef = useRef<HTMLDivElement>(null);
  const employeeDropdownRef = useRef<HTMLDivElement>(null);
  const paidToInputGroupRef = useRef<HTMLDivElement>(null);
  const paidToDropdownRef = useRef<HTMLDivElement>(null);

  const paymentCategories = [
    { value: "wages", label: "Wages" },
    { value: "fare", label: "Fare" },
    { value: "transport", label: "Transport" },
    { value: "accomodation", label: "Accomodation" },
    { value: "meals", label: "Meals" },
    { value: "material facilitation", label: "Material Facilitation" },
    { value: "others", label: "Others" }
  ]

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("status", "active")
        .order("name")

      if (error) throw error
      setEmployees(data || [])
      setFilteredEmployees(data || [])
    } catch (error) {
      console.error("Error fetching employees:", error)
      toast.error("Failed to load employees")
    }
  }

  const fetchEmployeeExpenses = async (employeeId?: string, category?: string) => {
    try {
      let query = supabase
        .from("expenses")
        .select("*")
        .eq("expense_type", "client")
        .in("status", ["not_yet_paid", "partially_paid"]) // Only show unpaid and partially paid expenses
        .order("expense_number", { ascending: false })

      if (employeeId) {
        query = query.eq("employee_id", employeeId)
      }

      if (category) {
        query = query.eq("category", category)
      }

      const { data, error } = await query

      if (error) throw error
      setEmployeeExpenses(data || [])
      setFilteredEmployeeExpenses(data || [])
    } catch (error) {
      console.error("Error fetching employee expenses:", error)
    }
  }

  useEffect(() => {
    fetchEmployees()
    fetchEmployeeExpenses()
  }, [])

  // Fetch expenses when employee or category changes
  useEffect(() => {
    if (formData.employee_id && formData.category) {
      fetchEmployeeExpenses(formData.employee_id, formData.category)
    } else if (formData.employee_id) {
      fetchEmployeeExpenses(formData.employee_id)
    } else {
      fetchEmployeeExpenses()
    }
  }, [formData.employee_id, formData.category])

  // Filter expenses based on search
  useEffect(() => {
    if (paidToSearch.trim() === "") {
      setFilteredEmployeeExpenses(employeeExpenses)
    } else {
      const filtered = employeeExpenses.filter(expense =>
        expense.expense_number.toLowerCase().includes(paidToSearch.toLowerCase())
      )
      setFilteredEmployeeExpenses(filtered)
    }
  }, [paidToSearch, employeeExpenses])

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
        category: payment.category || "wages",
        balance: payment.balance || 0
      })
      
      // Set employee search text
      const employee = employees.find(e => e.id === payment.employee_id)
      if (employee) {
        setEmployeeSearch(employee.name)
      }
      
      // Set paid to search text
      if (payment.paid_to) {
        setPaidToSearch(payment.paid_to)
      }
    } else if (mode === "create") {
      generateNewPaymentNumber()
    }
  }, [payment, mode, employees])

  useEffect(() => {
    setFilteredEmployees(employees)
  }, [employees])

  // Employee search filtering with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (employeeSearch.trim() === "") {
        setFilteredEmployees(employees)
      } else {
        const filtered = employees.filter(employee => {
          const searchLower = employeeSearch.toLowerCase()
          const nameLower = employee.name?.toLowerCase() || ""
          const phoneLower = employee.phone?.toLowerCase() || ""
          const locationLower = employee.location?.toLowerCase() || ""
          return nameLower.includes(searchLower) ||
                 phoneLower.includes(searchLower) ||
                 locationLower.includes(searchLower)
        })
        setFilteredEmployees(filtered)
      }
    }, 150) // 150ms debounce

    return () => clearTimeout(timeoutId)
  }, [employeeSearch, employees])

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
  }

  const handleEmployeeSelect = (employee: any) => {
    setFormData(prev => ({ ...prev, employee_id: employee.id, paid_to: "" }))
    setEmployeeSearch(employee.name)
    setPaidToSearch("") // Clear paid to search when employee changes
    setShowEmployeeDropdown(false)
  }

  const handleCategoryChange = (category: string) => {
    setFormData(prev => ({ ...prev, category, paid_to: "" }))
    setPaidToSearch("") // Clear paid to search when category changes
  }

  const handlePaidToSearch = (searchTerm: string) => {
    setPaidToSearch(searchTerm)
    setShowPaidToDropdown(true)
  }

  const handlePaidToSelect = (expense: any) => {
    setFormData(prev => ({ ...prev, paid_to: expense.expense_number }))
    setPaidToSearch(expense.expense_number)
    setShowPaidToDropdown(false)
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
                  <div className="position-relative" ref={employeeInputGroupRef}>
                    <div className="input-group shadow-sm">
                      <input
                        type="text"
                        className="form-control border-0" 
                        id="employee"
                        placeholder="Search employee..."
                        value={employeeSearch}
                        onChange={(e) => handleEmployeeSearch(e.target.value)}
                        onFocus={() => setShowEmployeeDropdown(true)}
                        style={{ borderRadius: "16px 0 0 16px", height: "45px", paddingLeft: "15px", color: "#000000" }}
                        autoComplete="off"
                        required
                        readOnly={mode === "view"}
                      />
                      <button
                        className="btn btn-light border-0 dropdown-toggle" 
                        type="button"
                        onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
                        style={{ borderRadius: "0 16px 16px 0", height: "45px", background: "white" }}
                        disabled={mode === "view"}
                      >
                        <User size={16} className="text-muted" />
                      </button>
                    </div>
                    {showEmployeeDropdown && mode !== "view" && (
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
                        {filteredEmployees.map((employee) => (
                          <div
                            key={employee.id}
                            className="dropdown-item"
                            onClick={() => handleEmployeeSelect(employee)}
                            style={{ cursor: "pointer", padding: "10px 15px", color: "#000000" }}
                          >
                            <strong style={{ color: "#000000" }}>{employee.name}</strong>
                            <div className="small" style={{ color: "#6c757d" }}>
                              {employee.phone && `${employee.phone} • `}
                              {employee.location}
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
                  <label htmlFor="category" className="form-label">Payment Category</label>
                  <select
                    className="form-select"
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
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
                  <div className="position-relative" ref={paidToInputGroupRef}>
                    <div className="input-group shadow-sm">
                      <input
                        type="text"
                        className="form-control border-0" 
                        id="paidTo"
                        placeholder={formData.employee_id && formData.category ? "Search expense number for this employee and category..." : "Select employee and category first..."}
                        value={paidToSearch}
                        onChange={(e) => handlePaidToSearch(e.target.value)}
                        onFocus={() => setShowPaidToDropdown(true)}
                        style={{ borderRadius: "16px 0 0 16px", height: "45px", paddingLeft: "15px", color: "#000000" }}
                        autoComplete="off"
                        required
                        readOnly={mode === "view" || !formData.employee_id || !formData.category}
                      />
                      <button
                        className="btn btn-light border-0 dropdown-toggle" 
                        type="button"
                        onClick={() => setShowPaidToDropdown(!showPaidToDropdown)}
                        style={{ borderRadius: "0 16px 16px 0", height: "45px", background: "white" }}
                        disabled={mode === "view" || !formData.employee_id || !formData.category}
                      >
                        <Search size={16} className="text-muted" />
                      </button>
                    </div>
                    {showPaidToDropdown && mode !== "view" && formData.employee_id && formData.category && (
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
                        {filteredEmployeeExpenses.map((expense) => (
                          <div
                            key={expense.expense_number}
                            className="dropdown-item"
                            onClick={() => handlePaidToSelect(expense)}
                            style={{ cursor: "pointer", padding: "10px 15px", color: "#000000" }}
                          >
                            <strong style={{ color: "#000000" }}>{expense.expense_number}</strong>
                            <div className="small" style={{ color: "#6c757d" }}>
                              KES {parseFloat(expense.amount).toLocaleString()} • {new Date(expense.date_created).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
