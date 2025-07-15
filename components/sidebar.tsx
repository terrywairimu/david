"use client"

import type React from "react"
import { Home, UserPlus, ShoppingCart, DollarSign, ShoppingBasket, Boxes, File, BarChart } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

const Sidebar = () => {
  const [activeSection, setActiveSection] = useState("register")
  const pathname = usePathname()

  useEffect(() => {
    // Set active section based on current path
    const path = pathname.split("/")[1] || "register"
    setActiveSection(path)
  }, [pathname])

  const handleSectionClick = (section: string) => {
    setActiveSection(section)
    localStorage.setItem("activeSection", section)
  }

  return (
    <div className="col-md-2 sidebar">
      <h3>
        <Home className="me-2" size={20} />
        Dashboard
      </h3>
      <nav className="nav flex-column">
        <SidebarLink
          href="/"
          label="Register"
          icon={UserPlus}
          isActive={activeSection === "register" || pathname === "/"}
          onClick={() => handleSectionClick("register")}
        />
        <SidebarLink
          href="/sales"
          label="Sales"
          icon={ShoppingCart}
          isActive={activeSection === "sales"}
          onClick={() => handleSectionClick("sales")}
        />
        <SidebarLink
          href="/payments"
          label="Payments"
          icon={DollarSign}
          isActive={activeSection === "payments"}
          onClick={() => handleSectionClick("payments")}
        />
        <SidebarLink
          href="/expenses"
          label="Expenses"
          icon={DollarSign}
          isActive={activeSection === "expenses"}
          onClick={() => handleSectionClick("expenses")}
        />
        <SidebarLink
          href="/purchases"
          label="Purchases"
          icon={ShoppingBasket}
          isActive={activeSection === "purchases"}
          onClick={() => handleSectionClick("purchases")}
        />
        <SidebarLink
          href="/stock"
          label="Stock"
          icon={Boxes}
          isActive={activeSection === "stock"}
          onClick={() => handleSectionClick("stock")}
        />
        <SidebarLink
          href="/reports"
          label="Reports"
          icon={File}
          isActive={activeSection === "reports"}
          onClick={() => handleSectionClick("reports")}
        />
        <SidebarLink
          href="/analytics"
          label="Analytics"
          icon={BarChart}
          isActive={activeSection === "analytics"}
          onClick={() => handleSectionClick("analytics")}
        />
      </nav>
      <div className="text-center text-white-50 small">
        <p className="mb-0">© 2025 Client Management</p>
      </div>
    </div>
  )
}

interface SidebarLinkProps {
  href: string
  label: string
  icon: any
  isActive: boolean
  onClick: () => void
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ href, label, icon: Icon, isActive, onClick }) => {
  return (
    <Link href={href} className={`nav-link ${isActive ? "active" : ""}`} onClick={onClick}>
      <Icon className="me-2" size={20} />
      <span>{label}</span>
    </Link>
  )
}

export default Sidebar
