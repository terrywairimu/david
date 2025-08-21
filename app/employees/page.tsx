"use client"

import { useState } from "react"
import EmployeesTable from "./components/employees-table"
import EmployeeModals from "./components/employee-modals"
import { SectionHeader } from "@/components/ui/section-header"
import { Users } from "lucide-react"

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

const EmployeesPage = () => {
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleShowEmployeeModal = () => {
    setShowEmployeeModal(true)
  }

  const handleEditEmployee = (employee: Employee) => {
    setEditEmployee(employee)
    setShowEditModal(true)
  }

  const handleRefreshData = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <>
      <div id="employeesSection" className="card">
        <SectionHeader title="Employee Management">
          <button className="btn btn-add" onClick={handleShowEmployeeModal}>
            <Users className="me-2" size={16} />
            Add New Employee
          </button>
        </SectionHeader>
        
        <div className="card-body p-0">
          <EmployeesTable 
            onShowEmployeeModal={handleShowEmployeeModal}
            onEditEmployee={handleEditEmployee}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>

      {/* Modals */}
      <EmployeeModals
        showEmployeeModal={showEmployeeModal}
        showEditModal={showEditModal}
        editEmployee={editEmployee}
        onCloseEmployeeModal={() => setShowEmployeeModal(false)}
        onCloseEditModal={() => setShowEditModal(false)}
        onRefreshData={handleRefreshData}
      />
    </>
  )
}

export default EmployeesPage
