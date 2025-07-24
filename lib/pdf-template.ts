export const quotationTemplate = {
  basePdf: {
    width: 210,
    height: 297,
    padding: [0, 0, 0, 0] as [number, number, number, number],
  },
  schemas: [
    [
      { name: 'logo', type: 'image', position: { x: 15, y: 5 }, width: 38, height: 38 },
      { name: 'companyName', type: 'text', position: { x: 60, y: 11 }, width: 140, height: 14, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'left', fontWeight: 'Extra Bold', characterSpacing: 0.5 },
      { name: 'companyLocation', type: 'text', position: { x: 60, y: 21 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'companyPhone', type: 'text', position: { x: 60, y: 27 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'companyEmail', type: 'text', position: { x: 60, y: 33 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'quotationHeaderBg', type: 'rectangle', position: { x: 15, y: 47 }, width: 180, height: 14, color: '#E5E5E5', radius: 5 },
      { name: 'quotationTitle', type: 'text', position: { x: 0, y: 50 }, width: 210, height: 12, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'center', fontWeight: 'bold' },
      { name: 'clientInfoBox', type: 'rectangle', position: { x: 15, y: 64 }, width: 62, height: 28, color: '#E5E5E5', radius: 4 },
      { name: 'clientNamesLabel', type: 'text', position: { x: 18, y: 67 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'clientNamesValue', type: 'text', position: { x: 47, y: 67 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'siteLocationLabel', type: 'text', position: { x: 18, y: 73 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'siteLocationValue', type: 'text', position: { x: 47, y: 73 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'mobileNoLabel', type: 'text', position: { x: 18, y: 79 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'mobileNoValue', type: 'text', position: { x: 47, y: 79 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'dateLabel', type: 'text', position: { x: 18, y: 85 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'dateValue', type: 'text', position: { x: 47, y: 85 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'quotationNoFull', type: 'text', position: { x: 13, y: 67 }, width: 180, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'tableHeaderBg', type: 'rectangle', position: { x: 15, y: 99 }, width: 180, height: 10, color: '#E5E5E5', radius: 3 },
      // Table header with Item number column
      { name: 'itemHeader', type: 'text', position: { x: 17, y: 102 }, width: 12, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Item' },
      { name: 'descriptionHeader', type: 'text', position: { x: 24, y: 102 }, width: 68, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Description' },
      { name: 'unitHeader', type: 'text', position: { x: 97, y: 102 }, width: 20, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Unit' },
      { name: 'quantityHeader', type: 'text', position: { x: 117, y: 102 }, width: 20, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Qty' },
      { name: 'unitPriceHeader', type: 'text', position: { x: 145, y: 102 }, width: 30, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Unit Price' },
      { name: 'totalHeader', type: 'text', position: { x: 173, y: 102 }, width: 28, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Total' },
      // NOTE: When generating table rows, map as [itemNumber, description, unit, quantity, unitPrice, total]
      { name: 'termsTitle', type: 'text', position: { x: 15, y: 245 }, width: 60, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'termsContent', type: 'text', position: { x: 15, y: 250 }, width: 120, height: 40, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'totalsBox', type: 'rectangle', position: { x: 144, y: 245 }, width: 52, height:27, color: '#E5E5E5', radius: 4 },
      { name: 'subtotalLabel', type: 'text', position: { x: 146, y: 249 }, width: 25, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'subtotalValue', type: 'text', position: { x:  157, y: 249 }, width: 35, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'vatLabel', type: 'text', position: { x: 146, y: 257 }, width: 25, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'vatValue', type: 'text', position: { x:  157, y: 257 }, width: 35, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'totalLabel', type: 'text', position: { x: 146, y: 265 }, width: 25, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'totalValue', type: 'text', position: { x: 157, y: 265 }, width: 35, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
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
    isSection?: boolean;
    isSectionSummary?: boolean;
    itemNumber?: string;
    quantity?: string | number;
    unit?: string;
    description: string;
    unitPrice?: string | number;
    total?: string | number;
  }>;
  
  // Custom section names
  section_names?: {
    cabinet: string;
    worktop: string;
    accessories: string;
    appliances: string;
    wardrobes: string;
    tvunit: string;
  };
  
  // Totals
  subtotal: number;
  vat: number;
  vatPercentage: number; // V.A.T percentage (e.g., 16 for 16%)
  total: number;
  
  // Notes
  notes?: string;
  
  // Terms and Conditions (dynamic array)
  terms: string[];
  
  // Signatures
  preparedBy: string;
  approvedBy: string;
  watermarkLogo?: string; // Base64 image data for watermark
}

// Currency formatting function
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

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
  
  // Default section names
  section_names: {
    cabinet: "General",
    worktop: "Worktop",
    accessories: "Accessories",
    appliances: "Appliances",
    wardrobes: "Wardrobes",
    tvunit: "TV Unit"
  },
  
  subtotal: 0,
  vat: 0,
  vatPercentage: 16, // Default 16% V.A.T
  total: 0,
  
  notes: "",
  
  terms: [
    "1. All work to be completed within agreed timeframe.",
    "2. Client to provide necessary measurements and specifications.",
    "3. Final payment due upon completion.",
    "4. Any changes to the original design may incur additional charges."
  ],
  
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

// Helper function to estimate text width for Helvetica, font size 10 (approximation)
function estimateTextWidth(text: string, fontSize: number = 10, fontName: string = 'Helvetica-Bold'): number {
  // Helvetica average width per character at font size 10 is about 5.5 (bold) or 5 (regular)
  // This is a rough estimate; for more accuracy, use a font metrics library
  const avgWidth = fontName.includes('Bold') ? 5.5 : 5;
  return text.length * avgWidth * (fontSize / 10);
}

// Helper function to deep clone the template (use structuredClone if available, else fallback)
function deepClone(obj: any) {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  } else {
    return JSON.parse(JSON.stringify(obj));
  }
}

// Function to generate PDF with dynamic content
export const generateQuotationPDF = async (data: QuotationData) => {
  // Layout constants (in mm)
  const pageHeight = 297;
  const topMargin = 20;
  const bottomMargin = 15;
  const headerHeight = 60; // header block (first page only)
  const tableHeaderHeight = 10;
  const baseFooterHeight = 40; // base footer block (last page only)
  const rowHeight = 8;
  const firstPageTableStartY = 101; // adjusted so 23 rows fit on first page

  // Merge default values with provided data
  const mergedData = { ...defaultValues, ...data };
  
  console.log('PDF Template Debug - Data merging:', {
    defaultVat: defaultValues.vat,
    defaultVatPercentage: defaultValues.vatPercentage,
    providedVat: data.vat,
    providedVatPercentage: data.vatPercentage,
    mergedVat: mergedData.vat,
    mergedVatPercentage: mergedData.vatPercentage
  });

  // Transform items to table row format for the template, supporting section headings
  const tableRows: { isSection: boolean, isSectionSummary?: boolean, row: string[] }[] = (mergedData.items || []).map((item, idx) => {
    if (item.isSection) {
      // Section heading row: only description, all caps, large font, others empty
      return {
        isSection: true,
        row: ["", String(item.description).toUpperCase(), "", "", "", ""]
      };
    } else if (item.isSectionSummary) {
      // Section summary row: label in description, value in total, others empty
      console.log('Processing section summary row:', item);
      return {
        isSection: false,
        isSectionSummary: true,
        row: ["", String(item.description), "", "", "", String(item.total)]
      };
    } else {
      // Item row: use itemNumber, description, etc.
      return {
        isSection: false,
        row: [
          item.itemNumber || String(idx + 1),
          String(item.description),
          item.unit ? String(item.unit) : "",
          item.quantity != null ? String(item.quantity) : "",
          item.unitPrice != null && item.unitPrice !== "" ? String(item.unitPrice) : "",
          item.total != null && item.total !== "" ? String(item.total) : ""
        ]
      };
    }
  });

  // Debug: Log the transformed table rows
  console.log('Transformed table rows:', tableRows);
  console.log('mergedData.section_names:', mergedData.section_names);
  console.log('mergedData.items:', mergedData.items);
  console.log('Section headers in mergedData.items:', (mergedData.items || []).filter(item => item.isSection));
  console.log('Section summaries in mergedData.items:', (mergedData.items || []).filter(item => item.isSectionSummary));

  // Calculate dynamic footer height based on terms
  const termsHeight = Math.max(20, mergedData.terms.length * 4); // 4mm per line, minimum 20mm
  const dynamicFooterHeight = baseFooterHeight + (termsHeight - 20); // Adjust footer height based on terms
  
  // Calculate rows per page
  const firstPageAvailable = pageHeight - topMargin - headerHeight - tableHeaderHeight - bottomMargin - dynamicFooterHeight;
  const otherPageAvailable = pageHeight - topMargin - tableHeaderHeight - bottomMargin;
  const firstPageRows = Math.floor(firstPageAvailable / rowHeight);
  const otherPageRows = Math.floor(otherPageAvailable / rowHeight);

  // Paginate rows
  const pages: Array<Array<{ isSection: boolean; isSectionSummary?: boolean; row: string[] }>> = [];
  let rowIndex = 0;
  // First page
  pages.push(tableRows.slice(0, firstPageRows));
  console.log('First page rows:', firstPageRows, 'Total rows in first page:', pages[0].length);
  rowIndex += firstPageRows;
  // Subsequent pages
  while (rowIndex < tableRows.length) {
    pages.push(tableRows.slice(rowIndex, rowIndex + otherPageRows));
    console.log('Page', pages.length, 'rows:', otherPageRows, 'Total rows in this page:', pages[pages.length - 1].length);
    rowIndex += otherPageRows;
  }
  
  // Debug: Log the distribution of section summary rows across pages
  pages.forEach((pageRows, pageIdx) => {
    const sectionSummaryRows = pageRows.filter(row => row.isSectionSummary);
    console.log(`Page ${pageIdx + 1} has ${sectionSummaryRows.length} section summary rows:`, sectionSummaryRows.map(row => row.row[4]));
  });

  // Build schemas for all pages
  let schemas: any[][] = [];
  pages.forEach((rows: Array<{ isSection: boolean; isSectionSummary?: boolean; row: string[] }>, pageIdx: number) => {
    let pageSchemas: any[] = [];
    // Header (first page only)
    if (pageIdx === 0) {
      pageSchemas.push(...quotationTemplate.schemas[0].filter((s: any) => [
        'logo','companyName','companyLocation','companyPhone','companyEmail','quotationHeaderBg','quotationTitle','clientInfoBox','clientNamesLabel','clientNamesValue','siteLocationLabel','siteLocationValue','mobileNoLabel','mobileNoValue','dateLabel','dateValue','quotationNoFull'
      ].includes(s.name)));
    }
    // Table header (every page)
    const tableHeaderY = (pageIdx === 0) ? firstPageTableStartY : topMargin;
    pageSchemas.push(...quotationTemplate.schemas[0]
      .filter((s: any) => [
        'tableHeaderBg','itemHeader','descriptionHeader','unitHeader','quantityHeader','unitPriceHeader','totalHeader'
      ].includes(s.name))
      .map((s: any) => ({ ...s, position: { ...s.position, y: tableHeaderY + (s.position.y - 105) }}))
    );
    // Table rows
    rows.forEach((rowObj, rowIdx) => {
      const y = tableHeaderY + tableHeaderHeight + rowIdx * rowHeight;
      if (rowObj.isSection) {
        // Section heading: large, bold, all caps, span description column
        pageSchemas.push({
          name: `descSection${pageIdx}_${rowIdx}`,
          type: 'text',
          position: { x: 29, y },
          width: 68, // span description column
          height: 7,
          fontSize: 11, // changed from 12 to 11
          fontColor: '#000',
          fontName: 'Helvetica-Bold',
          alignment: 'left',
          content: rowObj.row[1]
        });
      } else if (rowObj.isSectionSummary) {
        // Section summary: label in description, value in total, bold
        console.log('Creating section summary schema for row:', rowIdx, 'with content:', rowObj.row[1], rowObj.row[5]);
        console.log('Section summary rowObj:', rowObj);
        // Format section summary values with currency formatting
        let totalSummaryContent = rowObj.row[5] !== "" ? formatCurrency(parseFloat(rowObj.row[5])) : "";
        pageSchemas.push({ name: `descSummary${pageIdx}_${rowIdx}`, type: 'text', position: { x: 29, y }, width: 68, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left', content: rowObj.row[1] });
        pageSchemas.push({ name: `totalSummary${pageIdx}_${rowIdx}`, type: 'text', position: { x: 167, y }, width: 28, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right', content: totalSummaryContent });
      } else {
        // Normal item row
        pageSchemas.push({ name: `item${pageIdx}_${rowIdx}`, type: 'text', position: { x: 17, y }, width: 12, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica', alignment: 'center', content: rowObj.row[0] });
        pageSchemas.push({ name: `desc${pageIdx}_${rowIdx}`, type: 'text', position: { x: 29, y }, width: 68, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica', alignment: 'left', content: rowObj.row[1] });
        pageSchemas.push({ name: `unit${pageIdx}_${rowIdx}`, type: 'text', position: { x: 97, y }, width: 20, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica', alignment: 'center', content: rowObj.row[2] });
        pageSchemas.push({ name: `qty${pageIdx}_${rowIdx}`, type: 'text', position: { x: 117, y }, width: 20, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica', alignment: 'center', content: rowObj.row[3] });
        // Format Unit Price and Total only if not empty
        let unitPriceContent = rowObj.row[4] !== "" ? formatCurrency(parseFloat(rowObj.row[4])) : "";
        let totalContent = rowObj.row[5] !== "" ? formatCurrency(parseFloat(rowObj.row[5])) : "";
        pageSchemas.push({ name: `unitPrice${pageIdx}_${rowIdx}`, type: 'text', position: { x: 137, y }, width: 30, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica', alignment: 'right', content: unitPriceContent });
        pageSchemas.push({ name: `total${pageIdx}_${rowIdx}`, type: 'text', position: { x: 167, y }, width: 28, height: 5, fontSize: 11, fontColor: '#000', fontName: 'Helvetica', alignment: 'right', content: totalContent });
      }
    });
    // Footer (last page only)
    if (pageIdx === pages.length - 1) {
      // Place footer at the bottom of the page
      const footerY = pageHeight - bottomMargin - dynamicFooterHeight;
      pageSchemas.push(...quotationTemplate.schemas[0].filter(s => [
        'termsTitle','totalsBox','subtotalLabel','subtotalValue','vatLabel','vatValue','totalLabel','totalValue','preparedByLabel','preparedByLine','approvedByLabel','approvedByLine'
      ].includes(s.name)).map(s => ({ ...s, position: { ...s.position, y: footerY + (s.position.y - 245) }})));
      // Add terms content with dynamic height
      pageSchemas.push({ 
        name: 'termsContent', 
        type: 'text', 
        position: { x: 15, y: footerY + 5 }, 
        width: 120, 
        height: termsHeight, 
        fontSize: 8, 
        fontColor: '#000', 
        fontName: 'Helvetica', 
        alignment: 'left' 
      });
    }
    schemas.push(pageSchemas);
  });

  // Deep clone the template before patching
  const templateClone = deepClone(quotationTemplate);

  // Calculate the widest client info line (label + value)
  const clientInfoFontSize = 10;
  const clientInfoFields = [
    { label: 'CLIENT NAME:', value: mergedData.clientNames },
    { label: 'SITE LOCATION:', value: mergedData.siteLocation },
    { label: 'MOBILE NO.:', value: mergedData.mobileNo },
    { label: 'DATE:', value: mergedData.date }
  ];
  let maxClientInfoWidth = 0;
  clientInfoFields.forEach(field => {
    const labelWidth = estimateTextWidth(field.label, clientInfoFontSize, 'Helvetica-Bold');
    const valueWidth = estimateTextWidth(field.value, clientInfoFontSize, 'Helvetica');
    const totalWidth = labelWidth + 6 + valueWidth; // 6mm gap between label and value
    if (totalWidth > maxClientInfoWidth) maxClientInfoWidth = totalWidth;
  });
  const clientInfoBoxWidth = maxClientInfoWidth + 1; // 1mm padding, no minimum width

  // Patch the schema for clientInfoBox and value fields on the clone
  templateClone.schemas[0] = templateClone.schemas[0].map((s: any) => {
    if (s.name === 'clientInfoBox') {
      return { ...s, width: 20 };
    }
    if (s.name === 'clientNamesValue') {
      return { ...s, position: { ...s.position, x: 18 + estimateTextWidth('CLIENT NAME:', clientInfoFontSize, 'Helvetica-Bold') + 6 }, width: clientInfoBoxWidth - (estimateTextWidth('CLIENT NAME:', clientInfoFontSize, 'Helvetica-Bold') + 18 + 1) };
    }
    if (s.name === 'siteLocationValue') {
      return { ...s, position: { ...s.position, x: 18 + estimateTextWidth('SITE LOCATION:', clientInfoFontSize, 'Helvetica-Bold') + 6 }, width: clientInfoBoxWidth - (estimateTextWidth('SITE LOCATION:', clientInfoFontSize, 'Helvetica-Bold') + 18 + 1) };
    }
    if (s.name === 'mobileNoValue') {
      return { ...s, position: { ...s.position, x: 18 + estimateTextWidth('MOBILE NO.:', clientInfoFontSize, 'Helvetica-Bold') + 6 }, width: clientInfoBoxWidth - (estimateTextWidth('MOBILE NO.:', clientInfoFontSize, 'Helvetica-Bold') + 18 + 1) };
    }
    if (s.name === 'dateValue') {
      return { ...s, position: { ...s.position, x: 18 + estimateTextWidth('DATE:', clientInfoFontSize, 'Helvetica-Bold') + 6 }, width: clientInfoBoxWidth - (estimateTextWidth('DATE:', clientInfoFontSize, 'Helvetica-Bold') + 18 + 1) };
    }
    return s;
  });

  // Debug logs
  console.log('Calculated clientInfoBoxWidth:', clientInfoBoxWidth);
  const patchedBox = templateClone.schemas[0].find((s: any) => s.name === 'clientInfoBox');
  console.log('Patched schema width for clientInfoBox:', patchedBox ? patchedBox.width : 'not found');

  // Build dynamic row values for inputs
  const dynamicRowInputs: Record<string, string> = {};
  pages.forEach((rows: Array<{ isSection: boolean; isSectionSummary?: boolean; row: string[] }>, pageIdx: number) => {
    rows.forEach((rowObj, rowIdx) => {
      if (rowObj.isSection) {
        dynamicRowInputs[`descSection${pageIdx}_${rowIdx}`] = rowObj.row[1];
      } else if (rowObj.isSectionSummary) {
        console.log('Creating section summary inputs for row:', rowIdx, 'with content:', rowObj.row[1], rowObj.row[5]);
        console.log('Section summary inputs rowObj:', rowObj);
        // Format section summary values with currency formatting for inputs
        dynamicRowInputs[`descSummary${pageIdx}_${rowIdx}`] = rowObj.row[1];
        dynamicRowInputs[`totalSummary${pageIdx}_${rowIdx}`] = rowObj.row[5] !== "" ? formatCurrency(parseFloat(rowObj.row[5])) : "";
      } else {
        dynamicRowInputs[`item${pageIdx}_${rowIdx}`] = rowObj.row[0];
        dynamicRowInputs[`desc${pageIdx}_${rowIdx}`] = rowObj.row[1];
        dynamicRowInputs[`unit${pageIdx}_${rowIdx}`] = rowObj.row[2];
        dynamicRowInputs[`qty${pageIdx}_${rowIdx}`] = rowObj.row[3];
        // Only format if not empty
        dynamicRowInputs[`unitPrice${pageIdx}_${rowIdx}`] = rowObj.row[4] !== "" ? formatCurrency(parseFloat(rowObj.row[4])) : "";
        dynamicRowInputs[`total${pageIdx}_${rowIdx}`] = rowObj.row[5] !== "" ? formatCurrency(parseFloat(rowObj.row[5])) : "";
      }
    });
  });

  // Debug logging
  console.log('PDF Template Debug - mergedData:', {
    subtotal: mergedData.subtotal,
    vat: mergedData.vat,
    vatPercentage: mergedData.vatPercentage,
    total: mergedData.total
  });

  // Debug logging for currency formatting
  console.log('PDF Template Debug - Currency formatting:', {
    subtotal: mergedData.subtotal,
    vat: mergedData.vat,
    total: mergedData.total,
    formattedSubtotal: formatCurrency(mergedData.subtotal),
    formattedVat: formatCurrency(mergedData.vat),
    formattedTotal: formatCurrency(mergedData.total)
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
      mobileNoLabel: "MOBILE NO:",
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
      subtotalValue: `KES ${formatCurrency(mergedData.subtotal)}`,
      vatLabel: `${mergedData.vatPercentage}% V.A.T:`,
      vatValue: `KES ${formatCurrency(mergedData.vat)}`,
      totalLabel: "Total:",
      totalValue: `KES ${formatCurrency(mergedData.total)}`,
      termsTitle: "TERMS AND CONDITIONS:",
      termsContent: mergedData.terms.join("\n"),
      preparedByLabel: "Prepared by:",
      approvedByLabel: "Approved by:",
      ...dynamicRowInputs
    }
  ];

  return {
    template: {
      ...templateClone,
      schemas: schemas.map((page: any[]) => page.map((schema: any) => schema))
    },
    inputs
  };
};