export const quotationTemplate = {
  basePdf: {
    width: 210,
    height: 297,
    padding: [0, 0, 0, 0] as [number, number, number, number],
  },
  schemas: [
    [
      { name: 'logo', type: 'image', position: { x: 15, y: 5 }, width: 38, height: 38 },
      { name: 'companyName', type: 'text', position: { x: 60, y: 11 }, width: 140, height: 10, fontSize: 16, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'left', fontWeight: 'bold', characterSpacing: 0.5 },
      { name: 'companyLocation', type: 'text', position: { x: 60, y: 21 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'companyPhone', type: 'text', position: { x: 60, y: 27 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'companyEmail', type: 'text', position: { x: 60, y: 33 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'quotationHeaderBg', type: 'rectangle', position: { x: 15, y: 47 }, width: 180, height: 14, color: '#E5E5E5', radius: 5 },
      { name: 'quotationTitle', type: 'text', position: { x: 0, y: 50 }, width: 210, height: 12, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'center', fontWeight: 'bold' },
      { name: 'clientInfoBox', type: 'rectangle', position: { x: 15, y: 64 }, width: 60, height: 28, color: '#E5E5E5', radius: 4 },
      { name: 'clientNamesLabel', type: 'text', position: { x: 18, y: 67 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'clientNamesValue', type: 'text', position: { x: 41, y: 67 }, width: 32, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'siteLocationLabel', type: 'text', position: { x: 18, y: 73 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'siteLocationValue', type: 'text', position: { x: 41, y: 73 }, width: 32, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'mobileNoLabel', type: 'text', position: { x: 18, y: 79 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'mobileNoValue', type: 'text', position: { x: 41, y: 79 }, width: 32, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'dateLabel', type: 'text', position: { x: 18, y: 85 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'dateValue', type: 'text', position: { x: 41, y: 85 }, width: 32, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'quotationNoFull', type: 'text', position: { x: 15, y: 67 }, width: 180, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'tableHeaderBg', type: 'rectangle', position: { x: 15, y: 99 }, width: 180, height: 10, color: '#E5E5E5', radius: 3 },
      // Table header with Item number column
      { name: 'itemHeader', type: 'text', position: { x: 17, y: 102 }, width: 12, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Item' },
      { name: 'descriptionHeader', type: 'text', position: { x: 29, y: 102 }, width: 68, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Description' },
      { name: 'unitHeader', type: 'text', position: { x: 97, y: 102 }, width: 20, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Unit' },
      { name: 'quantityHeader', type: 'text', position: { x: 117, y: 102 }, width: 20, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Qty' },
      { name: 'unitPriceHeader', type: 'text', position: { x: 137, y: 102 }, width: 30, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Unit Price' },
      { name: 'totalHeader', type: 'text', position: { x: 167, y: 102 }, width: 28, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Total' },
      // NOTE: When generating table rows, map as [itemNumber, description, unit, quantity, unitPrice, total]
      { name: 'termsTitle', type: 'text', position: { x: 15, y: 245 }, width: 60, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'termsContent', type: 'text', position: { x: 15, y: 250 }, width: 120, height: 20, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'totalsBox', type: 'rectangle', position: { x: 150, y: 245 }, width: 45, height: 24, color: '#E5E5E5', radius: 4 },
      { name: 'subtotalLabel', type: 'text', position: { x: 152, y: 249 }, width: 20, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'subtotalValue', type: 'text', position: { x: 175, y: 249 }, width: 18, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'vatLabel', type: 'text', position: { x: 152, y: 257 }, width: 20, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'vatValue', type: 'text', position: { x: 175, y: 257 }, width: 18, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'totalLabel', type: 'text', position: { x: 152, y: 265 }, width: 20, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'totalValue', type: 'text', position: { x: 175, y: 265 }, width: 18, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
      { name: 'preparedByLabel', type: 'text', position: { x: 15, y: 280 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'preparedByLine', type: 'line', position: { x: 35, y: 283 }, width: 60, height: 0, color: '#000' },
      { name: 'approvedByLabel', type: 'text', position: { x: 120, y: 280 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'approvedByLine', type: 'line', position: { x: 145, y: 283 }, width: 60, height: 0, color: '#000' },
      { name: 'watermarkLogo', type: 'image', position: { x: 60, y: 135 }, width: 90, height: 90 },
    ]
  ]
};

// Define the input data structure
export interface QuotationData {
  // Company Information
  companyName: string;
  companyLocation: string;
  companyPhone: string;
  companyEmail: string;
  companyLogo?: string; // Base64 image data
  
  // Client Information
  clientNames: string;
  siteLocation: string;
  mobileNo: string;
  date: string;
  
  // Quotation Details
  deliveryNoteNo: string;
  quotationNumber: string;
  
  // Items (dynamic array)
  items: Array<{
    quantity: number;
    unit: string;
    description: string;
    unitPrice: number;
    total: number;
  }>;
  
  // Totals
  subtotal: number;
  vat: number;
  total: number;
  
  // Terms and Conditions
  terms: {
    term1: string;
    term2: string;
    term3: string;
    term4: string;
  };
  
  // Signatures
  preparedBy: string;
  approvedBy: string;
  watermarkLogo?: string; // Base64 image data for watermark
}

// Default values for the template
export const defaultValues: QuotationData = {
  companyName: "CABINET MASTER STYLES & FINISHES",
  companyLocation: "Location: Ruiru Eastern By-Pass",
  companyPhone: "Tel: +254729554475",
  companyEmail: "Email: cabinetmasterstyles@gmail.com",
  
  clientNames: "",
  siteLocation: "",
  mobileNo: "",
  date: "",
  
  deliveryNoteNo: "Delivery Note No.",
  quotationNumber: "",
  
  items: [],
  
  subtotal: 0,
  vat: 0,
  total: 0,
  
  terms: {
    term1: "1. Please NOTE, the above prices are subject to changes incase of VARIATION",
    term2: "   in quantity or specifications and market rates.",
    term3: "2. Material cost is payable either directly to the supplying company or through our Pay Bill No. below",
    term4: "3. DESIGN and LABOUR COST must be paid through our Pay Bill No. below PAYBILL NUMBER: 400200 ACCOUNT NUMBER: 845763"
  },
  
  preparedBy: "",
  approvedBy: "",
  watermarkLogo: ""
};

// Function to convert image to base64
export const imageToBase64 = async (imagePath: string): Promise<string> => {
  try {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return '';
  }
};

// Function to generate PDF with dynamic content
export const generateQuotationPDF = async (data: QuotationData) => {
  // Layout constants (in mm)
  const pageHeight = 297;
  const topMargin = 20;
  const bottomMargin = 15;
  const headerHeight = 60; // header block (first page only)
  const tableHeaderHeight = 10;
  const footerHeight = 40; // footer block (last page only)
  const rowHeight = 8;
  const firstPageTableStartY = 101; // adjusted so 23 rows fit on first page

  // Merge default values with provided data
  const mergedData = { ...defaultValues, ...data };

  // Transform items to table row format for the template
  const tableRows: string[][] = (mergedData.items || []).map((item, idx) => [
    String(idx + 1),
    String(item.description),
    String(item.unit),
    String(item.quantity),
    String(item.unitPrice),
    String(item.total)
  ]);

  // Calculate rows per page
  const firstPageAvailable = pageHeight - topMargin - headerHeight - tableHeaderHeight - bottomMargin - footerHeight;
  const otherPageAvailable = pageHeight - topMargin - tableHeaderHeight - bottomMargin;
  const firstPageRows = Math.floor(firstPageAvailable / rowHeight);
  const otherPageRows = Math.floor(otherPageAvailable / rowHeight);

  // Paginate rows
  const pages: string[][][] = [];
  let rowIndex = 0;
  // First page
  pages.push(tableRows.slice(0, firstPageRows));
  rowIndex += firstPageRows;
  // Subsequent pages
  while (rowIndex < tableRows.length) {
    pages.push(tableRows.slice(rowIndex, rowIndex + otherPageRows));
    rowIndex += otherPageRows;
  }

  // Build schemas for all pages
  let schemas: any[][] = [];
  let currentY;
  pages.forEach((rows: string[][], pageIdx: number) => {
    let pageSchemas: any[] = [];
    // Header (first page only)
    if (pageIdx === 0) {
      pageSchemas.push(...quotationTemplate.schemas[0].filter(s => [
        'logo','companyName','companyLocation','companyPhone','companyEmail','quotationHeaderBg','quotationTitle','clientInfoBox','clientNamesLabel','clientNamesValue','siteLocationLabel','siteLocationValue','mobileNoLabel','mobileNoValue','dateLabel','dateValue','quotationNoFull'
      ].includes(s.name)));
    }
    // Table header (every page)
    const tableHeaderY = (pageIdx === 0) ? firstPageTableStartY : topMargin;
    pageSchemas.push(...quotationTemplate.schemas[0].filter(s => [
      'tableHeaderBg','itemHeader','descriptionHeader','unitHeader','quantityHeader','unitPriceHeader','totalHeader'
    ].includes(s.name)).map(s => ({ ...s, position: { ...s.position, y: tableHeaderY + (s.position.y - 105) }})));
    // Table rows
    rows.forEach((row: string[], rowIdx: number) => {
      const y = tableHeaderY + tableHeaderHeight + rowIdx * rowHeight;
      pageSchemas.push({ name: `item${pageIdx}_${rowIdx}`, type: 'text', position: { x: 17, y }, width: 12, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'center', content: row[0] });
      pageSchemas.push({ name: `desc${pageIdx}_${rowIdx}`, type: 'text', position: { x: 29, y }, width: 68, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: row[1] });
      pageSchemas.push({ name: `unit${pageIdx}_${rowIdx}`, type: 'text', position: { x: 97, y }, width: 20, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'center', content: row[2] });
      pageSchemas.push({ name: `qty${pageIdx}_${rowIdx}`, type: 'text', position: { x: 117, y }, width: 20, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'center', content: row[3] });
      pageSchemas.push({ name: `unitPrice${pageIdx}_${rowIdx}`, type: 'text', position: { x: 137, y }, width: 30, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right', content: row[4] });
      pageSchemas.push({ name: `total${pageIdx}_${rowIdx}`, type: 'text', position: { x: 167, y }, width: 28, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'right', content: row[5] });
    });
    // Footer (last page only)
    if (pageIdx === pages.length - 1) {
      // Place footer at the bottom of the page
      const footerY = pageHeight - bottomMargin - footerHeight;
      pageSchemas.push(...quotationTemplate.schemas[0].filter(s => [
        'termsTitle','termsContent','totalsBox','subtotalLabel','subtotalValue','vatLabel','vatValue','totalLabel','totalValue','preparedByLabel','preparedByLine','approvedByLabel','approvedByLine'
      ].includes(s.name)).map(s => ({ ...s, position: { ...s.position, y: footerY + (s.position.y - 245) }})));
    }
    schemas.push(pageSchemas);
  });

  // Build dynamic row values for inputs
  const dynamicRowInputs: Record<string, string> = {};
  pages.forEach((rows: string[][], pageIdx: number) => {
    rows.forEach((row: string[], rowIdx: number) => {
      dynamicRowInputs[`item${pageIdx}_${rowIdx}`] = row[0];
      dynamicRowInputs[`desc${pageIdx}_${rowIdx}`] = row[1];
      dynamicRowInputs[`unit${pageIdx}_${rowIdx}`] = row[2];
      dynamicRowInputs[`qty${pageIdx}_${rowIdx}`] = row[3];
      dynamicRowInputs[`unitPrice${pageIdx}_${rowIdx}`] = row[4];
      dynamicRowInputs[`total${pageIdx}_${rowIdx}`] = row[5];
    });
  });

  // Create input values for the template
  const inputs = [
    {
      companyName: mergedData.companyName,
      companyLocation: mergedData.companyLocation,
      companyPhone: mergedData.companyPhone,
      companyEmail: mergedData.companyEmail,
      companyLogo: mergedData.companyLogo,
      watermarkLogo: mergedData.watermarkLogo,
      logo: mergedData.companyLogo,
      clientNamesLabel: "CLIENT NAME:",
      clientNamesValue: mergedData.clientNames,
      siteLocationLabel: "SITE LOCATION:",
      siteLocationValue: mergedData.siteLocation,
      mobileNoLabel: "MOBILE NO.:",
      mobileNoValue: mergedData.mobileNo,
      dateLabel: "DATE:",
      dateValue: mergedData.date,
      quotationTitle: "QUOTATION",
      deliveryNoteLabel: mergedData.deliveryNoteNo,
      quotationNoFull: `Quotation No: ${mergedData.quotationNumber}`,
      itemHeader: "Item",
      quantityHeader: "Quantity",
      unitHeader: "Unit",
      descriptionHeader: "Description",
      unitPriceHeader: "Unit Price",
      totalHeader: "Total",
      subtotalLabel: "Sub Total:",
      subtotalValue: `KES ${mergedData.subtotal.toFixed(2)}`,
      vatLabel: "V.A.T:",
      vatValue: `KES ${mergedData.vat.toFixed(2)}`,
      totalLabel: "Total:",
      totalValue: `KES ${mergedData.total.toFixed(2)}`,
      termsTitle: "TERMS AND CONDITIONS:",
      termsContent: mergedData.terms.term1 + "\n" + mergedData.terms.term2 + "\n" + mergedData.terms.term3 + "\n" + mergedData.terms.term4,
      preparedByLabel: "Prepared by:",
      approvedByLabel: "Approved by:",
      ...dynamicRowInputs
    }
  ];

  return {
    template: {
      ...quotationTemplate,
      schemas
    },
    inputs
  };
}; 