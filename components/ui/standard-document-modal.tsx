"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { dateInputToDateOnly } from "@/lib/timezone"
import { X, Plus, Trash2, Search, User, Calculator, FileText, ChevronDown, ChevronRight, Package, Calendar, Download, CreditCard, Printer } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import { createPortal } from "react-dom"
import jsPDF from "jspdf"
import "jspdf-autotable"
import type { QuotationData } from '@/lib/pdf-template';
import { useIsMobile } from "@/hooks/use-mobile"
import PrintModal from "./print-modal"
import dynamic from 'next/dynamic'

// Dynamically import MobilePDFViewer to avoid SSR issues
const MobilePDFViewer = dynamic(() => import('./mobile-pdf-viewer'), { 
  ssr: false,
  loading: () => (
    <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
      <div className="text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 text-muted">Loading PDF Viewer...</p>
      </div>
    </div>
  )
})

interface Client {
  id: number
  name: string
  phone?: string
  location?: string
}

interface StockItem {
  id: number
  name: string
  description?: string
  unit_price: number
  unit: string
  category: string
  sku?: string
}

interface DocumentItem {
  id?: number
  category: "cabinet" | "worktop" | "accessories" | "appliances" | "wardrobes" | "tvunit"
  description: string
  unit: string
  quantity: number
  unit_price: number
  total_price: number
  stock_item_id?: number
  stock_item?: StockItem
}

interface StandardDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (document: any) => void
  document?: any
  mode: "view" | "edit" | "create"
  documentType: "quotation" | "sales_order" | "invoice" | "cash_sale"
  onProceedToNext?: (document: any) => Promise<void>
}

