"use client"

import React, { useEffect, useState } from "react"
import { 
  Plus, 
  Search, 
  Download, 
  Edit, 
  Trash2, 
  Eye, 
  FileText, 
  Filter,
  MoreHorizontal,
  Calendar,
  User,
  DollarSign,
  Clock
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
import { QuotationService, RegisterService } from "@/lib/supabase-client"
import { toast } from "sonner"
import { 
  Quotation, 
  RegisteredEntity, 
  FilterState, 
  PaginatedResponse,
  QuotationFormData,
  ModalState 
} from "@/lib/types"
import { QuotationModal } from "@/components/ui/business-modals"
import { ConfirmationModal } from "@/components/ui/modal"

const QuotationsView = () => {
  const [data, setData] = useState<PaginatedResponse<Quotation> | null>(null)
  const [clients, setClients] = useState<RegisteredEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [clientsLoading, setClientsLoading] = useState(true)
  const [quotationModalOpen, setQuotationModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create")
  const [submitLoading, setSubmitLoading] = useState(false)
  
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
    fetchQuotations()
    fetchClients()
  }, [filters])

  const fetchQuotations = async () => {
    setLoading(true)
    try {
      const response = await QuotationService.getAll(filters)
      if (response.success && response.data) {
        setData(response.data)
      } else {
        toast.error(response.error || "Failed to fetch quotations")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    setClientsLoading(true)
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
    } finally {
      setClientsLoading(false)
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

  const openQuotationModal = (mode: "create" | "edit" | "view", quotation?: Quotation) => {
    setModalMode(mode)
    setSelectedQuotation(quotation || null)
    setQuotationModalOpen(true)
  }

  const closeQuotationModal = () => {
    setQuotationModalOpen(false)
    setSelectedQuotation(null)
    setModalMode("create")
  }

  const openDeleteModal = (quotation: Quotation) => {
    setSelectedQuotation(quotation)
    setDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setDeleteModalOpen(false)
    setSelectedQuotation(null)
  }

  const handleQuotationSubmit = async (formData: QuotationFormData) => {
    setSubmitLoading(true)
    try {
      let response
      
      if (modalMode === "create") {
        response = await QuotationService.create({
          client_id: formData.client_id,
          valid_until: formData.valid_until,
          total_amount: calculateGrandTotal(formData),
          labour_total: calculateLabourTotal(formData),
          grand_total: calculateGrandTotal(formData),
          notes: formData.notes,
          terms_conditions: formData.terms_conditions,
          sections: convertFormDataToSections(formData)
        })
      } else if (modalMode === "edit" && selectedQuotation) {
        response = await QuotationService.update(selectedQuotation.id, {
          client_id: formData.client_id,
          valid_until: formData.valid_until,
          total_amount: calculateGrandTotal(formData),
          labour_total: calculateLabourTotal(formData),
          grand_total: calculateGrandTotal(formData),
          notes: formData.notes,
          terms_conditions: formData.terms_conditions,
          sections: convertFormDataToSections(formData)
        })
      }

      if (response?.success) {
        toast.success(response.message || "Quotation saved successfully")
        closeQuotationModal()
        fetchQuotations()
      } else {
        toast.error(response?.error || "Failed to save quotation")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedQuotation) return
    
    try {
      const response = await QuotationService.delete(selectedQuotation.id)
      if (response?.success) {
        toast.success("Quotation deleted successfully")
        closeDeleteModal()
        fetchQuotations()
      } else {
        toast.error("Failed to delete quotation")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    }
  }

  const calculateGrandTotal = (formData: QuotationFormData): number => {
    const kitchenTotal = formData.kitchen_cabinets.items.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price), 0) + formData.kitchen_cabinets.labour_cost
    
    const worktopTotal = formData.worktop.items.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price), 0) + formData.worktop.labour_cost
    
    const accessoriesTotal = formData.accessories.items.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price), 0) + formData.accessories.labour_cost
    
    return kitchenTotal + worktopTotal + accessoriesTotal
  }

  const calculateLabourTotal = (formData: QuotationFormData): number => {
    return formData.kitchen_cabinets.labour_cost + 
           formData.worktop.labour_cost + 
           formData.accessories.labour_cost
  }

  const convertFormDataToSections = (formData: QuotationFormData) => {
    // Convert form data to sections format for database
    // This would need to be implemented based on your specific requirements
    return []
  }

  const convertQuotationToFormData = (quotation: Quotation): QuotationFormData => {
    // Convert quotation data to form data format
    // This would need to be implemented based on your specific requirements
    return {
      client_id: quotation.client_id,
      valid_until: quotation.valid_until,
      notes: quotation.notes || "",
      terms_conditions: quotation.terms_conditions || "",
      kitchen_cabinets: { items: [], labour_cost: 0 },
      worktop: { items: [], labour_cost: 0 },
      accessories: { items: [], labour_cost: 0 }
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: "bg-gray-100 text-gray-800", label: "Draft" },
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      accepted: { color: "bg-green-100 text-green-800", label: "Accepted" },
      rejected: { color: "bg-red-100 text-red-800", label: "Rejected" },
      expired: { color: "bg-gray-100 text-gray-600", label: "Expired" }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return <Badge className={config.color}>{config.label}</Badge>
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

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date()
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quotations</h2>
          <p className="text-gray-600">Create and manage client quotations</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => openQuotationModal("create")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Quotation
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
                <p className="text-sm text-gray-600">Total Quotations</p>
                <p className="text-2xl font-bold text-blue-600">
                  {data?.pagination.total_items || 0}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {data?.items.filter(q => q.status === 'pending').length || 0}
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
                <p className="text-sm text-gray-600">Accepted</p>
                <p className="text-2xl font-bold text-green-600">
                  {data?.items.filter(q => q.status === 'accepted').length || 0}
                </p>
              </div>
              <User className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(data?.items.reduce((sum, q) => sum + q.total_amount, 0) || 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
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
                  placeholder="Search quotations..."
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
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.sort_by} onValueChange={(value) => handleFilterChange('sort_by', value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_created">Date Created</SelectItem>
                  <SelectItem value="total_amount">Amount</SelectItem>
                  <SelectItem value="valid_until">Valid Until</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Quotations List</CardTitle>
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
                    <TableHead>Quotation #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items.map((quotation) => (
                    <TableRow key={quotation.id}>
                      <TableCell className="font-medium">
                        {quotation.quotation_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{quotation.client?.name}</div>
                          <div className="text-sm text-gray-500">{quotation.client?.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(quotation.total_amount)}</div>
                        <div className="text-sm text-gray-500">
                          Labour: {formatCurrency(quotation.labour_total)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(quotation.status)}
                          {isExpired(quotation.valid_until) && quotation.status !== 'accepted' && (
                            <div className="text-xs text-red-600">Expired</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(quotation.valid_until)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(quotation.date_created)}
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
                            <DropdownMenuItem onClick={() => openQuotationModal("view", quotation)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openQuotationModal("edit", quotation)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDeleteModal(quotation)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {renderPagination()}
            </>
          )}
        </CardContent>
      </Card>

      {/* Quotation Modal */}
      <QuotationModal
        isOpen={quotationModalOpen}
        onClose={closeQuotationModal}
        onSubmit={handleQuotationSubmit}
        title={
          modalMode === "create" ? "Create New Quotation" :
          modalMode === "edit" ? "Edit Quotation" :
          "View Quotation"
        }
        initialData={selectedQuotation ? convertQuotationToFormData(selectedQuotation) : undefined}
        clients={clients}
        loading={submitLoading}
        mode={modalMode}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Delete Quotation"
        description={`Are you sure you want to delete quotation ${selectedQuotation?.quotation_number}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  )
}

export default QuotationsView
