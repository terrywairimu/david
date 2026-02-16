"use client"

import React from "react"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { LogOut } from "lucide-react"
import FloatingSidebarButton from "./ui/floating-sidebar-button"
import { useAuth } from "@/lib/auth-context"

function SignOutButton() {
  const { user, signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  if (!user) return null
  const handleSignOut = () => {
    if (signingOut) return
    setSigningOut(true)
    signOut()
  }
  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={signingOut}
      className="flex items-center gap-2 text-white-50 hover:text-white text-xs cursor-pointer disabled:opacity-50 transition-colors"
    >
      <LogOut className="w-3.5 h-3.5 shrink-0" />
      <span>{signingOut ? "Signing out..." : "Sign out"}</span>
    </button>
  )
}

const Sidebar = () => {
  const { canAccessSettings, canAccessSection, needsAdminApproval } = useAuth()
  const canAccess = canAccessSection
  const [activeSection, setActiveSection] = useState("register")
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [showPurchaseAccordion, setShowPurchaseAccordion] = useState(false)
  const [isHoveringPurchase, setIsHoveringPurchase] = useState(false)
  const pathname = usePathname()
  const purchaseLinkRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Set active section based on current path
    if (pathname === "/") {
      setActiveSection("register")
    } else {
      const path = pathname.split("/")[1]
      setActiveSection(path || "register")
    }
  }, [pathname])

  useEffect(() => {
    // Close mobile sidebar when route changes
    setIsMobileOpen(false)
  }, [pathname])

  const handleSectionClick = (section: string) => {
    setActiveSection(section)
    localStorage.setItem("activeSection", section)
  }

  const handleMobileToggle = (isOpen: boolean) => {
    setIsMobileOpen(isOpen)
  }

  const handlePurchaseClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowPurchaseAccordion(!showPurchaseAccordion)
  }

  const handlePurchaseMouseEnter = () => {
    setIsHoveringPurchase(true)
    if (!isMobileOpen) {
      setShowPurchaseAccordion(true)
    }
  }

  const handlePurchaseMouseLeave = () => {
    setIsHoveringPurchase(false)
    // Delay closing to allow user to move to accordion
    setTimeout(() => {
      setShowPurchaseAccordion(false)
    }, 300)
  }

  const handleAccordionClose = () => {
    setShowPurchaseAccordion(false)
  }

  return (
    <>
      <div className={`sidebar ${isMobileOpen ? 'show' : ''}`}>
        <h3>
          <i className="fas fa-chart-line me-2"></i>
          Dashboard
        </h3>
        {needsAdminApproval ? (
          <p className="text-white-50 text-sm px-2 py-4">
            Contact the admin to add you.
          </p>
        ) : null}
        <nav className="nav flex-column">
          {canAccess("register") && (
          <SidebarLink
            href="/register"
            label="Register"
            icon="fas fa-user-plus"
            isActive={activeSection === "register" || pathname === "/"}
            onClick={() => handleSectionClick("register")}
          />
          )}
          {canAccess("sales") && (
          <SidebarLink
            href="/sales"
            label="Sales"
            icon="fas fa-cart-shopping"
            isActive={activeSection === "sales"}
            onClick={() => handleSectionClick("sales")}
          />
          )}
          {canAccess("payments") && (
          <SidebarLink
            href="/payments"
            label="Payments"
            icon="fas fa-money-bill-alt"
            isActive={activeSection === "payments"}
            onClick={() => handleSectionClick("payments")}
          />
          )}
          {canAccess("expenses") && (
          <SidebarLink
            href="/expenses"
            label="Expenses"
            icon="fas fa-money-bill-wave"
            isActive={activeSection === "expenses"}
            onClick={() => handleSectionClick("expenses")}
          />
          )}
          {canAccess("purchases") && (
          <PurchaseSidebarLink
            href="/purchases"
            label="Purchases"
            icon="fas fa-shopping-basket"
            isActive={activeSection === "purchases"}
            onClick={handlePurchaseClick}
            onMouseEnter={handlePurchaseMouseEnter}
            onMouseLeave={handlePurchaseMouseLeave}
            ref={purchaseLinkRef}
            showAccordion={showPurchaseAccordion}
          />
          )}
          {canAccess("stock") && (
          <SidebarLink
            href="/stock"
            label="Stock"
            icon="fas fa-boxes"
            isActive={activeSection === "stock"}
            onClick={() => handleSectionClick("stock")}
          />
          )}
          {canAccess("reports") && (
          <SidebarLink
            href="/reports"
            label="Reports"
            icon="fas fa-file-alt"
            isActive={activeSection === "reports"}
            onClick={() => handleSectionClick("reports")}
          />
          )}
          {canAccess("analytics") && (
          <SidebarLink
            href="/analytics"
            label="Analytics"
            icon="fas fa-chart-bar"
            isActive={activeSection === "analytics"}
            onClick={() => handleSectionClick("analytics")}
          />
          )}
          {canAccessSettings && (
            <SidebarLink
              href="/settings"
              label="Settings"
              icon="fas fa-cog"
              isActive={activeSection === "settings"}
              onClick={() => handleSectionClick("settings")}
            />
          )}
        </nav>
        <div className="text-center text-white-50 small mt-auto pt-4 space-y-2">
          <div className="flex justify-center">
            <SignOutButton />
          </div>
          <p className="mb-0 text-xs whitespace-nowrap">© 2026 Business Management</p>
        </div>
      </div>
      
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="mobile-sidebar-overlay"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      {/* Floating button */}
      <FloatingSidebarButton 
        onToggle={handleMobileToggle}
        isOpen={isMobileOpen}
      />

    </>
  )
}

