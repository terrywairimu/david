"use client"

import { useState, useEffect } from "react"
import { CreditCard, DollarSign, Receipt } from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"
import { supabase, type Payment, type RegisteredEntity, type Invoice } from "@/lib/supabase-client"
import { toast } from "sonner"
import MakePaymentView from "./components/make-payment-view"
import AccountSummaryView from "./components/account-summary-view"

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [clients, setClients] = useState<RegisteredEntity[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<"make-payment" | "account-summary">("make-payment")

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

  const renderActiveView = () => {
    switch (activeView) {
      case "make-payment":
        return <MakePaymentView 
          clients={clients} 
          invoices={invoices} 
          payments={payments} 
          loading={loading}
          onRefresh={handleRefresh} 
        />
      case "account-summary":
        return <AccountSummaryView 
          clients={clients} 
          payments={payments} 
          loading={loading}
          onRefresh={handleRefresh} 
        />
      default:
        return <MakePaymentView 
          clients={clients} 
          invoices={invoices} 
          payments={payments} 
          loading={loading}
          onRefresh={handleRefresh} 
        />
    }
  }

  return (
    <div id="paymentsSection">
      {/* Main Header Card with Navigation */}
      <div className="card">
        <SectionHeader 
          title="Payments Management" 
          icon={<CreditCard size={20} />}
        >
          <button
            className={`btn-add ${activeView === "make-payment" ? "active" : ""}`}
            onClick={() => setActiveView("make-payment")}
          >
            <DollarSign size={16} className="me-1" />
            Make Payment
          </button>
          <button
            className={`btn-add ${activeView === "account-summary" ? "active" : ""}`}
            onClick={() => setActiveView("account-summary")}
          >
            <Receipt size={16} className="me-1" />
            Account Summary
          </button>
        </SectionHeader>
        
        {/* Active View Content */}
        <div className="card-body p-0">
         {renderActiveView()}
        </div>
      </div>
    </div>
  )
}
