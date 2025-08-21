"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"

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

interface EmployeeModalsProps {
  showEmployeeModal: boolean
  showEditModal: boolean
  editEmployee: Employee | null
  onCloseEmployeeModal: () => void
  onCloseEditModal: () => void
  onRefreshData: () => void
}

const EmployeeModals = ({
  showEmployeeModal,
  showEditModal,
  editEmployee,
  onCloseEmployeeModal,
  onCloseEditModal,
  onRefreshData,
}: EmployeeModalsProps) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    position: "",
    department: ""
  })
  const [loading, setLoading] = useState(false)

  const departments = [
    "Administration",
    "Operations", 
    "Marketing",
    "Finance",
    "IT",
    "Human Resources",
    "Sales",
    "Customer Service",
    "Research & Development",
    "Legal",
    "Other"
  ]

  const positions = [
    "Manager",
    "Supervisor",
    "Team Lead",
    "Senior",
    "Junior",
    "Intern",
    "Director",
    "VP",
    "CEO",
    "Other"
  ]

  useEffect(() => {
    if (editEmployee && showEditModal) {
      setFormData({
        name: editEmployee.name || "",
        phone: editEmployee.phone || "",
        email: editEmployee.email || "",
        position: editEmployee.position || "",
        department: editEmployee.department || ""
      })
    } else {
      setFormData({
        name: "",
        phone: "",
        email: "",
        position: "",
        department: ""
      })
    }
  }, [editEmployee, showEditModal])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (showEditModal && editEmployee) {
        // Update existing employee
        const { error } = await supabase
          .from("employees")
          .update({
            name: formData.name,
            phone: formData.phone || null,
            email: formData.email || null,
            position: formData.position || null,
            department: formData.department || null
          })
          .eq("id", editEmployee.id)

        if (error) throw error

        toast.success("Employee updated successfully!")
        onCloseEditModal()
      } else {
        // Create new employee
        const { error } = await supabase
          .from("employees")
          .insert([{
            name: formData.name,
            phone: formData.phone || null,
            email: formData.email || null,
            position: formData.position || null,
            department: formData.department || null,
            status: "active"
          }])

        if (error) throw error

        toast.success("Employee added successfully!")
        onCloseEmployeeModal()
      }

      onRefreshData()
    } catch (error: any) {
      console.error("Error saving employee:", error)
      toast.error(error.message || "Failed to save employee")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Add New Employee Modal */}
      {showEmployeeModal && (
        <div className="modal fade show" style={{ display: "block", zIndex: 1055, backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content" style={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Add New Employee</h5>
                <button type="button" className="btn-close" onClick={onCloseEmployeeModal}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body pt-2">
                <form id="employeeForm" onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-control border-0 shadow-sm"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control border-0 shadow-sm"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                      placeholder="+254 XXX XXX XXX"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control border-0 shadow-sm"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                      placeholder="employee@company.com"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Position</label>
                    <select
                      className="form-select border-0 shadow-sm"
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                    >
                      <option value="">Select Position</option>
                      {positions.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Department</label>
                    <select
                      className="form-select border-0 shadow-sm"
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </form>
              </div>
              <div className="modal-footer border-0">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={onCloseEmployeeModal}
                  style={{ borderRadius: "12px", height: "45px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-add"
                  form="employeeForm"
                  disabled={loading}
                  style={{ borderRadius: "12px", height: "45px" }}
                >
                  {loading ? "Saving..." : "Add Employee"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && editEmployee && (
        <div className="modal fade show" style={{ display: "block", zIndex: 1055, backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content" style={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Edit Employee</h5>
                <button type="button" className="btn-close" onClick={onCloseEditModal}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body pt-2">
                <form id="editEmployeeForm" onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-control border-0 shadow-sm"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control border-0 shadow-sm"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                      placeholder="+254 XXX XXX XXX"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control border-0 shadow-sm"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                      placeholder="employee@company.com"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Position</label>
                    <select
                      className="form-select border-0 shadow-sm"
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                    >
                      <option value="">Select Position</option>
                      {positions.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Department</label>
                    <select
                      className="form-select border-0 shadow-sm"
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </form>
              </div>
              <div className="modal-footer border-0">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={onCloseEditModal}
                  style={{ borderRadius: "12px", height: "45px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-add"
                  form="editEmployeeForm"
                  disabled={loading}
                  style={{ borderRadius: "12px", height: "45px" }}
                >
                  {loading ? "Saving..." : "Update Employee"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default EmployeeModals
