// Dynamic Report PDF Generator - Fully dynamic and responsive templates
// Supports both Portrait and Landscape orientations
// Uses @pdfme/generator with proper data binding

export type ReportOrientation = 'portrait' | 'landscape';

export interface ReportColumn {
  key: string;
  label: string;
  width: number; // percentage width
  align: 'left' | 'center' | 'right';
}

export interface ReportData {
  title: string;
  subtitle?: string;
  period: string;
  generatedDate: string;
  columns: ReportColumn[];
  rows: Record<string, any>[];
  totals?: Record<string, number>;
  summary?: string;
}

// Page dimensions (in mm)
const PAGE_PORTRAIT = { width: 210, height: 297 };
const PAGE_LANDSCAPE = { width: 297, height: 210 };

// Margins
const MARGIN = { left: 10, right: 10, top: 10, bottom: 15 };

// Row settings
const HEADER_HEIGHT = 8;
const ROW_HEIGHT = 6;
const FONT_SIZE_HEADER = 9;
const FONT_SIZE_ROW = 8;

// Maximum rows per page
const MAX_ROWS_FIRST_PAGE_PORTRAIT = 25;
const MAX_ROWS_OTHER_PAGE_PORTRAIT = 35;
const MAX_ROWS_FIRST_PAGE_LANDSCAPE = 15;
const MAX_ROWS_OTHER_PAGE_LANDSCAPE = 22;

// Calculate rows per page
const getRowsPerPage = (orientation: ReportOrientation, isFirstPage: boolean) => {
  if (orientation === 'landscape') {
    return isFirstPage ? MAX_ROWS_FIRST_PAGE_LANDSCAPE : MAX_ROWS_OTHER_PAGE_LANDSCAPE;
  }
  return isFirstPage ? MAX_ROWS_FIRST_PAGE_PORTRAIT : MAX_ROWS_OTHER_PAGE_PORTRAIT;
};

// Calculate column positions based on percentage widths
const calculateColumnPositions = (columns: ReportColumn[], orientation: ReportOrientation) => {
  const page = orientation === 'landscape' ? PAGE_LANDSCAPE : PAGE_PORTRAIT;
  const tableWidth = page.width - MARGIN.left - MARGIN.right;
  
  let currentX = MARGIN.left;
  return columns.map(col => {
    const width = (col.width / 100) * tableWidth;
    const position = { x: currentX, width };
    currentX += width;
    return position;
  });
};

// Calculate pagination - returns array of row indices for each page
const calculatePagination = (totalRows: number, orientation: ReportOrientation): number[][] => {
  const pages: number[][] = [];
  let rowIndex = 0;
  let pageNum = 0;
  
  while (rowIndex < totalRows) {
    const rowsForThisPage = getRowsPerPage(orientation, pageNum === 0);
    const remainingRows = totalRows - rowIndex;
    const rowCount = Math.min(rowsForThisPage, remainingRows);
    
    if (rowCount > 0) {
      pages.push(Array.from({ length: rowCount }, (_, i) => rowIndex + i));
    }
    
    rowIndex += rowCount;
    pageNum++;
  }
  
  // Ensure at least one page even if no data
  if (pages.length === 0) {
    pages.push([]);
  }
  
  return pages;
};

