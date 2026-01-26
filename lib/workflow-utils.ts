import { supabase, NumberGenerationService } from "./supabase-client"
import { toast } from "sonner"

// Stock management helper functions
const updateStockQuantity = async (stockItemId: number, quantityChange: number, referenceType: string, referenceId: number, notes: string) => {
  try {
    console.log(`Updating stock for item ID: ${stockItemId}, quantity change: ${quantityChange}`);
    
    // Get current stock level
    const { data: stockItem, error: fetchError } = await supabase
      .from("stock_items")
      .select("quantity, name")
      .eq("id", stockItemId)
      .single()

    if (fetchError) {
      console.error("Error fetching stock item:", fetchError);
      throw fetchError;
    }

    console.log(`Current stock for ${stockItem.name}: ${stockItem.quantity}`);

    // Calculate new quantity
    const newQuantity = Math.max(0, (stockItem.quantity || 0) + quantityChange)

    console.log(`Updating to new quantity: ${newQuantity}`);

    // Update stock quantity
    const { error: updateError } = await supabase
      .from("stock_items")
      .update({ quantity: newQuantity })
      .eq("id", stockItemId)

    if (updateError) {
      console.error("Error updating stock quantity:", updateError);
      throw updateError;
    }

    // Record stock movement
    const { error: movementError } = await supabase
      .from("stock_movements")
      .insert({
        stock_item_id: stockItemId,
        movement_type: quantityChange > 0 ? "in" : "out",
        quantity: Math.abs(quantityChange),
        reference_type: referenceType,
        reference_id: referenceId,
        notes: notes
      })

    if (movementError) {
      console.error("Error creating stock movement:", movementError);
      // Don't throw error for movement tracking, just log it
    }

    console.log(`Successfully updated stock for ${stockItem.name}: ${stockItem.quantity} + ${quantityChange} = ${newQuantity}`);
    return { success: true, newQuantity, itemName: stockItem.name };
  } catch (error) {
    console.error("Error updating stock for item:", stockItemId, error);
    throw error;
  }
}

