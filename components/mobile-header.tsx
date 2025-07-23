"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

const MobileHeader = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()
  const [currentPage, setCurrentPage] = useState("")

  useEffect(() => {
    // Set current page based on pathname
    const path = pathname.split("/")[1] || "register"
    setCurrentPage(path)
  }, [pathname])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
    const sidebar = document.querySelector('.sidebar') as HTMLElement
    const overlay = document.getElementById('mobileOverlay') as HTMLElement
    
    if (sidebar && overlay) {
      if (!isSidebarOpen) {
        sidebar.classList.add('show')
        overlay.classList.add('show')
        document.body.style.overflow = 'hidden'
      } else {
        sidebar.classList.remove('show')
        overlay.classList.remove('show')
        document.body.style.overflow = 'auto'
      }
    }
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
    const sidebar = document.querySelector('.sidebar') as HTMLElement
    const overlay = document.getElementById('mobileOverlay') as HTMLElement
    
    if (sidebar && overlay) {
      sidebar.classList.remove('show')
      overlay.classList.remove('show')
      document.body.style.overflow = 'auto'
    }
  }

  // Close sidebar when clicking overlay
  useEffect(() => {
    const overlay = document.getElementById('mobileOverlay')
    if (overlay) {
      overlay.addEventListener('click', closeSidebar)
      return () => overlay.removeEventListener('click', closeSidebar)
    }
  }, [])

  const getPageTitle = (path: string) => {
    const titles: { [key: string]: string } = {
      register: "Register",
      sales: "Sales",
      payments: "Payments",
      expenses: "Expenses",
      purchases: "Purchases",
      stock: "Stock",
      reports: "Reports",
      analytics: "Analytics"
    }
    return titles[path] || "Dashboard"
  }

  return (
    <header className="mobile-header">
      <div className="mobile-header-content">
        <button 
          className="mobile-menu-btn"
          onClick={toggleSidebar}
          aria-label="Toggle menu"
        >
          <i className="fas fa-bars"></i>
        </button>
        
        <div className="mobile-page-title">
          <h1>{getPageTitle(currentPage)}</h1>
        </div>
        
        <div className="mobile-actions">
          <button className="mobile-action-btn" aria-label="Notifications">
            <i className="fas fa-bell"></i>
          </button>
        </div>
      </div>
    </header>
  )
}

export default MobileHeader 