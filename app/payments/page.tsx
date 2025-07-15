"use client"
import { useState, useEffect } from "react"
import { CreditCard, FileText } from "lucide-react"
import { supabase, type Payment, type RegisteredEntity, type Invoice } from "@/lib/supabase-client"
import { toast } from "sonner"
import MakePaymentView from "./components/make-payment-view"
import AccountSummaryView from "./components/account-summary-view"

const PaymentsPage = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [clients, setClients] = useState<RegisteredEntity[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<"make-payment" | "account-summary">("make-payment")

  useEffect(() => {
    fetchPayments()
    fetchClients()
    fetchInvoices()
  }, [])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          client:registered_entities(*),
          invoice:invoices(*)
        `)
        .order("date_paid", { ascending: false })

      if (error) {
        console.error("Error fetching payments:", error)
        toast.error("Failed to fetch payments")
      } else {
        setPayments(data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase.from("registered_entities").select("*").eq("type", "client").order("name")

      if (error) {
        console.error("Error fetching clients:", error)
      } else {
        setClients(data || [])
      }
    } catch (error) {
      console.error("Unexpected error:", error)
    }
  }

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .in("status", ["pending", "overdue"])
        .order("date_created", { ascending: false })

      if (error) {
        console.error("Error fetching invoices:", error)
      } else {
        setInvoices(data || [])
      }
    } catch (error) {
      console.error("Unexpected error:", error)
    }
  }

  const renderActiveView = () => {
    switch (activeView) {
      case "make-payment":
        return <MakePaymentView clients={clients} invoices={invoices} fetchPayments={fetchPayments} />
      case "account-summary":
        return <AccountSummaryView payments={payments} invoices={invoices} />
      default:
        return <MakePaymentView clients={clients} invoices={invoices} fetchPayments={fetchPayments} />
    }
  }

  return (
    <div id="paymentsSection">
      {/* Main Header Card with Navigation */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="mb-0">
            <CreditCard className="me-2" size={20} />
            Payments Management
          </h4>
          {/* Navigation Tabs in Header */}
          <div className="d-flex gap-2">
            <button
              className={`btn-add ${activeView === "make-payment" ? "active" : ""}`}
              onClick={() => setActiveView("make-payment")}
            >
              <CreditCard size={16} className="me-1" />
              Make Payment
            </button>
            <button
              className={`btn-add ${activeView === "account-summary" ? "active" : ""}`}
              onClick={() => setActiveView("account-summary")}
            >
              <FileText size={16} className="me-1" />
              Account Summary
            </button>
          </div>
        </div>
      </div>

      {/* Active View Content */}
      {renderActiveView()}
    </div>
  )
}

export default PaymentsPage
