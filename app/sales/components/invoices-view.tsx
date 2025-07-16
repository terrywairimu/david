"use client"

import React, { useEffect, useState } from "react"
import { Plus, Edit, Trash2, Eye, Download, FileText, Receipt, CreditCard } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import InvoiceModal from "@/components/ui/invoice-modal"
import { 
  proceedToCashSaleFromInvoice, 
  printDocument, 
  downloadDocument,
  exportInvoices as exportInvoicesReport
} from "@/lib/workflow-utils"
import { Invoice } from "@/lib/types"

const InvoicesView: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [clientFilter, setClientFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [specificDate, setSpecificDate] = useState("")
  const [periodStartDate, setPeriodStartDate] = useState("")
  const [periodEndDate, setPeriodEndDate] = useState("")
  const [clients, setClients] = useState<{ value: string; label: string }[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>()
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("create")

  useEffect(() => {
    fetchInvoices()
    fetchClients()
  }, [])

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          client:registered_entities(id, name, phone, location),
          items:invoice_items(*),
          payments:payments(id, amount, date, method, reference)
        `)
        .order("date_created", { ascending: false })

      if (error) throw error
      setInvoices(data || [])
    } catch (error) {
        console.error("Error fetching invoices:", error)
      toast.error("Failed to load invoices")
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("registered_entities")
        .select("id, name")
        .eq("type", "client")
        .order("name")

      if (error) throw error
      
        const clientOptions = [
          { value: "", label: "All Clients" },
        ...(data || []).map(client => ({
            value: client.id.toString(),
          label: client.name
        }))
        ]
      
        setClients(clientOptions)
    } catch (error) {
      console.error("Error fetching clients:", error)
    }
  }

  const calculateBalance = (invoice: Invoice) => {
    const totalPaid = invoice.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
    return invoice.grand_total - totalPaid
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

  const getFilteredInvoices = () => {
    let filtered = [...invoices]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (invoice) =>
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.original_quotation_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.original_order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Client filter
    if (clientFilter) {
      filtered = filtered.filter(invoice => invoice.client_id.toString() === clientFilter)
    }

    // Date filter
    if (dateFilter) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.date_created)
        const invoiceDay = new Date(invoiceDate.getFullYear(), invoiceDate.getMonth(), invoiceDate.getDate())
        
        switch (dateFilter) {
          case "today":
            return invoiceDay.getTime() === today.getTime()
          case "week":
            const weekStart = new Date(today)
            weekStart.setDate(today.getDate() - today.getDay())
            return invoiceDay >= weekStart
          case "month":
            return invoiceDate.getMonth() === now.getMonth() && invoiceDate.getFullYear() === now.getFullYear()
          case "year":
            return invoiceDate.getFullYear() === now.getFullYear()
          case "specific":
            if (specificDate) {
              const specDate = new Date(specificDate)
              const specDay = new Date(specDate.getFullYear(), specDate.getMonth(), specDate.getDate())
              return invoiceDay.getTime() === specDay.getTime()
            }
            return true
          case "period":
            if (periodStartDate && periodEndDate) {
              const startDate = new Date(periodStartDate)
              const endDate = new Date(periodEndDate)
              const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
              const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
              return invoiceDay >= startDay && invoiceDay <= endDay
            }
            return true
          default:
            return true
        }
      })
    }

    return filtered
  }

  const filteredInvoices = getFilteredInvoices()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "badge bg-warning"
      case "paid":
        return "badge bg-success"
      case "overdue":
        return "badge bg-danger"
      case "cancelled":
        return "badge bg-secondary"
      case "partially_paid":
        return "badge bg-info"
      case "converted_to_cash_sale":
        return "badge bg-success"
      default:
        return "badge bg-secondary"
    }
  }

  const handleModalSave = async (invoiceData: any) => {
    try {
      if (modalMode === "create") {
        // Create new invoice
        const { data: newInvoice, error: invoiceError } = await supabase
          .from("invoices")
          .insert({
            invoice_number: invoiceData.invoice_number,
            client_id: invoiceData.client_id,
            sales_order_id: invoiceData.sales_order_id,
            quotation_id: invoiceData.quotation_id,
            original_quotation_number: invoiceData.original_quotation_number,
            original_order_number: invoiceData.original_order_number,
            date_created: invoiceData.date_created,
            due_date: invoiceData.due_date,
            cabinet_total: invoiceData.cabinet_total,
            worktop_total: invoiceData.worktop_total,
            accessories_total: invoiceData.accessories_total,
            labour_percentage: invoiceData.labour_percentage,
            labour_total: invoiceData.labour_total,
            total_amount: invoiceData.total_amount,
            grand_total: invoiceData.grand_total,
            include_accessories: invoiceData.include_accessories,
            status: invoiceData.status,
            notes: invoiceData.notes,
            terms_conditions: invoiceData.terms_conditions
          })
          .select()
          .single()

        if (invoiceError) throw invoiceError

        // Insert invoice items
        if (invoiceData.items && invoiceData.items.length > 0) {
          const invoiceItems = invoiceData.items.map((item: any) => ({
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

        toast.success("Invoice created successfully")
      } else if (modalMode === "edit") {
        // Update existing invoice
        const { error: updateError } = await supabase
          .from("invoices")
          .update({
            client_id: invoiceData.client_id,
            date_created: invoiceData.date_created,
            due_date: invoiceData.due_date,
            cabinet_total: invoiceData.cabinet_total,
            worktop_total: invoiceData.worktop_total,
            accessories_total: invoiceData.accessories_total,
            labour_percentage: invoiceData.labour_percentage,
            labour_total: invoiceData.labour_total,
            total_amount: invoiceData.total_amount,
            grand_total: invoiceData.grand_total,
            include_accessories: invoiceData.include_accessories,
            status: invoiceData.status,
            notes: invoiceData.notes,
            terms_conditions: invoiceData.terms_conditions
          })
          .eq("id", selectedInvoice?.id)

        if (updateError) throw updateError

        // Delete existing items and insert new ones
        const { error: deleteError } = await supabase
          .from("invoice_items")
          .delete()
          .eq("invoice_id", selectedInvoice?.id)

        if (deleteError) throw deleteError

        // Insert updated items
        if (invoiceData.items && invoiceData.items.length > 0) {
          const invoiceItems = invoiceData.items.map((item: any) => ({
            invoice_id: selectedInvoice?.id,
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

        toast.success("Invoice updated successfully")
      }

      fetchInvoices()
    } catch (error) {
      console.error("Error saving invoice:", error)
      toast.error("Failed to save invoice")
    }
  }

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setModalMode("view")
    setShowModal(true)
  }

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setModalMode("edit")
    setShowModal(true)
  }

  // Export function
  const exportInvoices = () => {
    exportInvoicesReport(invoices)
  }

  const handleDelete = async (invoice: Invoice) => {
    if (window.confirm(`Are you sure you want to delete invoice ${invoice.invoice_number}?`)) {
      try {
        const { error } = await supabase
          .from("invoices")
          .delete()
          .eq("id", invoice.id)

        if (error) throw error

        toast.success("Invoice deleted successfully")
        fetchInvoices()
      } catch (error) {
        console.error("Error deleting invoice:", error)
        toast.error("Failed to delete invoice")
      }
    }
  }

  const handleProceedToCashSale = async (invoice: Invoice) => {
    toast.info("Cash sale conversion functionality will be available soon")
  }

  const handlePrint = (invoice: Invoice) => {
    printDocument(`invoice-${invoice.id}`, `Invoice-${invoice.invoice_number}`)
  }

  const handleDownload = (invoice: Invoice) => {
    downloadDocument(`invoice-${invoice.id}`, `Invoice-${invoice.invoice_number}`)
  }

  return (
    <div className="invoices-view">
    <div className="card-body">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5>Invoices</h5>
        </div>

        {/* Search and Filter Row */}
        <div className="row mb-3">
          <div className="col-md-3">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="fas fa-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search invoices..."
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
            <button 
              className="btn w-100 shadow-sm export-btn" 
              onClick={exportInvoices}
              style={{ borderRadius: "16px", height: "45px" }}
            >
              <i className="fas fa-download me-2"></i>
              Export
            </button>
          </div>
        </div>

      {/* Invoices Table */}
      <div className="table-responsive">
          <table className="table" id="invoicesTable">
          <thead>
            <tr>
              <th>Invoice #</th>
                <th>Date</th>
              <th>Client</th>
              <th>Total Amount</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                  <td colSpan={7} className="text-center">
                  Loading...
                </td>
              </tr>
            ) : filteredInvoices.length === 0 ? (
              <tr>
                  <td colSpan={7} className="text-center">
                  No invoices found
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="fw-bold">{invoice.invoice_number}</td>
                    <td>{new Date(invoice.date_created).toLocaleDateString()}</td>
                  <td>
                    <div>{invoice.client?.name}</div>
                    {invoice.client?.phone && (
                      <small className="text-muted">{invoice.client.phone}</small>
                    )}
                  </td>
                    <td>KES {invoice.grand_total.toFixed(2)}</td>
                    <td>KES {calculateBalance(invoice).toFixed(2)}</td>
                  <td>
                    <span className={getStatusBadge(invoice.status)}>
                        {invoice.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td>
                      <div className="d-flex gap-1">
                        <button 
                          className="action-btn"
                          onClick={() => handleView(invoice)}
                          title="View"
                        >
                      <Eye size={14} />
                    </button>
                        <button 
                          className="action-btn"
                          onClick={() => handleEdit(invoice)}
                          title="Edit"
                        >
                      <Edit size={14} />
                    </button>
                        <button 
                          className="action-btn"
                          onClick={() => handleDelete(invoice)}
                          title="Delete"
                        >
                      <Trash2 size={14} />
                    </button>
                        <button 
                          className="action-btn"
                          onClick={() => handlePrint(invoice)}
                          title="Print"
                        >
                          <Download size={14} />
                        </button>
                        {invoice.status === "pending" && (
                          <button 
                            className="action-btn"
                            onClick={() => handleProceedToCashSale(invoice)}
                            title="Proceed to Cash Sale"
                          >
                            <Receipt size={14} />
                          </button>
                        )}
                      </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleModalSave}
        invoice={selectedInvoice}
        mode={modalMode}
      />
    </div>
  )
}

export default InvoicesView
