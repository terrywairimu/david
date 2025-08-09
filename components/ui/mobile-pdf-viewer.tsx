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

  // Ensure component only renders on client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleOpenInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank')
    }
  }

  const handleToggleFullscreen = () => {
    setFullscreen(!fullscreen)
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
        <iframe
          src={`${pdfUrl}#view=FitH&toolbar=1&navpanes=1&scrollbar=1`}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            borderRadius: fullscreen ? "0" : "8px"
          }}
          title={`Quotation ${quotationNumber} PDF`}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-downloads"
        />
        
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
