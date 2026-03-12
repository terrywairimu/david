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
  const { text, rectangle, image } = await import('@pdfme/schemas')

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
    const s = p.imageDataUrl.trim()
    if (!s.startsWith('data:image/')) return false
    const base64Idx = s.indexOf('base64,')
    if (base64Idx < 0) return false
    const payload = s.slice(base64Idx + 7)
    return payload.length >= 200
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
        // Client info: vertical block - Client, Project Location, Date. All values aligned at x:52.
        { name: 'clientInfoBox', type: 'rectangle', position: { x: 15, y: 64 }, width: 180, height: 24, color: '#E8E8E8', radius: 4 },
        { name: 'clientLabel', type: 'text', position: { x: 18, y: 67 }, width: 32, height: 5, fontSize: 8, fontColor: '#333', fontName: 'Helvetica-Bold', alignment: 'left' },
        { name: 'clientValue', type: 'text', position: { x: 52, y: 67 }, width: 140, height: 5, fontSize: 8, fontColor: '#333', fontName: 'Helvetica', alignment: 'left' },
        { name: 'locationLabel', type: 'text', position: { x: 18, y: 73 }, width: 32, height: 5, fontSize: 8, fontColor: '#333', fontName: 'Helvetica-Bold', alignment: 'left' },
        { name: 'locationValue', type: 'text', position: { x: 52, y: 73 }, width: 140, height: 5, fontSize: 8, fontColor: '#333', fontName: 'Helvetica', alignment: 'left' },
        { name: 'dateLabel', type: 'text', position: { x: 18, y: 79 }, width: 32, height: 5, fontSize: 8, fontColor: '#333', fontName: 'Helvetica-Bold', alignment: 'left' },
        { name: 'dateValue', type: 'text', position: { x: 52, y: 79 }, width: 60, height: 5, fontSize: 8, fontColor: '#333', fontName: 'Helvetica', alignment: 'left' }
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

    // Image: full width; first page imgTop after client box (y:64+24=88)
    const imgTop = idx === 0 ? 90 : 22
    const imgHeight = idx === 0 ? PAGE_HEIGHT - 100 : PAGE_HEIGHT - 27
    const imgWidth = PAGE_WIDTH
    const imgX = 0

    // White background behind image (prevents black from transparent areas)
    schemas.push({
      name: `imgBg${idx}`,
      type: 'rectangle',
      position: { x: imgX, y: imgTop },
      width: imgWidth,
      height: imgHeight,
      color: '#FFFFFF',
      radius: 0
    })
    inputs[`imgBg${idx}`] = ''
    schemas.push({
      name: `img${idx}`,
      type: 'image',
      position: { x: imgX, y: imgTop },
      width: imgWidth,
      height: imgHeight
    })
    inputs[`img${idx}`] = page.imageDataUrl

    // Design name: first page = below image; other pages = header. Use page.fontSize (card shows actual value)
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
        fontSize: page.fontSize,
        fontColor: page.fontColor,
        fontName: 'Helvetica-Bold',
        alignment: 'center'
      })
    }
    inputs[`designName${idx}`] = page.designName || `Design ${idx + 1}`

    pageSchemas.push(schemas)
    pageInputs.push(inputs)
  })

  // pdfme: pass ONE merged input object for multi-page (array of inputs = duplicate docs/pages)
  const mergedInputs = Object.assign({}, ...pageInputs)

  const template = {
    basePdf: { width: PAGE_WIDTH, height: PAGE_HEIGHT, padding: [0, 0, 0, 0] as [number, number, number, number] },
    schemas: pageSchemas
  }

  const pdf = await generate({
    template,
    inputs: [mergedInputs],
    plugins: { text, rectangle, image }
  })

  return pdf
}
