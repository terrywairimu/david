"use client"

import { useState } from "react"
import { FileText, Download, Calendar, DollarSign, Users, Package, Wallet, Grid, BarChart2 } from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"
import ReportBuilderModal from "./components/ReportBuilderModal"
import ReportCard from "./components/ReportCard"

const ReportsPage = () => {
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const reportTypes = [
    { key: 'sales', title: "Sales Reports", description: "Track quotations, orders, invoices and payments", icon: DollarSign, color: "bg-gradient" },
    { key: 'expenses', title: "Expense Reports", description: "Analyze expenses by category and department", icon: Wallet, color: "bg-gradient" },
    { key: 'inventory', title: "Inventory Reports", description: "On-hand levels, reorder and valuation", icon: Package, color: "bg-gradient" },
    { key: 'clients', title: "Client Reports", description: "Client activity and balances", icon: Users, color: "bg-gradient" },
    { key: 'financial', title: "Financial Summary", description: "Sales, expenses and net", icon: Wallet, color: "bg-gradient" },
    { key: 'custom', title: "Custom Reports", description: "Create custom reports with filters", icon: BarChart2, color: "bg-gradient" },
  ] as const

  const [open, setOpen] = useState<null | typeof reportTypes[number]['key']>(null)

  return (
    <div id="reportsSection">
      {/* Header Card */}
      <div className="card mb-4">
        <SectionHeader 
          title="Reports" 
          icon={<FileText size={20} />}
        />
        <div className="card-body">
          {/* Date Range Filter - modern pill style */}
          <div className="card mb-4 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,.08), rgba(139,92,246,.08))' }}>
            <div className="card-body d-flex flex-wrap gap-2 align-items-center">
              <div className="d-flex align-items-center me-2 text-muted"><Calendar size={18} className="me-2"/>Date Range</div>
              <input type="date" className="form-control" style={{maxWidth:240}} value={dateFrom} onChange={(e)=>setDateFrom(e.target.value)} />
              <span className="mx-1 text-muted">to</span>
              <input type="date" className="form-control" style={{maxWidth:240}} value={dateTo} onChange={(e)=>setDateTo(e.target.value)} />
              <div className="ms-auto d-flex gap-2">
                <button className="btn btn-outline-secondary">Clear</button>
                <button className="btn btn-primary">Apply</button>
              </div>
            </div>
          </div>

          {/* Report Tiles */}
          <div className="row g-4">
            {reportTypes.map((report) => (
              <div key={report.key} className="col-md-6 col-xl-4">
                <ReportCard
                  title={report.title}
                  description={report.description}
                  accent={
                    report.key === 'sales' ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' :
                    report.key === 'expenses' ? 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)' :
                    report.key === 'inventory' ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' :
                    report.key === 'clients' ? 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' :
                    report.key === 'financial' ? 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' :
                    'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)'
                  }
                  icon={<report.icon size={18} />}
                  onClick={() => setOpen(report.key)}
                />
              </div>
            ))}
          </div>

          {/* Quick Stats - compact */}
          <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-3 mt-1">
            {[{label:'Total Sales', icon:DollarSign, color:'success'},{label:'Total Clients', icon:Users, color:'info'},{label:'Stock Items', icon:Package, color:'warning'},{label:'Pending Orders', icon:FileText, color:'primary'}].map((s, i)=> (
              <div key={i} className="col">
                <div className={`card text-white bg-${s.color} border-0`}>
                  <div className="card-body d-flex justify-content-between align-items-center">
                    <div>
                      <p className="card-text small">{s.label}</p>
                      <h4 className="card-title mb-0">—</h4>
                    </div>
                    <s.icon size={28} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    {/* Single dynamic modal matching original HTML behavior */}
    {open ? (
      <ReportBuilderModal isOpen={true} onClose={() => setOpen(null)} type={open as any} />
    ) : null}
    </div>
  )
}

export default ReportsPage
