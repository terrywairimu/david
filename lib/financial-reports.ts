import { createClient } from '@supabase/supabase-js';

// Financial Report Types
export interface ProfitLossData {
  reportTitle: string;
  reportDate: string;
  reportPeriod: string;
  reportNumber: string;
  companyName: string;
  companyLocation: string;
  companyPhone: string;
  companyEmail: string;
  preparedBy: string;
  approvedBy: string;
  
  // Revenue Section
  revenue: {
    sales: number;
    otherIncome: number;
    totalRevenue: number;
  };
  
  // Cost of Goods Sold
  costOfGoodsSold: {
    openingInventory: number;
    purchases: number;
    closingInventory: number;
    totalCostOfGoodsSold: number;
  };
  
  // Gross Profit
  grossProfit: number;
  
  // Operating Expenses
  operatingExpenses: {
    salaries: number;
    rent: number;
    utilities: number;
    supplies: number;
    fuel: number;
    other: number;
    totalOperatingExpenses: number;
  };
  
  // Operating Income
  operatingIncome: number;
  
  // Net Income
  netIncome: number;
}

export interface BalanceSheetData {
  reportTitle: string;
  reportDate: string;
  reportNumber: string;
  companyName: string;
  companyLocation: string;
  companyPhone: string;
  companyEmail: string;
  preparedBy: string;
  approvedBy: string;
  
  // Assets
  assets: {
    current: {
      cash: number;
      bank: number;
      accountsReceivable: number;
      inventory: number;
      prepaidExpenses: number;
      totalCurrentAssets: number;
    };
    fixed: {
      equipment: number;
      furniture: number;
      vehicles: number;
      totalFixedAssets: number;
    };
    totalAssets: number;
  };
  
  // Liabilities
  liabilities: {
    current: {
      accountsPayable: number;
      accruedExpenses: number;
      shortTermLoans: number;
      totalCurrentLiabilities: number;
    };
    longTerm: {
      longTermLoans: number;
      totalLongTermLiabilities: number;
    };
    totalLiabilities: number;
  };
  
  // Equity
  equity: {
    capital: number;
    retainedEarnings: number;
    currentYearEarnings: number;
    totalEquity: number;
  };
}

export interface CashFlowData {
  reportTitle: string;
  reportDate: string;
  reportPeriod: string;
  reportNumber: string;
  companyName: string;
  companyLocation: string;
  companyPhone: string;
  companyEmail: string;
  preparedBy: string;
  approvedBy: string;
  
  // Operating Activities
  operatingActivities: {
    netIncome: number;
    adjustments: {
      depreciation: number;
      changesInWorkingCapital: number;
    };
    netCashFromOperations: number;
  };
  
  // Investing Activities
  investingActivities: {
    equipmentPurchases: number;
    vehiclePurchases: number;
    netCashFromInvesting: number;
  };
  
  // Financing Activities
  financingActivities: {
    capitalContributions: number;
    loanProceeds: number;
    loanRepayments: number;
    netCashFromFinancing: number;
  };
  
  // Net Change in Cash
  netChangeInCash: number;
  beginningCash: number;
  endingCash: number;
}

