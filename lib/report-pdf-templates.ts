// Report PDF Templates - Professional styling matching quotation template
// Uses the same approach: @pdfme/generator with plugins for text, rectangle, line, image

// Base report template with professional styling
const baseReportTemplate = {
  basePdf: {
    width: 210,
    height: 297,
    padding: [0, 0, 0, 0] as [number, number, number, number],
  },
  schemas: [
    [
      // Company Logo and Header
      { name: 'logo', type: 'image', position: { x: 15, y: 5 }, width: 38, height: 38 },
      { name: 'companyName', type: 'text', position: { x: 60, y: 11 }, width: 140, height: 14, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'left', fontWeight: 'Extra Bold', characterSpacing: 0.5 },
      { name: 'companyLocation', type: 'text', position: { x: 60, y: 21 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'companyPhone', type: 'text', position: { x: 60, y: 27 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'companyEmail', type: 'text', position: { x: 60, y: 33 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
      
      // Report Header Background and Title
      { name: 'reportHeaderBg', type: 'rectangle', position: { x: 15, y: 47 }, width: 180, height: 14, color: '#E5E5E5', radius: 5 },
      { name: 'reportTitle', type: 'text', position: { x: 0, y: 50 }, width: 210, height: 12, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'center', fontWeight: 'bold' },
      
      // Report Info Box
      { name: 'reportInfoBox', type: 'rectangle', position: { x: 15, y: 64 }, width: 62, height: 28, color: '#E5E5E5', radius: 4 },
      { name: 'reportDateLabel', type: 'text', position: { x: 18, y: 67 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'reportDateValue', type: 'text', position: { x: 47, y: 67 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'reportPeriodLabel', type: 'text', position: { x: 18, y: 73 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'reportPeriodValue', type: 'text', position: { x: 47, y: 73 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'reportTypeLabel', type: 'text', position: { x: 18, y: 79 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'reportTypeValue', type: 'text', position: { x: 47, y: 79 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'reportNumberLabel', type: 'text', position: { x: 18, y: 85 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'reportNumberValue', type: 'text', position: { x: 47, y: 85 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      
      // Report Number (right aligned)
      { name: 'reportNumberFull', type: 'text', position: { x: 13, y: 67 }, width: 180, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      // Watermark Logo
      { name: 'watermarkLogo', type: 'image', position: { x: 60, y: 110 }, width: 100, height: 100, opacity: 0.2 },
      
      // Table Header Background
      { name: 'tableHeaderBg', type: 'rectangle', position: { x: 15, y: 99 }, width: 180, height: 10, color: '#E5E5E5', radius: 3 },
      
      // Footer Elements
      { name: 'summaryTitle', type: 'text', position: { x: 15, y: 245 }, width: 60, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'summaryContent', type: 'text', position: { x: 15, y: 250 }, width: 120, height: 40, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      
      // Totals Box
      { name: 'totalsBox', type: 'rectangle', position: { x: 140, y: 245 }, width: 60, height: 27, color: '#E5E5E5', radius: 4 },
      { name: 'totalLabel', type: 'text', position: { x: 142, y: 265 }, width: 35, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'totalValue', type: 'text', position: { x: 165, y: 265 }, width: 33, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
      
      // Signature Lines
      { name: 'preparedByLabel', type: 'text', position: { x: 15, y: 280 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'preparedByLine', type: 'line', position: { x: 35, y: 283 }, width: 60, height: 0, color: '#000' },
      { name: 'approvedByLabel', type: 'text', position: { x: 120, y: 280 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'approvedByLine', type: 'line', position: { x: 145, y: 283 }, width: 60, height: 0, color: '#000' },
    ]
  ]
};

// Sales Report Template - inherits from base template
const salesReportTemplate = {
  ...baseReportTemplate,
  schemas: [
    [
      ...baseReportTemplate.schemas[0],
      // Sales-specific table headers
      { name: 'dateHeader', type: 'text', position: { x: 17, y: 102 }, width: 25, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'clientHeader', type: 'text', position: { x: 47, y: 102 }, width: 50, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'invoiceHeader', type: 'text', position: { x: 102, y: 102 }, width: 30, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'amountHeader', type: 'text', position: { x: 137, y: 102 }, width: 40, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'statusHeader', type: 'text', position: { x: 182, y: 102 }, width: 25, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      
      // Sample data rows (will be populated with actual data)
      { name: 'date1', type: 'text', position: { x: 17, y: 115 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'client1', type: 'text', position: { x: 47, y: 115 }, width: 50, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'invoice1', type: 'text', position: { x: 102, y: 115 }, width: 30, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'amount1', type: 'text', position: { x: 137, y: 115 }, width: 40, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'status1', type: 'text', position: { x: 182, y: 115 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      
      { name: 'date2', type: 'text', position: { x: 17, y: 125 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'client2', type: 'text', position: { x: 47, y: 125 }, width: 50, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'invoice2', type: 'text', position: { x: 102, y: 125 }, width: 30, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'amount2', type: 'text', position: { x: 137, y: 125 }, width: 40, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'status2', type: 'text', position: { x: 182, y: 125 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      
      { name: 'date3', type: 'text', position: { x: 17, y: 135 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'client3', type: 'text', position: { x: 47, y: 135 }, width: 50, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'invoice3', type: 'text', position: { x: 102, y: 135 }, width: 30, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'amount3', type: 'text', position: { x: 137, y: 135 }, width: 40, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'status3', type: 'text', position: { x: 182, y: 135 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
    ]
  ]
};

// Expense Report Template - inherits from base template
const expenseReportTemplate = {
  ...baseReportTemplate,
  schemas: [
    [
      ...baseReportTemplate.schemas[0],
      // Expense-specific table headers
      { name: 'dateHeader', type: 'text', position: { x: 17, y: 102 }, width: 25, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'categoryHeader', type: 'text', position: { x: 47, y: 102 }, width: 40, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'descriptionHeader', type: 'text', position: { x: 92, y: 102 }, width: 50, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'amountHeader', type: 'text', position: { x: 147, y: 102 }, width: 40, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'typeHeader', type: 'text', position: { x: 192, y: 102 }, width: 25, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      
      // Sample data rows (will be populated with actual data)
      { name: 'date1', type: 'text', position: { x: 17, y: 115 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'category1', type: 'text', position: { x: 47, y: 115 }, width: 40, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'description1', type: 'text', position: { x: 92, y: 115 }, width: 50, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'amount1', type: 'text', position: { x: 147, y: 115 }, width: 40, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'type1', type: 'text', position: { x: 192, y: 115 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      
      { name: 'date2', type: 'text', position: { x: 17, y: 125 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'category2', type: 'text', position: { x: 47, y: 125 }, width: 40, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'description2', type: 'text', position: { x: 92, y: 125 }, width: 50, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'amount2', type: 'text', position: { x: 147, y: 125 }, width: 40, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'type2', type: 'text', position: { x: 192, y: 125 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      
      { name: 'date3', type: 'text', position: { x: 17, y: 135 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'category3', type: 'text', position: { x: 47, y: 135 }, width: 40, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'description3', type: 'text', position: { x: 92, y: 135 }, width: 50, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'amount3', type: 'text', position: { x: 147, y: 135 }, width: 40, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'type3', type: 'text', position: { x: 192, y: 135 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
    ]
  ]
};

// Inventory Report Template - inherits from base template
const inventoryReportTemplate = {
  ...baseReportTemplate,
  schemas: [
    [
      ...baseReportTemplate.schemas[0],
      // Inventory-specific table headers
      { name: 'itemHeader', type: 'text', position: { x: 17, y: 102 }, width: 40, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'categoryHeader', type: 'text', position: { x: 62, y: 102 }, width: 35, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'quantityHeader', type: 'text', position: { x: 102, y: 102 }, width: 25, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'unitPriceHeader', type: 'text', position: { x: 132, y: 102 }, width: 35, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'valueHeader', type: 'text', position: { x: 172, y: 102 }, width: 35, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      
      // Sample data rows (will be populated with actual data)
      { name: 'item1', type: 'text', position: { x: 17, y: 115 }, width: 40, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'category1', type: 'text', position: { x: 62, y: 115 }, width: 35, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'quantity1', type: 'text', position: { x: 102, y: 115 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      { name: 'unitPrice1', type: 'text', position: { x: 132, y: 115 }, width: 35, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'value1', type: 'text', position: { x: 172, y: 115 }, width: 35, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'item2', type: 'text', position: { x: 17, y: 125 }, width: 40, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'category2', type: 'text', position: { x: 62, y: 125 }, width: 35, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'quantity2', type: 'text', position: { x: 102, y: 125 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      { name: 'unitPrice2', type: 'text', position: { x: 132, y: 125 }, width: 35, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'value2', type: 'text', position: { x: 172, y: 125 }, width: 35, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'item3', type: 'text', position: { x: 17, y: 135 }, width: 40, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'category3', type: 'text', position: { x: 62, y: 135 }, width: 35, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'quantity3', type: 'text', position: { x: 102, y: 135 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      { name: 'unitPrice3', type: 'text', position: { x: 132, y: 135 }, width: 35, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'value3', type: 'text', position: { x: 172, y: 135 }, width: 35, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
    ]
  ]
};

// Client Report Template - inherits from base template
const clientReportTemplate = {
  ...baseReportTemplate,
  schemas: [
    [
      ...baseReportTemplate.schemas[0],
      // Client-specific table headers
      { name: 'clientHeader', type: 'text', position: { x: 17, y: 102 }, width: 45, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'salesHeader', type: 'text', position: { x: 67, y: 102 }, width: 35, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'paymentsHeader', type: 'text', position: { x: 107, y: 102 }, width: 35, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'balanceHeader', type: 'text', position: { x: 147, y: 102 }, width: 35, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'statusHeader', type: 'text', position: { x: 187, y: 102 }, width: 25, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      
      // Sample data rows (will be populated with actual data)
      { name: 'client1', type: 'text', position: { x: 17, y: 115 }, width: 45, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'sales1', type: 'text', position: { x: 67, y: 115 }, width: 35, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'payments1', type: 'text', position: { x: 107, y: 115 }, width: 35, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'balance1', type: 'text', position: { x: 147, y: 115 }, width: 35, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'status1', type: 'text', position: { x: 187, y: 115 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      
      { name: 'client2', type: 'text', position: { x: 17, y: 125 }, width: 45, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'sales2', type: 'text', position: { x: 67, y: 125 }, width: 35, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'payments2', type: 'text', position: { x: 107, y: 125 }, width: 35, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'balance2', type: 'text', position: { x: 147, y: 125 }, width: 35, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'status2', type: 'text', position: { x: 187, y: 125 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      
      { name: 'client3', type: 'text', position: { x: 17, y: 135 }, width: 45, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'sales3', type: 'text', position: { x: 67, y: 135 }, width: 35, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'payments3', type: 'text', position: { x: 107, y: 135 }, width: 35, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'balance3', type: 'text', position: { x: 147, y: 135 }, width: 35, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'status3', type: 'text', position: { x: 187, y: 135 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
    ]
  ]
};

// Financial Report Template - inherits from base template
const financialReportTemplate = {
  ...baseReportTemplate,
  schemas: [
    [
      ...baseReportTemplate.schemas[0],
      // Financial-specific table headers
      { name: 'metricHeader', type: 'text', position: { x: 17, y: 102 }, width: 50, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'currentPeriodHeader', type: 'text', position: { x: 72, y: 102 }, width: 40, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'previousPeriodHeader', type: 'text', position: { x: 117, y: 102 }, width: 40, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'changeHeader', type: 'text', position: { x: 162, y: 102 }, width: 35, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      
      // Sample data rows (will be populated with actual data)
      { name: 'metric1', type: 'text', position: { x: 17, y: 115 }, width: 50, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'currentPeriod1', type: 'text', position: { x: 72, y: 115 }, width: 40, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'previousPeriod1', type: 'text', position: { x: 117, y: 115 }, width: 40, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'change1', type: 'text', position: { x: 162, y: 115 }, width: 35, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      
      { name: 'metric2', type: 'text', position: { x: 17, y: 125 }, width: 50, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'currentPeriod2', type: 'text', position: { x: 72, y: 125 }, width: 40, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'previousPeriod2', type: 'text', position: { x: 117, y: 125 }, width: 40, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'change2', type: 'text', position: { x: 162, y: 125 }, width: 35, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      
      { name: 'metric3', type: 'text', position: { x: 17, y: 135 }, width: 50, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'currentPeriod3', type: 'text', position: { x: 72, y: 135 }, width: 40, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'previousPeriod3', type: 'text', position: { x: 117, y: 135 }, width: 40, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'change3', type: 'text', position: { x: 162, y: 135 }, width: 35, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
    ]
  ]
};

// Custom Report Template - inherits from base template
const customReportTemplate = {
  ...baseReportTemplate,
  schemas: [
    [
      ...baseReportTemplate.schemas[0],
      // Custom report table headers (generic)
      { name: 'column1Header', type: 'text', position: { x: 17, y: 102 }, width: 40, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'column2Header', type: 'text', position: { x: 62, y: 102 }, width: 40, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'column3Header', type: 'text', position: { x: 107, y: 102 }, width: 40, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'column4Header', type: 'text', position: { x: 152, y: 102 }, width: 40, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
    ]
  ]
};

// Data interfaces for each report type
export interface SalesReportData {
  companyName: string;
  companyLocation: string;
  companyPhone: string;
  companyEmail: string;
  companyLogo?: string;
  reportTitle: string;
  reportDate: string;
  reportPeriod: string;
  reportType: string;
  reportGenerated: string;
  reportNumber: string;
  items: Array<{
    date: string;
    client: string;
    invoice: string;
    amount: number;
    status: string;
  }>;
  summary: string;
  totalSales: number;
  preparedBy: string;
  approvedBy: string;
  watermarkLogo?: string;
}

export interface ExpenseReportData {
  companyName: string;
  companyLocation: string;
  companyPhone: string;
  companyEmail: string;
  companyLogo?: string;
  reportTitle: string;
  reportDate: string;
  reportPeriod: string;
  reportType: string;
  reportGenerated: string;
  reportNumber: string;
  items: Array<{
    date: string;
    category: string;
    description: string;
    amount: number;
    type: string;
  }>;
  summary: string;
  totalExpenses: number;
  preparedBy: string;
  approvedBy: string;
  watermarkLogo?: string;
}

export interface InventoryReportData {
  companyName: string;
  companyLocation: string;
  companyPhone: string;
  companyEmail: string;
  companyLogo?: string;
  reportTitle: string;
  reportDate: string;
  reportPeriod: string;
  reportType: string;
  reportGenerated: string;
  reportNumber: string;
  items: Array<{
    item: string;
    category: string;
    quantity: number;
    unitPrice: number;
    value: number;
  }>;
  summary: string;
  totalValue: number;
  preparedBy: string;
  approvedBy: string;
  watermarkLogo?: string;
}

export interface ClientReportData {
  companyName: string;
  companyLocation: string;
  companyPhone: string;
  companyEmail: string;
  companyLogo?: string;
  reportTitle: string;
  reportDate: string;
  reportPeriod: string;
  reportType: string;
  reportGenerated: string;
  reportNumber: string;
  items: Array<{
    client: string;
    sales: number;
    payments: number;
    balance: number;
    status: string;
  }>;
  summary: string;
  totalBalance: number;
  preparedBy: string;
  approvedBy: string;
  watermarkLogo?: string;
}

export interface FinancialReportData {
  companyName: string;
  companyLocation: string;
  companyPhone: string;
  companyEmail: string;
  companyLogo?: string;
  reportTitle: string;
  reportDate: string;
  reportPeriod: string;
  reportType: string;
  reportGenerated: string;
  reportNumber: string;
  items: Array<{
    metric: string;
    currentPeriod: number;
    previousPeriod?: number;
    change?: number;
  }>;
  summary: string;
  netIncome: number;
  preparedBy: string;
  approvedBy: string;
  watermarkLogo?: string;
}

export interface CustomReportData {
  companyName: string;
  companyLocation: string;
  companyPhone: string;
  companyEmail: string;
  companyLogo?: string;
  reportTitle: string;
  reportDate: string;
  reportPeriod: string;
  reportType: string;
  reportGenerated: string;
  reportNumber: string;
  items: Array<{
    [key: string]: any;
  }>;
  summary: string;
  totalValue: number;
  preparedBy: string;
  approvedBy: string;
  watermarkLogo?: string;
}

// Default values for reports
const defaultReportValues = {
  companyName: "CABINET MASTER STYLES & FINISHES",
  companyLocation: "Location: Ruiru Eastern By-Pass",
  companyPhone: "Tel: +254729554475",
  companyEmail: "Email: cabinetmasterstyles@gmail.com",
  preparedBy: "Prepared By",
  approvedBy: "Approved By",
};

// Currency formatting function
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Percentage formatting function
const formatPercentage = (value: number): string => {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
};

// Simple test function to verify PDF generation works
const generateTestPDF = async () => {
  const template = {
    basePdf: {
      width: 210,
      height: 297,
      padding: [0, 0, 0, 0] as [number, number, number, number],
    },
    schemas: [
      [
        { name: 'testText', type: 'text', position: { x: 100, y: 150 }, width: 100, height: 20, fontSize: 16, fontColor: '#000000', fontName: 'Helvetica-Bold', alignment: 'center' },
      ]
    ]
  };

  const inputs = [{ testText: 'TEST PDF WORKS!' }];

  return { template, inputs };
};

// Generate dynamic sales template based on number of rows - Professional quotation-style design
const generateDynamicSalesTemplate = (rowCount: number) => {
  const baseSchema = [
    // Company header section - matching quotation template
    { name: 'logo', type: 'image', position: { x: 15, y: 5 }, width: 38, height: 38 },
    { name: 'companyName', type: 'text', position: { x: 60, y: 11 }, width: 140, height: 14, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'left', fontWeight: 'Extra Bold', characterSpacing: 0.5 },
    { name: 'companyLocation', type: 'text', position: { x: 60, y: 21 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'companyPhone', type: 'text', position: { x: 60, y: 27 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'companyEmail', type: 'text', position: { x: 60, y: 33 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
    
    // Report header - matching quotation template styling
    { name: 'reportHeaderBg', type: 'rectangle', position: { x: 15, y: 47 }, width: 180, height: 14, color: '#E5E5E5', radius: 5 },
    { name: 'reportTitle', type: 'text', position: { x: 0, y: 50 }, width: 210, height: 12, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'center', fontWeight: 'bold' },
    
    // Report info section - matching quotation template styling
    { name: 'reportInfoBox', type: 'rectangle', position: { x: 15, y: 64 }, width: 62, height: 28, color: '#E5E5E5', radius: 4 },
    { name: 'reportDateLabel', type: 'text', position: { x: 18, y: 67 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
    { name: 'reportDateValue', type: 'text', position: { x: 47, y: 67 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'reportPeriodLabel', type: 'text', position: { x: 18, y: 73 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
    { name: 'reportPeriodValue', type: 'text', position: { x: 47, y: 73 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'reportTypeLabel', type: 'text', position: { x: 18, y: 79 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
    { name: 'reportTypeValue', type: 'text', position: { x: 47, y: 79 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    
    // Table header - matching quotation template styling
    { name: 'tableHeaderBg', type: 'rectangle', position: { x: 15, y: 99 }, width: 180, height: 10, color: '#E5E5E5', radius: 3 },
    { name: 'dateHeader', type: 'text', position: { x: 17, y: 102 }, width: 25, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
    { name: 'clientHeader', type: 'text', position: { x: 47, y: 102 }, width: 50, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
    { name: 'invoiceHeader', type: 'text', position: { x: 102, y: 102 }, width: 30, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
    { name: 'amountHeader', type: 'text', position: { x: 137, y: 102 }, width: 40, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
    { name: 'statusHeader', type: 'text', position: { x: 182, y: 102 }, width: 25, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
  ];

  // Dynamically generate data rows - matching quotation template positioning
  const dataRows = [];
  for (let i = 0; i < rowCount; i++) {
    const yPosition = 112 + (i * 8); // Start at y=112 (after table header), each row 8 units apart (matching quotation)
    
    // Data fields (no alternating colors - clean professional look like quotation)
    dataRows.push(
      { name: `date${i + 1}`, type: 'text', position: { x: 17, y: yPosition }, width: 25, height: 6, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: `client${i + 1}`, type: 'text', position: { x: 47, y: yPosition }, width: 50, height: 6, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: `invoice${i + 1}`, type: 'text', position: { x: 102, y: yPosition }, width: 30, height: 6, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: `amount${i + 1}`, type: 'text', position: { x: 137, y: yPosition }, width: 40, height: 6, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: `status${i + 1}`, type: 'text', position: { x: 182, y: yPosition }, width: 25, height: 6, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' }
    );
  }

  // Footer section - matching quotation template styling
  const footerY = 112 + (rowCount * 8) + 20;
  const footerSchema = [
    // Summary section - matching quotation template
    { name: 'summaryTitle', type: 'text', position: { x: 15, y: footerY }, width: 60, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
    { name: 'summaryContent', type: 'text', position: { x: 15, y: footerY + 5 }, width: 120, height: 40, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    
    // Totals box - matching quotation template
    { name: 'totalsBox', type: 'rectangle', position: { x: 140, y: footerY }, width: 60, height: 27, color: '#E5E5E5', radius: 4 },
    { name: 'totalLabel', type: 'text', position: { x: 142, y: footerY + 20 }, width: 35, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
    { name: 'totalValue', type: 'text', position: { x: 165, y: footerY + 20 }, width: 33, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
    
    // Signature section - matching quotation template
    { name: 'preparedByLabel', type: 'text', position: { x: 15, y: footerY + 35 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'preparedByLine', type: 'line', position: { x: 35, y: footerY + 38 }, width: 60, height: 0, color: '#000' },
    { name: 'approvedByLabel', type: 'text', position: { x: 120, y: footerY + 35 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'approvedByLine', type: 'line', position: { x: 145, y: footerY + 38 }, width: 60, height: 0, color: '#000' },
    
    // Watermark - matching quotation template
    { name: 'watermarkLogo', type: 'image', position: { x: 60, y: footerY + 45 }, width: 100, height: 100, opacity: 0.2 }
  ];

  return {
    basePdf: { width: 210, height: Math.max(297, footerY + 80), padding: [0, 0, 0, 0] as [number, number, number, number] },
    schemas: [[...baseSchema, ...dataRows, ...footerSchema]]
  };
};

// Generate Sales Report PDF - Professional styling
const generateSalesReportPDF = async (data: SalesReportData) => {
  const mergedData = { ...defaultReportValues, ...data };
  
  // Fetch watermark image as base64 (same as quotation)
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
  const companyLogoBase64 = await fetchImageAsBase64('/logowatermark.png');

  // Dynamically generate template based on number of data rows
  const dynamicTemplate = generateDynamicSalesTemplate(mergedData.items.length);

  // Create inputs with actual data
  const inputs = [{
    // Company Info
    logo: companyLogoBase64,
    companyName: mergedData.companyName,
    companyLocation: mergedData.companyLocation,
    companyPhone: mergedData.companyPhone,
    companyEmail: mergedData.companyEmail,
    
    // Report Header
    reportTitle: mergedData.reportTitle,
    reportDateLabel: 'Date:',
    reportDateValue: mergedData.reportDate,
    reportPeriodLabel: 'Period:',
    reportPeriodValue: mergedData.reportPeriod,
    reportTypeLabel: 'Type:',
    reportTypeValue: mergedData.reportType,
    reportNumberLabel: 'Report No:',
    reportNumberValue: mergedData.reportNumber,
    reportNumberFull: `Report No: ${mergedData.reportNumber}`,
    
    // Table Headers
    dateHeader: 'Date',
    clientHeader: 'Client',
    invoiceHeader: 'Invoice',
    amountHeader: 'Amount',
    statusHeader: 'Status',
    
    // Real Data Rows (populated with actual data from items array)
    ...mergedData.items.map((item, index) => ({
      [`date${index + 1}`]: item.date,
      [`client${index + 1}`]: item.client,
      [`invoice${index + 1}`]: item.invoice,
      [`amount${index + 1}`]: formatCurrency(item.amount),
      [`status${index + 1}`]: item.status
    })).reduce((acc, item) => ({ ...acc, ...item }), {}),
    
    // Footer
    summaryTitle: 'Summary:',
    summaryContent: mergedData.summary,
    totalLabel: 'Total:',
    totalValue: formatCurrency(mergedData.totalSales),
    preparedByLabel: `Prepared by: ${mergedData.preparedBy}`,
    approvedByLabel: `Approved by: ${mergedData.approvedBy}`,
    
    // Footer styling elements
    totalsBox: '',
    preparedByLine: '',
    approvedByLine: '',
    
    // Watermark
    watermarkLogo: watermarkLogoBase64,
  }];

  return { template: dynamicTemplate, inputs };
};

// Generate dynamic expense template based on number of rows - Professional quotation-style design
const generateDynamicExpenseTemplate = (rowCount: number) => {
  const baseSchema = [
    // Company header section - matching quotation template
    { name: 'logo', type: 'image', position: { x: 15, y: 5 }, width: 38, height: 38 },
    { name: 'companyName', type: 'text', position: { x: 60, y: 11 }, width: 140, height: 14, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'left', fontWeight: 'Extra Bold', characterSpacing: 0.5 },
    { name: 'companyLocation', type: 'text', position: { x: 60, y: 21 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'companyPhone', type: 'text', position: { x: 60, y: 27 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'companyEmail', type: 'text', position: { x: 60, y: 33 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
    
    // Report header - matching quotation template styling
    { name: 'reportHeaderBg', type: 'rectangle', position: { x: 15, y: 47 }, width: 180, height: 14, color: '#E5E5E5', radius: 5 },
    { name: 'reportTitle', type: 'text', position: { x: 0, y: 50 }, width: 210, height: 12, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'center', fontWeight: 'bold' },
    
    // Report info section - matching quotation template styling
    { name: 'reportInfoBox', type: 'rectangle', position: { x: 15, y: 64 }, width: 62, height: 28, color: '#E5E5E5', radius: 4 },
    { name: 'reportDateLabel', type: 'text', position: { x: 18, y: 67 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
    { name: 'reportDateValue', type: 'text', position: { x: 47, y: 67 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'reportPeriodLabel', type: 'text', position: { x: 18, y: 73 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
    { name: 'reportPeriodValue', type: 'text', position: { x: 47, y: 73 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'reportTypeLabel', type: 'text', position: { x: 18, y: 79 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
    { name: 'reportTypeValue', type: 'text', position: { x: 47, y: 79 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    
    // Table header - matching quotation template styling
    { name: 'tableHeaderBg', type: 'rectangle', position: { x: 15, y: 99 }, width: 180, height: 10, color: '#E5E5E5', radius: 3 },
    { name: 'dateHeader', type: 'text', position: { x: 17, y: 102 }, width: 25, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
    { name: 'categoryHeader', type: 'text', position: { x: 47, y: 102 }, width: 40, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
    { name: 'descriptionHeader', type: 'text', position: { x: 92, y: 102 }, width: 50, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
    { name: 'amountHeader', type: 'text', position: { x: 147, y: 102 }, width: 40, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
    { name: 'typeHeader', type: 'text', position: { x: 192, y: 102 }, width: 25, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
  ];

  // Dynamically generate data rows - matching quotation template positioning
  const dataRows = [];
  for (let i = 0; i < rowCount; i++) {
    const yPosition = 112 + (i * 8); // Start at y=112 (after table header), each row 8 units apart (matching quotation)
    
    // Data fields (no alternating colors - clean professional look like quotation)
    dataRows.push(
      { name: `date${i + 1}`, type: 'text', position: { x: 17, y: yPosition }, width: 25, height: 6, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: `category${i + 1}`, type: 'text', position: { x: 47, y: yPosition }, width: 40, height: 6, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: `description${i + 1}`, type: 'text', position: { x: 92, y: yPosition }, width: 50, height: 6, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: `amount${i + 1}`, type: 'text', position: { x: 147, y: yPosition }, width: 40, height: 6, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: `type${i + 1}`, type: 'text', position: { x: 192, y: yPosition }, width: 25, height: 6, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' }
    );
  }

  // Footer section - matching quotation template styling
  const footerY = 112 + (rowCount * 8) + 20;
  const footerSchema = [
    // Summary section - matching quotation template
    { name: 'summaryTitle', type: 'text', position: { x: 15, y: footerY }, width: 60, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
    { name: 'summaryContent', type: 'text', position: { x: 15, y: footerY + 5 }, width: 120, height: 40, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    
    // Totals box - matching quotation template
    { name: 'totalsBox', type: 'rectangle', position: { x: 140, y: footerY }, width: 60, height: 27, color: '#E5E5E5', radius: 4 },
    { name: 'totalLabel', type: 'text', position: { x: 142, y: footerY + 20 }, width: 35, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
    { name: 'totalValue', type: 'text', position: { x: 165, y: footerY + 20 }, width: 33, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
    
    // Signature section - matching quotation template
    { name: 'preparedByLabel', type: 'text', position: { x: 15, y: footerY + 35 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'preparedByLine', type: 'line', position: { x: 35, y: footerY + 38 }, width: 60, height: 0, color: '#000' },
    { name: 'approvedByLabel', type: 'text', position: { x: 120, y: footerY + 35 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'approvedByLine', type: 'line', position: { x: 145, y: footerY + 38 }, width: 60, height: 0, color: '#000' },
    
    // Watermark - matching quotation template
    { name: 'watermarkLogo', type: 'image', position: { x: 60, y: footerY + 45 }, width: 100, height: 100, opacity: 0.2 }
  ];

  return {
    basePdf: { width: 210, height: Math.max(297, footerY + 80), padding: [0, 0, 0, 0] as [number, number, number, number] },
    schemas: [[...baseSchema, ...dataRows, ...footerSchema]]
  };
};

// Generate Expense Report PDF - Professional styling
const generateExpenseReportPDF = async (data: ExpenseReportData) => {
  const mergedData = { ...defaultReportValues, ...data };
  
  // Fetch watermark image as base64 (same as quotation)
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
  const companyLogoBase64 = await fetchImageAsBase64('/logowatermark.png');

  // Dynamically generate template based on number of data rows
  const dynamicTemplate = generateDynamicExpenseTemplate(mergedData.items.length);

  // Create inputs with actual data
  const inputs = [{
    // Company Info
    logo: companyLogoBase64,
    companyName: mergedData.companyName,
    companyLocation: mergedData.companyLocation,
    companyPhone: mergedData.companyPhone,
    companyEmail: mergedData.companyEmail,
    
    // Report Header
    reportTitle: mergedData.reportTitle,
    reportDateLabel: 'Date:',
    reportDateValue: mergedData.reportDate,
    reportPeriodLabel: 'Period:',
    reportPeriodValue: mergedData.reportPeriod,
    reportTypeLabel: 'Type:',
    reportTypeValue: mergedData.reportType,
    reportNumberLabel: 'Report No:',
    reportNumberValue: mergedData.reportNumber,
    reportNumberFull: `Report No: ${mergedData.reportNumber}`,
    
    // Table Headers
    dateHeader: 'Date',
    categoryHeader: 'Category',
    descriptionHeader: 'Description',
    amountHeader: 'Amount',
    typeHeader: 'Type',
    
    // Real Data Rows (populated with actual data from items array)
    ...mergedData.items.map((item, index) => ({
      [`date${index + 1}`]: item.date,
      [`category${index + 1}`]: item.category,
      [`description${index + 1}`]: item.description,
      [`amount${index + 1}`]: formatCurrency(item.amount),
      [`type${index + 1}`]: item.type
    })).reduce((acc, item) => ({ ...acc, ...item }), {}),
    
    // Footer
    summaryTitle: 'Summary:',
    summaryContent: mergedData.summary,
    totalLabel: 'Total:',
    totalValue: formatCurrency(mergedData.totalExpenses),
    preparedByLabel: `Prepared by: ${mergedData.preparedBy}`,
    approvedByLabel: `Approved by: ${mergedData.approvedBy}`,
    
    // Footer styling elements
    totalsBox: '',
    preparedByLine: '',
    approvedByLine: '',
    
    // Watermark
    watermarkLogo: watermarkLogoBase64,
  }];

  return { template: dynamicTemplate, inputs };
};

// Generate dynamic inventory template based on number of rows - Professional quotation-style design
const generateDynamicInventoryTemplate = (rowCount: number) => {
  const baseSchema = [
    // Company header section - matching quotation template
    { name: 'logo', type: 'image', position: { x: 15, y: 5 }, width: 38, height: 38 },
    { name: 'companyName', type: 'text', position: { x: 60, y: 11 }, width: 140, height: 14, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'left', fontWeight: 'Extra Bold', characterSpacing: 0.5 },
    { name: 'companyLocation', type: 'text', position: { x: 60, y: 21 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'companyPhone', type: 'text', position: { x: 60, y: 27 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'companyEmail', type: 'text', position: { x: 60, y: 33 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
    
    // Report header - matching quotation template styling
    { name: 'reportHeaderBg', type: 'rectangle', position: { x: 15, y: 47 }, width: 180, height: 14, color: '#E5E5E5', radius: 5 },
    { name: 'reportTitle', type: 'text', position: { x: 0, y: 50 }, width: 210, height: 12, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'center', fontWeight: 'bold' },
    
    // Report info section - matching quotation template styling
    { name: 'reportInfoBox', type: 'rectangle', position: { x: 15, y: 64 }, width: 62, height: 28, color: '#E5E5E5', radius: 4 },
    { name: 'reportDateLabel', type: 'text', position: { x: 18, y: 67 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
    { name: 'reportDateValue', type: 'text', position: { x: 47, y: 67 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'reportPeriodLabel', type: 'text', position: { x: 18, y: 73 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
    { name: 'reportPeriodValue', type: 'text', position: { x: 47, y: 73 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'reportTypeLabel', type: 'text', position: { x: 18, y: 79 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
    { name: 'reportTypeValue', type: 'text', position: { x: 47, y: 79 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    
    // Table header - matching quotation template styling
    { name: 'tableHeaderBg', type: 'rectangle', position: { x: 15, y: 99 }, width: 180, height: 10, color: '#E5E5E5', radius: 3 },
    { name: 'itemHeader', type: 'text', position: { x: 17, y: 102 }, width: 40, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
    { name: 'categoryHeader', type: 'text', position: { x: 62, y: 102 }, width: 35, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
    { name: 'quantityHeader', type: 'text', position: { x: 102, y: 102 }, width: 25, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
    { name: 'unitPriceHeader', type: 'text', position: { x: 132, y: 102 }, width: 35, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
    { name: 'valueHeader', type: 'text', position: { x: 172, y: 102 }, width: 35, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
  ];

  // Dynamically generate data rows - matching quotation template positioning
  const dataRows = [];
  for (let i = 0; i < rowCount; i++) {
    const yPosition = 112 + (i * 8); // Start at y=112 (after table header), each row 8 units apart (matching quotation)
    
    // Data fields (no alternating colors - clean professional look like quotation)
    dataRows.push(
      { name: `item${i + 1}`, type: 'text', position: { x: 17, y: yPosition }, width: 40, height: 6, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: `category${i + 1}`, type: 'text', position: { x: 62, y: yPosition }, width: 35, height: 6, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: `quantity${i + 1}`, type: 'text', position: { x: 102, y: yPosition }, width: 25, height: 6, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      { name: `unitPrice${i + 1}`, type: 'text', position: { x: 132, y: yPosition }, width: 35, height: 6, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: `value${i + 1}`, type: 'text', position: { x: 172, y: yPosition }, width: 35, height: 6, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' }
    );
  }

  // Footer section - matching quotation template styling
  const footerY = 112 + (rowCount * 8) + 20;
  const footerSchema = [
    // Summary section - matching quotation template
    { name: 'summaryTitle', type: 'text', position: { x: 15, y: footerY }, width: 60, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
    { name: 'summaryContent', type: 'text', position: { x: 15, y: footerY + 5 }, width: 120, height: 40, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    
    // Totals box - matching quotation template
    { name: 'totalsBox', type: 'rectangle', position: { x: 140, y: footerY }, width: 60, height: 27, color: '#E5E5E5', radius: 4 },
    { name: 'totalLabel', type: 'text', position: { x: 142, y: footerY + 20 }, width: 35, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
    { name: 'totalValue', type: 'text', position: { x: 165, y: footerY + 20 }, width: 33, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
    
    // Signature section - matching quotation template
    { name: 'preparedByLabel', type: 'text', position: { x: 15, y: footerY + 35 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'preparedByLine', type: 'line', position: { x: 35, y: footerY + 38 }, width: 60, height: 0, color: '#000' },
    { name: 'approvedByLabel', type: 'text', position: { x: 120, y: footerY + 35 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'approvedByLine', type: 'line', position: { x: 145, y: footerY + 38 }, width: 60, height: 0, color: '#000' },
    
    // Watermark - matching quotation template
    { name: 'watermarkLogo', type: 'image', position: { x: 60, y: footerY + 45 }, width: 100, height: 100, opacity: 0.2 }
  ];

  return {
    basePdf: { width: 210, height: Math.max(297, footerY + 80), padding: [0, 0, 0, 0] as [number, number, number, number] },
    schemas: [[...baseSchema, ...dataRows, ...footerSchema]]
  };
};

// Generate Inventory Report PDF - Professional styling
const generateInventoryReportPDF = async (data: InventoryReportData) => {
  const mergedData = { ...defaultReportValues, ...data };
  
  // Fetch watermark image as base64 (same as quotation)
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
  const companyLogoBase64 = await fetchImageAsBase64('/logowatermark.png');

  // Dynamically generate template based on number of data rows
  const dynamicTemplate = generateDynamicInventoryTemplate(mergedData.items.length);

  // Create inputs with actual data
  const inputs = [{
    // Company Info
    logo: companyLogoBase64,
    companyName: mergedData.companyName,
    companyLocation: mergedData.companyLocation,
    companyPhone: mergedData.companyPhone,
    companyEmail: mergedData.companyEmail,
    
    // Report Header
    reportTitle: mergedData.reportTitle,
    reportDateLabel: 'Date:',
    reportDateValue: mergedData.reportDate,
    reportPeriodLabel: 'Period:',
    reportPeriodValue: mergedData.reportPeriod,
    reportTypeLabel: 'Type:',
    reportTypeValue: mergedData.reportType,
    reportNumberLabel: 'Report No:',
    reportNumberValue: mergedData.reportNumber,
    reportNumberFull: `Report No: ${mergedData.reportNumber}`,
    
    // Table Headers
    itemHeader: 'Item',
    categoryHeader: 'Category',
    quantityHeader: 'Quantity',
    unitPriceHeader: 'Unit Price',
    valueHeader: 'Value',
    
    // Real Data Rows (populated with actual data from items array)
    ...mergedData.items.map((item, index) => ({
      [`item${index + 1}`]: item.item,
      [`category${index + 1}`]: item.category,
      [`quantity${index + 1}`]: item.quantity?.toString() || '0',
      [`unitPrice${index + 1}`]: formatCurrency(item.unitPrice),
      [`value${index + 1}`]: formatCurrency(item.value)
    })).reduce((acc, item) => ({ ...acc, ...item }), {}),
    
    // Footer
    summaryTitle: 'Summary:',
    summaryContent: mergedData.summary,
    totalLabel: 'Total Value:',
    totalValue: formatCurrency(mergedData.totalValue),
    preparedByLabel: `Prepared by: ${mergedData.preparedBy}`,
    approvedByLabel: `Approved by: ${mergedData.approvedBy}`,
    
    // Footer styling elements
    totalsBox: '',
    preparedByLine: '',
    approvedByLine: '',
    
    // Watermark
    watermarkLogo: watermarkLogoBase64,
  }];

  return { template: dynamicTemplate, inputs };
};

// Generate dynamic client template based on number of rows - Professional quotation-style design
const generateDynamicClientTemplate = (rowCount: number) => {
  const baseSchema = [
    // Company header section - matching quotation template
    { name: 'logo', type: 'image', position: { x: 15, y: 5 }, width: 38, height: 38 },
    { name: 'companyName', type: 'text', position: { x: 60, y: 11 }, width: 140, height: 14, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'left', fontWeight: 'Extra Bold', characterSpacing: 0.5 },
    { name: 'companyLocation', type: 'text', position: { x: 60, y: 21 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'companyPhone', type: 'text', position: { x: 60, y: 27 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'companyEmail', type: 'text', position: { x: 60, y: 33 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
    
    // Report header - matching quotation template styling
    { name: 'reportHeaderBg', type: 'rectangle', position: { x: 15, y: 47 }, width: 180, height: 14, color: '#E5E5E5', radius: 5 },
    { name: 'reportTitle', type: 'text', position: { x: 0, y: 50 }, width: 210, height: 12, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'center', fontWeight: 'bold' },
    
    // Report info section - matching quotation template styling
    { name: 'reportInfoBox', type: 'rectangle', position: { x: 15, y: 64 }, width: 62, height: 28, color: '#E5E5E5', radius: 4 },
    { name: 'reportDateLabel', type: 'text', position: { x: 18, y: 67 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
    { name: 'reportDateValue', type: 'text', position: { x: 47, y: 67 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'reportPeriodLabel', type: 'text', position: { x: 18, y: 73 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
    { name: 'reportPeriodValue', type: 'text', position: { x: 47, y: 73 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'reportTypeLabel', type: 'text', position: { x: 18, y: 79 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
    { name: 'reportTypeValue', type: 'text', position: { x: 47, y: 79 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    
    // Table header - matching quotation template styling
    { name: 'tableHeaderBg', type: 'rectangle', position: { x: 15, y: 99 }, width: 180, height: 10, color: '#E5E5E5', radius: 3 },
    { name: 'clientHeader', type: 'text', position: { x: 17, y: 102 }, width: 50, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
    { name: 'salesHeader', type: 'text', position: { x: 72, y: 102 }, width: 40, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
    { name: 'paymentsHeader', type: 'text', position: { x: 117, y: 102 }, width: 40, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
    { name: 'balanceHeader', type: 'text', position: { x: 162, y: 102 }, width: 40, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
    { name: 'statusHeader', type: 'text', position: { x: 207, y: 102 }, width: 25, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
  ];

  // Dynamically generate data rows - matching quotation template positioning
  const dataRows = [];
  for (let i = 0; i < rowCount; i++) {
    const yPosition = 112 + (i * 8); // Start at y=112 (after table header), each row 8 units apart (matching quotation)
    
    // Data fields (no alternating colors - clean professional look like quotation)
    dataRows.push(
      { name: `client${i + 1}`, type: 'text', position: { x: 17, y: yPosition }, width: 50, height: 6, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: `sales${i + 1}`, type: 'text', position: { x: 72, y: yPosition }, width: 40, height: 6, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
      { name: `payments${i + 1}`, type: 'text', position: { x: 117, y: yPosition }, width: 40, height: 6, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
      { name: `balance${i + 1}`, type: 'text', position: { x: 162, y: yPosition }, width: 40, height: 6, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: `status${i + 1}`, type: 'text', position: { x: 207, y: yPosition }, width: 25, height: 6, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' }
    );
  }

  // Footer section - matching quotation template styling
  const footerY = 112 + (rowCount * 8) + 20;
  const footerSchema = [
    // Summary section - matching quotation template
    { name: 'summaryTitle', type: 'text', position: { x: 15, y: footerY }, width: 60, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
    { name: 'summaryContent', type: 'text', position: { x: 15, y: footerY + 5 }, width: 120, height: 40, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    
    // Totals box - matching quotation template
    { name: 'totalsBox', type: 'rectangle', position: { x: 140, y: footerY }, width: 60, height: 27, color: '#E5E5E5', radius: 4 },
    { name: 'totalLabel', type: 'text', position: { x: 142, y: footerY + 20 }, width: 35, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
    { name: 'totalValue', type: 'text', position: { x: 165, y: footerY + 20 }, width: 33, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
    
    // Signature section - matching quotation template
    { name: 'preparedByLabel', type: 'text', position: { x: 15, y: footerY + 35 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'preparedByLine', type: 'line', position: { x: 35, y: footerY + 38 }, width: 60, height: 0, color: '#000' },
    { name: 'approvedByLabel', type: 'text', position: { x: 120, y: footerY + 35 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'approvedByLine', type: 'line', position: { x: 145, y: footerY + 38 }, width: 60, height: 0, color: '#000' },
    
    // Watermark - matching quotation template
    { name: 'watermarkLogo', type: 'image', position: { x: 60, y: footerY + 45 }, width: 100, height: 100, opacity: 0.2 }
  ];

  return {
    basePdf: { width: 210, height: Math.max(297, footerY + 50), padding: [0, 0, 0, 0] as [number, number, number, number] },
    schemas: [[...baseSchema, ...dataRows, ...footerSchema]]
  };
};

// Generate Client Report PDF - Professional styling
const generateClientReportPDF = async (data: ClientReportData) => {
  const mergedData = { ...defaultReportValues, ...data };
  
  // Fetch watermark image as base64 (same as quotation)
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
  const companyLogoBase64 = await fetchImageAsBase64('/logowatermark.png');

  // Dynamically generate template based on number of data rows
  const dynamicTemplate = generateDynamicClientTemplate(mergedData.items.length);

  // Create inputs with actual data
  const inputs = [{
    // Company Info
    logo: companyLogoBase64,
    companyName: mergedData.companyName,
    companyLocation: mergedData.companyLocation,
    companyPhone: mergedData.companyPhone,
    companyEmail: mergedData.companyEmail,
    
    // Report Header
    reportTitle: mergedData.reportTitle,
    reportDateLabel: 'Date:',
    reportDateValue: mergedData.reportDate,
    reportPeriodLabel: 'Period:',
    reportPeriodValue: mergedData.reportPeriod,
    reportTypeLabel: 'Type:',
    reportTypeValue: mergedData.reportType,
    reportNumberLabel: 'Report No:',
    reportNumberValue: mergedData.reportNumber,
    reportNumberFull: `Report No: ${mergedData.reportNumber}`,
    
    // Table Headers
    clientHeader: 'Client',
    salesHeader: 'Sales',
    paymentsHeader: 'Payments',
    balanceHeader: 'Balance',
    statusHeader: 'Status',
    
    // Real Data Rows (populated with actual data from items array)
    ...mergedData.items.map((item, index) => ({
      [`client${index + 1}`]: item.client,
      [`sales${index + 1}`]: formatCurrency(item.sales),
      [`payments${index + 1}`]: formatCurrency(item.payments),
      [`balance${index + 1}`]: formatCurrency(item.balance),
      [`status${index + 1}`]: item.status
    })).reduce((acc, item) => ({ ...acc, ...item }), {}),
    
    // Footer
    summaryTitle: 'Summary:',
    summaryContent: mergedData.summary,
    totalLabel: 'Total:',
    totalValue: formatCurrency(mergedData.totalBalance),
    preparedByLabel: `Prepared by: ${mergedData.preparedBy}`,
    approvedByLabel: `Approved by: ${mergedData.approvedBy}`,
    
    // Footer styling elements
    totalsBox: '',
    preparedByLine: '',
    approvedByLine: '',
    
    // Watermark
    watermarkLogo: watermarkLogoBase64,
  }];

  return { template: dynamicTemplate, inputs };
};

// Generate dynamic financial template based on number of rows - Professional quotation-style design
const generateDynamicFinancialTemplate = (rowCount: number) => {
  const baseSchema = [
    // Company header section - matching quotation template
    { name: 'logo', type: 'image', position: { x: 15, y: 5 }, width: 38, height: 38 },
    { name: 'companyName', type: 'text', position: { x: 60, y: 11 }, width: 140, height: 14, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'left', fontWeight: 'Extra Bold', characterSpacing: 0.5 },
    { name: 'companyLocation', type: 'text', position: { x: 60, y: 21 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'companyPhone', type: 'text', position: { x: 60, y: 27 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'companyEmail', type: 'text', position: { x: 60, y: 33 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
    
    // Report header section - matching quotation template styling
    { name: 'reportHeaderBg', type: 'rectangle', position: { x: 15, y: 47 }, width: 180, height: 14, color: '#E5E5E5', radius: 5 },
    { name: 'reportTitle', type: 'text', position: { x: 0, y: 50 }, width: 210, height: 12, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'center', fontWeight: 'bold' },
    
    // Report info section - matching quotation template styling
    { name: 'reportInfoBox', type: 'rectangle', position: { x: 15, y: 64 }, width: 62, height: 28, color: '#E5E5E5', radius: 4 },
    { name: 'reportDateLabel', type: 'text', position: { x: 18, y: 67 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
    { name: 'reportDateValue', type: 'text', position: { x: 47, y: 67 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'reportPeriodLabel', type: 'text', position: { x: 18, y: 73 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
    { name: 'reportPeriodValue', type: 'text', position: { x: 47, y: 73 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'reportTypeLabel', type: 'text', position: { x: 18, y: 79 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
    { name: 'reportTypeValue', type: 'text', position: { x: 47, y: 79 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    
    // Table headers - matching quotation template styling
    { name: 'tableHeaderBg', type: 'rectangle', position: { x: 15, y: 99 }, width: 180, height: 10, color: '#E5E5E5', radius: 3 },
    { name: 'metricHeader', type: 'text', position: { x: 17, y: 102 }, width: 60, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
    { name: 'currentPeriodHeader', type: 'text', position: { x: 82, y: 102 }, width: 50, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
    { name: 'previousPeriodHeader', type: 'text', position: { x: 137, y: 102 }, width: 50, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
    { name: 'changeHeader', type: 'text', position: { x: 192, y: 102 }, width: 30, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
  ];

  // Dynamically generate data rows - matching quotation template styling
  const dataRows = [];
  for (let i = 0; i < rowCount; i++) {
    const yPosition = 112 + (i * 8); // Start at y=112 (after table header), each row 8 units apart (matching quotation)
    dataRows.push(
      { name: `metric${i + 1}`, type: 'text', position: { x: 17, y: yPosition }, width: 60, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: `currentPeriod${i + 1}`, type: 'text', position: { x: 82, y: yPosition }, width: 50, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: `previousPeriod${i + 1}`, type: 'text', position: { x: 137, y: yPosition }, width: 50, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: `change${i + 1}`, type: 'text', position: { x: 192, y: yPosition }, width: 30, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' }
    );
  }

  // Footer section - matching quotation template styling
  const footerY = 112 + (rowCount * 8) + 20;
  const footerSchema = [
    // Summary section - matching quotation template
    { name: 'summaryTitle', type: 'text', position: { x: 15, y: footerY }, width: 60, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
    { name: 'summaryContent', type: 'text', position: { x: 15, y: footerY + 5 }, width: 120, height: 40, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    
    // Totals box - matching quotation template
    { name: 'totalsBox', type: 'rectangle', position: { x: 140, y: footerY }, width: 60, height: 27, color: '#E5E5E5', radius: 4 },
    { name: 'totalLabel', type: 'text', position: { x: 142, y: footerY + 20 }, width: 35, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
    { name: 'totalValue', type: 'text', position: { x: 165, y: footerY + 20 }, width: 33, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
    
    // Signature section - matching quotation template
    { name: 'preparedByLabel', type: 'text', position: { x: 15, y: footerY + 35 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'preparedByLine', type: 'line', position: { x: 35, y: footerY + 38 }, width: 60, height: 0, color: '#000' },
    { name: 'approvedByLabel', type: 'text', position: { x: 120, y: footerY + 35 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
    { name: 'approvedByLine', type: 'line', position: { x: 145, y: footerY + 38 }, width: 60, height: 0, color: '#000' },
    
    // Watermark - matching quotation template
    { name: 'watermarkLogo', type: 'image', position: { x: 60, y: footerY + 45 }, width: 100, height: 100, opacity: 0.2 }
  ];

  return {
    basePdf: { width: 210, height: Math.max(297, footerY + 50), padding: [0, 0, 0, 0] as [number, number, number, number] },
    schemas: [[...baseSchema, ...dataRows, ...footerSchema]]
  };
};

// Generate Financial Report PDF - Professional styling
const generateFinancialReportPDF = async (data: FinancialReportData) => {
  const mergedData = { ...defaultReportValues, ...data };
  
  // Fetch watermark image as base64 (same as quotation)
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
  const companyLogoBase64 = await fetchImageAsBase64('/logowatermark.png');

  // Dynamically generate template based on number of data rows
  const dynamicTemplate = generateDynamicFinancialTemplate(mergedData.items.length);

  // Create inputs with actual data
  const inputs = [{
    // Company Info
    logo: companyLogoBase64,
    companyName: mergedData.companyName,
    companyLocation: mergedData.companyLocation,
    companyPhone: mergedData.companyPhone,
    companyEmail: mergedData.companyEmail,
    
    // Report Header
    reportTitle: mergedData.reportTitle,
    reportDateLabel: 'Date:',
    reportDateValue: mergedData.reportDate,
    reportPeriodLabel: 'Period:',
    reportPeriodValue: mergedData.reportPeriod,
    reportTypeLabel: 'Type:',
    reportTypeValue: mergedData.reportType,
    reportNumberLabel: 'Report No:',
    reportNumberValue: mergedData.reportNumber,
    reportNumberFull: `Report No: ${mergedData.reportNumber}`,
    
    // Table Headers
    metricHeader: 'Metric',
    currentPeriodHeader: 'Current',
    previousPeriodHeader: 'Previous',
    changeHeader: 'Change',
    
    // Real Data Rows (populated with actual data from items array)
    ...mergedData.items.map((item, index) => ({
      [`metric${index + 1}`]: item.metric,
      [`currentPeriod${index + 1}`]: formatCurrency(item.currentPeriod),
      [`previousPeriod${index + 1}`]: item.previousPeriod ? formatCurrency(item.previousPeriod) : 'N/A',
      [`change${index + 1}`]: item.change || 'N/A'
    })).reduce((acc, item) => ({ ...acc, ...item }), {}),
    
    // Footer - matching quotation template structure
    summaryTitle: 'Summary:',
    summaryContent: mergedData.summary,
    totalsBox: '', // Background rectangle for totals
    totalLabel: 'Total:',
    totalValue: formatCurrency(mergedData.netIncome),
    preparedByLine: '', // Line for signature
    approvedByLine: '', // Line for signature
    preparedByLabel: `Prepared by: ${mergedData.preparedBy}`,
    approvedByLabel: `Approved by: ${mergedData.approvedBy}`,
    
    // Watermark
    watermarkLogo: watermarkLogoBase64,
  }];

  return { template: dynamicTemplate, inputs };
};

// ============================================================================
// NEW DYNAMIC TEMPLATE SYSTEM WITH PAGINATION SUPPORT
// ============================================================================

// Layout constants (in mm) - matching quotation PDF
const pageHeight = 297;
const pageWidth = 210;
const topMargin = 20;
const bottomMargin = 15;
const headerHeight = 60; // header block (first page only)
const tableHeaderHeight = 10;
const baseFooterHeight = 40; // base footer block (last page only)
const rowHeight = 8;
const firstPageTableStartY = 101; // adjusted so rows fit on first page

// Calculate rows per page
const firstPageReservedSpace = 16; // Reserve 16mm for better spacing
const firstPageAvailable = pageHeight - topMargin - headerHeight - tableHeaderHeight - bottomMargin - firstPageReservedSpace;
const otherPageAvailable = pageHeight - topMargin - tableHeaderHeight - bottomMargin;
const firstPageRows = Math.floor(firstPageAvailable / rowHeight);
const otherPageRows = Math.floor(otherPageAvailable / rowHeight);

// Custom table headers for each section view
const customTableHeaders = {
  expenses: {
    company: ['Expense #', 'Date', 'Department', 'Category', 'Description', 'Amount', 'Account Debited'],
    client: ['Expense #', 'Date', 'Client', 'Description', 'Amount', 'Account Debited']
  },
  payments: ['Payment #', 'Client', 'Date', 'Paid To', 'Description', 'Amount', 'Account Credited'],
  stock: ['Item Code', 'Product', 'Category', 'Quantity', 'Unit Price', 'Total Value', 'Status'],
  sales: ['Date', 'Client', 'Invoice', 'Amount', 'Status'],
  purchases: ['Date', 'Supplier', 'Reference', 'Amount', 'Status'],
  clients: ['Client Name', 'Email', 'Phone', 'Address', 'Total Sales', 'Status']
};

// Generate dynamic template with pagination support
const generateDynamicTemplateWithPagination = (
  rowCount: number, 
  tableHeaders: string[], 
  templateType: 'expenses' | 'payments' | 'stock' | 'sales' | 'purchases' | 'clients'
) => {
  // Paginate rows
  const pages: Array<Array<number>> = [];
  let rowIndex = 0;
  
  // First page
  const firstPageActualRows = Math.min(firstPageRows, rowCount);
  pages.push(Array.from({length: firstPageActualRows}, (_, i) => i));
  rowIndex += firstPageActualRows;
  
  // Subsequent pages
  while (rowIndex < rowCount) {
    const remainingRows = rowCount - rowIndex;
    const rowsForThisPage = Math.min(otherPageRows, remainingRows);
    if (rowsForThisPage > 0) {
      pages.push(Array.from({length: rowsForThisPage}, (_, i) => rowIndex + i));
    }
    rowIndex += rowsForThisPage;
  }

  // Build schemas for all pages
  const schemas: any[][] = [];
  
  pages.forEach((pageRows, pageIdx) => {
    const pageSchema: any[] = [];
    
    // Add watermark logo to every page as background
    pageSchema.push({
      name: `watermarkLogo_${pageIdx}`,
      type: 'image',
      position: { x: 60, y: 110 },
      width: 100,
      height: 100,
      opacity: 0.2
    });

    // Header (first page only)
    if (pageIdx === 0) {
      // Company header section - matching quotation template
      pageSchema.push(
        { name: 'logo', type: 'image', position: { x: 15, y: 5 }, width: 38, height: 38 },
        { name: 'companyName', type: 'text', position: { x: 60, y: 11 }, width: 140, height: 14, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'left', fontWeight: 'Extra Bold', characterSpacing: 0.5 },
        { name: 'companyLocation', type: 'text', position: { x: 60, y: 21 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
        { name: 'companyPhone', type: 'text', position: { x: 60, y: 27 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
        { name: 'companyEmail', type: 'text', position: { x: 60, y: 33 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
        
        // Report header section - matching quotation template styling
        { name: 'reportHeaderBg', type: 'rectangle', position: { x: 15, y: 47 }, width: 180, height: 14, color: '#E5E5E5', radius: 5 },
        { name: 'reportTitle', type: 'text', position: { x: 0, y: 50 }, width: 210, height: 12, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'center', fontWeight: 'bold' },
        
        // Report info section - responsive width calculation
        { name: 'reportInfoBox', type: 'rectangle', position: { x: 15, y: 64 }, width: 62, height: 28, color: '#E5E5E5', radius: 4 },
        { name: 'reportDateLabel', type: 'text', position: { x: 18, y: 67 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
        { name: 'reportDateValue', type: 'text', position: { x: 47, y: 67 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
        { name: 'reportPeriodLabel', type: 'text', position: { x: 18, y: 73 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
        { name: 'reportPeriodValue', type: 'text', position: { x: 47, y: 73 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
        { name: 'reportTypeLabel', type: 'text', position: { x: 18, y: 79 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
        { name: 'reportTypeValue', type: 'text', position: { x: 47, y: 79 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' }
      );
    }

    // Table header (every page) - positioned correctly for each page
    const tableHeaderY = (pageIdx === 0) ? firstPageTableStartY : topMargin;
    pageSchema.push(
      { name: `tableHeaderBg_${pageIdx}`, type: 'rectangle', position: { x: 15, y: tableHeaderY }, width: 180, height: 10, color: '#E5E5E5', radius: 3 }
    );

    // Add custom table headers based on template type
    const headerPositions = calculateHeaderPositions(tableHeaders, tableHeaderY);
    tableHeaders.forEach((header, headerIdx) => {
      pageSchema.push({
        name: `header_${pageIdx}_${headerIdx}`,
        type: 'text',
        position: headerPositions[headerIdx],
        width: headerPositions[headerIdx].width,
        height: 5,
        fontSize: 11,
        fontColor: '#000',
        fontName: 'Helvetica-Bold',
        alignment: headerIdx === 0 ? 'left' : (headerIdx === tableHeaders.length - 2 ? 'right' : 'center'),
        content: header
      });
    });

    // Data rows for this page
    pageRows.forEach((rowIdx, localIdx) => {
      const yPosition = tableHeaderY + tableHeaderHeight + (localIdx * rowHeight);
      
      // Generate data row fields based on template type
      const dataFields = generateDataFields(templateType, rowIdx, yPosition);
      pageSchema.push(...dataFields);
    });

    // Footer (only on the last table page)
    if (pageIdx === pages.length - 1) {
      const lastRowY = tableHeaderY + tableHeaderHeight + (pageRows.length * rowHeight);
      const footerStartY = lastRowY + 10; // 10mm spacing after last row
      const availableSpace = pageHeight - bottomMargin - footerStartY;
      
      // Check if footer fits on current page
      if (availableSpace >= baseFooterHeight) {
        // Footer fits on current page
        const footerY = footerStartY;
        
        // Add footer elements
        pageSchema.push(
          // Summary section
          { name: 'summaryTitle', type: 'text', position: { x: 15, y: footerY }, width: 60, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
          { name: 'summaryContent', type: 'text', position: { x: 15, y: footerY + 5 }, width: 120, height: 40, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
          
          // Responsive totals box
          { name: 'totalsBox', type: 'rectangle', position: { x: 140, y: footerY }, width: 60, height: 27, color: '#E5E5E5', radius: 4 },
          { name: 'totalLabel', type: 'text', position: { x: 142, y: footerY + 20 }, width: 35, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
          { name: 'totalValue', type: 'text', position: { x: 165, y: footerY + 20 }, width: 33, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
          
          // Signature section
          { name: 'preparedByLabel', type: 'text', position: { x: 15, y: footerY + 35 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
          { name: 'preparedByLine', type: 'line', position: { x: 35, y: footerY + 38 }, width: 60, height: 0, color: '#000' },
          { name: 'approvedByLabel', type: 'text', position: { x: 120, y: footerY + 35 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
          { name: 'approvedByLine', type: 'line', position: { x: 145, y: footerY + 38 }, width: 60, height: 0, color: '#000' }
        );
      } else {
        // Footer doesn't fit - create separate footer page
        const footerPageSchema: any[] = [];
        
        // Add watermark to footer page
        footerPageSchema.push({
          name: 'watermarkLogo_footer',
          type: 'image',
          position: { x: 60, y: 110 },
          width: 100,
          height: 100,
          opacity: 0.2
        });

        // Add footer elements to separate page
        const footerY = topMargin + 10;
        footerPageSchema.push(
          // Summary section
          { name: 'summaryTitle', type: 'text', position: { x: 15, y: footerY }, width: 60, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
          { name: 'summaryContent', type: 'text', position: { x: 15, y: footerY + 5 }, width: 120, height: 40, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
          
          // Responsive totals box
          { name: 'totalsBox', type: 'rectangle', position: { x: 140, y: footerY }, width: 60, height: 27, color: '#E5E5E5', radius: 4 },
          { name: 'totalLabel', type: 'text', position: { x: 142, y: footerY + 20 }, width: 35, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
          { name: 'totalValue', type: 'text', position: { x: 165, y: footerY + 20 }, width: 33, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
          
          // Signature section
          { name: 'preparedByLabel', type: 'text', position: { x: 15, y: footerY + 35 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
          { name: 'preparedByLine', type: 'line', position: { x: 35, y: footerY + 35 }, width: 60, height: 0, color: '#000' },
          { name: 'approvedByLabel', type: 'text', position: { x: 120, y: footerY + 35 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
          { name: 'approvedByLine', type: 'line', position: { x: 145, y: footerY + 35 }, width: 60, height: 0, color: '#000' }
        );

        // Add footer page to schemas
        schemas.push(footerPageSchema);
      }
    }

    schemas.push(pageSchema);
  });

  return {
    basePdf: { width: pageWidth, height: pageHeight, padding: [0, 0, 0, 0] as [number, number, number, number] },
    schemas
  };
};

// Calculate header positions based on number of columns
const calculateHeaderPositions = (headers: string[], tableHeaderY: number) => {
  const positions: Array<{x: number, y: number, width: number}> = [];
  const totalWidth = 180; // Available width for table
  const columnCount = headers.length;
  const columnWidth = totalWidth / columnCount;
  
  headers.forEach((header, index) => {
    positions.push({
      x: 15 + (index * columnWidth),
      y: tableHeaderY + 2,
      width: columnWidth - 2 // Small gap between columns
    });
  });
  
  return positions;
};

// Generate data fields based on template type
const generateDataFields = (templateType: string, rowIdx: number, yPosition: number) => {
  const fields: any[] = [];
  
  switch (templateType) {
    case 'expenses':
      // Expense fields: Expense #, Date, Department/Client, Category, Description, Amount, Account Debited
      fields.push(
        { name: `expenseNumber_${rowIdx}`, type: 'text', position: { x: 17, y: yPosition }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
        { name: `date_${rowIdx}`, type: 'text', position: { x: 42, y: yPosition }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
        { name: `department_${rowIdx}`, type: 'text', position: { x: 67, y: yPosition }, width: 30, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
        { name: `category_${rowIdx}`, type: 'text', position: { x: 97, y: yPosition }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
        { name: `description_${rowIdx}`, type: 'text', position: { x: 122, y: yPosition }, width: 35, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
        { name: `amount_${rowIdx}`, type: 'text', position: { x: 157, y: yPosition }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
        { name: `accountDebited_${rowIdx}`, type: 'text', position: { x: 182, y: yPosition }, width: 28, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' }
      );
      break;
      
    case 'payments':
      // Payment fields: Payment #, Client, Date, Paid To, Description, Amount, Account Credited
      fields.push(
        { name: `paymentNumber_${rowIdx}`, type: 'text', position: { x: 17, y: yPosition }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
        { name: `client_${rowIdx}`, type: 'text', position: { x: 42, y: yPosition }, width: 30, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
        { name: `date_${rowIdx}`, type: 'text', position: { x: 72, y: yPosition }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
        { name: `paidTo_${rowIdx}`, type: 'text', position: { x: 97, y: yPosition }, width: 30, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
        { name: `description_${rowIdx}`, type: 'text', position: { x: 127, y: yPosition }, width: 30, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
        { name: `amount_${rowIdx}`, type: 'text', position: { x: 157, y: yPosition }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
        { name: `accountCredited_${rowIdx}`, type: 'text', position: { x: 182, y: yPosition }, width: 28, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' }
      );
      break;
      
    case 'stock':
      // Stock fields: Item Code, Product, Category, Quantity, Unit Price, Total Value, Status
      fields.push(
        { name: `itemCode_${rowIdx}`, type: 'text', position: { x: 17, y: yPosition }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
        { name: `product_${rowIdx}`, type: 'text', position: { x: 42, y: yPosition }, width: 35, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
        { name: `category_${rowIdx}`, type: 'text', position: { x: 77, y: yPosition }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
        { name: `quantity_${rowIdx}`, type: 'text', position: { x: 102, y: yPosition }, width: 20, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
        { name: `unitPrice_${rowIdx}`, type: 'text', position: { x: 122, y: yPosition }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
        { name: `totalValue_${rowIdx}`, type: 'text', position: { x: 147, y: yPosition }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
        { name: `status_${rowIdx}`, type: 'text', position: { x: 172, y: yPosition }, width: 23, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' }
      );
      break;
      
    default:
      // Default fields for other types
      fields.push(
        { name: `field1_${rowIdx}`, type: 'text', position: { x: 17, y: yPosition }, width: 40, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
        { name: `field2_${rowIdx}`, type: 'text', position: { x: 57, y: yPosition }, width: 40, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
        { name: `field3_${rowIdx}`, type: 'text', position: { x: 97, y: yPosition }, width: 40, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
        { name: `field4_${rowIdx}`, type: 'text', position: { x: 137, y: yPosition }, width: 40, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' }
      );
  }
  
  return fields;
};

// Export all templates and functions
export {
  salesReportTemplate,
  expenseReportTemplate,
  inventoryReportTemplate,
  clientReportTemplate,
  financialReportTemplate,
  customReportTemplate,
  defaultReportValues,
  generateTestPDF,
  generateSalesReportPDF,
  generateExpenseReportPDF,
  generateInventoryReportPDF,
  generateClientReportPDF,
  generateFinancialReportPDF,
  generateDynamicTemplateWithPagination,
  calculateHeaderPositions,
  generateDataFields
};
