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
  const { canAccessSettings, profile, needsAdminApproval } = useAuth()
  const canAccess = (sectionId: string) => {
    if (!profile) return false
    if (canAccessSettings) return true
    if (needsAdminApproval) return false
    const sections = profile.sections ?? []
    return sections.includes(sectionId)
  }
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
          <i className={`fas fa-chevron-down purchase-dropdown-arrow ${showAccordion ? 'rotated' : ''}`} 
             style={{ 
               marginLeft: 'auto', 
               transition: 'transform 0.3s ease',
               transform: showAccordion ? 'rotate(180deg)' : 'rotate(0deg)'
             }}></i>
        </div>
        
        {/* Inline Accordion - Outside the nav-link to be part of sidebar flow */}
        {showAccordion && (
          <div 
            className="purchase-inline-accordion" 
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: '0 0 12px 12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              zIndex: 1000,
              overflow: 'hidden',
              animation: 'accordionSlideDown 0.3s ease',
              margin: '0 8px 8px 8px'
            }}
          >
            {/* Credit Section - Partial/No Payment */}
            <div className="accordion-section">
              <div 
                className="accordion-trigger"
                onClick={() => toggleSection('credit')}
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <i className="fas fa-credit-card" style={{ color: '#ff6b6b', width: '16px' }}></i>
                <span style={{ fontSize: '14px', color: 'white', fontWeight: '500' }}>Credit Purchases</span>
                <i className={`fas fa-chevron-down ${activeSection === 'credit' ? 'rotated' : ''}`} 
                   style={{ 
                     marginLeft: 'auto', 
                     fontSize: '12px',
                     transition: 'transform 0.3s ease',
                     transform: activeSection === 'credit' ? 'rotate(180deg)' : 'rotate(0deg)'
                   }}></i>
              </div>
              
                              {activeSection === 'credit' && (
                  <div style={{ padding: '0' }}>
                    <Link
                      href="/purchases?type=credit&view=client"
                      className="accordion-link"
                      style={{
                        display: 'block',
                        padding: '12px 16px',
                        textDecoration: 'none',
                        color: 'white',
                        fontSize: '13px',
                        transition: 'all 0.2s ease',
                        background: 'rgba(255, 107, 107, 0.2)',
                        width: '100%'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 107, 107, 0.3)'
                        e.currentTarget.style.transform = 'translateX(4px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 107, 107, 0.2)'
                        e.currentTarget.style.transform = 'translateX(0)'
                      }}
                    >
                      <i className="fas fa-user" style={{ marginRight: '8px', fontSize: '12px' }}></i>
                      Client Credit
                    </Link>
                    <Link
                      href="/purchases?type=credit&view=general"
                      className="accordion-link"
                      style={{
                        display: 'block',
                        padding: '12px 16px',
                        textDecoration: 'none',
                        color: 'white',
                        fontSize: '13px',
                        transition: 'all 0.2s ease',
                        background: 'rgba(255, 107, 107, 0.2)',
                        width: '100%'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 107, 107, 0.3)'
                        e.currentTarget.style.transform = 'translateX(4px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 107, 107, 0.2)'
                        e.currentTarget.style.transform = 'translateX(0)'
                      }}
                    >
                      <i className="fas fa-building" style={{ marginRight: '8px', fontSize: '12px' }}></i>
                      General Credit
                    </Link>
                  </div>
                )}
            </div>

            {/* Cash Section - Full Payment */}
            <div className="accordion-section">
              <div 
                className="accordion-trigger"
                onClick={() => toggleSection('cash')}
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <i className="fas fa-dollar-sign" style={{ color: '#00b894', width: '16px' }}></i>
                <span style={{ fontSize: '14px', color: 'white', fontWeight: '500' }}>Cash Purchases</span>
                <i className={`fas fa-chevron-down ${activeSection === 'cash' ? 'rotated' : ''}`} 
                   style={{ 
                     marginLeft: 'auto', 
                     fontSize: '12px',
                     transition: 'transform 0.3s ease',
                     transform: activeSection === 'cash' ? 'rotate(180deg)' : 'rotate(0deg)'
                   }}></i>
              </div>
              
                              {activeSection === 'cash' && (
                  <div style={{ padding: '0' }}>
                    <Link
                      href="/purchases?type=cash&view=client"
                      className="accordion-link"
                      style={{
                        display: 'block',
                        padding: '12px 16px',
                        textDecoration: 'none',
                        color: 'white',
                        fontSize: '13px',
                        transition: 'all 0.2s ease',
                        background: 'rgba(0, 184, 148, 0.2)',
                        width: '100%'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 184, 148, 0.3)'
                        e.currentTarget.style.transform = 'translateX(4px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 184, 148, 0.2)'
                        e.currentTarget.style.transform = 'translateX(0)'
                      }}
                    >
                      <i className="fas fa-user" style={{ marginRight: '8px', fontSize: '12px' }}></i>
                      Client Cash
                    </Link>
                    <Link
                      href="/purchases?type=cash&view=general"
                      className="accordion-link"
                      style={{
                        display: 'block',
                        padding: '12px 16px',
                        textDecoration: 'none',
                        color: 'white',
                        fontSize: '13px',
                        transition: 'all 0.2s ease',
                        background: 'rgba(0, 184, 148, 0.2)',
                        width: '100%'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 184, 148, 0.3)'
                        e.currentTarget.style.transform = 'translateX(4px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 184, 148, 0.2)'
                        e.currentTarget.style.transform = 'translateX(0)'
                      }}
                    >
                      <i className="fas fa-building" style={{ marginRight: '8px', fontSize: '12px' }}></i>
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
