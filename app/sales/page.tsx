"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { FileText, ShoppingCart, Receipt, DollarSign } from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"
import QuotationsView from "./components/quotations-view"
import SalesOrdersView from "./components/sales-orders-view"
import InvoicesView from "./components/invoices-view"
import CashSalesView from "./components/cash-sales-view"

const SalesPage = () => {
  const searchParams = useSearchParams()
  const [activeView, setActiveView] = useState<"quotations" | "orders" | "invoices" | "cash">("quotations")

  // Handle URL tab parameter
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['quotations', 'orders', 'invoices', 'cash'].includes(tab)) {
      setActiveView(tab as "quotations" | "orders" | "invoices" | "cash")
    }
  }, [searchParams])

  const renderActiveView = () => {
    switch (activeView) {
      case "quotations":
        return <QuotationsView />
      case "orders":
        return <SalesOrdersView />
      case "invoices":
        return <InvoicesView />
      case "cash":
        return <CashSalesView />
      default:
        return <QuotationsView />
    }
  }

  return (
    <div id="salesSection">
      {/* Main Header Card with Navigation */}
      <div className="card">
        <SectionHeader 
          title="Sales Management" 
          icon={<ShoppingCart size={20} />}
        >
          <button
            className={`btn-add ${activeView === "quotations" ? "active" : ""}`}
            onClick={() => setActiveView("quotations")}
          >
            <FileText size={16} className="me-1" />
            Quotation
          </button>
          <button
            className={`btn-add ${activeView === "orders" ? "active" : ""}`}
            onClick={() => setActiveView("orders")}
          >
            <ShoppingCart size={16} className="me-1" />
            Sales Order
          </button>
          <button
            className={`btn-add ${activeView === "invoices" ? "active" : ""}`}
            onClick={() => setActiveView("invoices")}
          >
            <Receipt size={16} className="me-1" />
            Invoice
          </button>
          <button
            className={`btn-add ${activeView === "cash" ? "active" : ""}`}
            onClick={() => setActiveView("cash")}
          >
            <DollarSign size={16} className="me-1" />
            Cash Sale
          </button>
        </SectionHeader>
        {/* Active View Content */}
      {renderActiveView()}
      </div>

      
    </div>
  )
}

export default SalesPage
