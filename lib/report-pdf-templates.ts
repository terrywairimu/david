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
    
    // Sample Data Rows (will be populated with actual data)
    date1: '2024-01-15',
    client1: 'John Doe',
    invoice1: 'INV-001',
    amount1: 'KES 25,000',
    status1: 'Paid',
    
    date2: '2024-01-16',
    client2: 'Jane Smith',
    invoice2: 'INV-002',
    amount2: 'KES 18,500',
    status2: 'Pending',
    
    date3: '2024-01-17',
    client3: 'Bob Johnson',
    invoice3: 'INV-003',
    amount3: 'KES 32,750',
    status3: 'Paid',
    
    // Footer
    summaryTitle: 'Summary:',
    summaryContent: mergedData.summary,
    totalLabel: 'Total:',
    totalValue: formatCurrency(mergedData.totalSales),
    preparedByLabel: `Prepared by: ${mergedData.preparedBy}`,
    approvedByLabel: `Approved by: ${mergedData.approvedBy}`,
    
    // Watermark
    watermarkLogo: watermarkLogoBase64,
  }];

  return { template: salesReportTemplate, inputs };
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
    
    // Sample Data Rows (will be populated with actual data)
    date1: '2024-01-15',
    category1: 'Office',
    description1: 'Stationery supplies',
    amount1: 'KES 5,000',
    type1: 'Expense',
    
    date2: '2024-01-16',
    category2: 'Transport',
    description2: 'Fuel for delivery',
    amount2: 'KES 8,500',
    type2: 'Expense',
    
    date3: '2024-01-17',
    category3: 'Utilities',
    description3: 'Electricity bill',
    amount3: 'KES 12,000',
    type3: 'Expense',
    
    // Footer
    summaryTitle: 'Summary:',
    summaryContent: mergedData.summary,
    totalLabel: 'Total:',
    totalValue: formatCurrency(mergedData.totalExpenses),
    preparedByLabel: `Prepared by: ${mergedData.preparedBy}`,
    approvedByLabel: `Approved by: ${mergedData.approvedBy}`,
    
    // Watermark
    watermarkLogo: watermarkLogoBase64,
  }];

  return { template: expenseReportTemplate, inputs };
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
    
    // Sample Data Rows (will be populated with actual data)
    item1: 'Kitchen Cabinet',
    category1: 'Cabinets',
    quantity1: '5',
    unitPrice1: 'KES 15,000',
    value1: 'KES 75,000',
    
    item2: 'Worktop',
    category2: 'Surfaces',
    quantity2: '3',
    unitPrice2: 'KES 8,500',
    value2: 'KES 25,500',
    
    item3: 'Drawer Handles',
    category3: 'Accessories',
    quantity3: '20',
    unitPrice3: 'KES 500',
    value3: 'KES 10,000',
    
    // Footer
    summaryTitle: 'Summary:',
    summaryContent: mergedData.summary,
    totalLabel: 'Total:',
    totalValue: formatCurrency(mergedData.totalValue),
    preparedByLabel: `Prepared by: ${mergedData.preparedBy}`,
    approvedByLabel: `Approved by: ${mergedData.approvedBy}`,
    
    // Watermark
    watermarkLogo: watermarkLogoBase64,
  }];

  return { template: inventoryReportTemplate, inputs };
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
    
    // Sample Data Rows (will be populated with actual data)
    client1: 'John Doe',
    sales1: 'KES 45,000',
    payments1: 'KES 30,000',
    balance1: 'KES 15,000',
    status1: 'Active',
    
    client2: 'Jane Smith',
    sales2: 'KES 28,500',
    payments2: 'KES 28,500',
    balance2: 'KES 0',
    status2: 'Paid',
    
    client3: 'Bob Johnson',
    sales3: 'KES 67,250',
    payments3: 'KES 45,000',
    balance3: 'KES 22,250',
    status3: 'Outstanding',
    
    // Footer
    summaryTitle: 'Summary:',
    summaryContent: mergedData.summary,
    totalLabel: 'Total:',
    totalValue: formatCurrency(mergedData.totalBalance),
    preparedByLabel: `Prepared by: ${mergedData.preparedBy}`,
    approvedByLabel: `Approved by: ${mergedData.approvedBy}`,
    
    // Watermark
    watermarkLogo: watermarkLogoBase64,
  }];

  return { template: clientReportTemplate, inputs };
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
    
    // Sample Data Rows (will be populated with actual data)
    metric1: 'Total Sales',
    currentPeriod1: 'KES 450,000',
    previousPeriod1: 'KES 380,000',
    change1: '+18.4%',
    
    metric2: 'Total Expenses',
    currentPeriod2: 'KES 280,000',
    previousPeriod2: 'KES 250,000',
    change2: '+12.0%',
    
    metric3: 'Net Income',
    currentPeriod3: 'KES 170,000',
    previousPeriod3: 'KES 130,000',
    change3: '+30.8%',
    
    // Footer
    summaryTitle: 'Summary:',
    summaryContent: mergedData.summary,
    totalLabel: 'Total:',
    totalValue: formatCurrency(mergedData.netIncome),
    preparedByLabel: `Prepared by: ${mergedData.preparedBy}`,
    approvedByLabel: `Approved by: ${mergedData.approvedBy}`,
    
    // Watermark
    watermarkLogo: watermarkLogoBase64,
  }];

  return { template: financialReportTemplate, inputs };
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
  generateFinancialReportPDF
};
