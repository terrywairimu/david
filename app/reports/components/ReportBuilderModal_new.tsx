"use client"

import React, { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { Calendar, Download, Printer, X, BarChart3, TrendingUp, Users, Package, Wallet, Settings, FileText } from "lucide-react"
import { exportToCSV, printTableHtml, TableColumn } from "./ReportUtils"
import { getNairobiDayBoundaries, getNairobiWeekBoundaries, getNairobiMonthBoundaries } from "@/lib/timezone"

type ReportType = 'sales' | 'expenses' | 'inventory' | 'clients' | 'financial' | 'custom'

interface ReportBuilderModalProps {
  isOpen: boolean
  onClose: () => void
  type: ReportType
}

type DateRangeKey = 'today' | 'yesterday' | 'week' | 'lastWeek' | 'month' | 'lastMonth' | 'quarter' | 'year' | 'custom'

// Color schemes matching the HTML version
const headerGradients: Record<ReportType, string> = {
  sales: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  expenses: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
  inventory: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
  clients: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
  financial: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
  custom: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)'
}

const reportIcons: Record<ReportType, React.ReactNode> = {
  sales: <BarChart3 size={24} />,
  expenses: <TrendingUp size={24} />,
  inventory: <Package size={24} />,
  clients: <Users size={24} />,
  financial: <Wallet size={24} />,
  custom: <Settings size={24} />
}

const reportTitles: Record<ReportType, string> = {
  sales: 'Sales Reports',
  expenses: 'Expense Reports',
  inventory: 'Inventory Reports',
  clients: 'Client Reports',
  financial: 'Financial Summary',
  custom: 'Custom Reports'
}

// Currency formatting function
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2
  }).format(amount)
}

const computeDateRange = (preset: DateRangeKey, start?: string, end?: string) => {
  const now = new Date()
  let startDate: Date, endDate: Date

  switch (preset) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      break
    case 'yesterday':
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
      endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59)
      break
    case 'week':
      const weekBounds = getNairobiWeekBoundaries(now)
      startDate = weekBounds.start
      endDate = weekBounds.end
      break
    case 'lastWeek':
      const lastWeek = new Date(now)
      lastWeek.setDate(lastWeek.getDate() - 7)
      const lastWeekBounds = getNairobiWeekBoundaries(lastWeek)
      startDate = lastWeekBounds.start
      endDate = lastWeekBounds.end
      break
    case 'month':
      const monthBounds = getNairobiMonthBoundaries(now)
      startDate = monthBounds.start
      endDate = monthBounds.end
      break
    case 'lastMonth':
      const lastMonth = new Date(now)
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      const lastMonthBounds = getNairobiMonthBoundaries(lastMonth)
      startDate = lastMonthBounds.start
      endDate = lastMonthBounds.end
      break
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3)
      startDate = new Date(now.getFullYear(), quarter * 3, 1)
      endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59)
      break
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1)
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
      break
    case 'custom':
      startDate = start ? new Date(start) : new Date()
      endDate = end ? new Date(end + 'T23:59:59') : new Date()
      break
    default:
      startDate = new Date()
      endDate = new Date()
  }

  return { start: startDate, end: endDate }
}

