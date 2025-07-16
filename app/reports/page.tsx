"use client"

import { useState } from "react"
import { FileText, Download, Calendar, DollarSign, Users, Package } from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"

const ReportsPage = () => {
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const reportTypes = [
    {
      title: "Sales Report",
      description: "Comprehensive sales analysis and performance metrics",
      icon: DollarSign,
      color: "bg-success",
    },
    {
      title: "Client Report",
      description: "Client activity and transaction history",
      icon: Users,
      color: "bg-info",
    },
    {
      title: "Stock Report",
      description: "Inventory levels and stock movement analysis",
      icon: Package,
      color: "bg-warning",
    },
    {
      title: "Financial Report",
      description: "Revenue, expenses, and profit analysis",
      icon: FileText,
      color: "bg-primary",
    },
  ]

  return (
    <div id="reportsSection">
      {/* Header Card */}
      <div className="card mb-4">
        <SectionHeader 
          title="Reports" 
          icon={<FileText size={20} />}
        />
        <div className="card-body">
          {/* Date Range Filter */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0 d-flex align-items-center">
                <Calendar className="me-2" size={18} />
                Date Range Filter
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
                <div className="col-md-4 d-flex align-items-end">
                  <button className="btn btn-primary w-100">Apply Filter</button>
                </div>
              </div>
            </div>
          </div>

          {/* Report Types */}
          <div className="row">
            {reportTypes.map((report, index) => (
              <div key={index} className="col-md-6 mb-4">
                <div className="card h-100 shadow-sm">
                  <div className="card-header">
                    <h5 className="mb-0 d-flex align-items-center">
                      <div className={`p-2 rounded me-3 text-white ${report.color}`}>
                        <report.icon size={20} />
                      </div>
                      {report.title}
                    </h5>
                  </div>
                  <div className="card-body">
                    <p className="text-muted mb-4">{report.description}</p>
                    <div className="d-flex gap-2">
                      <button className="btn btn-outline-primary flex-fill">
                        <FileText size={16} className="me-1" />
                        Preview
                      </button>
                      <button className="btn btn-primary flex-fill">
                        <Download size={16} className="me-1" />
                        Export PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="row mt-4">
            <div className="col-md-3">
              <div className="card text-white bg-success">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="card-text small">Total Sales</p>
                      <h4 className="card-title">$12,345</h4>
                    </div>
                    <DollarSign size={32} />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-white bg-info">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="card-text small">Total Clients</p>
                      <h4 className="card-title">156</h4>
                    </div>
                    <Users size={32} />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-white bg-warning">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="card-text small">Stock Items</p>
                      <h4 className="card-title">89</h4>
                    </div>
                    <Package size={32} />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-white bg-primary">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="card-text small">Pending Orders</p>
                      <h4 className="card-title">23</h4>
                    </div>
                    <FileText size={32} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportsPage
