"use client"

import type React from "react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

const Sidebar = () => {
  const [activeSection, setActiveSection] = useState("register")
  const pathname = usePathname()

  useEffect(() => {
    // Set active section based on current path
    if (pathname === "/") {
      setActiveSection("register")
    } else {
      const path = pathname.split("/")[1]
      setActiveSection(path || "register")
    }
  }, [pathname])

  const handleSectionClick = (section: string) => {
    setActiveSection(section)
    localStorage.setItem("activeSection", section)
  }

  return (
    <div className="col-md-2 sidebar">
      <h3>
        <i className="fas fa-chart-line me-2"></i>
        Dashboard
      </h3>
      <nav className="nav flex-column">
        <SidebarLink
          href="/register"
          label="Register"
          icon="fas fa-user-plus"
          isActive={activeSection === "register" || pathname === "/"}
          onClick={() => handleSectionClick("register")}
        />
        <SidebarLink
          href="/sales"
          label="Sales"
          icon="fas fa-cart-shopping"
          isActive={activeSection === "sales"}
          onClick={() => handleSectionClick("sales")}
        />
        <SidebarLink
          href="/payments"
          label="Payments"
          icon="fas fa-money-bill-alt"
          isActive={activeSection === "payments"}
          onClick={() => handleSectionClick("payments")}
        />
        <SidebarLink
          href="/expenses"
          label="Expenses"
          icon="fas fa-money-bill-wave"
          isActive={activeSection === "expenses"}
          onClick={() => handleSectionClick("expenses")}
        />
        <SidebarLink
          href="/purchases"
          label="Purchases"
          icon="fas fa-shopping-basket"
          isActive={activeSection === "purchases"}
          onClick={() => handleSectionClick("purchases")}
        />
        <SidebarLink
          href="/stock"
          label="Stock"
          icon="fas fa-boxes"
          isActive={activeSection === "stock"}
          onClick={() => handleSectionClick("stock")}
        />
        <SidebarLink
          href="/reports"
          label="Reports"
          icon="fas fa-file-alt"
          isActive={activeSection === "reports"}
          onClick={() => handleSectionClick("reports")}
        />
        <SidebarLink
          href="/analytics"
          label="Analytics"
          icon="fas fa-chart-bar"
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
  icon: string
  isActive?: boolean
  onClick?: () => void
}

const SidebarLink = ({ href, label, icon, isActive, onClick }: SidebarLinkProps) => {
  return (
    <Link href={href} className={`nav-link ${isActive ? "active" : ""}`} onClick={onClick}>
      <i className={icon}></i>
      <span>{label}</span>
    </Link>
  )
}

export default Sidebar
