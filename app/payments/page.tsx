"use client"

import { useState, useEffect } from "react"
import { supabase, type Payment, type RegisteredEntity, type Invoice } from "@/lib/supabase-client"
import { toast } from "sonner"
import MakePaymentView from "./components/make-payment-view"
import AccountSummaryView from "./components/account-summary-view"

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [clients, setClients] = useState<RegisteredEntity[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("make-payment")

  useEffect(() => {
    fetchData()
    
    // Set up real-time updates
    const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
    
    return () => clearInterval(interval)
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

  if (loading) {
    return (
      <div className="container-fluid mt-4">
        <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid mt-4" id="paymentsSection">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title mb-0">Payments Management</h4>
            </div>
            
            {/* Tab Navigation */}
            <div className="card-body">
              <div className="d-flex mb-4">
                <button
                  className={`btn btn-add me-2 ${activeTab === "make-payment" ? "active" : ""}`}
                  onClick={() => setActiveTab("make-payment")}
                >
                  Make Payment
                </button>
                <button
                  className={`btn btn-add ${activeTab === "account-summary" ? "active" : ""}`}
                  onClick={() => setActiveTab("account-summary")}
                >
                  Account Summary
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === "make-payment" ? (
                <MakePaymentView
                  clients={clients}
                  invoices={invoices}
                  fetchPayments={handleRefresh}
                />
              ) : (
                <AccountSummaryView
                  clients={clients}
                  payments={payments}
                  onRefresh={handleRefresh}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
