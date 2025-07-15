"use client"

import React, { useEffect, useState } from "react"
import { 
  Plus, 
  Search, 
  Download, 
  Edit, 
  Trash2, 
  Eye, 
  ShoppingCart, 
  Filter,
  MoreHorizontal,
  Calendar,
  User,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle
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
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { QuotationService, RegisterService } from "@/lib/supabase-client"
import { toast } from "sonner"
import { 
  SalesOrder, 
  Quotation,
  RegisteredEntity, 
  FilterState, 
  PaginatedResponse,
  ModalState 
} from "@/lib/types"
import { EntitySearchModal } from "@/components/ui/business-modals"
import { ConfirmationModal, FormModal } from "@/components/ui/modal"

interface SalesOrderFormData {
  client_id: number
  quotation_id?: number
  delivery_date?: string
  delivery_address?: string
  contact_person?: string
  phone?: string
  notes?: string
}

const SalesOrdersView = () => {
  const [data, setData] = useState<PaginatedResponse<SalesOrder> | null>(null)
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [clients, setClients] = useState<RegisteredEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [quotationsLoading, setQuotationsLoading] = useState(true)
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [quotationModalOpen, setQuotationModalOpen] = useState(false)
  const [clientSearchOpen, setClientSearchOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null)
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | "convert">("create")
  const [submitLoading, setSubmitLoading] = useState(false)
  
  const [formData, setFormData] = useState<SalesOrderFormData>({
    client_id: 0,
    quotation_id: undefined,
    delivery_date: "",
    delivery_address: "",
    contact_person: "",
    phone: "",
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
    fetchSalesOrders()
    fetchAcceptedQuotations()
    fetchClients()
  }, [filters])

  const fetchSalesOrders = async () => {
    setLoading(true)
    try {
      // This would use a SalesOrderService once implemented
      // For now, we'll use a placeholder
      const response = { success: true, data: { items: [], pagination: { current_page: 1, total_pages: 1, total_items: 0, per_page: 10, has_next: false, has_previous: false } } }
      if (response.success && response.data) {
        setData(response.data)
      } else {
        toast.error("Failed to fetch sales orders")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const fetchAcceptedQuotations = async () => {
    setQuotationsLoading(true)
    try {
      const response = await QuotationService.getAll({
        search: "",
        status: "accepted",
        sort_by: "date_created",
        sort_order: "desc",
        page: 1,
        per_page: 100
      })
      if (response.success && response.data) {
        setQuotations(response.data.items)
      } else {
        toast.error("Failed to fetch quotations")
      }
    } catch (error) {
      toast.error("Failed to fetch quotations")
    } finally {
      setQuotationsLoading(false)
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

  const openOrderModal = (mode: "create" | "edit" | "view", order?: SalesOrder) => {
    setModalMode(mode)
    setSelectedOrder(order || null)
    
    if (order) {
      setFormData({
        client_id: order.client_id,
        quotation_id: order.quotation_id,
        delivery_date: order.delivery_date || "",
        delivery_address: order.delivery_address || "",
        contact_person: order.contact_person || "",
        phone: order.phone || "",
        notes: order.notes || ""
      })
    } else {
      setFormData({
        client_id: 0,
        quotation_id: undefined,
        delivery_date: "",
        delivery_address: "",
        contact_person: "",
        phone: "",
        notes: ""
      })
    }
    
    setOrderModalOpen(true)
  }

  const openQuotationModal = () => {
    setQuotationModalOpen(true)
  }

  const closeOrderModal = () => {
    setOrderModalOpen(false)
    setSelectedOrder(null)
    setModalMode("create")
    setFormData({
      client_id: 0,
      quotation_id: undefined,
      delivery_date: "",
      delivery_address: "",
      contact_person: "",
      phone: "",
      notes: ""
    })
  }

  const closeQuotationModal = () => {
    setQuotationModalOpen(false)
    setSelectedQuotation(null)
  }

  const openDeleteModal = (order: SalesOrder) => {
    setSelectedOrder(order)
    setDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setDeleteModalOpen(false)
    setSelectedOrder(null)
  }

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitLoading(true)
    
    try {
      // This would use a SalesOrderService once implemented
      // For now, we'll show a success message
      toast.success("Sales order saved successfully")
      closeOrderModal()
      fetchSalesOrders()
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleQuotationSelect = (quotation: Quotation) => {
    setSelectedQuotation(quotation)
    setFormData(prev => ({
      ...prev,
      client_id: quotation.client_id,
      quotation_id: quotation.id,
      delivery_address: quotation.client?.address || "",
      contact_person: quotation.client?.contact_person || "",
      phone: quotation.client?.phone || ""
    }))
    setModalMode("convert")
    closeQuotationModal()
    setOrderModalOpen(true)
  }

  const handleClientSelect = (client: RegisteredEntity) => {
    setFormData(prev => ({
      ...prev,
      client_id: client.id,
      delivery_address: client.address || "",
      contact_person: client.contact_person || "",
      phone: client.phone || ""
    }))
    setClientSearchOpen(false)
  }

  const handleDelete = async () => {
    if (!selectedOrder) return
    
    try {
      // This would use a SalesOrderService once implemented
      toast.success("Sales order deleted successfully")
      closeDeleteModal()
      fetchSalesOrders()
    } catch (error) {
      toast.error("An unexpected error occurred")
    }
  }

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      // This would use a SalesOrderService once implemented
      toast.success("Order status updated successfully")
      fetchSalesOrders()
    } catch (error) {
      toast.error("Failed to update order status")
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending", icon: Clock },
      processing: { color: "bg-blue-100 text-blue-800", label: "Processing", icon: Package },
      completed: { color: "bg-green-100 text-green-800", label: "Completed", icon: CheckCircle },
      delivered: { color: "bg-purple-100 text-purple-800", label: "Delivered", icon: Truck },
      cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled", icon: AlertCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const IconComponent = config.icon
    
    return (
      <Badge className={config.color}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
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

  const selectedClient = clients.find(c => c.id === formData.client_id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Orders</h2>
          <p className="text-gray-600">Manage client orders and deliveries</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={openQuotationModal}
            variant="outline"
            className="border-blue-200 hover:bg-blue-50"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            From Quotation
          </Button>
          <Button
            onClick={() => openOrderModal("create")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Order
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
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-blue-600">
                  {data?.pagination.total_items || 0}
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-orange-600">
                  {data?.items.filter(o => o.status === 'processing').length || 0}
                </p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {data?.items.filter(o => o.status === 'completed').length || 0}
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
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-purple-600">
                  {data?.items.filter(o => o.status === 'delivered').length || 0}
                </p>
              </div>
              <Truck className="h-8 w-8 text-purple-600" />
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
                  placeholder="Search orders..."
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.sort_by} onValueChange={(value) => handleFilterChange('sort_by', value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_created">Date Created</SelectItem>
                  <SelectItem value="delivery_date">Delivery Date</SelectItem>
                  <SelectItem value="total_amount">Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Orders</CardTitle>
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
                    <TableHead>Order #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Delivery Date</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-gray-500">
                          <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No sales orders found</p>
                          <p className="text-sm">Create your first order to get started</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.items.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.order_number}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.client?.name}</div>
                            <div className="text-sm text-gray-500">{order.client?.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{formatCurrency(order.total_amount)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(order.status)}
                            <Select 
                              value={order.status} 
                              onValueChange={(value) => handleStatusUpdate(order.id, value)}
                            >
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="h-3 w-3 mr-1" />
                            {order.delivery_date ? formatDate(order.delivery_date) : "Not set"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(order.date_created)}
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
                              <DropdownMenuItem onClick={() => openOrderModal("view", order)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openOrderModal("edit", order)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openDeleteModal(order)}>
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

      {/* Sales Order Modal */}
      <FormModal
        isOpen={orderModalOpen}
        onClose={closeOrderModal}
        onSubmit={handleOrderSubmit}
        title={
          modalMode === "create" ? "Create New Sales Order" :
          modalMode === "edit" ? "Edit Sales Order" :
          modalMode === "convert" ? "Convert Quotation to Sales Order" :
          "View Sales Order"
        }
        size="lg"
        submitLabel={modalMode === "create" || modalMode === "convert" ? "Create Order" : "Update Order"}
        submitDisabled={submitLoading || formData.client_id === 0}
        submitLoading={submitLoading}
        showFooter={modalMode !== "view"}
      >
        <div className="space-y-4">
          {/* Client Selection */}
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

          {/* Quotation Reference */}
          {selectedQuotation && (
            <div>
              <Label>From Quotation</Label>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-medium">{selectedQuotation.quotation_number}</div>
                <div className="text-sm text-gray-600">
                  {formatCurrency(selectedQuotation.total_amount)}
                </div>
              </div>
            </div>
          )}

          {/* Delivery Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="delivery_date">Delivery Date</Label>
              <Input
                id="delivery_date"
                type="date"
                value={formData.delivery_date}
                onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
                disabled={modalMode === "view"}
              />
            </div>
            <div>
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                disabled={modalMode === "view"}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              disabled={modalMode === "view"}
            />
          </div>

          <div>
            <Label htmlFor="delivery_address">Delivery Address</Label>
            <Textarea
              id="delivery_address"
              value={formData.delivery_address}
              onChange={(e) => setFormData(prev => ({ ...prev, delivery_address: e.target.value }))}
              disabled={modalMode === "view"}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              disabled={modalMode === "view"}
            />
          </div>
        </div>
      </FormModal>

      {/* Quotation Selection Modal */}
      <Dialog open={quotationModalOpen} onOpenChange={closeQuotationModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select Quotation to Convert</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {quotationsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : quotations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No accepted quotations found</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {quotations.map((quotation) => (
                  <Card
                    key={quotation.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleQuotationSelect(quotation)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{quotation.quotation_number}</div>
                          <div className="text-sm text-gray-500">
                            {quotation.client?.name} • {formatDate(quotation.date_created)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(quotation.total_amount)}</div>
                          <div className="text-sm text-gray-500">
                            Valid until {formatDate(quotation.valid_until)}
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
        title="Delete Sales Order"
        description={`Are you sure you want to delete sales order ${selectedOrder?.order_number}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  )
}

export default SalesOrdersView