// Generate page schema for a specific page
const generatePageSchema = (
  data: ReportData,
  pageIdx: number,
  rowCount: number,
  isFirstPage: boolean,
  isLastPage: boolean,
  orientation: ReportOrientation
): any[] => {
  const page = orientation === 'landscape' ? PAGE_LANDSCAPE : PAGE_PORTRAIT;
  const columnPositions = calculateColumnPositions(data.columns, orientation);
  const pageSchema: any[] = [];
  
  // Watermark
  pageSchema.push({
    name: 'watermark',
    type: 'image',
    position: { 
      x: (page.width - 80) / 2, 
      y: (page.height - 80) / 2 
    },
    width: 80,
    height: 80,
    opacity: 0.08
  });
  
  let currentY = MARGIN.top;
  
  if (isFirstPage) {
    // Company Header
    pageSchema.push(
      { name: 'logo', type: 'image', position: { x: MARGIN.left, y: currentY }, width: 35, height: 35 },
      { name: 'companyName', type: 'text', position: { x: MARGIN.left + 40, y: currentY + 5 }, width: 150, height: 10, fontSize: 16, fontColor: '#B06A2B', alignment: 'left' },
      { name: 'companyAddress', type: 'text', position: { x: MARGIN.left + 40, y: currentY + 15 }, width: 150, height: 6, fontSize: 9, fontColor: '#333333', alignment: 'left' },
      { name: 'companyContact', type: 'text', position: { x: MARGIN.left + 40, y: currentY + 21 }, width: 150, height: 6, fontSize: 9, fontColor: '#333333', alignment: 'left' }
    );
    currentY += 38;
    
    // Report Title Bar
    pageSchema.push(
      { name: 'titleBar', type: 'rectangle', position: { x: MARGIN.left, y: currentY }, width: page.width - MARGIN.left - MARGIN.right, height: 12, color: '#E8E8E8', borderRadius: 3 },
      { name: 'reportTitle', type: 'text', position: { x: MARGIN.left, y: currentY + 2 }, width: page.width - MARGIN.left - MARGIN.right, height: 10, fontSize: 14, fontColor: '#B06A2B', alignment: 'center' }
    );
    currentY += 15;
    
    // Report Info
    pageSchema.push(
      { name: 'reportPeriod', type: 'text', position: { x: MARGIN.left, y: currentY }, width: 100, height: 5, fontSize: 9, fontColor: '#666666', alignment: 'left' },
      { name: 'reportDate', type: 'text', position: { x: page.width - MARGIN.right - 80, y: currentY }, width: 80, height: 5, fontSize: 9, fontColor: '#666666', alignment: 'right' }
    );
    currentY += 10;
  } else {
    // Continuation header
    pageSchema.push(
      { name: 'pageTitle', type: 'text', position: { x: MARGIN.left, y: currentY }, width: page.width - MARGIN.left - MARGIN.right, height: 8, fontSize: 10, fontColor: '#666666', alignment: 'center' }
    );
    currentY += 12;
  }
  
  // Table Header Background
  pageSchema.push({
    name: 'tableHeaderBg',
    type: 'rectangle',
    position: { x: MARGIN.left, y: currentY },
    width: page.width - MARGIN.left - MARGIN.right,
    height: HEADER_HEIGHT,
    color: '#E8E8E8',
    borderRadius: 2
  });
  
  // Table Headers
  data.columns.forEach((col, colIdx) => {
    pageSchema.push({
      name: `header_${colIdx}`,
      type: 'text',
      position: { x: columnPositions[colIdx].x, y: currentY + 1.5 },
      width: columnPositions[colIdx].width,
      height: HEADER_HEIGHT - 2,
      fontSize: FONT_SIZE_HEADER,
      fontColor: '#000000',
      alignment: col.align
    });
  });
  
  currentY += HEADER_HEIGHT;
  
  // Data Rows
  for (let localIdx = 0; localIdx < rowCount; localIdx++) {
    const rowY = currentY + (localIdx * ROW_HEIGHT);
    
    // Alternating row background
    if (localIdx % 2 === 1) {
      pageSchema.push({
        name: `rowBg_${localIdx}`,
        type: 'rectangle',
        position: { x: MARGIN.left, y: rowY },
        width: page.width - MARGIN.left - MARGIN.right,
        height: ROW_HEIGHT,
        color: '#F8F8F8'
      });
    }
    
    // Row data cells
    data.columns.forEach((col, colIdx) => {
      pageSchema.push({
        name: `cell_${localIdx}_${colIdx}`,
        type: 'text',
        position: { x: columnPositions[colIdx].x, y: rowY + 1 },
        width: columnPositions[colIdx].width,
        height: ROW_HEIGHT - 1,
        fontSize: FONT_SIZE_ROW,
        fontColor: '#333333',
        alignment: col.align
      });
    });
  }
  
  // Footer (last page only)
  if (isLastPage) {
    const footerY = page.height - MARGIN.bottom - 30;
    
    // Totals row
    if (data.totals) {
      pageSchema.push({
        name: 'totalsBg',
        type: 'rectangle',
        position: { x: MARGIN.left, y: footerY - 8 },
        width: page.width - MARGIN.left - MARGIN.right,
        height: HEADER_HEIGHT,
        color: '#E8E8E8',
        borderRadius: 2
      });
      
      data.columns.forEach((col, colIdx) => {
        pageSchema.push({
          name: `total_${colIdx}`,
          type: 'text',
          position: { x: columnPositions[colIdx].x, y: footerY - 6 },
          width: columnPositions[colIdx].width,
          height: HEADER_HEIGHT - 2,
          fontSize: FONT_SIZE_HEADER,
          fontColor: '#000000',
          alignment: col.align
        });
      });
    }
    
    // Summary and signatures
    pageSchema.push(
      { name: 'summary', type: 'text', position: { x: MARGIN.left, y: footerY + 5 }, width: 120, height: 20, fontSize: 8, fontColor: '#666666', alignment: 'left' },
      { name: 'preparedBy', type: 'text', position: { x: MARGIN.left, y: footerY + 20 }, width: 60, height: 5, fontSize: 8, fontColor: '#333333', alignment: 'left' },
      { name: 'approvedBy', type: 'text', position: { x: page.width - MARGIN.right - 70, y: footerY + 20 }, width: 70, height: 5, fontSize: 8, fontColor: '#333333', alignment: 'right' }
    );
  }
  
  // Page number
  pageSchema.push({
    name: 'pageNumber',
    type: 'text',
    position: { x: page.width / 2 - 20, y: page.height - MARGIN.bottom },
    width: 40,
    height: 5,
    fontSize: 8,
    fontColor: '#999999',
    alignment: 'center'
  });
  
  return pageSchema;
};

