"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Eye, Download, CreditCard } from "lucide-react"
import { supabase, type Payment, type RegisteredEntity, type Invoice } from "@/lib/supabase-client"
import { useAuth } from "@/lib/auth-context"
import { ActionGuard } from "@/components/ActionGuard"
import { toast } from "sonner"
import SearchFilterRow from "@/components/ui/search-filter-row"
import { exportPaymentsReport } from "@/lib/workflow-utils"
import { formatNumber } from "@/lib/format-number"
import { generatePaymentReceiptTemplate } from "@/lib/report-pdf-templates"
import SupplierPaymentModal from "@/components/ui/supplier-payment-modal"
import EmployeePaymentModal from "@/components/ui/employee-payment-modal"
import { useGlobalProgress } from "@/components/GlobalProgressManager"

interface MakePaymentViewProps {
  paymentType: "suppliers" | "employees"
  clients: RegisteredEntity[]
  invoices: Invoice[]
  payments: Payment[]
  loading: boolean
  onRefresh: () => void
}

const MakePaymentView = ({ paymentType, clients, invoices, payments, loading, onRefresh }: MakePaymentViewProps) => {
  const { canPerformAction } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [entityFilter, setEntityFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [specificDate, setSpecificDate] = useState("")
  const [periodStartDate, setPeriodStartDate] = useState("")
  const [periodEndDate, setPeriodEndDate] = useState("")
  const [entityOptions, setEntityOptions] = useState<{ value: string; label: string }[]>([])
  const [suppliers, setSuppliers] = useState<RegisteredEntity[]>([])
  const [employees, setEmployees] = useState<RegisteredEntity[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [supplierPayments, setSupplierPayments] = useState<any[]>([])
  const [employeePayments, setEmployeePayments] = useState<any[]>([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("create")
  
  // Global Progress Manager
  const { startDownload, completeDownload, setError } = useGlobalProgress()

  useEffect(() => {
    fetchSuppliersAndEmployees()
    fetchPayments()
  }, [clients, paymentType])

  useEffect(() => {
    setupEntityOptions()
  }, [suppliers, employees, paymentType])

  const fetchSuppliersAndEmployees = async () => {
    try {
      // Fetch suppliers from registered_entities table
      const { data: suppliersData, error: suppliersError } = await supabase
        .from("registered_entities")
        .select("*")
        .eq("type", "supplier")
        .order("name")

      if (suppliersError) throw suppliersError
      setSuppliers(suppliersData || [])

      // Fetch employees from employees table
      const { data: employeesData, error: employeesError } = await supabase
        .from("employees")
        .select("*")
        .eq("status", "active")
        .order("name")

      if (employeesError) throw employeesError
      setEmployees(employeesData || [])

      // Fetch purchase orders
      const { data: purchaseOrdersData, error: purchaseOrdersError } = await supabase
        .from("purchases")
        .select("id, purchase_order_number, total_amount, purchase_date, supplier_id")
        .order("purchase_date", { ascending: false })

      if (purchaseOrdersError) throw purchaseOrdersError
      setPurchaseOrders(purchaseOrdersData || [])
    } catch (error) {
      console.error("Error fetching suppliers and employees:", error)
      toast.error("Failed to load suppliers and employees")
    }
  }

  const fetchPayments = async () => {
    try {
      if (paymentType === "suppliers") {
        const { data, error } = await supabase
          .from("supplier_payments")
          .select(`
            *,
            supplier:registered_entities(*),
            purchase_order:purchases(*)
          `)
          .order("date_created", { ascending: false })

        if (error) throw error
        setSupplierPayments(data || [])
      } else {
        const { data, error } = await supabase
          .from("employee_payments")
          .select(`
            *,
            employee:employees(*)
          `)
          .order("date_created", { ascending: false })

        if (error) throw error
        setEmployeePayments(data || [])
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
      toast.error("Failed to load payments")
    }
  }

  const setupEntityOptions = () => {
    const entities = paymentType === "suppliers" ? suppliers : employees
    const options = entities.map(entity => ({
      value: entity.id.toString(),
      label: entity.name
    }))
    setEntityOptions(options)
  }

  const handleAddNew = () => {
    setSelectedPayment(null)
    setModalMode("create")
    setShowPaymentModal(true)
  }

  const handleView = (payment: any) => {
    setSelectedPayment(payment)
    setModalMode("view")
    setShowPaymentModal(true)
  }

  const handleEdit = (payment: any) => {
    setSelectedPayment(payment)
    setModalMode("edit")
    setShowPaymentModal(true)
  }

  const handleDelete = async (payment: any) => {
    if (!confirm(`Are you sure you want to delete this payment?`)) return

    try {
      const tableName = paymentType === "suppliers" ? "supplier_payments" : "employee_payments"
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", payment.id)

      if (error) throw error

      toast.success("Payment deleted successfully")
      fetchPayments()
    } catch (error) {
      console.error("Error deleting payment:", error)
      toast.error("Failed to delete payment")
    }
  }

  const handleSavePayment = (paymentData: any) => {
    setShowPaymentModal(false)
    setSelectedPayment(null)
    setModalMode("create")
    fetchPayments()
  }


  const getFilteredPayments = () => {
    const currentPayments = paymentType === "suppliers" ? supplierPayments : employeePayments
    let filtered = currentPayments

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(payment => {
        const entityName = paymentType === "suppliers" 
          ? payment.supplier?.name 
          : payment.employee?.name
        return (
        payment.payment_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.paid_to?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })
    }

    // Entity filter
    if (entityFilter) {
      const entityField = paymentType === "suppliers" ? "supplier_id" : "employee_id"
      filtered = filtered.filter(payment => payment[entityField]?.toString() === entityFilter)
    }

    // Date filter
    if (dateFilter) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.payment_date)
        const paymentDay = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate())
        
        switch (dateFilter) {
          case "today":
            return paymentDay.getTime() === today.getTime()
          case "week":
            const weekStart = new Date(today)
            weekStart.setDate(today.getDate() - today.getDay())
            return paymentDay >= weekStart && paymentDay <= today
          case "month":
            return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear()
          case "year":
            return paymentDate.getFullYear() === now.getFullYear()
          case "specific":
            if (specificDate) {
              const specDate = new Date(specificDate)
              const specDay = new Date(specDate.getFullYear(), specDate.getMonth(), specDate.getDate())
              return paymentDay.getTime() === specDay.getTime()
            }
            return true
          case "period":
            if (periodStartDate && periodEndDate) {
              const startDate = new Date(periodStartDate)
              const endDate = new Date(periodEndDate)
              const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
              const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
              return paymentDay >= startDay && paymentDay <= endDay
            }
            return true
          default:
            return true
        }
      })
    }

    return filtered
  }

  const filteredPayments = getFilteredPayments()

  const handleExport = (format: 'pdf' | 'csv') => {
    try {
      startDownload(`${paymentType}_payments_report_${new Date().toISOString().split('T')[0]}`, format)
      
      exportPaymentsReport(filteredPayments, format)
      
      setTimeout(() => {
        completeDownload()
      }, 1500)
    } catch (error) {
      setError(`Failed to export ${paymentType} payments report`)
    }
  }

  return (
    <div className="card">
      <div>
        {/* Add New Payment Button */}
        <div className="d-flex mb-3">
          <ActionGuard actionId="add">
            <button className="btn-add" onClick={handleAddNew}>
              <Plus size={16} className="me-2" />
              Add New {paymentType === "suppliers" ? "Supplier" : "Employee"} Payment
            </button>
          </ActionGuard>
        </div>

        {/* Enhanced Search and Filter Row */}
        <SearchFilterRow
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder={`Search ${paymentType} payments...`}
          firstFilter={{
            value: entityFilter,
            onChange: setEntityFilter,
            options: entityOptions,
            placeholder: paymentType === "suppliers" ? "All Suppliers" : "All Employees"
          }}
          dateFilter={{
            value: dateFilter,
            onChange: setDateFilter,
            onSpecificDateChange: setSpecificDate,
            onPeriodStartChange: setPeriodStartDate,
            onPeriodEndChange: setPeriodEndDate,
            specificDate,
            periodStartDate,
            periodEndDate
          }}
          onExport={canPerformAction("export") ? handleExport : undefined}
          exportLabel="Export"
        />

        {/* Payments Table */}
        <div className="responsive-table-wrapper">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th className="col-number">Payment #</th>
                <th className="col-date">Date</th>
                <th className={paymentType === "suppliers" ? "col-supplier" : "col-employee"}>
                  {paymentType === "suppliers" ? "Supplier" : "Employee"}
                </th>
                <th className="col-client">Paid To</th>
                <th className="col-amount">Amount</th>
                <th className="col-amount">Balance</th>
                <th className="col-status">Method</th>
                <th className="col-status">Status</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-4">
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    Loading {paymentType} payments...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-muted">
                    No {paymentType} payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <span className="fw-medium">{payment.payment_number}</span>
                    </td>
                    <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                    <td>
                      {paymentType === "suppliers" 
                        ? payment.supplier?.name || "Unknown Supplier"
                        : payment.employee?.name || "Unknown Employee"
                      }
                    </td>
                    <td>{payment.paid_to || "-"}</td>
                    <td>
                      <span className="fw-medium text-success">
                        KES {formatNumber(payment.amount)}
                      </span>
                    </td>
                    <td>
                      <span className="fw-medium text-warning">
                        KES {formatNumber(payment.balance ?? 0)}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-secondary">
                        {payment.payment_method}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        payment.status === "completed" ? "bg-success" :
                        payment.status === "pending" ? "bg-warning" : "bg-danger"
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <ActionGuard actionId="view">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleView(payment)}
                            title="View"
                          >
                            <Eye size={14} />
                          </button>
                        </ActionGuard>
                        <ActionGuard actionId="edit">
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleEdit(payment)}
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                        </ActionGuard>
                        <ActionGuard actionId="delete">
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(payment)}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </ActionGuard>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <>
          {paymentType === "suppliers" ? (
            <SupplierPaymentModal
              payment={selectedPayment}
              mode={modalMode}
              onClose={() => {
                setShowPaymentModal(false)
                setSelectedPayment(null)
                setModalMode("create")
              }}
              onSave={handleSavePayment}
              suppliers={suppliers}
              purchaseOrders={purchaseOrders}
            />
          ) : (
            <EmployeePaymentModal
          payment={selectedPayment}
          mode={modalMode}
            onClose={() => {
              setShowPaymentModal(false)
              setSelectedPayment(null)
              setModalMode("create")
            }}
          onSave={handleSavePayment}
        />
          )}
        </>
      )}
    </div>
  )
}

export default MakePaymentView