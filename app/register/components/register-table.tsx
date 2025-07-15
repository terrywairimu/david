"use client"

import { useEffect, useState } from "react"
import { Plus, Edit, Trash2, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import SearchFilterRow from "@/components/ui/search-filter-row"

interface RegisteredEntity {
  id: number
  name: string
  type: "client" | "supplier"
  phone?: string
  email?: string
  address?: string
  city?: string
  country?: string
  status: "active" | "inactive"
  date_created: string
}

const RegisterTable = () => {
  const [entities, setEntities] = useState<RegisteredEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [locations, setLocations] = useState<{ value: string; label: string }[]>([])

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
        .select("city")
        .eq("status", "active")
        .not("city", "is", null)

      if (error) {
        console.error("Error fetching locations:", error)
      } else {
        const uniqueLocations = [...new Set(data.map(item => item.city).filter(Boolean))]
        const locationOptions = [
          { value: "", label: "All Locations" },
          ...uniqueLocations.map((location) => ({
            value: location,
            label: location,
          })),
        ]
        setLocations(locationOptions)
      }
    } catch (error) {
      console.error("Error fetching locations:", error)
    }
  }

  const filteredEntities = entities.filter((entity) => {
    const matchesSearch =
      entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entity.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entity.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === "" || entity.type === typeFilter

    const matchesLocation = locationFilter === "" || entity.city === locationFilter

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
      ["Name", "Type", "Phone", "Email", "Address", "City", "Country"],
      ...filteredEntities.map((entity) => [
        entity.name,
        entity.type,
        entity.phone || "",
        entity.email || "",
        entity.address || "",
        entity.city || "",
        entity.country || "",
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

  const typeOptions = [
    { value: "", label: "All Types" },
    { value: "client", label: "Clients" },
    { value: "supplier", label: "Suppliers" },
  ]

  return (
    <div className="card-body">
      {/* Add New Entity Button */}
      <div className="d-flex mb-4">
        <button className="btn btn-add">
          <Plus size={16} className="me-2" />
          Add New Entity
        </button>
      </div>

      {/* Search and Filter Controls */}
      <SearchFilterRow
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search..."
        firstFilter={{
          value: typeFilter,
          onChange: setTypeFilter,
          options: typeOptions,
        }}
        secondFilter={{
          value: locationFilter,
          onChange: setLocationFilter,
          options: locations,
        }}
        onExport={exportToCSV}
        exportLabel="Export"
      />

      {/* Register Table */}
      <div className="table-responsive">
        <table className="table" id="registerTable">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Address</th>
              <th>City</th>
              <th>Country</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center">
                  Loading...
                </td>
              </tr>
            ) : filteredEntities.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center">
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
                  <td>{entity.email || "-"}</td>
                  <td>{entity.address || "-"}</td>
                  <td>{entity.city || "-"}</td>
                  <td>{entity.country || "-"}</td>
                  <td>
                    <button className="action-btn me-1">
                      <Eye size={14} />
                    </button>
                    <button className="action-btn me-1">
                      <Edit size={14} />
                    </button>
                    <button className="action-btn">
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
  )
}

export default RegisterTable