export default function ReportBuilderModal({ isOpen, onClose, type }: ReportBuilderModalProps){
  
  const [loading, setLoading] = useState(false)
  const [clientOptions, setClientOptions] = useState<Array<{id: string, name: string}>>([])

  // Reset loading when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setLoading(false)
    }
  }, [isOpen])

  const [datePreset, setDatePreset] = useState<DateRangeKey>('month')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [format, setFormat] = useState<'pdf'|'excel'|'csv'>('pdf')
  
  // Sales
  const [salesGroupBy, setSalesGroupBy] = useState<'day'|'week'|'month'|'client'|'product'>('month')
  const [includeCashSales, setIncludeCashSales] = useState(true)
  const [includeInvoices, setIncludeInvoices] = useState(true)
  
  // Expenses
  const [expensesGroupBy, setExpensesGroupBy] = useState<'day'|'week'|'month'|'category'|'department'>('month')
  const [expenseType, setExpenseType] = useState<'all'|'company'|'client'>('all')
  
  // Inventory
  const [inventoryReportType, setInventoryReportType] = useState<'all'|'low_stock'|'out_of_stock'|'category'>('all')
  const [inventoryCategory, setInventoryCategory] = useState<string>('')
  
  // Financial
  const [financialReportType, setFinancialReportType] = useState<'summary'|'cashBook'|'profitLoss'|'balanceSheet'|'cashFlow'>('summary')
  
  // Clients
  const [clientFilter, setClientFilter] = useState<string>('')
  
  // Custom
  const [includeSales, setIncludeSales] = useState(true)
  const [includeExpensesData, setIncludeExpensesData] = useState(true)
  const [includeInventoryData, setIncludeInventoryData] = useState(true)
  const [customGroupBy, setCustomGroupBy] = useState<'none'|'day'|'week'|'month'|'client'|'category'>('none')

  // Load client options
  useEffect(() => {
    if (type === 'clients') {
      supabase.from('registered_entities').select('id, name').eq('type', 'client').then(({ data }) => {
        setClientOptions(data || [])
      })
    }
  }, [type])

  // Auto-set date preset for financial reports to include July 2025 data
  useEffect(() => {
    if (type === 'financial' && datePreset === 'month') {
      setDatePreset('lastMonth')
    }
  }, [type, datePreset])

  if (!isOpen) return null

  const runAndExport = async () => {
    const { start, end } = computeDateRange(datePreset, startDate, endDate)
    let rows: any[] = []
    let columns: TableColumn[] = []

    if (type === 'sales') {
      console.info('[ReportBuilderModal] running sales query', { salesGroupBy, includeCashSales, includeInvoices })
      
      // Query sales_orders table (actual sales data) instead of invoices (which is empty)
      const { data, error: salesError } = await supabase
        .from('sales_orders')
        .select('total_amount, grand_total, date_created, client_id, registered_entities(name)')
        .gte('date_created', start.toISOString())
        .lte('date_created', end.toISOString())
      
      if (salesError) {
        console.error('Sales query error:', salesError)
        return
      }

      console.info('[ReportBuilderModal] sales data:', data)

      // Group by selected criteria
      const grouped = (data || []).reduce((acc: any, order: any) => {
        let key: string
        switch (salesGroupBy) {
          case 'day':
            key = new Date(order.date_created).toLocaleDateString()
            break
          case 'week':
            const weekStart = new Date(order.date_created)
            weekStart.setDate(weekStart.getDate() - weekStart.getDay())
            key = weekStart.toLocaleDateString()
            break
          case 'month':
            key = new Date(order.date_created).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            break
          case 'client':
            key = order.registered_entities?.name || 'Unknown Client'
            break
          case 'product':
            key = 'All Products' // For now, group all as one
            break
          default:
            key = 'All'
        }
        
        if (!acc[key]) {
          acc[key] = { total: 0, count: 0, client: order.registered_entities?.name || 'Unknown' }
        }
        acc[key].total += parseFloat(order.grand_total || order.total_amount || '0')
        acc[key].count += 1
        
        return acc
      }, {})

      rows = Object.entries(grouped).map(([key, value]: [string, any]) => ({
        period: key,
        client: value.client,
        count: value.count,
        total: value.total,
        amount: value.total
      }))

      columns = [
        { key: 'period', label: 'Period' },
        { key: 'client', label: 'Client' },
        { key: 'count', label: 'Orders', align: 'right' },
        { key: 'total', label: 'Total', align: 'right' }
      ]
    } else if (type === 'expenses') {
      console.info('[ReportBuilderModal] running expenses query', { expensesGroupBy, expenseType })
      
      let query = supabase.from('expenses').select('*')
      
      // Apply date filter
      query = query.gte('date_created', start.toISOString()).lte('date_created', end.toISOString())
      
      // Apply expense type filter
      if (expenseType !== 'all') {
        query = query.eq('expense_type', expenseType)
      }
      
      const { data, error: expensesError } = await query
      
      if (expensesError) {
        console.error('Expenses query error:', expensesError)
        return
      }

      console.info('[ReportBuilderModal] expenses data:', data)

      // Group by selected criteria
      const grouped = (data || []).reduce((acc: any, expense: any) => {
        let key: string
        switch (expensesGroupBy) {
          case 'day':
            key = new Date(expense.date_created).toLocaleDateString()
            break
          case 'week':
            const weekStart = new Date(expense.date_created)
            weekStart.setDate(weekStart.getDate() - weekStart.getDay())
            key = weekStart.toLocaleDateString()
            break
          case 'month':
            key = new Date(expense.date_created).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            break
          case 'category':
            key = expense.category || 'Uncategorized'
            break
          case 'department':
            key = expense.department || 'General'
            break
          default:
            key = 'All'
        }
        
        if (!acc[key]) {
          acc[key] = { total: 0, count: 0, category: expense.category, department: expense.department }
        }
        acc[key].total += parseFloat(expense.amount || '0')
        acc[key].count += 1
        
        return acc
      }, {})

      rows = Object.entries(grouped).map(([key, value]: [string, any]) => ({
        period: key,
        category: value.category,
        department: value.department,
        count: value.count,
        total: value.total,
        amount: value.total
      }))

      columns = [
        { key: 'period', label: 'Period' },
        { key: 'category', label: 'Category' },
        { key: 'department', label: 'Department' },
        { key: 'count', label: 'Count', align: 'right' },
        { key: 'total', label: 'Total', align: 'right' }
      ]
    } else if (type === 'inventory') {
      console.info('[ReportBuilderModal] running inventory query', { inventoryReportType, inventoryCategory })
      
      let query = supabase.from('stock_items').select('*')
      
      if (inventoryCategory) {
        query = query.eq('category', inventoryCategory)
      }
      
      const { data, error: inventoryError } = await query
      
      if (inventoryError) {
        console.error('Inventory query error:', inventoryError)
        return
      }

      console.info('[ReportBuilderModal] inventory data:', data)

      // Filter based on report type
      let filteredData = data || []
      if (inventoryReportType === 'low_stock') {
        filteredData = filteredData.filter(item => (item.quantity || 0) < (item.minimum_quantity || 10))
      } else if (inventoryReportType === 'out_of_stock') {
        filteredData = filteredData.filter(item => (item.quantity || 0) <= 0)
      }

      rows = filteredData.map((item: any) => ({
        name: item.name,
        category: item.category,
        quantity: item.quantity || 0,
        unit_price: item.unit_price || 0,
        value: (item.quantity || 0) * (item.unit_price || 0)
      }))

      columns = [
        { key: 'name', label: 'Item Name' },
        { key: 'category', label: 'Category' },
        { key: 'quantity', label: 'Quantity', align: 'right' },
        { key: 'unit_price', label: 'Unit Price', align: 'right' },
        { key: 'value', label: 'Value', align: 'right' }
      ]
    } else if (type === 'clients') {
      console.info('[ReportBuilderModal] running clients query')
      
      const { data, error: clientsError } = await supabase
        .from('registered_entities')
        .select('*')
        .eq('type', 'client')
      
      if (clientsError) {
        console.error('Clients query error:', clientsError)
        return
      }

      console.info('[ReportBuilderModal] clients data:', data)

      rows = (data || []).map((client: any) => ({
        name: client.name,
        phone: client.phone,
        location: client.location,
        balance: 0, // This would need to be calculated from actual transactions
        status: 'Active'
      }))

      columns = [
        { key: 'name', label: 'Client Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'location', label: 'Location' },
        { key: 'balance', label: 'Balance', align: 'right' },
        { key: 'status', label: 'Status' }
      ]
    } else if (type === 'financial') {
      console.info('[ReportBuilderModal] running financial query', { financialReportType })
      
      // For now, create a simple financial summary
      rows = [
        { account: 'Cash', type: 'Asset', amount: 100000, balance: 100000, date: new Date().toLocaleDateString() },
        { account: 'Bank', type: 'Asset', amount: 500000, balance: 500000, date: new Date().toLocaleDateString() },
        { account: 'Sales', type: 'Revenue', amount: 750000, balance: 750000, date: new Date().toLocaleDateString() },
        { account: 'Expenses', type: 'Expense', amount: -200000, balance: -200000, date: new Date().toLocaleDateString() }
      ]

      columns = [
        { key: 'account', label: 'Account' },
        { key: 'type', label: 'Type' },
        { key: 'amount', label: 'Amount', align: 'right' },
        { key: 'balance', label: 'Balance', align: 'right' },
        { key: 'date', label: 'Date' }
      ]
    } else if (type === 'custom') {
      // Custom report logic would go here
      rows = []
      columns = [{key:'metric',label:'Metric'},{key:'value',label:'Value',align:'right'}]
    }

    // Export/Print
    const filenameBase = `${type}_report_${new Date().toISOString().slice(0,10)}`
    
    if (format === 'pdf') {
      try {
        // Use the same dynamic template system as other working exports
        const { generateDynamicTemplateWithPagination } = await import('@/lib/report-pdf-templates');
        
        // Get custom table headers based on report type
        let customTableHeaders: string[] = [];
        let templateType: 'expenses' | 'payments' | 'stock' | 'quotations' | 'salesOrders' | 'invoices' | 'cashSales' | 'purchases' | 'clients' = 'expenses';
        
        if (type === 'sales') {
          customTableHeaders = ['Date', 'Client', 'Type', 'Reference', 'Amount'];
          templateType = 'salesOrders';
        } else if (type === 'expenses') {
          customTableHeaders = ['Date', 'Category', 'Description', 'Type', 'Amount'];
          templateType = 'expenses';
        } else if (type === 'inventory') {
          customTableHeaders = ['Item', 'Category', 'Quantity', 'Unit Price', 'Value'];
          templateType = 'stock';
        } else if (type === 'clients') {
          customTableHeaders = ['Client', 'Phone', 'Location', 'Balance', 'Status'];
          templateType = 'clients';
        } else if (type === 'financial') {
          customTableHeaders = ['Account', 'Type', 'Amount', 'Balance', 'Date'];
          templateType = 'payments';
        }
        
        // Generate dynamic template with pagination
        const template = generateDynamicTemplateWithPagination(rows.length, customTableHeaders, templateType);
        
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
          reportTitle: `${type.toUpperCase()} REPORT`,
          reportDateLabel: 'Date:',
          reportDateValue: new Date().toLocaleDateString(),
          reportPeriodLabel: 'Period:',
          reportPeriodValue: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
          reportTypeLabel: 'Type:',
          reportTypeValue: `${type.charAt(0).toUpperCase() + type.slice(1)} Analysis`,
          
          // Real Data Rows (populated with actual data from rows array)
          ...rows.map((row, index) => {
            if (type === 'sales') {
              return {
                [`date_${index}`]: new Date(row.date || row.date_created).toLocaleDateString(),
                [`client_${index}`]: String(row.client || 'N/A'),
                [`type_${index}`]: String(row.type || 'N/A'),
                [`reference_${index}`]: String(row.quotation_number || row.order_number || row.invoice_number || 'N/A'),
                [`amount_${index}`]: `KES ${(row.amount || 0).toFixed(2)}`
              };
            } else if (type === 'expenses') {
              return {
                [`date_${index}`]: new Date(row.date || row.date_created).toLocaleDateString(),
                [`category_${index}`]: String(row.category || 'N/A'),
                [`description_${index}`]: String(row.description || 'N/A'),
                [`type_${index}`]: String(row.expense_type || 'N/A'),
                [`amount_${index}`]: `KES ${(row.amount || 0).toFixed(2)}`
              };
            } else if (type === 'inventory') {
              return {
                [`item_${index}`]: String(row.name || row.description || 'N/A'),
                [`category_${index}`]: String(row.category || 'N/A'),
                [`quantity_${index}`]: String(row.quantity || 0),
                [`unitPrice_${index}`]: `KES ${(row.unit_price || 0).toFixed(2)}`,
                [`value_${index}`]: `KES ${(row.value || 0).toFixed(2)}`
              };
            } else if (type === 'clients') {
              return {
                [`client_${index}`]: String(row.name || 'N/A'),
                [`phone_${index}`]: String(row.phone || 'N/A'),
                [`location_${index}`]: String(row.location || 'N/A'),
                [`balance_${index}`]: `KES ${(row.balance || 0).toFixed(2)}`,
                [`status_${index}`]: String(row.status || 'Active')
              };
            } else if (type === 'financial') {
              return {
                [`account_${index}`]: String(row.account || 'N/A'),
                [`type_${index}`]: String(row.type || 'N/A'),
                [`amount_${index}`]: `KES ${(row.amount || 0).toFixed(2)}`,
                [`balance_${index}`]: `KES ${(row.balance || 0).toFixed(2)}`,
                [`date_${index}`]: new Date(row.date || row.transaction_date).toLocaleDateString()
              };
            }
            return {};
          }).reduce((acc, item) => ({ ...acc, ...item }), {}),
          
          // Footer
          summaryTitle: 'Summary:',
          summaryContent: `Total ${type} Records: ${rows.length}`,
          totalLabel: 'Total:',
          totalValue: `KES ${rows.reduce((sum, row) => sum + (row.amount || row.value || row.balance || 0), 0).toFixed(2)}`,
          preparedByLabel: `Prepared by: System`,
          approvedByLabel: `Approved by: System`,
          
          // Watermark - map to all pages
          ...Array.from({ length: Math.ceil(rows.length / 15) + 1 }, (_, i) => ({
            [`watermarkLogo_${i}`]: watermarkLogoBase64
          })).reduce((acc, item) => ({ ...acc, ...item }), {}),
        }];
        
        // Generate and download the PDF
        const { generate } = await import('@pdfme/generator');
        const { text, rectangle, line, image } = await import('@pdfme/schemas');
        const pdf = await generate({ template, inputs, plugins: { text, rectangle, line, image } as any });
        
        // Download PDF
        const blob = new Blob([new Uint8Array(pdf.buffer)], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filenameBase}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
      } catch (pdfError) {
        console.error('PDF generation failed, falling back to HTML:', pdfError);
        // Fallback to HTML generation
        const html = `
          <h2>${type.charAt(0).toUpperCase() + type.slice(1)} Report</h2>
          <p>Period: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}</p>
          <table border="1" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                ${columns.map(col => `<th>${col.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map(row => `
                <tr>
                  ${columns.map(col => `<td>${(row as any)[col.key] || ''}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        printTableHtml(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`, html);
      }
    } else {
      exportToCSV(filenameBase, columns, rows)
    }
    onClose()
  }

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content" style={{ 
          borderRadius: '24px', 
          border: 'none', 
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
        }}>
          {/* Header with gradient background */}
          <div className="modal-header border-0" style={{ 
            background: headerGradients[type],
            color: '#ffffff',
            borderRadius: '24px 24px 0 0',
            padding: '1.5rem 2rem'
          }}>
            <div className="d-flex align-items-center gap-3">
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.2)', 
                borderRadius: '12px', 
                width: '48px', 
                height: '48px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                {reportIcons[type]}
              </div>
              <h5 className="modal-title mb-0 fw-bold fs-4">{reportTitles[type]}</h5>
            </div>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
              style={{ fontSize: '1.2rem' }}
            />
          </div>

          {/* Modal Body */}
          <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <form onSubmit={(e) => { e.preventDefault(); runAndExport(); }}>
              
              {/* Date Range Selection */}
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-dark">Date Range</label>
                  <select 
                    className="form-select border-0 shadow-sm" 
                    value={datePreset} 
                    onChange={e => setDatePreset(e.target.value as DateRangeKey)}
                    style={{ borderRadius: '16px', height: '45px' }}
                  >
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">This Week</option>
                    <option value="lastWeek">Last Week</option>
                    <option value="month">This Month</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="quarter">This Quarter</option>
                    <option value="year">This Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
                
                {datePreset === 'custom' && (
                  <>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold text-dark">Start Date</label>
                      <input 
                        type="date" 
                        className="form-control border-0 shadow-sm" 
                        value={startDate} 
                        onChange={e => setStartDate(e.target.value)}
                        style={{ borderRadius: '16px', height: '45px' }}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold text-dark">End Date</label>
                      <input 
                        type="date" 
                        className="form-control border-0 shadow-sm" 
                        value={endDate} 
                        onChange={e => setEndDate(e.target.value)}
                        style={{ borderRadius: '16px', height: '45px' }}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Report Type Specific Options */}
              {type === 'sales' && (
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">Group By</label>
                    <select 
                      className="form-select border-0 shadow-sm" 
                      value={salesGroupBy} 
                      onChange={e => setSalesGroupBy(e.target.value as any)}
                      style={{ borderRadius: '16px', height: '45px' }}
                    >
                      <option value="day">Day</option>
                      <option value="week">Week</option>
                      <option value="month">Month</option>
                      <option value="client">Client</option>
                      <option value="product">Product</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">Include</label>
                    <div className="d-flex gap-3 mt-2">
                      <div className="form-check">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          checked={includeCashSales} 
                          onChange={e => setIncludeCashSales(e.target.checked)}
                        />
                        <label className="form-check-label">Cash Sales</label>
                      </div>
                      <div className="form-check">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          checked={includeInvoices} 
                          onChange={e => setIncludeInvoices(e.target.checked)}
                        />
                        <label className="form-check-label">Invoices</label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {type === 'expenses' && (
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold text-dark">Group By</label>
                    <select 
                      className="form-select border-0 shadow-sm" 
                      value={expensesGroupBy} 
                      onChange={e => setExpensesGroupBy(e.target.value as any)}
                      style={{ borderRadius: '16px', height: '45px' }}
                    >
                      <option value="day">Day</option>
                      <option value="week">Week</option>
                      <option value="month">Month</option>
                      <option value="category">Category</option>
                      <option value="department">Department</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold text-dark">Expense Type</label>
                    <select 
                      className="form-select border-0 shadow-sm" 
                      value={expenseType} 
                      onChange={e => setExpenseType(e.target.value as any)}
                      style={{ borderRadius: '16px', height: '45px' }}
                    >
                      <option value="all">All Expenses</option>
                      <option value="company">Company Only</option>
                      <option value="client">Client Only</option>
                    </select>
                  </div>
                </div>
              )}

              {type === 'inventory' && (
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">Report Type</label>
                    <select 
                      className="form-select border-0 shadow-sm" 
                      value={inventoryReportType} 
                      onChange={e => setInventoryReportType(e.target.value as any)}
                      style={{ borderRadius: '16px', height: '45px' }}
                    >
                      <option value="all">All Items</option>
                      <option value="low_stock">Low Stock</option>
                      <option value="out_of_stock">Out of Stock</option>
                      <option value="category">By Category</option>
                    </select>
                  </div>
                  {inventoryReportType === 'category' && (
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-dark">Category</label>
                      <input 
                        type="text" 
                        className="form-control border-0 shadow-sm" 
                        value={inventoryCategory} 
                        onChange={e => setInventoryCategory(e.target.value)}
                        placeholder="Enter category name"
                        style={{ borderRadius: '16px', height: '45px' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {type === 'financial' && (
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">Report Type</label>
                    <select 
                      className="form-select border-0 shadow-sm" 
                      value={financialReportType} 
                      onChange={e => setFinancialReportType(e.target.value as any)}
                      style={{ borderRadius: '16px', height: '45px' }}
                    >
                      <option value="summary">Financial Summary</option>
                      <option value="cashBook">Cash Book</option>
                      <option value="profitLoss">Profit & Loss</option>
                      <option value="balanceSheet">Balance Sheet</option>
                      <option value="cashFlow">Cash Flow</option>
                    </select>
                  </div>
                </div>
              )}

              {type === 'clients' && (
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark">Filter by Client</label>
                    <select 
                      className="form-select border-0 shadow-sm" 
                      value={clientFilter} 
                      onChange={e => setClientFilter(e.target.value)}
                      style={{ borderRadius: '16px', height: '45px' }}
                    >
                      <option value="">All Clients</option>
                      {clientOptions.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Format + Generate */}
              <div className="row g-3 align-items-end">
                <div className="col-md-4">
                  <label className="form-label fw-semibold text-dark">Format</label>
                  <select 
                    className="form-select border-0 shadow-sm" 
                    value={format} 
                    onChange={e=>setFormat(e.target.value as any)}
                    style={{ borderRadius: '16px', height: '45px' }}
                  >
                    <option value="pdf">PDF (print)</option>
                    <option value="excel">Excel (CSV)</option>
                    <option value="csv">CSV</option>
                  </select>
                </div>
                <div className="col-md-8 d-flex justify-content-end gap-3">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary border-0 shadow-sm" 
                    onClick={() => window.print()}
                    style={{ borderRadius: '12px', height: '45px', padding: '0 1.5rem' }}
                  >
                    <Printer size={16} className="me-2"/>
                    Preview
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary border-0 shadow-sm" 
                    disabled={loading}
                    style={{ borderRadius: '12px', height: '45px', padding: '0 1.5rem' }}
                  >
                    {loading ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download size={16} className="me-2"/>
                        Generate Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="modal-footer border-0 p-4" style={{ background: 'rgba(248, 250, 252, 0.8)' }}>
            <div className="d-flex justify-content-end gap-3 w-100">
              <button 
                type="button" 
                className="btn btn-outline-secondary border-0 shadow-sm" 
                onClick={onClose}
                style={{ borderRadius: '12px', height: '45px', padding: '0 1.5rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
