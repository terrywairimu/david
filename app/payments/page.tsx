"use client"

import { useState, useEffect, useRef } from "react"
import { CreditCard, DollarSign, Receipt, ChevronDown, Building2, User } from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"
import { supabase, type Payment, type RegisteredEntity, type Invoice } from "@/lib/supabase-client"
import { toast } from "sonner"
import MakePaymentView from "./components/make-payment-view"
import ReceivePaymentView from "./components/receive-payment-view"
import AccountSummaryView from "./components/account-summary-view"

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [clients, setClients] = useState<RegisteredEntity[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<"receive-payment" | "make-payment" | "account-summary">("receive-payment")
  const [paymentType, setPaymentType] = useState<"suppliers" | "employees">("suppliers")
  const [showMakePaymentDropdown, setShowMakePaymentDropdown] = useState(false)
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null)


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

    // Click outside handler
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.make-payments-container')) {
        setShowMakePaymentDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      supabase.removeChannel(paymentsSubscription)
      document.removeEventListener('mousedown', handleClickOutside)
      // Cleanup timeout on unmount
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current)
      }
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
      case "receive-payment":
        return <ReceivePaymentView 
          clients={clients} 
          invoices={invoices} 
          payments={payments} 
          loading={loading}
          onRefresh={handleRefresh} 
        />
      case "make-payment":
        return <MakePaymentView 
          paymentType={paymentType}
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
        return <ReceivePaymentView 
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
            className={`btn-add ${activeView === "receive-payment" ? "active" : ""}`}
            onClick={() => setActiveView("receive-payment")}
          >
            <DollarSign size={16} className="me-1" />
            Receive Payments
          </button>
          <div className="make-payments-container">
            <button
              className={`btn-add ${activeView === "make-payment" ? "active" : ""}`}
              onMouseEnter={() => {
                // Clear any existing timeout
                if (dropdownTimeoutRef.current) {
                  clearTimeout(dropdownTimeoutRef.current)
                  dropdownTimeoutRef.current = null
                }
                setShowMakePaymentDropdown(true)
              }}
              onMouseLeave={() => {
                // Add a longer delay before hiding to allow moving to dropdown
                dropdownTimeoutRef.current = setTimeout(() => {
                  setShowMakePaymentDropdown(false)
                }, 300)
              }}
              onClick={(e) => {
                e.stopPropagation()
                setShowMakePaymentDropdown(!showMakePaymentDropdown)
              }}
            >
              <DollarSign size={16} className="me-1" />
              Make Payments
              <ChevronDown size={14} className="ms-1 dropdown-icon" />
            </button>
            
            {showMakePaymentDropdown && (
              <div 
                className="make-payments-dropdown"
                onMouseEnter={() => {
                  // Clear any existing timeout
                  if (dropdownTimeoutRef.current) {
                    clearTimeout(dropdownTimeoutRef.current)
                    dropdownTimeoutRef.current = null
                  }
                  setShowMakePaymentDropdown(true)
                }}
                onMouseLeave={() => {
                  // Add a longer delay before hiding
                  dropdownTimeoutRef.current = setTimeout(() => {
                    setShowMakePaymentDropdown(false)
                  }, 300)
                }}
              >
                <div className="dropdown-item" onClick={() => {
                  setPaymentType("suppliers")
                  setActiveView("make-payment")
                  setShowMakePaymentDropdown(false)
                }}>
                  <Building2 size={16} className="me-2" />
                  To Suppliers
                </div>
                <div className="dropdown-item" onClick={() => {
                  setPaymentType("employees")
                  setActiveView("make-payment")
                  setShowMakePaymentDropdown(false)
                }}>
                  <User size={16} className="me-2" />
                  To Employees
                </div>
              </div>
            )}
          </div>
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