// Financial Calculation Functions
export class FinancialCalculator {
  private supabase: any;
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  
  // Calculate Profit & Loss Statement
  async calculateProfitLoss(startDate: string, endDate: string): Promise<ProfitLossData> {
    try {
      // Get sales data from sales_orders table (actual sales, not quotations)
      const { data: salesData, error: salesError } = await this.supabase
        .from('sales_orders')
        .select('total_amount, grand_total, date_created, status')
        .gte('date_created', startDate)
        .lte('date_created', endDate);
      
      if (salesError) {
        console.error('Sales query error:', salesError);
      }
      
      // Calculate total sales - use grand_total if available, otherwise total_amount
      const totalSales = salesData?.reduce((sum: number, item: any) => {
        const amount = parseFloat(item.grand_total) || parseFloat(item.total_amount) || 0;
        return sum + amount;
      }, 0) || 0;
      
      console.log('Sales Data Debug:', {
        salesDataCount: salesData?.length || 0,
        totalSales,
        startDate,
        endDate,
        sampleSales: salesData?.slice(0, 3),
        salesError: salesError?.message
      });
      
      // Get expense data by category
      const { data: expenseData, error: expenseError } = await this.supabase
        .from('expenses')
        .select('category, amount, date_created')
        .gte('date_created', startDate)
        .lte('date_created', endDate);
      
      if (expenseError) {
        console.error('Expense query error:', expenseError);
      }
      
      const expensesByCategory = this.categorizeExpenses(expenseData);
      
      console.log('Expense Data Debug:', {
        expenseDataCount: expenseData?.length || 0,
        expensesByCategory,
        startDate,
        endDate,
        expenseError: expenseError?.message
      });
      
      // Get inventory data
      const { data: inventoryData, error: inventoryError } = await this.supabase
        .from('stock_items')
        .select('quantity, unit_price, name');
      
      if (inventoryError) {
        console.error('Inventory query error:', inventoryError);
      }
      
      const openingInventory = this.calculateInventoryValue(inventoryData, 'opening');
      const closingInventory = this.calculateInventoryValue(inventoryData, 'closing');
      
      console.log('Inventory Data Debug:', {
        inventoryDataCount: inventoryData?.length || 0,
        openingInventory,
        closingInventory,
        sampleInventory: inventoryData?.slice(0, 3),
        inventoryError: inventoryError?.message
      });
      
      // Get purchase data
      const { data: purchaseData, error: purchaseError } = await this.supabase
        .from('purchases')
        .select('total_amount, purchase_date')
        .gte('purchase_date', startDate)
        .lte('purchase_date', endDate);
      
      if (purchaseError) {
        console.error('Purchase query error:', purchaseError);
      }
      
      const totalPurchases = purchaseData?.reduce((sum: number, item: any) => 
        sum + (parseFloat(item.total_amount) || 0), 0) || 0;
      
      console.log('Purchase Data Debug:', {
        purchaseDataCount: purchaseData?.length || 0,
        totalPurchases,
        startDate,
        endDate,
        samplePurchases: purchaseData?.slice(0, 3),
        purchaseError: purchaseError?.message
      });
      
      // Calculate COGS
      const costOfGoodsSold = openingInventory + totalPurchases - closingInventory;
      
      // Calculate gross profit
      const grossProfit = totalSales - costOfGoodsSold;
      
      console.log('Calculated Values Debug:', {
        totalSales,
        openingInventory,
        totalPurchases,
        closingInventory,
        costOfGoodsSold,
        grossProfit
      });
      
      // Calculate operating expenses
      const totalOperatingExpenses = Object.values(expensesByCategory).reduce((sum: number, amount: number) => sum + amount, 0);
      
      // Calculate operating income
      const operatingIncome = grossProfit - totalOperatingExpenses;
      
      // Net income (assuming no other income/expenses for now)
      const netIncome = operatingIncome;
      
      return {
        reportTitle: 'Profit & Loss Statement',
        reportDate: new Date().toLocaleDateString(),
        reportPeriod: `${startDate} to ${endDate}`,
        reportNumber: `P&L-${new Date().getFullYear()}-${new Date().getMonth() + 1}`,
        companyName: 'CABINET MASTER STYLES & FINISHES',
        companyLocation: 'Location: Ruiru Eastern By-Pass',
        companyPhone: 'Tel: +254729554475',
        companyEmail: 'Email: cabinetmasterstyles@gmail.com',
        preparedBy: 'Prepared By',
        approvedBy: 'Approved By',
        
        revenue: {
          sales: totalSales,
          otherIncome: 0,
          totalRevenue: totalSales
        },
        
        costOfGoodsSold: {
          openingInventory,
          purchases: totalPurchases,
          closingInventory,
          totalCostOfGoodsSold: costOfGoodsSold
        },
        
        grossProfit,
        
        operatingExpenses: {
          salaries: expensesByCategory.salaries || 0,
          rent: expensesByCategory.rent || 0,
          utilities: expensesByCategory.utilities || 0,
          supplies: expensesByCategory.supplies || 0,
          fuel: expensesByCategory.fuel || 0,
          other: expensesByCategory.other || 0,
          totalOperatingExpenses
        },
        
        operatingIncome,
        netIncome
      };
    } catch (error) {
      console.error('Error calculating Profit & Loss:', error);
      throw error;
    }
  }
  
