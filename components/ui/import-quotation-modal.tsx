"use client"

import React, { useState, useRef } from "react"
import { X, Upload, FileSpreadsheet, FileText, CheckCircle, AlertCircle, Download } from "lucide-react"
import { toast } from "sonner"
import * as XLSX from 'xlsx'

interface CustomSectionOption {
  id: string
  name: string
  type: string
  anchorKey: string
}

interface ImportQuotationModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (data: any) => void
  /** Existing custom sections to include in the target dropdown */
  customSections?: CustomSectionOption[]
}

interface ParsedSection {
  value: string
  label: string
  count: number
  sectionType: string
  title: string
}

interface ParsedData {
  headers: string[]
  rows: any[][]
  sections: ParsedSection[]
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
  onImport,
  customSections = []
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
  const [worktopLabor, setWorktopLabor] = useState<{ qty: number; unitPrice: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const mainSections = [
    { value: 'kitchen_cabinets', label: 'Kitchen Cabinets' },
    { value: 'worktop', label: 'Worktop' },
    { value: 'accessories', label: 'Accessories' },
    { value: 'appliances', label: 'Appliances' },
    { value: 'wardrobes', label: 'Wardrobes' },
    { value: 'tvunit', label: 'TV Unit' }
  ]

  /** All section options for the dropdown: main + custom + create-new per parsed section */
  const getSectionOptionsFor = (parsedSection: ParsedSection | undefined) => {
    const options = [...mainSections]
    customSections.forEach(cs => {
      options.push({ value: `custom:${cs.id}`, label: cs.name })
    })
    if (parsedSection) {
      options.push({ value: `create_new:${parsedSection.value}`, label: `Create new: ${parsedSection.title}` })
    }
    return options
  }

  const getSectionLabel = (value: string) => {
    if (value.startsWith('custom:')) {
      const id = value.slice(7)
      return customSections.find(c => c.id === id)?.name ?? value
    }
    if (value.startsWith('create_new:')) {
      const key = value.slice(11)
      const ps = parsedData?.sections.find(s => s.value === key)
      return ps ? `Create new: ${ps.title}` : value
    }
    return mainSections.find(s => s.value === value)?.label ?? value
  }

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
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][]

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
        setMappedData(sectionData.mappedData)
        setSelectedSections(sectionData.defaultSections)
        setWorktopLabor(sectionData.worktopLabor || null)
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
    const rowText = row.map(c => String(c ?? '').toLowerCase().trim()).join(' ')
    if ((rowText.includes('worktop') || rowText.includes('installation')) && (rowText.includes('labor') || rowText.includes('labour'))) {
      return false
    }
    if (rowText.includes('installation') && (rowText.includes('labor') || rowText.includes('labour')) && (rowText.includes('slab') || rowText.includes('per'))) {
      return false
    }
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
    return 'kitchen_cabinets' // Default for unrecognized (e.g. Dining, Office)
  }

  /** True if title matches a standard section type (Kitchen, Wardrobe, etc.) */
  const isStandardSectionTitle = (title: string) => {
    const lower = (title ?? '').toLowerCase()
    return (lower.includes('kitchen') && lower.includes('cabinets')) ||
      lower.includes('wardrobe') || lower.includes('worktop') || lower.includes('work top') ||
      lower.includes('accessories') || lower.includes('appliances') ||
      (lower.includes('tv') && lower.includes('unit'))
  }

  const processDataByDetectedSections = (sectionAnalysis: any, columnMapping: ColumnMapping) => {
    const sectionData: {[key: string]: any[]} = {}
    const defaultSections: {[key: string]: string} = {}
    let worktopLabor: { qty: number; unitPrice: number } | null = null

    const isWorktopLaborRow = (row: any) => {
      const desc = String(row.description ?? row.unit ?? '').toLowerCase()
      const hasLabor = desc.includes('labor') || desc.includes('labour')
      const hasWorktopOrInstall = desc.includes('worktop') || desc.includes('installation') || desc.includes('slab') || desc.includes('per slab')
      return hasLabor && (hasWorktopOrInstall || row.unit?.toLowerCase().includes('slab'))
    }

    sectionAnalysis.sections.forEach((section: any, index: number) => {
      const uniqueKey = `section_${index}`
      const sectionType = detectSectionType(section.title)

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
      })

      if (sectionType === 'worktop') {
        const laborRow = mappedRows.find((r: any) => isWorktopLaborRow(r))
        if (laborRow && !worktopLabor) {
          let qty = parseInt(String(laborRow.quantity || 1), 10) || 1
          let unitPrice = parseFloat(String(laborRow.unitPrice || 3000)) || 3000
          if (unitPrice > 0 && laborRow.total != null && laborRow.total !== '') {
            const total = parseFloat(String(laborRow.total))
            if (!isNaN(total) && total > 0) qty = Math.round(total / unitPrice) || qty
          }
          worktopLabor = { qty, unitPrice }
        }
      }

      const itemRows = mappedRows.filter((row: any) => {
        if (isWorktopLaborRow(row)) return false
        return row.description && row.quantity != null && row.unitPrice != null
      })

      sectionData[uniqueKey] = itemRows
      defaultSections[uniqueKey] = `create_new:${uniqueKey}`
    })
    
    const sectionsArray: ParsedSection[] = sectionAnalysis.sections.map((section: any, index: number) => {
      const uniqueKey = `section_${index}`
      const sectionType = detectSectionType(section.title)
      let count = sectionData[uniqueKey]?.length || 0
      if (sectionType === 'worktop' && worktopLabor) count += 1
      return {
        value: uniqueKey,
        label: section.title || mainLabelForType(sectionType),
        count,
        sectionType,
        title: section.title
      }
    })
    
    return {
      sections: sectionsArray,
      mappedData: sectionData,
      defaultSections,
      worktopLabor
    }
  }

  const mainLabelForType = (sectionType: string) => {
    return mainSections.find(s => s.value === sectionType)?.label || sectionType
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
      label: mainSections.find(s => s.value === section)?.label || section,
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
               lowerHeader === 'amount' || lowerHeader === 'pieces' || lowerHeader === 'no. of slabs' ||
               lowerHeader === 'no of slabs' || lowerHeader === 'slabs' || lowerHeader === 'number of slabs') {
        mapping.quantity = header
      } else if (!mapping.quantity && (lowerHeader.includes('qty') || lowerHeader.includes('quantity') || 
               lowerHeader.includes('amount') || lowerHeader.includes('count') || lowerHeader.includes('slab'))) {
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

    const sectionData = processDataBySections(parsedData.rows, parsedData.headers, columnMapping, parsedData.detectedSections)
    
    setMappedData(sectionData.mappedData)
    setSelectedSections(sectionData.defaultSections)
    setWorktopLabor(null)
    setStep('preview')
  }

  const handleImport = () => {
    const totalItems = Object.values(mappedData).flat().length
    if (totalItems === 0) {
      toast.error('No valid data to import')
      return
    }

    const toItem = (row: any, category: string) => ({
      category: category === 'kitchen_cabinets' ? 'cabinet' : category as string,
      description: String(row.description || '').trim(),
      unit: String(row.unit || 'pcs').trim(),
      quantity: parseFloat(row.quantity) || 1,
      unit_price: parseFloat(row.unitPrice) || 0,
      total_price: (parseFloat(row.quantity) || 1) * (parseFloat(row.unitPrice) || 0),
      specifications: '',
      notes: ''
    })

    const mainSectionTypeToCategory: Record<string, string> = {
      kitchen_cabinets: 'cabinet',
      worktop: 'worktop',
      accessories: 'accessories',
      appliances: 'appliances',
      wardrobes: 'wardrobes',
      tvunit: 'tvunit'
    }

    const main: {[key: string]: any[]} = {}
    const custom: {[key: string]: any[]} = {}
    const createNew: Array<{ name: string; sectionType: string; anchorKey: string; type: 'normal' | 'worktop'; items: any[] }> = []

    // Base names for indexed section names (Wardrobe, Wardrobe 1, Wardrobe 2...)
    const anchorBaseName: Record<string, string> = {
      cabinet: 'Kitchen Cabinets',
      worktop: 'Worktop',
      accessories: 'Accessories',
      appliances: 'Appliances',
      wardrobes: 'Wardrobe',
      tvunit: 'TV Unit'
    }

    const isSameBase = (name: string, base: string) =>
      name === base || new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\d+$`).test(name)

    Object.entries(mappedData).forEach(([sectionKey, items]) => {
      if (items.length === 0) return
      const target = selectedSections[sectionKey] ?? parsedData?.sections.find(s => s.value === sectionKey)?.sectionType ?? sectionKey
      const parsed = parsedData?.sections.find(s => s.value === sectionKey)
      const sectionType = parsed?.sectionType ?? 'kitchen_cabinets'
      const category = mainSectionTypeToCategory[sectionType] ?? sectionType
      const mappedItems = items.map((row: any) => toItem(row, category))

      if (target.startsWith('custom:')) {
        const id = target.slice(7)
        if (!custom[id]) custom[id] = []
        custom[id].push(...mappedItems)
      } else if (target.startsWith('create_new:')) {
        const anchorKey = sectionType === 'worktop' ? 'worktop' : 
          sectionType === 'wardrobes' ? 'wardrobes' : sectionType === 'accessories' ? 'accessories' :
          sectionType === 'appliances' ? 'appliances' : sectionType === 'tvunit' ? 'tvunit' : 'cabinet'
        const rawTitle = (parsed?.title ?? '').trim()
        const isCustom = rawTitle && !isStandardSectionTitle(rawTitle)
        const baseName = isCustom ? rawTitle : (anchorBaseName[anchorKey] ?? 'Section')
        const existingSame = isCustom
          ? customSections.filter(s => isSameBase(s.name, baseName)).length
          : customSections.filter(s => s.anchorKey === anchorKey).length
        const priorSame = isCustom
          ? createNew.filter(cn => isSameBase(cn.name, baseName)).length
          : createNew.filter(cn => cn.anchorKey === anchorKey).length
        const index = existingSame + priorSame
        const name = index === 0
          ? (parsed?.title ?? baseName)
          : `${baseName} ${index}`
        createNew.push({
          name,
          sectionType,
          anchorKey,
          type: sectionType === 'worktop' ? 'worktop' : 'normal',
          items: mappedItems
        })
      } else {
        if (!main[target]) main[target] = []
        main[target].push(...mappedItems)
      }
    })

    onImport({ main, custom, createNew, worktopLabor: worktopLabor || undefined })
    resetModal()
    onClose()
  }

  const resetModal = () => {
    setStep('upload')
    setFile(null)
    setParsedData(null)
    setSelectedSections({})
    setWorktopLabor(null)
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
    <div className="modal fade show d-block import-quotation-modal" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl modal-dialog-centered">
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
                <h5 className="modal-title mb-1 fw-bold">
                  Import Quotation Data
                </h5>
                <p className="mb-0 text-muted small">Upload Excel/CSV file to import items</p>
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
          <div className="modal-body" style={{ 
            padding: "24px 32px", 
            maxHeight: "70vh", 
            overflowY: "auto" 
          }}>
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
                    {Object.entries(mappedData).map(([sectionKey, items]) => {
                      const parsed = parsedData.sections.find(s => s.value === sectionKey)
                      const targetLabel = getSectionLabel(selectedSections[sectionKey] || parsed?.sectionType || sectionKey)
                      return `${items.length} items will be imported to ${targetLabel} section. To allocate another section use the dropdown below.`
                    }).join(' ')}
                  </p>
                </div>

                {/* Section Mapping - all detected sections with dropdown to verify/change target */}
                <div className="mb-4">
                  <h6 className="fw-semibold mb-2">Section Mappings (verify before import)</h6>
                  <div className="row g-2">
                    {parsedData.sections.map((section) => (
                      <div key={section.value} className={`col-md-${12 / Math.min(parsedData.sections.length, 3)}`}>
                        <label className="form-label fw-semibold">
                          {section.label}
                        </label>
                        <select 
                          className="form-select"
                          value={selectedSections[section.value] ?? section.sectionType}
                          onChange={(e) => setSelectedSections(prev => ({
                            ...prev,
                            [section.value]: e.target.value
                          }))}
                        >
                          {getSectionOptionsFor(section).map(s => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        <small className="text-muted d-block">{section.count} items → {getSectionLabel(selectedSections[section.value] ?? section.sectionType)}</small>
                      </div>
                    ))}
                  </div>
                </div>

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
                                {getSectionLabel(selectedSections[section] ?? parsedData.sections.find(s => s.value === section)?.sectionType ?? section)}
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

          {/* Footer */}
          <div className="modal-footer border-0" style={{ padding: "16px 24px 16px" }}>
            {/* Footer content can be added here if needed */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImportQuotationModal
