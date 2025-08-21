"use client"

import { useState } from "react"
import RegisterTable from "./components/register-table"
import RegisterModals from "@/components/ui/register-modals"
import { SectionHeader } from "@/components/ui/section-header"
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

const RegisterPage = () => {
  const [showClientModal, setShowClientModal] = useState(false)
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editEntity, setEditEntity] = useState<RegisteredEntity | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleShowClientModal = () => {
    setShowClientModal(true)
  }

  const handleShowSupplierModal = () => {
    setShowSupplierModal(true)
  }

  const handleEditEntity = (entity: RegisteredEntity) => {
    setEditEntity(entity)
    setShowEditModal(true)
  }

  const handleRefreshData = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <>
      <div id="registerSection" className="card">
        <SectionHeader title="Register Management">
          <button className="btn btn-add" onClick={handleShowClientModal}>
            <UserPlus className="me-2" size={16} />
            Add New Client
          </button>
          <button className="btn btn-add" onClick={handleShowSupplierModal}>
            <Truck className="me-2" size={16} />
            Add New Supplier
          </button>
          <button className="btn btn-add" onClick={() => window.location.href = '/employees'}>
            <Users className="me-2" size={16} />
            Add New Employee
          </button>
        </SectionHeader>
        
        <div className="card-body p-0">
          <RegisterTable 
          onShowClientModal={handleShowClientModal}
          onShowSupplierModal={handleShowSupplierModal}
          onEditEntity={handleEditEntity}
          refreshTrigger={refreshTrigger}
        />
        </div>
      </div>

      {/* Modals */}
      <RegisterModals
        showClientModal={showClientModal}
        showSupplierModal={showSupplierModal}
        showEditModal={showEditModal}
        editEntity={editEntity}
        onCloseClientModal={() => setShowClientModal(false)}
        onCloseSupplierModal={() => setShowSupplierModal(false)}
        onCloseEditModal={() => setShowEditModal(false)}
        onRefreshData={handleRefreshData}
      />
    </>
  )
}

export default RegisterPage
