/**
 * Analytics Report PDF Generator
 * Professional grade report with Cabinet Master template
 * Dynamic content based on section, subType/client, and time range
 */

import { fetchImageAsBase64 } from './dynamic-report-pdf'
import type { SectionId, TimeRangeKey } from './analytics-config'
import { SECTIONS, getSubTypes, getHeaderStatsConfig, TIME_RANGE_LABELS } from './analytics-config'

const PAGE = { width: 210, height: 297 }
const MARGIN = { left: 12, right: 12, top: 12, bottom: 15 }

export interface AnalyticsReportParams {
  section: SectionId
  subType: string
  clientFilter: string
  timeRange: TimeRangeKey
  timeLabel: string
  customStart?: string
  customEnd?: string
  comprehensiveSummary: Record<string, number | undefined> | null
  comprehensiveChartData: { date: string; [key: string]: string | number | undefined }[]
  chartTitle: string
  analyticsMetric: string
  segmentationSegments: { name: string; value: number; revenue: number; color?: string }[]
  aiInsights?: { title: string; description: string }[]
  aiSummary?: string
  clients?: { id: number; name: string }[]
}

function formatVal(
  raw: number | string | undefined,
  format: 'currency' | 'number' | 'percent'
): string {
  const num = Number(raw ?? 0)
  if (format === 'currency') return `KES ${num.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
  if (format === 'percent') return `${num.toFixed(1)}%`
  return num.toLocaleString()
}

/** Build dynamic report title from dropdown selections */
function buildReportTitle(params: AnalyticsReportParams): string {
  const sectionLabel = SECTIONS.find((s) => s.id === params.section)?.label ?? params.section
  const subTypes = getSubTypes(params.section)
  const subOpt = subTypes.find((s) => s.id === params.subType)
  const subLabel = subOpt?.label ?? params.subType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  let scope = subLabel
  if (params.section === 'profitability' && params.clientFilter && params.clientFilter !== 'general') {
    const client = params.clients?.find((c) => c.id.toString() === params.clientFilter)
    scope = client ? `Per Client: ${client.name}` : 'Per Client'
  }
  return `Analytics Report: ${sectionLabel} › ${scope}`
}

/** Build period string */
function buildPeriod(params: AnalyticsReportParams): string {
  if (params.timeRange === 'custom' && params.customStart && params.customEnd) {
    return `${params.customStart} to ${params.customEnd}`
  }
  return TIME_RANGE_LABELS[params.timeRange] ?? params.timeLabel ?? params.timeRange
}

/** Generate analytics report PDF with Cabinet Master branding */
export async function generateAnalyticsReportPDF(
  params: AnalyticsReportParams,
  filename: string = 'analytics_report'
): Promise<void> {
  const [logoBase64, watermarkBase64] = await Promise.all([
    fetchImageAsBase64('/logowatermark.png'),
    fetchImageAsBase64('/logowatermark.png'),
  ])

  const reportTitle = buildReportTitle(params)
  const periodStr = buildPeriod(params)
  const generatedDate = new Date().toLocaleString('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const summary = params.comprehensiveSummary

  // Stats config for summary cards
  const statsConfig = getHeaderStatsConfig(params.section, params.section === 'profitability' ? 'sales_orders' : params.subType)

  const { generate } = await import('@pdfme/generator')
  const pdfSchemas = await import('@pdfme/schemas')

  const schemas: any[][] = []
  const inputs: Record<string, any>[] = []

  // ---- PAGE 1: Cover + Executive Summary ----
  const page1Schema: any[] = []
  let y = MARGIN.top

  // Logo + Company header
  page1Schema.push(
    { name: 'logo', type: 'image', position: { x: MARGIN.left, y }, width: 36, height: 36 },
    { name: 'companyName', type: 'text', position: { x: MARGIN.left + 42, y: y + 6 }, width: 140, height: 10, fontSize: 16, fontColor: '#B06A2B', alignment: 'left' },
    { name: 'companyAddress', type: 'text', position: { x: MARGIN.left + 42, y: y + 18 }, width: 140, height: 6, fontSize: 8, fontColor: '#333333', alignment: 'left' },
    { name: 'companyContact', type: 'text', position: { x: MARGIN.left + 42, y: y + 24 }, width: 140, height: 6, fontSize: 8, fontColor: '#333333', alignment: 'left' }
  )
  y += 42

  // Report title bar
  page1Schema.push(
    { name: 'titleBar', type: 'rectangle', position: { x: MARGIN.left, y }, width: PAGE.width - MARGIN.left - MARGIN.right, height: 14, color: '#E8E8E8', borderRadius: 3 },
    { name: 'reportTitle', type: 'text', position: { x: MARGIN.left, y: y + 3 }, width: PAGE.width - MARGIN.left - MARGIN.right, height: 10, fontSize: 14, fontColor: '#B06A2B', alignment: 'center' }
  )
  y += 18

  // Period and generated date
  page1Schema.push(
    { name: 'reportPeriod', type: 'text', position: { x: MARGIN.left, y }, width: 120, height: 5, fontSize: 9, fontColor: '#666666', alignment: 'left' },
    { name: 'reportDate', type: 'text', position: { x: PAGE.width - MARGIN.right - 90, y }, width: 90, height: 5, fontSize: 9, fontColor: '#666666', alignment: 'right' }
  )
  y += 10

  // Section subtitle (scope explanation)
  page1Schema.push({
    name: 'scopeNote',
    type: 'text',
    position: { x: MARGIN.left, y },
    width: PAGE.width - MARGIN.left - MARGIN.right,
    height: 8,
    fontSize: 9,
    fontColor: '#444444',
    alignment: 'left',
  })
  y += 12

  // Executive Summary header
  page1Schema.push(
    { name: 'execHeader', type: 'rectangle', position: { x: MARGIN.left, y }, width: PAGE.width - MARGIN.left - MARGIN.right, height: 8, color: '#F0F0F0', borderRadius: 2 },
    { name: 'execTitle', type: 'text', position: { x: MARGIN.left + 4, y: y + 2 }, width: 150, height: 6, fontSize: 10, fontColor: '#333333', alignment: 'left' }
  )
  y += 12

  // Summary stat rows (up to 5)
  const statRows: { label: string; value: string }[] = []
  statsConfig.slice(0, 5).forEach((statDef) => {
    const raw = summary?.[statDef.valueKey as keyof typeof summary] ?? 0
    const num = Number(raw)
    const value =
      statDef.format === 'currency'
        ? `KES ${num.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
        : statDef.format === 'percent'
          ? `${num.toFixed(1)}%`
          : num.toLocaleString()
    statRows.push({ label: statDef.label, value })
  })

  statRows.forEach((row, i) => {
    page1Schema.push(
      { name: `statLabel_${i}`, type: 'text', position: { x: MARGIN.left, y: y + i * 7 }, width: 80, height: 6, fontSize: 9, fontColor: '#333333', alignment: 'left' },
      { name: `statValue_${i}`, type: 'text', position: { x: PAGE.width - MARGIN.right - 90, y: y + i * 7 }, width: 90, height: 6, fontSize: 9, fontColor: '#111111', alignment: 'right' }
    )
  })
  y += statRows.length * 7 + 12

  // Chart data table header (Time Series / Performance Over Time)
  let dataKey = 'amount'
  if (params.comprehensiveChartData.length > 0) {
    const firstRow = params.comprehensiveChartData[0] as Record<string, unknown> | undefined
    const metricToKey: Record<string, string> = { net_profit: 'net_profit', total_paid: 'total_paid', total_expenses: 'total_expenses', total_amount: 'amount', amount: 'amount', count: 'count', avg: 'avg', avg_value: 'avg', value: 'value', movements: 'movements' }
    dataKey = firstRow && metricToKey[params.analyticsMetric] && metricToKey[params.analyticsMetric] in firstRow
      ? metricToKey[params.analyticsMetric]
      : firstRow && 'amount' in firstRow ? 'amount' : firstRow && 'net_profit' in firstRow ? 'net_profit' : 'amount'

    page1Schema.push(
      { name: 'tableSectionTitle', type: 'text', position: { x: MARGIN.left, y }, width: PAGE.width - MARGIN.left - MARGIN.right, height: 6, fontSize: 10, fontColor: '#333333', alignment: 'left' },
      { name: 'tableHeader', type: 'rectangle', position: { x: MARGIN.left, y: y + 8 }, width: PAGE.width - MARGIN.left - MARGIN.right, height: 8, color: '#E8E8E8', borderRadius: 2 },
      { name: 'colDate', type: 'text', position: { x: MARGIN.left + 3, y: y + 10 }, width: 50, height: 6, fontSize: 9, fontColor: '#000000', alignment: 'left' },
      { name: 'colValue', type: 'text', position: { x: PAGE.width - MARGIN.right - 70, y: y + 10 }, width: 70, height: 6, fontSize: 9, fontColor: '#000000', alignment: 'right' }
    )
    y += 20

    const chartRows = params.comprehensiveChartData.slice(0, 15)
    chartRows.forEach((row, i) => {
      const rowY = y + i * 6
      const val = row[dataKey] ?? row.amount ?? row.count ?? row.avg ?? 0
      const fmtVal = typeof val === 'number' && (String(dataKey).includes('amount') || String(dataKey).includes('total') || String(dataKey).includes('profit') || dataKey === 'amount')
        ? `KES ${Number(val).toLocaleString()}`
        : String(val)
      page1Schema.push(
        { name: `rowDate_${i}`, type: 'text', position: { x: MARGIN.left + 3, y: rowY }, width: 50, height: 5, fontSize: 8, fontColor: '#333333', alignment: 'left' },
        { name: `rowVal_${i}`, type: 'text', position: { x: PAGE.width - MARGIN.right - 70, y: rowY }, width: 70, height: 5, fontSize: 8, fontColor: '#333333', alignment: 'right' }
      )
    })
    y += chartRows.length * 6 + 8
  }

  // Watermark
  page1Schema.push({
    name: 'watermark',
    type: 'image',
    position: { x: (PAGE.width - 70) / 2, y: (PAGE.height - 70) / 2 },
    width: 70,
    height: 70,
    opacity: 0.06,
  })

  // Page 1 inputs
  const page1Input: Record<string, any> = {
    logo: logoBase64,
    companyName: 'CABINET MASTER STYLES & FINISHES',
    companyAddress: 'Location: Ruiru Eastern By-Pass',
    companyContact: 'Tel: +254729554475 | Email: cabinetmasterstyles@gmail.com',
    reportTitle,
    reportPeriod: `Period: ${periodStr}`,
    reportDate: `Generated: ${generatedDate}`,
    scopeNote: `Scope: ${params.section.replace(/_/g, ' ')} — ${params.section === 'profitability' && params.clientFilter !== 'general' ? 'Per client analysis' : 'All clients'} · Metric: ${params.chartTitle}`,
    execHeader: '',
    execTitle: 'Executive Summary',
    tableSectionTitle: params.comprehensiveChartData.length > 0 ? 'Performance Over Time (Time Series Data)' : '',
    watermark: watermarkBase64,
  }
  statRows.forEach((row, i) => {
    page1Input[`statLabel_${i}`] = row.label
    page1Input[`statValue_${i}`] = row.value
  })
  if (params.comprehensiveChartData.length > 0) {
    const chartRows = params.comprehensiveChartData.slice(0, 15)
    chartRows.forEach((row, i) => {
      const val = row[dataKey] ?? row.amount ?? row.count ?? row.avg ?? 0
      page1Input[`rowDate_${i}`] = String(row.date ?? '')
      page1Input[`rowVal_${i}`] =
        typeof val === 'number' && (String(dataKey).includes('amount') || String(dataKey).includes('total') || String(dataKey).includes('profit') || dataKey === 'amount')
          ? `KES ${Number(val).toLocaleString()}`
          : String(val)
    })
    for (let i = chartRows.length; i < 15; i++) {
      page1Input[`rowDate_${i}`] = ''
      page1Input[`rowVal_${i}`] = ''
    }
  }

  schemas.push(page1Schema)
  inputs.push(page1Input)

  // ---- PAGE 2: Segmentation + AI Insights ----
  const page2Schema: any[] = []
  y = MARGIN.top

  // Page header
  page2Schema.push(
    { name: 'page2Title', type: 'text', position: { x: MARGIN.left, y }, width: PAGE.width - MARGIN.left - MARGIN.right, height: 10, fontSize: 12, fontColor: '#B06A2B', alignment: 'center' }
  )
  y += 14

  // Distribution / Segmentation section
  page2Schema.push(
    { name: 'distSectionTitle', type: 'text', position: { x: MARGIN.left, y }, width: PAGE.width - MARGIN.left - MARGIN.right, height: 6, fontSize: 10, fontColor: '#333333', alignment: 'left' }
  )
  y += 8

  // Distribution table
  page2Schema.push(
    { name: 'distHeader', type: 'rectangle', position: { x: MARGIN.left, y }, width: PAGE.width - MARGIN.left - MARGIN.right, height: 8, color: '#E8E8E8', borderRadius: 2 },
    { name: 'distCol1', type: 'text', position: { x: MARGIN.left + 3, y: y + 2 }, width: 120, height: 6, fontSize: 9, fontColor: '#000000', alignment: 'left' },
    { name: 'distCol2', type: 'text', position: { x: PAGE.width - MARGIN.right - 100, y: y + 2 }, width: 50, height: 6, fontSize: 9, fontColor: '#000000', alignment: 'right' },
    { name: 'distCol3', type: 'text', position: { x: PAGE.width - MARGIN.right - 45, y: y + 2 }, width: 45, height: 6, fontSize: 9, fontColor: '#000000', alignment: 'right' }
  )
  y += 10

  const segRows = params.segmentationSegments
  let distItems: { name: string; value: number; amount: number }[] = []
  if (params.section === 'profitability' && summary) {
    const paid = Number(summary.total_paid ?? 0)
    const expenses = Number(summary.total_expenses ?? 0)
    const net = Number(summary.net_profit ?? 0)
    const total = paid + expenses + Math.abs(net) || 1
    distItems = [
      { name: 'Paid', value: 100 * (paid || 0) / total, amount: paid },
      { name: 'Expenses', value: 100 * (expenses || 0) / total, amount: expenses },
      { name: 'Net', value: 100 * (net || 0) / total, amount: net },
    ]
  } else {
    distItems = segRows.slice(0, 10).map((seg) => ({
      name: seg.name,
      value: seg.value,
      amount: seg.revenue,
    }))
  }
  distItems.slice(0, 10).forEach((item, i) => {
    page2Schema.push(
      { name: `distName_${i}`, type: 'text', position: { x: MARGIN.left + 3, y: y + i * 6 }, width: 120, height: 5, fontSize: 8, fontColor: '#333333', alignment: 'left' },
      { name: `distPct_${i}`, type: 'text', position: { x: PAGE.width - MARGIN.right - 100, y: y + i * 6 }, width: 50, height: 5, fontSize: 8, fontColor: '#333333', alignment: 'right' },
      { name: `distAmt_${i}`, type: 'text', position: { x: PAGE.width - MARGIN.right - 45, y: y + i * 6 }, width: 45, height: 5, fontSize: 8, fontColor: '#333333', alignment: 'right' }
    )
  })
  y += Math.max(distItems.length, 1) * 6 + 10

  // AI Insights section (always include for consistent layout)
  const insights = params.aiInsights ?? []
  y += 4
  page2Schema.push(
    { name: 'aiHeader', type: 'rectangle', position: { x: MARGIN.left, y }, width: PAGE.width - MARGIN.left - MARGIN.right, height: 8, color: '#F0F0F0', borderRadius: 2 },
    { name: 'aiTitle', type: 'text', position: { x: MARGIN.left + 4, y: y + 2 }, width: 150, height: 6, fontSize: 10, fontColor: '#333333', alignment: 'left' }
  )
  y += 12
  page2Schema.push({
    name: 'aiSummary',
    type: 'text',
    position: { x: MARGIN.left, y },
    width: PAGE.width - MARGIN.left - MARGIN.right,
    height: 25,
    fontSize: 8,
    fontColor: '#444444',
    alignment: 'left',
  })
  y += 28
  for (let i = 0; i < 4; i++) {
    page2Schema.push(
      { name: `aiInsTitle_${i}`, type: 'text', position: { x: MARGIN.left, y: y + i * 20 }, width: PAGE.width - MARGIN.left - MARGIN.right, height: 6, fontSize: 9, fontColor: '#B06A2B', alignment: 'left' },
      { name: `aiInsDesc_${i}`, type: 'text', position: { x: MARGIN.left, y: y + i * 20 + 8 }, width: PAGE.width - MARGIN.left - MARGIN.right, height: 12, fontSize: 8, fontColor: '#555555', alignment: 'left' }
    )
  }

  // Footer
  const footerY = PAGE.height - MARGIN.bottom - 25
  page2Schema.push(
    { name: 'summary', type: 'text', position: { x: MARGIN.left, y: footerY }, width: 140, height: 15, fontSize: 8, fontColor: '#666666', alignment: 'left' },
    { name: 'preparedBy', type: 'text', position: { x: MARGIN.left, y: footerY + 16 }, width: 70, height: 5, fontSize: 8, fontColor: '#333333', alignment: 'left' },
    { name: 'approvedBy', type: 'text', position: { x: PAGE.width - MARGIN.right - 80, y: footerY + 16 }, width: 80, height: 5, fontSize: 8, fontColor: '#333333', alignment: 'right' },
    { name: 'pageNumber', type: 'text', position: { x: PAGE.width / 2 - 25, y: PAGE.height - MARGIN.bottom }, width: 50, height: 5, fontSize: 8, fontColor: '#999999', alignment: 'center' }
  )

  const page2Input: Record<string, any> = {
    page2Title: `${reportTitle} (Continued)`,
    distSectionTitle: params.section === 'profitability' ? 'Profitability Breakdown (Paid vs Expenses vs Net)' : 'Distribution / Segmentation',
    distHeader: '',
    distCol1: 'Category',
    distCol2: '%',
    distCol3: params.section === 'profitability' ? 'Amount (KES)' : 'Amount',
    summary: `Analytics Report | ${params.comprehensiveChartData.length} data points | Generated by Cabinet Master Analytics`,
    preparedBy: 'Prepared by: ____________',
    approvedBy: 'Approved by: ____________',
    pageNumber: 'Page 2 of 2',
    aiHeader: '',
    aiTitle: 'AI Business Insights',
    aiSummary: params.aiSummary ?? '',
  }
  distItems.forEach((item, i) => {
    page2Input[`distName_${i}`] = item.name
    page2Input[`distPct_${i}`] = params.section === 'profitability' ? `${item.value.toFixed(1)}%` : `${item.value}%`
    page2Input[`distAmt_${i}`] = typeof item.amount === 'number' ? formatVal(item.amount, 'currency').replace('KES ', '') : String(item.amount)
  })
  for (let i = distItems.length; i < 10; i++) {
    page2Input[`distName_${i}`] = ''
    page2Input[`distPct_${i}`] = ''
    page2Input[`distAmt_${i}`] = ''
  }
  insights.forEach((ins, i) => {
    page2Input[`aiInsTitle_${i}`] = ins.title
    page2Input[`aiInsDesc_${i}`] = (ins.description ?? '').slice(0, 280)
  })
  for (let i = insights.length; i < 4; i++) {
    page2Input[`aiInsTitle_${i}`] = ''
    page2Input[`aiInsDesc_${i}`] = ''
  }

  schemas.push(page2Schema)
  inputs.push(page2Input)

  const template = {
    basePdf: { width: PAGE.width, height: PAGE.height, padding: [0, 0, 0, 0] as [number, number, number, number] },
    schemas,
  }

  const pdf = await generate({
    template: template as any,
    inputs: inputs as any,
    plugins: {
      text: pdfSchemas.text,
      rectangle: pdfSchemas.rectangle,
      image: pdfSchemas.image,
    } as any,
  })

  const blob = new Blob([pdf.buffer as ArrayBuffer], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const safeTitle = reportTitle.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_').slice(0, 50)
  link.download = `${filename}_${safeTitle}_${new Date().toISOString().slice(0, 10)}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
