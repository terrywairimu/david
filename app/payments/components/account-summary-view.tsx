"use client"

import { useState, useEffect } from "react"
import { Eye, Download, CreditCard, TrendingUp, DollarSign, Calendar } from "lucide-react"
import { supabase, type Payment, type RegisteredEntity } from "@/lib/supabase-client"
import { toast } from "sonner"
import SearchFilterRow from "@/components/ui/search-filter-row"
import { exportPayments } from "@/lib/workflow-utils"

const AccountSummaryView = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [clients, setClients] = useState<RegisteredEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [clientFilter, setClientFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [specificDate, setSpecificDate] = useState("")
  const [periodStartDate, setPeriodStartDate] = useState("")
  const [periodEndDate, setPeriodEndDate] = useState("")
  const [clientOptions, setClientOptions] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    fetchData()
    
    // Set up real-time subscription for payments
    const paymentsSubscription = supabase
      .channel('account_summary_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, (payload) => {
        console.log('Payments change detected:', payload)
        fetchPayments() // Refresh payments when changes occur
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registered_entities' }, (payload) => {
        console.log('Registered entities change detected:', payload)
        fetchClients() // Refresh clients when changes occur
      })
      .subscribe()

    return () => {
      supabase.removeChannel(paymentsSubscription)
    }
  }, [])

  useEffect(() => {
    setupClientOptions()
  }, [clients])

  const fetchData = async () => {
    await Promise.all([fetchPayments(), fetchClients()])
    setLoading(false)
  }

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          client:registered_entities(*)
        `)
        .order("date_created", { ascending: false })

      if (error) {
        console.error("Error fetching payments:", error)
        toast.error("Failed to load payments")
      } else {
        setPayments(data || [])
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
      toast.error("Failed to load payments")
    }
  }

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("registered_entities")
        .select("*")
        .eq("type", "client")
        .order("name")

      if (error) {
        console.error("Error fetching clients:", error)
      } else {
        setClients(data || [])
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
    }
  }

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

  const handleExport = () => {
    exportPayments(getFilteredPayments())
  }

  const filteredPayments = getFilteredPayments()
  const totalPayments = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0)
  const completedPayments = filteredPayments.filter(p => p.status === "completed")
  const pendingPayments = filteredPayments.filter(p => p.status === "pending")

  // Calculate payments by method
  const paymentsByMethod = filteredPayments.reduce((acc, payment) => {
    acc[payment.payment_method] = (acc[payment.payment_method] || 0) + payment.amount
    return acc
  }, {} as Record<string, number>)

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading account summary...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card text-white bg-primary">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <DollarSign size={24} />
                </div>
                <div>
                  <div className="small">Total Payments</div>
                  <div className="h5 mb-0">KES {totalPayments.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-success">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <div className="small">Completed</div>
                  <div className="h5 mb-0">{completedPayments.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-warning">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <Calendar size={24} />
                </div>
                <div>
                  <div className="small">Pending</div>
                  <div className="h5 mb-0">{pendingPayments.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-info">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <CreditCard size={24} />
                </div>
                <div>
                  <div className="small">Average Payment</div>
                  <div className="h5 mb-0">
                    KES {filteredPayments.length > 0 ? (totalPayments / filteredPayments.length).toFixed(2) : '0.00'}
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
        exportLabel="Export Account Summary"
      />

      {/* Payment Methods Breakdown */}
      <div className="row mb-4">
        <div className="col-md-12">
      <div className="card">
        <div className="card-header">
              <h5 className="card-title mb-0">Payment Methods Breakdown</h5>
            </div>
            <div className="card-body">
              <div className="row">
                {Object.entries(paymentsByMethod).map(([method, amount]) => (
                  <div key={method} className="col-md-4 mb-3">
                    <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                      <span className="fw-bold text-capitalize">{method.replace('_', ' ')}</span>
                      <span className="text-success fw-bold">KES {amount.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Summary Table */}
          <div className="table-responsive">
        <table className="table table-hover">
              <thead>
                <tr>
                  <th>Payment #</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
              <th>Status</th>
              <th>Reference</th>
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
                  <td className="fw-bold text-success">
                    KES {payment.amount.toFixed(2)}
                  </td>
                  <td>
                    <span className={`badge ${getPaymentMethodBadgeClass(payment.payment_method)}`}>
                      {payment.payment_method.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td>{payment.reference || "-"}</td>
                  <td>
                    <button
                      className="btn btn-sm action-btn"
                      title="View Details"
                    >
                      <Eye size={14} />
                    </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
      </div>
    </div>
  )
}

const getPaymentMethodBadgeClass = (method: string) => {
  switch (method) {
    case 'cash':
      return 'bg-success'
    case 'card':
      return 'bg-info'
    case 'bank_transfer':
      return 'bg-primary'
    case 'mobile':
      return 'bg-warning'
    case 'cheque':
      return 'bg-secondary'
    default:
      return 'bg-secondary'
  }
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-success'
    case 'pending':
      return 'bg-warning'
    case 'failed':
      return 'bg-danger'
    default:
      return 'bg-secondary'
  }
}

export default AccountSummaryView
