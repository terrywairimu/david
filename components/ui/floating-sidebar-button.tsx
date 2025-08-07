"use client"

import { useState } from "react"

interface FloatingSidebarButtonProps {
  onToggle: (isOpen: boolean) => void
  isOpen: boolean
}

const FloatingSidebarButton = ({ onToggle, isOpen }: FloatingSidebarButtonProps) => {
  const handleClick = () => {
    onToggle(!isOpen)
  }

  return (
    <button
      onClick={handleClick}
      className="floating-sidebar-button"
      aria-label="Toggle sidebar"
      title="Toggle sidebar"
    >
      <div className="floating-button-content">
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'}`}></i>
      </div>
    </button>
  )
}

export default FloatingSidebarButton
