"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Eye, Download, CreditCard } from "lucide-react"
import { supabase, type Payment, type RegisteredEntity, type Invoice } from "@/lib/supabase-client"
import { toast } from "sonner"
import SearchFilterRow from "@/components/ui/search-filter-row"
import { exportPayments } from "@/lib/workflow-utils"
import PaymentModal from "@/components/ui/payment-modal"

interface MakePaymentViewProps {
  clients: RegisteredEntity[]
  invoices: Invoice[]
  payments: Payment[]
  onRefresh: () => void
}

const MakePaymentView = ({ clients, invoices, payments, onRefresh }: MakePaymentViewProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [clientFilter, setClientFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [specificDate, setSpecificDate] = useState("")
  const [periodStartDate, setPeriodStartDate] = useState("")
  const [periodEndDate, setPeriodEndDate] = useState("")
  const [clientOptions, setClientOptions] = useState<{ value: string; label: string }[]>([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("create")

  useEffect(() => {
    setupClientOptions()
  }, [clients])

  const setupClientOptions = () => {
    const options = clients.map(client => ({
      value: client.id.toString(),
      label: client.name
    }))
    setClientOptions(options)
  }

  const getFilteredPayments = () => {
    let filtered = payments

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.payment_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.paid_to?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Client filter
    if (clientFilter) {
      filtered = filtered.filter(payment => 
        payment.client_id?.toString() === clientFilter
      )
    }

    // Date filter
    if (dateFilter) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.date_created)
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

  const handleNewPayment = () => {
    setSelectedPayment(null)
    setModalMode("create")
    setShowPaymentModal(true)
  }

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment)
    setModalMode("view")
    setShowPaymentModal(true)
  }

  const handleEditPayment = (payment: Payment) => {
    setSelectedPayment(payment)
    setModalMode("edit")
    setShowPaymentModal(true)
  }

  const handleDeletePayment = async (payment: Payment) => {
    if (window.confirm(`Are you sure you want to delete payment ${payment.payment_number}?`)) {
      try {
        const { error } = await supabase
          .from("payments")
          .delete()
          .eq("id", payment.id)

        if (error) throw error

        toast.success("Payment deleted successfully")
        onRefresh()
      } catch (error) {
        console.error("Error deleting payment:", error)
        toast.error("Failed to delete payment")
      }
    }
  }

  const handleExport = () => {
    exportPayments(getFilteredPayments())
  }

  const handleSavePayment = (payment: any) => {
    onRefresh()
    setShowPaymentModal(false)
  }

  const filteredPayments = getFilteredPayments()

  return (
    <div className="card">
      <div>
        {/* Enhanced Search and Filter Row */}
        <SearchFilterRow
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search payments..."
          firstFilter={{
            value: clientFilter,
            onChange: setClientFilter,
            options: clientOptions,
            placeholder: "All Clients"
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
          onExport={handleExport}
          exportLabel="Export"
        />

        {/* Payments Table */}
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Payment #</th>
                <th>Client</th>
                <th>Date</th>
                <th>Paid To</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Account Credited</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4">
                    <div className="text-muted">
                      {searchTerm || clientFilter || dateFilter
                        ? "No payments found matching your criteria"
                        : "No payments found"}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="fw-bold">{payment.payment_number}</td>
                    <td>{payment.client?.name || "Unknown"}</td>
                    <td>{new Date(payment.date_created).toLocaleDateString()}</td>
                    <td>{payment.paid_to || "-"}</td>
                    <td>{payment.description || "-"}</td>
                    <td className="fw-bold text-success">
                      KES {payment.amount.toFixed(2)}
                    </td>
                    <td>{payment.account_credited || "-"}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-sm action-btn"
                          onClick={() => handleViewPayment(payment)}
                          title="View"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="btn btn-sm action-btn"
                          onClick={() => handleEditPayment(payment)}
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="btn btn-sm action-btn"
                          onClick={() => handleDeletePayment(payment)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
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
        <PaymentModal
          payment={selectedPayment}
          mode={modalMode}
          onClose={() => setShowPaymentModal(false)}
          onSave={handleSavePayment}
          clients={clients}
          invoices={invoices}
        />
      )}
    </div>
  )
}

export default MakePaymentView
