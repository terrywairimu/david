"use client"

import { useState } from "react"
import { CreditCard, DollarSign, Receipt } from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"
import MakePaymentView from "./components/make-payment-view"
import AccountSummaryView from "./components/account-summary-view"

export default function PaymentsPage() {
  const [activeView, setActiveView] = useState<"make-payment" | "account-summary">("make-payment")

  const renderActiveView = () => {
    switch (activeView) {
      case "make-payment":
        return <MakePaymentView />
      case "account-summary":
        return <AccountSummaryView />
      default:
        return <MakePaymentView />
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
