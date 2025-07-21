"use client"

import React, { useEffect, useState } from "react"
import { Plus, Edit, Trash2, Eye, Download, FileText, Receipt } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import SalesOrderModal from "@/components/ui/sales-order-modal"
import { 
  proceedToInvoice, 
  proceedToCashSaleFromSalesOrder, 
  printDocument, 
  downloadDocument,
  exportSalesOrders as exportSalesOrdersReport
} from "@/lib/workflow-utils"

interface SalesOrder {
  id: number
  order_number: string
  client_id: number
  quotation_id?: number
  original_quotation_number?: string
  date_created: string
  cabinet_total: number
  worktop_total: number
  accessories_total: number
  labour_percentage: number
  labour_total: number
  total_amount: number
  grand_total: number
  include_accessories: boolean
  status: "pending" | "processing" | "completed" | "cancelled" | "converted_to_invoice" | "converted_to_cash_sale"
  notes?: string
  terms_conditions?: string
  client?: {
    id: number
    name: string
    phone?: string
    location?: string
  }
  items?: Array<{
    id: number
    category: "cabinet" | "worktop" | "accessories"
    description: string
    unit: string
    quantity: number
    unit_price: number
    total_price: number
    stock_item_id?: number
  }>
}

const SalesOrdersView = () => {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [clientFilter, setClientFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [specificDate, setSpecificDate] = useState("")
  const [periodStartDate, setPeriodStartDate] = useState("")
  const [periodEndDate, setPeriodEndDate] = useState("")
  const [clients, setClients] = useState<{ value: string; label: string }[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<SalesOrder | undefined>()
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("create")

  useEffect(() => {
    fetchSalesOrders()
    fetchClients()
    
    // Set up real-time subscription for sales orders
    const salesOrdersSubscription = supabase
      .channel('sales_orders_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_orders' }, (payload) => {
        console.log('Sales orders change detected:', payload)
        fetchSalesOrders() // Refresh sales orders when changes occur
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_order_items' }, (payload) => {
        console.log('Sales order items change detected:', payload)
        fetchSalesOrders() // Refresh sales orders when items change
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registered_entities' }, (payload) => {
        console.log('Registered entities change detected:', payload)
        fetchClients() // Refresh clients when changes occur
      })
      .subscribe()

    return () => {
      supabase.removeChannel(salesOrdersSubscription)
    }
  }, [])

  const fetchSalesOrders = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("sales_orders")
        .select(`
          *,
          client:registered_entities(id, name, phone, location),
          items:sales_order_items(*)
        `)
        .order("date_created", { ascending: false })

      if (error) throw error
      setSalesOrders(data || [])
    } catch (error) {
        console.error("Error fetching sales orders:", error)
      toast.error("Failed to load sales orders")
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

  const getFilteredSalesOrders = () => {
    let filtered = [...salesOrders]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.original_quotation_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Client filter
    if (clientFilter) {
      filtered = filtered.filter(order => order.client_id.toString() === clientFilter)
    }

    // Date filter
    if (dateFilter) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.date_created)
        const orderDay = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate())
        
        switch (dateFilter) {
          case "today":
            return orderDay.getTime() === today.getTime()
          case "week":
            const weekStart = new Date(today)
            weekStart.setDate(today.getDate() - today.getDay())
            return orderDay >= weekStart
          case "month":
            return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()
          case "year":
            return orderDate.getFullYear() === now.getFullYear()
          case "specific":
            if (specificDate) {
              const specDate = new Date(specificDate)
              const specDay = new Date(specDate.getFullYear(), specDate.getMonth(), specDate.getDate())
              return orderDay.getTime() === specDay.getTime()
            }
            return true
          case "period":
            if (periodStartDate && periodEndDate) {
              const startDate = new Date(periodStartDate)
              const endDate = new Date(periodEndDate)
              const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
              const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
              return orderDay >= startDay && orderDay <= endDay
            }
            return true
          default:
            return true
        }
      })
    }

    return filtered
  }

  const filteredSalesOrders = getFilteredSalesOrders()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "badge bg-warning"
      case "processing":
        return "badge bg-info"
      case "completed":
        return "badge bg-success"
      case "cancelled":
        return "badge bg-danger"
      case "converted_to_invoice":
        return "badge bg-primary"
      case "converted_to_cash_sale":
        return "badge bg-success"
      default:
        return "badge bg-secondary"
    }
  }

  const handleModalSave = async (salesOrderData: any) => {
    try {
      if (modalMode === "create") {
        // Create new sales order
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
            labour_percentage: salesOrderData.labour_percentage,
            labour_total: salesOrderData.labour_total,
            total_amount: salesOrderData.total_amount,
            grand_total: salesOrderData.grand_total,
            include_accessories: salesOrderData.include_accessories,
            status: salesOrderData.status,
            notes: salesOrderData.notes,
            terms_conditions: salesOrderData.terms_conditions
          })
          .select()
          .single()

        if (salesOrderError) throw salesOrderError

        // Insert sales order items
        if (salesOrderData.items && salesOrderData.items.length > 0) {
          const salesOrderItems = salesOrderData.items.map((item: any) => ({
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

        toast.success("Sales order created successfully")
      } else if (modalMode === "edit") {
        // Update existing sales order
        const { error: updateError } = await supabase
          .from("sales_orders")
          .update({
            client_id: salesOrderData.client_id,
            date_created: salesOrderData.date_created,
            cabinet_total: salesOrderData.cabinet_total,
            worktop_total: salesOrderData.worktop_total,
            accessories_total: salesOrderData.accessories_total,
            labour_percentage: salesOrderData.labour_percentage,
            labour_total: salesOrderData.labour_total,
            total_amount: salesOrderData.total_amount,
            grand_total: salesOrderData.grand_total,
            include_accessories: salesOrderData.include_accessories,
            status: salesOrderData.status,
            notes: salesOrderData.notes,
            terms_conditions: salesOrderData.terms_conditions
          })
          .eq("id", selectedSalesOrder?.id)

        if (updateError) throw updateError

        // Delete existing items and insert new ones
        const { error: deleteError } = await supabase
          .from("sales_order_items")
          .delete()
          .eq("sales_order_id", selectedSalesOrder?.id)

        if (deleteError) throw deleteError

        // Insert updated items
        if (salesOrderData.items && salesOrderData.items.length > 0) {
          const salesOrderItems = salesOrderData.items.map((item: any) => ({
            sales_order_id: selectedSalesOrder?.id,
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

        toast.success("Sales order updated successfully")
      }

      fetchSalesOrders()
    } catch (error) {
      console.error("Error saving sales order:", error)
      toast.error("Failed to save sales order")
    }
  }

  const handleView = (salesOrder: SalesOrder) => {
    setSelectedSalesOrder(salesOrder)
    setModalMode("view")
    setShowModal(true)
  }

  const handleEdit = (salesOrder: SalesOrder) => {
    setSelectedSalesOrder(salesOrder)
    setModalMode("edit")
    setShowModal(true)
  }

  const handleDelete = async (salesOrder: SalesOrder) => {
    if (window.confirm(`Are you sure you want to delete sales order ${salesOrder.order_number}?`)) {
      try {
        const { error } = await supabase
          .from("sales_orders")
          .delete()
          .eq("id", salesOrder.id)

        if (error) throw error

        toast.success("Sales order deleted successfully")
        fetchSalesOrders()
      } catch (error) {
        console.error("Error deleting sales order:", error)
        toast.error("Failed to delete sales order")
      }
    }
  }

  const handleProceedToInvoice = async (salesOrder: SalesOrder) => {
    try {
      const invoice = await proceedToInvoice(salesOrder.id)
      toast.success(`Invoice ${invoice.invoice_number} created successfully`)
      fetchSalesOrders()
    } catch (error) {
      // Error handling is done in the workflow function
    }
  }

  const handleProceedToCashSale = async (salesOrder: SalesOrder) => {
    try {
      const cashSale = await proceedToCashSaleFromSalesOrder(salesOrder.id)
      toast.success(`Cash sale ${cashSale.sale_number} created successfully`)
      fetchSalesOrders()
    } catch (error) {
      // Error handling is done in the workflow function
    }
  }

  const handlePrint = (salesOrder: SalesOrder) => {
    printDocument(`sales-order-${salesOrder.id}`, `SalesOrder-${salesOrder.order_number}`)
  }

  const handleDownload = (salesOrder: SalesOrder) => {
    downloadDocument(`sales-order-${salesOrder.id}`, `SalesOrder-${salesOrder.order_number}`)
  }

  const handleNewSalesOrder = () => {
    setSelectedSalesOrder(undefined)
    setModalMode("create")
    setShowModal(true)
  }

  // Export function
  const exportSalesOrders = () => {
    exportSalesOrdersReport(salesOrders)
  }

  return (
    <div className="sales-orders-view">
    <div>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5>Sales Orders</h5>
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
                placeholder="Search sales orders..."
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
              <div className="d-flex gap-2 mt-2">
                <input
                  type="date"
                  className="form-control border-0 shadow-sm"
                  placeholder="Start Date"
                  value={periodStartDate}
                  onChange={(e) => setPeriodStartDate(e.target.value)}
                  style={{ borderRadius: "16px", height: "45px" }}
                />
                <input
                  type="date"
                  className="form-control border-0 shadow-sm"
                  placeholder="End Date"
                  value={periodEndDate}
                  onChange={(e) => setPeriodEndDate(e.target.value)}
                  style={{ borderRadius: "16px", height: "45px" }}
                />
              </div>
            )}
          </div>
          
          <div className="col-md-3">
            <button
              className="btn w-100 shadow-sm export-btn"
              onClick={exportSalesOrders}
              style={{ borderRadius: "16px", height: "45px", transition: "all 0.3s ease" }}
            >
              <Download size={16} className="me-2" />
              Export
            </button>
          </div>
        </div>

      {/* Sales Orders Table */}
      <div className="table-responsive">
          <table className="table table-hover">
          <thead>
            <tr>
              <th>Order #</th>
                <th>Date</th>
              <th>Client</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                  <td colSpan={6} className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                </td>
              </tr>
            ) : filteredSalesOrders.length === 0 ? (
              <tr>
                  <td colSpan={6} className="text-center py-4 text-muted">
                  No sales orders found
                </td>
              </tr>
            ) : (
                filteredSalesOrders.map((salesOrder) => (
                  <tr key={salesOrder.id}>
                    <td>{salesOrder.order_number}</td>
                    <td>{new Date(salesOrder.date_created).toLocaleDateString()}</td>
                    <td>{salesOrder.client?.name || "Unknown"}</td>
                    <td>KES {salesOrder.grand_total?.toFixed(2) || "0.00"}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(salesOrder.status)}`}>
                        {salesOrder.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td>
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-sm action-btn"
                          onClick={() => handleView(salesOrder)}
                          title="View"
                        >
                      <Eye size={14} />
                    </button>
                        <button
                          className="btn btn-sm action-btn"
                          onClick={() => handleEdit(salesOrder)}
                          title="Edit"
                        >
                      <Edit size={14} />
                    </button>
                        <button
                          className="btn btn-sm action-btn"
                          onClick={() => handleDelete(salesOrder)}
                          title="Delete"
                        >
                      <Trash2 size={14} />
                    </button>
                        <button
                          className="btn btn-sm action-btn"
                          onClick={() => handlePrint(salesOrder)}
                          title="Print"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          className="btn btn-sm action-btn"
                          onClick={() => handleDownload(salesOrder)}
                          title="Download"
                        >
                          <FileText size={14} />
                        </button>
                        
                        {salesOrder.status === "pending" && (
                          <>
                            <button 
                              className="btn btn-sm action-btn"
                              onClick={() => handleProceedToInvoice(salesOrder)}
                              title="Proceed to Invoice"
                            >
                              <FileText size={14} />
                            </button>
                            <button 
                              className="btn btn-sm action-btn"
                              onClick={() => handleProceedToCashSale(salesOrder)}
                              title="Proceed to Cash Sale"
                            >
                              <Receipt size={14} />
                            </button>
                          </>
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

      {/* Sales Order Modal */}
      <SalesOrderModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleModalSave}
        salesOrder={selectedSalesOrder}
        mode={modalMode}
      />
    </div>
  )
}

export default SalesOrdersView
