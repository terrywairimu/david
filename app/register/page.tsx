"use client"

import { useState } from "react"
import RegisterTable from "./components/register-table"
import RegisterModals from "@/components/ui/register-modals"
import { SectionHeader } from "@/components/ui/section-header"
import { ActionGuard } from "@/components/ActionGuard"
import { UserPlus, Truck, Users } from "lucide-react"

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

const RegisterPage = () => {
  const [showClientModal, setShowClientModal] = useState(false)
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editEntity, setEditEntity] = useState<RegisteredEntity | null>(null)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [editType, setEditType] = useState<"client" | "supplier" | "employee" | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleShowClientModal = () => {
    setShowClientModal(true)
  }

  const handleShowSupplierModal = () => {
    setShowSupplierModal(true)
  }

  const handleShowEmployeeModal = () => {
    setShowEmployeeModal(true)
  }

  const handleEditEntity = (entity: RegisteredEntity) => {
    setEditEntity(entity)
    setEditEmployee(null)
    setEditType(entity.type)
    setShowEditModal(true)
  }

  const handleEditEmployee = (employee: Employee) => {
    setEditEmployee(employee)
    setEditEntity(null)
    setEditType("employee")
    setShowEditModal(true)
  }

  const handleRefreshData = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <>
      <div id="registerSection" className="card">
        <SectionHeader title="Register Management">
          <ActionGuard actionId="add">
            <button className="btn btn-add" onClick={handleShowClientModal}>
              <UserPlus className="me-2" size={16} />
              Add New Client
            </button>
          </ActionGuard>
          <ActionGuard actionId="add">
            <button className="btn btn-add" onClick={handleShowSupplierModal}>
              <Truck className="me-2" size={16} />
              Add New Supplier
            </button>
          </ActionGuard>
          <ActionGuard actionId="add">
            <button className="btn btn-add" onClick={handleShowEmployeeModal}>
              <Users className="me-2" size={16} />
              Add New Employee
            </button>
          </ActionGuard>
        </SectionHeader>
        
        <div className="card-body p-0">
          <RegisterTable 
            onShowClientModal={handleShowClientModal}
            onShowSupplierModal={handleShowSupplierModal}
            onShowEmployeeModal={handleShowEmployeeModal}
            onEditEntity={handleEditEntity}
            onEditEmployee={handleEditEmployee}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>

      {/* Modals */}
      <RegisterModals
        showClientModal={showClientModal}
        showSupplierModal={showSupplierModal}
        showEmployeeModal={showEmployeeModal}
        showEditModal={showEditModal}
        editEntity={editEntity}
        editEmployee={editEmployee}
        editType={editType}
        onCloseClientModal={() => setShowClientModal(false)}
        onCloseSupplierModal={() => setShowSupplierModal(false)}
        onCloseEmployeeModal={() => setShowEmployeeModal(false)}
        onCloseEditModal={() => {
          setShowEditModal(false)
          setEditEntity(null)
          setEditEmployee(null)
          setEditType(null)
        }}
        onRefreshData={handleRefreshData}
      />
    </>
  )
}

export default RegisterPage
