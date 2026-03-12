"use client"

import React, { useState, useCallback } from "react"
import { Palette, Image as ImageIcon, Download, Trash2, Upload, GripVertical, Plus } from "lucide-react"
import { generateImageToPdf, type ImageToPdfPage } from "@/lib/image-to-pdf"
import { toast } from "sonner"
import { useGlobalProgress } from "@/components/GlobalProgressManager"

function fileNameWithoutExt(name: string): string {
  const lastDot = name.lastIndexOf(".")
  return lastDot > 0 ? name.slice(0, lastDot) : name
}

export default function DesignPage() {
  const { startDownload, completeDownload, setError } = useGlobalProgress()
  const [clientName, setClientName] = useState("")
  const [projectLocation, setProjectLocation] = useState("")
  const [pages, setPages] = useState<ImageToPdfPage[]>([])
  const [generating, setGenerating] = useState(false)
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

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

  const handleCardDragStart = (idx: number) => setDraggedIdx(idx)
  const handleCardDragEnd = () => {
    setDraggedIdx(null)
    setDragOverIdx(null)
  }
  const handleCardDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (draggedIdx === null) return
    setDragOverIdx(idx)
  }
  const handleCardDragLeave = () => setDragOverIdx(null)
  const handleCardDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault()
    setDragOverIdx(null)
    const fromStr = e.dataTransfer.getData("text/plain")
    if (fromStr === "") return
    const fromIdx = parseInt(fromStr, 10)
    if (Number.isNaN(fromIdx)) return
    movePage(fromIdx, toIdx)
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
                <div className="row g-3">
                  {pages.map((page, idx) => (
                    <div
                      key={idx}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", String(idx))
                        e.dataTransfer.effectAllowed = "move"
                        handleCardDragStart(idx)
                      }}
                      onDragEnd={handleCardDragEnd}
                      onDragOver={(e) => handleCardDragOver(e, idx)}
                      onDragLeave={handleCardDragLeave}
                      onDrop={(e) => {
                        e.preventDefault()
                        if (e.dataTransfer.files?.length) {
                          handleFiles(e.dataTransfer.files)
                          return
                        }
                        handleCardDrop(e, idx)
                      }}
                      className="col-12 col-md-6 col-lg-4"
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        overflow: "hidden",
                        backgroundColor: "#fff",
                        opacity: draggedIdx === idx ? 0.6 : 1,
                        borderColor: dragOverIdx === idx ? "#8b5cf6" : undefined,
                        boxShadow: dragOverIdx === idx ? "0 0 0 2px #8b5cf6" : undefined,
                        cursor: "grab",
                      }}
                    >
                      <div
                        className="d-flex align-items-center justify-content-center px-2 py-1"
                        style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}
                      >
                        <GripVertical size={18} className="text-muted" style={{ cursor: "grab" }} />
                      </div>
                      <div
                        style={{
                          height: 120,
                          overflow: "hidden",
                          background: "#f3f4f6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <img
                          src={page.imageDataUrl}
                          alt={page.designName}
                          draggable={false}
                          style={{
                            maxHeight: "100%",
                            maxWidth: "100%",
                            objectFit: "contain",
                          }}
                        />
                      </div>
                      <div className="p-3">
                        <div className="mb-2">
                          <label className="form-label small mb-1">
                            Design name
                          </label>
                          <input
                            type="text"
                            className="form-control form-control-sm border-0 shadow-sm"
                            value={page.designName}
                            onChange={(e) =>
                              updatePage(idx, { designName: e.target.value })
                            }
                            placeholder="Design name"
                            style={{ borderRadius: "8px" }}
                          />
                        </div>
                        <div className="row g-2 mb-2">
                          <div className="col-6">
                            <label className="form-label small mb-1">
                              Font size
                            </label>
                            <input
                              type="number"
                              className="form-control form-control-sm border-0 shadow-sm"
                              min={8}
                              max={24}
                              value={page.fontSize}
                              onChange={(e) =>
                                updatePage(idx, {
                                  fontSize: parseInt(e.target.value) || 12,
                                })
                              }
                              style={{ borderRadius: "8px" }}
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label small mb-1">
                              Color
                            </label>
                            <div className="d-flex gap-1">
                              <input
                                type="color"
                                value={page.fontColor}
                                onChange={(e) =>
                                  updatePage(idx, {
                                    fontColor: e.target.value,
                                  })
                                }
                                style={{
                                  width: 36,
                                  height: 32,
                                  border: "none",
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                }}
                              />
                              <input
                                type="text"
                                className="form-control form-control-sm border-0 shadow-sm"
                                value={page.fontColor}
                                onChange={(e) =>
                                  updatePage(idx, { fontColor: e.target.value })
                                }
                                style={{
                                  borderRadius: "8px",
                                  flex: 1,
                                  fontFamily: "monospace",
                                  fontSize: 11,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger w-100"
                          onClick={() => removePage(idx)}
                          style={{ borderRadius: "8px" }}
                        >
                          <Trash2 size={14} className="me-1" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* Add more images card */}
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
                      border: "2px dashed #d1d5db",
                      borderRadius: "12px",
                      minHeight: 180,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
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
                    <Plus size={32} style={{ color: "#8b5cf6" }} />
                    <p className="mb-0 fw-semibold mt-2 text-dark small">
                      Add more images
                    </p>
                    <p className="mb-0 text-muted" style={{ fontSize: "0.75rem" }}>
                      Click or drop here
                    </p>
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
