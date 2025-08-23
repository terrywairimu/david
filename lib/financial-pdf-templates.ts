import { ProfitLossData, BalanceSheetData, CashFlowData } from './financial-reports';

// Base Financial Template (common elements)
const baseFinancialTemplate = {
  basePdf: {
    width: 210,
    height: 297,
    padding: [0, 0, 0, 0] as [number, number, number, number],
  },
  schemas: [
    [
      // Company Header
      { name: 'logo', type: 'image', position: { x: 15, y: 5 }, width: 38, height: 38 },
      { name: 'companyName', type: 'text', position: { x: 60, y: 11 }, width: 140, height: 14, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'left', fontWeight: 'Extra Bold', characterSpacing: 0.5 },
      { name: 'companyLocation', type: 'text', position: { x: 60, y: 21 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'companyPhone', type: 'text', position: { x: 60, y: 27 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'companyEmail', type: 'text', position: { x: 60, y: 33 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
      
      // Report Header
      { name: 'reportHeaderBg', type: 'rectangle', position: { x: 15, y: 47 }, width: 180, height: 14, color: '#E5E5E5', radius: 5 },
      { name: 'reportTitle', type: 'text', position: { x: 0, y: 50 }, width: 210, height: 12, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'center', fontWeight: 'bold' },
      
      // Report Info Box
      { name: 'reportInfoBox', type: 'rectangle', position: { x: 15, y: 64 }, width: 62, height: 28, color: '#E5E5E5', radius: 4 },
      { name: 'reportDateLabel', type: 'text', position: { x: 18, y: 67 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'reportDateValue', type: 'text', position: { x: 47, y: 67 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'reportPeriodLabel', type: 'text', position: { x: 18, y: 73 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'reportPeriodValue', type: 'text', position: { x: 47, y: 73 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'reportNumberLabel', type: 'text', position: { x: 18, y: 79 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'reportNumberValue', type: 'text', position: { x: 47, y: 79 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      
      // Watermark
      { name: 'watermarkLogo', type: 'image', position: { x: 60, y: 110 }, width: 100, height: 100, opacity: 0.2 },
      
      // Footer
      { name: 'preparedByLabel', type: 'text', position: { x: 15, y: 280 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'preparedByLine', type: 'line', position: { x: 35, y: 283 }, width: 60, height: 0, color: '#000' },
      { name: 'approvedByLabel', type: 'text', position: { x: 120, y: 280 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'approvedByLine', type: 'line', position: { x: 145, y: 283 }, width: 60, height: 0, color: '#000' },
    ]
  ]
};

// Profit & Loss Statement Template
export const profitLossTemplate = {
  ...baseFinancialTemplate,
  schemas: [
    [
      ...baseFinancialTemplate.schemas[0],
      
      // Revenue Section Header
      { name: 'revenueHeader', type: 'text', position: { x: 15, y: 100 }, width: 180, height: 8, fontSize: 12, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      
      // Revenue Items
      { name: 'salesLabel', type: 'text', position: { x: 20, y: 115 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'salesValue', type: 'text', position: { x: 150, y: 115 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'otherIncomeLabel', type: 'text', position: { x: 20, y: 125 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'otherIncomeValue', type: 'text', position: { x: 150, y: 125 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'totalRevenueLabel', type: 'text', position: { x: 20, y: 135 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'totalRevenueValue', type: 'text', position: { x: 150, y: 135 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
      
      // Cost of Goods Sold Section
      { name: 'cogsHeader', type: 'text', position: { x: 15, y: 150 }, width: 180, height: 8, fontSize: 12, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      
      { name: 'openingInventoryLabel', type: 'text', position: { x: 20, y: 165 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'openingInventoryValue', type: 'text', position: { x: 150, y: 165 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'purchasesLabel', type: 'text', position: { x: 20, y: 175 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'purchasesValue', type: 'text', position: { x: 150, y: 175 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'closingInventoryLabel', type: 'text', position: { x: 20, y: 185 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'closingInventoryValue', type: 'text', position: { x: 150, y: 185 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'totalCogsLabel', type: 'text', position: { x: 20, y: 195 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'totalCogsValue', type: 'text', position: { x: 150, y: 195 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
      
      // Gross Profit
      { name: 'grossProfitLabel', type: 'text', position: { x: 20, y: 205 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'grossProfitValue', type: 'text', position: { x: 150, y: 205 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
      
      // Operating Expenses Section
      { name: 'expensesHeader', type: 'text', position: { x: 15, y: 220 }, width: 180, height: 8, fontSize: 12, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      
      { name: 'salariesLabel', type: 'text', position: { x: 20, y: 235 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'salariesValue', type: 'text', position: { x: 150, y: 235 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'rentLabel', type: 'text', position: { x: 20, y: 245 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'rentValue', type: 'text', position: { x: 150, y: 245 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'utilitiesLabel', type: 'text', position: { x: 20, y: 255 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'utilitiesValue', type: 'text', position: { x: 150, y: 255 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'totalExpensesLabel', type: 'text', position: { x: 20, y: 265 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'totalExpensesValue', type: 'text', position: { x: 150, y: 265 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
      
      // Net Income
      { name: 'netIncomeLabel', type: 'text', position: { x: 20, y: 275 }, width: 120, height: 6, fontSize: 12, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'netIncomeValue', type: 'text', position: { x: 150, y: 275 }, width: 45, height: 6, fontSize: 12, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
    ]
  ]
};

// Balance Sheet Template
export const balanceSheetTemplate = {
  ...baseFinancialTemplate,
  schemas: [
    [
      ...baseFinancialTemplate.schemas[0],
      
      // Assets Section Header
      { name: 'assetsHeader', type: 'text', position: { x: 15, y: 100 }, width: 180, height: 8, fontSize: 12, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      
      // Current Assets
      { name: 'currentAssetsHeader', type: 'text', position: { x: 20, y: 115 }, width: 180, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      
      { name: 'cashLabel', type: 'text', position: { x: 25, y: 125 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'cashValue', type: 'text', position: { x: 150, y: 125 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'bankLabel', type: 'text', position: { x: 25, y: 135 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'bankValue', type: 'text', position: { x: 150, y: 135 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'accountsReceivableLabel', type: 'text', position: { x: 25, y: 145 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'accountsReceivableValue', type: 'text', position: { x: 150, y: 145 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'inventoryLabel', type: 'text', position: { x: 25, y: 155 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'inventoryValue', type: 'text', position: { x: 150, y: 155 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'totalCurrentAssetsLabel', type: 'text', position: { x: 20, y: 165 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'totalCurrentAssetsValue', type: 'text', position: { x: 150, y: 165 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
      
      // Fixed Assets
      { name: 'fixedAssetsHeader', type: 'text', position: { x: 20, y: 180 }, width: 180, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      
      { name: 'equipmentLabel', type: 'text', position: { x: 25, y: 190 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'equipmentValue', type: 'text', position: { x: 150, y: 190 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'furnitureLabel', type: 'text', position: { x: 25, y: 200 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'furnitureValue', type: 'text', position: { x: 150, y: 200 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'totalFixedAssetsLabel', type: 'text', position: { x: 20, y: 210 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'totalFixedAssetsValue', type: 'text', position: { x: 150, y: 210 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
      
      // Total Assets
      { name: 'totalAssetsLabel', type: 'text', position: { x: 20, y: 220 }, width: 120, height: 6, fontSize: 12, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'totalAssetsValue', type: 'text', position: { x: 150, y: 220 }, width: 45, height: 6, fontSize: 12, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
      
      // Liabilities Section
      { name: 'liabilitiesHeader', type: 'text', position: { x: 15, y: 235 }, width: 180, height: 8, fontSize: 12, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      
      { name: 'totalLiabilitiesLabel', type: 'text', position: { x: 20, y: 250 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'totalLiabilitiesValue', type: 'text', position: { x: 150, y: 250 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      // Equity Section
      { name: 'equityHeader', type: 'text', position: { x: 15, y: 265 }, width: 180, height: 8, fontSize: 12, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      
      { name: 'capitalLabel', type: 'text', position: { x: 20, y: 280 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'capitalValue', type: 'text', position: { x: 150, y: 280 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'retainedEarningsLabel', type: 'text', position: { x: 20, y: 290 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'retainedEarningsValue', type: 'text', position: { x: 150, y: 290 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
    ]
  ]
};

// Cash Flow Statement Template
export const cashFlowTemplate = {
  ...baseFinancialTemplate,
  schemas: [
    [
      ...baseFinancialTemplate.schemas[0],
      
      // Operating Activities Section
      { name: 'operatingHeader', type: 'text', position: { x: 15, y: 100 }, width: 180, height: 8, fontSize: 12, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      
      { name: 'netIncomeLabel', type: 'text', position: { x: 20, y: 115 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'netIncomeValue', type: 'text', position: { x: 150, y: 115 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'depreciationLabel', type: 'text', position: { x: 20, y: 125 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'depreciationValue', type: 'text', position: { x: 150, y: 125 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'netCashFromOperationsLabel', type: 'text', position: { x: 20, y: 135 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'netCashFromOperationsValue', type: 'text', position: { x: 150, y: 135 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
      
      // Investing Activities Section
      { name: 'investingHeader', type: 'text', position: { x: 15, y: 150 }, width: 180, height: 8, fontSize: 12, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      
      { name: 'equipmentPurchasesLabel', type: 'text', position: { x: 20, y: 165 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'equipmentPurchasesValue', type: 'text', position: { x: 150, y: 165 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'netCashFromInvestingLabel', type: 'text', position: { x: 20, y: 175 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'netCashFromInvestingValue', type: 'text', position: { x: 150, y: 175 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
      
      // Financing Activities Section
      { name: 'financingHeader', type: 'text', position: { x: 15, y: 190 }, width: 180, height: 8, fontSize: 12, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      
      { name: 'capitalContributionsLabel', type: 'text', position: { x: 20, y: 205 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'capitalContributionsValue', type: 'text', position: { x: 150, y: 205 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'netCashFromFinancingLabel', type: 'text', position: { x: 20, y: 215 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'netCashFromFinancingValue', type: 'text', position: { x: 150, y: 215 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
      
      // Net Change in Cash
      { name: 'netChangeLabel', type: 'text', position: { x: 20, y: 230 }, width: 120, height: 6, fontSize: 12, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'netChangeValue', type: 'text', position: { x: 150, y: 230 }, width: 45, height: 6, fontSize: 12, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
      
      { name: 'beginningCashLabel', type: 'text', position: { x: 20, y: 240 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'beginningCashValue', type: 'text', position: { x: 150, y: 240 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'endingCashLabel', type: 'text', position: { x: 20, y: 250 }, width: 120, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'endingCashValue', type: 'text', position: { x: 150, y: 250 }, width: 45, height: 6, fontSize: 10, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
    ]
  ]
};

// Currency formatting function
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Generate Profit & Loss PDF
export const generateProfitLossPDF = async (data: ProfitLossData) => {
  // Fetch watermark image as base64
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

  const inputs = [{
    // Company Info
    logo: companyLogoBase64,
    companyName: data.companyName,
    companyLocation: data.companyLocation,
    companyPhone: data.companyPhone,
    companyEmail: data.companyEmail,
    
    // Report Header
    reportTitle: data.reportTitle,
    reportDateLabel: 'Date:',
    reportDateValue: data.reportDate,
    reportPeriodLabel: 'Period:',
    reportPeriodValue: data.reportPeriod,
    reportNumberLabel: 'Report No:',
    reportNumberValue: data.reportNumber,
    
    // Revenue Section
    revenueHeader: 'REVENUE',
    salesLabel: 'Sales',
    salesValue: formatCurrency(data.revenue.sales),
    otherIncomeLabel: 'Other Income',
    otherIncomeValue: formatCurrency(data.revenue.otherIncome),
    totalRevenueLabel: 'Total Revenue',
    totalRevenueValue: formatCurrency(data.revenue.totalRevenue),
    
    // Cost of Goods Sold
    cogsHeader: 'COST OF GOODS SOLD',
    openingInventoryLabel: 'Opening Inventory',
    openingInventoryValue: formatCurrency(data.costOfGoodsSold.openingInventory),
    purchasesLabel: 'Purchases',
    purchasesValue: formatCurrency(data.costOfGoodsSold.purchases),
    closingInventoryLabel: 'Closing Inventory',
    closingInventoryValue: formatCurrency(data.costOfGoodsSold.closingInventory),
    totalCogsLabel: 'Total Cost of Goods Sold',
    totalCogsValue: formatCurrency(data.costOfGoodsSold.totalCostOfGoodsSold),
    
    // Gross Profit
    grossProfitLabel: 'GROSS PROFIT',
    grossProfitValue: formatCurrency(data.grossProfit),
    
    // Operating Expenses
    expensesHeader: 'OPERATING EXPENSES',
    salariesLabel: 'Salaries & Wages',
    salariesValue: formatCurrency(data.operatingExpenses.salaries),
    rentLabel: 'Rent',
    rentValue: formatCurrency(data.operatingExpenses.rent),
    utilitiesLabel: 'Utilities',
    utilitiesValue: formatCurrency(data.operatingExpenses.utilities),
    totalExpensesLabel: 'Total Operating Expenses',
    totalExpensesValue: formatCurrency(data.operatingExpenses.totalOperatingExpenses),
    
    // Net Income
    netIncomeLabel: 'NET INCOME',
    netIncomeValue: formatCurrency(data.netIncome),
    
    // Footer
    preparedByLabel: `Prepared by: ${data.preparedBy}`,
    approvedByLabel: `Approved by: ${data.approvedBy}`,
    
    // Watermark
    watermarkLogo: watermarkLogoBase64,
  }];

  return { template: profitLossTemplate, inputs };
};

// Generate Balance Sheet PDF
export const generateBalanceSheetPDF = async (data: BalanceSheetData) => {
  // Fetch watermark image as base64
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

  const inputs = [{
    // Company Info
    logo: companyLogoBase64,
    companyName: data.companyName,
    companyLocation: data.companyLocation,
    companyPhone: data.companyPhone,
    companyEmail: data.companyEmail,
    
    // Report Header
    reportTitle: data.reportTitle,
    reportDateLabel: 'Date:',
    reportDateValue: data.reportDate,
    reportNumberLabel: 'Report No:',
    reportNumberValue: data.reportNumber,
    
    // Assets Section
    assetsHeader: 'ASSETS',
    currentAssetsHeader: 'Current Assets',
    cashLabel: 'Cash',
    cashValue: formatCurrency(data.assets.current.cash),
    bankLabel: 'Bank',
    bankValue: formatCurrency(data.assets.current.bank),
    accountsReceivableLabel: 'Accounts Receivable',
    accountsReceivableValue: formatCurrency(data.assets.current.accountsReceivable),
    inventoryLabel: 'Inventory',
    inventoryValue: formatCurrency(data.assets.current.inventory),
    totalCurrentAssetsLabel: 'Total Current Assets',
    totalCurrentAssetsValue: formatCurrency(data.assets.current.totalCurrentAssets),
    
    fixedAssetsHeader: 'Fixed Assets',
    equipmentLabel: 'Equipment',
    equipmentValue: formatCurrency(data.assets.fixed.equipment),
    furnitureLabel: 'Furniture',
    furnitureValue: formatCurrency(data.assets.fixed.furniture),
    totalFixedAssetsLabel: 'Total Fixed Assets',
    totalFixedAssetsValue: formatCurrency(data.assets.fixed.totalFixedAssets),
    
    totalAssetsLabel: 'TOTAL ASSETS',
    totalAssetsValue: formatCurrency(data.assets.totalAssets),
    
    // Liabilities Section
    liabilitiesHeader: 'LIABILITIES',
    totalLiabilitiesLabel: 'Total Liabilities',
    totalLiabilitiesValue: formatCurrency(data.liabilities.totalLiabilities),
    
    // Equity Section
    equityHeader: 'EQUITY',
    capitalLabel: 'Capital',
    capitalValue: formatCurrency(data.equity.capital),
    retainedEarningsLabel: 'Retained Earnings',
    retainedEarningsValue: formatCurrency(data.equity.retainedEarnings),
    
    // Footer
    preparedByLabel: `Prepared by: ${data.preparedBy}`,
    approvedByLabel: `Approved by: ${data.approvedBy}`,
    
    // Watermark
    watermarkLogo: watermarkLogoBase64,
  }];

  return { template: balanceSheetTemplate, inputs };
};

// Generate Cash Flow PDF
export const generateCashFlowPDF = async (data: CashFlowData) => {
  // Fetch watermark image as base64
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

  const inputs = [{
    // Company Info
    logo: companyLogoBase64,
    companyName: data.companyName,
    companyLocation: data.companyLocation,
    companyPhone: data.companyPhone,
    companyEmail: data.companyEmail,
    
    // Report Header
    reportTitle: data.reportTitle,
    reportDateLabel: 'Date:',
    reportDateValue: data.reportDate,
    reportPeriodLabel: 'Period:',
    reportPeriodValue: data.reportPeriod,
    reportNumberLabel: 'Report No:',
    reportNumberValue: data.reportNumber,
    
    // Operating Activities
    operatingHeader: 'CASH FLOWS FROM OPERATING ACTIVITIES',
    netIncomeLabel: 'Net Income',
    netIncomeValue: formatCurrency(data.operatingActivities.netIncome),
    depreciationLabel: 'Depreciation',
    depreciationValue: formatCurrency(data.operatingActivities.adjustments.depreciation),
    netCashFromOperationsLabel: 'Net Cash from Operations',
    netCashFromOperationsValue: formatCurrency(data.operatingActivities.netCashFromOperations),
    
    // Investing Activities
    investingHeader: 'CASH FLOWS FROM INVESTING ACTIVITIES',
    equipmentPurchasesLabel: 'Equipment Purchases',
    equipmentPurchasesValue: formatCurrency(data.investingActivities.equipmentPurchases),
    netCashFromInvestingLabel: 'Net Cash from Investing',
    netCashFromInvestingValue: formatCurrency(data.investingActivities.netCashFromInvesting),
    
    // Financing Activities
    financingHeader: 'CASH FLOWS FROM FINANCING ACTIVITIES',
    capitalContributionsLabel: 'Capital Contributions',
    capitalContributionsValue: formatCurrency(data.financingActivities.capitalContributions),
    netCashFromFinancingLabel: 'Net Cash from Financing',
    netCashFromFinancingValue: formatCurrency(data.financingActivities.netCashFromFinancing),
    
    // Net Change in Cash
    netChangeLabel: 'NET CHANGE IN CASH',
    netChangeValue: formatCurrency(data.netChangeInCash),
    beginningCashLabel: 'Beginning Cash',
    beginningCashValue: formatCurrency(data.beginningCash),
    endingCashLabel: 'Ending Cash',
    endingCashValue: formatCurrency(data.endingCash),
    
    // Footer
    preparedByLabel: `Prepared by: ${data.preparedBy}`,
    approvedByLabel: `Approved by: ${data.approvedBy}`,
    
    // Watermark
    watermarkLogo: watermarkLogoBase64,
  }];

  return { template: cashFlowTemplate, inputs };
};

// Cash Book Template - Three Column Layout with Dynamic Data
const cashBookTemplate = {
  basePdf: {
    width: 210,
    height: 297,
    padding: [0, 0, 0, 0] as [number, number, number, number],
  },
  schemas: [
    [
      // Company Header
      { name: 'logo', type: 'image', position: { x: 15, y: 5 }, width: 38, height: 38 },
      { name: 'companyName', type: 'text', position: { x: 60, y: 11 }, width: 140, height: 14, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'left', fontWeight: 'Extra Bold', characterSpacing: 0.5 },
      { name: 'companyLocation', type: 'text', position: { x: 60, y: 21 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'companyPhone', type: 'text', position: { x: 60, y: 27 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'companyEmail', type: 'text', position: { x: 60, y: 33 }, width: 140, height: 6, fontSize: 11, fontColor: '#000000', fontName: 'Helvetica', alignment: 'left' },
      
      // Report Header
      { name: 'reportHeaderBg', type: 'rectangle', position: { x: 15, y: 47 }, width: 180, height: 14, color: '#E5E5E5', radius: 5 },
      { name: 'reportTitle', type: 'text', position: { x: 0, y: 50 }, width: 210, height: 12, fontSize: 18, fontColor: '#B06A2B', fontName: 'Helvetica-Bold', alignment: 'center', fontWeight: 'bold' },
      
      // Report Info Box
      { name: 'reportInfoBox', type: 'rectangle', position: { x: 15, y: 64 }, width: 62, height: 28, color: '#E5E5E5', radius: 4 },
      { name: 'reportDateLabel', type: 'text', position: { x: 18, y: 67 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'reportDateValue', type: 'text', position: { x: 47, y: 67 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'reportPeriodLabel', type: 'text', position: { x: 18, y: 73 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'reportPeriodValue', type: 'text', position: { x: 47, y: 73 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'reportNumberLabel', type: 'text', position: { x: 18, y: 79 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'reportNumberValue', type: 'text', position: { x: 47, y: 79 }, width: 55, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      
      // Receipts (Dr.) Section Header
      { name: 'receiptsHeader', type: 'text', position: { x: 15, y: 100 }, width: 90, height: 8, fontSize: 12, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      
      // Receipts Table Headers
      { name: 'receiptsDateHeader', type: 'text', position: { x: 17, y: 115 }, width: 20, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'receiptsParticularsHeader', type: 'text', position: { x: 42, y: 115 }, width: 35, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'receiptsRefHeader', type: 'text', position: { x: 82, y: 115 }, width: 15, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'receiptsCashHeader', type: 'text', position: { x: 102, y: 115 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'receiptsBankHeader', type: 'text', position: { x: 132, y: 115 }, width: 30, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'receiptsDiscountHeader', type: 'text', position: { x: 167, y: 115 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      
      // Receipts Data Rows (up to 15 rows for comprehensive data)
      { name: 'receiptsDate1', type: 'text', position: { x: 17, y: 125 }, width: 20, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      { name: 'receiptsParticulars1', type: 'text', position: { x: 42, y: 125 }, width: 35, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'receiptsRef1', type: 'text', position: { x: 82, y: 125 }, width: 15, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      { name: 'receiptsCash1', type: 'text', position: { x: 102, y: 125 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'receiptsBank1', type: 'text', position: { x: 132, y: 125 }, width: 30, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'receiptsDiscount1', type: 'text', position: { x: 167, y: 125 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'receiptsDate2', type: 'text', position: { x: 17, y: 135 }, width: 20, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      { name: 'receiptsParticulars2', type: 'text', position: { x: 42, y: 135 }, width: 35, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'receiptsRef2', type: 'text', position: { x: 82, y: 135 }, width: 15, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      { name: 'receiptsCash2', type: 'text', position: { x: 102, y: 135 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'receiptsBank2', type: 'text', position: { x: 132, y: 135 }, width: 30, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'receiptsDiscount2', type: 'text', position: { x: 167, y: 135 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'receiptsDate3', type: 'text', position: { x: 17, y: 145 }, width: 20, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      { name: 'receiptsParticulars3', type: 'text', position: { x: 42, y: 145 }, width: 35, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'receiptsRef3', type: 'text', position: { x: 82, y: 145 }, width: 15, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      { name: 'receiptsCash3', type: 'text', position: { x: 102, y: 145 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'receiptsBank3', type: 'text', position: { x: 132, y: 145 }, width: 30, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'receiptsDiscount3', type: 'text', position: { x: 167, y: 145 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'receiptsDate4', type: 'text', position: { x: 17, y: 155 }, width: 20, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      { name: 'receiptsParticulars4', type: 'text', position: { x: 42, y: 155 }, width: 35, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'receiptsRef4', type: 'text', position: { x: 82, y: 155 }, width: 15, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      { name: 'receiptsCash4', type: 'text', position: { x: 102, y: 155 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'receiptsBank4', type: 'text', position: { x: 132, y: 155 }, width: 30, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'receiptsDiscount4', type: 'text', position: { x: 167, y: 155 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'receiptsDate5', type: 'text', position: { x: 17, y: 165 }, width: 20, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      { name: 'receiptsParticulars5', type: 'text', position: { x: 42, y: 165 }, width: 35, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'receiptsRef5', type: 'text', position: { x: 82, y: 165 }, width: 15, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      { name: 'receiptsCash5', type: 'text', position: { x: 102, y: 165 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'receiptsBank5', type: 'text', position: { x: 132, y: 165 }, width: 30, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'receiptsDiscount5', type: 'text', position: { x: 167, y: 165 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      // Receipts Total Row
      { name: 'receiptsTotalDate', type: 'text', position: { x: 17, y: 175 }, width: 20, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'receiptsTotalParticulars', type: 'text', position: { x: 42, y: 175 }, width: 35, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'receiptsTotalRef', type: 'text', position: { x: 82, y: 175 }, width: 15, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'receiptsTotalCash', type: 'text', position: { x: 102, y: 175 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
      { name: 'receiptsTotalBank', type: 'text', position: { x: 132, y: 175 }, width: 30, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
      { name: 'receiptsTotalDiscount', type: 'text', position: { x: 167, y: 175 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
      
      // Payments (Cr.) Section Header
      { name: 'paymentsHeader', type: 'text', position: { x: 110, y: 100 }, width: 90, height: 8, fontSize: 12, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      
      // Payments Table Headers
      { name: 'paymentsDateHeader', type: 'text', position: { x: 112, y: 115 }, width: 20, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'paymentsParticularsHeader', type: 'text', position: { x: 137, y: 115 }, width: 35, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'paymentsRefHeader', type: 'text', position: { x: 177, y: 115 }, width: 15, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'paymentsCashHeader', type: 'text', position: { x: 197, y: 115 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'paymentsBankHeader', type: 'text', position: { x: 227, y: 115 }, width: 30, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'paymentsDiscountHeader', type: 'text', position: { x: 262, y: 115 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      
      // Payments Data Rows (up to 15 rows for comprehensive data)
      { name: 'paymentsDate1', type: 'text', position: { x: 112, y: 125 }, width: 20, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      { name: 'paymentsParticulars1', type: 'text', position: { x: 137, y: 125 }, width: 35, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'paymentsRef1', type: 'text', position: { x: 177, y: 125 }, width: 15, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      { name: 'paymentsCash1', type: 'text', position: { x: 197, y: 125 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'paymentsBank1', type: 'text', position: { x: 227, y: 125 }, width: 30, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'paymentsDiscount1', type: 'text', position: { x: 262, y: 125 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'paymentsDate2', type: 'text', position: { x: 112, y: 135 }, width: 20, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      { name: 'paymentsParticulars2', type: 'text', position: { x: 137, y: 135 }, width: 35, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'paymentsRef2', type: 'text', position: { x: 177, y: 135 }, width: 15, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      { name: 'paymentsCash2', type: 'text', position: { x: 197, y: 135 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'paymentsBank2', type: 'text', position: { x: 227, y: 135 }, width: 30, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'paymentsDiscount2', type: 'text', position: { x: 262, y: 135 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'paymentsDate3', type: 'text', position: { x: 112, y: 145 }, width: 20, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      { name: 'paymentsParticulars3', type: 'text', position: { x: 137, y: 145 }, width: 35, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'paymentsRef3', type: 'text', position: { x: 177, y: 145 }, width: 15, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      { name: 'paymentsCash3', type: 'text', position: { x: 197, y: 145 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'paymentsBank3', type: 'text', position: { x: 227, y: 145 }, width: 30, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'paymentsDiscount3', type: 'text', position: { x: 262, y: 145 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'paymentsDate4', type: 'text', position: { x: 112, y: 155 }, width: 20, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      { name: 'paymentsParticulars4', type: 'text', position: { x: 137, y: 155 }, width: 35, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'paymentsRef4', type: 'text', position: { x: 177, y: 155 }, width: 15, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      { name: 'paymentsCash4', type: 'text', position: { x: 197, y: 155 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'paymentsBank4', type: 'text', position: { x: 227, y: 155 }, width: 30, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'paymentsDiscount4', type: 'text', position: { x: 262, y: 155 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      { name: 'paymentsDate5', type: 'text', position: { x: 112, y: 165 }, width: 20, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      { name: 'paymentsParticulars5', type: 'text', position: { x: 137, y: 165 }, width: 35, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'left' },
      { name: 'paymentsRef5', type: 'text', position: { x: 177, y: 165 }, width: 15, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'center' },
      { name: 'paymentsCash5', type: 'text', position: { x: 197, y: 165 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'paymentsBank5', type: 'text', position: { x: 227, y: 165 }, width: 30, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      { name: 'paymentsDiscount5', type: 'text', position: { x: 262, y: 165 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica', alignment: 'right' },
      
      // Payments Total Row
      { name: 'paymentsTotalDate', type: 'text', position: { x: 112, y: 175 }, width: 20, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'paymentsTotalParticulars', type: 'text', position: { x: 137, y: 175 }, width: 35, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'paymentsTotalRef', type: 'text', position: { x: 177, y: 175 }, width: 15, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'center' },
      { name: 'paymentsTotalCash', type: 'text', position: { x: 197, y: 175 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
      { name: 'paymentsTotalBank', type: 'text', position: { x: 227, y: 175 }, width: 30, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
      { name: 'paymentsTotalDiscount', type: 'text', position: { x: 262, y: 175 }, width: 25, height: 5, fontSize: 8, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'right' },
      
      // Watermark
      { name: 'watermarkLogo', type: 'image', position: { x: 60, y: 110 }, width: 100, height: 100, opacity: 0.2 },
      
      // Footer
      { name: 'preparedByLabel', type: 'text', position: { x: 15, y: 280 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'preparedByLine', type: 'line', position: { x: 35, y: 283 }, width: 60, height: 0, color: '#000' },
      { name: 'approvedByLabel', type: 'text', position: { x: 120, y: 280 }, width: 25, height: 5, fontSize: 9, fontColor: '#000', fontName: 'Helvetica-Bold', alignment: 'left' },
      { name: 'approvedByLine', type: 'line', position: { x: 145, y: 283 }, width: 60, height: 0, color: '#000' },
    ]
  ]
};

// Generate Cash Book PDF
export const generateCashBookPDF = async (data: any) => {
  // Fetch watermark image as base64
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

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    if (!amount || amount === 0) return '';
    return `KES ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  // Helper function to get transaction data for a specific row
  const getTransactionData = (transactions: any[], index: number) => {
    if (index >= transactions.length) return { date: '', particulars: '', ref: '', cash: '', bank: '', discount: '' };
    
    const t = transactions[index];
    return {
      date: t.date || '',
      particulars: t.particulars || '',
      ref: t.ref || '',
      cash: formatCurrency(t.cash || 0),
      bank: formatCurrency(t.bank || 0),
      discount: formatCurrency(t.discount || 0)
    };
  };

  // Get receipts and payments data
  const receipts = data.receipts || [];
  const payments = data.payments || [];

  // Calculate totals
  const receiptsTotals = {
    cash: receipts.reduce((sum: number, r: any) => sum + (r.cash || 0), 0),
    bank: receipts.reduce((sum: number, r: any) => sum + (r.bank || 0), 0),
    discount: receipts.reduce((sum: number, r: any) => sum + (r.discount || 0), 0)
  };

  const paymentsTotals = {
    cash: payments.reduce((sum: number, r: any) => sum + (r.cash || 0), 0),
    bank: payments.reduce((sum: number, r: any) => sum + (r.bank || 0), 0),
    discount: payments.reduce((sum: number, r: any) => sum + (r.discount || 0), 0)
  };

  // Get data for each row
  const receiptsRow1 = getTransactionData(receipts, 0);
  const receiptsRow2 = getTransactionData(receipts, 1);
  const receiptsRow3 = getTransactionData(receipts, 2);
  const receiptsRow4 = getTransactionData(receipts, 3);
  const receiptsRow5 = getTransactionData(receipts, 4);

  const paymentsRow1 = getTransactionData(payments, 0);
  const paymentsRow2 = getTransactionData(payments, 1);
  const paymentsRow3 = getTransactionData(payments, 2);
  const paymentsRow4 = getTransactionData(payments, 3);
  const paymentsRow5 = getTransactionData(payments, 4);

  const inputs = [{
    // Company Info
    logo: companyLogoBase64,
    companyName: data.companyName,
    companyLocation: data.companyLocation,
    companyPhone: data.companyPhone,
    companyEmail: data.companyEmail,
    
    // Report Header
    reportTitle: data.reportTitle,
    reportDateLabel: 'Date:',
    reportDateValue: data.reportDate,
    reportPeriodLabel: 'Period:',
    reportPeriodValue: data.reportPeriod,
    reportNumberLabel: 'Report No:',
    reportNumberValue: data.reportNumber,
    
    // Receipts Section
    receiptsHeader: 'Receipts (Dr.)',
    receiptsDateHeader: 'Date',
    receiptsParticularsHeader: 'Particulars',
    receiptsRefHeader: 'REF:',
    receiptsCashHeader: 'Cash (KES)',
    receiptsBankHeader: 'Cooperative Bank (KES)',
    receiptsDiscountHeader: 'Discount Allowed (KES)',
    
    // Receipts Data Rows
    receiptsDate1: receiptsRow1.date,
    receiptsParticulars1: receiptsRow1.particulars,
    receiptsRef1: receiptsRow1.ref,
    receiptsCash1: receiptsRow1.cash,
    receiptsBank1: receiptsRow1.bank,
    receiptsDiscount1: receiptsRow1.discount,
    
    receiptsDate2: receiptsRow2.date,
    receiptsParticulars2: receiptsRow2.particulars,
    receiptsRef2: receiptsRow2.ref,
    receiptsCash2: receiptsRow2.cash,
    receiptsBank2: receiptsRow2.bank,
    receiptsDiscount2: receiptsRow2.discount,
    
    receiptsDate3: receiptsRow3.date,
    receiptsParticulars3: receiptsRow3.particulars,
    receiptsRef3: receiptsRow3.ref,
    receiptsCash3: receiptsRow3.cash,
    receiptsBank3: receiptsRow3.bank,
    receiptsDiscount3: receiptsRow3.discount,
    
    receiptsDate4: receiptsRow4.date,
    receiptsParticulars4: receiptsRow4.particulars,
    receiptsRef4: receiptsRow4.ref,
    receiptsCash4: receiptsRow4.cash,
    receiptsBank4: receiptsRow4.bank,
    receiptsDiscount4: receiptsRow4.discount,
    
    receiptsDate5: receiptsRow5.date,
    receiptsParticulars5: receiptsRow5.particulars,
    receiptsRef5: receiptsRow5.ref,
    receiptsCash5: receiptsRow5.cash,
    receiptsBank5: receiptsRow5.bank,
    receiptsDiscount5: receiptsRow5.discount,
    
    // Receipts Total Row
    receiptsTotalDate: '',
    receiptsTotalParticulars: 'Total',
    receiptsTotalRef: '',
    receiptsTotalCash: formatCurrency(receiptsTotals.cash),
    receiptsTotalBank: formatCurrency(receiptsTotals.bank),
    receiptsTotalDiscount: formatCurrency(receiptsTotals.discount),
    
    // Payments Section
    paymentsHeader: 'Payments (Cr.)',
    paymentsDateHeader: 'Date',
    paymentsParticularsHeader: 'Particulars',
    paymentsRefHeader: 'REF:',
    paymentsCashHeader: 'Cash (KES)',
    paymentsBankHeader: 'Cooperative Bank (KES)',
    paymentsDiscountHeader: 'Discount Received (KES)',
    
    // Payments Data Rows
    paymentsDate1: paymentsRow1.date,
    paymentsParticulars1: paymentsRow1.particulars,
    paymentsRef1: paymentsRow1.ref,
    paymentsCash1: paymentsRow1.cash,
    paymentsBank1: paymentsRow1.bank,
    paymentsDiscount1: paymentsRow1.discount,
    
    paymentsDate2: paymentsRow2.date,
    paymentsParticulars2: paymentsRow2.particulars,
    paymentsRef2: paymentsRow2.ref,
    paymentsCash2: paymentsRow2.cash,
    paymentsBank2: paymentsRow2.bank,
    paymentsDiscount2: paymentsRow2.discount,
    
    paymentsDate3: paymentsRow3.date,
    paymentsParticulars3: paymentsRow3.particulars,
    paymentsRef3: paymentsRow3.ref,
    paymentsCash3: paymentsRow3.cash,
    paymentsBank3: paymentsRow3.bank,
    paymentsDiscount3: paymentsRow3.discount,
    
    paymentsDate4: paymentsRow4.date,
    paymentsParticulars4: paymentsRow4.particulars,
    paymentsRef4: paymentsRow4.ref,
    paymentsCash4: paymentsRow4.cash,
    paymentsBank4: paymentsRow4.bank,
    paymentsDiscount4: paymentsRow4.discount,
    
    paymentsDate5: paymentsRow5.date,
    paymentsParticulars5: paymentsRow5.particulars,
    paymentsRef5: paymentsRow5.ref,
    paymentsCash5: paymentsRow5.cash,
    paymentsBank5: paymentsRow5.bank,
    paymentsDiscount5: paymentsRow5.discount,
    
    // Payments Total Row
    paymentsTotalDate: '',
    paymentsTotalParticulars: 'Total',
    paymentsTotalRef: '',
    paymentsTotalCash: formatCurrency(paymentsTotals.cash),
    paymentsTotalBank: formatCurrency(paymentsTotals.bank),
    paymentsTotalDiscount: formatCurrency(paymentsTotals.discount),
    
    // Footer
    preparedByLabel: `Prepared by: ${data.preparedBy}`,
    approvedByLabel: `Approved by: ${data.approvedBy}`,
    
    // Watermark
    watermarkLogo: watermarkLogoBase64,
  }];

  return { template: cashBookTemplate, inputs };
};
