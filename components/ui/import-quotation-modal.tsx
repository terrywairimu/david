"use client"

import React, { useState, useRef } from "react"
import { X, Upload, FileSpreadsheet, FileText, CheckCircle, AlertCircle, Download } from "lucide-react"
import { toast } from "sonner"
import * as XLSX from 'xlsx'

interface ImportQuotationModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (data: any) => void
}

interface ParsedData {
  headers: string[]
  rows: any[][]
  section: string
}

interface ColumnMapping {
  description: string
  unit: string
  quantity: string
  unitPrice: string
  total: string
}

const ImportQuotationModal: React.FC<ImportQuotationModalProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [selectedSection, setSelectedSection] = useState<string>('kitchen_cabinets')
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    description: '',
    unit: '',
    quantity: '',
    unitPrice: '',
    total: ''
  })
  const [mappedData, setMappedData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sections = [
    { value: 'kitchen_cabinets', label: 'Kitchen Cabinets' },
    { value: 'worktop', label: 'Worktop' },
    { value: 'accessories', label: 'Accessories' },
    { value: 'appliances', label: 'Appliances' },
    { value: 'wardrobes', label: 'Wardrobes' },
    { value: 'tvunit', label: 'TV Unit' }
  ]

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase()
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
      toast.error('Please upload a valid Excel or CSV file')
      return
    }

    setFile(selectedFile)
    parseFile(selectedFile)
  }

  const parseFile = async (file: File) => {
    setLoading(true)
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })

      if (jsonData.length < 2) {
        toast.error('File must contain at least a header row and one data row')
        return
      }

      const headers = jsonData[0] as string[]
      const rows = jsonData.slice(1) as any[][]

      setParsedData({ headers, rows, section: selectedSection })
      setStep('mapping')
    } catch (error) {
      console.error('Error parsing file:', error)
      toast.error('Error parsing file. Please check the format.')
    } finally {
      setLoading(false)
    }
  }

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    setColumnMapping(prev => ({ ...prev, [field]: value }))
  }

  const proceedToPreview = () => {
    if (!parsedData) return

    const { headers, rows } = parsedData
    const mappedRows = rows.map(row => {
      const mappedRow: any = {}
      Object.entries(columnMapping).forEach(([field, headerName]) => {
        if (headerName) {
          const columnIndex = headers.indexOf(headerName)
          if (columnIndex !== -1) {
            mappedRow[field] = row[columnIndex]
          }
        }
      })
      return mappedRow
    }).filter(row => row.description && row.quantity && row.unitPrice)

    setMappedData(mappedRows)
    setStep('preview')
  }

  const handleImport = () => {
    if (mappedData.length === 0) {
      toast.error('No valid data to import')
      return
    }

    const formattedData = mappedData.map(row => ({
      category: selectedSection,
      description: String(row.description || '').trim(),
      unit: String(row.unit || 'pcs').trim(),
      quantity: parseFloat(row.quantity) || 1,
      unit_price: parseFloat(row.unitPrice) || 0,
      total_price: (parseFloat(row.quantity) || 1) * (parseFloat(row.unitPrice) || 0),
      specifications: '',
      notes: ''
    }))

    onImport({
      section: selectedSection,
      items: formattedData
    })
    
    toast.success(`Successfully imported ${formattedData.length} items to ${sections.find(s => s.value === selectedSection)?.label}`)
    onClose()
  }

  const resetModal = () => {
    setStep('upload')
    setFile(null)
    setParsedData(null)
    setSelectedSection('kitchen_cabinets')
    setColumnMapping({
      description: '',
      unit: '',
      quantity: '',
      unitPrice: '',
      total: ''
    })
    setMappedData([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content" style={{ borderRadius: "20px", border: "none", boxShadow: "0 20px 60px rgba(0,0,0,0.1)" }}>
          {/* Header */}
          <div className="modal-header border-0" style={{ padding: "24px 32px 16px" }}>
            <div className="d-flex align-items-center">
              <div className="me-3" style={{ 
                width: "48px", 
                height: "48px", 
                borderRadius: "16px", 
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Upload size={24} color="white" />
              </div>
              <div>
                <h5 className="modal-title mb-1 fw-bold" style={{ color: "#ffffff" }}>
                  Import Quotation Data
                </h5>
                <p className="mb-0 text-white small">Upload Excel/CSV file and map columns</p>
              </div>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              style={{ borderRadius: "12px", padding: "8px" }}
            />
          </div>

          {/* Body */}
          <div className="modal-body" style={{ padding: "24px 32px" }}>
            {step === 'upload' && (
              <div className="text-center">
                <div className="mb-4">
                  <div className="border-2 border-dashed rounded-3 p-4" style={{ 
                    borderColor: '#e5e7eb',
                    backgroundColor: '#f9fafb'
                  }}>
                    <Upload size={48} className="text-muted mb-3" />
                    <h6 className="mb-2">Upload Excel or CSV File</h6>
                    <p className="text-muted mb-3">Select a file containing quotation items data</p>
                    
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Select Section:</label>
                      <select 
                        className="form-select"
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                      >
                        {sections.map(section => (
                          <option key={section.value} value={section.value}>
                            {section.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="form-control"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="text-start">
                  <h6 className="mb-2">Expected File Format:</h6>
                  <ul className="list-unstyled text-muted small">
                    <li>• <strong>Description:</strong> Item description/name</li>
                    <li>• <strong>Units:</strong> Unit of measurement (pcs, mtrs, etc.)</li>
                    <li>• <strong>Quantity:</strong> Number of items</li>
                    <li>• <strong>Unit Price:</strong> Price per unit</li>
                    <li>• <strong>Total:</strong> Total price (optional, will be calculated)</li>
                  </ul>
                </div>
              </div>
            )}

            {step === 'mapping' && parsedData && (
              <div>
                <h6 className="mb-3">Map Columns to Fields</h6>
                <p className="text-muted mb-4">Match your file columns to the system fields</p>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Description *</label>
                    <select 
                      className="form-select"
                      value={columnMapping.description}
                      onChange={(e) => handleMappingChange('description', e.target.value)}
                    >
                      <option value="">Select column...</option>
                      {parsedData.headers.map((header, index) => (
                        <option key={index} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Unit</label>
                    <select 
                      className="form-select"
                      value={columnMapping.unit}
                      onChange={(e) => handleMappingChange('unit', e.target.value)}
                    >
                      <option value="">Select column...</option>
                      {parsedData.headers.map((header, index) => (
                        <option key={index} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Quantity *</label>
                    <select 
                      className="form-select"
                      value={columnMapping.quantity}
                      onChange={(e) => handleMappingChange('quantity', e.target.value)}
                    >
                      <option value="">Select column...</option>
                      {parsedData.headers.map((header, index) => (
                        <option key={index} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Unit Price *</label>
                    <select 
                      className="form-select"
                      value={columnMapping.unitPrice}
                      onChange={(e) => handleMappingChange('unitPrice', e.target.value)}
                    >
                      <option value="">Select column...</option>
                      {parsedData.headers.map((header, index) => (
                        <option key={index} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <button 
                    className="btn btn-primary"
                    onClick={proceedToPreview}
                    disabled={!columnMapping.description || !columnMapping.quantity || !columnMapping.unitPrice}
                  >
                    Preview Data
                  </button>
                  <button 
                    className="btn btn-outline-secondary ms-2"
                    onClick={() => setStep('upload')}
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {step === 'preview' && (
              <div>
                <h6 className="mb-3">Preview Import Data</h6>
                <p className="text-muted mb-4">
                  {mappedData.length} items will be imported to <strong>{sections.find(s => s.value === selectedSection)?.label}</strong>
                </p>

                <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table className="table table-sm">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th>Description</th>
                        <th>Unit</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mappedData.slice(0, 10).map((row, index) => (
                        <tr key={index}>
                          <td>{row.description}</td>
                          <td>{row.unit || 'pcs'}</td>
                          <td>{row.quantity}</td>
                          <td>{row.unitPrice}</td>
                          <td>{(parseFloat(row.quantity) || 0) * (parseFloat(row.unitPrice) || 0)}</td>
                        </tr>
                      ))}
                      {mappedData.length > 10 && (
                        <tr>
                          <td colSpan={5} className="text-center text-muted">
                            ... and {mappedData.length - 10} more items
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4">
                  <button 
                    className="btn btn-success"
                    onClick={handleImport}
                  >
                    <CheckCircle size={16} className="me-2" />
                    Import {mappedData.length} Items
                  </button>
                  <button 
                    className="btn btn-outline-secondary ms-2"
                    onClick={() => setStep('mapping')}
                  >
                    Back to Mapping
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImportQuotationModal
