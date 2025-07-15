"use client"

import { useEffect, useState } from "react"
import { Edit, Trash2, Eye, Download, Search } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"

interface RegisteredEntity {
  id: number
  name: string
  type: "client" | "supplier"
  phone?: string
  pin?: string
  location?: string
  date_added: string
  status: "active" | "inactive"
}

const RegisterTable = () => {
  const [entities, setEntities] = useState<RegisteredEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [locations, setLocations] = useState<string[]>([])

  useEffect(() => {
    fetchEntities()
    fetchLocations()
  }, [])

  const fetchEntities = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("registered_entities")
        .select("*")
        .eq("status", "active")
        .order("name")

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

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from("registered_entities")
        .select("location")
        .eq("status", "active")
        .not("location", "is", null)

      if (error) {
        console.error("Error fetching locations:", error)
      } else {
        const uniqueLocations = [...new Set(data.map(item => item.location).filter(Boolean))]
        setLocations(uniqueLocations)
      }
    } catch (error) {
      console.error("Error fetching locations:", error)
    }
  }

  const filteredEntities = entities.filter((entity) => {
    const matchesSearch =
      entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entity.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entity.pin?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === "" || entity.type === typeFilter

    const matchesLocation = locationFilter === "" || entity.location === locationFilter

    return matchesSearch && matchesType && matchesLocation
  })

  const getTypeBadge = (type: string) => {
    const typeClasses = {
      client: "badge bg-primary",
      supplier: "badge bg-success",
    }
    return typeClasses[type as keyof typeof typeClasses] || "badge bg-secondary"
  }

  const exportToCSV = () => {
    const csvContent = [
      ["Name", "Type", "Phone Number", "Location", "PIN Number", "Date Added"],
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
    a.download = "register_data.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="card-body">
      {/* Search and Filter Controls */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="input-group shadow-sm">
            <span className="input-group-text border-0 bg-white" style={{ borderRadius: "16px 0 0 16px", height: "45px" }}>
              <Search className="text-muted" size={16} />
            </span>
            <input
              type="text"
              className="form-control border-0 py-2"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ borderRadius: "0 16px 16px 0", height: "45px" }}
            />
          </div>
        </div>
        <div className="col-md-3">
          <select
            className="form-select border-0 py-2 shadow-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ borderRadius: "16px", height: "45px" }}
          >
            <option value="">All Types</option>
            <option value="client">Clients</option>
            <option value="supplier">Suppliers</option>
          </select>
        </div>
        <div className="col-md-3">
          <select
            className="form-select border-0 py-2 shadow-sm"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            style={{ borderRadius: "16px", height: "45px" }}
          >
            <option value="">All Locations</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <button
            className="btn w-100 shadow-sm export-btn"
            onClick={exportToCSV}
            style={{ borderRadius: "16px", height: "45px", transition: "all 0.3s ease" }}
          >
            <Download className="me-2" size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Register Table */}
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
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
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
                    <span className={getTypeBadge(entity.type)}>
                      {entity.type}
                    </span>
                  </td>
                  <td>{entity.phone || "-"}</td>
                  <td>{entity.location || "-"}</td>
                  <td>{entity.pin || "-"}</td>
                  <td>{new Date(entity.date_added).toLocaleDateString()}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm btn-outline-primary" title="View">
                        <Eye size={14} />
                      </button>
                      <button className="btn btn-sm btn-outline-warning" title="Edit">
                        <Edit size={14} />
                      </button>
                      <button className="btn btn-sm btn-outline-danger" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RegisterTable
