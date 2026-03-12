"use client"

import React, { useState, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { Palette, Image as ImageIcon, Download, Trash2, Upload, GripVertical, Plus } from "lucide-react"
import { generateImageToPdf, type ImageToPdfPage } from "@/lib/image-to-pdf"
import { toast } from "sonner"
import { useGlobalProgress } from "@/components/GlobalProgressManager"

function fileNameWithoutExt(name: string): string {
  const lastDot = name.lastIndexOf(".")
  return lastDot > 0 ? name.slice(0, lastDot) : name
}

function CardBottomBar({
  page,
  pageIdx,
  updatePage,
  removePage,
}: {
  page: ImageToPdfPage
  pageIdx: number
  updatePage: (i: number, u: Partial<ImageToPdfPage>) => void
  removePage: (i: number) => void
}) {
  const [isNameFocused, setIsNameFocused] = useState(false)
  const [isNameHovered, setIsNameHovered] = useState(false)
  const expandName = isNameFocused || isNameHovered

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        background: "#f8f9fa",
        borderTop: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <input
        type="text"
        value={page.designName}
        onChange={(e) => updatePage(pageIdx, { designName: e.target.value })}
        onFocus={() => setIsNameFocused(true)}
        onBlur={() => setIsNameFocused(false)}
        onMouseEnter={() => setIsNameHovered(true)}
        onMouseLeave={() => setIsNameHovered(false)}
        placeholder="Name"
        style={{
          flex: 1,
          minWidth: 0,
          maxWidth: expandName ? "none" : "calc(100% - 90px)",
          border: "none",
          background: "transparent",
          fontSize: 12,
          color: "#374151",
          outline: "none",
          transition: "max-width 0.2s ease",
        }}
      />
      <div
        style={{
          display: expandName ? "none" : "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <input
          type="number"
          min={8}
          max={24}
          value={page.fontSize}
          onChange={(e) =>
            updatePage(pageIdx, { fontSize: parseInt(e.target.value) || 12 })
          }
          style={{
            width: 42,
            border: "none",
            background: "rgba(0,0,0,0.05)",
            borderRadius: 6,
            padding: "4px 6px",
            fontSize: 11,
            textAlign: "center",
          }}
        />
        <input
          type="color"
          value={page.fontColor}
          onChange={(e) => updatePage(pageIdx, { fontColor: e.target.value })}
          style={{
            width: 24,
            height: 24,
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            padding: 0,
          }}
        />
        <button
          type="button"
          onClick={() => removePage(pageIdx)}
          style={{
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            borderRadius: 8,
            background: "rgba(239,68,68,0.1)",
            color: "#dc2626",
            cursor: "pointer",
          }}
          title="Remove"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

export default function DesignPage() {
  const { startDownload, completeDownload, setError } = useGlobalProgress()
  const [clientName, setClientName] = useState("")
  const [projectLocation, setProjectLocation] = useState("")
  const [pages, setPages] = useState<ImageToPdfPage[]>([])
  const [generating, setGenerating] = useState(false)
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [previewOrder, setPreviewOrder] = useState<number[] | null>(null)
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const appliedForHoverRef = useRef<number | null>(null)

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return
      const imageFiles = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      )
      if (imageFiles.length === 0) {
        toast.error("Please select image files (PNG, JPG, etc.)")
        return
      }
      try {
        const newPages: ImageToPdfPage[] = await Promise.all(
          imageFiles.map(async (file) => ({
            imageDataUrl: await readFileAsDataUrl(file),
            designName: fileNameWithoutExt(file.name),
            fontSize: 12,
            fontColor: "#1f2937",
          }))
        )
        setPages((prev) => [...prev, ...newPages])
        toast.success(`${imageFiles.length} image(s) added`)
      } catch (e) {
        toast.error("Failed to read images")
      }
    },
    []
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )
  const onDragOver = useCallback((e: React.DragEvent) => e.preventDefault(), [])

  const movePage = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return
    setPages((prev) => {
      const next = [...prev]
      const [removed] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, removed)
      return next
    })
  }

  const swapPages = (a: number, b: number) => {
    if (a === b) return
    setPages((prev) => {
      const next = [...prev]
      ;[next[a], next[b]] = [next[b], next[a]]
      return next
    })
  }

  const handleCardDragStart = (idx: number) => {
    setDraggedIdx(idx)
    setPreviewOrder(null)
    appliedForHoverRef.current = null
  }
  const handleCardDragEnd = () => {
    setDraggedIdx(null)
    setDragOverIdx(null)
    setPreviewOrder(null)
    appliedForHoverRef.current = null
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current)
      previewTimerRef.current = null
    }
  }
  const handleCardDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (draggedIdx === null) return
    setDragOverIdx(idx)
    if (draggedIdx !== idx) {
      if (appliedForHoverRef.current !== idx) {
        appliedForHoverRef.current = idx
        if (previewTimerRef.current) clearTimeout(previewTimerRef.current)
        previewTimerRef.current = setTimeout(() => {
          previewTimerRef.current = null
          setPreviewOrder((prev) => {
            const order = prev ?? Array.from({ length: pages.length }, (_, i) => i)
            const newOrder = [...order]
            const fromPos = newOrder.indexOf(draggedIdx)
            const toPos = newOrder.indexOf(idx)
            if (fromPos >= 0 && toPos >= 0 && fromPos !== toPos) {
              ;[newOrder[fromPos], newOrder[toPos]] = [newOrder[toPos], newOrder[fromPos]]
            }
            return newOrder
          })
        }, 50)
      }
    }
  }
  const handleCardDragLeave = (e: React.DragEvent) => {
    const related = e.relatedTarget as HTMLElement | null
    if (related?.closest?.("[data-design-card]")) return
    const { clientX, clientY } = e
    setTimeout(() => {
      const under = document.elementFromPoint(clientX, clientY)
      if (under?.closest?.("[data-design-card]")) return
      setDragOverIdx(null)
      appliedForHoverRef.current = null
      if (previewTimerRef.current) {
        clearTimeout(previewTimerRef.current)
        previewTimerRef.current = null
      }
      setPreviewOrder(null)
    }, 0)
  }
  const handleCardDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault()
    setDragOverIdx(null)
    setPreviewOrder(null)
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current)
      previewTimerRef.current = null
    }
    const fromStr = e.dataTransfer.getData("text/plain")
    if (fromStr === "") return
    const fromIdx = parseInt(fromStr, 10)
    if (Number.isNaN(fromIdx)) return
    swapPages(fromIdx, toIdx)
    setDraggedIdx(null)
  }

  const updatePage = (index: number, updates: Partial<ImageToPdfPage>) => {
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...updates } : p))
    )
  }

  const removePage = (index: number) => {
    setPages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDownload = async () => {
    if (!clientName.trim()) {
      toast.error("Please enter client name")
      return
    }
    if (pages.length === 0) {
      toast.error("Please add at least one image")
      return
    }
    setGenerating(true)
    startDownload("design-catalogue", "pdf")
    try {
      const pdfBytes = await generateImageToPdf({
        clientName: clientName.trim(),
        projectLocation: projectLocation.trim(),
        date: new Date().toLocaleDateString("en-KE"),
        pages,
      })
      const blob = new Blob([pdfBytes], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `design-catalogue-${clientName.replace(/\s+/g, "-")}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      completeDownload()
      toast.success("PDF downloaded successfully")
    } catch (err) {
      console.error(err)
      setError("Failed to generate PDF")
      toast.error("Failed to generate PDF")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div
            className="d-flex align-items-center gap-3 mb-3"
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)",
              borderRadius: "16px",
              padding: "20px 24px",
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.2)",
                borderRadius: "12px",
                width: "56px",
                height: "56px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              <Palette size={28} />
            </div>
            <div>
              <h1 className="h2 mb-1 fw-bold text-white">Design</h1>
              <p className="mb-0 text-white" style={{ opacity: 0.9 }}>
                Tools & utilities for design workflows
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tools section */}
      <div className="mb-4">
        <h5
          className="fw-bold mb-3"
          style={{ color: "#4b5563", fontSize: "0.95rem" }}
        >
          Tools
        </h5>
        <div className="card border-0 shadow-sm" style={{ borderRadius: "16px" }}>
          <div className="card-body p-4">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <ImageIcon size={20} style={{ color: "#8b5cf6" }} />
              Image to PDF
            </h6>
            <p className="text-muted small mb-4">
              Upload images to create a PDF catalogue with header, client name,
              and editable design labels per page.
            </p>

            {/* Client name & Project location - same row, half each */}
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Client Name</label>
                <input
                  type="text"
                  className="form-control border-0 shadow-sm"
                  placeholder="Enter client name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  style={{ borderRadius: "12px", height: "45px" }}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Project Location</label>
                <input
                  type="text"
                  className="form-control border-0 shadow-sm"
                  placeholder="Enter project location"
                  value={projectLocation}
                  onChange={(e) => setProjectLocation(e.target.value)}
                  style={{ borderRadius: "12px", height: "45px" }}
                />
              </div>
            </div>

            {/* Upload zone - only shown when no images yet */}
            {pages.length === 0 && (
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onClick={() => document.getElementById("design-file-input")?.click()}
                style={{
                  border: "2px dashed #d1d5db",
                  borderRadius: "16px",
                  padding: "32px",
                  textAlign: "center",
                  cursor: "pointer",
                  backgroundColor: "#f9fafb",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#8b5cf6"
                  e.currentTarget.style.backgroundColor = "#f5f3ff"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#d1d5db"
                  e.currentTarget.style.backgroundColor = "#f9fafb"
                }}
              >
                <Upload size={40} className="mb-2" style={{ color: "#8b5cf6" }} />
                <p className="mb-0 fw-semibold text-dark">
                  Drop images here or click to upload
                </p>
                <p className="mb-0 text-muted small mt-1">
                  PNG, JPG, WebP supported
                </p>
              </div>
            )}

            {/* Hidden file input for adding more images */}
            <input
              id="design-file-input"
              type="file"
              accept="image/*"
              multiple
              className="d-none"
              onChange={(e) => handleFiles(e.target.files)}
            />

            {/* Image list with editable design names (reorderable) */}
            {pages.length > 0 && (
              <div className="mt-4">
                <h6 className="fw-semibold mb-3">Pages ({pages.length})</h6>
                <div className="row g-2">
                  {(previewOrder ?? pages.map((_, i) => i)).map((pageIdx) => {
                    const page = pages[pageIdx]
                    return (
                    <motion.div
                      key={pageIdx}
                      data-design-card
                      layout
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", String(pageIdx))
                        e.dataTransfer.effectAllowed = "move"
                        handleCardDragStart(pageIdx)
                      }}
                      onDragEnd={handleCardDragEnd}
                      onDragOver={(e) => handleCardDragOver(e, pageIdx)}
                      onDragLeave={handleCardDragLeave}
                      onDrop={(e) => {
                        e.preventDefault()
                        if (e.dataTransfer.files?.length) {
                          handleFiles(e.dataTransfer.files)
                          return
                        }
                        handleCardDrop(e, pageIdx)
                      }}
                      className="col-12 col-md-6 col-lg-4"
                      style={{
                        borderRadius: "12px",
                        overflow: "hidden",
                        backgroundColor: "#ffffff",
                        opacity: draggedIdx === pageIdx ? 0.7 : 1,
                        boxShadow: dragOverIdx === pageIdx ? "0 0 0 2px rgba(139,92,246,0.6)" : "0 2px 8px rgba(0,0,0,0.08)",
                        cursor: "grab",
                      }}
                    >
                      <div
                        style={{
                          position: "relative",
                          aspectRatio: "4/3",
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#ffffff",
                        }}
                      >
                        <img
                          src={page.imageDataUrl}
                          alt={page.designName}
                          draggable={false}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: 6,
                            left: 6,
                            padding: "4px 8px",
                            background: "rgba(0,0,0,0.35)",
                            borderRadius: "6px",
                            cursor: "grab",
                          }}
                        >
                          <GripVertical size={14} style={{ color: "rgba(255,255,255,0.9)" }} />
                        </div>
                      </div>
                      <CardBottomBar
                        page={page}
                        pageIdx={pageIdx}
                        updatePage={updatePage}
                        removePage={removePage}
                      />
                    </motion.div>
                  )
                  })}
                  {/* Add more images card - Dribbble-style minimal */}
                  <div
                    className="col-12 col-md-6 col-lg-4"
                    onDrop={(e) => {
                      e.preventDefault()
                      if (e.dataTransfer.files?.length) {
                        handleFiles(e.dataTransfer.files)
                        return
                      }
                      const fromStr = e.dataTransfer.getData("text/plain")
                      if (fromStr !== "") {
                        const fromIdx = parseInt(fromStr, 10)
                        if (!Number.isNaN(fromIdx)) movePage(fromIdx, pages.length)
                        setDraggedIdx(null)
                      }
                    }}
                    onDragOver={onDragOver}
                    onClick={() => document.getElementById("design-file-input")?.click()}
                    style={{
                      borderRadius: "12px",
                      minHeight: 180,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      backgroundColor: "#fafafa",
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f5f5f5"
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#fafafa"
                      e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)"
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "rgba(139, 92, 246, 0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Plus size={20} strokeWidth={2.5} style={{ color: "#8b5cf6" }} />
                    </div>
                    <span className="mt-2" style={{ fontSize: "13px", fontWeight: 500, color: "#64748b" }}>
                      Add more
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Download */}
            <div className="mt-4 pt-3 border-top">
              <button
                type="button"
                className="btn btn-primary border-0 shadow-sm"
                disabled={generating || pages.length === 0}
                onClick={handleDownload}
                style={{
                  borderRadius: "12px",
                  height: "48px",
                  paddingInline: "24px",
                  background: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)",
                }}
              >
                {generating ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download size={18} className="me-2" />
                    Download PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
