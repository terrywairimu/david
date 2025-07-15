"use client"

import React, { useEffect, useState } from "react"
import { 
  Plus, 
  Search, 
  Download, 
  Edit, 
  Trash2, 
  Eye, 
  Receipt, 
  FileText, 
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Printer,
  Mail,
  MoreHorizontal,
  User,
  Building
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { QuotationService, RegisterService } from "@/lib/supabase-client"
import { toast } from "sonner"
import { 
  Invoice, 
  SalesOrder,
  RegisteredEntity, 
  FilterState, 
  PaginatedResponse,
  Payment 
} from "@/lib/types"
import { EntitySearchModal } from "@/components/ui/business-modals"
import { ConfirmationModal, FormModal } from "@/components/ui/modal"

interface InvoiceFormData {
  client_id: number
  sales_order_id?: number
  due_date: string
  payment_terms?: string
  notes?: string
  items: InvoiceItemFormData[]
  subtotal: number
  tax_percentage: number
  tax_amount: number
  total_amount: number
}

interface InvoiceItemFormData {
  description: string
  quantity: number
  unit_price: number
  total_price: number
  discount_percentage?: number
  discount_amount?: number
  tax_percentage?: number
  tax_amount?: number
}

interface PaymentFormData {
  amount: number
  payment_method: "cash" | "card" | "mobile" | "bank_transfer"
  payment_reference?: string
  date_created: string
  notes?: string
}

const InvoicesView = () => {
  const [data, setData] = useState<PaginatedResponse<Invoice> | null>(null)
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([])
  const [clients, setClients] = useState<RegisteredEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [salesOrdersLoading, setSalesOrdersLoading] = useState(true)
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [salesOrderModalOpen, setSalesOrderModalOpen] = useState(false)
  const [clientSearchOpen, setClientSearchOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<SalesOrder | null>(null)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | "convert">("create")
  const [submitLoading, setSubmitLoading] = useState(false)
  
  const [invoiceFormData, setInvoiceFormData] = useState<InvoiceFormData>({
    client_id: 0,
    sales_order_id: undefined,
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    payment_terms: "Net 30",
    notes: "",
    items: [{ description: "", quantity: 1, unit_price: 0, total_price: 0 }],
    subtotal: 0,
    tax_percentage: 16,
    tax_amount: 0,
    total_amount: 0
  })

  const [paymentFormData, setPaymentFormData] = useState<PaymentFormData>({
    amount: 0,
    payment_method: "cash",
    payment_reference: "",
    date_created: new Date().toISOString().split('T')[0],
    notes: ""
  })

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
    date_from: "",
    date_to: "",
    sort_by: "date_created",
    sort_order: "desc",
    page: 1,
    per_page: 10
  })

  useEffect(() => {
    fetchInvoices()
    fetchCompletedSalesOrders()
    fetchClients()
  }, [filters])

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      // This would use an InvoiceService once implemented
      // For now, we'll use a placeholder
      const response = { success: true, data: { items: [], pagination: { current_page: 1, total_pages: 1, total_items: 0, per_page: 10, has_next: false, has_previous: false } } }
      if (response.success && response.data) {
        setData(response.data)
      } else {
        toast.error("Failed to fetch invoices")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const fetchCompletedSalesOrders = async () => {
    setSalesOrdersLoading(true)
    try {
      // This would use a SalesOrderService to get completed orders
      // For now, we'll use a placeholder
      const response = { success: true, data: { items: [] } }
      if (response.success && response.data) {
        setSalesOrders(response.data.items)
      } else {
        toast.error("Failed to fetch sales orders")
      }
    } catch (error) {
      toast.error("Failed to fetch sales orders")
    } finally {
      setSalesOrdersLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const response = await RegisterService.getAll({
        search: "",
        type: "client",
        status: "active",
        sort_by: "name",
        sort_order: "asc",
        page: 1,
        per_page: 100
      })
      if (response.success && response.data) {
        setClients(response.data.items)
      } else {
        toast.error("Failed to fetch clients")
      }
    } catch (error) {
      toast.error("Failed to fetch clients")
    }
  }

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }))
  }

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const openInvoiceModal = (mode: "create" | "edit" | "view", invoice?: Invoice) => {
    setModalMode(mode)
    setSelectedInvoice(invoice || null)
    
    if (invoice) {
      setInvoiceFormData({
        client_id: invoice.client_id,
        sales_order_id: invoice.sales_order_id,
        due_date: invoice.due_date || "",
        payment_terms: invoice.payment_terms || "",
        notes: invoice.notes || "",
        items: invoice.items || [{ description: "", quantity: 1, unit_price: 0, total_price: 0 }],
        subtotal: invoice.total_amount - (invoice.total_amount * 0.16),
        tax_percentage: 16,
        tax_amount: invoice.total_amount * 0.16,
        total_amount: invoice.total_amount
      })
    } else {
      setInvoiceFormData({
        client_id: 0,
        sales_order_id: undefined,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        payment_terms: "Net 30",
        notes: "",
        items: [{ description: "", quantity: 1, unit_price: 0, total_price: 0 }],
        subtotal: 0,
        tax_percentage: 16,
        tax_amount: 0,
        total_amount: 0
      })
    }
    
    setInvoiceModalOpen(true)
  }

  const openPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setPaymentFormData({
      amount: invoice.total_amount - invoice.paid_amount,
      payment_method: "cash",
      payment_reference: "",
      date_created: new Date().toISOString().split('T')[0],
      notes: ""
    })
    setPaymentModalOpen(true)
  }

  const openSalesOrderModal = () => {
    setSalesOrderModalOpen(true)
  }

  const closeInvoiceModal = () => {
    setInvoiceModalOpen(false)
    setSelectedInvoice(null)
    setModalMode("create")
  }

  const closePaymentModal = () => {
    setPaymentModalOpen(false)
    setSelectedInvoice(null)
  }

  const closeSalesOrderModal = () => {
    setSalesOrderModalOpen(false)
    setSelectedSalesOrder(null)
  }

  const openDeleteModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setDeleteModalOpen(false)
    setSelectedInvoice(null)
  }

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitLoading(true)
    
    try {
      // This would use an InvoiceService once implemented
      toast.success("Invoice saved successfully")
      closeInvoiceModal()
      fetchInvoices()
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setSubmitLoading(false)
    }
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitLoading(true)
    
    try {
      // This would use a PaymentService once implemented
      toast.success("Payment recorded successfully")
      closePaymentModal()
      fetchInvoices()
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleSalesOrderSelect = (salesOrder: SalesOrder) => {
    setSelectedSalesOrder(salesOrder)
    setInvoiceFormData(prev => ({
      ...prev,
      client_id: salesOrder.client_id,
      sales_order_id: salesOrder.id,
      // Convert sales order items to invoice items
      items: [], // This would be populated from sales order items
      subtotal: salesOrder.total_amount / 1.16,
      tax_amount: salesOrder.total_amount * 0.16,
      total_amount: salesOrder.total_amount
    }))
    setModalMode("convert")
    closeSalesOrderModal()
    setInvoiceModalOpen(true)
  }

  const handleClientSelect = (client: RegisteredEntity) => {
    setInvoiceFormData(prev => ({
      ...prev,
      client_id: client.id
    }))
    setClientSearchOpen(false)
  }

  const handleDelete = async () => {
    if (!selectedInvoice) return
    
    try {
      // This would use an InvoiceService once implemented
      toast.success("Invoice deleted successfully")
      closeDeleteModal()
      fetchInvoices()
    } catch (error) {
      toast.error("An unexpected error occurred")
    }
  }

  const handlePrintInvoice = (invoice: Invoice) => {
    // This would generate and print the invoice
    toast.success("Invoice sent to printer")
  }

  const handleEmailInvoice = (invoice: Invoice) => {
    // This would email the invoice to the client
    toast.success("Invoice emailed to client")
  }

  const addInvoiceItem = () => {
    setInvoiceFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, unit_price: 0, total_price: 0 }]
    }))
  }

  const removeInvoiceItem = (index: number) => {
    setInvoiceFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
    calculateTotals()
  }

  const updateInvoiceItem = (index: number, field: keyof InvoiceItemFormData, value: any) => {
    setInvoiceFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
    calculateTotals()
  }

  const calculateTotals = () => {
    const subtotal = invoiceFormData.items.reduce((sum, item) => sum + item.total_price, 0)
    const tax_amount = (subtotal * invoiceFormData.tax_percentage) / 100
    const total_amount = subtotal + tax_amount

    setInvoiceFormData(prev => ({
      ...prev,
      subtotal,
      tax_amount,
      total_amount
    }))
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: "bg-gray-100 text-gray-800", label: "Draft", icon: FileText },
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending", icon: Clock },
      paid: { color: "bg-green-100 text-green-800", label: "Paid", icon: CheckCircle },
      overdue: { color: "bg-red-100 text-red-800", label: "Overdue", icon: AlertCircle },
      cancelled: { color: "bg-gray-100 text-gray-600", label: "Cancelled", icon: AlertCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const IconComponent = config.icon
    
    return (
      <Badge className={config.color}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getPaymentProgress = (invoice: Invoice) => {
    const progress = (invoice.paid_amount / invoice.total_amount) * 100
    return Math.min(progress, 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount)
  }

  const isOverdue = (invoice: Invoice) => {
    return invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.status !== 'paid'
  }

  const renderPagination = () => {
    if (!data?.pagination) return null
    
    const { current_page, total_pages, has_previous, has_next } = data.pagination
    
    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-500">
          Showing {((current_page - 1) * filters.per_page) + 1} to {Math.min(current_page * filters.per_page, data.pagination.total_items)} of {data.pagination.total_items} results
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(current_page - 1)}
            disabled={!has_previous}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {current_page} of {total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(current_page + 1)}
            disabled={!has_next}
          >
            Next
          </Button>
        </div>
      </div>
    )
  }

  const selectedClient = clients.find(c => c.id === invoiceFormData.client_id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
          <p className="text-gray-600">Manage client invoices and payments</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={openSalesOrderModal}
            variant="outline"
            className="border-blue-200 hover:bg-blue-50"
          >
            <Receipt className="mr-2 h-4 w-4" />
            From Sales Order
          </Button>
          <Button
            onClick={() => openInvoiceModal("create")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold text-blue-600">
                  {data?.pagination.total_items || 0}
                </p>
              </div>
              <Receipt className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {data?.items.filter(i => i.status === 'pending').length || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {data?.items.filter(i => i.status === 'paid').length || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {data?.items.filter(i => i.status === 'overdue').length || 0}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search invoices..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.sort_by} onValueChange={(value) => handleFilterChange('sort_by', value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_created">Date Created</SelectItem>
                  <SelectItem value="due_date">Due Date</SelectItem>
                  <SelectItem value="total_amount">Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="text-gray-500">
                          <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No invoices found</p>
                          <p className="text-sm">Create your first invoice to get started</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.items.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.invoice_number}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{invoice.client?.name}</div>
                            <div className="text-sm text-gray-500">{invoice.client?.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{formatCurrency(invoice.total_amount)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <span className="font-medium">
                                {formatCurrency(invoice.paid_amount)} / {formatCurrency(invoice.total_amount)}
                              </span>
                            </div>
                            <Progress value={getPaymentProgress(invoice)} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getStatusBadge(invoice.status)}
                            {isOverdue(invoice) && (
                              <div className="text-xs text-red-600">Overdue</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="h-3 w-3 mr-1" />
                            {invoice.due_date ? formatDate(invoice.due_date) : "Not set"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(invoice.date_created)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => openInvoiceModal("view", invoice)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openInvoiceModal("edit", invoice)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openPaymentModal(invoice)}>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Add Payment
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePrintInvoice(invoice)}>
                                <Printer className="mr-2 h-4 w-4" />
                                Print
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEmailInvoice(invoice)}>
                                <Mail className="mr-2 h-4 w-4" />
                                Email
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openDeleteModal(invoice)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {renderPagination()}
            </>
          )}
        </CardContent>
      </Card>

      {/* Invoice Modal */}
      <FormModal
        isOpen={invoiceModalOpen}
        onClose={closeInvoiceModal}
        onSubmit={handleInvoiceSubmit}
        title={
          modalMode === "create" ? "Create New Invoice" :
          modalMode === "edit" ? "Edit Invoice" :
          modalMode === "convert" ? "Convert Sales Order to Invoice" :
          "View Invoice"
        }
        size="2xl"
        submitLabel={modalMode === "create" || modalMode === "convert" ? "Create Invoice" : "Update Invoice"}
        submitDisabled={submitLoading || invoiceFormData.client_id === 0}
        submitLoading={submitLoading}
        showFooter={modalMode !== "view"}
      >
        <div className="space-y-4">
          {/* Client and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client">Client</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={selectedClient?.name || ""}
                  placeholder="Select client"
                  readOnly
                  disabled={modalMode === "view"}
                />
                {modalMode !== "view" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setClientSearchOpen(true)}
                    disabled={modalMode === "convert"}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={invoiceFormData.due_date}
                onChange={(e) => setInvoiceFormData(prev => ({ ...prev, due_date: e.target.value }))}
                disabled={modalMode === "view"}
              />
            </div>
          </div>

          {/* Sales Order Reference */}
          {selectedSalesOrder && (
            <div>
              <Label>From Sales Order</Label>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-medium">{selectedSalesOrder.order_number}</div>
                <div className="text-sm text-gray-600">
                  {formatCurrency(selectedSalesOrder.total_amount)}
                </div>
              </div>
            </div>
          )}

          {/* Invoice Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Items</Label>
              {modalMode !== "view" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addInvoiceItem}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {invoiceFormData.items.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateInvoiceItem(index, "description", e.target.value)}
                        disabled={modalMode === "view"}
                      />
                    </div>
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateInvoiceItem(index, "quantity", parseInt(e.target.value) || 0)}
                        disabled={modalMode === "view"}
                      />
                    </div>
                    <div>
                      <Label>Unit Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateInvoiceItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                        disabled={modalMode === "view"}
                      />
                    </div>
                    <div>
                      <Label>Total</Label>
                      <Input
                        value={formatCurrency(item.total_price)}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
                  {modalMode !== "view" && invoiceFormData.items.length > 1 && (
                    <div className="flex justify-end mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeInvoiceItem(index)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Payment Terms and Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment_terms">Payment Terms</Label>
              <Input
                id="payment_terms"
                value={invoiceFormData.payment_terms}
                onChange={(e) => setInvoiceFormData(prev => ({ ...prev, payment_terms: e.target.value }))}
                disabled={modalMode === "view"}
              />
            </div>
            <div>
              <Label htmlFor="tax_percentage">Tax (%)</Label>
              <Input
                id="tax_percentage"
                type="number"
                value={invoiceFormData.tax_percentage}
                onChange={(e) => setInvoiceFormData(prev => ({ ...prev, tax_percentage: parseFloat(e.target.value) || 0 }))}
                disabled={modalMode === "view"}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={invoiceFormData.notes}
              onChange={(e) => setInvoiceFormData(prev => ({ ...prev, notes: e.target.value }))}
              disabled={modalMode === "view"}
            />
          </div>

          {/* Totals */}
          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoiceFormData.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({invoiceFormData.tax_percentage}%):</span>
                <span>{formatCurrency(invoiceFormData.tax_amount)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{formatCurrency(invoiceFormData.total_amount)}</span>
              </div>
            </div>
          </Card>
        </div>
      </FormModal>

      {/* Payment Modal */}
      <FormModal
        isOpen={paymentModalOpen}
        onClose={closePaymentModal}
        onSubmit={handlePaymentSubmit}
        title="Record Payment"
        size="md"
        submitLabel="Record Payment"
        submitDisabled={submitLoading || paymentFormData.amount <= 0}
        submitLoading={submitLoading}
      >
        <div className="space-y-4">
          <div>
            <Label>Invoice</Label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="font-medium">{selectedInvoice?.invoice_number}</div>
              <div className="text-sm text-gray-600">
                Balance: {formatCurrency((selectedInvoice?.total_amount || 0) - (selectedInvoice?.paid_amount || 0))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={paymentFormData.amount}
                onChange={(e) => setPaymentFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                max={(selectedInvoice?.total_amount || 0) - (selectedInvoice?.paid_amount || 0)}
              />
            </div>
            <div>
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select
                value={paymentFormData.payment_method}
                onValueChange={(value) => setPaymentFormData(prev => ({ ...prev, payment_method: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="mobile">Mobile Money</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date_created">Date Created</Label>
              <Input
                id="date_created"
                type="date"
                value={paymentFormData.date_created}
                onChange={(e) => setPaymentFormData(prev => ({ ...prev, date_created: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="payment_reference">Reference</Label>
              <Input
                id="payment_reference"
                value={paymentFormData.payment_reference}
                onChange={(e) => setPaymentFormData(prev => ({ ...prev, payment_reference: e.target.value }))}
                placeholder="Transaction ID, check number, etc."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="payment_notes">Notes</Label>
            <Textarea
              id="payment_notes"
              value={paymentFormData.notes}
              onChange={(e) => setPaymentFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </div>
      </FormModal>

      {/* Sales Order Selection Modal */}
      <Dialog open={salesOrderModalOpen} onOpenChange={closeSalesOrderModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select Sales Order to Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {salesOrdersLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : salesOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No completed sales orders found</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {salesOrders.map((order) => (
                  <Card
                    key={order.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleSalesOrderSelect(order)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{order.order_number}</div>
                          <div className="text-sm text-gray-500">
                            {order.client?.name} • {formatDate(order.date_created)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(order.total_amount)}</div>
                          <div className="text-sm text-gray-500">
                            {order.delivery_date ? `Delivery: ${formatDate(order.delivery_date)}` : "No delivery date"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Client Search Modal */}
      <EntitySearchModal
        isOpen={clientSearchOpen}
        onClose={() => setClientSearchOpen(false)}
        onSelect={handleClientSelect}
        type="client"
        title="Select Client"
        entities={clients}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice ${selectedInvoice?.invoice_number}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  )
}

export default InvoicesView
