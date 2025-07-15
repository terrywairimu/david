"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, ShoppingCart, DollarSign, Package, TrendingUp, AlertTriangle, Plus, Eye } from "lucide-react"
import Link from "next/link"
import type React from "react"

const HomePage = () => {
  // Mock data for dashboard
  const stats = [
    {
      title: "Total Clients",
      value: "156",
      change: "+12%",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Sales",
      value: "$45,231",
      change: "+8.2%",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Pending Orders",
      value: "23",
      change: "-2.4%",
      icon: ShoppingCart,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Stock Items",
      value: "89",
      change: "+5.1%",
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ]

  const recentActivities = [
    { action: "New client registered", time: "2 hours ago", type: "client" },
    { action: "Order #ORD-001 completed", time: "4 hours ago", type: "order" },
    { action: "Payment received from Client A", time: "6 hours ago", type: "payment" },
    { action: "Stock item added", time: "8 hours ago", type: "stock" },
  ]

  const lowStockItems = [
    { name: "Product A", quantity: 5, reorderLevel: 10 },
    { name: "Product B", quantity: 2, reorderLevel: 15 },
    { name: "Product C", quantity: 8, reorderLevel: 20 },
  ]

  return (
    <div className="card">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <h2 className="mb-0">Dashboard</h2>
        </div>
      </div>
      <div className="card-body">
        <p className="text-white mb-4">Welcome to your business management dashboard</p>
        
        {/* Stats Cards */}
        <div className="row mb-4">
          {stats.map((stat, index) => (
            <div key={index} className="col-md-3 mb-3">
              <div className="card glass-card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-sm text-muted mb-1">{stat.title}</p>
                      <h2 className="text-2xl fw-bold text-white">{stat.value}</h2>
                      <div className="d-flex align-items-center mt-1">
                        <TrendingUp className="me-1" size={16} />
                        <span className="text-sm text-success">{stat.change}</span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <stat.icon className={`${stat.color}`} size={24} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activities */}
        <div className="row mb-4">
          <div className="col-md-8">
            <div className="card glass-card">
              <div className="card-header">
                <h5 className="mb-0 text-white">Recent Activities</h5>
              </div>
              <div className="card-body">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="d-flex align-items-center mb-3">
                    <div className="me-3">
                      <div className="activity-icon">
                        {activity.type === "client" && <Users size={16} />}
                        {activity.type === "order" && <ShoppingCart size={16} />}
                        {activity.type === "payment" && <DollarSign size={16} />}
                        {activity.type === "stock" && <Package size={16} />}
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <p className="mb-0 text-white">{activity.action}</p>
                      <small className="text-muted">{activity.time}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card glass-card">
              <div className="card-header">
                <h5 className="mb-0 text-white">Low Stock Alert</h5>
              </div>
              <div className="card-body">
                {lowStockItems.map((item, index) => (
                  <div key={index} className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                      <p className="mb-0 text-white">{item.name}</p>
                      <small className="text-muted">Qty: {item.quantity}</small>
                    </div>
                    <div className="d-flex align-items-center">
                      <AlertTriangle className="text-warning me-1" size={16} />
                      <small className="text-warning">Reorder</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="row">
          <div className="col-12">
            <div className="card glass-card">
              <div className="card-header">
                <h5 className="mb-0 text-white">Quick Actions</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-3">
                    <Link href="/register" className="text-decoration-none">
                      <div className="quick-action-card">
                        <Users size={32} className="text-primary" />
                        <h6 className="mt-2 mb-0 text-white">Manage Clients</h6>
                      </div>
                    </Link>
                  </div>
                  <div className="col-md-3">
                    <Link href="/sales" className="text-decoration-none">
                      <div className="quick-action-card">
                        <ShoppingCart size={32} className="text-success" />
                        <h6 className="mt-2 mb-0 text-white">Create Sale</h6>
                      </div>
                    </Link>
                  </div>
                  <div className="col-md-3">
                    <Link href="/stock" className="text-decoration-none">
                      <div className="quick-action-card">
                        <Package size={32} className="text-info" />
                        <h6 className="mt-2 mb-0 text-white">Manage Stock</h6>
                      </div>
                    </Link>
                  </div>
                  <div className="col-md-3">
                    <Link href="/reports" className="text-decoration-none">
                      <div className="quick-action-card">
                        <TrendingUp size={32} className="text-warning" />
                        <h6 className="mt-2 mb-0 text-white">View Reports</h6>
                      </div>
                    </Link>
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

export default HomePage