// Portal Dropdown Component
const PortalDropdown: React.FC<{
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  targetRef: React.RefObject<HTMLElement>
}> = ({ isOpen, onClose, children, targetRef }) => {
  if (!isOpen || !targetRef.current) return null

  const rect = targetRef.current.getBoundingClientRect()
  
  return createPortal(
    <div
      className="position-fixed bg-white border rounded shadow-lg"
      style={{
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        maxHeight: '200px',
        overflowY: 'auto',
        zIndex: 9999
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  )
}

const StandardDocumentModal: React.FC<StandardDocumentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  document,
  mode = "create",
  documentType,
  onProceedToNext
}) => {
  // Document number and basic info
  const [documentNumber, setDocumentNumber] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [clientSearchTerm, setClientSearchTerm] = useState("")
  const [clientDropdownVisible, setClientDropdownVisible] = useState(false)
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  
  // Document settings
  const [labourPercentage, setLabourPercentage] = useState(30)
  const [includeWorktop, setIncludeWorktop] = useState(false)
  const [includeAccessories, setIncludeAccessories] = useState(false)
  const [includeAppliances, setIncludeAppliances] = useState(false)
  const [includeWardrobes, setIncludeWardrobes] = useState(false)
  const [includeTvUnit, setIncludeTvUnit] = useState(false)
  const [notes, setNotes] = useState("")
  const [termsConditions, setTermsConditions] = useState(
    "1. All work to be completed within agreed timeframe.\n2. Client to provide necessary measurements and specifications.\n3. Final payment due upon completion.\n4. Any changes to the original design may incur additional charges."
  )
  const [loading, setLoading] = useState(false)
  
  // PDF viewing state
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  
  // Mobile detection and print modal state
  const isMobile = useIsMobile()
  const [showPrintModal, setShowPrintModal] = useState(false)
  
  // Payment tracking state
  const [totalPaid, setTotalPaid] = useState(0)
  const [hasPayments, setHasPayments] = useState(false)
  const [paymentPercentage, setPaymentPercentage] = useState(0)
  
  // Custom section names state
  const [sectionNames, setSectionNames] = useState({
    cabinet: "General",
    worktop: "Worktop",
    accessories: "Accessories",
    appliances: "Appliances",
    wardrobes: "Wardrobes",
    tvunit: "TV Unit"
  })
  
  // Section name editing state
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [tempSectionName, setTempSectionName] = useState("")
  
  // Items state
  const [items, setItems] = useState<DocumentItem[]>([])
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["cabinet"]))
  
  // Refs for dropdowns
  const clientInputRef = useRef<HTMLDivElement>(null)
  const clientDropdownRef = useRef<HTMLDivElement>(null)
  
  // Document type specific settings
  const getDocumentSettings = () => {
    switch (documentType) {
      case "quotation":
        return {
          title: "Quotation",
          icon: FileText,
          color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          defaultTerms: "1. All work to be completed within agreed timeframe.\n2. Client to provide necessary measurements and specifications.\n3. Final payment due upon completion.\n4. Any changes to the original design may incur additional charges."
        }
      case "sales_order":
        return {
          title: "Sales Order",
          icon: Package,
          color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          defaultTerms: "1. All work to be completed within agreed timeframe.\n2. Client to provide necessary measurements and specifications.\n3. Final payment due upon completion.\n4. Any changes to the original design may incur additional charges."
        }
      case "invoice":
        return {
          title: "Invoice",
          icon: CreditCard,
          color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
          defaultTerms: "1. Payment is due within 30 days of invoice date.\n2. Late payments may incur additional charges.\n3. All work completed as per agreement.\n4. No returns or exchanges on custom items."
        }
      case "cash_sale":
        return {
          title: "Cash Sale",
          icon: Calculator,
          color: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
          defaultTerms: "1. All sales are final.\n2. No returns or exchanges on custom items.\n3. Warranty period is 1 year from date of purchase.\n4. Installation services available upon request."
        }
      default:
        return {
          title: "Document",
          icon: FileText,
          color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          defaultTerms: "1. All work to be completed within agreed timeframe.\n2. Client to provide necessary measurements and specifications.\n3. Final payment due upon completion.\n4. Any changes to the original design may incur additional charges."
        }
    }
  }

  const documentSettings = getDocumentSettings()
  const DocumentIcon = documentSettings.icon

  // Generate document number based on type
  const generateDocumentNumber = async () => {
    try {
      const currentDate = new Date()
      const year = currentDate.getFullYear().toString().slice(-2)
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
      const timestamp = Date.now().toString().slice(-6)
      
      let prefix = ""
      switch (documentType) {
        case "quotation":
          prefix = "QT"
          break
        case "sales_order":
          prefix = "SO"
          break
        case "invoice":
          prefix = "INV"
          break
        case "cash_sale":
          prefix = "CS"
          break
      }
      
      return `${prefix}${year}${month}${timestamp}`
    } catch (error) {
      console.error('Error generating document number:', error)
      const timestamp = Date.now().toString().slice(-6)
      return `${documentType.toUpperCase()}${timestamp}`
    }
  }

  // Load document data when editing/viewing
  useEffect(() => {
    if (document && mode !== "create") {
      // Load document data
      setDocumentNumber(document.quotation_number || document.order_number || document.invoice_number || document.sale_number || "")
      setSelectedClient(document.client || null)
      setClientSearchTerm(document.client?.name || "")
      setNotes(document.notes || "")
      setTermsConditions(document.terms_conditions || documentSettings.defaultTerms)
      
      // Load items
      if (document.quotation_items || document.sales_order_items || document.invoice_items || document.cash_sale_items) {
        const documentItems = document.quotation_items || document.sales_order_items || document.invoice_items || document.cash_sale_items
        setItems(documentItems || [])
      }
      
      // Load section names if available
      if (document.section_names) {
        setSectionNames(document.section_names)
      }
    } else if (mode === "create") {
      // Generate new document number
      generateDocumentNumber().then(number => {
        setDocumentNumber(number)
      })
    }
  }, [document, mode, documentType])

  // Fetch clients
  useEffect(() => {
    if (isOpen) {
      fetchClients()
      fetchStockItems()
    }
  }, [isOpen])

  // Filter clients based on search
  useEffect(() => {
    if (clientSearchTerm.trim() === "") {
      setFilteredClients(clients)
    } else {
      const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
        client.phone?.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
        client.location?.toLowerCase().includes(clientSearchTerm.toLowerCase())
      )
      setFilteredClients(filtered)
    }
  }, [clientSearchTerm, clients])

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("registered_entities")
        .select("id, name, phone, location")
        .eq("type", "client")
        .eq("status", "active")
        .order("name")

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error("Error fetching clients:", error)
      toast.error("Failed to load clients")
    }
  }

  const fetchStockItems = async () => {
    try {
      const { data, error } = await supabase
        .from("stock_items")
        .select("*")
        .eq("status", "active")
        .order("name")

      if (error) throw error
      setStockItems(data || [])
    } catch (error) {
      console.error("Error fetching stock items:", error)
      toast.error("Failed to load stock items")
    }
  }

  // Calculate totals
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.total_price, 0)
  }, [items])

  const labourAmount = useMemo(() => {
    return (subtotal * labourPercentage) / 100
  }, [subtotal, labourPercentage])

  const subtotalWithLabour = useMemo(() => {
    return subtotal + labourAmount
  }, [subtotal, labourAmount])

  // PDF Generation
  const generatePDF = async () => {
    if (!selectedClient) {
      toast.error("Please select a client first")
      return
    }

    setPdfLoading(true)
    try {
      // Import PDF generation function dynamically
      const { generateQuotationPDF } = await import('@/lib/pdf-template')
      const { generate } = await import('@pdfme/generator')
      const { text, rectangle, line, image } = await import('@pdfme/plugins')

      // Fetch watermark image as base64
      async function fetchImageAsBase64(url: string): Promise<string> {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
      const watermarkLogoBase64 = await fetchImageAsBase64('/logowatermark.png');

      // Prepare document data
      const documentData: QuotationData = {
        companyName: "CABINET MASTER STYLES & FINISHES",
        companyLocation: "Location: Ruiru Eastern By-Pass",
        companyPhone: "Tel: +254729554475",
        companyEmail: "Email: cabinetmasterstyles@gmail.com",
        clientNames: selectedClient.name,
        siteLocation: selectedClient.location || "",
        mobileNo: selectedClient.phone || "",
        date: new Date().toLocaleDateString(),
        deliveryNoteNo: documentType === "sales_order" ? "Delivery Note No." : "",
        quotationNumber: documentNumber,
        documentTitle: documentSettings.title.toUpperCase(),
        items: items,
        section_names: sectionNames,
        subtotal: subtotal,
        vat: 0, // Add VAT calculation if needed
        vatPercentage: 0,
        total: subtotalWithLabour,
        terms: termsConditions.split('\n').filter(line => line.trim()),
        preparedBy: "",
        approvedBy: "",
        watermarkLogo: watermarkLogoBase64,
        companyLogo: watermarkLogoBase64,
      };

      // Generate PDF using PDF.me template
      const { template, inputs } = await generateQuotationPDF(documentData);
      const pdf = await generate({ template, inputs, plugins: { text, rectangle, line, image } });
      
      // Download the PDF
      const blob = new Blob([new Uint8Array(pdf.buffer)], { type: 'application/pdf' });
      setPdfBlob(blob);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      
      toast.success(`${documentSettings.title} PDF generated successfully`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("Failed to generate PDF")
    } finally {
      setPdfLoading(false)
    }
  }

  // Download PDF
  const downloadPDF = () => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${documentNumber}_${documentSettings.title.replace(' ', '_')}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  // Print PDF
  const printPDF = () => {
    if (isMobile) {
      setShowPrintModal(true)
    } else if (pdfUrl) {
      const printWindow = window.open(pdfUrl, '_blank')
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
        }
      }
    }
  }

  // Handle save
  const handleSave = async () => {
    if (!selectedClient) {
      toast.error("Please select a client")
      return
    }

    if (items.length === 0) {
      toast.error("Please add at least one item")
      return
    }

    setLoading(true)
    try {
      const documentData = {
        [documentType === "quotation" ? "quotation_number" : 
         documentType === "sales_order" ? "order_number" :
         documentType === "invoice" ? "invoice_number" : "sale_number"]: documentNumber,
        client_id: selectedClient.id,
        date_created: new Date().toISOString(),
        notes: notes,
        terms_conditions: termsConditions,
        total_amount: subtotalWithLabour,
        status: "draft",
        section_names: sectionNames,
        items: items
      }

      await onSave(documentData)
      toast.success(`${documentSettings.title} saved successfully`)
    } catch (error) {
      console.error("Error saving document:", error)
      toast.error("Failed to save document")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="modal fade show d-block standard-document-modal" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <div 
          className={`modal-dialog ${mode === "view" ? (pdfUrl ? "" : "modal-xl") : "modal-xl"} modal-dialog-centered`}
          style={mode === "view" && pdfUrl ? {
            maxWidth: "min(794px, 95vw)",
            width: "min(794px, 95vw)",
            margin: "1.75rem auto"
          } : {}}
        >
          <div className="modal-content" style={{ borderRadius: "20px", border: "none", boxShadow: "0 20px 60px rgba(0,0,0,0.1)" }}>
            {/* Header */}
            <div className="modal-header border-0" style={{ padding: "24px 32px 16px" }}>
              <div className="d-flex align-items-center">
                <div className="me-3" style={{ 
                  width: "48px", 
                  height: "48px", 
                  borderRadius: "16px", 
                  background: documentSettings.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <DocumentIcon size={24} color="white" />
                </div>
                <div>
                  <h5 className="modal-title mb-1 fw-bold" style={{ color: "#ffffff" }}>
                    {mode === "create" ? `New ${documentSettings.title}` : mode === "edit" ? `Edit ${documentSettings.title}` : `View ${documentSettings.title}`}
                  </h5>
                  {mode !== "view" && (
                    <p className="mb-0 text-white small">Create a detailed {documentSettings.title.toLowerCase()} for your client</p>
                  )}
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
            {mode === "view" && pdfUrl ? (
              <div className="modal-body" style={{ padding: "0", height: "80vh" }}>
                {isMobile ? (
                  <MobilePDFViewer pdfBlob={pdfBlob} />
                ) : (
                  <iframe
                    src={pdfUrl}
                    style={{ width: "100%", height: "100%", border: "none" }}
                    title={`${documentSettings.title} PDF`}
                  />
                )}
              </div>
            ) : (
              <div className="modal-body" style={{ padding: "24px 32px", maxHeight: "70vh", overflowY: "auto" }}>
                {/* Document Form Content */}
                <div className="row mb-4">
                  <div className="col-md-6">
                    <label className="form-label">Client</label>
                    <div className="position-relative" ref={clientInputRef}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search for client..."
                        value={clientSearchTerm}
                        onChange={(e) => setClientSearchTerm(e.target.value)}
                        onFocus={() => setClientDropdownVisible(true)}
                        disabled={mode === "view"}
                      />
                      <PortalDropdown
                        isOpen={clientDropdownVisible && filteredClients.length > 0}
                        onClose={() => setClientDropdownVisible(false)}
                        targetRef={clientInputRef}
                      >
                        {filteredClients.map((client) => (
                          <div
                            key={client.id}
                            className="dropdown-item"
                            onClick={() => {
                              setSelectedClient(client)
                              setClientSearchTerm(client.name)
                              setClientDropdownVisible(false)
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            <div className="fw-bold">{client.name}</div>
                            {client.phone && <div className="small text-muted">{client.phone}</div>}
                            {client.location && <div className="small text-muted">{client.location}</div>}
                          </div>
                        ))}
                      </PortalDropdown>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Document Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={documentNumber}
                      readOnly
                    />
                  </div>
                </div>

                {/* Items Section */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-3">Items</h6>
                  {/* Items will be rendered here */}
                  <div className="text-center py-4">
                    <p className="text-muted">Items management will be implemented here</p>
                  </div>
                </div>

                {/* Totals Section */}
                <div className="row mb-4">
                  <div className="col-md-8"></div>
                  <div className="col-md-4">
                    <div className="bg-light p-3 rounded">
                      <div className="d-flex justify-content-between mb-2">
                        <span>Subtotal:</span>
                        <span>KES {subtotal.toLocaleString()}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Labour ({labourPercentage}%):</span>
                        <span>KES {labourAmount.toLocaleString()}</span>
                      </div>
                      <hr />
                      <div className="d-flex justify-content-between fw-bold">
                        <span>Total:</span>
                        <span>KES {subtotalWithLabour.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="modal-footer border-0" style={{ padding: "16px 32px 24px" }}>
              <div className="d-flex gap-2 w-100">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  style={{ borderRadius: "12px", height: "45px" }}
                >
                  Close
                </button>
                
                {mode === "view" && pdfUrl && (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={downloadPDF}
                      style={{ borderRadius: "12px", height: "45px" }}
                    >
                      <Download size={16} className="me-2" />
                      Download
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={printPDF}
                      style={{ borderRadius: "12px", height: "45px" }}
                    >
                      <Printer size={16} className="me-2" />
                      Print
                    </button>
                  </>
                )}
                
                {mode !== "view" && (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={generatePDF}
                      disabled={pdfLoading || !selectedClient}
                      style={{ borderRadius: "12px", height: "45px" }}
                    >
                      {pdfLoading ? (
                        <>
                          <div className="spinner-border spinner-border-sm me-2" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText size={16} className="me-2" />
                          Generate PDF
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSave}
                      disabled={loading}
                      style={{ borderRadius: "12px", height: "45px" }}
                    >
                      {loading ? "Saving..." : `Save ${documentSettings.title}`}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Modal for Mobile */}
      {showPrintModal && (
        <PrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          pdfBlob={pdfBlob}
          documentTitle={`${documentSettings.title} - ${documentNumber}`}
        />
      )}
    </>
  )
}

export default StandardDocumentModal