interface SidebarLinkProps {
  href: string
  label: string
  icon: string
  isActive?: boolean
  onClick?: () => void
}

interface PurchaseSidebarLinkProps {
  href: string
  label: string
  icon: string
  isActive?: boolean
  onClick?: (e: React.MouseEvent) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  ref?: React.RefObject<HTMLDivElement>
  showAccordion?: boolean
}

const SidebarLink = ({ href, label, icon, isActive, onClick }: SidebarLinkProps) => {
  return (
    <Link href={href} className={`nav-link ${isActive ? "active" : ""}`} onClick={onClick}>
      <i className={icon}></i>
      <span>{label}</span>
    </Link>
  )
}

const PurchaseSidebarLink = React.forwardRef<HTMLDivElement, PurchaseSidebarLinkProps>(
  ({ href, label, icon, isActive, onClick, onMouseEnter, onMouseLeave, showAccordion }, ref) => {
    const [activeSection, setActiveSection] = React.useState<string | null>(null)

    const toggleSection = (section: string) => {
      setActiveSection(activeSection === section ? null : section)
    }

    return (
      <div 
        style={{ position: 'relative' }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div 
          ref={ref}
          className={`nav-link purchase-nav-link ${isActive ? "active" : ""}`}
          onClick={onClick}
          style={{ position: 'relative' }}
        >
          <i className={icon}></i>
          <span>{label}</span>
          <i className={`fas fa-chevron-down purchase-dropdown-arrow ${showAccordion ? 'rotated' : ''}`}></i>
        </div>
        
        {/* Inline Accordion - matches nav-link design language, flows with sidebar */}
        {showAccordion && (
          <div className="purchase-inline-accordion">
            {/* Credit Section - expands on hover */}
            <div
              className="purchase-accordion-section"
              onMouseEnter={() => setActiveSection('credit')}
              onMouseLeave={() => setActiveSection(null)}
            >
              <div
                role="button"
                tabIndex={0}
                className="purchase-accordion-trigger"
                onClick={() => toggleSection('credit')}
                onKeyDown={(e) => e.key === 'Enter' && toggleSection('credit')}
              >
                <i className="fas fa-credit-card purchase-accordion-icon purchase-accordion-icon-credit"></i>
                <span className="purchase-accordion-trigger-label">Credit Purchases</span>
                <i className={`fas fa-chevron-down purchase-accordion-chevron ${activeSection === 'credit' ? 'rotated' : ''}`}></i>
              </div>
              {activeSection === 'credit' && (
                <div className="purchase-accordion-subs">
                  <Link href="/purchases?type=credit&view=client" className="purchase-accordion-sub-link purchase-accordion-sub-credit">
                    <i className="fas fa-user"></i>
                    Client Credit
                  </Link>
                  <Link href="/purchases?type=credit&view=general" className="purchase-accordion-sub-link purchase-accordion-sub-credit">
                    <i className="fas fa-building"></i>
                    General Credit
                  </Link>
                </div>
              )}
            </div>
            {/* Cash Section - expands on hover */}
            <div
              className="purchase-accordion-section"
              onMouseEnter={() => setActiveSection('cash')}
              onMouseLeave={() => setActiveSection(null)}
            >
              <div
                role="button"
                tabIndex={0}
                className="purchase-accordion-trigger"
                onClick={() => toggleSection('cash')}
                onKeyDown={(e) => e.key === 'Enter' && toggleSection('cash')}
              >
                <i className="fas fa-dollar-sign purchase-accordion-icon purchase-accordion-icon-cash"></i>
                <span className="purchase-accordion-trigger-label">Cash Purchases</span>
                <i className={`fas fa-chevron-down purchase-accordion-chevron ${activeSection === 'cash' ? 'rotated' : ''}`}></i>
              </div>
              {activeSection === 'cash' && (
                <div className="purchase-accordion-subs">
                  <Link href="/purchases?type=cash&view=client" className="purchase-accordion-sub-link purchase-accordion-sub-cash">
                    <i className="fas fa-user"></i>
                    Client Cash
                  </Link>
                  <Link href="/purchases?type=cash&view=general" className="purchase-accordion-sub-link purchase-accordion-sub-cash">
                    <i className="fas fa-building"></i>
                    General Cash
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
)

PurchaseSidebarLink.displayName = "PurchaseSidebarLink"

export default Sidebar
