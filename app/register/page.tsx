"use client"

import RegisterTable from "./components/register-table"
import { UserPlus, Plus, ShoppingCart } from "lucide-react"
import Link from "next/link"

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
          <div className="d-flex gap-2">
            <button className="btn-add">
              <Plus className="me-2" size={16} />
              Add Client
            </button>
            <Link href="/sales">
              <button className="btn-add">
                <ShoppingCart className="me-2" size={16} />
                New Sale
              </button>
            </Link>
          </div>
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
