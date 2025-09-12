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
  sections: { value: string; label: string; count: number }[]
  detectedSections: string[]
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
  const [selectedSections, setSelectedSections] = useState<{[key: string]: string}>({})
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    description: '',
    unit: '',
    quantity: '',
    unitPrice: '',
    total: ''
  })
  const [mappedData, setMappedData] = useState<{[key: string]: any[]}>({})
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

      if (jsonData.length < 3) {
        toast.error('File must contain at least 3 rows: title row, header row, and one data row')
        return
      }

      // Detect sections and their boundaries in the data
      const sectionAnalysis = analyzeSectionsInData(jsonData)
      
      // Debug: Log the structure for troubleshooting
      console.log('File structure:', {
        totalRows: jsonData.length,
        sectionAnalysis: sectionAnalysis
      })

      // Auto-map columns based on the first section's headers
      const autoMappedColumns = autoMapColumns(sectionAnalysis.sections[0]?.headers || [])
      setColumnMapping(autoMappedColumns)

      // Process data by sections
      const sectionData = processDataByDetectedSections(sectionAnalysis, autoMappedColumns)
      
      setParsedData({ 
        headers: sectionAnalysis.sections[0]?.headers || [],
        rows: [],
        sections: sectionData.sections,
        detectedSections: sectionAnalysis.detectedSections
      })
      
      // Check if we have the required mappings
      if (autoMappedColumns.description && autoMappedColumns.quantity && autoMappedColumns.unitPrice) {
        // Auto-proceed to preview if all required fields are mapped
        setMappedData(sectionData.mappedData)
        setSelectedSections(sectionData.defaultSections)
        setStep('preview')
      } else {
        // Go to mapping step if auto-mapping failed
        setStep('mapping')
      }
    } catch (error) {
      console.error('Error parsing file:', error)
      toast.error('Error parsing file. Please check the format.')
    } finally {
      setLoading(false)
    }
  }

  const analyzeSectionsInData = (jsonData: any[][]) => {
    const sections: Array<{
      title: string,
      headers: string[],
      startRow: number,
      endRow: number,
      dataRows: any[][]
    }> = []
    const detectedSections: string[] = []
    
    let currentSection: any = null
    let i = 0
    
    while (i < jsonData.length) {
      const row = jsonData[i]
      const firstCell = String(row[0] || '').trim()
      
      // Check if this row is a section title
      if (firstCell && isSectionTitle(firstCell)) {
        // Save previous section if exists
        if (currentSection) {
          currentSection.endRow = i - 1
          currentSection.dataRows = jsonData.slice(currentSection.startRow + 2, i).filter(r => 
            r.some(cell => cell && String(cell).trim() !== '') && 
            !isTotalRow(r)
          )
          sections.push(currentSection)
        }
        
        // Start new section
        const sectionType = detectSectionType(firstCell)
        currentSection = {
          title: firstCell,
          headers: jsonData[i + 1] || [],
          startRow: i,
          endRow: jsonData.length - 1,
          dataRows: []
        }
        
        if (sectionType && !detectedSections.includes(sectionType)) {
          detectedSections.push(sectionType)
        }
      }
      
      i++
    }
    
    // Save the last section
    if (currentSection) {
      currentSection.endRow = jsonData.length - 1
      currentSection.dataRows = jsonData.slice(currentSection.startRow + 2).filter(r => 
        r.some(cell => cell && String(cell).trim() !== '') && 
        !isTotalRow(r)
      )
      sections.push(currentSection)
    }
    
    // If no sections detected, treat the whole file as one section
    if (sections.length === 0) {
      const sectionType = 'kitchen_cabinets' // Default
      sections.push({
        title: 'Default Section',
        headers: jsonData[1] || [],
        startRow: 0,
        endRow: jsonData.length - 1,
        dataRows: jsonData.slice(2).filter(r => 
          r.some(cell => cell && String(cell).trim() !== '') && 
          !isTotalRow(r)
        )
      })
      detectedSections.push(sectionType)
    }
    
    return { sections, detectedSections }
  }

  const isSectionTitle = (text: string) => {
    const lowerText = text.toLowerCase()
    return lowerText.includes('quote') || 
           lowerText.includes('kitchen') || 
           lowerText.includes('cabinets') ||
           lowerText.includes('wardrobe') ||
           lowerText.includes('worktop') ||
           lowerText.includes('work top') ||
           lowerText.includes('accessories') ||
           lowerText.includes('appliances') ||
           lowerText.includes('tv') ||
           lowerText.includes('unit')
  }

  const isTotalRow = (row: any[]) => {
    return row.some(cell => {
      const cellStr = String(cell).toLowerCase().trim()
      return cellStr === 'total' || cellStr === 'subtotal' || cellStr === 'grand total' || 
             cellStr === 'sum' || cellStr === 'add labour' || cellStr.includes('labour')
    })
  }

  const detectSectionType = (title: string) => {
    const lowerTitle = title.toLowerCase()
    if (lowerTitle.includes('kitchen') && lowerTitle.includes('cabinets')) return 'kitchen_cabinets'
    if (lowerTitle.includes('wardrobe')) return 'wardrobes'
    if (lowerTitle.includes('worktop') || lowerTitle.includes('work top')) return 'worktop'
    if (lowerTitle.includes('accessories')) return 'accessories'
    if (lowerTitle.includes('appliances')) return 'appliances'
    if (lowerTitle.includes('tv') && lowerTitle.includes('unit')) return 'tvunit'
    return 'kitchen_cabinets' // Default
  }

  const processDataByDetectedSections = (sectionAnalysis: any, columnMapping: ColumnMapping) => {
    const sectionData: {[key: string]: any[]} = {}
    const sectionCounts: {[key: string]: number} = {}
    const defaultSections: {[key: string]: string} = {}
    
    // Initialize section data
    sectionAnalysis.detectedSections.forEach((section: string) => {
      sectionData[section] = []
      sectionCounts[section] = 0
      defaultSections[section] = section
    })
    
    // Process each detected section
    sectionAnalysis.sections.forEach((section: any) => {
      const sectionType = detectSectionType(section.title)
      
      // Map the data rows for this section
      const mappedRows = section.dataRows.map((row: any[]) => {
        const mappedRow: any = {}
        Object.entries(columnMapping).forEach(([field, headerName]) => {
          if (headerName) {
            const columnIndex = section.headers.indexOf(headerName)
            if (columnIndex !== -1) {
              mappedRow[field] = row[columnIndex]
            }
          }
        })
        return mappedRow
      }).filter((row: any) => row.description && row.quantity && row.unitPrice)
      
      // Add to the appropriate section
      if (sectionData[sectionType]) {
        sectionData[sectionType].push(...mappedRows)
        sectionCounts[sectionType] += mappedRows.length
      }
    })
    
    // Create sections array for display
    const sectionsArray = sectionAnalysis.detectedSections.map((section: string) => ({
      value: section,
      label: sections.find(s => s.value === section)?.label || section,
      count: sectionCounts[section]
    }))
    
    return {
      sections: sectionsArray,
      mappedData: sectionData,
      defaultSections
    }
  }

  const detectSectionsFromTitle = (titleRow: string[]) => {
    const detectedSections: string[] = []
    const titleText = titleRow.join(' ').toLowerCase()
    
    // Check for section keywords in the title
    if (titleText.includes('kitchen') && titleText.includes('cabinets')) {
      detectedSections.push('kitchen_cabinets')
    }
    if (titleText.includes('wardrobe') || titleText.includes('wardrobes')) {
      detectedSections.push('wardrobes')
    }
    if (titleText.includes('worktop') || titleText.includes('work top')) {
      detectedSections.push('worktop')
    }
    if (titleText.includes('accessories')) {
      detectedSections.push('accessories')
    }
    if (titleText.includes('appliances')) {
      detectedSections.push('appliances')
    }
    if (titleText.includes('tv') && titleText.includes('unit')) {
      detectedSections.push('tvunit')
    }
    
    // Default to kitchen cabinets if no sections detected
    if (detectedSections.length === 0) {
      detectedSections.push('kitchen_cabinets')
    }
    
    return detectedSections
  }

  const processDataBySections = (rows: any[][], headers: string[], columnMapping: ColumnMapping, detectedSections: string[]) => {
    const sectionData: {[key: string]: any[]} = {}
    const sectionCounts: {[key: string]: number} = {}
    const defaultSections: {[key: string]: string} = {}
    
    // Initialize section data
    detectedSections.forEach(section => {
      sectionData[section] = []
      sectionCounts[section] = 0
      defaultSections[section] = section
    })
    
    // If only one section detected, put all data there
    if (detectedSections.length === 1) {
      rows.forEach(row => {
        const mappedRow: any = {}
        Object.entries(columnMapping).forEach(([field, headerName]) => {
          if (headerName) {
            const columnIndex = headers.indexOf(headerName)
            if (columnIndex !== -1) {
              mappedRow[field] = row[columnIndex]
            }
          }
        })
        
        // Only process rows with valid data
        if (mappedRow.description && mappedRow.quantity && mappedRow.unitPrice) {
          sectionData[detectedSections[0]].push(mappedRow)
          sectionCounts[detectedSections[0]]++
        }
      })
    } else {
      // Multiple sections detected - need to analyze the data to separate by sections
      // This is a simplified approach - in a real implementation, you might need more sophisticated logic
      let currentSection = detectedSections[0] // Start with first section
      
      rows.forEach(row => {
        const mappedRow: any = {}
        Object.entries(columnMapping).forEach(([field, headerName]) => {
          if (headerName) {
            const columnIndex = headers.indexOf(headerName)
            if (columnIndex !== -1) {
              mappedRow[field] = row[columnIndex]
            }
          }
        })
        
        // Check if this row contains section indicators
        const description = String(mappedRow.description || '').toLowerCase()
        const hasSectionIndicator = detectedSections.some(section => {
          const sectionKeywords = getSectionKeywords(section)
          return sectionKeywords.some(keyword => description.includes(keyword))
        })
        
        // If we find a section indicator, switch to that section
        if (hasSectionIndicator) {
          for (const section of detectedSections) {
            const sectionKeywords = getSectionKeywords(section)
            if (sectionKeywords.some(keyword => description.includes(keyword))) {
              currentSection = section
              break
            }
          }
        }
        
        // Only process rows with valid data
        if (mappedRow.description && mappedRow.quantity && mappedRow.unitPrice) {
          sectionData[currentSection].push(mappedRow)
          sectionCounts[currentSection]++
        }
      })
    }
    
    // Create sections array for display
    const sectionsArray = detectedSections.map(section => ({
      value: section,
      label: sections.find(s => s.value === section)?.label || section,
      count: sectionCounts[section]
    }))
    
    return {
      sections: sectionsArray,
      mappedData: sectionData,
      defaultSections
    }
  }

  const getSectionKeywords = (section: string) => {
    const keywords: {[key: string]: string[]} = {
      'kitchen_cabinets': ['kitchen', 'cabinets', 'cabinet', 'board', 'hinge', 'screw', 'profile', 'led', 'door'],
      'wardrobes': ['wardrobe', 'wardrobes', 'closet', 'closets'],
      'worktop': ['worktop', 'work top', 'granite', 'slab', 'island', 'silicon', 'installation'],
      'accessories': ['accessory', 'accessories', 'handle', 'knob', 'pull'],
      'appliances': ['appliance', 'appliances', 'oven', 'fridge', 'dishwasher', 'microwave'],
      'tvunit': ['tv', 'television', 'unit', 'entertainment', 'media']
    }
    return keywords[section] || []
  }

  const autoMapColumns = (headers: string[]) => {
    const mapping: ColumnMapping = {
      description: '',
      unit: '',
      quantity: '',
      unitPrice: '',
      total: ''
    }

    // Auto-detect columns based on common header names
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase().trim()
      
      // Description mapping - prioritize exact matches first
      if (lowerHeader === 'description' || lowerHeader === 'item' || lowerHeader === 'name' || 
          lowerHeader === 'product' || lowerHeader === 'item name' || lowerHeader === 'product name') {
        mapping.description = header
      } else if (!mapping.description && (lowerHeader.includes('description') || lowerHeader.includes('item') || 
          lowerHeader.includes('name') || lowerHeader.includes('product'))) {
        mapping.description = header
      }
      // Unit mapping
      else if (lowerHeader === 'unit' || lowerHeader === 'units' || lowerHeader === 'uom' || 
               lowerHeader === 'measure' || lowerHeader === 'measurement') {
        mapping.unit = header
      } else if (!mapping.unit && (lowerHeader.includes('unit') || lowerHeader.includes('units') || 
               lowerHeader.includes('uom') || lowerHeader.includes('measure'))) {
        mapping.unit = header
      }
      // Quantity mapping
      else if (lowerHeader === 'qty' || lowerHeader === 'quantity' || lowerHeader === 'count' || 
               lowerHeader === 'amount' || lowerHeader === 'pieces') {
        mapping.quantity = header
      } else if (!mapping.quantity && (lowerHeader.includes('qty') || lowerHeader.includes('quantity') || 
               lowerHeader.includes('amount') || lowerHeader.includes('count'))) {
        mapping.quantity = header
      }
      // Unit Price mapping - prioritize exact matches
      else if (lowerHeader === 'unit price' || lowerHeader === 'unitprice' || lowerHeader === 'price' || 
               lowerHeader === 'rate' || lowerHeader === 'cost per unit' || lowerHeader === 'per unit' ||
               lowerHeader === 'unit cost' || lowerHeader === 'cost') {
        mapping.unitPrice = header
      } else if (!mapping.unitPrice && (lowerHeader.includes('unit price') || lowerHeader.includes('unitprice') || 
               lowerHeader.includes('price') || lowerHeader.includes('rate') ||
               lowerHeader.includes('cost per unit') || lowerHeader.includes('per unit'))) {
        mapping.unitPrice = header
      }
      // Total mapping
      else if (lowerHeader === 'total' || lowerHeader === 'subtotal' || lowerHeader === 'sum' || 
               lowerHeader === 'grand total' || lowerHeader === 'amount') {
        mapping.total = header
      } else if (!mapping.total && (lowerHeader.includes('total') || lowerHeader.includes('subtotal') || 
               lowerHeader.includes('amount') || lowerHeader.includes('sum'))) {
        mapping.total = header
      }
    })

    return mapping
  }

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    setColumnMapping(prev => ({ ...prev, [field]: value }))
  }

  const proceedToPreview = () => {
    if (!parsedData) return

    // For manual mapping, we need to re-analyze the data
    // This is a simplified approach - in a real implementation, you'd want to preserve the original analysis
    const sectionData = processDataBySections(parsedData.rows, parsedData.headers, columnMapping, parsedData.detectedSections)
    
    setMappedData(sectionData.mappedData)
    setSelectedSections(sectionData.defaultSections)
    setStep('preview')
  }

  const handleImport = () => {
    const totalItems = Object.values(mappedData).flat().length
    if (totalItems === 0) {
      toast.error('No valid data to import')
      return
    }

    // Prepare data for each section
    const importData: {[key: string]: any[]} = {}
    Object.entries(mappedData).forEach(([section, items]) => {
      if (items.length > 0) {
        importData[section] = items.map(row => ({
          category: section,
          description: String(row.description || '').trim(),
          unit: String(row.unit || 'pcs').trim(),
          quantity: parseFloat(row.quantity) || 1,
          unit_price: parseFloat(row.unitPrice) || 0,
          total_price: (parseFloat(row.quantity) || 1) * (parseFloat(row.unitPrice) || 0),
          specifications: '',
          notes: ''
        }))
      }
    })

    onImport(importData)
    
    // Create success message
    const sectionMessages = Object.entries(importData).map(([section, items]) => 
      `${items.length} items will be imported to ${sections.find(s => s.value === section)?.label}`
    )
    
    if (sectionMessages.length === 1) {
      toast.success(`Auto-Mapping Successful: ${sectionMessages[0]}`)
    } else {
      toast.success(`Auto-Mapping Successful: ${sectionMessages.join(' & ')}`)
    }
    
    // Reset modal state before closing
    resetModal()
    onClose()
  }

  const resetModal = () => {
    setStep('upload')
    setFile(null)
    setParsedData(null)
    setSelectedSections({})
    setColumnMapping({
      description: '',
      unit: '',
      quantity: '',
      unitPrice: '',
      total: ''
    })
    setMappedData({})
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
                <p className="mb-0 text-white small">Upload Excel/CSV file to import items</p>
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
                    
                    <div className="mb-4">
                      <label className="form-label fw-semibold">Sections will be auto-detected from your file</label>
                      <p className="text-muted small mb-0">
                        The system will automatically detect sections like "Kitchen Cabinets", "Wardrobes", "Worktop" from your Excel file headers.
                      </p>
                    </div>

                    <div className="d-flex justify-content-end">
                      <label className="btn btn-primary d-flex align-items-center" style={{ borderRadius: "12px", padding: "12px 24px" }}>
                        <Upload size={16} className="me-2" />
                        Choose File
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={handleFileUpload}
                          className="d-none"
                          disabled={loading}
                        />
                      </label>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {step === 'mapping' && parsedData && (
              <div>
                <div className="alert alert-info mb-4">
                  <h6 className="mb-2">Auto-Mapping Results</h6>
                  <p className="mb-0">The system automatically detected some columns. Please verify and adjust if needed:</p>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Description * 
                      {columnMapping.description && (
                        <span className="text-success ms-2">
                          <CheckCircle size={16} />
                        </span>
                      )}
                    </label>
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
                    <label className="form-label fw-semibold">
                      Unit
                      {columnMapping.unit && (
                        <span className="text-success ms-2">
                          <CheckCircle size={16} />
                        </span>
                      )}
                    </label>
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
                    <label className="form-label fw-semibold">
                      Quantity * 
                      {columnMapping.quantity && (
                        <span className="text-success ms-2">
                          <CheckCircle size={16} />
                        </span>
                      )}
                    </label>
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
                    <label className="form-label fw-semibold">
                      Unit Price * 
                      {columnMapping.unitPrice && (
                        <span className="text-success ms-2">
                          <CheckCircle size={16} />
                        </span>
                      )}
                    </label>
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

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => setStep('upload')}
                    style={{ borderRadius: "12px", padding: "12px 24px" }}
                  >
                    Back
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={proceedToPreview}
                    disabled={!columnMapping.description || !columnMapping.quantity || !columnMapping.unitPrice}
                    style={{ borderRadius: "12px", padding: "12px 24px" }}
                  >
                    Preview Data
                  </button>
                </div>
              </div>
            )}

            {step === 'preview' && parsedData && (
              <div>
                <div className="alert alert-success mb-4">
                  <h6 className="mb-2">
                    <CheckCircle size={20} className="me-2" />
                    Auto-Mapping Successful
                  </h6>
                  <p className="mb-0">
                    {Object.entries(mappedData).map(([section, items]) => 
                      `${items.length} items will be imported to ${sections.find(s => s.value === section)?.label}`
                    ).join(' & ')}
                  </p>
                </div>

                {/* Section Selection */}
                {parsedData.sections.length > 1 && (
                  <div className="mb-4">
                    <h6 className="mb-3">Detected Sections:</h6>
                    <div className="row g-2">
                      {parsedData.sections.map((section, index) => (
                        <div key={section.value} className={`col-md-${12 / Math.min(parsedData.sections.length, 3)}`}>
                          <label className="form-label fw-semibold">{section.label}</label>
                          <select 
                            className="form-select"
                            value={selectedSections[section.value] || section.value}
                            onChange={(e) => setSelectedSections(prev => ({
                              ...prev,
                              [section.value]: e.target.value
                            }))}
                          >
                            {sections.map(s => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                          <small className="text-muted">{section.count} items</small>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Data Preview */}
                <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table className="table table-sm">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th>Section</th>
                        <th>Description</th>
                        <th>Unit</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(mappedData).flatMap(([section, items]) => 
                        items.slice(0, 5).map((row, index) => (
                          <tr key={`${section}-${index}`}>
                            <td>
                              <span className="badge bg-primary">
                                {sections.find(s => s.value === section)?.label}
                              </span>
                            </td>
                            <td>{row.description}</td>
                            <td>{row.unit || 'pcs'}</td>
                            <td>{row.quantity}</td>
                            <td>{row.unitPrice}</td>
                            <td>{(parseFloat(row.quantity) || 0) * (parseFloat(row.unitPrice) || 0)}</td>
                          </tr>
                        ))
                      )}
                      {Object.values(mappedData).flat().length > 5 && (
                        <tr>
                          <td colSpan={6} className="text-center text-muted">
                            ... and {Object.values(mappedData).flat().length - 5} more items
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => setStep('mapping')}
                    style={{ borderRadius: "12px", padding: "12px 24px" }}
                  >
                    Back to Mapping
                  </button>
                  <button 
                    className="btn btn-success"
                    onClick={handleImport}
                    style={{ borderRadius: "12px", padding: "12px 24px" }}
                  >
                    <CheckCircle size={16} className="me-2" />
                    Import {Object.values(mappedData).flat().length} Items
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
