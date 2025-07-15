"use client"

import { useState } from "react"
import RegisterTable from "./components/register-table"
import RegisterModals from "@/components/ui/register-modals"
import { UserPlus, Truck } from "lucide-react"

const RegisterPage = () => {
  const [showClientModal, setShowClientModal] = useState(false)
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleShowClientModal = () => {
    setShowClientModal(true)
  }

  const handleShowSupplierModal = () => {
    setShowSupplierModal(true)
  }

  const handleRefreshData = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <>
      <div id="registerSection" className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="mb-0">Register Management</h2>
            <div className="d-flex gap-2">
              <button className="btn btn-add" onClick={handleShowClientModal}>
                <UserPlus className="me-2" size={16} />
                Add New Client
              </button>
              <button className="btn btn-add" onClick={handleShowSupplierModal}>
                <Truck className="me-2" size={16} />
                Add New Supplier
              </button>
            </div>
          </div>
        </div>
        <RegisterTable 
          onShowClientModal={handleShowClientModal}
          onShowSupplierModal={handleShowSupplierModal}
          key={refreshTrigger}
        />
      </div>

      {/* Modals */}
      <RegisterModals
        showClientModal={showClientModal}
        showSupplierModal={showSupplierModal}
        showEditModal={false}
        editEntity={null}
        onCloseClientModal={() => setShowClientModal(false)}
        onCloseSupplierModal={() => setShowSupplierModal(false)}
        onCloseEditModal={() => {}}
        onRefreshData={handleRefreshData}
      />
    </>
  )
}

export default RegisterPage
