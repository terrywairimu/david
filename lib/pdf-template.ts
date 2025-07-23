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
      { name: 'quotationHeaderBg', type: 'rectangle', position: { x: 0, y: 47 }, width: 210, height: 18, color: '#E5E5E5' },
      { name: 'quotationTitle', type: 'text', position: { x: 0, y: 50 }, width: 210, height: 12, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'center', fontWeight: 'bold' },
      { name: 'clientInfoBox', type: 'rectangle', position: { x: 15, y: 70 }, width: 60, height: 28, color: '#E5E5E5', radius: 4 },
      { name: 'clientNamesLabel', type: 'text', position: { x: 16, y: 73 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'clientNamesValue', type: 'text', position: { x: 41, y: 73 }, width: 32, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'siteLocationLabel', type: 'text', position: { x: 16, y: 79 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'siteLocationValue', type: 'text', position: { x: 41, y: 79 }, width: 32, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'mobileNoLabel', type: 'text', position: { x: 16, y: 85 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'mobileNoValue', type: 'text', position: { x: 41, y: 85 }, width: 32, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'dateLabel', type: 'text', position: { x: 16, y: 91 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'dateValue', type: 'text', position: { x: 41, y: 91 }, width: 32, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'deliveryNoteLabel', type: 'text', position: { x: 80, y: 73 }, width: 40, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'deliveryNoteValue', type: 'text', position: { x: 120, y: 73 }, width: 30, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'quotationNoLabel', type: 'text', position: { x: 170, y: 73 }, width: 15, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'quotationNoValue', type: 'text', position: { x: 185, y: 73 }, width: 15, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'tableHeaderBg', type: 'rectangle', position: { x: 15, y: 105 }, width: 180, height: 10, color: '#E5E5E5' },
      // Table header with Item number column
      { name: 'itemHeader', type: 'text', position: { x: 17, y: 108 }, width: 12, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Item' },
      { name: 'descriptionHeader', type: 'text', position: { x: 29, y: 108 }, width: 68, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Description' },
      { name: 'unitHeader', type: 'text', position: { x: 97, y: 108 }, width: 20, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Unit' },
      { name: 'quantityHeader', type: 'text', position: { x: 117, y: 108 }, width: 20, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Qty' },
      { name: 'unitPriceHeader', type: 'text', position: { x: 137, y: 108 }, width: 30, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Unit Price' },
      { name: 'totalHeader', type: 'text', position: { x: 167, y: 108 }, width: 28, height: 5, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center', content: 'Total' },
      // NOTE: When generating table rows, map as [itemNumber, description, unit, quantity, unitPrice, total]
      { name: 'watermarkLogo', type: 'image', position: { x: 60, y: 135 }, width: 90, height: 90, opacity: 0.08 },
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
      { name: 'approvedByLine', type: 'line', position: { x: 145, y: 283 }, width: 60, height: 0, color: '#000' }
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
  approvedBy: ""
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
  // Merge default values with provided data
  const mergedData = { ...defaultValues, ...data };

  // Transform items to table row format for the template
  const tableRows = (mergedData.items || []).map((item, idx) => [
    idx + 1,
    item.description,
    item.unit,
    item.quantity,
    item.unitPrice,
    item.total
  ]);

  // Create input values for the template
  const inputs = [
    {
      // Static company information
      companyName: mergedData.companyName,
      companyLocation: mergedData.companyLocation,
      companyPhone: mergedData.companyPhone,
      companyEmail: mergedData.companyEmail,
      companyLogo: mergedData.companyLogo,
      watermarkLogo: mergedData.companyLogo,
      logo: mergedData.companyLogo, // <-- Added for header logo
      // Form data
      clientNamesLabel: "CLIENT NAMES:",
      clientNamesValue: mergedData.clientNames,
      siteLocationLabel: "SITE LOCATION:",
      siteLocationValue: mergedData.siteLocation,
      mobileNoLabel: "MOBILE NO.:",
      mobileNoValue: mergedData.mobileNo,
      dateLabel: "DATE:",
      dateValue: mergedData.date,
      
      // Headers
      quotationTitle: "QUOTATION",
      deliveryNoteLabel: mergedData.deliveryNoteNo,
      quotationNoLabel: "NO.:",
      quotationNoValue: mergedData.quotationNumber,
      
      // Table headers
      quantityHeader: "Quantity",
      unitHeader: "Unit",
      descriptionHeader: "Description",
      unitPriceHeader: "Unit Price",
      totalHeader: "Total",
      
      // Totals
      subtotalLabel: "Sub Total:",
      subtotalValue: `KES ${mergedData.subtotal.toFixed(2)}`,
      vatLabel: "V.A.T:",
      vatValue: `KES ${mergedData.vat.toFixed(2)}`,
      totalLabel: "Total:",
      totalValue: `KES ${mergedData.total.toFixed(2)}`,
      
      // Terms
      termsTitle: "TERMS AND CONDITIONS:",
      termsContent: mergedData.terms.term1 + "\n" + mergedData.terms.term2 + "\n" + mergedData.terms.term3 + "\n" + mergedData.terms.term4,
      
      // Signatures
      preparedByLabel: "Prepared by:",
      approvedByLabel: "Approved by:",
      tableRows // pass to template if needed
    }
  ];

  return {
    template: quotationTemplate,
    inputs: inputs
  };
}; 