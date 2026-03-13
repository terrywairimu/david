// Image to PDF - Uses quotation-style header, one image per page with editable design name
// Each page height matches the image height (width constant); pages merged into one PDF

import { defaultValues } from './pdf-template'
import { fetchImageAsBase64 } from './dynamic-report-pdf'

const PAGE_WIDTH = 210

function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataUrl
  })
}

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
  const { PDFDocument } = await import('@pdfme/pdf-lib')

  const company = {
    ...defaultCompany,
    companyName: input.companyName || defaultCompany.companyName,
    companyLocation: input.companyLocation || defaultCompany.companyLocation,
    companyPhone: input.companyPhone || defaultCompany.companyPhone,
    companyEmail: input.companyEmail || defaultCompany.companyEmail,
  }

  const date = input.date || new Date().toLocaleDateString('en-KE')

  let logoBase64 = input.companyLogo || ''
  if (!logoBase64) {
    logoBase64 = await fetchImageAsBase64('/logowatermark.png')
  }

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

  const pageHeights: number[] = []
  for (let i = 0; i < validPages.length; i++) {
    const dims = await getImageDimensions(validPages[i].imageDataUrl)
    const imgHeightMm = PAGE_WIDTH * (dims.height / dims.width)
    if (i === 0) {
      pageHeights.push(84 + imgHeightMm + 20)
    } else {
      pageHeights.push(11 + imgHeightMm)
    }
  }

  const pdfBuffers: Uint8Array[] = []

  for (let idx = 0; idx < validPages.length; idx++) {
    const page = validPages[idx]
    const PAGE_HEIGHT = pageHeights[idx]
    const schemas: any[] = []
    const inputs: Record<string, string> = {}

    if (idx === 0) {
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
        { name: 'clientInfoBox', type: 'rectangle', position: { x: 15, y: 64 }, width: 180, height: 18, color: '#E8E8E8', radius: 4 },
        { name: 'clientLabel', type: 'text', position: { x: 18, y: 66 }, width: 35, height: 6, fontSize: 11, fontColor: '#333', fontName: 'Helvetica-Bold', alignment: 'left' },
        { name: 'clientValue', type: 'text', position: { x: 55, y: 66 }, width: 135, height: 6, fontSize: 11, fontColor: '#333', fontName: 'Helvetica', alignment: 'left' },
        { name: 'locationLabel', type: 'text', position: { x: 18, y: 72 }, width: 35, height: 6, fontSize: 11, fontColor: '#333', fontName: 'Helvetica-Bold', alignment: 'left' },
        { name: 'locationValue', type: 'text', position: { x: 55, y: 72 }, width: 135, height: 6, fontSize: 11, fontColor: '#333', fontName: 'Helvetica', alignment: 'left' },
        { name: 'dateLabel', type: 'text', position: { x: 18, y: 78 }, width: 35, height: 6, fontSize: 11, fontColor: '#333', fontName: 'Helvetica-Bold', alignment: 'left' },
        { name: 'dateValue', type: 'text', position: { x: 55, y: 78 }, width: 65, height: 6, fontSize: 11, fontColor: '#333', fontName: 'Helvetica', alignment: 'left' }
      )
      if (logoBase64 && logoBase64.length > 500) inputs.logo = logoBase64
      inputs.companyName = company.companyName
      inputs.companyLocation = company.companyLocation
      inputs.companyPhone = company.companyPhone
      inputs.companyEmail = company.companyEmail
      inputs.headerBg = ''
      inputs.docTitle = '3D DESIGN VISUALIZATION'
      inputs.clientInfoBox = ''
      inputs.clientLabel = 'Client:'
      inputs.clientValue = input.clientName
      inputs.locationLabel = 'Project Location:'
      inputs.locationValue = input.projectLocation || '-'
      inputs.dateLabel = 'Date:'
      inputs.dateValue = date
    }

    const imgTop = idx === 0 ? 84 : 11
    const imgHeight = idx === 0 ? PAGE_HEIGHT - 104 : PAGE_HEIGHT - 11
    const imgWidth = PAGE_WIDTH
    const imgX = 0

    schemas.push({
      name: 'imgBg',
      type: 'rectangle',
      position: { x: imgX, y: imgTop },
      width: imgWidth,
      height: imgHeight,
      color: '#FFFFFF',
      radius: 0
    })
    inputs.imgBg = ''
    schemas.push({
      name: 'img',
      type: 'image',
      position: { x: imgX, y: imgTop },
      width: imgWidth,
      height: imgHeight
    })
    inputs.img = page.imageDataUrl

    if (idx === 0) {
      schemas.push({
        name: 'designName',
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
        name: 'designName',
        type: 'text',
        position: { x: 0, y: 1 },
        width: PAGE_WIDTH,
        height: 5,
        fontSize: page.fontSize,
        fontColor: page.fontColor,
        fontName: 'Helvetica-Bold',
        alignment: 'center'
      })
    }
    inputs.designName = page.designName || `Design ${idx + 1}`

    const template = {
      basePdf: { width: PAGE_WIDTH, height: PAGE_HEIGHT, padding: [0, 0, 0, 0] as [number, number, number, number] },
      schemas: [schemas]
    }

    const pdfBytes = await generate({
      template,
      inputs: [inputs],
      plugins: { text, rectangle, image }
    })

    pdfBuffers.push(pdfBytes)
  }

  const mergedPdf = await PDFDocument.create()
  for (const buf of pdfBuffers) {
    const doc = await PDFDocument.load(buf)
    const [copiedPage] = await mergedPdf.copyPages(doc, [0])
    mergedPdf.addPage(copiedPage)
  }

  return new Uint8Array(await mergedPdf.save())
}
