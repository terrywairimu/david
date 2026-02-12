"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Eye, Download, CreditCard } from "lucide-react"
import { supabase, type Payment, type RegisteredEntity, type Invoice } from "@/lib/supabase-client"
import { useAuth } from "@/lib/auth-context"
import { ActionGuard } from "@/components/ActionGuard"
import { toast } from "sonner"
import SearchFilterRow from "@/components/ui/search-filter-row"
import { exportPaymentsReport } from "@/lib/workflow-utils"
import { generatePaymentReceiptTemplate } from "@/lib/report-pdf-templates"
import PaymentModal from "@/components/ui/payment-modal"
import { useGlobalProgress } from "@/components/GlobalProgressManager"

interface ReceivePaymentViewProps {
  clients: RegisteredEntity[]
  invoices: Invoice[]
  payments: Payment[]
  loading: boolean
  onRefresh: () => void
}

const ReceivePaymentView = ({ clients, invoices, payments, loading, onRefresh }: ReceivePaymentViewProps) => {
  const { canPerformAction } = useAuth()
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
  
  // Global Progress Manager
  const { startDownload, completeDownload, setError } = useGlobalProgress()

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

  const handleExport = (format: 'pdf' | 'csv') => {
    // Start modern progress bar for bulk export
    startDownload(`received_payments_report_${new Date().toISOString().split('T')[0]}`, format)
    
    try {
      exportPaymentsReport(getFilteredPayments(), format)
      // Complete progress after a short delay to simulate processing
      setTimeout(() => {
        completeDownload()
      }, 1500)
    } catch (error) {
      setError('Failed to export received payments report')
    }
  }

  const handleExportSinglePayment = async (payment: Payment) => {
    try {
      // Start modern progress bar
      startDownload(`payment_${payment.payment_number}_receipt`, 'pdf')
      
      // Generate the professional receipt template with Inter fonts
      const { template, inputs, fontOptions } = await generatePaymentReceiptTemplate(payment)
      
      // Generate and download the PDF with Inter fonts
      const { generate } = await import('@pdfme/generator')
      const { text, rectangle, line, image } = await import('@pdfme/schemas')
      const pdf = await generate({ 
        template, 
        inputs, 
        plugins: { text, rectangle, line, image } as any,
        options: fontOptions
      })
      
      // Download PDF
      const blob = new Blob([new Uint8Array(pdf.buffer)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `payment_${payment.payment_number}_receipt.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      // Complete progress and show success
      completeDownload()
      toast.success('Payment receipt downloaded successfully with Inter fonts!')
    } catch (error) {
      console.error('Export error:', error)
      setError('Failed to export payment receipt')
      toast.error('Failed to export payment receipt')
    }
  }

  const handleSavePayment = (payment: any) => {
    onRefresh()
    setShowPaymentModal(false)
  }

  const filteredPayments = getFilteredPayments()

  return (
    <div className="card">
      <div>
        {/* Add New Payment Button */}
        <div className="d-flex mb-3">
          <ActionGuard actionId="add">
            <button className="btn-add" onClick={() => setShowPaymentModal(true)}>
              <Plus size={16} className="me-2" />
              Add New Received Payment
            </button>
          </ActionGuard>
        </div>

        {/* Enhanced Search and Filter Row */}
        <SearchFilterRow
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search received payments..."
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
          onExport={canPerformAction("export") ? handleExport : undefined}
          exportLabel="Export"
        />

        {/* Payments Table */}
        <div className="responsive-table-wrapper">
          <table className="table table-hover">
            <thead>
              <tr>
                <th className="col-number">Payment #</th>
                <th className="col-client">Client</th>
                <th className="col-date">Date</th>
                <th className="col-client">Paid To</th>
                <th className="col-description">Description</th>
                <th className="col-amount">Amount</th>
                <th className="col-client">Account Credited</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-4">
                    <div className="text-muted">Loading received payments...</div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4">
                    <div className="text-muted">
                      {searchTerm || clientFilter || dateFilter
                        ? "No received payments found matching your criteria"
                        : "No received payments found"}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="fw-bold">{payment.payment_number}</td>
                    <td>{payment.client?.name || "-"}</td>
                    <td>{new Date(payment.date_created).toLocaleDateString()}</td>
                    <td>{payment.paid_to || "-"}</td>
                    <td>{payment.description || "-"}</td>
                    <td className="fw-bold text-success">
                      KES {payment.amount.toFixed(2)}
                    </td>
                    <td>{payment.account_credited || "-"}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <ActionGuard actionId="view">
                          <button
                            className="btn btn-sm action-btn"
                            onClick={() => handleViewPayment(payment)}
                            title="View"
                          >
                            <Eye size={14} />
                          </button>
                        </ActionGuard>
                        <ActionGuard actionId="edit">
                          <button
                            className="btn btn-sm action-btn"
                            onClick={() => handleEditPayment(payment)}
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                        </ActionGuard>
                        <ActionGuard actionId="delete">
                          <button
                            className="btn btn-sm action-btn text-danger"
                            onClick={() => handleDeletePayment(payment)}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </ActionGuard>
                        <ActionGuard actionId="export">
                          <button
                            className="btn btn-sm action-btn"
                            onClick={() => handleExportSinglePayment(payment)}
                            title="Download Receipt"
                          >
                            <Download size={14} />
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

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          payment={selectedPayment}
          mode={modalMode}
            onClose={() => {
              setShowPaymentModal(false)
              setSelectedPayment(null)
              setModalMode("create")
            }}
          onSave={handleSavePayment}
          clients={clients}
          invoices={invoices}
        />
      )}
      

      </div>
    </div>
  )
}

export default ReceivePaymentView
