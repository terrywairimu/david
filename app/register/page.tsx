"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  UserPlus, 
  Users, 
  Download, 
  Edit, 
  Trash2, 
  Filter,
  MoreHorizontal,
  Eye,
  Phone,
  MapPin,
  Calendar,
  Building
} from "lucide-react"
import { RegisterService } from "@/lib/supabase-client"
import { toast } from "sonner"
import { 
  RegisteredEntity, 
  FilterState, 
  ModalState, 
  PaginatedResponse,
  RegisterFormData 
} from "@/lib/types"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const RegisterPage = () => {
  const [data, setData] = useState<PaginatedResponse<RegisteredEntity> | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false })
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState<RegisteredEntity | null>(null)
  const [formData, setFormData] = useState<RegisterFormData>({
    type: "client",
    name: "",
    phone: "",
    pin: "",
    location: "",
    email: "",
    address: "",
    company: "",
    contact_person: "",
    notes: ""
  })
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    type: "all",
    status: "active",
    sort_by: "date_added",
    sort_order: "desc",
    page: 1,
    per_page: 10
  })

  useEffect(() => {
    fetchEntities()
  }, [filters])

  const fetchEntities = async () => {
    setLoading(true)
    try {
      const response = await RegisterService.getAll(filters)
      if (response.success && response.data) {
        setData(response.data)
      } else {
        toast.error(response.error || "Failed to fetch entities")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (searchTerm: string) => {
    setSearchLoading(true)
    setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }))
    setSearchLoading(false)
  }

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const openModal = (type: "create" | "edit" | "view", entity?: RegisteredEntity) => {
    if (type === "edit" || type === "view") {
      if (entity) {
        setFormData({
          type: entity.type,
          name: entity.name,
          phone: entity.phone || "",
          pin: entity.pin || "",
          location: entity.location || "",
          email: entity.email || "",
          address: entity.address || "",
          company: entity.company || "",
          contact_person: entity.contact_person || "",
          notes: entity.notes || ""
        })
        setSelectedEntity(entity)
      }
    } else {
      setFormData({
        type: "client",
        name: "",
        phone: "",
        pin: "",
        location: "",
        email: "",
        address: "",
        company: "",
        contact_person: "",
        notes: ""
      })
      setSelectedEntity(null)
    }
    setModalState({ isOpen: true, type, title: getModalTitle(type) })
    setFormErrors({})
  }

  const closeModal = () => {
    setModalState({ isOpen: false })
    setSelectedEntity(null)
    setFormData({
      type: "client",
      name: "",
      phone: "",
      pin: "",
      location: "",
      email: "",
      address: "",
      company: "",
      contact_person: "",
      notes: ""
    })
    setFormErrors({})
  }

  const getModalTitle = (type: "create" | "edit" | "view") => {
    switch (type) {
      case "create":
        return `Add New ${formData.type === "client" ? "Client" : "Supplier"}`
      case "edit":
        return `Edit ${formData.type === "client" ? "Client" : "Supplier"}`
      case "view":
        return `View ${formData.type === "client" ? "Client" : "Supplier"}`
      default:
        return ""
    }
  }

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {}
    
    if (!formData.name.trim()) {
      errors.name = "Name is required"
    }
    
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required"
    } else if (!/^\d{10,15}$/.test(formData.phone.replace(/\s/g, ""))) {
      errors.phone = "Please enter a valid phone number"
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address"
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      let response
      if (modalState.type === "create") {
        response = await RegisterService.create(formData)
      } else if (modalState.type === "edit" && selectedEntity) {
        response = await RegisterService.update(selectedEntity.id, formData)
      }

      if (response?.success) {
        toast.success(response.message || "Operation completed successfully")
        closeModal()
        fetchEntities()
      } else {
        toast.error(response?.error || "Operation failed")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    }
  }

  const handleDelete = async () => {
    if (!selectedEntity) return
    
    try {
      const response = await RegisterService.delete(selectedEntity.id)
      if (response.success) {
        toast.success(response.message || "Entity deleted successfully")
        setDeleteModalOpen(false)
        setSelectedEntity(null)
        fetchEntities()
      } else {
        toast.error(response.error || "Failed to delete entity")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    }
  }

  const openDeleteModal = (entity: RegisteredEntity) => {
    setSelectedEntity(entity)
    setDeleteModalOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
      case "inactive":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactive</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "client":
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Client</Badge>
      case "supplier":
        return <Badge variant="default" className="bg-purple-100 text-purple-800">Supplier</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Register</h1>
              <p className="text-gray-600">Manage your clients and suppliers</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => openModal("create")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add New
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Clients</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {data?.items.filter(item => item.type === 'client').length || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Suppliers</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {data?.items.filter(item => item.type === 'supplier').length || 0}
                  </p>
                </div>
                <Building className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Entities</p>
                  <p className="text-2xl font-bold text-green-600">
                    {data?.items.filter(item => item.status === 'active').length || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name..."
                    value={filters.search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="client">Clients</SelectItem>
                    <SelectItem value="supplier">Suppliers</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.sort_by} onValueChange={(value) => handleFilterChange('sort_by', value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date_added">Date Added</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="type">Type</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Registered Entities</CardTitle>
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
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date Added</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.items.map((entity) => (
                      <TableRow key={entity.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-medium">{entity.name}</div>
                            {entity.company && (
                              <div className="text-sm text-gray-500">{entity.company}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(entity.type)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {entity.phone && (
                              <div className="flex items-center text-sm">
                                <Phone className="h-3 w-3 mr-1" />
                                {entity.phone}
                              </div>
                            )}
                            {entity.email && (
                              <div className="text-sm text-gray-500">{entity.email}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {entity.location && (
                            <div className="flex items-center text-sm">
                              <MapPin className="h-3 w-3 mr-1" />
                              {entity.location}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(entity.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(entity.date_added)}
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
                              <DropdownMenuItem onClick={() => openModal("view", entity)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openModal("edit", entity)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => openDeleteModal(entity)}
                                className="text-red-600"
                              >
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

        {/* Form Modal */}
        <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{modalState.title}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as "client" | "supplier" }))}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="client">Client</TabsTrigger>
                  <TabsTrigger value="supplier">Supplier</TabsTrigger>
                </TabsList>
                <TabsContent value="client" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className={formErrors.name ? "border-red-500" : ""}
                        disabled={modalState.type === "view"}
                      />
                      {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className={formErrors.phone ? "border-red-500" : ""}
                        disabled={modalState.type === "view"}
                      />
                      {formErrors.phone && <p className="text-sm text-red-500 mt-1">{formErrors.phone}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className={formErrors.email ? "border-red-500" : ""}
                        disabled={modalState.type === "view"}
                      />
                      {formErrors.email && <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>}
                    </div>
                    <div>
                      <Label htmlFor="pin">PIN/ID</Label>
                      <Input
                        id="pin"
                        value={formData.pin}
                        onChange={(e) => setFormData(prev => ({ ...prev, pin: e.target.value }))}
                        disabled={modalState.type === "view"}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      disabled={modalState.type === "view"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      disabled={modalState.type === "view"}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="supplier" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Company Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className={formErrors.name ? "border-red-500" : ""}
                        disabled={modalState.type === "view"}
                      />
                      {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
                    </div>
                    <div>
                      <Label htmlFor="contact_person">Contact Person</Label>
                      <Input
                        id="contact_person"
                        value={formData.contact_person}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                        disabled={modalState.type === "view"}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className={formErrors.phone ? "border-red-500" : ""}
                        disabled={modalState.type === "view"}
                      />
                      {formErrors.phone && <p className="text-sm text-red-500 mt-1">{formErrors.phone}</p>}
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className={formErrors.email ? "border-red-500" : ""}
                        disabled={modalState.type === "view"}
                      />
                      {formErrors.email && <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      disabled={modalState.type === "view"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      disabled={modalState.type === "view"}
                    />
                  </div>
                </TabsContent>
              </Tabs>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  disabled={modalState.type === "view"}
                />
              </div>
              {modalState.type !== "view" && (
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={closeModal}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {modalState.type === "create" ? "Create" : "Update"}
                  </Button>
                </div>
              )}
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {selectedEntity?.name}. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteModalOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

export default RegisterPage