const deductStockFromItems = async (items: any[], referenceType: string, referenceId: number, referenceNumber: string) => {
  const results = [];
  
  for (const item of items) {
    if (item.stock_item_id && item.quantity > 0) {
      try {
        const result = await updateStockQuantity(
          item.stock_item_id,
          -item.quantity, // Deduct quantity (negative)
          referenceType,
          referenceId,
          `${referenceType}: ${referenceNumber}`
        );
        results.push({ success: true, item: item.description, result });
        toast.success(`Stock deducted for ${item.description}: -${item.quantity}`);
      } catch (error) {
        console.error(`Error deducting stock for ${item.description}:`, error);
        results.push({ 
          success: false, 
          item: item.description, 
          error: error instanceof Error ? error.message : String(error) 
        });
        toast.error(`Failed to deduct stock for ${item.description}: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      console.log(`Skipping stock deduction for item without stock_item_id or zero quantity:`, item);
      results.push({ success: true, item: item.description, skipped: true });
    }
  }
  
  return results;
}

const addStockToItems = async (items: any[], referenceType: string, referenceId: number, referenceNumber: string) => {
  const results = [];
  
  for (const item of items) {
    if (item.stock_item_id && item.quantity > 0) {
      try {
        const result = await updateStockQuantity(
          item.stock_item_id,
          item.quantity, // Add quantity (positive)
          referenceType,
          referenceId,
          `${referenceType}: ${referenceNumber}`
        );
        results.push({ success: true, item: item.description, result });
        toast.success(`Stock added for ${item.description}: +${item.quantity}`);
      } catch (error) {
        console.error(`Error adding stock for ${item.description}:`, error);
        results.push({ 
          success: false, 
          item: item.description, 
          error: error instanceof Error ? error.message : String(error) 
        });
        toast.error(`Failed to add stock for ${item.description}: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      console.log(`Skipping stock addition for item without stock_item_id or zero quantity:`, item);
      results.push({ success: true, item: item.description, skipped: true });
    }
  }
  
  return results;
}

// Helper function to handle stock adjustments when editing purchases
export const adjustStockForPurchaseEdit = async (originalItems: any[], newItems: any[], purchaseId: number, purchaseNumber: string) => {
  try {
    console.log(`🔄 Adjusting stock for purchase edit: ${purchaseNumber}`);
    
    // First, subtract original quantities (reverse the original purchase)
    if (originalItems && originalItems.length > 0) {
      console.log(`📤 Reversing original stock additions for ${originalItems.length} items...`);
      await deductStockFromItems(originalItems, "purchase_reversal", purchaseId, purchaseNumber);
    }
    
    // Then, add new quantities
    if (newItems && newItems.length > 0) {
      console.log(`📥 Adding new stock quantities for ${newItems.length} items...`);
      await addStockToItems(newItems, "purchase", purchaseId, purchaseNumber);
    }
    
    console.log(`✅ Stock adjustment completed for purchase ${purchaseNumber}`);
    return { success: true };
  } catch (error) {
    console.error("Error adjusting stock for purchase edit:", error);
    toast.error("Purchase updated but stock adjustment failed. Please check stock levels manually.");
    return { success: false, error };
  }
}

// Progress tracking for exports
let globalProgressManager: any = null;

// Function to get the global progress manager
const getProgressManager = () => {
  if (globalProgressManager) return globalProgressManager;
  
  // Try to get it from the GlobalProgressManager component
  try {
    // Use dynamic import to avoid circular dependencies
    if (typeof window !== 'undefined') {
      // Try to access the global instance from the window object
      if ((window as any).__PROGRESS_MANAGER__) {
        globalProgressManager = (window as any).__PROGRESS_MANAGER__;
        return globalProgressManager;
      }
      
      // Fallback: try to find the progress manager element
      const progressManagerElement = document.querySelector('[data-progress-manager]');
      if (progressManagerElement) {
        // The progress manager will be set when the component mounts
        return null;
      }
    }
    return null;
  } catch (error) {
    console.warn('Progress manager not available:', error);
    return null;
  }
};

const startProgress = (fileName: string, fileType: 'pdf' | 'csv') => {
  const manager = getProgressManager();
  if (manager) {
    manager.startDownload(fileName, fileType);
  }
};

const completeProgress = () => {
  const manager = getProgressManager();
  if (manager) {
    manager.completeDownload();
  }
};

const setProgressError = (message: string) => {
  const manager = getProgressManager();
  if (manager) {
    manager.setError(message);
  }
};

// Pagination constants for PDF exports (matching quotation PDF layout)
const pageHeight = 297; // mm
const topMargin = 20; // mm
const headerHeight = 60; // mm - header block (first page only)
const tableHeaderHeight = 10; // mm
const bottomMargin = 15; // mm
const rowHeight = 8; // mm
const firstPageReservedSpace = 16; // mm - reserve space for better spacing
const firstPageAvailable = pageHeight - topMargin - headerHeight - tableHeaderHeight - bottomMargin - firstPageReservedSpace;
const firstPageRows = Math.floor(firstPageAvailable / rowHeight);

// Number generation functions
export const generatePaymentNumber = async () => {
  try {
    const currentDate = new Date()
    const year = currentDate.getFullYear().toString().slice(-2) // Last 2 digits
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
    const prefix = `PN${year}${month}`
    
    // Get the highest payment number for the current month ONLY
    const { data, error } = await supabase
      .from('payments')
      .select('payment_number')
      .like('payment_number', `${prefix}%`)
      .order('payment_number', { ascending: false })
      .limit(1)
    
    if (error) throw error
    
    if (data && data.length > 0) {
      const lastNumber = data[0].payment_number
      // Extract the sequential part from PNYYMMNNN format
      const sequentialPart = lastNumber.slice(-3)
      const nextNumber = parseInt(sequentialPart) + 1
      return `${prefix}${nextNumber.toString().padStart(3, '0')}`
    }
    
    // First payment of the month - start from 001
    return `${prefix}001`
  } catch (error) {
    console.error('Error generating payment number:', error)
    const currentDate = new Date()
    const year = currentDate.getFullYear().toString().slice(-2)
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
    const timestamp = Date.now().toString().slice(-3)
    return `PN${year}${month}${timestamp}`
  }
}

export const generateEmployeePaymentNumber = async () => {
  try {
    const currentDate = new Date()
    const year = currentDate.getFullYear().toString().slice(-2) // Last 2 digits
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
    const prefix = `PNE${year}${month}`
    
    // Get the highest payment number for the current month ONLY
    const { data, error } = await supabase
      .from('employee_payments')
      .select('payment_number')
      .like('payment_number', `${prefix}%`)
      .order('payment_number', { ascending: false })
      .limit(1)
    
    if (error) throw error
    
    if (data && data.length > 0) {
      const lastNumber = data[0].payment_number
      // Extract the sequential part from PNEYYMMNNN format
      const sequentialPart = lastNumber.slice(-3)
      const nextNumber = parseInt(sequentialPart) + 1
      return `${prefix}${nextNumber.toString().padStart(3, '0')}`
    }
    
    // First payment of the month - start from 001
    return `${prefix}001`
  } catch (error) {
    console.error('Error generating employee payment number:', error)
    const currentDate = new Date()
    const year = currentDate.getFullYear().toString().slice(-2)
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
    const timestamp = Date.now().toString().slice(-3)
    return `PNE${year}${month}${timestamp}`
  }
}

export const generateSupplierPaymentNumber = async () => {
  try {
    // Get the highest payment number from all supplier payments
    const { data, error } = await supabase
      .from('supplier_payments')
      .select('payment_number')
      .order('payment_number', { ascending: false })
      .limit(1)
    
    if (error) throw error
    
    if (data && data.length > 0) {
      const lastNumber = data[0].payment_number
      // Extract the sequential part from PNS2509NNN format
      const sequentialPart = lastNumber.slice(-3)
      const nextNumber = parseInt(sequentialPart) + 1
      return `PNS2509${nextNumber.toString().padStart(3, '0')}`
    }
    
    // First payment - start from PNS2509001
    return `PNS2509001`
  } catch (error) {
    console.error('Error generating supplier payment number:', error)
    // Fallback to timestamp-based number
    const timestamp = Date.now().toString().slice(-3)
    return `PNS2509${timestamp}`
  }
}

export const generateExpenseNumber = async (type: 'client' | 'company') => {
  try {
    const currentDate = new Date()
    const year = currentDate.getFullYear().toString().slice(-2) // Last 2 digits
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
    const prefix = `EN${year}${month}`
    
    // Get the highest expense number for the current month ONLY
    const { data, error } = await supabase
      .from('expenses')
      .select('expense_number')
      .like('expense_number', `${prefix}%`)
      .order('expense_number', { ascending: false })
      .limit(1)
    
    if (error) throw error
    
    if (data && data.length > 0) {
      const lastNumber = data[0].expense_number
      // Extract the sequential part from ENYYMMNNN format
      const sequentialPart = lastNumber.slice(-3)
      const nextNumber = parseInt(sequentialPart) + 1
      return `${prefix}${nextNumber.toString().padStart(3, '0')}`
    }
    
    // First expense of the month - start from 001
    return `${prefix}001`
  } catch (error) {
    console.error('Error generating expense number:', error)
    const currentDate = new Date()
    const year = currentDate.getFullYear().toString().slice(-2)
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
    const timestamp = Date.now().toString().slice(-3)
    return `EN${year}${month}${timestamp}`
  }
}

// Export functions
export const exportQuotations = async (quotations: any[], format: 'pdf' | 'csv' = 'pdf') => {
  try {
    // Start progress tracking
    startProgress(`quotations_report_${new Date().toISOString().split('T')[0]}`, format);
    
    if (format === 'pdf') {
      // Use the new dynamic template system with pagination support
      const { generateDynamicTemplateWithPagination } = await import('./report-pdf-templates')
      
      // Get custom table headers for quotations
      const customTableHeaders = ['Quotation #', 'Date', 'Client', 'Total Amount', 'Status'];
      
      // Generate dynamic template with pagination
      const template = generateDynamicTemplateWithPagination(quotations.length, customTableHeaders, 'quotations');
      
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

      // Create inputs with actual data
      const inputs = [{
        // Company Info
        logo: companyLogoBase64,
        companyName: "CABINET MASTER STYLES & FINISHES",
        companyLocation: "Location: Ruiru Eastern By-Pass",
        companyPhone: "Tel: +254729554475",
        companyEmail: "Email: cabinetmasterstyles@gmail.com",
        
        // Report Header - Changed to "QUOTATIONS REPORT"
        reportTitle: "QUOTATIONS REPORT",
        reportDateLabel: 'Date:',
        reportDateValue: new Date().toLocaleDateString(),
        reportPeriodLabel: 'Period:',
        reportPeriodValue: "All Time",
        reportTypeLabel: 'Type:',
        reportTypeValue: "Quotations",
        
        // Real Data Rows (populated with actual data from quotations array)
        ...quotations.map((quotation, index) => ({
          [`quotationNumber_${index}`]: String(quotation.quotation_number || 'N/A'),
          [`date_${index}`]: new Date(quotation.date_created).toLocaleDateString(),
          [`client_${index}`]: String(quotation.client?.name || 'Unknown'),
          [`totalAmount_${index}`]: `KES ${(quotation.grand_total || 0).toFixed(2)}`,
          [`status_${index}`]: String(quotation.status || 'Active')
        })).reduce((acc, item) => ({ ...acc, ...item }), {}),
        
        // Footer
        summaryTitle: 'Summary:',
        summaryContent: `Total Quotations: ${quotations.length}`,
        totalLabel: 'Total:',
        totalValue: `KES ${quotations.reduce((sum, quotation) => sum + (quotation.grand_total || 0), 0).toFixed(2)}`,
        preparedByLabel: `Prepared by: System`,
        approvedByLabel: `Approved by: System`,
        
        // Watermark - map to all pages
        ...Array.from({ length: Math.ceil(quotations.length / firstPageRows) + 1 }, (_, i) => ({
          [`watermarkLogo_${i}`]: watermarkLogoBase64
        })).reduce((acc, item) => ({ ...acc, ...item }), {}),
      }];
      
      // Generate and download the PDF
      const { generate } = await import('@pdfme/generator')
      const { text, rectangle, line, image } = await import('@pdfme/schemas')
      const pdf = await generate({ template, inputs, plugins: { text, rectangle, line, image } as any })
      
      // Download PDF
      const blob = new Blob([new Uint8Array(pdf.buffer)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `quotations_report_${Date.now()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('Quotations exported successfully!')
      // Complete progress tracking
      completeProgress();
    } else {
      // CSV export
      const headers = ['Quotation #', 'Date', 'Client', 'Total Amount', 'Status']
      const csvContent = [
        headers.join(','),
        ...quotations.map(quotation => [
          quotation.quotation_number,
          new Date(quotation.date_created).toLocaleDateString(),
          quotation.client?.name || 'Unknown',
          quotation.grand_total?.toFixed(2) || '0.00',
          quotation.status || 'Active'
        ].join(','))
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `quotations_${Date.now()}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Quotations exported to CSV successfully!')
      // Complete progress tracking
      completeProgress();
    }
  } catch (error) {
    console.error('Export error:', error)
    setProgressError('Failed to export quotations')
    toast.error('Failed to export quotations')
  }
}

export const exportSalesOrders = async (salesOrders: any[], format: 'pdf' | 'csv' = 'pdf') => {
  try {
    if (format === 'pdf') {
      // Use the new dynamic template system with pagination support
      const { generateDynamicTemplateWithPagination } = await import('./report-pdf-templates')
      
      // Get custom table headers for sales orders
      const customTableHeaders = ['Order #', 'Date', 'Client', 'Total Amount', 'Status'];
      
      // Generate dynamic template with pagination
      const template = generateDynamicTemplateWithPagination(salesOrders.length, customTableHeaders, 'salesOrders');
      
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

      // Create inputs with actual data
      const inputs = [{
        // Company Info
        logo: companyLogoBase64,
        companyName: "CABINET MASTER STYLES & FINISHES",
        companyLocation: "Location: Ruiru Eastern By-Pass",
        companyPhone: "Tel: +254729554475",
        companyEmail: "Email: cabinetmasterstyles@gmail.com",
        
        // Report Header
        reportTitle: "SALES ORDERS REPORT",
        reportDateLabel: 'Date:',
        reportDateValue: new Date().toLocaleDateString(),
        reportPeriodLabel: 'Period:',
        reportPeriodValue: "All Time",
        reportTypeLabel: 'Type:',
        reportTypeValue: "Sales Orders",
        
        // Real Data Rows (populated with actual data from salesOrders array)
        ...salesOrders.map((order, index) => ({
          [`orderNumber_${index}`]: String(order.order_number || 'N/A'),
          [`date_${index}`]: new Date(order.date_created).toLocaleDateString(),
          [`client_${index}`]: String(order.client?.name || 'Unknown'),
          [`totalAmount_${index}`]: `KES ${(order.grand_total || 0).toFixed(2)}`,
          [`status_${index}`]: String(order.status || 'Active')
        })).reduce((acc, item) => ({ ...acc, ...item }), {}),
        
        // Footer
        summaryTitle: 'Summary:',
        summaryContent: `Total Sales Orders: ${salesOrders.length}`,
        totalLabel: 'Total:',
        totalValue: `KES ${salesOrders.reduce((sum, order) => sum + (order.grand_total || 0), 0).toFixed(2)}`,
        preparedByLabel: `Prepared by: System`,
        approvedByLabel: `Approved by: System`,
        
        // Watermark - map to all pages
        ...Array.from({ length: Math.ceil(salesOrders.length / firstPageRows) + 1 }, (_, i) => ({
          [`watermarkLogo_${i}`]: watermarkLogoBase64
        })).reduce((acc, item) => ({ ...acc, ...item }), {}),
      }];
      
      // Generate and download the PDF
      const { generate } = await import('@pdfme/generator')
      const { text, rectangle, line, image } = await import('@pdfme/schemas')
      const pdf = await generate({ template, inputs, plugins: { text, rectangle, line, image } as any })
      
      // Download PDF
      const blob = new Blob([new Uint8Array(pdf.buffer)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `sales_orders_report_${Date.now()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('Sales orders exported successfully!')
    } else {
      // CSV export
      const headers = ['Order #', 'Date', 'Client', 'Total Amount', 'Status']
      const csvContent = [
        headers.join(','),
        ...salesOrders.map(order => [
          order.order_number,
          new Date(order.date_created).toLocaleDateString(),
          order.client?.name || 'Unknown',
          order.grand_total?.toFixed(2) || '0.00',
          order.status || 'Active'
        ].join(','))
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `sales_orders_${Date.now()}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Sales orders exported to CSV successfully!')
    }
  } catch (error) {
    console.error('Export error:', error)
    toast.error('Failed to export sales orders')
  }
}

export const exportInvoices = async (invoices: any[], format: 'pdf' | 'csv' = 'pdf') => {
  try {
    if (format === 'pdf') {
      // Use the new dynamic template system with pagination support
      const { generateDynamicTemplateWithPagination } = await import('./report-pdf-templates')
      
      // Get custom table headers for invoices
      const customTableHeaders = ['Invoice #', 'Date', 'Due Date', 'Client', 'Total Amount', 'Paid Amount', 'Balance', 'Status'];
      
      // Generate dynamic template with pagination
      const template = generateDynamicTemplateWithPagination(invoices.length, customTableHeaders, 'invoices');
      
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

      // Create inputs with actual data
      const inputs = [{
        // Company Info
        logo: companyLogoBase64,
        companyName: "CABINET MASTER STYLES & FINISHES",
        companyLocation: "Location: Ruiru Eastern By-Pass",
        companyPhone: "Tel: +254729554475",
        companyEmail: "Email: cabinetmasterstyles@gmail.com",
        
        // Report Header
        reportTitle: "INVOICES REPORT",
        reportDateLabel: 'Date:',
        reportDateValue: new Date().toLocaleDateString(),
        reportPeriodLabel: 'Period:',
        reportPeriodValue: "All Time",
        reportTypeLabel: 'Type:',
        reportTypeValue: "Invoices",
        
        // Real Data Rows (populated with actual data from invoices array)
        ...invoices.map((invoice, index) => ({
          [`invoiceNumber_${index}`]: String(invoice.invoice_number || 'N/A'),
          [`date_${index}`]: new Date(invoice.date_created).toLocaleDateString(),
          [`dueDate_${index}`]: new Date(invoice.due_date).toLocaleDateString(),
          [`client_${index}`]: String(invoice.client?.name || 'Unknown'),
          [`totalAmount_${index}`]: `KES ${(invoice.grand_total || 0).toFixed(2)}`,
          [`paidAmount_${index}`]: `KES ${(invoice.paid_amount || 0).toFixed(2)}`,
          [`balance_${index}`]: `KES ${(invoice.balance_amount || 0).toFixed(2)}`,
          [`status_${index}`]: String(invoice.status || 'Active')
        })).reduce((acc, item) => ({ ...acc, ...item }), {}),
        
        // Footer
        summaryTitle: 'Summary:',
        summaryContent: `Total Invoices: ${invoices.length}`,
        totalLabel: 'Total:',
        totalValue: `KES ${invoices.reduce((sum, invoice) => sum + (invoice.grand_total || 0), 0).toFixed(2)}`,
        preparedByLabel: `Prepared by: System`,
        approvedByLabel: `Approved by: System`,
        
        // Watermark - map to all pages
        ...Array.from({ length: Math.ceil(invoices.length / firstPageRows) + 1 }, (_, i) => ({
          [`watermarkLogo_${i}`]: watermarkLogoBase64
        })).reduce((acc, item) => ({ ...acc, ...item }), {}),
      }];
      
      // Generate and download the PDF
      const { generate } = await import('@pdfme/generator')
      const { text, rectangle, line, image } = await import('@pdfme/schemas')
      const pdf = await generate({ template, inputs, plugins: { text, rectangle, line, image } as any })
      
      // Download PDF
      const blob = new Blob([new Uint8Array(pdf.buffer)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoices_report_${Date.now()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('Invoices exported successfully!')
    } else {
      // CSV export
      const headers = ['Invoice #', 'Date', 'Client', 'Total Amount', 'Paid Amount', 'Status']
      const csvContent = [
        headers.join(','),
        ...invoices.map(invoice => [
          invoice.invoice_number,
          new Date(invoice.date_created).toLocaleDateString(),
          invoice.client?.name || 'Unknown',
          invoice.grand_total?.toFixed(2) || '0.00',
          invoice.paid_amount?.toFixed(2) || '0.00',
          invoice.status || 'Active'
        ].join(','))
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `invoices_${Date.now()}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Invoices exported to CSV successfully!')
    }
  } catch (error) {
    console.error('Export error:', error)
    toast.error('Failed to export invoices')
  }
}

export const exportCashSales = async (cashSales: any[], format: 'pdf' | 'csv' = 'pdf') => {
  try {
    if (format === 'pdf') {
      // Use the new dynamic template system with pagination support
      const { generateDynamicTemplateWithPagination } = await import('./report-pdf-templates')
      
      // Get custom table headers for cash sales
      const customTableHeaders = ['Receipt #', 'Date', 'Client', 'Total Amount'];
      
      // Generate dynamic template with pagination
      const template = generateDynamicTemplateWithPagination(cashSales.length, customTableHeaders, 'cashSales');
      
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

      // Create inputs with actual data
      const inputs = [{
        // Company Info
        logo: companyLogoBase64,
        companyName: "CABINET MASTER STYLES & FINISHES",
        companyLocation: "Location: Ruiru Eastern By-Pass",
        companyPhone: "Tel: +254729554475",
        companyEmail: "Email: cabinetmasterstyles@gmail.com",
        
        // Report Header
        reportTitle: "CASH SALES REPORT",
        reportDateLabel: 'Date:',
        reportDateValue: new Date().toLocaleDateString(),
        reportPeriodLabel: 'Period:',
        reportPeriodValue: "All Time",
        reportTypeLabel: 'Type:',
        reportTypeValue: "Cash Sales",
        
        // Real Data Rows (populated with actual data from cashSales array)
        ...cashSales.map((sale, index) => ({
          [`receiptNumber_${index}`]: String(sale.sale_number || 'N/A'),
          [`date_${index}`]: new Date(sale.date_created).toLocaleDateString(),
          [`client_${index}`]: String(sale.client?.name || 'Unknown'),
          [`totalAmount_${index}`]: `KES ${(sale.grand_total || 0).toFixed(2)}`
        })).reduce((acc, item) => ({ ...acc, ...item }), {}),
        
        // Footer
        summaryTitle: 'Summary:',
        summaryContent: `Total Cash Sales: ${cashSales.length}`,
        totalLabel: 'Total:',
        totalValue: `KES ${cashSales.reduce((sum, sale) => sum + (sale.grand_total || 0), 0).toFixed(2)}`,
        preparedByLabel: `Prepared by: System`,
        approvedByLabel: `Approved by: System`,
        
        // Watermark - map to all pages
        ...Array.from({ length: Math.ceil(cashSales.length / firstPageRows) + 1 }, (_, i) => ({
          [`watermarkLogo_${i}`]: watermarkLogoBase64
        })).reduce((acc, item) => ({ ...acc, ...item }), {}),
      }];
      
      // Generate and download the PDF
      const { generate } = await import('@pdfme/generator')
      const { text, rectangle, line, image } = await import('@pdfme/schemas')
      const pdf = await generate({ template, inputs, plugins: { text, rectangle, line, image } as any })
      
      // Download PDF
      const blob = new Blob([new Uint8Array(pdf.buffer)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cash_sales_report_${Date.now()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('Cash sales report exported successfully!')
    } else {
      // CSV export
      const headers = ['Receipt #', 'Date', 'Client', 'Total Amount', 'Status']
      const csvContent = [
        headers.join(','),
        ...cashSales.map(sale => [
          sale.sale_number,
          new Date(sale.date_created).toLocaleDateString(),
          sale.client?.name || 'Unknown',
          (sale.grand_total || 0).toFixed(2),
          sale.status || 'Active'
        ].join(','))
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `cash_sales_${Date.now()}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Cash sales report exported to CSV successfully!')
    }
  } catch (error) {
    console.error('Export error:', error)
    toast.error('Failed to export cash sales report')
  }
}

// Removed broken exportPayments function - use exportPaymentsReport instead

// Removed broken exportClientExpenses function - use exportExpensesReport instead

// Removed broken exportCompanyExpenses function - use exportExpensesReport instead

export const exportStockReport = async (stockItems: any[], format: 'pdf' | 'csv' = 'pdf') => {
  try {
    if (format === 'pdf') {
      // Use the new dynamic template system with pagination support
      const { generateDynamicTemplateWithPagination } = await import('./report-pdf-templates')
      
      // Get custom table headers for stock
      const customTableHeaders = ['Item Code', 'Product', 'Category', 'Quantity', 'Unit Price', 'Total Value', 'Status'];
      
      // Generate dynamic template with pagination
      const template = generateDynamicTemplateWithPagination(stockItems.length, customTableHeaders, 'stock');
      
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

      // Create inputs with actual data
      const inputs = [{
        // Company Info
        logo: companyLogoBase64,
        companyName: "CABINET MASTER STYLES & FINISHES",
        companyLocation: "Location: Ruiru Eastern By-Pass",
        companyPhone: "Tel: +254729554475",
        companyEmail: "Email: cabinetmasterstyles@gmail.com",
        
        // Report Header
        reportTitle: "STOCK INVENTORY REPORT",
        reportDateLabel: 'Date:',
        reportDateValue: new Date().toLocaleDateString(),
        reportPeriodLabel: 'Period:',
        reportPeriodValue: "All Time",
        reportTypeLabel: 'Type:',
        reportTypeValue: "Stock Inventory",
        
        // Real Data Rows (populated with actual data from stockItems array)
        ...stockItems.map((item, index) => ({
          [`itemCode_${index}`]: String(item.id || 'N/A'),
          [`product_${index}`]: String(item.name || 'N/A'),
          [`category_${index}`]: String(item.category || 'N/A'),
          [`quantity_${index}`]: `${String(item.quantity || 0)} ${String(item.unit || '')}`.trim(),
          [`unitPrice_${index}`]: `KES ${(item.unit_price || 0).toFixed(2)}`,
          [`totalValue_${index}`]: `KES ${((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}`,
          [`status_${index}`]: (item.quantity || 0) > 0 ? 'In Stock' : 'Out of Stock'
        })).reduce((acc, item) => ({ ...acc, ...item }), {}),
        
        // Footer
        summaryTitle: 'Summary:',
        summaryContent: `Total Stock Items: ${stockItems.length}`,
        totalLabel: 'Total:',
        totalValue: `KES ${stockItems.reduce((sum, item) => sum + (item.quantity * (item.unit_price || 0)), 0).toFixed(2)}`,
        preparedByLabel: `Prepared by: System`,
        approvedByLabel: `Approved by: System`,
        
        // Watermark - map to all pages
        ...Array.from({ length: Math.ceil(stockItems.length / firstPageRows) + 1 }, (_, i) => ({
          [`watermarkLogo_${i}`]: watermarkLogoBase64
        })).reduce((acc, item) => ({ ...acc, ...item }), {}),
      }];
      
      // Generate and download the PDF
      const { generate } = await import('@pdfme/generator')
      const { text, rectangle, line, image } = await import('@pdfme/schemas')
      const pdf = await generate({ template, inputs, plugins: { text, rectangle, line, image } as any })
      
      // Download PDF
      const blob = new Blob([new Uint8Array(pdf.buffer)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `stock_inventory_report_${Date.now()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('Stock report exported successfully!')
    } else {
      // CSV export
      const headers = ['Item Code', 'Product', 'Category', 'Quantity', 'Unit Price', 'Total Value', 'Status']
      const csvContent = [
        headers.join(','),
        ...stockItems.map(item => [
          item.id,
          item.name,
          item.category || 'N/A',
          item.quantity,
          (item.unit_price || 0).toFixed(2),
          (item.quantity * (item.unit_price || 0)).toFixed(2),
          item.quantity === 0 ? 'Out of Stock' : 
          item.quantity <= (item.reorder_level || 0) ? 'Low Stock' : 'In Stock'
        ].join(','))
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `stock_inventory_${Date.now()}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Stock report exported to CSV successfully!')
    }
  } catch (error) {
    console.error('Export error:', error)
    toast.error('Failed to export stock report')
  }
}

export const exportPurchasesReport = async (purchases: any[], format: 'pdf' | 'csv' = 'pdf', purchaseType: 'client' | 'general' = 'general') => {
  try {
    if (format === 'pdf') {
      // Use the new dynamic template system with pagination support
      const { generateDynamicTemplateWithPagination } = await import('./report-pdf-templates')
      
      // Get custom table headers based on purchase type
      const customTableHeaders = purchaseType === 'client' 
        ? ['Order Number', 'Date', 'Supplier', 'Client', 'Paid To', 'Items', 'Total Amount']
        : ['Order Number', 'Date', 'Supplier', 'Items', 'Total Amount'];
      
      // Generate dynamic template with pagination
      const template = generateDynamicTemplateWithPagination(purchases.length, customTableHeaders, 'purchases');
      
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

      // Create inputs with actual data
      const inputs = [{
        // Company Info
        logo: companyLogoBase64,
        companyName: "CABINET MASTER STYLES & FINISHES",
        companyLocation: "Location: Ruiru Eastern By-Pass",
        companyPhone: "Tel: +254729554475",
        companyEmail: "Email: cabinetmasterstyles@gmail.com",
        
        // Report Header
        reportTitle: "PURCHASES REPORT",
        reportDateLabel: 'Date:',
        reportDateValue: new Date().toLocaleDateString(),
        reportPeriodLabel: 'Period:',
        reportPeriodValue: "All Time",
        reportTypeLabel: 'Type:',
        reportTypeValue: "Purchases",
        
        // Real Data Rows (populated with actual data from purchases array)
        ...purchases.map((purchase, index) => {
          // Format items description similar to frontend display
          const formatItemsDescription = (items: any[]) => {
            if (!items || items.length === 0) return 'No items';
            if (items.length === 1) {
              const item = items[0];
              const description = (
                item.stock_item?.description && item.stock_item.description.trim() !== ''
                  ? item.stock_item.description
                  : (item.stock_item?.name && item.stock_item.name.trim() !== ''
                      ? item.stock_item.name
                      : 'N/A')
              );
              return `${description} (${item.quantity} ${item.stock_item?.unit || 'N/A'})`;
            }
            return `${items.length} items: ${items.map(item => {
              const description = (
                item.stock_item?.description && item.stock_item.description.trim() !== ''
                  ? item.stock_item.description
                  : (item.stock_item?.name && item.stock_item.name.trim() !== ''
                      ? item.stock_item.name
                      : 'N/A')
              );
              return `${description} (${item.quantity} ${item.stock_item?.unit || 'N/A'})`;
            }).join(', ')}`;
          };

          if (purchaseType === 'client') {
            return {
              [`orderNumber_${index}`]: String(purchase.purchase_order_number || 'N/A'),
              [`date_${index}`]: purchase.purchase_date ? new Date(purchase.purchase_date).toLocaleDateString() : 'N/A',
              [`supplier_${index}`]: String(purchase.supplier?.name || 'Unknown'),
              [`client_${index}`]: String(purchase.client?.name || 'N/A'),
              [`paidTo_${index}`]: String(purchase.paid_to || 'N/A'),
              [`items_${index}`]: formatItemsDescription(purchase.items || []),
              [`totalAmount_${index}`]: `KES ${(purchase.total_amount || 0).toFixed(2)}`
            };
          } else {
            return {
              [`orderNumber_${index}`]: String(purchase.purchase_order_number || 'N/A'),
              [`date_${index}`]: purchase.purchase_date ? new Date(purchase.purchase_date).toLocaleDateString() : 'N/A',
              [`supplier_${index}`]: String(purchase.supplier?.name || 'Unknown'),
              [`client_${index}`]: '', // Empty for general purchases
              [`paidTo_${index}`]: '', // Empty for general purchases
              [`items_${index}`]: formatItemsDescription(purchase.items || []),
              [`totalAmount_${index}`]: `KES ${(purchase.total_amount || 0).toFixed(2)}`
            };
          }
        }).reduce((acc, item) => ({ ...acc, ...item }), {}),
        
        // Footer
        summaryTitle: 'Summary:',
        summaryContent: `Total Purchases: ${purchases.length}`,
        totalLabel: 'Total:',
        totalValue: `KES ${purchases.reduce((sum, purchase) => sum + (purchase.total_amount || 0), 0).toFixed(2)}`,
        preparedByLabel: `Prepared by: System`,
        approvedByLabel: `Approved by: System`,
        
        // Watermark - map to all pages
        ...Array.from({ length: Math.ceil(purchases.length / firstPageRows) + 1 }, (_, i) => ({
          [`watermarkLogo_${i}`]: watermarkLogoBase64
        })).reduce((acc, item) => ({ ...acc, ...item }), {}),
      }];
      
      // Generate and download the PDF
      const { generate } = await import('@pdfme/generator')
      const { text, rectangle, line, image } = await import('@pdfme/schemas')
      const pdf = await generate({ template, inputs, plugins: { text, rectangle, line, image } as any })
      
      // Download PDF
      const blob = new Blob([new Uint8Array(pdf.buffer)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${purchaseType}_purchases_report_${Date.now()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success(`${purchaseType.charAt(0).toUpperCase() + purchaseType.slice(1)} purchases exported successfully!`)
    } else {
      // CSV export
      const headers = purchaseType === 'client' 
        ? ['Order Number', 'Date', 'Supplier', 'Client', 'Paid To', 'Items', 'Total Amount']
        : ['Order Number', 'Date', 'Supplier', 'Items', 'Total Amount'];
      
      const csvContent = [
        headers.join(','),
        ...purchases.map(purchase => {
          if (purchaseType === 'client') {
            return [
              purchase.purchase_order_number || 'N/A',
              purchase.purchase_date ? new Date(purchase.purchase_date).toLocaleDateString() : 'N/A',
              purchase.supplier?.name || 'N/A',
              purchase.client?.name || 'N/A',
              purchase.paid_to || 'N/A',
              purchase.items?.length || 0,
              (purchase.total_amount || 0).toFixed(2)
            ].join(',');
          } else {
            return [
              purchase.purchase_order_number || 'N/A',
              purchase.purchase_date ? new Date(purchase.purchase_date).toLocaleDateString() : 'N/A',
              purchase.supplier?.name || 'N/A',
              purchase.items?.length || 0,
              (purchase.total_amount || 0).toFixed(2)
            ].join(',');
          }
        })
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${purchaseType}_purchases_${Date.now()}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success(`${purchaseType.charAt(0).toUpperCase() + purchaseType.slice(1)} purchases exported to CSV successfully!`)
    }
  } catch (error) {
    console.error('Export error:', error)
    toast.error(`Failed to export ${purchaseType} purchases`)
  }
}

export interface WorkflowItem {
  id?: number
  category: "cabinet" | "worktop" | "accessories"
  description: string
  unit: string
  quantity: number
  unit_price: number
  total_price: number
  stock_item_id?: number
}

export interface QuotationData {
  id: number
  quotation_number: string
  client_id: number
  date_created: string
  valid_until: string
  cabinet_total: number
  worktop_total: number
  accessories_total: number
  labour_percentage: number
  labour_total: number
  total_amount: number
  grand_total: number
  include_accessories: boolean
  status: string
  notes?: string
  terms_conditions?: string
  client?: {
    id: number
    name: string
    phone?: string
    location?: string
  }
  items?: WorkflowItem[]
}

export interface SalesOrderData {
  id?: number
  order_number: string
  client_id: number
  quotation_id?: number
  original_quotation_number?: string
  date_created: string
  cabinet_total: number
  worktop_total: number
  accessories_total: number
  appliances_total?: number
  wardrobes_total?: number
  tvunit_total?: number
  labour_percentage: number
  labour_total: number
  total_amount: number
  grand_total: number
  vat_percentage: number
  vat_amount: number
  discount_amount?: number
  include_accessories: boolean
  include_worktop?: boolean
  include_appliances?: boolean
  include_wardrobes?: boolean
  include_tvunit?: boolean
  cabinet_labour_percentage?: number
  accessories_labour_percentage?: number
  appliances_labour_percentage?: number
  wardrobes_labour_percentage?: number
  tvunit_labour_percentage?: number
  worktop_labor_qty?: number
  worktop_labor_unit_price?: number
  status: string
  notes?: string
  terms_conditions?: string
  section_names?: {
    cabinet: string;
    worktop: string;
    accessories: string;
    appliances: string;
    wardrobes: string;
    tvunit: string;
  }
  client?: {
    id: number
    name: string
    phone?: string
    location?: string
  }
  items?: WorkflowItem[]
}

export interface InvoiceData {
  id?: number
  invoice_number: string
  client_id: number
  sales_order_id?: number
  original_quotation_number?: string
  date_created: string
  due_date: string
  cabinet_total: number
  worktop_total: number
  accessories_total: number
  appliances_total?: number
  wardrobes_total?: number
  tvunit_total?: number
  labour_percentage: number
  labour_total: number
  total_amount: number
  grand_total: number
  paid_amount: number
  balance_amount: number
  vat_percentage: number
  vat_amount: number
  include_accessories: boolean
  include_worktop?: boolean
  include_appliances?: boolean
  include_wardrobes?: boolean
  include_tvunit?: boolean
  cabinet_labour_percentage?: number
  accessories_labour_percentage?: number
  appliances_labour_percentage?: number
  wardrobes_labour_percentage?: number
  tvunit_labour_percentage?: number
  worktop_labor_qty?: number
  worktop_labor_unit_price?: number
  status: string
  notes?: string
  terms_conditions?: string
  section_names?: {
    cabinet: string;
    worktop: string;
    accessories: string;
    appliances: string;
    wardrobes: string;
    tvunit: string;
  }
  client?: {
    id: number
    name: string
    phone?: string
    location?: string
  }
  items?: WorkflowItem[]
}

export interface PaymentData {
  id?: number
  payment_number: string
  client_id: number
  quotation_number: string
  amount: number
  payment_method: string
  account_paid_to: string
  date_paid: string
  description: string
  reference_number?: string
  status: string
}

// Generate next number in sequence using same format as quotations
export const generateNextNumber = async (table: string, field: string, prefix: string): Promise<string> => {
  try {
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    
    // Query database for the latest number for this year/month
    const { data, error } = await supabase
      .from(table)
      .select(field)
      .ilike(field, `${prefix}${year}${month}%`)
      .order(field, { ascending: false })
      .limit(1)

    if (error) throw error

    let nextNumber = 1
    if (data && data.length > 0) {
      const match = (data[0] as any)[field].match(new RegExp(`${prefix}\\d{4}(\\d{3})`))
      if (match) {
        nextNumber = parseInt(match[1]) + 1
      }
    }

    return `${prefix}${year}${month}${nextNumber.toString().padStart(3, '0')}`
  } catch (error) {
    console.error(`Error generating ${table} number:`, error)
    // Fallback to timestamp-based number
    const timestamp = Date.now().toString().slice(-3)
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    return `${prefix}${year}${month}${timestamp}`
  }
}

// Check payment requirements for quotation
export const checkPaymentRequirements = async (quotationNumber: string, requiredPercentage: number = 0): Promise<{
  hasPayments: boolean
  totalPaid: number
  paymentPercentage: number
  quotationTotal: number
}> => {
  try {
    // Get quotation total
    const { data: quotationData, error: quotationError } = await supabase
      .from("quotations")
      .select("grand_total")
      .eq("quotation_number", quotationNumber)
      .single()

    if (quotationError) throw quotationError

    // Get payments for this quotation (check both quotation_number and paid_to fields)
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("amount")
      .or(`quotation_number.eq.${quotationNumber},paid_to.eq.${quotationNumber}`)
      .eq("status", "completed")

    if (paymentsError) throw paymentsError

    const totalPaid = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
    const paymentPercentage = quotationData.grand_total > 0 ? (totalPaid / quotationData.grand_total) * 100 : 0

    return {
      hasPayments: payments && payments.length > 0,
      totalPaid,
      paymentPercentage,
      quotationTotal: quotationData.grand_total
    }
  } catch (error) {
    console.error("Error checking payment requirements:", error)
    throw error
  }
}

// Convert quotation to sales order
export const proceedToSalesOrder = async (quotationId: number): Promise<SalesOrderData> => {
  try {
    // Get quotation data with items
    const { data: quotation, error: quotationError } = await supabase
      .from("quotations")
      .select(`
        *,
        client:registered_entities(id, name, phone, location),
        items:quotation_items(*)
      `)
      .eq("id", quotationId)
      .single()

    if (quotationError) throw quotationError

    // Check payment requirements
    const paymentInfo = await checkPaymentRequirements(quotation.quotation_number)
    
    if (!paymentInfo.hasPayments) {
      throw new Error("Cannot convert to sales order. At least one payment must be made for this quotation.")
    }

    if (paymentInfo.totalPaid <= 0) {
      throw new Error("Invalid payment amount. Payment must be greater than 0.")
    }

    // Generate sales order number
    const orderNumber = await generateNextNumber("sales_orders", "order_number", "SO")

    // Create sales order
    const salesOrderData: SalesOrderData = {
      order_number: orderNumber,
      client_id: quotation.client_id,
      quotation_id: quotation.id,
      original_quotation_number: quotation.quotation_number,
      date_created: new Date().toISOString().split('T')[0],
      cabinet_total: quotation.cabinet_total,
      worktop_total: quotation.worktop_total,
      accessories_total: quotation.accessories_total,
      appliances_total: quotation.appliances_total,
      wardrobes_total: quotation.wardrobes_total,
      tvunit_total: quotation.tvunit_total,
      labour_percentage: quotation.labour_percentage,
      labour_total: quotation.labour_total,
      total_amount: quotation.total_amount,
      grand_total: quotation.grand_total,
      vat_percentage: quotation.vat_percentage,
      vat_amount: quotation.vat_amount,
      discount_amount: quotation.discount_amount || 0, // Copy discount from quotation
      include_accessories: quotation.include_accessories,
      include_worktop: quotation.include_worktop,
      include_appliances: quotation.include_appliances,
      include_wardrobes: quotation.include_wardrobes,
      include_tvunit: quotation.include_tvunit,
      cabinet_labour_percentage: quotation.cabinet_labour_percentage,
      accessories_labour_percentage: quotation.accessories_labour_percentage,
      appliances_labour_percentage: quotation.appliances_labour_percentage,
      wardrobes_labour_percentage: quotation.wardrobes_labour_percentage,
      tvunit_labour_percentage: quotation.tvunit_labour_percentage,
      worktop_labor_qty: quotation.worktop_labor_qty,
      worktop_labor_unit_price: quotation.worktop_labor_unit_price,
      status: "pending",
      notes: quotation.notes,
      terms_conditions: quotation.terms_conditions,
      section_names: quotation.section_names,
      client: quotation.client,
      items: quotation.items
    }

    // Insert sales order
    const { data: newSalesOrder, error: salesOrderError } = await supabase
      .from("sales_orders")
      .insert({
        order_number: salesOrderData.order_number,
        client_id: salesOrderData.client_id,
        quotation_id: salesOrderData.quotation_id,
        original_quotation_number: salesOrderData.original_quotation_number,
        date_created: salesOrderData.date_created,
        cabinet_total: salesOrderData.cabinet_total,
        worktop_total: salesOrderData.worktop_total,
        accessories_total: salesOrderData.accessories_total,
        appliances_total: salesOrderData.appliances_total,
        wardrobes_total: salesOrderData.wardrobes_total,
        tvunit_total: salesOrderData.tvunit_total,
        labour_percentage: salesOrderData.labour_percentage,
        labour_total: salesOrderData.labour_total,
        total_amount: salesOrderData.total_amount,
        grand_total: salesOrderData.grand_total,
        vat_percentage: salesOrderData.vat_percentage,
        vat_amount: salesOrderData.vat_amount,
        discount_amount: salesOrderData.discount_amount, // Include discount amount
        include_accessories: salesOrderData.include_accessories,
        include_worktop: salesOrderData.include_worktop,
        include_appliances: salesOrderData.include_appliances,
        include_wardrobes: salesOrderData.include_wardrobes,
        include_tvunit: salesOrderData.include_tvunit,
        cabinet_labour_percentage: salesOrderData.cabinet_labour_percentage,
        accessories_labour_percentage: salesOrderData.accessories_labour_percentage,
        appliances_labour_percentage: salesOrderData.appliances_labour_percentage,
        wardrobes_labour_percentage: salesOrderData.wardrobes_labour_percentage,
        tvunit_labour_percentage: salesOrderData.tvunit_labour_percentage,
        worktop_labor_qty: salesOrderData.worktop_labor_qty,
        worktop_labor_unit_price: salesOrderData.worktop_labor_unit_price,
        status: salesOrderData.status,
        notes: salesOrderData.notes,
        terms_conditions: salesOrderData.terms_conditions,
        section_names: salesOrderData.section_names
      })
      .select()
      .single()

    if (salesOrderError) throw salesOrderError

    // Insert sales order items
    if (salesOrderData.items && salesOrderData.items.length > 0) {
      const salesOrderItems = salesOrderData.items.map(item => ({
        sales_order_id: newSalesOrder.id,
        category: item.category,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        stock_item_id: item.stock_item_id
      }))

      const { error: itemsError } = await supabase
        .from("sales_order_items")
        .insert(salesOrderItems)

      if (itemsError) throw itemsError
    }

    // Update quotation status
    const { error: updateError } = await supabase
      .from("quotations")
      .update({ status: "converted_to_sales_order" })
      .eq("id", quotationId)

    if (updateError) throw updateError

    toast.success("Successfully converted quotation to sales order")
    return { ...salesOrderData, id: newSalesOrder.id }
  } catch (error) {
    console.error("Error converting quotation to sales order:", error)
    toast.error(error instanceof Error ? error.message : "Failed to convert quotation to sales order")
    throw error
  }
}

// Convert sales order to invoice
export const proceedToInvoice = async (salesOrderId: number): Promise<InvoiceData> => {
  try {
    // Get sales order data
    const { data: salesOrder, error: salesOrderError } = await supabase
      .from("sales_orders")
      .select(`
        *,
        client:registered_entities(id, name, phone, location),
        items:sales_order_items(*)
      `)
      .eq("id", salesOrderId)
      .single()

    if (salesOrderError) throw salesOrderError

    // Check payment requirements (70% minimum)
    const paymentInfo = await checkPaymentRequirements(salesOrder.original_quotation_number || "", 70)
    
    if (paymentInfo.paymentPercentage < 70) {
      const requiredAmount = salesOrder.grand_total * 0.7
      const remainingAmount = requiredAmount - paymentInfo.totalPaid
      throw new Error(`Cannot proceed to invoice. At least 70% payment (KES ${requiredAmount.toFixed(2)}) is required.\nRemaining amount needed: KES ${remainingAmount.toFixed(2)}`)
    }

    // Generate invoice number
    const invoiceNumber = await generateNextNumber("invoices", "invoice_number", "INV")

    // Calculate due date (30 days from today)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    // Create invoice
    const invoiceData = {
      invoice_number: invoiceNumber,
      client_id: salesOrder.client_id,
      sales_order_id: salesOrder.id,
      original_quotation_number: salesOrder.original_quotation_number,
      date_created: new Date().toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      cabinet_total: salesOrder.cabinet_total,
      worktop_total: salesOrder.worktop_total,
      accessories_total: salesOrder.accessories_total,
      appliances_total: salesOrder.appliances_total,
      wardrobes_total: salesOrder.wardrobes_total,
      tvunit_total: salesOrder.tvunit_total,
      labour_percentage: salesOrder.labour_percentage,
      labour_total: salesOrder.labour_total,
      total_amount: salesOrder.total_amount,
      grand_total: salesOrder.grand_total,
      paid_amount: paymentInfo.totalPaid,
      balance_amount: salesOrder.grand_total - paymentInfo.totalPaid,
      include_accessories: salesOrder.include_accessories,
      include_worktop: salesOrder.include_worktop,
      include_appliances: salesOrder.include_appliances,
      include_wardrobes: salesOrder.include_wardrobes,
      include_tvunit: salesOrder.include_tvunit,
      cabinet_labour_percentage: salesOrder.cabinet_labour_percentage,
      accessories_labour_percentage: salesOrder.accessories_labour_percentage,
      appliances_labour_percentage: salesOrder.appliances_labour_percentage,
      wardrobes_labour_percentage: salesOrder.wardrobes_labour_percentage,
      tvunit_labour_percentage: salesOrder.tvunit_labour_percentage,
      worktop_labor_qty: salesOrder.worktop_labor_qty,
      worktop_labor_unit_price: salesOrder.worktop_labor_unit_price,
      vat_percentage: salesOrder.vat_percentage,
      vat_amount: salesOrder.vat_amount,
      status: "pending",
      notes: salesOrder.notes,
      terms_conditions: salesOrder.terms_conditions,
      section_names: salesOrder.section_names
    }

    // Insert invoice
    const { data: newInvoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert(invoiceData)
      .select()
      .single()

    if (invoiceError) throw invoiceError

    // Insert invoice items
    if (salesOrder.items && salesOrder.items.length > 0) {
      const invoiceItems = salesOrder.items.map((item: any) => ({
        invoice_id: newInvoice.id,
        category: item.category,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        stock_item_id: item.stock_item_id
      }))

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(invoiceItems)

      if (itemsError) throw itemsError
    }

    // Update sales order status
    const { error: updateError } = await supabase
      .from("sales_orders")
      .update({ status: "converted_to_invoice" })
      .eq("id", salesOrderId)

    if (updateError) throw updateError

    // Deduct stock quantities for all items
    if (salesOrder.items && salesOrder.items.length > 0) {
      console.log(`📦 Deducting stock for ${salesOrder.items.length} items in invoice ${invoiceNumber}...`)
      try {
        await deductStockFromItems(salesOrder.items, "invoice", newInvoice.id, invoiceNumber)
        console.log(`✅ Stock deduction completed for invoice ${invoiceNumber}`)
      } catch (error) {
        console.error("Error deducting stock for invoice:", error)
        // Don't throw error - invoice creation should succeed even if stock deduction fails
        toast.error("Invoice created but some stock deductions failed. Please check stock levels manually.")
      }
    }

    toast.success("Successfully converted sales order to invoice")
    return { ...invoiceData, id: newInvoice.id, client: salesOrder.client, items: salesOrder.items }
  } catch (error) {
    console.error("Error converting sales order to invoice:", error)
    toast.error(error instanceof Error ? error.message : "Failed to convert sales order to invoice")
    throw error
  }
}

// Convert quotation directly to cash sale
export const proceedToCashSale = async (quotationId: number): Promise<any> => {
  try {
    // Get quotation data
    const { data: quotation, error: quotationError } = await supabase
      .from("quotations")
      .select(`
        *,
        client:registered_entities(id, name, phone, location),
        items:quotation_items(*)
      `)
      .eq("id", quotationId)
      .single()

    if (quotationError) throw quotationError

    // Generate cash sale number using the dedicated service
    const saleNumber = await NumberGenerationService.generateCashSaleNumber()

    // Create cash sale
    const cashSaleData = {
      sale_number: saleNumber,
      client_id: quotation.client_id,
      original_quotation_number: quotation.quotation_number,
      date_created: new Date().toISOString().split('T')[0],
      cabinet_total: quotation.cabinet_total,
      worktop_total: quotation.worktop_total,
      accessories_total: quotation.accessories_total,
      labour_percentage: quotation.labour_percentage,
      labour_total: quotation.labour_total,
      total_amount: quotation.total_amount,
      grand_total: quotation.grand_total,
      amount_paid: quotation.grand_total, // Full payment for cash sale
      change_amount: 0,
      balance_amount: 0,
      include_accessories: quotation.include_accessories,
      payment_method: "cash",
      status: "completed",
      notes: quotation.notes,
      terms_conditions: quotation.terms_conditions
    }

    // Insert cash sale
    const { data: newCashSale, error: cashSaleError } = await supabase
      .from("cash_sales")
      .insert(cashSaleData)
      .select()
      .single()

    if (cashSaleError) throw cashSaleError

    // Insert cash sale items
    if (quotation.items && quotation.items.length > 0) {
      const cashSaleItems = quotation.items.map((item: any) => ({
        cash_sale_id: newCashSale.id,
        category: item.category,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        stock_item_id: item.stock_item_id
      }))

      const { error: itemsError } = await supabase
        .from("cash_sale_items")
        .insert(cashSaleItems)

      if (itemsError) throw itemsError
    }

    // Update quotation status
    const { error: updateError } = await supabase
      .from("quotations")
      .update({ status: "converted_to_cash_sale" })
      .eq("id", quotationId)

    if (updateError) throw updateError

    // Deduct stock quantities for all items
    if (quotation.items && quotation.items.length > 0) {
      console.log(`📦 Deducting stock for ${quotation.items.length} items in cash sale ${saleNumber}...`)
      try {
        await deductStockFromItems(quotation.items, "cash_sale", newCashSale.id, saleNumber)
        console.log(`✅ Stock deduction completed for cash sale ${saleNumber}`)
      } catch (error) {
        console.error("Error deducting stock for cash sale:", error)
        // Don't throw error - cash sale creation should succeed even if stock deduction fails
        toast.error("Cash sale created but some stock deductions failed. Please check stock levels manually.")
      }
    }

    toast.success("Successfully converted quotation to cash sale")
    return { ...cashSaleData, id: newCashSale.id, client: quotation.client, items: quotation.items }
  } catch (error) {
    console.error("Error converting quotation to cash sale:", error)
    toast.error(error instanceof Error ? error.message : "Failed to convert quotation to cash sale")
    throw error
  }
}

// Convert sales order to cash sale
export const proceedToCashSaleFromSalesOrder = async (salesOrderId: number): Promise<any> => {
  try {
    console.log(`🔄 Converting sales order ${salesOrderId} to cash sale...`)
    
    // Get sales order data
    const { data: salesOrder, error: salesOrderError } = await supabase
      .from("sales_orders")
      .select(`
        *,
        client:registered_entities(id, name, phone, location),
        items:sales_order_items(*)
      `)
      .eq("id", salesOrderId)
      .single()

    if (salesOrderError) {
      console.error("❌ Error fetching sales order:", salesOrderError)
      throw salesOrderError
    }

    console.log(`✅ Found sales order: ${salesOrder.order_number}`)
    console.log(`   Client: ${salesOrder.client?.name}`)
    console.log(`   Items count: ${salesOrder.items?.length || 0}`)

    // Generate cash sale number using the dedicated service
    const saleNumber = await NumberGenerationService.generateCashSaleNumber()
    console.log(`📝 Generated cash sale number: ${saleNumber}`)

    // Create cash sale
    const cashSaleData = {
      sale_number: saleNumber,
      client_id: salesOrder.client_id,
      sales_order_id: salesOrder.id,
      original_quotation_number: salesOrder.original_quotation_number,
      date_created: new Date().toISOString().split('T')[0],
      cabinet_total: salesOrder.cabinet_total || 0,
      worktop_total: salesOrder.worktop_total || 0,
      accessories_total: salesOrder.accessories_total || 0,
      labour_percentage: salesOrder.labour_percentage || 0,
      labour_total: salesOrder.labour_total || 0,
      total_amount: salesOrder.total_amount || 0,
      grand_total: salesOrder.grand_total || 0,
      amount_paid: salesOrder.grand_total || 0, // Full payment for cash sale
      change_amount: 0,
      balance_amount: 0,
      include_accessories: salesOrder.include_accessories || false,
      payment_method: "cash",
      status: "completed",
      notes: salesOrder.notes || "",
      terms_conditions: salesOrder.terms_conditions || ""
    }

    // Insert cash sale
    console.log(`💾 Inserting cash sale with data:`, cashSaleData)
    const { data: newCashSale, error: cashSaleError } = await supabase
      .from("cash_sales")
      .insert(cashSaleData)
      .select()
      .single()

    if (cashSaleError) {
      console.error("❌ Error inserting cash sale:", cashSaleError)
      throw cashSaleError
    }
    
    console.log(`✅ Cash sale created with ID: ${newCashSale.id}`)

    // Insert cash sale items
    if (salesOrder.items && salesOrder.items.length > 0) {
      console.log(`📦 Inserting ${salesOrder.items.length} cash sale items...`)
      const cashSaleItems = salesOrder.items.map((item: any) => ({
        cash_sale_id: newCashSale.id,
        category: item.category,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        stock_item_id: item.stock_item_id
      }))

      console.log(`📦 Cash sale items data:`, cashSaleItems)
      const { error: itemsError } = await supabase
        .from("cash_sale_items")
        .insert(cashSaleItems)

      if (itemsError) {
        console.error("❌ Error inserting cash sale items:", itemsError)
        throw itemsError
      }
      
      console.log(`✅ Cash sale items inserted successfully`)
    } else {
      console.log(`ℹ️ No items to insert for cash sale`)
    }

    // Update sales order status
    const { error: updateError } = await supabase
      .from("sales_orders")
      .update({ status: "completed" })
      .eq("id", salesOrderId)

    if (updateError) throw updateError

    // Deduct stock quantities for all items
    if (salesOrder.items && salesOrder.items.length > 0) {
      console.log(`📦 Deducting stock for ${salesOrder.items.length} items in cash sale ${saleNumber}...`)
      try {
        await deductStockFromItems(salesOrder.items, "cash_sale", newCashSale.id, saleNumber)
        console.log(`✅ Stock deduction completed for cash sale ${saleNumber}`)
      } catch (error) {
        console.error("Error deducting stock for cash sale:", error)
        // Don't throw error - cash sale creation should succeed even if stock deduction fails
        toast.error("Cash sale created but some stock deductions failed. Please check stock levels manually.")
      }
    }

    toast.success("Successfully converted sales order to cash sale")
    return { ...cashSaleData, id: newCashSale.id, client: salesOrder.client, items: salesOrder.items }
  } catch (error) {
    console.error("Error converting sales order to cash sale:", error)
    const errorMessage = error instanceof Error ? error.message : 
      (typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error))
    console.error("Detailed error:", errorMessage)
    toast.error(`Failed to convert sales order to cash sale: ${errorMessage}`)
    throw error
  }
}

// Convert invoice to cash sale
export const proceedToCashSaleFromInvoice = async (invoiceId: number): Promise<any> => {
  try {
    // Get invoice data
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        *,
        client:registered_entities(id, name, phone, location),
        items:invoice_items(*)
      `)
      .eq("id", invoiceId)
      .single()

    if (invoiceError) throw invoiceError

    // Generate cash sale number using the dedicated service
    const saleNumber = await NumberGenerationService.generateCashSaleNumber()

    // Create cash sale
    const cashSaleData = {
      sale_number: saleNumber,
      client_id: invoice.client_id,
      invoice_id: invoice.id,
      original_quotation_number: invoice.original_quotation_number,
      date_created: new Date().toISOString().split('T')[0],
      cabinet_total: invoice.cabinet_total,
      worktop_total: invoice.worktop_total,
      accessories_total: invoice.accessories_total,
      labour_percentage: invoice.labour_percentage,
      labour_total: invoice.labour_total,
      total_amount: invoice.total_amount,
      grand_total: invoice.grand_total,
      amount_paid: invoice.grand_total, // Full payment for cash sale
      change_amount: 0,
      balance_amount: 0,
      include_accessories: invoice.include_accessories,
      payment_method: "cash",
      status: "completed",
      notes: invoice.notes,
      terms_conditions: invoice.terms_conditions
    }

    // Insert cash sale
    const { data: newCashSale, error: cashSaleError } = await supabase
      .from("cash_sales")
      .insert(cashSaleData)
      .select()
      .single()

    if (cashSaleError) throw cashSaleError

    // Insert cash sale items
    if (invoice.items && invoice.items.length > 0) {
      const cashSaleItems = invoice.items.map((item: any) => ({
        cash_sale_id: newCashSale.id,
        category: item.category,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        stock_item_id: item.stock_item_id
      }))

      const { error: itemsError } = await supabase
        .from("cash_sale_items")
        .insert(cashSaleItems)

      if (itemsError) throw itemsError
    }

    // Update invoice status
    const { error: updateError } = await supabase
      .from("invoices")
      .update({ status: "converted_to_cash_sale" })
      .eq("id", invoiceId)

    if (updateError) throw updateError

    // Deduct stock quantities for all items
    if (invoice.items && invoice.items.length > 0) {
      console.log(`📦 Deducting stock for ${invoice.items.length} items in cash sale ${saleNumber}...`)
      try {
        await deductStockFromItems(invoice.items, "cash_sale", newCashSale.id, saleNumber)
        console.log(`✅ Stock deduction completed for cash sale ${saleNumber}`)
      } catch (error) {
        console.error("Error deducting stock for cash sale:", error)
        // Don't throw error - cash sale creation should succeed even if stock deduction fails
        toast.error("Cash sale created but some stock deductions failed. Please check stock levels manually.")
      }
    }

    toast.success("Successfully converted invoice to cash sale")
    return { ...cashSaleData, id: newCashSale.id, client: invoice.client, items: invoice.items }
  } catch (error) {
    console.error("Error converting invoice to cash sale:", error)
    toast.error(error instanceof Error ? error.message : "Failed to convert invoice to cash sale")
    throw error
  }
}

// Print document
export const printDocument = (elementId: string, documentTitle: string) => {
  const element = document.getElementById(elementId)
  if (!element) {
    toast.error("Document not found")
    return
  }

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    toast.error("Failed to open print window")
    return
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>${documentTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .a4-document { max-width: 210mm; margin: 0 auto; }
          .document-header { text-align: center; margin-bottom: 20px; }
          .company-name { font-size: 24px; font-weight: bold; }
          .company-details { font-size: 14px; margin-top: 10px; }
          .document-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .section-title { font-size: 18px; font-weight: bold; margin: 20px 0 10px 0; }
          .quotation-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .quotation-table th, .quotation-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .quotation-table th { background-color: #f2f2f2; }
          @media print {
            body { margin: 0; }
            .btn { display: none; }
          }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `)

  printWindow.document.close()
  printWindow.print()
}

// Download document as PDF (requires html2pdf library)
export const downloadDocument = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId)
  if (!element) {
    toast.error("Document not found")
    return
  }

  try {
    // This would require html2pdf library to be installed
    // For now, we'll just trigger a print dialog
    toast.info("PDF download feature will be available soon. Please use print for now.")
    printDocument(elementId, filename)
  } catch (error) {
    console.error("Error downloading document:", error)
    toast.error("Failed to download document")
  }
} 

// Account Transaction Management
export const createAccountTransaction = async (
  accountType: 'cash' | 'cooperative_bank' | 'credit' | 'cheque',
  transactionType: 'in' | 'out',
  amount: number,
  description: string,
  referenceType: 'payment' | 'expense' | 'purchase' | 'sale',
  referenceId: number
) => {
  try {
    // Check if transaction already exists
    const { data: existingTransaction, error: checkError } = await supabase
      .from('account_transactions')
      .select('*')
      .eq('reference_type', referenceType)
      .eq('reference_id', referenceId)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing transaction:', checkError)
      return { success: false, error: checkError.message }
    }

    if (existingTransaction) {
      // Update existing transaction if data has changed
      const dataChanged = 
        existingTransaction.account_type !== accountType ||
        existingTransaction.amount !== amount ||
        existingTransaction.description !== description ||
        existingTransaction.transaction_type !== transactionType

      if (dataChanged) {
        console.log(`Updating existing transaction for ${referenceType} ${referenceId} due to data changes`)
        
        const { data: updatedTransaction, error: updateError } = await supabase
          .from('account_transactions')
          .update({
            account_type: accountType,
            transaction_type: transactionType,
            amount,
            description,
            updated_at: new Date().toISOString()
          })
          .eq('reference_type', referenceType)
          .eq('reference_id', referenceId)
          .select()
          .single()

        if (updateError) {
          console.error('Error updating account transaction:', updateError)
          return { success: false, error: updateError.message }
        }

        return { success: true, data: updatedTransaction }
      } else {
        console.log(`Transaction already exists and unchanged for ${referenceType} ${referenceId}`)
        return { success: true, data: existingTransaction }
      }
    }

    // Create new transaction if it doesn't exist
    const { data, error } = await supabase
      .from('account_transactions')
      .insert([{
        transaction_number: await generateTransactionNumber(),
        account_type: accountType,
        transaction_type: transactionType,
        amount,
        description,
        reference_type: referenceType,
        reference_id: referenceId
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating account transaction:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error creating account transaction:', error)
    return { success: false, error: (error as Error).message }
  }
}

export const generateTransactionNumber = async (): Promise<string> => {
  try {
    const { data } = await supabase
      .from('account_transactions')
      .select('transaction_number')
      .order('id', { ascending: false })
      .limit(1)

    let nextNumber = 1
    if (data && data.length > 0) {
      const lastNumber = parseInt(data[0].transaction_number.replace('TXN', ''))
      nextNumber = lastNumber + 1
    }

    return `TXN${nextNumber.toString().padStart(6, '0')}`
  } catch (error) {
    return `TXN${Date.now().toString().slice(-6)}`
  }
}

export const mapPaymentMethodToAccountType = (paymentMethod: string): 'cash' | 'cooperative_bank' | 'credit' | 'cheque' => {
  switch (paymentMethod.toLowerCase()) {
    case 'cash':
      return 'cash'
    case 'cooperative_bank':
    case 'bank':
    case 'cooperative_bank':
      return 'cooperative_bank'
    case 'credit':
    case 'credit_card':
      return 'credit'
    case 'cheque':
    case 'check':
      return 'cheque'
    default:
      return 'cash'
  }
}

export const mapAccountDebitedToAccountType = (accountDebited: string): 'cash' | 'cooperative_bank' | 'credit' | 'cheque' => {
  switch (accountDebited.toLowerCase()) {
    case 'cash':
      return 'cash'
    case 'cooperative_bank':
    case 'bank':
      return 'cooperative_bank'
    case 'credit':
      return 'credit'
    case 'cheque':
    case 'check':
      return 'cheque'
    default:
      return 'cash'
  }
}

// Enhanced payment creation with automatic transaction
export const createPaymentWithTransaction = async (paymentData: any) => {
  try {
    // Create the payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single()

    if (paymentError) {
      return { success: false, error: paymentError.message }
    }

    // Create account transaction
    const accountType = mapPaymentMethodToAccountType(paymentData.payment_method)
    const transactionResult = await createAccountTransaction(
      accountType,
      'in',
      paymentData.amount,
      paymentData.description || paymentData.payment_number,
      'payment',
      payment.id
    )

    if (!transactionResult.success) {
      console.error('Failed to create account transaction:', transactionResult.error)
    }

    return { success: true, data: payment }
  } catch (error) {
    console.error('Error creating payment with transaction:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Enhanced expense creation with automatic transaction
export const createExpenseWithTransaction = async (expenseData: any) => {
  try {
    // Ensure fully_paid company expenses have correct amount_paid and balance
    const processedExpenseData = {
      ...expenseData,
      amount_paid: (expenseData.status === "fully_paid" && expenseData.expense_type === "company") ? expenseData.amount : (expenseData.amount_paid || 0),
      balance: (expenseData.status === "fully_paid" && expenseData.expense_type === "company") ? 0 : (expenseData.amount - (expenseData.amount_paid || 0))
    }

    // Create the expense
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert([processedExpenseData])
      .select()
      .single()

    if (expenseError) {
      return { success: false, error: expenseError.message }
    }

    // Get the real description from expense_items using the same structure as frontend views
    const { data: expenseItems } = await supabase
      .from('expense_items')
      .select('description, quantity, rate')
      .eq('expense_id', expense.id)
      .order('created_at', { ascending: false })

    // Use the exact same formatExpenseItems logic as the frontend views
    const formatExpenseItems = (items: any[]) => {
      if (items.length === 0) return expenseData.expense_number
      if (items.length === 1) {
        const item = items[0]
        return item.quantity === 1 ? `${item.description} @ ${item.rate}` : `${item.quantity} ${item.description} @ ${item.rate}`
      }
      return `${items.length} items: ${items.map(i => i.quantity === 1 ? `${i.description} @ ${i.rate}` : `${i.quantity} ${i.description} @ ${i.rate}`).join(", ")}`
    }

    const realDescription = formatExpenseItems(expenseItems || [])

    // Create account transaction
    const accountType = mapAccountDebitedToAccountType(expenseData.account_debited || 'cash')
    const transactionResult = await createAccountTransaction(
      accountType,
      'out',
      expenseData.amount,
      realDescription,
      'expense',
      expense.id
    )

    if (!transactionResult.success) {
      console.error('Failed to create account transaction:', transactionResult.error)
    }

    return { success: true, data: expense }
  } catch (error) {
    console.error('Error creating expense with transaction:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Enhanced purchase creation with automatic transaction
export const createPurchaseWithTransaction = async (purchaseData: any) => {
  try {
    // Create the purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert([purchaseData])
      .select()
      .single()

    if (purchaseError) {
      return { success: false, error: purchaseError.message }
    }

    // Get the real description from purchase_items and stock_items using the same structure as frontend views
    const { data: purchaseItems } = await supabase
      .from('purchase_items')
      .select(`
        stock_item_id,
        quantity,
        stock_items (
          name,
          description,
          unit
        )
      `)
      .eq('purchase_id', purchase.id)
      .order('id', { ascending: false })

    // Use the exact same logic as the frontend views
    const formatPurchaseItems = (items: any[]) => {
      if (items.length === 0) return purchaseData.purchase_order_number
      if (items.length === 1) {
        const item = items[0]
        const description = (
          item.stock_items?.description && item.stock_items.description.trim() !== ''
            ? item.stock_items.description
            : (item.stock_items?.name && item.stock_items.name.trim() !== ''
                ? item.stock_items.name
                : 'N/A')
        )
        return `${description} (${item.quantity} ${item.stock_items?.unit || 'N/A'})`
      }
      return `${items.length} items: ${items.map(item => {
        const description = (
          item.stock_items?.description && item.stock_items.description.trim() !== ''
            ? item.stock_items.description
            : (item.stock_items?.name && item.stock_items.name.trim() !== ''
                ? item.stock_items.name
                : 'N/A')
        )
        return `${description} (${item.quantity} ${item.stock_items?.unit || 'N/A'})`
      }).join(", ")}`
    }

    const realDescription = formatPurchaseItems(purchaseItems || [])

    // Create account transaction
    const accountType = mapPaymentMethodToAccountType(purchaseData.payment_method || 'Cash')
    const transactionResult = await createAccountTransaction(
      accountType,
      'out',
      purchaseData.total_amount,
      realDescription,
      'purchase',
      purchase.id
    )

    if (!transactionResult.success) {
      console.error('Failed to create account transaction:', transactionResult.error)
    }

    return { success: true, data: purchase }
  } catch (error) {
    console.error('Error creating purchase with transaction:', error)
    return { success: false, error: (error as Error).message }
  }
} 

export const exportPaymentsReport = async (payments: any[], format: 'pdf' | 'csv' = 'pdf') => {
  try {
    if (format === 'pdf') {
      // Use the new dynamic template system with pagination support
      const { generateDynamicTemplateWithPagination } = await import('./report-pdf-templates')
      
      // Get custom table headers for payments
      const customTableHeaders = ['Payment #', 'Client', 'Date', 'Paid To', 'Description', 'Amount', 'Account Credited'];
      
      // Generate dynamic template with pagination
      const template = generateDynamicTemplateWithPagination(payments.length, customTableHeaders, 'payments');
      
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

      // Create inputs with actual data
      const inputs = [{
        // Company Info
        logo: companyLogoBase64,
        companyName: "CABINET MASTER STYLES & FINISHES",
        companyLocation: "Location: Ruiru Eastern By-Pass",
        companyPhone: "Tel: +254729554475",
        companyEmail: "Email: cabinetmasterstyles@gmail.com",
        
        // Report Header
        reportTitle: "PAYMENTS REPORT",
        reportDateLabel: 'Date:',
        reportDateValue: new Date().toLocaleDateString(),
        reportPeriodLabel: 'Period:',
        reportPeriodValue: "All Time",
        reportTypeLabel: 'Type:',
        reportTypeValue: "Payments",
        
        // Real Data Rows (populated with actual data from payments array)
        ...payments.map((payment, index) => ({
          [`paymentNumber_${index}`]: String(payment.payment_number || 'N/A'),
          [`client_${index}`]: String(payment.client?.name || 'Unknown'),
          [`date_${index}`]: new Date(payment.date_created).toLocaleDateString(),
          [`paidTo_${index}`]: String(payment.paid_to || '-'),
          [`description_${index}`]: String(payment.description || '-'),
          [`amount_${index}`]: `KES ${(payment.amount || 0).toFixed(2)}`,
          [`accountCredited_${index}`]: String(payment.account_credited || '-')
        })).reduce((acc, item) => ({ ...acc, ...item }), {}),
        
        // Footer
        summaryTitle: 'Summary:',
        summaryContent: `Total Payments: ${payments.length}`,
        totalLabel: 'Total:',
        totalValue: `KES ${payments.reduce((sum, payment) => sum + (payment.amount || 0), 0).toFixed(2)}`,
        preparedByLabel: `Prepared by: System`,
        approvedByLabel: `Approved by: System`,
        
        // Watermark - map to all pages
        ...Array.from({ length: Math.ceil(payments.length / firstPageRows) + 1 }, (_, i) => ({
          [`watermarkLogo_${i}`]: watermarkLogoBase64
        })).reduce((acc, item) => ({ ...acc, ...item }), {}),
      }];
      
      // Generate and download the PDF
      const { generate } = await import('@pdfme/generator')
      const { text, rectangle, line, image } = await import('@pdfme/schemas')
      const pdf = await generate({ template, inputs, plugins: { text, rectangle, line, image } as any })
      
      // Download PDF
      const blob = new Blob([new Uint8Array(pdf.buffer)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `payments_report_${Date.now()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('Payments report exported successfully!')
    } else {
      // CSV export
      const headers = ['Payment #', 'Client', 'Date', 'Paid To', 'Description', 'Amount', 'Account Credited']
      const csvContent = [
        headers.join(','),
        ...payments.map(payment => [
          payment.payment_number || 'N/A',
          payment.client?.name || 'Unknown',
          new Date(payment.date_created).toLocaleDateString(),
          payment.paid_to || '-',
          payment.description || '-',
          (payment.amount || 0).toFixed(2),
          payment.account_credited || '-'
        ].join(','))
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `payments_${Date.now()}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Payments report exported to CSV successfully!')
    }
  } catch (error) {
    console.error('Export error:', error)
    toast.error('Failed to export payments report')
  }
} 

export const exportExpensesReport = async (expenses: any[], format: 'pdf' | 'csv' = 'pdf', expenseType: 'client' | 'company' = 'company') => {
  try {
    if (format === 'pdf') {
      // Use the new dynamic template system with pagination support
      const { generateDynamicTemplateWithPagination } = await import('./report-pdf-templates')
      
      // Get custom table headers based on expense type
      const customTableHeaders = expenseType === 'company' 
        ? ['Expense #', 'Date', 'Department', 'Category', 'Description', 'Amount', 'Account Debited']
        : ['Expense #', 'Date', 'Client', 'Description', 'Amount', 'Account Debited'];
      
      // Generate dynamic template with pagination
      const template = generateDynamicTemplateWithPagination(expenses.length, customTableHeaders, 'expenses');
      
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

      // Create inputs with actual data
      const inputs = [{
        // Company Info
        logo: companyLogoBase64,
        companyName: "CABINET MASTER STYLES & FINISHES",
        companyLocation: "Location: Ruiru Eastern By-Pass",
        companyPhone: "Tel: +254729554475",
        companyEmail: "Email: cabinetmasterstyles@gmail.com",
        
        // Report Header
        reportTitle: `${expenseType.toUpperCase()} EXPENSES REPORT`,
        reportDateLabel: 'Date:',
        reportDateValue: new Date().toLocaleDateString(),
        reportPeriodLabel: 'Period:',
        reportPeriodValue: "All Time",
        reportTypeLabel: 'Type:',
        reportTypeValue: `${expenseType.charAt(0).toUpperCase() + expenseType.slice(1)} Expenses`,
        
        // Real Data Rows (populated with actual data from expenses array)
        ...expenses.map((expense, index) => {
          if (expenseType === 'company') {
            return {
              [`expenseNumber_${index}`]: String(expense.expense_number || 'N/A'),
              [`date_${index}`]: new Date(expense.date_created).toLocaleDateString(),
              [`department_${index}`]: String(expense.department || '-'),
              [`category_${index}`]: String(expense.category || '-'),
              [`description_${index}`]: String(expense.description || '-'),
              [`amount_${index}`]: `KES ${(expense.amount || 0).toFixed(2)}`,
              [`accountDebited_${index}`]: String(expense.account_debited || '-')
            };
          } else {
            return {
              [`expenseNumber_${index}`]: String(expense.expense_number || 'N/A'),
              [`date_${index}`]: new Date(expense.date_created).toLocaleDateString(),
              [`department_${index}`]: String(expense.client?.name || 'Unknown'),
              [`category_${index}`]: String(expense.category || '-'),
              [`description_${index}`]: String(expense.description || '-'),
              [`amount_${index}`]: `KES ${(expense.amount || 0).toFixed(2)}`,
              [`accountDebited_${index}`]: String(expense.account_debited || '-')
            };
          }
        }).reduce((acc, item) => ({ ...acc, ...item }), {}),
        
        // Footer
        summaryTitle: 'Summary:',
        summaryContent: `Total ${expenseType} Expenses: ${expenses.length}`,
        totalLabel: 'Total:',
        totalValue: `KES ${expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0).toFixed(2)}`,
        preparedByLabel: `Prepared by: System`,
        approvedByLabel: `Approved by: System`,
        
        // Watermark - map to all pages
        ...Array.from({ length: Math.ceil(expenses.length / firstPageRows) + 1 }, (_, i) => ({
          [`watermarkLogo_${i}`]: watermarkLogoBase64
        })).reduce((acc, item) => ({ ...acc, ...item }), {}),
      }];
      
      // Generate and download the PDF
      const { generate } = await import('@pdfme/generator')
      const { text, rectangle, line, image } = await import('@pdfme/schemas')
      const pdf = await generate({ template, inputs, plugins: { text, rectangle, line, image } as any })
      
      // Download PDF
      const blob = new Blob([new Uint8Array(pdf.buffer)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${expenseType}_expenses_report_${Date.now()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success(`${expenseType.charAt(0).toUpperCase() + expenseType.slice(1)} expenses exported successfully!`)
    } else {
      // CSV export
      const headers = ['Expense #', 'Date', 'Category', 'Description', 'Amount', 'Type', 'Status']
      const csvContent = [
        headers.join(','),
        ...expenses.map(expense => [
          expense.expense_number || 'N/A',
          new Date(expense.date_created).toLocaleDateString(),
          expense.category || 'N/A',
          expense.description || 'N/A',
          (expense.amount || 0).toFixed(2),
          expense.expense_type || 'N/A',
          expense.status || 'Active'
        ].join(','))
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${expenseType}_expenses_${Date.now()}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success(`${expenseType.charAt(0).toUpperCase() + expenseType.slice(1)} expenses exported to CSV successfully!`)
    }
  } catch (error) {
    console.error('Export error:', error)
    toast.error(`Failed to export ${expenseType} expenses`)
  }
} 