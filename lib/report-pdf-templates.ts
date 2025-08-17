// Report PDF Templates - Customized for each report type
// Maintains the same modern layout and styling as quotation templates

import { imageToBase64 } from './pdf-template';

// Base template structure for all reports
const baseReportTemplate = {
  basePdf: {
    width: 210,
    height: 297,
    padding: [0, 0, 0, 0] as [number, number, number, number],
  },
  schemas: [
    [
      // Header Section
      { name: 'logo', type: 'image', position: { x: 15, y: 5 }, width: 38, height: 38 },
      { name: 'companyName', type: 'text', position: { x: 60, y: 11 }, width: 140, height: 14, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'left', fontWeight: 'Extra Bold', characterSpacing: 0.5 },
      { name: 'companyLocation', type: 'text', position: { x: 60, y: 21 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'companyPhone', type: 'text', position: { x: 60, y: 27 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'companyEmail', type: 'text', position: { x: 60, y: 33 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
      
      // Report Header Background
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
      { name: 'reportGeneratedLabel', type: 'text', position: { x: 18, y: 85 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'reportGeneratedValue', type: 'text', position: { x: 47, y: 85 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      
      // Report Number (top right)
      { name: 'reportNumber', type: 'text', position: { x: 13, y: 67 }, width: 180, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      // Watermark Logo
      { name: 'watermarkLogo', type: 'image', position: { x: 60, y: 110 }, width: 100, height: 100, opacity: 0.2 },
      
      // Table Header Background
      { name: 'tableHeaderBg', type: 'rectangle', position: { x: 15, y: 99 }, width: 180, height: 10, color: '#E5E5E5', radius: 3 },
      
      // Footer Section
      { name: 'summaryTitle', type: 'text', position: { x: 15, y: 245 }, width: 60, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'summaryContent', type: 'text', position: { x: 15, y: 250 }, width: 120, height: 40, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'totalsBox', type: 'rectangle', position: { x: 140, y: 245 }, width: 60, height: 27, color: '#E5E5E5', radius: 4 },
      { name: 'totalLabel', type: 'text', position: { x: 142, y: 265 }, width: 35, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'totalValue', type: 'text', position: { x: 165, y: 265 }, width: 33, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
      
      // Signatures
      { name: 'preparedByLabel', type: 'text', position: { x: 15, y: 280 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'preparedByLine', type: 'line', position: { x: 35, y: 283 }, width: 60, height: 0, color: '#000' },
      { name: 'approvedByLabel', type: 'text', position: { x: 120, y: 280 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'approvedByLine', type: 'line', position: { x: 145, y: 283 }, width: 60, height: 0, color: '#000' },
    ]
  ]
};

// Sales Report Template
const salesReportTemplate = {
  ...baseReportTemplate,
  schemas: [
    [
      ...baseReportTemplate.schemas[0],
      // Sales-specific table headers
      { name: 'dateHeader', type: 'text', position: { x: 17, y: 102 }, width: 25, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Date' },
      { name: 'clientHeader', type: 'text', position: { x: 47, y: 102 }, width: 45, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Client' },
      { name: 'invoiceHeader', type: 'text', position: { x: 97, y: 102 }, width: 25, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Invoice' },
      { name: 'amountHeader', type: 'text', position: { x: 127, y: 102 }, width: 30, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Amount' },
      { name: 'statusHeader', type: 'text', position: { x: 162, y: 102 }, width: 33, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Status' },
    ]
  ]
};

// Expense Report Template
const expenseReportTemplate = {
  ...baseReportTemplate,
  schemas: [
    [
      ...baseReportTemplate.schemas[0],
      // Expense-specific table headers
      { name: 'dateHeader', type: 'text', position: { x: 17, y: 102 }, width: 25, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Date' },
      { name: 'categoryHeader', type: 'text', position: { x: 47, y: 102 }, width: 45, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Category' },
      { name: 'descriptionHeader', type: 'text', position: { x: 97, y: 102 }, width: 45, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Description' },
      { name: 'amountHeader', type: 'text', position: { x: 147, y: 102 }, width: 30, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Amount' },
      { name: 'typeHeader', type: 'text', position: { x: 182, y: 102 }, width: 13, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Type' },
    ]
  ]
};

// Inventory Report Template
const inventoryReportTemplate = {
  ...baseReportTemplate,
  schemas: [
    [
      ...baseReportTemplate.schemas[0],
      // Inventory-specific table headers
      { name: 'itemHeader', type: 'text', position: { x: 17, y: 102 }, width: 45, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Item' },
      { name: 'categoryHeader', type: 'text', position: { x: 67, y: 102 }, width: 35, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Category' },
      { name: 'quantityHeader', type: 'text', position: { x: 107, y: 102 }, width: 25, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Qty' },
      { name: 'unitPriceHeader', type: 'text', position: { x: 137, y: 102 }, width: 30, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Unit Price' },
      { name: 'valueHeader', type: 'text', position: { x: 172, y: 102 }, width: 23, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Value' },
    ]
  ]
};

// Client Report Template
const clientReportTemplate = {
  ...baseReportTemplate,
  schemas: [
    [
      ...baseReportTemplate.schemas[0],
      // Client-specific table headers
      { name: 'clientHeader', type: 'text', position: { x: 17, y: 102 }, width: 50, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Client' },
      { name: 'salesHeader', type: 'text', position: { x: 72, y: 102 }, width: 35, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Sales' },
      { name: 'paymentsHeader', type: 'text', position: { x: 112, y: 102 }, width: 35, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Payments' },
      { name: 'balanceHeader', type: 'text', position: { x: 152, y: 102 }, width: 35, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Balance' },
      { name: 'statusHeader', type: 'text', position: { x: 192, y: 102 }, width: 3, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Status' },
    ]
  ]
};

// Financial Report Template
const financialReportTemplate = {
  ...baseReportTemplate,
  schemas: [
    [
      ...baseReportTemplate.schemas[0],
      // Financial-specific table headers
      { name: 'metricHeader', type: 'text', position: { x: 17, y: 102 }, width: 80, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Metric' },
      { name: 'currentPeriodHeader', type: 'text', position: { x: 102, y: 102 }, width: 40, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Current' },
      { name: 'previousPeriodHeader', type: 'text', position: { x: 147, y: 102 }, width: 40, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Previous' },
      { name: 'changeHeader', type: 'text', position: { x: 192, y: 102 }, width: 3, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Change' },
    ]
  ]
};

// Custom Report Template
const customReportTemplate = {
  ...baseReportTemplate,
  schemas: [
    [
      ...baseReportTemplate.schemas[0],
      // Custom report table headers (flexible)
      { name: 'column1Header', type: 'text', position: { x: 17, y: 102 }, width: 40, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Column 1' },
      { name: 'column2Header', type: 'text', position: { x: 62, y: 102 }, width: 40, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Column 2' },
      { name: 'column3Header', type: 'text', position: { x: 107, y: 102 }, width: 40, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Column 3' },
      { name: 'column4Header', type: 'text', position: { x: 152, y: 102 }, width: 40, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Column 4' },
      { name: 'column5Header', type: 'text', position: { x: 197, y: 102 }, width: 8, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Col 5' },
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

// Generate Sales Report PDF
const generateSalesReportPDF = async (data: SalesReportData) => {
  const mergedData = { ...defaultReportValues, ...data };
  
  // Transform items to table row format
  const tableRows = mergedData.items.map((item, idx) => [
    item.date,
    item.client,
    item.invoice,
    formatCurrency(item.amount),
    item.status
  ]);

  // Calculate dynamic content
  const totalRows = tableRows.length;
  const rowsPerPage = 20; // Adjust based on content
  const pages = Math.ceil(totalRows / rowsPerPage);

  // Generate schema for each page
  const allSchemas = [];
  
  for (let pageIdx = 0; pageIdx < pages; pageIdx++) {
    const pageSchemas = [...salesReportTemplate.schemas[0]];
    const startRow = pageIdx * rowsPerPage;
    const endRow = Math.min(startRow + rowsPerPage, totalRows);
    const pageRows = tableRows.slice(startRow, endRow);

    // Add page-specific content
    if (pageIdx === 0) {
      // First page - add all header elements
      pageSchemas.push(
        { name: 'companyLogo', type: 'image', position: { x: 15, y: 5 }, width: 38, height: 38, content: mergedData.companyLogo || '' },
        { name: 'companyName', type: 'text', position: { x: 60, y: 11 }, width: 140, height: 14, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'left', content: mergedData.companyName },
        { name: 'companyLocation', type: 'text', position: { x: 60, y: 21 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left', content: mergedData.companyLocation },
        { name: 'companyPhone', type: 'text', position: { x: 60, y: 27 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left', content: mergedData.companyPhone },
        { name: 'companyEmail', type: 'text', position: { x: 60, y: 33 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left', content: mergedData.companyEmail },
        { name: 'reportTitle', type: 'text', position: { x: 0, y: 50 }, width: 210, height: 12, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'center', content: mergedData.reportTitle },
        { name: 'reportDate', type: 'text', position: { x: 47, y: 67 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.reportDate },
        { name: 'reportPeriod', type: 'text', position: { x: 47, y: 73 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.reportPeriod },
        { name: 'reportType', type: 'text', position: { x: 47, y: 79 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.reportType },
        { name: 'reportGenerated', type: 'text', position: { x: 47, y: 85 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.reportGenerated },
        { name: 'reportNumber', type: 'text', position: { x: 13, y: 67 }, width: 180, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right', content: mergedData.reportNumber }
      );
    }

    // Add table rows
    pageRows.forEach((row, rowIdx) => {
      const y = 110 + (rowIdx * 8);
      pageSchemas.push(
        { name: `date${pageIdx}_${rowIdx}`, type: 'text', position: { x: 17, y }, width: 25, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: row[0] },
        { name: `client${pageIdx}_${rowIdx}`, type: 'text', position: { x: 47, y }, width: 45, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: row[1] },
        { name: `invoice${pageIdx}_${rowIdx}`, type: 'text', position: { x: 97, y }, width: 25, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: row[2] },
        { name: `amount${pageIdx}_${rowIdx}`, type: 'text', position: { x: 127, y }, width: 30, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right', content: row[3] },
        { name: `status${pageIdx}_${rowIdx}`, type: 'text', position: { x: 162, y }, width: 33, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'center', content: row[4] }
      );
    });

    // Add footer elements on last page
    if (pageIdx === pages - 1) {
      pageSchemas.push(
        { name: 'summaryContent', type: 'text', position: { x: 15, y: 250 }, width: 120, height: 40, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.summary },
        { name: 'totalValue', type: 'text', position: { x: 165, y: 265 }, width: 33, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right', content: formatCurrency(mergedData.totalSales) },
        { name: 'preparedByLabel', type: 'text', position: { x: 15, y: 280 }, width: 30, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.preparedBy },
        { name: 'approvedByLabel', type: 'text', position: { x: 120, y: 280 }, width: 30, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.approvedBy }
      );
    }

    allSchemas.push(pageSchemas);
  }

  return {
    template: {
      basePdf: salesReportTemplate.basePdf,
      schemas: allSchemas
    },
    inputs: [{}] // Single input object for all pages
  };
};

// Generate Expense Report PDF
const generateExpenseReportPDF = async (data: ExpenseReportData) => {
  const mergedData = { ...defaultReportValues, ...data };
  
  // Transform items to table row format
  const tableRows = mergedData.items.map((item, idx) => [
    item.date,
    item.category,
    item.description,
    formatCurrency(item.amount),
    item.type
  ]);

  // Similar structure to sales report but with expense-specific columns
  const totalRows = tableRows.length;
  const rowsPerPage = 20;
  const pages = Math.ceil(totalRows / rowsPerPage);

  const allSchemas = [];
  
  for (let pageIdx = 0; pageIdx < pages; pageIdx++) {
    const pageSchemas = [...expenseReportTemplate.schemas[0]];
    const startRow = pageIdx * rowsPerPage;
    const endRow = Math.min(startRow + rowsPerPage, totalRows);
    const pageRows = tableRows.slice(startRow, endRow);

    // Add page-specific content similar to sales report
    if (pageIdx === 0) {
      // First page header elements
      pageSchemas.push(
        { name: 'companyLogo', type: 'image', position: { x: 15, y: 5 }, width: 38, height: 38, content: mergedData.companyLogo || '' },
        { name: 'companyName', type: 'text', position: { x: 60, y: 11 }, width: 140, height: 14, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'left', content: mergedData.companyName },
        { name: 'reportTitle', type: 'text', position: { x: 0, y: 50 }, width: 210, height: 12, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'center', content: mergedData.reportTitle },
        { name: 'reportDate', type: 'text', position: { x: 47, y: 67 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.reportDate },
        { name: 'reportPeriod', type: 'text', position: { x: 47, y: 73 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.reportPeriod },
        { name: 'reportType', type: 'text', position: { x: 47, y: 79 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.reportType },
        { name: 'reportGenerated', type: 'text', position: { x: 47, y: 85 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.reportGenerated },
        { name: 'reportNumber', type: 'text', position: { x: 13, y: 67 }, width: 180, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right', content: mergedData.reportNumber }
      );
    }

    // Add table rows
    pageRows.forEach((row, rowIdx) => {
      const y = 110 + (rowIdx * 8);
      pageSchemas.push(
        { name: `date${pageIdx}_${rowIdx}`, type: 'text', position: { x: 17, y }, width: 25, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: row[0] },
        { name: `category${pageIdx}_${rowIdx}`, type: 'text', position: { x: 47, y }, width: 45, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: row[1] },
        { name: `description${pageIdx}_${rowIdx}`, type: 'text', position: { x: 97, y }, width: 45, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: row[2] },
        { name: `amount${pageIdx}_${rowIdx}`, type: 'text', position: { x: 147, y }, width: 30, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right', content: row[3] },
        { name: `type${pageIdx}_${rowIdx}`, type: 'text', position: { x: 182, y }, width: 13, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'center', content: row[4] }
      );
    });

    // Add footer elements on last page
    if (pageIdx === pages - 1) {
      pageSchemas.push(
        { name: 'summaryContent', type: 'text', position: { x: 15, y: 250 }, width: 120, height: 40, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.summary },
        { name: 'totalValue', type: 'text', position: { x: 165, y: 265 }, width: 33, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right', content: formatCurrency(mergedData.totalExpenses) },
        { name: 'preparedByLabel', type: 'text', position: { x: 15, y: 280 }, width: 30, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.preparedBy },
        { name: 'approvedByLabel', type: 'text', position: { x: 120, y: 280 }, width: 30, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.approvedBy }
      );
    }

    allSchemas.push(pageSchemas);
  }

  return {
    template: {
      basePdf: expenseReportTemplate.basePdf,
      schemas: allSchemas
    },
    inputs: [{}]
  };
};

// Generate Financial Report PDF
const generateFinancialReportPDF = async (data: FinancialReportData) => {
  const mergedData = { ...defaultReportValues, ...data };
  
  // Transform items to table row format
  const tableRows = mergedData.items.map((item, idx) => [
    item.metric,
    formatCurrency(item.currentPeriod),
    item.previousPeriod ? formatCurrency(item.previousPeriod) : '-',
    item.change ? formatPercentage(item.change) : '-'
  ]);

  const totalRows = tableRows.length;
  const rowsPerPage = 20;
  const pages = Math.ceil(totalRows / rowsPerPage);

  const allSchemas = [];
  
  for (let pageIdx = 0; pageIdx < pages; pageIdx++) {
    const pageSchemas = [...financialReportTemplate.schemas[0]];
    const startRow = pageIdx * rowsPerPage;
    const endRow = Math.min(startRow + rowsPerPage, totalRows);
    const pageRows = tableRows.slice(startRow, endRow);

    if (pageIdx === 0) {
      pageSchemas.push(
        { name: 'companyLogo', type: 'image', position: { x: 15, y: 5 }, width: 38, height: 38, content: mergedData.companyLogo || '' },
        { name: 'companyName', type: 'text', position: { x: 60, y: 11 }, width: 140, height: 14, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'left', content: mergedData.companyName },
        { name: 'reportTitle', type: 'text', position: { x: 0, y: 50 }, width: 210, height: 12, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'center', content: mergedData.reportTitle },
        { name: 'reportDate', type: 'text', position: { x: 47, y: 67 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.reportDate },
        { name: 'reportPeriod', type: 'text', position: { x: 47, y: 73 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.reportPeriod },
        { name: 'reportType', type: 'text', position: { x: 47, y: 79 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.reportType },
        { name: 'reportGenerated', type: 'text', position: { x: 47, y: 85 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.reportGenerated },
        { name: 'reportNumber', type: 'text', position: { x: 13, y: 67 }, width: 180, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right', content: mergedData.reportNumber }
      );
    }

    // Add table rows
    pageRows.forEach((row, rowIdx) => {
      const y = 110 + (rowIdx * 8);
      pageSchemas.push(
        { name: `metric${pageIdx}_${rowIdx}`, type: 'text', position: { x: 17, y }, width: 80, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: row[0] },
        { name: `current${pageIdx}_${rowIdx}`, type: 'text', position: { x: 102, y }, width: 40, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right', content: row[1] },
        { name: `previous${pageIdx}_${rowIdx}`, type: 'text', position: { x: 147, y }, width: 40, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right', content: row[2] },
        { name: `change${pageIdx}_${rowIdx}`, type: 'text', position: { x: 192, y }, width: 3, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right', content: row[3] }
      );
    });

    // Add footer elements on last page
    if (pageIdx === pages - 1) {
      pageSchemas.push(
        { name: 'summaryContent', type: 'text', position: { x: 15, y: 250 }, width: 120, height: 40, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.summary },
        { name: 'totalValue', type: 'text', position: { x: 165, y: 265 }, width: 33, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right', content: formatCurrency(mergedData.netIncome) },
        { name: 'preparedByLabel', type: 'text', position: { x: 15, y: 280 }, width: 30, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.preparedBy },
        { name: 'approvedByLabel', type: 'text', position: { x: 120, y: 280 }, width: 30, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.approvedBy }
      );
    }

    allSchemas.push(pageSchemas);
  }

  return {
    template: {
      basePdf: financialReportTemplate.basePdf,
      schemas: allSchemas
    },
    inputs: [{}]
  };
};

// Generate Inventory Report PDF
const generateInventoryReportPDF = async (data: InventoryReportData) => {
  const mergedData = { ...defaultReportValues, ...data };
  
  // Transform items to table row format
  const tableRows = mergedData.items.map((item, idx) => [
    item.item,
    item.category,
    item.quantity.toString(),
    formatCurrency(item.unitPrice),
    formatCurrency(item.value)
  ]);

  const totalRows = tableRows.length;
  const rowsPerPage = 20;
  const pages = Math.ceil(totalRows / rowsPerPage);

  const allSchemas = [];
  
  for (let pageIdx = 0; pageIdx < pages; pageIdx++) {
    const pageSchemas = [...inventoryReportTemplate.schemas[0]];
    const startRow = pageIdx * rowsPerPage;
    const endRow = Math.min(startRow + rowsPerPage, totalRows);
    const pageRows = tableRows.slice(startRow, endRow);

    if (pageIdx === 0) {
      pageSchemas.push(
        { name: 'companyLogo', type: 'image', position: { x: 15, y: 5 }, width: 38, height: 38, content: mergedData.companyLogo || '' },
        { name: 'companyName', type: 'text', position: { x: 60, y: 11 }, width: 140, height: 14, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'left', content: mergedData.companyName },
        { name: 'reportTitle', type: 'text', position: { x: 0, y: 50 }, width: 210, height: 12, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'center', content: mergedData.reportTitle },
        { name: 'reportDate', type: 'text', position: { x: 47, y: 67 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.reportDate },
        { name: 'reportPeriod', type: 'text', position: { x: 47, y: 73 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.reportPeriod },
        { name: 'reportType', type: 'text', position: { x: 47, y: 79 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.reportType },
        { name: 'reportGenerated', type: 'text', position: { x: 47, y: 85 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.reportGenerated },
        { name: 'reportNumber', type: 'text', position: { x: 13, y: 67 }, width: 180, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right', content: mergedData.reportNumber }
      );
    }

    // Add table rows
    pageRows.forEach((row, rowIdx) => {
      const y = 110 + (rowIdx * 8);
      pageSchemas.push(
        { name: `item${pageIdx}_${rowIdx}`, type: 'text', position: { x: 17, y }, width: 45, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: row[0] },
        { name: `category${pageIdx}_${rowIdx}`, type: 'text', position: { x: 67, y }, width: 35, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: row[1] },
        { name: `quantity${pageIdx}_${rowIdx}`, type: 'text', position: { x: 107, y }, width: 25, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right', content: row[2] },
        { name: `unitPrice${pageIdx}_${rowIdx}`, type: 'text', position: { x: 137, y }, width: 30, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right', content: row[3] },
        { name: `value${pageIdx}_${rowIdx}`, type: 'text', position: { x: 172, y }, width: 23, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right', content: row[4] }
      );
    });

    // Add footer elements on last page
    if (pageIdx === pages - 1) {
      pageSchemas.push(
        { name: 'summaryContent', type: 'text', position: { x: 15, y: 250 }, width: 120, height: 40, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.summary },
        { name: 'totalValue', type: 'text', position: { x: 165, y: 265 }, width: 33, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right', content: formatCurrency(mergedData.totalValue) },
        { name: 'preparedByLabel', type: 'text', position: { x: 15, y: 280 }, width: 30, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.preparedBy },
        { name: 'approvedByLabel', type: 'text', position: { x: 120, y: 280 }, width: 30, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.approvedBy }
      );
    }

    allSchemas.push(pageSchemas);
  }

  return {
    template: {
      basePdf: inventoryReportTemplate.basePdf,
      schemas: allSchemas
    },
    inputs: [{}]
  };
};

// Generate Client Report PDF
const generateClientReportPDF = async (data: ClientReportData) => {
  const mergedData = { ...defaultReportValues, ...data };
  
  // Transform items to table row format
  const tableRows = mergedData.items.map((item, idx) => [
    item.client,
    formatCurrency(item.sales),
    formatCurrency(item.payments),
    formatCurrency(item.balance),
    item.status
  ]);

  const totalRows = tableRows.length;
  const rowsPerPage = 20;
  const pages = Math.ceil(totalRows / rowsPerPage);

  const allSchemas = [];
  
  for (let pageIdx = 0; pageIdx < pages; pageIdx++) {
    const pageSchemas = [...clientReportTemplate.schemas[0]];
    const startRow = pageIdx * rowsPerPage;
    const endRow = Math.min(startRow + rowsPerPage, totalRows);
    const pageRows = tableRows.slice(startRow, endRow);

    if (pageIdx === 0) {
      pageSchemas.push(
        { name: 'companyLogo', type: 'image', position: { x: 15, y: 5 }, width: 38, height: 38, content: mergedData.companyLogo || '' },
        { name: 'companyName', type: 'text', position: { x: 60, y: 11 }, width: 140, height: 14, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'left', content: mergedData.companyName },
        { name: 'reportTitle', type: 'text', position: { x: 0, y: 50 }, width: 210, height: 12, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'center', content: mergedData.reportTitle },
        { name: 'reportDate', type: 'text', position: { x: 47, y: 67 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.reportDate },
        { name: 'reportPeriod', type: 'text', position: { x: 47, y: 73 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.reportPeriod },
        { name: 'reportType', type: 'text', position: { x: 47, y: 79 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.reportType },
        { name: 'reportGenerated', type: 'text', position: { x: 47, y: 85 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.reportGenerated },
        { name: 'reportNumber', type: 'text', position: { x: 13, y: 67 }, width: 180, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right', content: mergedData.reportNumber }
      );
    }

    // Add table rows
    pageRows.forEach((row, rowIdx) => {
      const y = 110 + (rowIdx * 8);
      pageSchemas.push(
        { name: `client${pageIdx}_${rowIdx}`, type: 'text', position: { x: 17, y }, width: 50, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: row[0] },
        { name: `sales${pageIdx}_${rowIdx}`, type: 'text', position: { x: 72, y }, width: 35, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right', content: row[1] },
        { name: `payments${pageIdx}_${rowIdx}`, type: 'text', position: { x: 112, y }, width: 35, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right', content: row[2] },
        { name: `balance${pageIdx}_${rowIdx}`, type: 'text', position: { x: 152, y }, width: 35, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right', content: row[3] },
        { name: `status${pageIdx}_${rowIdx}`, type: 'text', position: { x: 192, y }, width: 3, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'center', content: row[4] }
      );
    });

    // Add footer elements on last page
    if (pageIdx === pages - 1) {
      pageSchemas.push(
        { name: 'summaryContent', type: 'text', position: { x: 15, y: 250 }, width: 120, height: 40, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.summary },
        { name: 'totalValue', type: 'text', position: { x: 165, y: 265 }, width: 33, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right', content: formatCurrency(mergedData.totalBalance) },
        { name: 'preparedByLabel', type: 'text', position: { x: 15, y: 280 }, width: 30, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.preparedBy },
        { name: 'approvedByLabel', type: 'text', position: { x: 120, y: 280 }, width: 30, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: mergedData.approvedBy }
      );
    }

    allSchemas.push(pageSchemas);
  }

  return {
    template: {
      basePdf: clientReportTemplate.basePdf,
      schemas: allSchemas
    },
    inputs: [{}]
  };
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
  generateSalesReportPDF,
  generateExpenseReportPDF,
  generateInventoryReportPDF,
  generateClientReportPDF,
  generateFinancialReportPDF
};
