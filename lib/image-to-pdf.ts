// Image to PDF - Uses quotation-style header, one image per page with editable design name
// Images stored locally (client-side), not in database

import { defaultValues, imageToBase64 } from './pdf-template'

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

  // Load Cabinet Master logo from /logo.png (same as quotations), fallback to logowatermark
  let logoBase64 = input.companyLogo || ''
  if (!logoBase64) {
    logoBase64 = await imageToBase64('/logo.png')
  }
  if (!logoBase64) {
    logoBase64 = await imageToBase64('/logowatermark.png')
  }

  // Filter out empty pages (no valid image)
  const validPages = input.pages.filter((p) => p?.imageDataUrl && p.imageDataUrl.startsWith('data:'))

  if (validPages.length === 0) {
    throw new Error('No valid images to include in PDF')
  }

  const pageSchemas: any[][] = []
  const pageInputs: Record<string, string>[] = []

  validPages.forEach((page, idx) => {
    const schemas: any[] = []
    const inputs: Record<string, string> = {}

    if (idx === 0) {
      // First page: header block (like quotation) - Client, Project Location, Date vertically
      if (logoBase64) {
        schemas.push({ name: 'logo', type: 'image', position: { x: 15, y: 5 }, width: 38, height: 38 })
      }
      schemas.push(
        { name: 'companyName', type: 'text', position: { x: 60, y: 11 }, width: 140, height: 14, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'left' },
        { name: 'companyLocation', type: 'text', position: { x: 60, y: 21 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
        { name: 'companyPhone', type: 'text', position: { x: 60, y: 27 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
        { name: 'companyEmail', type: 'text', position: { x: 60, y: 33 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
        { name: 'headerBg', type: 'rectangle', position: { x: 15, y: 47 }, width: 180, height: 14, color: '#E5E5E5', radius: 5 },
        { name: 'docTitle', type: 'text', position: { x: 0, y: 50 }, width: 210, height: 12, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'center' },
        { name: 'clientInfoBox', type: 'rectangle', position: { x: 15, y: 64 }, width: 180, height: 38, color: '#E5E5E5', radius: 4 },
        { name: 'clientLabel', type: 'text', position: { x: 18, y: 67 }, width: 30, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
        { name: 'clientValue', type: 'text', position: { x: 55, y: 67 }, width: 130, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
        { name: 'locationLabel', type: 'text', position: { x: 18, y: 79 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
        { name: 'locationValue', type: 'text', position: { x: 75, y: 79 }, width: 110, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
        { name: 'dateLabel', type: 'text', position: { x: 18, y: 91 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
        { name: 'dateValue', type: 'text', position: { x: 47, y: 91 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' }
      )
      if (logoBase64) inputs.logo = logoBase64
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

    // Image: full width, no margins - entire page width
    const imgTop = idx === 0 ? 108 : 0
    const imgHeight = idx === 0 ? 150 : PAGE_HEIGHT - 40
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

    // Design name: below image, editable styling
    const nameTop = idx === 0 ? 262 : PAGE_HEIGHT - 35
    schemas.push({
      name: `designName${idx}`,
      type: 'text',
      position: { x: 0, y: nameTop },
      width: PAGE_WIDTH,
      height: 10,
      fontSize: page.fontSize,
      fontColor: page.fontColor,
      fontName: 'Helvetica',
      alignment: 'center'
    })
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