// Generate inputs for a specific page
const generatePageInputs = (
  data: ReportData,
  pageIdx: number,
  rowIndices: number[],
  totalPages: number,
  isFirstPage: boolean,
  isLastPage: boolean,
  logoBase64: string,
  watermarkBase64: string
): Record<string, any> => {
  const pageInput: Record<string, any> = {};
  
  // Watermark
  pageInput.watermark = watermarkBase64;
  
  if (isFirstPage) {
    // Company info
    pageInput.logo = logoBase64;
    pageInput.companyName = 'CABINET MASTER STYLES & FINISHES';
    pageInput.companyAddress = 'Location: Ruiru Eastern By-Pass';
    pageInput.companyContact = 'Tel: +254729554475 | Email: cabinetmasterstyles@gmail.com';
    
    // Report info
    pageInput.reportTitle = data.title;
    pageInput.reportPeriod = `Period: ${data.period}`;
    pageInput.reportDate = `Generated: ${data.generatedDate}`;
  } else {
    pageInput.pageTitle = `${data.title} (Continued)`;
  }
  
  // Table headers
  data.columns.forEach((col, colIdx) => {
    pageInput[`header_${colIdx}`] = col.label;
  });
  
  // Data rows
  rowIndices.forEach((rowIdx, localIdx) => {
    const row = data.rows[rowIdx];
    if (row) {
      data.columns.forEach((col, colIdx) => {
        let value = row[col.key];
        // Format numbers as currency if it's an amount column
        if (typeof value === 'number' && value !== null) {
          if (col.key.includes('amount') || col.key.includes('total') || col.key.includes('value') || col.key.includes('balance') || col.key.includes('debit') || col.key.includes('credit')) {
            value = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(value);
          } else {
            value = value.toString();
          }
        }
        pageInput[`cell_${localIdx}_${colIdx}`] = value !== null && value !== undefined ? String(value) : '';
      });
    }
  });
  
  // Totals
  if (isLastPage && data.totals) {
    data.columns.forEach((col, colIdx) => {
      const totalValue = data.totals?.[col.key];
      if (totalValue !== undefined) {
        pageInput[`total_${colIdx}`] = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(totalValue);
      } else if (colIdx === 0) {
        pageInput[`total_${colIdx}`] = 'TOTAL';
      } else {
        pageInput[`total_${colIdx}`] = '';
      }
    });
  }
  
  // Summary and signatures
  if (isLastPage) {
    pageInput.summary = data.summary || `Total Records: ${data.rows.length}`;
    pageInput.preparedBy = 'Prepared by: ____________';
    pageInput.approvedBy = 'Approved by: ____________';
  }
  
  // Page number
  pageInput.pageNumber = `Page ${pageIdx + 1} of ${totalPages}`;
  
  return pageInput;
};

// Helper to fetch image as base64
export const fetchImageAsBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to fetch image:', error);
    // Return a transparent 1x1 pixel as fallback
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }
};

