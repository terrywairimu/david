"use client"

import { useState } from "react"
import { FileText, ShoppingCart, Receipt, DollarSign } from "lucide-react"
import QuotationsView from "./components/quotations-view"
import SalesOrdersView from "./components/sales-orders-view"
import InvoicesView from "./components/invoices-view"
import CashSalesView from "./components/cash-sales-view"

const SalesPage = () => {
  const [activeView, setActiveView] = useState<"quotations" | "orders" | "invoices" | "cash">("quotations")

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
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="mb-0">
            <ShoppingCart className="me-2" size={20} />
            Sales Management
          </h4>
          {/* Navigation Tabs in Header */}
          <div className="d-flex gap-2">
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
          </div>
        </div>
      </div>

      {/* Active View Content */}
      {renderActiveView()}
    </div>
  )
}

export default SalesPage