  // Calculate Balance Sheet
  async calculateBalanceSheet(asOfDate: string): Promise<BalanceSheetData> {
    try {
      // Get account balances
      const { data: accountBalances } = await this.supabase
        .from('account_balances')
        .select('account_type, current_balance');
      
      const balances = accountBalances?.reduce((acc: any, item: any) => {
        acc[item.account_type] = parseFloat(item.current_balance) || 0;
        return acc;
      }, {}) || {};
      
      // Get accounts receivable (from quotations)
      const { data: receivablesData } = await this.supabase
        .from('quotations')
        .select('total_amount, status')
        .eq('status', 'converted_to_sales_order');
      
      const accountsReceivable = receivablesData?.reduce((sum: number, item: any) => 
        sum + (parseFloat(item.total_amount) || 0), 0) || 0;
      
      // Get inventory value
      const { data: inventoryData } = await this.supabase
        .from('stock_items')
        .select('quantity, unit_cost');
      
      const inventoryValue = this.calculateInventoryValue(inventoryData, 'current');
      
      // Calculate current assets
      const currentAssets = {
        cash: balances.cash || 0,
        bank: balances.cooperative_bank || 0,
        mpesa: balances.mpesa || 0,
        petty_cash: balances.petty_cash || 0,
        accountsReceivable,
        inventory: inventoryValue,
        prepaidExpenses: 0, // Not tracked in current system
        totalCurrentAssets: 0
      };
      currentAssets.totalCurrentAssets = Object.values(currentAssets).reduce((sum: number, val: number) => sum + val, 0);
      
      // Fixed assets (estimated - not tracked in current system)
      const fixedAssets = {
        equipment: 50000, // Estimated
        furniture: 25000, // Estimated
        vehicles: 0, // Not tracked
        totalFixedAssets: 0
      };
      fixedAssets.totalFixedAssets = Object.values(fixedAssets).reduce((sum: number, val: number) => sum + val, 0);
      
      const totalAssets = currentAssets.totalCurrentAssets + fixedAssets.totalFixedAssets;
      
      // Liabilities (estimated - not tracked in current system)
      const liabilities = {
        current: {
          accountsPayable: 0, // Not tracked
          accruedExpenses: 0, // Not tracked
          shortTermLoans: 0, // Not tracked
          totalCurrentLiabilities: 0
        },
        longTerm: {
          longTermLoans: 0, // Not tracked
          totalLongTermLiabilities: 0
        },
        totalLiabilities: 0
      };
      
      liabilities.current.totalCurrentLiabilities = Object.values(liabilities.current).reduce((sum: number, val: number) => sum + val, 0);
      liabilities.longTerm.totalLongTermLiabilities = Object.values(liabilities.longTerm).reduce((sum: number, val: number) => sum + val, 0);
      liabilities.totalLiabilities = liabilities.current.totalCurrentLiabilities + liabilities.longTerm.totalLongTermLiabilities;
      
      // Equity
      const equity = {
        capital: 100000, // Estimated starting capital
        retainedEarnings: 0, // Would need historical data
        currentYearEarnings: 0, // Would need P&L calculation
        totalEquity: 0
      };
      
      // Calculate current year earnings from P&L
      const currentYear = new Date().getFullYear();
      const pnlData = await this.calculateProfitLoss(`${currentYear}-01-01`, `${currentYear}-12-31`);
      equity.currentYearEarnings = pnlData.netIncome;
      
      equity.totalEquity = equity.capital + equity.retainedEarnings + equity.currentYearEarnings;
      
      return {
        reportTitle: 'Balance Sheet',
        reportDate: asOfDate,
        reportNumber: `BS-${new Date().getFullYear()}-${new Date().getMonth() + 1}`,
        companyName: 'CABINET MASTER STYLES & FINISHES',
        companyLocation: 'Location: Ruiru Eastern By-Pass',
        companyPhone: 'Tel: +254729554475',
        companyEmail: 'Email: cabinetmasterstyles@gmail.com',
        preparedBy: 'Prepared By',
        approvedBy: 'Approved By',
        
        assets: {
          current: currentAssets,
          fixed: fixedAssets,
          totalAssets
        },
        
        liabilities,
        equity
      };
    } catch (error) {
      console.error('Error calculating Balance Sheet:', error);
      throw error;
    }
  }
  
  // Calculate Cash Flow Statement
  async calculateCashFlow(startDate: string, endDate: string): Promise<CashFlowData> {
    try {
      // Get net income from P&L
      const pnlData = await this.calculateProfitLoss(startDate, endDate);
      const netIncome = pnlData.netIncome;
      
      // Get cash transactions
      const { data: cashTransactions } = await this.supabase
        .from('account_transactions')
        .select('transaction_type, account_type, amount, description, transaction_date')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .in('account_type', ['cash', 'cooperative_bank']);
      
      // Calculate cash flows by activity
      const operatingCashFlow = this.calculateOperatingCashFlow(cashTransactions, netIncome);
      const investingCashFlow = this.calculateInvestingCashFlow(cashTransactions);
      const financingCashFlow = this.calculateFinancingCashFlow(cashTransactions);
      
      // Get beginning and ending cash balances
      const { data: accountBalances } = await this.supabase
        .from('account_balances')
        .select('account_type, current_balance')
        .in('account_type', ['cash', 'cooperative_bank']);
      
      const endingCash = accountBalances?.reduce((sum: number, item: any) => 
        sum + (parseFloat(item.current_balance) || 0), 0) || 0;
      
      const beginningCash = endingCash - operatingCashFlow - investingCashFlow - financingCashFlow;
      const netChangeInCash = endingCash - beginningCash;
      
      return {
        reportTitle: 'Cash Flow Statement',
        reportDate: new Date().toLocaleDateString(),
        reportPeriod: `${startDate} to ${endDate}`,
        reportNumber: `CF-${new Date().getFullYear()}-${new Date().getMonth() + 1}`,
        companyName: 'CABINET MASTER STYLES & FINISHES',
        companyLocation: 'Location: Ruiru Eastern By-Pass',
        companyPhone: 'Tel: +254729554475',
        companyEmail: 'Email: cabinetmasterstyles@gmail.com',
        preparedBy: 'Prepared By',
        approvedBy: 'Approved By',
        
        operatingActivities: {
          netIncome,
          adjustments: {
            depreciation: 0, // Not tracked in current system
            changesInWorkingCapital: 0 // Would need detailed analysis
          },
          netCashFromOperations: operatingCashFlow
        },
        
        investingActivities: {
          equipmentPurchases: 0, // Would need asset tracking
          vehiclePurchases: 0, // Would need asset tracking
          netCashFromInvesting: investingCashFlow
        },
        
        financingActivities: {
          capitalContributions: 0, // Would need equity tracking
          loanProceeds: 0, // Would need liability tracking
          loanRepayments: 0, // Would need liability tracking
          netCashFromFinancing: financingCashFlow
        },
        
        netChangeInCash,
        beginningCash,
        endingCash
      };
    } catch (error) {
      console.error('Error calculating Cash Flow:', error);
      throw error;
    }
  }
  
