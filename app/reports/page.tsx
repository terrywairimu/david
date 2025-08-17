"use client"

import React, { useState } from "react"
import "./reports.css"
import { BarChart3, TrendingUp, Users, Package, Wallet, Settings, FileText, Download, Eye } from "lucide-react"
import ReportBuilderModal from "./components/ReportBuilderModal"

type ReportType = 'sales' | 'expenses' | 'inventory' | 'clients' | 'financial' | 'custom'

interface ReportCard {
  type: ReportType
  title: string
  description: string
  icon: React.ReactNode
  buttonVariant: string
  iconBgColor: string
  iconColor: string
}

const reportCards: ReportCard[] = [
  {
    type: 'sales',
    title: 'Sales Reports',
    description: 'Generate comprehensive sales reports by time period, client, or product category.',
    icon: <BarChart3 size={24} />,
    buttonVariant: 'btn-primary',
    iconBgColor: 'rgba(99, 102, 241, 0.1)',
    iconColor: '#6366f1'
  },
  {
    type: 'expenses',
    title: 'Expense Reports',
    description: 'Track and analyze expenses by category, department, or date range.',
    icon: <TrendingUp size={24} />,
    buttonVariant: 'btn-danger',
    iconBgColor: 'rgba(239, 68, 68, 0.1)',
    iconColor: '#ef4444'
  },
  {
    type: 'inventory',
    title: 'Inventory Reports',
    description: 'Track inventory levels, movement, and valuation by category or item.',
    icon: <Package size={24} />,
    buttonVariant: 'btn-success',
    iconBgColor: 'rgba(16, 185, 129, 0.1)',
    iconColor: '#10b981'
  },
  {
    type: 'clients',
    title: 'Client Reports',
    description: 'Analyze client activity, sales history, and outstanding balances.',
    icon: <Users size={24} />,
    buttonVariant: 'btn-info',
    iconBgColor: 'rgba(59, 130, 246, 0.1)',
    iconColor: '#3b82f6'
  },
  {
    type: 'financial',
    title: 'Financial Summary',
    description: 'Get full financial summaries including profit & loss statements and balance sheets.',
    icon: <Wallet size={24} />,
    buttonVariant: 'btn-warning',
    iconBgColor: 'rgba(245, 158, 11, 0.1)',
    iconColor: '#f59e0b'
  },
  {
    type: 'custom',
    title: 'Custom Reports',
    description: 'Create custom reports with your specific requirements and filters.',
    icon: <Settings size={24} />,
    buttonVariant: 'btn-secondary',
    iconBgColor: 'rgba(236, 72, 153, 0.1)',
    iconColor: '#ec4899'
  }
]

export default function ReportsPage() {
  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openReportModal = (type: ReportType) => {
    setSelectedReportType(type)
    setIsModalOpen(true)
  }

  const closeReportModal = () => {
    setIsModalOpen(false)
    setSelectedReportType(null)
  }

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex align-items-center gap-3 mb-3">
            <div style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              borderRadius: '16px',
              width: '60px',
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <FileText size={28} />
            </div>
            <div>
              <h1 className="h2 mb-1 fw-bold text-dark">Reports & Analytics</h1>
              <p className="text-muted mb-0">Generate comprehensive reports and insights for your business</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="row g-4">
        {reportCards.map((card) => (
          <div key={card.type} className="col-lg-4 col-md-6">
            <div className="card shadow-sm h-100" style={{
              borderRadius: '16px',
              border: 'none',
              transition: 'all 0.3s ease',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)'
            }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="card-title fw-bold text-dark mb-0">{card.title}</h5>
                  <div className="icon-box" style={{
                    background: card.iconBgColor,
                    borderRadius: '12px',
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{ color: card.iconColor }}>
                      {card.icon}
                    </div>
                  </div>
                </div>
                <p className="card-text text-muted mb-4" style={{ lineHeight: '1.6' }}>
                  {card.description}
                </p>
                <div className="d-grid">
                  <button 
                    className={`btn ${card.buttonVariant} border-0 shadow-sm`}
                    onClick={() => openReportModal(card.type)}
                    style={{
                      borderRadius: '12px',
                      height: '45px',
                      fontWeight: '600',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    Generate Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Section */}
      <div className="row mt-5">
        <div className="col-12">
          <div className="card shadow-sm" style={{
            borderRadius: '16px',
            border: 'none',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)'
          }}>
            <div className="card-body p-4">
              <h4 className="fw-bold text-dark mb-3">Quick Actions</h4>
              <div className="row g-3">
                <div className="col-md-3">
                  <button className="btn btn-outline-primary w-100 border-0 shadow-sm" style={{
                    borderRadius: '12px',
                    height: '45px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#6366f1',
                    fontWeight: '600'
                  }}>
                    <Download size={16} className="me-2" />
                    Export All
                  </button>
                </div>
                <div className="col-md-3">
                  <button className="btn btn-outline-success w-100 border-0 shadow-sm" style={{
                    borderRadius: '12px',
                    height: '45px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    fontWeight: '600'
                  }}>
                    <Eye size={16} className="me-2" />
                    View History
                  </button>
                </div>
                <div className="col-md-3">
                  <button className="btn btn-outline-warning w-100 border-0 shadow-sm" style={{
                    borderRadius: '12px',
                    height: '45px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    color: '#f59e0b',
                    fontWeight: '600'
                  }}>
                    <BarChart3 size={16} className="me-2" />
                    Analytics
                  </button>
                </div>
                <div className="col-md-3">
                  <button className="btn btn-outline-info w-100 border-0 shadow-sm" style={{
                    borderRadius: '12px',
                    height: '45px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: '#3b82f6',
                    fontWeight: '600'
                  }}>
                    <Settings size={16} className="me-2" />
                    Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Builder Modal */}
      {selectedReportType && (
        <ReportBuilderModal
          isOpen={isModalOpen}
          onClose={closeReportModal}
          type={selectedReportType}
        />
      )}
    </div>
  )
}
