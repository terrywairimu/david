"use client"

import { useEffect, useState } from "react"
import { Edit, Trash2, Download, Search } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import ConfirmDialog from "@/components/ui/confirm-dialog"

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

interface RegisterTableProps {
  onShowClientModal: () => void
  onShowSupplierModal: () => void
  onEditEntity: (entity: RegisteredEntity) => void
  refreshTrigger?: number
}

const RegisterTable = ({ onShowClientModal, onShowSupplierModal, onEditEntity, refreshTrigger }: RegisterTableProps) => {
  const [entities, setEntities] = useState<RegisteredEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [locations, setLocations] = useState<string[]>([])
  
  // Delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteEntityId, setDeleteEntityId] = useState<number | null>(null)

  useEffect(() => {
    fetchEntities()
    
    // Set up real-time subscription for registered entities
    const entitiesSubscription = supabase
      .channel('registered_entities_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registered_entities' }, (payload) => {
        console.log('Registered entities change detected:', payload)
        fetchEntities() // Refresh entities when changes occur
      })
      .subscribe()

    return () => {
      supabase.removeChannel(entitiesSubscription)
    }
  }, [refreshTrigger])

  const fetchEntities = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("registered_entities")
        .select("*")
        .eq("status", "active")
        .order("date_added", { ascending: false })

      if (error) throw error

      setEntities(data || [])
      
      // Extract unique locations
      const uniqueLocations = [...new Set(data?.map(entity => entity.location).filter(Boolean))] as string[]
      setLocations(uniqueLocations)
    } catch (error) {
      console.error("Error fetching entities:", error)
      toast.error("Error fetching entities")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (entity: RegisteredEntity) => {
    onEditEntity(entity)
  }

  const handleDelete = (id: number) => {
    setDeleteEntityId(id)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deleteEntityId) return

    try {
      const { error } = await supabase
        .from("registered_entities")
        .delete()
        .eq("id", deleteEntityId)

      if (error) throw error

      toast.success("Entity deleted successfully!")
      fetchEntities()
    } catch (error) {
      console.error("Error deleting entity:", error)
      toast.error("Error deleting entity")
    } finally {
      setShowDeleteDialog(false)
      setDeleteEntityId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const filteredEntities = entities.filter(entity => {
    const matchesSearch = entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entity.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entity.location?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !typeFilter || entity.type === typeFilter
    const matchesLocation = !locationFilter || entity.location === locationFilter
    
    return matchesSearch && matchesType && matchesLocation
  })

  const exportToCSV = () => {
    const csvContent = [
      ["Name", "Type", "Phone", "Location", "PIN Number", "Date Added"],
      ...filteredEntities.map(entity => [
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

  const getTypeStyle = (type: string) => {
    if (type === 'client') {
      return {
        backgroundColor: '#e3f2fd',
        color: '#1976d2',
        borderRadius: '50px',
        padding: '6px 16px',
        fontWeight: '500',
        fontSize: '0.875rem'
      }
    } else {
      return {
        backgroundColor: '#e8f5e9',
        color: '#2e7d32',
        borderRadius: '50px',
        padding: '6px 16px',
        fontWeight: '500',
        fontSize: '0.875rem'
      }
    }
  }

  return (
    <div>
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
      <div className="card table-section">
        <div className="w-full overflow-x-auto">
          <table className="table table-hover" id="registerTable">
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
                    <td>{entity.name}</td>
                    <td>
                      <span style={getTypeStyle(entity.type)}>
                        {entity.type.charAt(0).toUpperCase() + entity.type.slice(1)}
                      </span>
                    </td>
                    <td>{entity.phone || "-"}</td>
                    <td>{entity.location || "-"}</td>
                    <td>{entity.type === 'client' && entity.pin ? entity.pin : '-'}</td>
                    <td>{formatDate(entity.date_added)}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <button className="action-btn" onClick={() => handleEdit(entity)} title="Edit">
                          <Edit size={16} />
                        </button>
                        <button className="action-btn" onClick={() => handleDelete(entity.id)} title="Delete">
                          <Trash2 size={16} />
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        show={showDeleteDialog}
        title="Delete Entity"
        message="Are you sure you want to delete this entry?"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}

export default RegisterTable
