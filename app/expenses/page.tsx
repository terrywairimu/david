"use client"

import { useState } from "react"
import { User, Building } from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"
import ClientExpensesView from "./components/client-expenses-view"
import CompanyExpensesView from "./components/company-expenses-view"

export default function ExpensesPage() {
  const [activeView, setActiveView] = useState<"client" | "company">("client")

  const renderActiveView = () => {
    switch (activeView) {
      case "client":
        return <ClientExpensesView />
      case "company":
        return <CompanyExpensesView />
      default:
        return <ClientExpensesView />
    }
  }

  return (
    <div id="expensesSection">
      {/* Main Header Card with Navigation */}
      <div className="card">
        <SectionHeader 
          title="Expenses Management" 
          icon={<Building size={20} />}
        >
          <button
            className={`btn-add ${activeView === "client" ? "active" : ""}`}
            onClick={() => setActiveView("client")}
          >
            <User size={16} className="me-1" />
            Client Expenses
          </button>
          <button
            className={`btn-add ${activeView === "company" ? "active" : ""}`}
            onClick={() => setActiveView("company")}
          >
            <Building size={16} className="me-1" />
            Company Expenses
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
