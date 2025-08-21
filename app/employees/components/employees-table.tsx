"use client"

import { useEffect, useState } from "react"
import { Edit, Trash2, Download, Search, ArrowUpDown } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import ConfirmDialog from "@/components/ui/confirm-dialog"

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

interface EmployeesTableProps {
  onShowEmployeeModal: () => void
  onEditEmployee: (employee: Employee) => void
  refreshTrigger?: number
}

const EmployeesTable = ({ onShowEmployeeModal, onEditEmployee, refreshTrigger }: EmployeesTableProps) => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("")
  const [departments, setDepartments] = useState<string[]>([])
  const [sortField, setSortField] = useState<keyof Employee>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  
  // Delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteEmployeeId, setDeleteEmployeeId] = useState<number | null>(null)

  useEffect(() => {
    fetchEmployees()
    
    // Set up real-time subscription for employees
    const employeesSubscription = supabase
      .channel('employees_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, (payload) => {
        console.log('Employees change detected:', payload)
        fetchEmployees() // Refresh employees when changes occur
      })
      .subscribe()

    return () => {
      supabase.removeChannel(employeesSubscription)
    }
  }, [refreshTrigger])

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("status", "active")
        .order("name", { ascending: true })

      if (error) throw error

      setEmployees(data || [])
      
      // Extract unique departments
      const uniqueDepartments = [...new Set(data?.map(employee => employee.department).filter(Boolean))] as string[]
      setDepartments(uniqueDepartments)
    } catch (error) {
      console.error("Error fetching employees:", error)
      toast.error("Error fetching employees")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (employee: Employee) => {
    onEditEmployee(employee)
  }

  const handleDelete = (id: number) => {
    setDeleteEmployeeId(id)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deleteEmployeeId) return

    try {
      const { error } = await supabase
        .from("employees")
        .update({ status: "inactive" })
        .eq("id", deleteEmployeeId)

      if (error) throw error

      toast.success("Employee deleted successfully!")
      fetchEmployees()
    } catch (error) {
      console.error("Error deleting employee:", error)
      toast.error("Error deleting employee")
    } finally {
      setShowDeleteDialog(false)
      setDeleteEmployeeId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleSort = (field: keyof Employee) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getSortedEmployees = () => {
    const filtered = employees.filter(employee => {
      const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.department?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesDepartment = !departmentFilter || employee.department === departmentFilter
      
      return matchesSearch && matchesDepartment
    })

    return filtered.sort((a, b) => {
      const aValue = a[sortField] || ""
      const bValue = b[sortField] || ""
      
      if (typeof aValue === "string" && typeof bValue === "string") {
        if (sortDirection === "asc") {
          return aValue.localeCompare(bValue)
        } else {
          return bValue.localeCompare(aValue)
        }
      }
      
      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
  }

  const exportToCSV = () => {
    const sortedEmployees = getSortedEmployees()
    const csvContent = [
      ["Name", "Phone", "Email", "Position", "Department", "Date Added"],
      ...sortedEmployees.map(employee => [
        employee.name,
        employee.phone || "",
        employee.email || "",
        employee.position || "",
        employee.department || "",
        new Date(employee.date_added).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "employees_data.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getSortIcon = (field: keyof Employee) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} className="text-muted" />
    }
    return sortDirection === "asc" ? 
      <ArrowUpDown size={14} className="text-primary" /> : 
      <ArrowUpDown size={14} className="text-primary" style={{ transform: 'rotate(180deg)' }} />
  }

  const sortedEmployees = getSortedEmployees()

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
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ borderRadius: "0 16px 16px 0", height: "45px" }}
                />
              </div>
            </div>
            <div className="col-md-4">
              <select
                className="form-select border-0 py-2 shadow-sm"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                style={{ borderRadius: "16px", height: "45px" }}
              >
                <option value="">All Departments</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <button
                className="btn w-100 shadow-sm export-btn"
                onClick={exportToCSV}
                style={{ borderRadius: "16px", height: "45px", transition: "all 0.3s ease" }}
              >
                <Download className="me-2" size={16} />
                Export
              </button>
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
                placeholder="Search employees..."
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
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                style={{ borderRadius: "16px", height: "45px" }}
              >
                <option value="">All Departments</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-fill">
              <button
                className="btn w-100 shadow-sm export-btn"
                onClick={exportToCSV}
                style={{ borderRadius: "16px", height: "45px", transition: "all 0.3s ease" }}
              >
                <Download className="me-2" size={16} />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="card table-section">
        <div className="w-full overflow-x-auto">
          <table className="table table-hover" id="employeesTable">
            <thead>
              <tr>
                <th 
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("name")}
                  className="d-flex align-items-center gap-1"
                >
                  Name {getSortIcon("name")}
                </th>
                <th>Phone Number</th>
                <th>Email</th>
                <th 
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("position")}
                  className="d-flex align-items-center gap-1"
                >
                  Position {getSortIcon("position")}
                </th>
                <th 
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("department")}
                  className="d-flex align-items-center gap-1"
                >
                  Department {getSortIcon("department")}
                </th>
                <th 
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("date_added")}
                  className="d-flex align-items-center gap-1"
                >
                  Date Added {getSortIcon("date_added")}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : sortedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center">
                    No employees found
                  </td>
                </tr>
              ) : (
                sortedEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="fw-bold">{employee.name}</td>
                    <td>{employee.phone || "-"}</td>
                    <td>{employee.email || "-"}</td>
                    <td>{employee.position || "-"}</td>
                    <td>{employee.department || "-"}</td>
                    <td>{formatDate(employee.date_added)}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <button className="action-btn" onClick={() => handleEdit(employee)} title="Edit">
                          <Edit size={16} />
                        </button>
                        <button className="action-btn" onClick={() => handleDelete(employee.id)} title="Delete">
                          <Trash2 size={16} />
                        </button>
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
        title="Delete Employee"
        message="Are you sure you want to delete this employee?"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}

export default EmployeesTable
