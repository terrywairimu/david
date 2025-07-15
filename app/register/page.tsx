"use client"

import RegisterTable from "./components/register-table"
import { UserPlus } from "lucide-react"

const RegisterPage = () => {
  return (
    <div id="registerSection">
      {/* Main Header Card */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="mb-0">
            <UserPlus className="me-2" size={20} />
            Register Management
          </h4>
        </div>
      </div>

      {/* Register Table Card */}
      <div className="card">
        <RegisterTable />
      </div>
    </div>
  )
}

export default RegisterPage
