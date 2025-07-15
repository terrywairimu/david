"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, ShoppingCart, DollarSign, Package, TrendingUp, AlertTriangle, Plus, Eye, UserPlus } from "lucide-react"
import Link from "next/link"
import type React from "react"
import { useEffect, useState } from "react"
import { Search, Download, Edit, Trash2 } from "lucide-react"
import { supabase, type RegisteredEntity } from "@/lib/supabase-client"
import { toast } from "sonner"

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

  const [entities, setEntities] = useState<RegisteredEntity[]>([])
  const [filteredEntities, setFilteredEntities] = useState<RegisteredEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [showClientForm, setShowClientForm] = useState(false)
  const [showSupplierForm, setShowSupplierForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "client" | "supplier">("all")
  const [locationFilter, setLocationFilter] = useState("all")

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "client" as "client" | "supplier",
    phone: "",
    pin: "",
    location: "",
  })

  useEffect(() => {
    fetchEntities()
  }, [])

  useEffect(() => {
    filterEntities()
  }, [entities, searchTerm, typeFilter, locationFilter])

  const fetchEntities = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("registered_entities")
        .select("*")
        .eq("status", "active")
        .order("date_added", { ascending: false })

      if (error) {
        console.error("Error fetching entities:", error)
        toast.error("Failed to fetch entities")
      } else {
        setEntities(data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const filterEntities = () => {
    let filtered = entities

    if (searchTerm) {
      filtered = filtered.filter(
        (entity) =>
          entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entity.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entity.location?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((entity) => entity.type === typeFilter)
    }

    if (locationFilter !== "all") {
      filtered = filtered.filter((entity) => entity.location === locationFilter)
    }

    setFilteredEntities(filtered)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { data, error } = await supabase.from("registered_entities").insert([{
        ...formData,
        status: "active"
      }])

      if (error) {
        console.error("Error inserting entity:", error)
        toast.error("Failed to add entity")
      } else {
        toast.success(`${formData.type === "client" ? "Client" : "Supplier"} added successfully`)
        setFormData({
          name: "",
          type: "client",
          phone: "",
          pin: "",
          location: "",
        })
        setShowClientForm(false)
        setShowSupplierForm(false)
        fetchEntities()
      }
    } catch (error) {
      console.error("Unexpected error:", error)
      toast.error("An unexpected error occurred")
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this entity?")) {
      try {
        const { error } = await supabase.from("registered_entities").delete().eq("id", id)

        if (error) {
          console.error("Error deleting entity:", error)
          toast.error("Failed to delete entity")
        } else {
          toast.success("Entity deleted successfully")
          fetchEntities()
        }
      } catch (error) {
        console.error("Unexpected error:", error)
        toast.error("An unexpected error occurred")
      }
    }
  }

  const exportToCSV = () => {
    const csvContent = [
      ["Name", "Type", "Phone", "Location", "PIN", "Date Added"],
      ...filteredEntities.map((entity) => [
        entity.name,
        entity.type,
        entity.phone || "",
        entity.location || "",
        entity.pin || "",
        new Date(entity.date_added).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "registered_entities.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const uniqueLocations = [...new Set(entities.map((entity) => entity.location).filter(Boolean))]

  const handleAddClient = () => {
    setFormData({ ...formData, type: "client" })
    setShowClientForm(true)
    setShowSupplierForm(false)
  }

  const handleAddSupplier = () => {
    setFormData({ ...formData, type: "supplier" })
    setShowSupplierForm(true)
    setShowClientForm(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to your business management dashboard</p>
        </div>
        <div className="flex gap-3">
          <Link href="/register">
            <Button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </Link>
          <Link href="/sales">
            <Button variant="outline">
              <ShoppingCart className="w-4 h-4 mr-2" />
              New Sale
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">{stat.change}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Activities
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
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
                    <span className="text-sm font-medium">{activity.action}</span>
                  </div>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.map((item, index) => (
                <div key={index} className="p-3 bg-orange-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-xs text-orange-600">
                      {item.quantity}/{item.reorderLevel}
                    </span>
                  </div>
                  <div className="w-full bg-orange-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${(item.quantity / item.reorderLevel) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <Link href="/stock">
                <Button variant="outline" size="sm" className="w-full mt-3 bg-transparent">
                  Manage Stock
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Register Management Section */}
      <div id="registerSection">
        {/* Header Card */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="text-white">Register Management</h2>
          <div className="d-flex gap-3">
            <button className="btn-add" onClick={handleAddClient}>
              <UserPlus size={16} className="me-2" />
              Add New Client
            </button>
            <button className="btn-add" onClick={handleAddSupplier}>
              <Users size={16} className="me-2" />
              Add New Supplier
            </button>
            <button className="export-btn" onClick={exportToCSV}>
              <Download size={16} className="me-2" />
              Export
            </button>
          </div>
        </div>

        {/* Add Forms */}
        {(showClientForm || showSupplierForm) && (
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Add New {formData.type === "client" ? "Client" : "Supplier"}</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">PIN Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  />
                </div>
                <div className="col-12">
                  <button type="submit" className="btn btn-primary me-2">
                    Submit
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowClientForm(false)
                      setShowSupplierForm(false)
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="input-group">
              <span className="input-group-text">
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-4">
            <select
              className="form-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "all" | "client" | "supplier")}
            >
              <option value="all">All Types</option>
              <option value="client">Clients</option>
              <option value="supplier">Suppliers</option>
            </select>
          </div>
          <div className="col-md-4">
            <select className="form-select" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
              <option value="all">All Locations</option>
              {uniqueLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table" id="registerTable">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Phone Number</th>
                    <th>Location</th>
                    <th>PIN Number</th>
                    <th>Date Added</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredEntities.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center">
                        No entities found
                      </td>
                    </tr>
                  ) : (
                    filteredEntities.map((entity) => (
                      <tr key={entity.id}>
                        <td className="fw-bold">{entity.name}</td>
                        <td>
                          <span className={`badge ${entity.type === "client" ? "bg-primary" : "bg-success"}`}>
                            {entity.type}
                          </span>
                        </td>
                        <td>{entity.phone || "-"}</td>
                        <td>{entity.location || "-"}</td>
                        <td>{entity.pin || "-"}</td>
                        <td>{new Date(entity.date_added).toLocaleDateString()}</td>
                        <td>
                          <button className="action-btn me-1">
                            <Edit size={14} />
                          </button>
                          <button className="action-btn" onClick={() => handleDelete(entity.id)}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/register">
              <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                <Users className="w-6 h-6" />
                Add Client
              </Button>
            </Link>
            <Link href="/sales">
              <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                <ShoppingCart className="w-6 h-6" />
                New Sale
              </Button>
            </Link>
            <Link href="/stock">
              <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                <Package className="w-6 h-6" />
                Add Stock
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                <TrendingUp className="w-6 h-6" />
                View Reports
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default HomePage
