"use client"

import React, { useState, useEffect } from "react"
import { X, Search, Plus, Minus, User } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import { generateExpenseNumber, generateEmployeePaymentNumber } from "@/lib/workflow-utils"
import { FormattedNumberInput } from "@/components/ui/formatted-number-input"
import { formatNumber, parseFormattedNumber } from "@/lib/format-number"
import { toNairobiTime, nairobiToUTC, utcToNairobi, dateInputToDateOnly } from "@/lib/timezone"
import { Expense } from "@/lib/types"

interface ExpenseItem {
  id: number
  description: string
  quantity: number
  rate: number
  amount: number
}

interface Employee {
  id: number
  name: string
  phone?: string
  email?: string
  position?: string
  department?: string
}

interface ExpenseModalProps {
  expense?: any
  mode: "view" | "edit" | "create"
  onClose: () => void
  onSave: (expense: any) => void
  clients: any[]
  expenseType: "client" | "company"
}

const ExpenseModal = ({
  expense,
  mode,
  onClose,
  onSave,
  clients,
  expenseType,
}: ExpenseModalProps) => {
  const [formData, setFormData] = useState({
    expense_number: "",
    client_id: "",
    category: "",
    department: "",
    amount: 0,
    description: "",
    receipt_number: "",
    account_debited: "",
    date_created: new Date().toISOString().split('T')[0],
    expense_type: expenseType,
    employee_id: "",
    expense_category: "",
    main_amount: 0,  // Add separate field for main amount input
    status: expenseType === "company" ? "fully_paid" : "not_yet_paid",  // Company expenses default to fully paid, client expenses to not_yet_paid
    amount_paid: 0,  // Amount paid for partially paid expenses
    balance: 0  // Calculated balance
  })
  const [expenseNumberGenerated, setExpenseNumberGenerated] = useState(false)
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([
    {
      id: 1,
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0
    }
  ])
  const [loading, setLoading] = useState(false)
  const [clientSearch, setClientSearch] = useState("")
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [filteredClients, setFilteredClients] = useState(clients)
  const [selectedQuotation, setSelectedQuotation] = useState("")
  const [clientQuotations, setClientQuotations] = useState<{quotation_number: string, grand_total?: number}[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  
  // Input handling states for quantity and rate
  const [quantityInputFocused, setQuantityInputFocused] = useState<{[key: number]: boolean}>({})
  const [rateInputFocused, setRateInputFocused] = useState<{[key: number]: boolean}>({})
  const [rawQuantityValues, setRawQuantityValues] = useState<{[key: number]: string}>({})
  const [rawRateValues, setRawRateValues] = useState<{[key: number]: string}>({})

  const clientCategories = [
    "wages", "fare", "transport", "accomodation", "meals", "material facilitation", "others"
  ]

  const companyCategories = [
    { value: "utilities", label: "Utilities" },
    { value: "rent", label: "Rent" },
    { value: "supplies", label: "Office Supplies" },
    { value: "perdm", label: "Fare, meals & Accommodation" },
    { value: "salaries", label: "Salaries & Wages" },
    { value: "maintenance", label: "Repair & Maintenance" },
    { value: "fuel", label: "Fuel" },
    { value: "assets", label: "Assets" },
    { value: "other", label: "Miscellaneous" }
  ]

  const departments = [
    { value: "administration", label: "Administration" },
    { value: "operations", label: "Operations" },
    { value: "marketing", label: "Marketing" },
    { value: "finance", label: "Finance" },
    { value: "it", label: "IT" }
  ]

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("status", "active")
        .order("name", { ascending: true })

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error("Error fetching employees:", error)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    console.log('useEffect triggered - expense:', expense, 'mode:', mode, 'expenseType:', expenseType)
    
    if (expense && mode !== "create") {
      // Edit mode - populate form with existing expense data
      
      // Map old uppercase account values to new lowercase values for backward compatibility
      let mappedAccountDebited = expense.account_debited || ""
      if (mappedAccountDebited) {
        const accountMapping: { [key: string]: string } = {
          "Cash": "cash",
          "Cooperative Bank": "cooperative_bank", 
          "Credit": "credit",
          "Cheque": "cheque",
          "M-Pesa": "mpesa",
          "Petty Cash": "petty_cash"
        }
        mappedAccountDebited = accountMapping[mappedAccountDebited] || mappedAccountDebited
      }
      
      // Map old category field to expense_category for backward compatibility
      let mappedExpenseCategory = expense.expense_category || expense.category || ""
      
      // Debug logging for edit mode
      console.log('Loading expense for edit:', {
        original: expense,
        mappedAccountDebited,
        mappedExpenseCategory,
        expenseType
      })
      
      setFormData({
        expense_number: expense.expense_number || "",
        client_id: expense.client_id?.toString() || "",
        category: expense.category || "",
        department: expense.department || "",
        amount: expense.amount || 0,
        description: expense.description || "",
        receipt_number: expense.receipt_number || "",
        account_debited: mappedAccountDebited,
        date_created: expense.date_created ? utcToNairobi(new Date(expense.date_created)).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        expense_type: expense.expense_type || expenseType,
        employee_id: expense.employee_id?.toString() || "",
        expense_category: mappedExpenseCategory,
        main_amount: expense.amount || 0, // Initialize main_amount with the expense amount
        status: expense.status || "not_yet_paid",
        amount_paid: expense.amount_paid || 0,
        balance: (expense.amount || 0) - (expense.amount_paid || 0)
      })
      setExpenseNumberGenerated(true) // Expense number already exists in edit mode
      setSelectedQuotation(expense.quotation_number || "");
      
      // Load expense items from expense_items table
      loadExpenseItems(expense.id)
      
      // Set client search to selected client name
      if (expense.client_id && expenseType === "client") {
        const selectedClient = clients.find(c => c.id === expense.client_id)
        if (selectedClient) {
          setClientSearch(selectedClient.name)
        }
      }
    } else {
      // Generate new expense number for create mode
      generateExpenseNumber(expenseType).then(number => {
        setFormData(prev => ({ ...prev, expense_number: number }))
        setExpenseNumberGenerated(true)
      }).catch(error => {
        console.error('Error generating expense number:', error)
        // Fallback expense number
        const fallbackNumber = `EN${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${Date.now().toString().slice(-3)}`
        setFormData(prev => ({ ...prev, expense_number: fallbackNumber }))
        setExpenseNumberGenerated(true)
      })
      // Reset amount for new expenses
      setFormData(prev => ({ ...prev, amount: 0, main_amount: 0 }))
    }
  }, [expense, mode, clients, expenseType])

  useEffect(() => {
    if (formData.client_id) {
      supabase
        .from("quotations")
        .select("*")
        .eq("client_id", formData.client_id)
        .order("date_created", { ascending: false })
        .then(({ data }) => setClientQuotations(data || []))
    } else {
      setClientQuotations([])
    }
  }, [formData.client_id])

  // Debug useEffect to monitor form data changes
  useEffect(() => {
    if (mode === "edit") {
      console.log('Form data updated:', {
        account_debited: formData.account_debited,
        expense_category: formData.expense_category,
        category: formData.category,
        mode,
        expenseType
      })
    }
  }, [formData.account_debited, formData.expense_category, formData.category, mode, expenseType])

  // Calculate balance and auto-update amount_paid based on status
  useEffect(() => {
    setFormData(prev => {
      let newAmountPaid = prev.amount_paid
      let newBalance = prev.balance

      if (prev.status === "fully_paid") {
        newAmountPaid = prev.main_amount
        newBalance = 0
      } else if (prev.status === "not_yet_paid") {
        newAmountPaid = 0
        newBalance = prev.main_amount
      } else if (prev.status === "partially_paid") {
        // Keep current amount_paid, calculate balance
        newBalance = prev.main_amount - prev.amount_paid
      }

      return {
        ...prev,
        amount_paid: newAmountPaid,
        balance: newBalance
      }
    })
  }, [formData.status, formData.main_amount, formData.amount_paid])

  const loadExpenseItems = async (expenseId: number) => {
    try {
      const { data, error } = await supabase
        .from('expense_items')
        .select('*')
        .eq('expense_id', expenseId)
        .order('id', { ascending: true })

      if (error) throw error

      if (data && data.length > 0) {
        setExpenseItems(data.map(item => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount
        })))
      } else {
        // No expense items, set empty array
        setExpenseItems([{
          id: 1,
          description: "",
          quantity: 1,
          rate: 0,
          amount: 0
        }])
      }
      
      // Trigger recalculation of total amount after loading items
      // This will happen automatically due to the useEffect dependency on expenseItems
    } catch (error) {
      console.error('Error loading expense items:', error)
    }
  }

  useEffect(() => {
    // Filter clients based on search with debouncing
    const timeoutId = setTimeout(() => {
      const searchLower = clientSearch.toLowerCase()
      const filtered = clients.filter(client => {
        const nameLower = client.name.toLowerCase()
        const phoneLower = client.phone?.toLowerCase() || ""
        const locationLower = client.location?.toLowerCase() || ""
        return nameLower.includes(searchLower) ||
               phoneLower.includes(searchLower) ||
               locationLower.includes(searchLower)
      })
      setFilteredClients(filtered)
    }, 150) // 150ms debounce

    return () => clearTimeout(timeoutId)
  }, [clientSearch, clients])

  useEffect(() => {
    // Calculate total amount whenever expense items change
    const expenseItemsTotal = expenseItems.reduce((sum, item) => sum + item.amount, 0)
    
    if (expenseType === "client") {
      // For client expenses, total = main amount + expense items total
      const mainAmount = formData.main_amount || 0
      const total = mainAmount + expenseItemsTotal
      setFormData(prev => ({ ...prev, amount: total }))
    } else {
      // For company expenses, only use expense items total
      setFormData(prev => ({ ...prev, amount: expenseItemsTotal }))
    }
  }, [expenseItems, expenseType, formData.main_amount])

  const handleClientSelect = (client: any) => {
    setClientSearch(client.name)
    setFormData(prev => ({ ...prev, client_id: client.id.toString() }))
    setShowClientDropdown(false)
  }

  const updateExpenseItem = (id: number, field: keyof ExpenseItem, value: any) => {
    setExpenseItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
        
        // Recalculate amount when quantity or rate changes
        if (field === 'quantity' || field === 'rate') {
          updatedItem.amount = updatedItem.quantity * updatedItem.rate
        }
        
        return updatedItem
      }
      return item
    }))
  }

  const addExpenseItem = () => {
    const newItem: ExpenseItem = {
      id: Date.now(),
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0
    }
    setExpenseItems(prev => [...prev, newItem])
  }

  const removeExpenseItem = (id: number) => {
    if (expenseItems.length > 1) {
      setExpenseItems(prev => prev.filter(item => item.id !== id))
      // Clean up input focus states
      setQuantityInputFocused(prev => {
        const newState = { ...prev }
        delete newState[id]
        return newState
      })
      setRateInputFocused(prev => {
        const newState = { ...prev }
        delete newState[id]
        return newState
      })
      setRawQuantityValues(prev => {
        const newState = { ...prev }
        delete newState[id]
        return newState
      })
      setRawRateValues(prev => {
        const newState = { ...prev }
        delete newState[id]
        return newState
      })
    }
  }

  const createEmployeePaymentFromExpense = async (expense: any) => {
    try {
      console.log("Starting employee payment creation for expense:", expense)
      
      // Check if employee payment already exists for this expense
      const { data: existingPayment } = await supabase
        .from("employee_payments")
        .select("id")
        .eq("paid_to", expense.expense_number)
        .eq("employee_id", expense.employee_id)
        .single()
      
      if (existingPayment) {
        console.log("Employee payment already exists for this expense, skipping creation")
        toast.info("Employee payment already exists for this expense")
        return
      }
      
      // Generate payment number using standardized system
      let paymentNumber
      try {
        paymentNumber = await generateEmployeePaymentNumber()
        console.log("Generated employee payment number:", paymentNumber)
      } catch (error) {
        console.error("Error generating employee payment number:", error)
        // Fallback to timestamp-based number
        const timestamp = Date.now().toString().slice(-6)
        paymentNumber = `PNE2509003${timestamp}`
        console.log("Using fallback payment number:", paymentNumber)
      }
      
      const paymentData = {
        payment_number: paymentNumber,
        employee_id: expense.employee_id,
        date_created: new Date().toISOString(),
        description: `Payment for expense ${expense.expense_number}`,
        amount: expense.amount_paid || expense.main_amount || expense.amount, // Use amount_paid instead of total amount
        paid_to: expense.expense_number,
        account_debited: expense.account_debited || "Cash",
        status: expense.status === "fully_paid" ? "completed" : "pending",
        category: expense.expense_category || expense.category || "others",
        balance: expense.balance || 0,
        payment_method: "cash" // Add required payment_method field
      }

      console.log("Creating employee payment with data:", paymentData)
      console.log("Payment amount (amount_paid):", expense.amount_paid, "Total amount:", expense.main_amount || expense.amount)

      const { error } = await supabase
        .from("employee_payments")
        .insert([paymentData])

      if (error) {
        console.error("Error creating employee payment:", error)
        toast.error(`Failed to create employee payment: ${error.message}`)
      } else {
        toast.success(`Employee payment created automatically (${expense.status === "fully_paid" ? "completed" : "pending"})`)
      }
    } catch (error) {
      console.error("Error creating employee payment:", error)
      toast.error(`Failed to create employee payment: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if expense number has been generated
    if (mode === "create" && !expenseNumberGenerated) {
      toast.error("Please wait for expense number to be generated")
      return
    }
    
    // Check if required fields are filled
    const requiredCategory = expenseType === "client" ? formData.expense_category : formData.category
    if (!formData.expense_number || !requiredCategory) {
      toast.error("Please fill in all required fields")
      return
    }
    
    // Check if Account Debited is required for paid statuses
    if ((formData.status === "fully_paid" || formData.status === "partially_paid") && !formData.account_debited) {
      toast.error("Account Debited is required for paid expenses")
      return
    }
    
    setLoading(true)

    try {
      // Convert date input to date-only value for database storage
      // This prevents the "one day less" issue by treating the date as a pure calendar date
      const dateToSave = dateInputToDateOnly(formData.date_created)
      
      // Remove main_amount field as it doesn't exist in the database
      const { main_amount, ...formDataWithoutMainAmount } = formData
      
      // Map expense_category to category for client expenses
      const mappedFormData = {
        ...formDataWithoutMainAmount,
        category: expenseType === "client" ? formData.expense_category : formData.category
      }
      
      // Ensure category is set for client expenses
      if (expenseType === "client" && !mappedFormData.category) {
        throw new Error("Category is required for client expenses")
      }
      
      // Auto-set amount_paid and balance for fully_paid company expenses
      const processedFormData = {
        ...mappedFormData,
        amount_paid: (mappedFormData.status === "fully_paid" && mappedFormData.expense_type === "company") ? mappedFormData.amount : mappedFormData.amount_paid,
        balance: (mappedFormData.status === "fully_paid" && mappedFormData.expense_type === "company") ? 0 : (mappedFormData.amount - (mappedFormData.amount_paid || 0))
      }

      const expenseData = {
        ...processedFormData,
        client_id: formData.client_id ? parseInt(formData.client_id) : null,
        employee_id: formData.employee_id ? parseInt(formData.employee_id) : null,
        date_created: dateToSave.toISOString(),
        quotation_number: selectedQuotation || null
      }
      
      // Debug logging
      console.log('Form data being sent:', expenseData)
      console.log('Required fields check:', {
        expense_number: expenseData.expense_number,
        category: expenseData.category,
        amount: expenseData.amount
      })

      let savedExpense: Expense | null = null

      if (mode === "create") {
        console.log('Attempting to insert expense with data:', expenseData)
        
        const { data, error } = await supabase
          .from("expenses")
          .insert([expenseData])
          .select(`
            *,
            client:registered_entities(*),
            employee:employees(*)
          `)
          .single()

        if (error) {
          console.error('Supabase insert error:', error)
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          throw error
        }
        
        console.log('Expense inserted successfully:', data)
        savedExpense = data
        
        // Save expense items only if they have descriptions
        const itemsToInsert = expenseItems
          .filter(item => item.description.trim() !== "")
          .map(item => ({
            expense_id: savedExpense!.id,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount
          }))

        if (itemsToInsert.length > 0) {
          console.log('Attempting to insert expense items:', itemsToInsert)
          
          const { error: itemsError } = await supabase
            .from("expense_items")
            .insert(itemsToInsert)

          if (itemsError) {
            console.error('Supabase expense items insert error:', itemsError)
            throw itemsError
          }
          
          console.log('Expense items inserted successfully')
        }
        
        toast.success("Expense created successfully")
        
        // If expense is fully paid or partially paid, create employee payment
        if ((formData.status === "fully_paid" || formData.status === "partially_paid") && formData.employee_id) {
          await createEmployeePaymentFromExpense(savedExpense)
        }
      } else if (mode === "edit") {
        const { data, error } = await supabase
          .from("expenses")
          .update(expenseData)
          .eq("id", expense.id)
          .select(`
            *,
            client:registered_entities(*),
            employee:employees(*)
          `)
          .single()

        if (error) throw error
        savedExpense = data
        
        // If expense is fully paid or partially paid, create employee payment
        if ((formData.status === "fully_paid" || formData.status === "partially_paid") && formData.employee_id) {
          await createEmployeePaymentFromExpense(savedExpense)
        }
        
        // Delete existing expense items and insert new ones only if they have descriptions
        await supabase
          .from("expense_items")
          .delete()
          .eq("expense_id", expense.id)

        const itemsToInsert = expenseItems
          .filter(item => item.description.trim() !== "")
          .map(item => ({
            expense_id: expense.id,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount
          }))

        if (itemsToInsert.length > 0) {
          console.log('Attempting to insert expense items (edit mode):', itemsToInsert)
          
          const { error: itemsError } = await supabase
            .from("expense_items")
            .insert(itemsToInsert)

          if (itemsError) {
            console.error('Supabase expense items insert error (edit mode):', itemsError)
            throw itemsError
          }
          
          console.log('Expense items inserted successfully (edit mode)')
        }
        
        toast.success("Expense updated successfully")
      }

      if (savedExpense) {
        onSave(savedExpense)
        onClose()
      }
    } catch (error: any) {
      console.error("Error saving expense:", error)
      toast.error(error.message || "Failed to save expense")
    } finally {
      setLoading(false)
    }
  }

  // Check if employee is required based on category
  const isEmployeeRequired = (category: string) => {
    return !["transport", "material facilitation", "others"].includes(category)
  }

  return (
    <div className="modal fade show" style={{ display: "block", zIndex: 1055, backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content" style={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">
              {expenseType === "client" ? "Add New Client Expenses" : "Add New Company Expenses"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
          <div className="modal-body pt-2">
            <form id="expenseForm" onSubmit={handleSubmit}>
              {expenseType === "client" ? (
                <>
                  {/* Client Selection Section */}
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
                              value={clientSearch}
                              onChange={(e) => setClientSearch(e.target.value)}
                              onFocus={() => setShowClientDropdown(true)}
                              style={{ borderRadius: "16px 0 0 16px", height: "45px", paddingLeft: "15px", color: "#000000" }}
                              autoComplete="off"
                              required
                              disabled={mode === "view"}
                            />
                            <button
                              className="btn btn-light border-0 dropdown-toggle" 
                              type="button"
                              onClick={() => setShowClientDropdown(!showClientDropdown)}
                              style={{ borderRadius: "0 16px 16px 0", height: "45px", background: "white" }}
                              disabled={mode === "view"}
                            >
                              <User size={16} className="text-muted" />
                            </button>
                          </div>
                          {showClientDropdown && mode !== "view" && (
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
                        <label className="form-label">Quotation</label>
                        <select 
                          className="form-select border-0 shadow-sm"
                          value={selectedQuotation}
                          onChange={(e) => setSelectedQuotation(e.target.value)}
                          style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                          required
                          disabled={mode === "view"}
                        >
                          <option value="">Select Quotation</option>
                          {clientQuotations.map(q => (
                            <option key={q.quotation_number} value={q.quotation_number}>
                              {q.quotation_number} (KES {q.grand_total?.toFixed(2) || '0.00'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Department and Category Selection Section */}
                  <div className="mb-4">
                    <div className="row">
                      <div className="col-md-6">
                        <label className="form-label">Department</label>
                        <select 
                          className="form-select border-0 shadow-sm"
                          value={formData.department}
                          onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                          style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                          required
                          disabled={mode === "view"}
                        >
                          <option value="">Select Department</option>
                          {departments.map(dept => (
                            <option key={dept.value} value={dept.value}>{dept.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Category</label>
                        <select
                          className="form-select border-0 shadow-sm"
                          value={formData.category}
                          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                          style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                          required
                          disabled={mode === "view"}
                        >
                          <option value="">Select Category</option>
                          {companyCategories.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Expense Details Section */}
              <div className="mb-4">
                <div className="row">
                  <div className="col-md-6">
                    <label className="form-label">Date</label>
                    <input
                      type="date" 
                      className="form-control border-0 shadow-sm"
                      value={formData.date_created}
                      onChange={(e) => setFormData(prev => ({ ...prev, date_created: e.target.value }))}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                      required
                      disabled={mode === "view"}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Account Debited</label>
                                          <select 
                        className="form-select border-0 shadow-sm"
                        value={formData.account_debited}
                        onChange={(e) => setFormData(prev => ({ ...prev, account_debited: e.target.value }))}
                        style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                        disabled={mode === "view"}
                      >
                        <option value="">Select Account</option>
                        <option value="cash">Cash</option>
                        <option value="cooperative_bank">Cooperative Bank</option>
                        <option value="credit">Credit</option>
                        <option value="cheque">Cheque</option>
                        <option value="mpesa">M-Pesa</option>
                        <option value="petty_cash">Petty Cash</option>
                      </select>
                  </div>
                </div>
              </div>

              {/* New Inline Row for Category, Employee, and Amount */}
              {expenseType === "client" && (
                <div className="mb-4">
                  <div className="row">
                    <div className="col-md-4">
                      <label className="form-label">Category</label>
                      <select
                        className="form-select border-0 shadow-sm"
                        value={formData.expense_category}
                        onChange={(e) => setFormData(prev => ({ ...prev, expense_category: e.target.value }))}
                        style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                        required
                        disabled={mode === "view"}
                      >
                        <option value="">Select Category</option>
                        {clientCategories.map(cat => (
                          <option key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Employee</label>
                      <select
                        className="form-select border-0 shadow-sm"
                        value={formData.employee_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                        style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                        required={isEmployeeRequired(formData.expense_category)}
                        disabled={mode === "view"}
                      >
                        <option value="">Select Employee</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Amount</label>
                      <FormattedNumberInput
                        className="form-control border-0 shadow-sm"
                        value={formData.main_amount === 0 ? '' : formData.main_amount}
                        onChange={(v) => setFormData(prev => ({ ...prev, main_amount: parseFormattedNumber(v) || 0 }))}
                        style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                        required
                        readOnly={mode === "view"}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Expense Items Section - Now Optional */}
              <div className="mb-4">
                <label className="form-label">Expense Items (Optional)</label>
                <div id="expenseItemsContainer">
                  {expenseItems.map((item, index) => (
                    <div key={item.id} className="expense-item mb-3">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <input
                            type="text"
                            className="form-control border-0 shadow-sm"
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => updateExpenseItem(item.id, 'description', e.target.value)}
                            style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                            disabled={mode === "view"}
                          />
                        </div>
                        <div className="col-md-2">
                          <input 
                            type="number" 
                            className="form-control border-0 shadow-sm"
                            placeholder="Quantity"
                            min="1"
                            value={
                              quantityInputFocused[item.id]
                                ? (rawQuantityValues[item.id] ?? "")
                                : (item.quantity === 0 ? "" : item.quantity)
                            }
                            onChange={e => {
                              const value = e.target.value;
                              setRawQuantityValues(prev => ({ ...prev, [item.id]: value }));
                            }}
                            onFocus={e => {
                              setQuantityInputFocused(prev => ({ ...prev, [item.id]: true }));
                              setRawQuantityValues(prev => ({ ...prev, [item.id]: "" }));
                              e.target.select();
                            }}
                            onBlur={e => {
                              setQuantityInputFocused(prev => ({ ...prev, [item.id]: false }));
                              const value = e.target.value;
                              const finalValue = value === '' ? 1 : parseInt(value) || 1;
                              updateExpenseItem(item.id, 'quantity', finalValue);
                              setRawQuantityValues(prev => {
                                const copy = { ...prev };
                                delete copy[item.id];
                                return copy;
                              });
                            }}
                            style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                            disabled={mode === "view"}
                          />
                        </div>
                        <div className="col-md-2">
                          <input 
                            type="number" 
                            className="form-control border-0 shadow-sm"
                            placeholder="Rate"
                            step="0.01"
                            min="0"
                            value={
                              rateInputFocused[item.id]
                                ? (rawRateValues[item.id] ?? "")
                                : (item.rate === 0 ? "" : item.rate)
                            }
                            onChange={e => {
                              const value = e.target.value;
                              setRawRateValues(prev => ({ ...prev, [item.id]: value }));
                            }}
                            onFocus={e => {
                              setRateInputFocused(prev => ({ ...prev, [item.id]: true }));
                              setRawRateValues(prev => ({ ...prev, [item.id]: "" }));
                              e.target.select();
                            }}
                            onBlur={e => {
                              setRateInputFocused(prev => ({ ...prev, [item.id]: false }));
                              const value = e.target.value;
                              const finalValue = value === '' ? 0 : parseFloat(value) || 0;
                              updateExpenseItem(item.id, 'rate', finalValue);
                              setRawRateValues(prev => {
                                const copy = { ...prev };
                                delete copy[item.id];
                                return copy;
                              });
                            }}
                            style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                            disabled={mode === "view"}
                          />
                        </div>
                        <div className="col-md-2">
                          <div className="d-flex align-items-center h-100">
                            <span className="amount me-2">{formatNumber(item.amount)}</span>
                            {expenseItems.length > 1 && mode !== "view" && (
                              <button 
                                type="button" 
                                className="btn btn-sm btn-danger"
                                onClick={() => removeExpenseItem(item.id)}
                                style={{ borderRadius: "12px", width: "35px", height: "35px" }}
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {mode !== "view" && (
                  <button 
                    type="button" 
                    className="btn-add mt-2"
                    onClick={addExpenseItem}
                    style={{ borderRadius: "16px", height: "45px" }}
                  >
                    <Plus size={16} className="me-2" />Add Item
                  </button>
                )}
              </div>

              {/* Status, Amount Paid, Balance, and Total Amount in one row */}
              <div className="row mb-3">
                {/* Status - Left */}
                <div className="col-md-3">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select border-0 shadow-sm"
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                    required
                    disabled={mode === "view"}
                  >
                    <option value="not_yet_paid">Not Yet Paid</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="fully_paid">Fully Paid</option>
                  </select>
                </div>
                
                {/* Amount Paid - Middle Left */}
                <div className="col-md-3">
                  <label className="form-label">Amount Paid</label>
                  <FormattedNumberInput
                    className="form-control border-0 shadow-sm"
                    value={formData.amount_paid === 0 ? '' : formData.amount_paid}
                    onChange={(v) => {
                      if (formData.status === "partially_paid") {
                        setFormData(prev => ({ ...prev, amount_paid: parseFormattedNumber(v) || 0 }))
                      }
                    }}
                    style={{ 
                      borderRadius: "16px", 
                      height: "45px", 
                      color: "#000000",
                      backgroundColor: formData.status !== "partially_paid" ? "#f8f9fa" : "white"
                    }}
                    required={formData.status === "partially_paid"}
                    readOnly={mode === "view" || formData.status !== "partially_paid"}
                  />
                </div>
                
                {/* Balance - Middle Right */}
                <div className="col-md-3">
                  <label className="form-label">Balance</label>
                  <input
                    type="text"
                    className="form-control border-0 shadow-sm"
                    value={formatNumber(formData.balance)}
                    style={{ borderRadius: "16px", height: "45px", color: "#000000", backgroundColor: "#f8f9fa" }}
                    readOnly
                  />
                </div>
                
                {/* Total Amount - Right */}
                <div className="col-md-3">
                  <label className="form-label">Total Amount</label>
                  <div className="input-group shadow-sm">
                    <span 
                      className="input-group-text border-0"
                      style={{ background: "white", borderRadius: "16px 0 0 16px", height: "45px" }}
                    >
                      KES
                    </span>
                    <input 
                      type="text" 
                      className="form-control border-0"
                      value={formatNumber(formData.amount)}
                      readOnly
                      style={{ borderRadius: "0 16px 16px 0", height: "45px", textAlign: "right", color: "#000000" }}
                    />
                  </div>
                </div>
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
            {mode !== "view" && (
              <button
                type="submit"
                className="btn-add"
                form="expenseForm"
                disabled={loading || (mode === "create" && !expenseNumberGenerated)}
                style={{ borderRadius: "12px", height: "45px" }}
              >
                {loading ? "Saving..." : (mode === "create" && !expenseNumberGenerated) ? "Generating..." : "Save Expense"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExpenseModal 