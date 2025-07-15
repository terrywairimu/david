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
          <div className="d-flex gap-2">
            <Link href="/register">
              <button className="btn-add">
                <Plus className="me-2" size={16} />
                Add Client
              </button>
            </Link>
            <Link href="/sales">
              <button className="btn-add">
                <ShoppingCart className="me-2" size={16} />
                New Sale
              </button>
            </Link>
          </div>
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

        {/* Main Content Grid */}
        <div className="row">
          {/* Recent Activities */}
          <div className="col-md-8">
            <div className="card glass-card">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h3 className="mb-0">Recent Activities</h3>
                  <button className="btn btn-outline btn-sm">
                    <Eye className="me-1" size={16} />
                    View All
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="d-flex align-items-center justify-content-between p-3 bg-gray-50 rounded-lg">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            activity.type === "client"
                              ? "bg-blue-500"
                              : activity.type === "order"
                                ? "bg-green-500"
                                : activity.type === "payment"
                                  ? "bg-yellow-500"
                                  : "bg-purple-500"
                          }`}
                        />
                        <span className="text-sm fw-medium">{activity.action}</span>
                      </div>
                      <span className="text-xs text-muted">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="col-md-4">
            <div className="card glass-card">
              <div className="card-header">
                <h3 className="mb-0 d-flex align-items-center gap-2 text-warning">
                  <AlertTriangle size={20} />
                  Low Stock Alert
                </h3>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  {lowStockItems.map((item, index) => (
                    <div key={index} className="p-3 bg-orange-50 rounded-lg">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-sm fw-medium">{item.name}</span>
                        <span className="text-xs text-warning">
                          {item.quantity}/{item.reorderLevel}
                        </span>
                      </div>
                      <div className="w-100 bg-orange-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full"
                          style={{ width: `${(item.quantity / item.reorderLevel) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <Link href="/stock">
                    <button className="btn btn-outline w-100 mt-3">
                      Manage Stock
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card glass-card">
              <div className="card-header">
                <h3 className="mb-0">Quick Actions</h3>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-3">
                    <Link href="/register">
                      <button className="btn btn-outline h-20 w-100 d-flex flex-column align-items-center justify-content-center gap-2">
                        <Users size={24} />
                        Add Client
                      </button>
                    </Link>
                  </div>
                  <div className="col-md-3">
                    <Link href="/sales">
                      <button className="btn btn-outline h-20 w-100 d-flex flex-column align-items-center justify-content-center gap-2">
                        <ShoppingCart size={24} />
                        New Sale
                      </button>
                    </Link>
                  </div>
                  <div className="col-md-3">
                    <Link href="/stock">
                      <button className="btn btn-outline h-20 w-100 d-flex flex-column align-items-center justify-content-center gap-2">
                        <Package size={24} />
                        Add Stock
                      </button>
                    </Link>
                  </div>
                  <div className="col-md-3">
                    <Link href="/reports">
                      <button className="btn btn-outline h-20 w-100 d-flex flex-column align-items-center justify-content-center gap-2">
                        <TrendingUp size={24} />
                        View Reports
                      </button>
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
