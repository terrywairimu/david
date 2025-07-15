"use client"

import RegisterTable from "./components/register-table"
import { UserPlus, Truck } from "lucide-react"

const RegisterPage = () => {
  return (
    <div id="registerSection" className="card">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <h2 className="mb-0">Register Management</h2>
          <div className="d-flex gap-2">
            <button className="btn btn-add">
              <UserPlus className="me-2" size={16} />
              Add New Client
            </button>
            <button className="btn btn-add">
              <Truck className="me-2" size={16} />
              Add New Supplier
            </button>
          </div>
        </div>
      </div>
      <RegisterTable />
    </div>
  )
}

export default RegisterPage
