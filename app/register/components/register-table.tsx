"use client"

import { useEffect, useState } from "react"
import { Edit, Trash2, Download, Search } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import { ActionGuard } from "@/components/ActionGuard"

interface RegisteredEntity {
  id: number
  name: string
  type: "client" | "supplier"
  phone?: string
  pin?: string
  location?: string
  date_added: string
  status: "active" | "inactive"
}

interface Employee {
  id: number
  name: string
  phone?: string
  email?: string
  position?: string
  department?: string
  date_added: string
  status: "active" | "inactive"
}

interface RegisterTableProps {
  onShowClientModal: () => void
  onShowSupplierModal: () => void
  onShowEmployeeModal: () => void
  onEditEntity: (entity: RegisteredEntity) => void
  onEditEmployee: (employee: Employee) => void
  refreshTrigger?: number
}

const RegisterTable = ({ 
  onShowClientModal, 
  onShowSupplierModal, 
  onShowEmployeeModal, 
  onEditEntity, 
  onEditEmployee, 
  refreshTrigger 
}: RegisterTableProps) => {
  const [entities, setEntities] = useState<RegisteredEntity[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [locations, setLocations] = useState<string[]>([])
  
  // Delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteEntityId, setDeleteEntityId] = useState<number | null>(null)
  const [deleteEntityType, setDeleteEntityType] = useState<"entity" | "employee" | null>(null)

  useEffect(() => {
    fetchEntities()
    fetchEmployees()
    
    // Set up real-time subscription for registered entities
    const entitiesSubscription = supabase
      .channel('registered_entities_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registered_entities' }, (payload) => {
        console.log('Registered entities change detected:', payload)
        fetchEntities() // Refresh entities when changes occur
      })
      .subscribe()

    // Set up real-time subscription for employees
    const employeesSubscription = supabase
      .channel('employees_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, (payload) => {
        console.log('Employees change detected:', payload)
        fetchEmployees() // Refresh employees when changes occur
      })
      .subscribe()

    return () => {
      supabase.removeChannel(entitiesSubscription)
      supabase.removeChannel(employeesSubscription)
    }
  }, [refreshTrigger])

  const fetchEntities = async () => {
    try {
      const res = await fetch("/api/register/entities", { credentials: "include" })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setEntities(Array.isArray(data) ? data : [])
      const uniqueLocations = [...new Set(data?.map((e: RegisteredEntity) => e.location).filter(Boolean))] as string[]
      setLocations(uniqueLocations)
    } catch (error) {
      console.error("Error fetching entities:", error)
      toast.error("Error fetching entities")
    }
  }

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/register/employees", { credentials: "include" })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setEmployees(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching employees:", error)
      toast.error("Error fetching employees")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (entity: RegisteredEntity) => {
    onEditEntity(entity)
  }

  const handleEditEmployee = (employee: Employee) => {
    onEditEmployee(employee)
  }

  const handleDelete = (id: number, type: "entity" | "employee") => {
    setDeleteEntityId(id)
    setDeleteEntityType(type)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deleteEntityId || !deleteEntityType) return

    try {
      if (deleteEntityType === "entity") {
        const { error } = await supabase
          .from("registered_entities")
          .delete()
          .eq("id", deleteEntityId)

        if (error) throw error
        toast.success("Entity deleted successfully!")
        fetchEntities()
      } else {
        const { error } = await supabase
          .from("employees")
          .update({ status: "inactive" })
          .eq("id", deleteEntityId)

        if (error) throw error
        toast.success("Employee deleted successfully!")
        fetchEmployees()
      }
    } catch (error) {
      console.error("Error deleting item:", error)
      toast.error("Error deleting item")
    } finally {
      setShowDeleteDialog(false)
      setDeleteEntityId(null)
      setDeleteEntityType(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getFilteredData = () => {
    const allData = [
      ...entities.map(entity => ({
        ...entity,
        displayType: entity.type,
        isEmployee: false,
        email: undefined,
        position: undefined,
        department: undefined,
        pin: entity.pin
      })),
      ...employees.map(employee => ({
        ...employee,
        displayType: "employee",
        isEmployee: true,
        type: "employee" as any,
        location: employee.department,
        pin: undefined
      }))
    ]

    let filtered = allData.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (item as any).email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (item as any).position?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesType = !typeFilter || item.displayType === typeFilter
      const matchesLocation = !locationFilter || item.location === locationFilter
      
      return matchesSearch && matchesType && matchesLocation
    })

    return filtered.sort((a, b) => new Date(b.date_added).getTime() - new Date(a.date_added).getTime())
  }

  const exportToCSV = () => {
    const filteredData = getFilteredData()
    const csvContent = [
      ["Name", "Type", "Phone", "Email", "Position", "Department/Location", "PIN Number", "Date Added"],
      ...filteredData.map(item => [
        item.name,
        item.displayType === "employee" ? "Employee" : item.displayType.charAt(0).toUpperCase() + item.displayType.slice(1),
        item.phone || "",
        (item as any).email || "",
        (item as any).position || "",
        item.location || "",
        (item as any).pin || "",
        new Date(item.date_added).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "register_data.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getTypeStyle = (type: string) => {
    if (type === 'client') {
      return {
        backgroundColor: '#e3f2fd',
        color: '#1976d2',
        borderRadius: '50px',
        padding: '6px 16px',
        fontWeight: '500',
        fontSize: '0.875rem'
      }
    } else if (type === 'supplier') {
      return {
        backgroundColor: '#e8f5e9',
        color: '#2e7d32',
        borderRadius: '50px',
        padding: '6px 16px',
        fontWeight: '500',
        fontSize: '0.875rem'
      }
    } else {
      return {
        backgroundColor: '#fff3e0',
        color: '#f57c00',
        borderRadius: '50px',
        padding: '6px 16px',
        fontWeight: '500',
        fontSize: '0.875rem'
      }
    }
  }

  const filteredData = getFilteredData()

  return (
    <div>
      {/* Search and Filter Controls */}
      <div className="register-search-filter mb-4">
        {/* Desktop Layout */}
        <div className="d-none d-md-block">
          <div className="row">
            <div className="col-md-4">
              <div className="input-group shadow-sm">
                <span className="input-group-text border-0 bg-white" style={{ borderRadius: "16px 0 0 16px", height: "45px" }}>
                  <Search className="text-muted" size={16} />
                </span>
                <input
                  type="text"
                  className="form-control border-0 py-2"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ borderRadius: "0 16px 16px 0", height: "45px" }}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select border-0 py-2 shadow-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{ borderRadius: "16px", height: "45px" }}
              >
                <option value="">All Types</option>
                <option value="client">Clients</option>
                <option value="supplier">Suppliers</option>
                <option value="employee">Employees</option>
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select border-0 py-2 shadow-sm"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                style={{ borderRadius: "16px", height: "45px" }}
              >
                <option value="">All Locations/Departments</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <ActionGuard actionId="export">
                <button
                  className="btn w-100 shadow-sm export-btn"
                  onClick={exportToCSV}
                  style={{ borderRadius: "16px", height: "45px", transition: "all 0.3s ease" }}
                >
                  <Download className="me-2" size={16} />
                  Export
                </button>
              </ActionGuard>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="d-block d-md-none">
          {/* Search Input - Full Row */}
          <div className="mb-3">
            <div className="input-group shadow-sm">
              <span className="input-group-text border-0 bg-white" style={{ borderRadius: "16px 0 0 16px", height: "45px" }}>
                <Search className="text-muted" size={16} />
              </span>
              <input
                type="text"
                className="form-control border-0 py-2"
                placeholder="Search..."
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
                className="form-select border-0 py-2 shadow-sm w-100"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{ borderRadius: "16px", height: "45px" }}
              >
                <option value="">All Types</option>
                <option value="client">Clients</option>
                <option value="supplier">Suppliers</option>
                <option value="employee">Employees</option>
              </select>
            </div>
            <div className="flex-fill">
              <select
                className="form-select border-0 py-2 shadow-sm w-100"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                style={{ borderRadius: "16px", height: "45px" }}
              >
                <option value="">All Locations/Departments</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-fill">
              <ActionGuard actionId="export">
                <button
                  className="btn w-100 shadow-sm export-btn"
                  onClick={exportToCSV}
                  style={{ borderRadius: "16px", height: "45px", transition: "all 0.3s ease" }}
                >
                  <Download className="me-2" size={16} />
                  Export
                </button>
              </ActionGuard>
            </div>
          </div>
        </div>
      </div>

      {/* Register Table */}
      <div className="card table-section">
        <div className="w-full overflow-x-auto">
          <table className="table table-hover" id="registerTable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Phone Number</th>
                <th>Email</th>
                <th>Position</th>
                <th>Location/Department</th>
                <th>PIN Number</th>
                <th>Date Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center">
                    No items found
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={`${item.isEmployee ? 'emp' : 'ent'}-${item.id}`}>
                    <td>{item.name}</td>
                    <td>
                      <span style={getTypeStyle(item.displayType)}>
                        {item.displayType === "employee" ? "Employee" : item.displayType.charAt(0).toUpperCase() + item.displayType.slice(1)}
                      </span>
                    </td>
                    <td>{item.phone || "-"}</td>
                    <td>{(item as any).email || "-"}</td>
                    <td>{(item as any).position || "-"}</td>
                    <td>{item.location || "-"}</td>
                    <td>{(item as any).pin || "-"}</td>
                    <td>{formatDate(item.date_added)}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <ActionGuard actionId="edit">
                          <button 
                            className="action-btn" 
                            onClick={() => item.isEmployee ? handleEditEmployee(item as Employee) : handleEdit(item as RegisteredEntity)} 
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                        </ActionGuard>
                        <ActionGuard actionId="delete">
                          <button 
                            className="action-btn" 
                            onClick={() => handleDelete(item.id, item.isEmployee ? "employee" : "entity")} 
                            title="Delete"
                          >
                            <Trash2 size={16} />
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        show={showDeleteDialog}
        title="Delete Item"
        message={`Are you sure you want to delete this ${deleteEntityType === "employee" ? "employee" : "entry"}?`}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}

export default RegisterTable
