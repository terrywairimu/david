"use client"

import { useState, useEffect } from "react"
import { CreditCard, Receipt } from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"
import { supabase, type Payment, type RegisteredEntity, type Invoice } from "@/lib/supabase-client"
import { toast } from "sonner"
import MakePaymentView from "./components/make-payment-view"
import AccountSummaryView from "./components/account-summary-view"
import PaymentModal from "@/components/ui/payment-modal"

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [clients, setClients] = useState<RegisteredEntity[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<"make-payment" | "account-summary">("make-payment")
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  useEffect(() => {
    fetchData()
    
    // Set up real-time subscription for payments
    const paymentsSubscription = supabase
      .channel('payments_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, (payload) => {
        console.log('Payments change detected:', payload)
        fetchPayments() // Refresh payments when changes occur
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registered_entities' }, (payload) => {
        console.log('Registered entities change detected:', payload)
        fetchClients() // Refresh clients when changes occur
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, (payload) => {
        console.log('Invoices change detected:', payload)
        fetchInvoices() // Refresh invoices when changes occur
      })
      .subscribe()

    return () => {
      supabase.removeChannel(paymentsSubscription)
    }
  }, [])

  const fetchData = async () => {
    await Promise.all([fetchPayments(), fetchClients(), fetchInvoices()])
  }

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          client:registered_entities(*),
          invoice:invoices(*)
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
    } finally {
      setLoading(false)
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

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("date_created", { ascending: false })

      if (error) {
        console.error("Error fetching invoices:", error)
      } else {
        setInvoices(data || [])
      }
    } catch (error) {
      console.error("Error fetching invoices:", error)
    }
  }

  const handleRefresh = () => {
    fetchData()
  }

  const handleMakePayment = () => {
    setActiveView("make-payment")
    setShowPaymentModal(true)
  }

  const handleSavePayment = (payment: any) => {
    handleRefresh()
    setShowPaymentModal(false)
  }

  const renderActiveView = () => {
    switch (activeView) {
      case "make-payment":
        return <MakePaymentView clients={clients} invoices={invoices} payments={payments} onRefresh={handleRefresh} />
      case "account-summary":
        return <AccountSummaryView clients={clients} payments={payments} onRefresh={handleRefresh} />
      default:
        return <MakePaymentView clients={clients} invoices={invoices} payments={payments} onRefresh={handleRefresh} />
    }
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
    <div id="paymentsSection">
      {/* Main Header Card with Navigation */}
      <div className="card mb-4">
        <SectionHeader title="Payments Management">
          <button
            className={`btn btn-add ${activeView === "make-payment" ? "active" : ""}`}
            onClick={handleMakePayment}
          >
            <CreditCard size={16} className="me-2" />
            Make Payment
          </button>
          <button
            className={`btn btn-add ${activeView === "account-summary" ? "active" : ""}`}
            onClick={() => setActiveView("account-summary")}
          >
            <Receipt size={16} className="me-2" />
            Account Summary
          </button>
        </SectionHeader>
        {/* Active View Content */}
         {renderActiveView()}
         {/* Payment Modal */}
{showPaymentModal && (
  <PaymentModal
    payment={null}
    mode="create"
    onClose={() => setShowPaymentModal(false)}
    onSave={handleSavePayment}
    clients={clients}
    invoices={invoices}
  />
)}
      </div>
    </div>
  )
}
