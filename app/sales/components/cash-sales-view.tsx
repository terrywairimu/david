"use client"

import React, { useEffect, useState } from "react"
import { Plus, Edit, Trash2, Eye, Download, FileText, Receipt, CreditCard } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { useAuth } from "@/lib/auth-context"
import { ActionGuard } from "@/components/ActionGuard"
import { toast } from "sonner"
import CashSaleModal from "@/components/ui/cash-sale-modal-standard"
import { 
  printDocument, 
  downloadDocument,
  exportCashSales as exportCashSalesReport
} from "@/lib/workflow-utils"
import { useGlobalProgress } from "@/components/GlobalProgressManager"
import ExportDropdown from "@/components/ui/export-dropdown"
import { CashSale } from "@/lib/types"
import { formatNumber } from "@/lib/format-number"

const CashSalesView: React.FC = () => {
  const { canPerformAction } = useAuth()
  const { startDownload, completeDownload, setError } = useGlobalProgress()
  const [cashSales, setCashSales] = useState<CashSale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [clientFilter, setClientFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [specificDate, setSpecificDate] = useState("")
  const [periodStartDate, setPeriodStartDate] = useState("")
  const [periodEndDate, setPeriodEndDate] = useState("")
  const [clients, setClients] = useState<{ value: string; label: string }[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedCashSale, setSelectedCashSale] = useState<CashSale | undefined>()
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("create")

  useEffect(() => {
    fetchCashSales()
    fetchClients()
    
    // Set up real-time subscription for cash sales
    const cashSalesSubscription = supabase
      .channel('cash_sales_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_sales' }, (payload) => {
        console.log('Cash sales change detected:', payload)
        fetchCashSales() // Refresh cash sales when changes occur
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_sale_items' }, (payload) => {
        console.log('Cash sale items change detected:', payload)
        fetchCashSales() // Refresh cash sales when items change
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registered_entities' }, (payload) => {
        console.log('Registered entities change detected:', payload)
        fetchClients() // Refresh clients when changes occur
      })
      .subscribe()

    return () => {
      supabase.removeChannel(cashSalesSubscription)
    }
  }, [])

  const fetchCashSales = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/sales/cash-sales", { credentials: "include" })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setCashSales(Array.isArray(data) ? data : [])
    } catch (error) {
        console.error("Error fetching cash sales:", error)
      toast.error("Failed to load cash sales")
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/sales/clients", { credentials: "include" })
      if (!res.ok) return
      const data = await res.json()
      setClients([
        { value: "", label: "All Clients" },
        ...(Array.isArray(data) ? data : []).map((c: { id: number; name: string }) => ({
          value: c.id.toString(),
          label: c.name,
        })),
      ])
    } catch (error) {
      console.error("Error fetching clients:", error)
    }
  }

  const handleDateFilterChange = (value: string) => {
    setDateFilter(value)
    if (value !== "specific") {
      setSpecificDate("")
    }
    if (value !== "period") {
      setPeriodStartDate("")
      setPeriodEndDate("")
    }
  }

  const getFilteredCashSales = () => {
    let filtered = [...cashSales]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (sale) =>
      sale.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.original_quotation_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.original_order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.original_invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Client filter
    if (clientFilter) {
      filtered = filtered.filter(sale => sale.client_id.toString() === clientFilter)
    }

    // Date filter
    if (dateFilter) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.date_created)
        const saleDay = new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate())
        
        switch (dateFilter) {
          case "today":
            return saleDay.getTime() === today.getTime()
          case "week":
            const weekStart = new Date(today)
            weekStart.setDate(today.getDate() - today.getDay())
            return saleDay >= weekStart
          case "month":
            return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear()
          case "year":
            return saleDate.getFullYear() === now.getFullYear()
          case "specific":
            if (specificDate) {
              const specDate = new Date(specificDate)
              const specDay = new Date(specDate.getFullYear(), specDate.getMonth(), specDate.getDate())
              return saleDay.getTime() === specDay.getTime()
            }
            return true
          case "period":
            if (periodStartDate && periodEndDate) {
              const startDate = new Date(periodStartDate)
              const endDate = new Date(periodEndDate)
              const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
              const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
              return saleDay >= startDay && saleDay <= endDay
            }
            return true
          default:
            return true
        }
      })
    }

    return filtered
  }

  const filteredCashSales = getFilteredCashSales()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return "badge bg-success"
      case "cancelled":
        return "badge bg-danger"
      default:
        return "badge bg-secondary"
    }
  }

  const handleModalSave = async (cashSaleData: any) => {
    try {
      if (modalMode === "create") {
        // Create new cash sale
        const { data: newCashSale, error: cashSaleError } = await supabase
          .from("cash_sales")
          .insert({
            sale_number: cashSaleData.sale_number,
            client_id: cashSaleData.client_id,
            invoice_id: cashSaleData.invoice_id,
            sales_order_id: cashSaleData.sales_order_id,
            quotation_id: cashSaleData.quotation_id,
            original_quotation_number: cashSaleData.original_quotation_number,
            original_order_number: cashSaleData.original_order_number,
            original_invoice_number: cashSaleData.original_invoice_number,
            date_created: cashSaleData.date_created,
            payment_method: cashSaleData.payment_method,
            payment_reference: cashSaleData.payment_reference,
            cabinet_total: cashSaleData.cabinet_total,
            worktop_total: cashSaleData.worktop_total,
            accessories_total: cashSaleData.accessories_total,
            labour_percentage: cashSaleData.labour_percentage,
            labour_total: cashSaleData.labour_total,
            total_amount: cashSaleData.total_amount,
            grand_total: cashSaleData.grand_total,
            include_accessories: cashSaleData.include_accessories,
            status: cashSaleData.status,
            notes: cashSaleData.notes,
            terms_conditions: cashSaleData.terms_conditions
          })
          .select()
          .single()

        if (cashSaleError) throw cashSaleError

        // Insert cash sale items
        if (cashSaleData.items && cashSaleData.items.length > 0) {
          const cashSaleItems = cashSaleData.items.map((item: any) => ({
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

        toast.success("Cash sale created successfully")
      } else if (modalMode === "edit") {
        // Update existing cash sale
        const { error: updateError } = await supabase
          .from("cash_sales")
          .update({
            client_id: cashSaleData.client_id,
            date_created: cashSaleData.date_created,
            payment_method: cashSaleData.payment_method,
            payment_reference: cashSaleData.payment_reference,
            cabinet_total: cashSaleData.cabinet_total,
            worktop_total: cashSaleData.worktop_total,
            accessories_total: cashSaleData.accessories_total,
            labour_percentage: cashSaleData.labour_percentage,
            labour_total: cashSaleData.labour_total,
            total_amount: cashSaleData.total_amount,
            grand_total: cashSaleData.grand_total,
            include_accessories: cashSaleData.include_accessories,
            status: cashSaleData.status,
            notes: cashSaleData.notes,
            terms_conditions: cashSaleData.terms_conditions
          })
          .eq("id", selectedCashSale?.id)

        if (updateError) throw updateError

        // Delete existing items and insert new ones
        const { error: deleteError } = await supabase
          .from("cash_sale_items")
          .delete()
          .eq("cash_sale_id", selectedCashSale?.id)

        if (deleteError) throw deleteError

        // Insert updated items
        if (cashSaleData.items && cashSaleData.items.length > 0) {
          const cashSaleItems = cashSaleData.items.map((item: any) => ({
            cash_sale_id: selectedCashSale?.id,
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

        toast.success("Cash sale updated successfully")
      }

      fetchCashSales()
    } catch (error) {
      console.error("Error saving cash sale:", error)
      toast.error("Failed to save cash sale")
    }
  }

  const handleView = (cashSale: CashSale) => {
    setSelectedCashSale(cashSale)
    setModalMode("view")
    setShowModal(true)
  }

  const handleEdit = (cashSale: CashSale) => {
    setSelectedCashSale(cashSale)
    setModalMode("edit")
    setShowModal(true)
  }

  // Export function
  const exportCashSales = async (format: 'pdf' | 'csv') => {
    startDownload(`cash_sales_${new Date().toISOString().split('T')[0]}`, format)
    try {
      await exportCashSalesReport(cashSales, format)
      setTimeout(() => completeDownload(), 500)
    } catch (error) {
      setError('Failed to export cash sales')
      toast.error('Failed to export cash sales')
    }
  }

  const handleDelete = async (cashSale: CashSale) => {
    if (window.confirm(`Are you sure you want to delete cash sale ${cashSale.sale_number}?`)) {
      try {
        const { error } = await supabase
          .from("cash_sales")
          .delete()
          .eq("id", cashSale.id)

        if (error) throw error

        toast.success("Cash sale deleted successfully")
        fetchCashSales()
      } catch (error) {
        console.error("Error deleting cash sale:", error)
        toast.error("Failed to delete cash sale")
      }
    }
  }

  const handlePrint = (cashSale: CashSale) => {
    printDocument(`cash-sale-${cashSale.id}`, `CashSale-${cashSale.sale_number}`)
  }

  const handleDownload = async (cashSale: CashSale) => {
    startDownload(`CashSale-${cashSale.sale_number}`, 'pdf')
    try {
      await downloadDocument(`cash-sale-${cashSale.id}`, `CashSale-${cashSale.sale_number}`)
      completeDownload()
    } catch (error) {
      setError('Failed to download cash sale')
      toast.error('Failed to download cash sale')
    }
  }

  return (
    <div className="cash-sales-view">
    <div>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5>Cash Sales</h5>
        </div>

        {/* Search and Filter Row */}
        <div className="cash-sales-search-filter mb-3">
          {/* Desktop Layout */}
          <div className="d-none d-md-block">
            <div className="row">
              <div className="col-md-3">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0">
                    <i className="fas fa-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search cash sales..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ borderRadius: "0 16px 16px 0", height: "45px" }}
                  />
                </div>
              </div>
              
              <div className="col-md-3">
                <select
                  className="form-select border-0 shadow-sm"
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  style={{ borderRadius: "16px", height: "45px" }}
                >
                  {clients.map((client) => (
                    <option key={client.value} value={client.value}>
                      {client.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <select
                  className="form-select border-0 shadow-sm"
                  value={dateFilter}
                  onChange={(e) => handleDateFilterChange(e.target.value)}
                  style={{ borderRadius: "16px", height: "45px" }}
                >
                  <option value="">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                  <option value="specific">Specific Date</option>
                  <option value="period">Specific Period</option>
                </select>
                
                {dateFilter === "specific" && (
                  <input
                    type="date"
                    className="form-control border-0 shadow-sm mt-2"
                    value={specificDate}
                    onChange={(e) => setSpecificDate(e.target.value)}
                    style={{ borderRadius: "16px", height: "45px" }}
                  />
                )}
                
                {dateFilter === "period" && (
                  <div style={{ display: "block" }}>
                    <div className="d-flex align-items-center justify-content-between mt-2">
                      <input
                        type="date"
                        className="form-control border-0 shadow-sm"
                        value={periodStartDate}
                        onChange={(e) => setPeriodStartDate(e.target.value)}
                        style={{ borderRadius: "16px", height: "45px", width: "calc(50% - 10px)", minWidth: "0" }}
                      />
                      <span className="mx-2">to</span>
                      <input
                        type="date"
                        className="form-control border-0 shadow-sm"
                        value={periodEndDate}
                        onChange={(e) => setPeriodEndDate(e.target.value)}
                        style={{ borderRadius: "16px", height: "45px", width: "calc(50% - 10px)", minWidth: "0" }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="col-md-3">
                {canPerformAction("export") && (
                  <ExportDropdown
                    onExport={exportCashSales}
                    exportLabel="Export"
                    className="w-100"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="d-block d-md-none">
            {/* Search Input - Full Row */}
            <div className="mb-3">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="fas fa-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search cash sales..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ borderRadius: "0 16px 16px 0", height: "45px" }}
                />
              </div>
            </div>

            {/* Filters and Export Button - Shared Row */}
            <div className="d-flex gap-2">
              <div className="flex-fill">
                <select
                  className="form-select border-0 shadow-sm w-100"
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  style={{ borderRadius: "16px", height: "45px" }}
                >
                  {clients.map((client) => (
                    <option key={client.value} value={client.value}>
                      {client.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-fill">
                <select
                  className="form-select border-0 shadow-sm w-100"
                  value={dateFilter}
                  onChange={(e) => handleDateFilterChange(e.target.value)}
                  style={{ borderRadius: "16px", height: "45px" }}
                >
                  <option value="">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                  <option value="specific">Specific Date</option>
                  <option value="period">Specific Period</option>
                </select>
              </div>
              <div className="flex-fill">
                {canPerformAction("export") && (
                  <ExportDropdown
                    onExport={exportCashSales}
                    exportLabel="Export"
                    className="w-100"
                  />
                )}
              </div>
            </div>

            {/* Mobile Date Inputs */}
            {dateFilter === "specific" && (
              <div className="mt-2">
                <input
                  type="date"
                  className="form-control border-0 shadow-sm w-100"
                  value={specificDate}
                  onChange={(e) => setSpecificDate(e.target.value)}
                  style={{ borderRadius: "16px", height: "45px" }}
                />
              </div>
            )}
            
            {dateFilter === "period" && (
              <div className="mt-2">
                <div className="d-flex gap-2">
                  <input
                    type="date"
                    className="form-control border-0 shadow-sm flex-fill"
                    value={periodStartDate}
                    onChange={(e) => setPeriodStartDate(e.target.value)}
                    style={{ borderRadius: "16px", height: "45px" }}
                  />
                  <span className="d-flex align-items-center text-muted">to</span>
                  <input
                    type="date"
                    className="form-control border-0 shadow-sm flex-fill"
                    value={periodEndDate}
                    onChange={(e) => setPeriodEndDate(e.target.value)}
                    style={{ borderRadius: "16px", height: "45px" }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Cash Sales Table */}
      <div className="card table-section">
          <div className="responsive-table-wrapper">
            <table className="table table-hover" id="cashSalesTable">
          <thead>
            <tr>
                <th className="col-number">Receipt #</th>
              <th className="col-date">Date</th>
              <th className="col-client">Client</th>
              <th className="col-amount">Total Amount</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                  <td colSpan={5} className="text-center">
                  Loading...
                </td>
              </tr>
              ) : filteredCashSales.length === 0 ? (
              <tr>
                  <td colSpan={5} className="text-center">
                  No cash sales found
                </td>
              </tr>
            ) : (
                filteredCashSales.map((sale) => (
                <tr key={sale.id}>
                  <td className="fw-bold">{sale.sale_number}</td>
                  <td>{new Date(sale.date_created).toLocaleDateString()}</td>
                    <td>
                      <div>{sale.client?.name}</div>
                      {sale.client?.phone && (
                        <small className="text-muted">{sale.client.phone}</small>
                      )}
                  </td>
                    <td>KES {formatNumber(sale.grand_total)}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <ActionGuard actionId="view">
                          <button 
                            className="action-btn"
                            onClick={() => handleView(sale)}
                            title="View"
                          >
                            <Eye size={14} />
                          </button>
                        </ActionGuard>
                        <ActionGuard actionId="delete">
                          <button 
                            className="action-btn"
                            onClick={() => handleDelete(sale)}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </ActionGuard>
                        <ActionGuard actionId="view">
                          <button 
                            className="action-btn"
                            onClick={() => handlePrint(sale)}
                            title="Print"
                          >
                            <Download size={14} />
                          </button>
                        </ActionGuard>
                      </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
          </div>
        </div>

      {/* Cash Sale Modal */}
      <CashSaleModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleModalSave}
        cashSale={selectedCashSale}
        mode={modalMode}
      />
    </div>
    </div>
  )
}

export default CashSalesView
