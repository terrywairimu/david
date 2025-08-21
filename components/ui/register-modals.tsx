"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"

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

interface RegisterModalsProps {
  showClientModal: boolean
  showSupplierModal: boolean
  showEmployeeModal: boolean
  showEditModal: boolean
  editEntity: RegisteredEntity | null
  editEmployee: Employee | null
  editType: "client" | "supplier" | "employee" | null
  onCloseClientModal: () => void
  onCloseSupplierModal: () => void
  onCloseEmployeeModal: () => void
  onCloseEditModal: () => void
  onRefreshData: () => void
}

const RegisterModals = ({
  showClientModal,
  showSupplierModal,
  showEmployeeModal,
  showEditModal,
  editEntity,
  editEmployee,
  editType,
  onCloseClientModal,
  onCloseSupplierModal,
  onCloseEmployeeModal,
  onCloseEditModal,
  onRefreshData,
}: RegisterModalsProps) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    pin: "",
    location: "",
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
    if (editEntity && showEditModal) {
      setFormData({
        name: editEntity.name || "",
        phone: editEntity.phone || "",
        pin: editEntity.pin || "",
        location: editEntity.location || "",
        email: "",
        position: "",
        department: ""
      })
    } else if (editEmployee && showEditModal) {
      setFormData({
        name: editEmployee.name || "",
        phone: editEmployee.phone || "",
        pin: "",
        location: editEmployee.department || "",
        email: editEmployee.email || "",
        position: editEmployee.position || "",
        department: editEmployee.department || ""
      })
    } else {
      setFormData({
    name: "",
    phone: "",
    pin: "",
        location: "",
        email: "",
        position: "",
        department: ""
      })
    }
  }, [editEntity, editEmployee, showEditModal])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (showEditModal && (editEntity || editEmployee)) {
        if (editType === "employee" && editEmployee) {
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
        } else if (editEntity) {
          // Update existing entity
          const { error } = await supabase
            .from("registered_entities")
            .update({
              name: formData.name,
              phone: formData.phone || null,
              pin: formData.pin || null,
              location: formData.location || null
            })
            .eq("id", editEntity.id)

          if (error) throw error

          toast.success("Entity updated successfully!")
          onCloseEditModal()
        }
      } else {
        // Create new item
        if (showEmployeeModal) {
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
        } else if (showClientModal) {
          // Create new client
      const { error } = await supabase
        .from("registered_entities")
        .insert([{
              name: formData.name,
          type: "client",
              phone: formData.phone || null,
              pin: formData.pin || null,
              location: formData.location || null,
              status: "active"
        }])

      if (error) throw error

      toast.success("Client added successfully!")
      onCloseClientModal()
        } else if (showSupplierModal) {
          // Create new supplier
      const { error } = await supabase
        .from("registered_entities")
        .insert([{
              name: formData.name,
          type: "supplier",
              phone: formData.phone || null,
              pin: formData.pin || null,
              location: formData.location || null,
              status: "active"
        }])

      if (error) throw error

      toast.success("Supplier added successfully!")
      onCloseSupplierModal()
        }
      }

      onRefreshData()
    } catch (error: any) {
      console.error("Error saving item:", error)
      toast.error(error.message || "Failed to save item")
    } finally {
      setLoading(false)
    }
  }

  const getModalTitle = () => {
    if (showEditModal) {
      if (editType === "employee") return "Edit Employee"
      if (editType === "client") return "Edit Client"
      if (editType === "supplier") return "Edit Supplier"
      return "Edit Item"
    }
    if (showEmployeeModal) return "Add New Employee"
    if (showClientModal) return "Add New Client"
    if (showSupplierModal) return "Add New Supplier"
    return "Add New Item"
  }

  const getSubmitButtonText = () => {
    if (showEditModal) {
      if (editType === "employee") return "Update Employee"
      if (editType === "client") return "Update Client"
      if (editType === "supplier") return "Update Supplier"
      return "Update Item"
    }
    if (showEmployeeModal) return "Add Employee"
    if (showClientModal) return "Add Client"
    if (showSupplierModal) return "Add Supplier"
    return "Add Item"
  }

  const isEmployeeModal = showEmployeeModal || (showEditModal && editType === "employee")

  return (
    <>
      {/* Client Modal */}
      {(showClientModal || (showEditModal && editType === "client")) && (
        <div className="modal fade show" style={{ display: "block", zIndex: 1055, backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content" style={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">{getModalTitle()}</h5>
                <button type="button" className="btn-close" onClick={onCloseClientModal}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body pt-2">
                <form id="clientForm" onSubmit={handleSubmit}>
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
                    <label className="form-label">PIN Number</label>
                    <input
                      type="text"
                      className="form-control border-0 shadow-sm"
                      value={formData.pin}
                      onChange={(e) => setFormData(prev => ({ ...prev, pin: e.target.value }))}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                      placeholder="PIN Number"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      className="form-control border-0 shadow-sm"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                      placeholder="Location"
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer border-0">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={onCloseClientModal}
                  style={{ borderRadius: "12px", height: "45px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-add"
                  form="clientForm"
                  disabled={loading}
                  style={{ borderRadius: "12px", height: "45px" }}
                >
                  {loading ? "Saving..." : getSubmitButtonText()}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {(showSupplierModal || (showEditModal && editType === "supplier")) && (
        <div className="modal fade show" style={{ display: "block", zIndex: 1055, backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content" style={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">{getModalTitle()}</h5>
                <button type="button" className="btn-close" onClick={onCloseSupplierModal}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body pt-2">
                <form id="supplierForm" onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Company/Supplier Name *</label>
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
                    <label className="form-label">PIN Number</label>
                    <input
                      type="text"
                      className="form-control border-0 shadow-sm"
                      value={formData.pin}
                      onChange={(e) => setFormData(prev => ({ ...prev, pin: e.target.value }))}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                      placeholder="PIN Number"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      className="form-control border-0 shadow-sm"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                      placeholder="Location"
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer border-0">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={onCloseSupplierModal}
                  style={{ borderRadius: "12px", height: "45px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-add"
                  form="supplierForm"
                  disabled={loading}
                  style={{ borderRadius: "12px", height: "45px" }}
                >
                  {loading ? "Saving..." : getSubmitButtonText()}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Modal */}
      {(showEmployeeModal || (showEditModal && editType === "employee")) && (
        <div className="modal fade show" style={{ display: "block", zIndex: 1055, backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content" style={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">{getModalTitle()}</h5>
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
                  {loading ? "Saving..." : getSubmitButtonText()}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 

export default RegisterModals 