  // Helper Methods
  private categorizeExpenses(expenseData: any[]): Record<string, number> {
    const categories: Record<string, number> = {};
    
    expenseData?.forEach(expense => {
      const category = expense.category || 'other';
      const amount = parseFloat(expense.amount) || 0;
      
      if (categories[category]) {
        categories[category] += amount;
      } else {
        categories[category] = amount;
      }
    });
    
    return categories;
  }
  
  private calculateInventoryValue(inventoryData: any[], type: 'opening' | 'closing' | 'current'): number {
    if (!inventoryData) return 0;
    
    console.log('Inventory Calculation Debug:', {
      type,
      inventoryDataCount: inventoryData.length,
      sampleItems: inventoryData.slice(0, 3)
    });
    
    const totalValue = inventoryData.reduce((total: number, item: any) => {
      const quantity = parseInt(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      const itemValue = quantity * unitPrice;
      
      console.log('Item calculation:', {
        name: item.name,
        quantity,
        unitPrice,
        itemValue
      });
      
      return total + itemValue;
    }, 0);
    
    console.log('Total inventory value:', totalValue);
    return totalValue;
  }
  
  private calculateOperatingCashFlow(transactions: any[], netIncome: number): number {
    if (!transactions) return netIncome;
    
    // Filter operating transactions (sales, expenses, etc.)
    const operatingTransactions = transactions.filter(t => 
      t.description?.toLowerCase().includes('sale') ||
      t.description?.toLowerCase().includes('expense') ||
      t.description?.toLowerCase().includes('purchase')
    );
    
    return operatingTransactions.reduce((sum: number, t: any) => {
      const amount = parseFloat(t.amount) || 0;
      return t.transaction_type === 'in' ? sum + amount : sum - amount;
    }, netIncome);
  }
  
  private calculateInvestingCashFlow(transactions: any[]): number {
    if (!transactions) return 0;
    
    // Filter investing transactions (asset purchases, etc.)
    const investingTransactions = transactions.filter(t => 
      t.description?.toLowerCase().includes('equipment') ||
      t.description?.toLowerCase().includes('vehicle') ||
      t.description?.toLowerCase().includes('asset')
    );
    
    return investingTransactions.reduce((sum: number, t: any) => {
      const amount = parseFloat(t.amount) || 0;
      return t.transaction_type === 'out' ? sum - amount : sum + amount;
    }, 0);
  }
  
  private calculateFinancingCashFlow(transactions: any[]): number {
    if (!transactions) return 0;
    
    // Filter financing transactions (loans, capital, etc.)
    const financingTransactions = transactions.filter(t => 
      t.description?.toLowerCase().includes('loan') ||
      t.description?.toLowerCase().includes('capital') ||
      t.description?.toLowerCase().includes('investment')
    );
    
    return financingTransactions.reduce((sum: number, t: any) => {
      const amount = parseFloat(t.amount) || 0;
      return t.transaction_type === 'in' ? sum + amount : sum - amount;
    }, 0);
  }
}

// Export the calculator instance
export const financialCalculator = new FinancialCalculator();

// Test function for debugging
export async function testProfitLossCalculation() {
  try {
    console.log('Testing Profit & Loss calculation...');
    
    // Test with July 2025 where we know there's data
    const startDate = '2025-07-01';
    const endDate = '2025-07-31';
    
    console.log('Test date range:', startDate, 'to', endDate);
    
    const result = await financialCalculator.calculateProfitLoss(startDate, endDate);
    
    console.log('Profit & Loss calculation result:', result);
    
    return result;
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}
