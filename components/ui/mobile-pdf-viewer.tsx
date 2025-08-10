"use client"

import React, { useState, useEffect, useRef } from "react"
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
  const timerRef = useRef<number | null>(null)
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false)
  const viewerRef = useRef<HTMLDivElement | null>(null)
  const [usePdfjs, setUsePdfjs] = useState<boolean>(false)

  // Ensure component only renders on client side
  useEffect(() => {
    setIsClient(true)
    // Debug log the PDF URL (only in development)
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('Mobile PDF Viewer - PDF URL:', pdfUrl)
    }
    // If on mobile, skip iframe entirely and show fallback immediately (most mobile browsers don't render PDFs in iframes)
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase()
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)
      if (isMobile) {
        setIframeError(true)
        setUsePdfjs(true)
      }
    }
  }, [pdfUrl])

  // When using pdfjs inline renderer (mobile), render into canvases
  useEffect(() => {
    let canceled = false
    if (usePdfjs && isClient && pdfUrl && viewerRef.current) {
      ;(async () => {
        try {
          // Capture container synchronously to avoid it becoming null after awaits
          const container = viewerRef.current
          if (!container) return

          // Use the standard build entry; avoid legacy which pulls 'canvas'
          const pdfjsLib = await import('pdfjs-dist/build/pdf.js')
          // Use local worker to avoid CORS
          pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`
          const loadingTask = pdfjsLib.getDocument({ url: pdfUrl })
          const pdf = await loadingTask.promise
          if (canceled || !container.isConnected) return
          container.innerHTML = ''
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum)
            if (canceled || !container.isConnected) return
            const viewport = page.getViewport({ scale: Math.min((typeof window !== 'undefined' ? window.innerWidth - 24 : 360) / page.getViewport({ scale: 1 }).width, 1.3) })
            const canvas = document.createElement('canvas')
            const context = canvas.getContext('2d')!
            canvas.width = viewport.width
            canvas.height = viewport.height
            canvas.style.marginBottom = '12px'
            container.appendChild(canvas)
            await page.render({ canvasContext: context, viewport }).promise
          }
        } catch (e) {
          // Fallback silently; controls still allow Open Full
          console.error('PDFJS inline render failed', e)
        }
      })()
    }
    return () => { canceled = true }
  }, [usePdfjs, isClient, pdfUrl])

  // Set a timeout to show fallback if iframe doesn't load within 3 seconds
  useEffect(() => {
    if (!pdfUrl || !isClient) return
    // If already using pdf.js or iframe already errored, skip timer
    if (usePdfjs || iframeError) return
    const userAgent = navigator.userAgent.toLowerCase()
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    // On mobile we switch to pdf.js immediately; no need for a timer or warning
    if (isMobile) return

    // Desktop safety timer; if iframe doesn't load, flip to fallback
    timerRef.current = window.setTimeout(() => {
      if (!iframeLoaded) {
        setIframeError(true)
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
          console.warn('Mobile PDF Viewer - Fallback shown (iframe did not load in time)')
        }
      }
    }, 5000) as unknown as number

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [pdfUrl, isClient, iframeLoaded])

  const handleOpenInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank')
    }
  }

  const handleToggleFullscreen = () => {
    setFullscreen(!fullscreen)
  }

  const isMobileDevice = () => {
    if (typeof navigator === 'undefined') return false
    const ua = navigator.userAgent.toLowerCase()
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)
  }

  const handleOpenFullClick = () => {
    if (isMobileDevice()) {
      // On mobile, stay in-app and use fullscreen instead of opening a new tab
      setUsePdfjs(true)
      setIframeError(true)
      setFullscreen(true)
      return
    }
    handleOpenInNewTab()
  }

  const handlePrintClick = () => {
    if (isMobileDevice()) {
      // Create a print-friendly window with canvas images
      const container = viewerRef.current
      if (!container) {
        // Fallback to parent handler if canvases are not available
        onPrint && onPrint()
        return
      }
      const canvases = Array.from(container.querySelectorAll('canvas')) as HTMLCanvasElement[]
      if (canvases.length === 0) {
        // Ensure we render via pdfjs then try again
        setUsePdfjs(true)
        setIframeError(true)
        onPrint && onPrint()
        return
      }
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        onPrint && onPrint()
        return
      }
      const htmlParts: string[] = []
      for (const c of canvases) {
        try {
          const dataUrl = c.toDataURL('image/png')
          htmlParts.push(`<img src="${dataUrl}" style="width:100%; display:block; page-break-after:always;" />`)
        } catch {}
      }
      printWindow.document.write(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Print</title>
        <style>@page{ margin:0 } body{ margin:0; background:#fff } img{ -webkit-user-select:none; user-select:none; }</style>
      </head><body>${htmlParts.join('')}</body></html>`)
      printWindow.document.close()
      // Give the browser a moment to layout images before printing
      setTimeout(() => {
        try { printWindow.focus(); printWindow.print(); } catch {}
      }, 300)
      return
    }
    // Desktop: delegate
    onPrint && onPrint()
  }

  const handleIframeError = () => {
    setIframeError(true)
    console.error('Mobile PDF Viewer - Iframe failed to load PDF')
  }

  const handleIframeLoad = () => {
    setIframeLoaded(true)
    setIframeError(false)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
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
          onClick={handleOpenFullClick}
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
            onClick={handlePrintClick}
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
        {!iframeError && !usePdfjs ? (
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
            sandbox="allow-scripts allow-same-origin allow-downloads"
            onError={handleIframeError}
            onLoad={handleIframeLoad}
          />
        ) : (
          <div className="h-100 w-100 overflow-auto d-flex flex-column align-items-center">
            <div ref={viewerRef} className="w-100 d-flex flex-column align-items-center p-2" />
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
