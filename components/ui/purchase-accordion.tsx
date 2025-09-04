"use client"

import React, { useState, useRef, useEffect } from "react"
import { ChevronDown, ShoppingCart, CreditCard, DollarSign } from "lucide-react"
import Link from "next/link"

interface PurchaseAccordionProps {
  isOpen: boolean
  onClose: () => void
  isMobile?: boolean
  triggerRef?: React.RefObject<HTMLDivElement>
}

const PurchaseAccordion: React.FC<PurchaseAccordionProps> = ({ 
  isOpen, 
  onClose, 
  isMobile = false,
  triggerRef
}) => {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  const accordionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accordionRef.current && !accordionRef.current.contains(event.target as Node) &&
          triggerRef?.current && !triggerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose, triggerRef])

  // Calculate position for desktop
  useEffect(() => {
    if (isOpen && !isMobile && triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }, [isOpen, isMobile, triggerRef])

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section)
  }

  if (!isOpen) return null

  return (
    <div 
      ref={accordionRef}
      className={`purchase-accordion ${isMobile ? 'mobile' : 'desktop'}`}
      onMouseEnter={() => {
        if (!isMobile) {
          // Prevent closing when hovering over accordion
        }
      }}
      onMouseLeave={() => {
        if (!isMobile) {
          // Close when leaving accordion
          setTimeout(() => onClose(), 100)
        }
      }}
      style={{
        position: 'fixed',
        top: isMobile ? '50%' : `${position.top + 8}px`,
        left: isMobile ? '50%' : `${position.left}px`,
        transform: isMobile ? 'translate(-50%, -50%)' : 'none',
        width: isMobile ? '90vw' : '320px',
        maxWidth: isMobile ? '400px' : '320px',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        zIndex: 9999,
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        animation: isMobile ? 'accordionSlideIn' : 'accordionFadeIn'
      }}
    >
      {/* Header */}
      <div className="accordion-header" style={{
        padding: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <ShoppingCart size={24} />
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
          Purchase Options
        </h3>
      </div>

      {/* Accordion Content */}
      <div className="accordion-content" style={{ padding: '0' }}>
        {/* Credit Section */}
        <div className="accordion-section">
          <button
            className="accordion-trigger"
            onClick={() => toggleSection('credit')}
            style={{
              width: '100%',
              padding: '16px 20px',
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              borderBottom: '1px solid #f0f0f0'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f8f9fa'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <CreditCard size={20} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: '600', fontSize: '16px', color: '#2c3e50' }}>
                  Credit Purchases
                </div>
                <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '2px' }}>
                  Partial or no payment
                </div>
              </div>
            </div>
            <ChevronDown 
              size={20} 
              style={{ 
                color: '#7f8c8d',
                transform: activeSection === 'credit' ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }} 
            />
          </button>
          
          {activeSection === 'credit' && (
            <div className="accordion-panel" style={{
              padding: '0 20px 16px 20px',
              animation: 'accordionSlideDown 0.3s ease'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link 
                  href="/purchases?type=credit&view=client" 
                  className="accordion-link"
                  onClick={onClose}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #ff6b6b10 0%, #ee5a2410 100%)',
                    border: '1px solid #ff6b6b20',
                    textDecoration: 'none',
                    color: '#2c3e50',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #ff6b6b20 0%, #ee5a2420 100%)'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #ff6b6b10 0%, #ee5a2410 100%)'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#ff6b6b'
                  }}></div>
                  Client Credit Purchase
                </Link>
                <Link 
                  href="/purchases?type=credit&view=general" 
                  className="accordion-link"
                  onClick={onClose}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #ff6b6b10 0%, #ee5a2410 100%)',
                    border: '1px solid #ff6b6b20',
                    textDecoration: 'none',
                    color: '#2c3e50',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #ff6b6b20 0%, #ee5a2420 100%)'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #ff6b6b10 0%, #ee5a2410 100%)'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#ff6b6b'
                  }}></div>
                  General Credit Purchase
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Cash Section */}
        <div className="accordion-section">
          <button
            className="accordion-trigger"
            onClick={() => toggleSection('cash')}
            style={{
              width: '100%',
              padding: '16px 20px',
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              borderBottom: '1px solid #f0f0f0'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f8f9fa'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #00b894 0%, #00a085 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <DollarSign size={20} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: '600', fontSize: '16px', color: '#2c3e50' }}>
                  Cash Purchases
                </div>
                <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '2px' }}>
                  Full payment at purchase
                </div>
              </div>
            </div>
            <ChevronDown 
              size={20} 
              style={{ 
                color: '#7f8c8d',
                transform: activeSection === 'cash' ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }} 
            />
          </button>
          
          {activeSection === 'cash' && (
            <div className="accordion-panel" style={{
              padding: '0 20px 16px 20px',
              animation: 'accordionSlideDown 0.3s ease'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link 
                  href="/purchases?type=cash&view=client" 
                  className="accordion-link"
                  onClick={onClose}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #00b89410 0%, #00a08510 100%)',
                    border: '1px solid #00b89420',
                    textDecoration: 'none',
                    color: '#2c3e50',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #00b89420 0%, #00a08520 100%)'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #00b89410 0%, #00a08510 100%)'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#00b894'
                  }}></div>
                  Client Cash Purchase
                </Link>
                <Link 
                  href="/purchases?type=cash&view=general" 
                  className="accordion-link"
                  onClick={onClose}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #00b89410 0%, #00a08510 100%)',
                    border: '1px solid #00b89420',
                    textDecoration: 'none',
                    color: '#2c3e50',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #00b89420 0%, #00a08520 100%)'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #00b89410 0%, #00a08510 100%)'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#00b894'
                  }}></div>
                  General Cash Purchase
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '16px 20px',
        background: '#f8f9fa',
        borderTop: '1px solid #e9ecef',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '12px', color: '#6c757d' }}>
          Choose your purchase type
        </div>
      </div>

      <style jsx>{`
        @keyframes accordionSlideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -60%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @keyframes accordionFadeIn {
          from {
            opacity: 0;
            transform: translateY(0);
          }
          to {
            opacity: 1;
            transform: translateY(8px);
          }
        }

        @keyframes accordionSlideDown {
          from {
            opacity: 0;
            max-height: 0;
            padding-top: 0;
            padding-bottom: 0;
          }
          to {
            opacity: 1;
            max-height: 200px;
            padding-top: 0;
            padding-bottom: 16px;
          }
        }

        .purchase-accordion.mobile {
          animation: accordionSlideIn 0.3s ease;
        }

        .purchase-accordion.desktop {
          animation: accordionFadeIn 0.3s ease;
        }
      `}</style>
    </div>
  )
}

export default PurchaseAccordion