// Main function to generate and download PDF
export const generateReportPDF = async (
  data: ReportData,
  orientation: ReportOrientation = 'portrait',
  filename: string = 'report'
) => {
  try {
    // Fetch images
    const [logoBase64, watermarkBase64] = await Promise.all([
      fetchImageAsBase64('/logowatermark.png'),
      fetchImageAsBase64('/logowatermark.png')
    ]);
    
    const page = orientation === 'landscape' ? PAGE_LANDSCAPE : PAGE_PORTRAIT;
    
    // Calculate pagination
    const pages = calculatePagination(data.rows.length, orientation);
    const totalPages = pages.length;
    
    // Generate schemas and inputs for each page
    const schemas: any[][] = [];
    const inputs: Record<string, any>[] = [];
    
    pages.forEach((rowIndices, pageIdx) => {
      const isFirstPage = pageIdx === 0;
      const isLastPage = pageIdx === totalPages - 1;
      const rowCount = rowIndices.length;
      
      // Generate schema for this page
      const pageSchema = generatePageSchema(data, pageIdx, rowCount, isFirstPage, isLastPage, orientation);
      schemas.push(pageSchema);
      
      // Generate inputs for this page
      const pageInputs = generatePageInputs(data, pageIdx, rowIndices, totalPages, isFirstPage, isLastPage, logoBase64, watermarkBase64);
      inputs.push(pageInputs);
    });
    
    // Create the template
    const template = {
      basePdf: {
        width: page.width,
        height: page.height,
        padding: [0, 0, 0, 0] as [number, number, number, number]
      },
      schemas
    };
    
    // Import pdfme
    const { generate } = await import('@pdfme/generator');
    const pdfSchemas = await import('@pdfme/schemas');
    
    // Generate PDF
    const pdf = await generate({
      template: template as any,
      inputs: inputs as any,
      plugins: { 
        text: pdfSchemas.text, 
        rectangle: pdfSchemas.rectangle, 
        image: pdfSchemas.image 
      } as any
    });
    
    // Download
    const blob = new Blob([pdf.buffer as ArrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
};

// Predefined column configurations for different report types
export const REPORT_COLUMNS = {
  expenses: [
    { key: 'date', label: 'Date', width: 12, align: 'left' as const },
    { key: 'expense_number', label: 'Exp #', width: 12, align: 'left' as const },
    { key: 'category', label: 'Category', width: 15, align: 'left' as const },
    { key: 'description', label: 'Description', width: 25, align: 'left' as const },
    { key: 'expense_type', label: 'Type', width: 10, align: 'center' as const },
    { key: 'client_name', label: 'Client', width: 14, align: 'left' as const },
    { key: 'amount', label: 'Amount', width: 12, align: 'right' as const }
  ],
  sales: [
    { key: 'date', label: 'Date', width: 12, align: 'left' as const },
    { key: 'type', label: 'Type', width: 12, align: 'left' as const },
    { key: 'reference', label: 'Reference', width: 15, align: 'left' as const },
    { key: 'client', label: 'Client', width: 25, align: 'left' as const },
    { key: 'status', label: 'Status', width: 12, align: 'center' as const },
    { key: 'amount', label: 'Amount', width: 14, align: 'right' as const }
  ],
  inventory: [
    { key: 'name', label: 'Item Name', width: 25, align: 'left' as const },
    { key: 'category', label: 'Category', width: 15, align: 'left' as const },
    { key: 'quantity', label: 'Qty', width: 10, align: 'right' as const },
    { key: 'unit', label: 'Unit', width: 10, align: 'center' as const },
    { key: 'unit_price', label: 'Unit Price', width: 15, align: 'right' as const },
    { key: 'value', label: 'Total Value', width: 15, align: 'right' as const },
    { key: 'status', label: 'Status', width: 10, align: 'center' as const }
  ],
  clients: [
    { key: 'name', label: 'Client Name', width: 20, align: 'left' as const },
    { key: 'phone', label: 'Phone', width: 12, align: 'left' as const },
    { key: 'location', label: 'Location', width: 15, align: 'left' as const },
    { key: 'total_orders', label: 'Orders', width: 13, align: 'right' as const },
    { key: 'total_payments', label: 'Paid', width: 13, align: 'right' as const },
    { key: 'total_expenses', label: 'Expenses', width: 13, align: 'right' as const },
    { key: 'balance', label: 'Balance', width: 14, align: 'right' as const }
  ],
  financial: [
    { key: 'account', label: 'Account', width: 40, align: 'left' as const },
    { key: 'type', label: 'Type', width: 15, align: 'center' as const },
    { key: 'amount', label: 'Amount (KES)', width: 25, align: 'right' as const },
    { key: 'percentage', label: '% of Revenue', width: 20, align: 'right' as const }
  ],
  cashBook: [
    { key: 'date', label: 'Date', width: 12, align: 'left' as const },
    { key: 'reference', label: 'Ref #', width: 12, align: 'left' as const },
    { key: 'description', label: 'Description', width: 30, align: 'left' as const },
    { key: 'account', label: 'Account', width: 12, align: 'center' as const },
    { key: 'debit', label: 'Debit (Dr)', width: 12, align: 'right' as const },
    { key: 'credit', label: 'Credit (Cr)', width: 12, align: 'right' as const },
    { key: 'balance', label: 'Balance', width: 10, align: 'right' as const }
  ]
};
