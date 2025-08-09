"use client"

import React, { useState, useEffect } from "react"
import { X, Download, Printer, Eye, Share2, ChevronRight } from "lucide-react"
import { createPortal } from "react-dom"

interface PrintModalProps {
  isOpen: boolean
  onClose: () => void
  pdfUrl: string | null
  quotationNumber: string
  onDownload: () => void
  onPrint: () => void
  onView: () => void
  onShare?: () => void
}

const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  pdfUrl,
  quotationNumber,
  onDownload,
  onPrint,
  onView,
  onShare
}) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isOpen) return null

  return createPortal(
    <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "400px" }}>
        <div className="modal-content" style={{ borderRadius: "20px", border: "none", boxShadow: "0 20px 60px rgba(0,0,0,0.1)" }}>
          {/* Header */}
          <div className="modal-header border-0" style={{ padding: "24px 24px 16px" }}>
            <div className="d-flex align-items-center">
              <div className="me-3" style={{ 
                width: "48px", 
                height: "48px", 
                borderRadius: "16px", 
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Printer size={24} color="white" />
              </div>
              <div>
                <h5 className="modal-title mb-1 fw-bold" style={{ color: "#ffffff" }}>
                  Print Options
                </h5>
                <p className="mb-0 text-white small">Choose how to handle the quotation</p>
              </div>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              style={{ borderRadius: "12px", padding: "8px" }}
            />
          </div>

          {/* Body */}
          <div className="modal-body" style={{ padding: "0 24px 24px" }}>
            <div className="d-flex flex-column gap-3">
              {/* View PDF Option */}
              <button
                type="button"
                className="btn btn-outline-primary d-flex align-items-center justify-content-between"
                onClick={onView}
                style={{ 
                  borderRadius: "12px", 
                  padding: "16px 20px",
                  border: "1px solid #667eea",
                  background: "transparent",
                  color: "#667eea",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#667eea"
                  e.currentTarget.style.color = "white"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent"
                  e.currentTarget.style.color = "#667eea"
                }}
              >
                <div className="d-flex align-items-center">
                  <Eye size={20} className="me-3" />
                  <div>
                    <div className="fw-semibold">View PDF</div>
                    <div className="small text-muted">Open in browser viewer</div>
                  </div>
                </div>
                <ChevronRight size={16} />
              </button>

              {/* Print Option */}
              <button
                type="button"
                className="btn btn-outline-success d-flex align-items-center justify-content-between"
                onClick={onPrint}
                style={{ 
                  borderRadius: "12px", 
                  padding: "16px 20px",
                  border: "1px solid #28a745",
                  background: "transparent",
                  color: "#28a745",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#28a745"
                  e.currentTarget.style.color = "white"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent"
                  e.currentTarget.style.color = "#28a745"
                }}
              >
                <div className="d-flex align-items-center">
                  <Printer size={20} className="me-3" />
                  <div>
                    <div className="fw-semibold">Print</div>
                    <div className="small text-muted">Send to printer</div>
                  </div>
                </div>
                <ChevronRight size={16} />
              </button>

              {/* Download Option */}
              <button
                type="button"
                className="btn btn-outline-info d-flex align-items-center justify-content-between"
                onClick={onDownload}
                style={{ 
                  borderRadius: "12px", 
                  padding: "16px 20px",
                  border: "1px solid #17a2b8",
                  background: "transparent",
                  color: "#17a2b8",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#17a2b8"
                  e.currentTarget.style.color = "white"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent"
                  e.currentTarget.style.color = "#17a2b8"
                }}
              >
                <div className="d-flex align-items-center">
                  <Download size={20} className="me-3" />
                  <div>
                    <div className="fw-semibold">Download</div>
                    <div className="small text-muted">Save to device</div>
                  </div>
                </div>
                <ChevronRight size={16} />
              </button>

              {/* Share Option (if available) */}
              {onShare && navigator.share && (
                <button
                  type="button"
                  className="btn btn-outline-warning d-flex align-items-center justify-content-between"
                  onClick={onShare}
                  style={{ 
                    borderRadius: "12px", 
                    padding: "16px 20px",
                    border: "1px solid #ffc107",
                    background: "transparent",
                    color: "#ffc107",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#ffc107"
                    e.currentTarget.style.color = "white"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent"
                    e.currentTarget.style.color = "#ffc107"
                  }}
                >
                  <div className="d-flex align-items-center">
                    <Share2 size={20} className="me-3" />
                    <div>
                      <div className="fw-semibold">Share</div>
                      <div className="small text-muted">Share via apps</div>
                    </div>
                  </div>
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer border-0" style={{ padding: "16px 24px 24px" }}>
            <button
              type="button"
              className="btn btn-light"
              onClick={onClose}
              style={{ borderRadius: "12px", padding: "10px 24px" }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default PrintModal
