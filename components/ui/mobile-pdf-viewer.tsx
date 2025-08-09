"use client"

import React, { useState, useEffect } from "react"
import { Download, Printer, Share2, ExternalLink, RotateCw } from "lucide-react"
import { toast } from "sonner"

interface MobilePDFViewerProps {
  pdfUrl: string | null
  quotationNumber: string
  onDownload?: () => void
  onPrint?: () => void
  onShare?: () => void
}

const MobilePDFViewer: React.FC<MobilePDFViewerProps> = ({
  pdfUrl,
  quotationNumber,
  onDownload,
  onPrint,
  onShare
}) => {
  const [isClient, setIsClient] = useState<boolean>(false)
  const [fullscreen, setFullscreen] = useState<boolean>(false)
  const [iframeError, setIframeError] = useState<boolean>(false)

  // Ensure component only renders on client side
  useEffect(() => {
    setIsClient(true)
    // Debug log the PDF URL (only in development)
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('Mobile PDF Viewer - PDF URL:', pdfUrl)
    }
  }, [pdfUrl])

  // Set a timeout to show fallback if iframe doesn't load within 3 seconds
  useEffect(() => {
    if (pdfUrl && isClient) {
      const timer = setTimeout(() => {
        // On mobile, many browsers don't support PDF iframes, so show fallback
        const userAgent = navigator.userAgent.toLowerCase()
        const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
        
        if (isMobile) {
          console.warn('Mobile PDF Viewer - Mobile device detected, showing fallback for better UX')
          setIframeError(true)
        }
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [pdfUrl, isClient])

  const handleOpenInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank')
    }
  }

  const handleToggleFullscreen = () => {
    setFullscreen(!fullscreen)
  }

  const handleIframeError = () => {
    setIframeError(true)
    console.error('Mobile PDF Viewer - Iframe failed to load PDF')
  }

  // Show loading state during SSR or if PDF URL is not available
  if (!isClient || !pdfUrl) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">{!isClient ? "Loading..." : "Generating PDF..."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-pdf-viewer" style={{ width: "100%", height: "100%" }}>
      {/* Action Buttons */}
      <div className="d-flex justify-content-center gap-2 p-3 bg-light border-bottom">
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={handleOpenInNewTab}
        >
          <ExternalLink size={14} className="me-1" />
          Open Full
        </button>
        {onDownload && (
          <button
            className="btn btn-sm btn-primary"
            onClick={onDownload}
          >
            <Download size={14} className="me-1" />
            Download
          </button>
        )}
        {onPrint && (
          <button
            className="btn btn-sm btn-success"
            onClick={onPrint}
          >
            <Printer size={14} className="me-1" />
            Print
          </button>
        )}
        {onShare && navigator.share && (
          <button
            className="btn btn-sm btn-info"
            onClick={onShare}
          >
            <Share2 size={14} className="me-1" />
            Share
          </button>
        )}
      </div>

      {/* Mobile-Optimized PDF Iframe */}
      <div 
        className="pdf-content" 
        style={{ 
          height: fullscreen ? "100vh" : "calc(100% - 80px)",
          width: "100%",
          position: fullscreen ? "fixed" : "relative",
          top: fullscreen ? 0 : "auto",
          left: fullscreen ? 0 : "auto",
          zIndex: fullscreen ? 9999 : "auto",
          backgroundColor: "#f8f9fa"
        }}
      >
        {!iframeError ? (
          <iframe
            src={pdfUrl}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              borderRadius: fullscreen ? "0" : "8px"
            }}
            title={`Quotation ${quotationNumber} PDF`}
            loading="lazy"
            allow="fullscreen"
            onError={handleIframeError}
          />
        ) : (
          <div className="d-flex flex-column justify-content-center align-items-center h-100 text-center p-4">
            <div className="mb-3" style={{ fontSize: "48px", color: "#667eea" }}>📱📄</div>
            <h5 className="mb-3">Mobile PDF Viewer</h5>
            <p className="text-muted mb-4">
              For the best mobile experience, tap <strong>"Open PDF"</strong> to view in your browser's PDF viewer with zoom and navigation controls.
            </p>
            <div className="d-flex gap-2 flex-wrap justify-content-center">
              <button
                className="btn btn-primary btn-lg"
                onClick={handleOpenInNewTab}
              >
                <ExternalLink size={18} className="me-2" />
                Open PDF
              </button>
              {onDownload && (
                <button
                  className="btn btn-outline-secondary"
                  onClick={onDownload}
                >
                  <Download size={16} className="me-1" />
                  Download
                </button>
              )}
            </div>
            <small className="text-muted mt-3">
              💡 Your browser's PDF viewer provides better zoom and navigation on mobile
            </small>
          </div>
        )}
        
        {fullscreen && (
          <button
            className="btn btn-dark position-absolute"
            style={{
              top: "10px",
              right: "10px",
              zIndex: 10000
            }}
            onClick={handleToggleFullscreen}
          >
            ✕
          </button>
        )}
      </div>

      {/* Mobile Tips */}
      <div className="p-2 bg-light border-top">
        <small className="text-muted d-block text-center">
          💡 Tip: Use pinch to zoom, swipe to navigate. Tap "Open Full" for better viewing.
        </small>
      </div>
    </div>
  )
}

export default MobilePDFViewer
