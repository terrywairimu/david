// Image to PDF - Uses quotation-style header, one image per page with editable design name
// Images stored locally (client-side), not in database

import { defaultValues } from './pdf-template'
import { fetchImageAsBase64 } from './dynamic-report-pdf'

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297

export interface ImageToPdfPage {
  imageDataUrl: string
  designName: string
  fontSize: number
  fontColor: string
}

export interface ImageToPdfInput {
  clientName: string
  projectLocation?: string
  companyName?: string
  companyLocation?: string
  companyPhone?: string
  companyEmail?: string
  companyLogo?: string
  date?: string
  pages: ImageToPdfPage[]
}

const defaultCompany = {
  companyName: defaultValues.companyName,
  companyLocation: defaultValues.companyLocation,
  companyPhone: defaultValues.companyPhone,
  companyEmail: defaultValues.companyEmail,
}

export async function generateImageToPdf(input: ImageToPdfInput): Promise<Uint8Array> {
  const { generate } = await import('@pdfme/generator')
  const { text, rectangle, line, image } = await import('@pdfme/schemas')

  const company = {
    ...defaultCompany,
    companyName: input.companyName || defaultCompany.companyName,
    companyLocation: input.companyLocation || defaultCompany.companyLocation,
    companyPhone: input.companyPhone || defaultCompany.companyPhone,
    companyEmail: input.companyEmail || defaultCompany.companyEmail,
  }

  const date = input.date || new Date().toLocaleDateString('en-KE')

  // Use same logo approach as Reports - /logowatermark.png (avoids malformed /logo.png)
  let logoBase64 = input.companyLogo || ''
  if (!logoBase64) {
    logoBase64 = await fetchImageAsBase64('/logowatermark.png')
  }

  // Filter out empty/invalid pages - only valid image data URLs (strict: must have real base64 payload)
  const validPages = input.pages.filter((p) => {
    if (!p?.imageDataUrl || typeof p.imageDataUrl !== 'string') return false
    const s = p.imageDataUrl
    if (!s.startsWith('data:image/')) return false
    const base64Idx = s.indexOf('base64,')
    if (base64Idx < 0) return false
    const payload = s.slice(base64Idx + 7)
    return payload.length >= 100 // ensure real image data, not placeholder
  })

  if (validPages.length === 0) {
    throw new Error('No valid images to include in PDF')
  }

  const pageSchemas: any[][] = []
  const pageInputs: Record<string, string>[] = []

  validPages.forEach((page, idx) => {
    const schemas: any[] = []
    const inputs: Record<string, string> = {}

    if (idx === 0) {
      // First page: header block - only add logo if we have real image (avoid 1x1 fallback)
      if (logoBase64 && logoBase64.length > 500) {
        schemas.push({ name: 'logo', type: 'image', position: { x: 15, y: 5 }, width: 38, height: 38 })
      }
      schemas.push(
        { name: 'companyName', type: 'text', position: { x: 60, y: 11 }, width: 140, height: 14, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'left' },
        { name: 'companyLocation', type: 'text', position: { x: 60, y: 21 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
        { name: 'companyPhone', type: 'text', position: { x: 60, y: 27 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
        { name: 'companyEmail', type: 'text', position: { x: 60, y: 33 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
        { name: 'headerBg', type: 'rectangle', position: { x: 15, y: 47 }, width: 180, height: 14, color: '#E5E5E5', radius: 5 },
        { name: 'docTitle', type: 'text', position: { x: 0, y: 50 }, width: 210, height: 12, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'center' },
        // Compact client info: Row1 = Client | Project Location (50/50), Row2 = Date
        { name: 'clientInfoBox', type: 'rectangle', position: { x: 15, y: 64 }, width: 180, height: 18, color: '#E8E8E8', radius: 4 },
        { name: 'clientLabel', type: 'text', position: { x: 18, y: 67 }, width: 18, height: 5, fontSize: 8, fontColor: '#333', fontName: 'Helvetica-Bold', alignment: 'left' },
        { name: 'clientValue', type: 'text', position: { x: 36, y: 67 }, width: 72, height: 5, fontSize: 8, fontColor: '#333', fontName: 'Helvetica', alignment: 'left' },
        { name: 'locationLabel', type: 'text', position: { x: 98, y: 67 }, width: 38, height: 5, fontSize: 8, fontColor: '#333', fontName: 'Helvetica-Bold', alignment: 'left' },
        { name: 'locationValue', type: 'text', position: { x: 136, y: 67 }, width: 56, height: 5, fontSize: 8, fontColor: '#333', fontName: 'Helvetica', alignment: 'left' },
        { name: 'dateLabel', type: 'text', position: { x: 18, y: 75 }, width: 14, height: 5, fontSize: 8, fontColor: '#333', fontName: 'Helvetica-Bold', alignment: 'left' },
        { name: 'dateValue', type: 'text', position: { x: 32, y: 75 }, width: 50, height: 5, fontSize: 8, fontColor: '#333', fontName: 'Helvetica', alignment: 'left' }
      )
      if (logoBase64 && logoBase64.length > 500) inputs.logo = logoBase64
      inputs.companyName = company.companyName
      inputs.companyLocation = company.companyLocation
      inputs.companyPhone = company.companyPhone
      inputs.companyEmail = company.companyEmail
      inputs.headerBg = ''
      inputs.docTitle = 'DESIGN CATALOGUE'
      inputs.clientInfoBox = ''
      inputs.clientLabel = 'Client:'
      inputs.clientValue = input.clientName
      inputs.locationLabel = 'Project Location:'
      inputs.locationValue = input.projectLocation || '-'
      inputs.dateLabel = 'Date:'
      inputs.dateValue = date
    }

    // Image: full width; non-first pages start below header (design name)
    const imgTop = idx === 0 ? 85 : 22
    const imgHeight = idx === 0 ? PAGE_HEIGHT - 95 : PAGE_HEIGHT - 27
    const imgWidth = PAGE_WIDTH
    const imgX = 0

    schemas.push({
      name: `img${idx}`,
      type: 'image',
      position: { x: imgX, y: imgTop },
      width: imgWidth,
      height: imgHeight
    })
    inputs[`img${idx}`] = page.imageDataUrl

    // Design name: first page = below image; other pages = header position, font 36 default
    if (idx === 0) {
      schemas.push({
        name: `designName${idx}`,
        type: 'text',
        position: { x: 0, y: PAGE_HEIGHT - 25 },
        width: PAGE_WIDTH,
        height: 12,
        fontSize: page.fontSize,
        fontColor: page.fontColor,
        fontName: 'Helvetica',
        alignment: 'center'
      })
    } else {
      schemas.push({
        name: `designName${idx}`,
        type: 'text',
        position: { x: 0, y: 4 },
        width: PAGE_WIDTH,
        height: 14,
        fontSize: 30,
        fontColor: page.fontColor,
        fontName: 'Helvetica-Bold',
        alignment: 'center'
      })
    }
    inputs[`designName${idx}`] = page.designName || `Design ${idx + 1}`

    pageSchemas.push(schemas)
    pageInputs.push(inputs)
  })

  const template = {
    basePdf: { width: PAGE_WIDTH, height: PAGE_HEIGHT, padding: [0, 0, 0, 0] as [number, number, number, number] },
    schemas: pageSchemas
  }

  const pdf = await generate({
    template,
    inputs: pageInputs,
    plugins: { text, rectangle, line, image }
  })

  return pdf
}
