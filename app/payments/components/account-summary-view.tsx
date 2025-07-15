"use client"

import { useEffect, useState } from "react"
import { DollarSign, FileText, AlertCircle, TrendingUp } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"

interface SummaryStats {
  totalPayments: number
  totalInvoices: number
  outstandingAmount: number
  paidAmount: number
}

interface RecentPayment {
  id: number
  payment_number: string
  client_name: string
  amount: number
  payment_method: string
  date_created: string
}

const AccountSummaryView = () => {
  const [stats, setStats] = useState<SummaryStats>({
    totalPayments: 0,
    totalInvoices: 0,
    outstandingAmount: 0,
    paidAmount: 0,
  })
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSummaryData()
  }, [])

  const fetchSummaryData = async () => {
    setLoading(true)
    try {
      // Fetch payments summary
      const { data: paymentsData, error: paymentsError } = await supabase.from("payments").select("amount")

      if (paymentsError) {
        console.error("Error fetching payments:", paymentsError)
      }

      // Fetch invoices summary
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select("total_amount, paid_amount")

      if (invoicesError) {
        console.error("Error fetching invoices:", invoicesError)
      }

      // Fetch recent payments
      const { data: recentData, error: recentError } = await supabase
        .from("payments")
        .select(`
          id,
          payment_number,
          amount,
          payment_method,
          date_created,
          client:registered_entities(name)
        `)
        .order("date_created", { ascending: false })
        .limit(10)

      if (recentError) {
        console.error("Error fetching recent payments:", recentError)
      }

      // Calculate summary stats
      const totalPayments = paymentsData?.reduce((sum, payment) => sum + payment.amount, 0) || 0
      const totalInvoices = invoicesData?.reduce((sum, invoice) => sum + invoice.total_amount, 0) || 0
      const paidAmount = invoicesData?.reduce((sum, invoice) => sum + invoice.paid_amount, 0) || 0
      const outstandingAmount = totalInvoices - paidAmount

      setStats({
        totalPayments,
        totalInvoices,
        outstandingAmount,
        paidAmount,
      })

      // Format recent payments
      const formattedRecentPayments =
        recentData?.map((payment) => ({
          id: payment.id,
          payment_number: payment.payment_number,
          client_name: payment.client?.name || "Unknown",
          amount: payment.amount,
          payment_method: payment.payment_method,
          date_created: payment.date_created,
        })) || []

      setRecentPayments(formattedRecentPayments)
    } catch (error) {
      console.error("Unexpected error:", error)
      toast.error("Failed to fetch summary data")
    } finally {
      setLoading(false)
    }
  }

  const getPaymentMethodBadge = (method: string) => {
    const methodClasses = {
      cash: "badge bg-success",
      card: "badge bg-info",
      bank_transfer: "badge bg-primary",
      mobile: "badge bg-warning",
    }
    return methodClasses[method as keyof typeof methodClasses] || "badge bg-secondary"
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Summary Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card stock-summary-card total-items">
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Total Payments</h6>
                  <h2 className="mb-0">${stats.totalPayments.toFixed(2)}</h2>
                </div>
                <div className="icon-box">
                  <DollarSign size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card stock-summary-card in-stock">
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Total Invoices</h6>
                  <h2 className="mb-0">${stats.totalInvoices.toFixed(2)}</h2>
                </div>
                <div className="icon-box">
                  <FileText size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card stock-summary-card low-stock">
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Outstanding</h6>
                  <h2 className="mb-0">${stats.outstandingAmount.toFixed(2)}</h2>
                </div>
                <div className="icon-box">
                  <AlertCircle size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card stock-summary-card out-of-stock">
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1">Paid Amount</h6>
                  <h2 className="mb-0">${stats.paidAmount.toFixed(2)}</h2>
                </div>
                <div className="icon-box">
                  <TrendingUp size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payments Table */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Recent Payments</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Payment #</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center">
                      No recent payments found
                    </td>
                  </tr>
                ) : (
                  recentPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="fw-bold">{payment.payment_number}</td>
                      <td>{payment.client_name}</td>
                      <td>{new Date(payment.date_created).toLocaleDateString()}</td>
                      <td>${payment.amount.toFixed(2)}</td>
                      <td>
                        <span className={getPaymentMethodBadge(payment.payment_method)}>{payment.payment_method}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountSummaryView
