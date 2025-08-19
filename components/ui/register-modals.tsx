"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import { X } from "lucide-react"

interface RegisterModalsProps {
  showClientModal: boolean
  showSupplierModal: boolean
  showEditModal: boolean
  editEntity: any
  onCloseClientModal: () => void
  onCloseSupplierModal: () => void
  onCloseEditModal: () => void
  onRefreshData: () => void
}

export default function RegisterModals({
  showClientModal,
  showSupplierModal,
  showEditModal,
  editEntity,
  onCloseClientModal,
  onCloseSupplierModal,
  onCloseEditModal,
  onRefreshData
}: RegisterModalsProps) {
  const [clientForm, setClientForm] = useState({
    name: "",
    phone: "",
    pin: "",
    location: ""
  })

  const [supplierForm, setSupplierForm] = useState({
    name: "",
    phone: "",
    location: ""
  })

  const [editForm, setEditForm] = useState({
    id: "",
    type: "",
    name: "",
    phone: "",
    pin: "",
    location: ""
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editEntity) {
      setEditForm({
        id: editEntity.id,
        type: editEntity.type,
        name: editEntity.name,
        phone: editEntity.phone || "",
        pin: editEntity.pin || "",
        location: editEntity.location || ""
      })
    }
  }, [editEntity])

  const saveClient = async () => {
    if (!clientForm.name || !clientForm.phone || !clientForm.location) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from("registered_entities")
        .insert([{
          name: clientForm.name,
          type: "client",
          phone: clientForm.phone,
          pin: clientForm.pin || null,
          location: clientForm.location,
          status: "active",
          date_added: new Date().toISOString()
        }])

      if (error) throw error

      toast.success("Client added successfully!")
      setClientForm({ name: "", phone: "", pin: "", location: "" })
      onCloseClientModal()
      onRefreshData()
    } catch (error) {
      console.error("Error saving client:", error)
      toast.error("Error saving client")
    } finally {
      setLoading(false)
    }
  }

  const saveSupplier = async () => {
    if (!supplierForm.name || !supplierForm.phone || !supplierForm.location) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from("registered_entities")
        .insert([{
          name: supplierForm.name,
          type: "supplier",
          phone: supplierForm.phone,
          location: supplierForm.location,
          status: "active",
          date_added: new Date().toISOString()
        }])

      if (error) throw error

      toast.success("Supplier added successfully!")
      setSupplierForm({ name: "", phone: "", location: "" })
      onCloseSupplierModal()
      onRefreshData()
    } catch (error) {
      console.error("Error saving supplier:", error)
      toast.error("Error saving supplier")
    } finally {
      setLoading(false)
    }
  }

  const saveEdit = async () => {
    if (!editForm.name || !editForm.phone || !editForm.location) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from("registered_entities")
        .update({
          name: editForm.name,
          phone: editForm.phone,
          pin: editForm.type === "client" ? editForm.pin || null : null,
          location: editForm.location
        })
        .eq("id", editForm.id)

      if (error) throw error

      toast.success("Entity updated successfully!")
      onCloseEditModal()
      onRefreshData()
    } catch (error) {
      console.error("Error updating entity:", error)
      toast.error("Error updating entity")
    } finally {
      setLoading(false)
    }
  }

  if (!showClientModal && !showSupplierModal && !showEditModal) return null

  return (
    <>
      {/* New Client Modal */}
      {showClientModal && (
        <div className="modal fade show" style={{ display: "block", zIndex: 1055, backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content" style={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Add New Client</h5>
                <button type="button" className="btn-close" onClick={onCloseClientModal}></button>
              </div>
              <div className="modal-body pt-2">
                <form onSubmit={(e) => { e.preventDefault(); saveClient(); }}>
                  <div className="mb-3">
                    <label className="form-label">Client Name</label>
                    <input
                      type="text"
                      className="form-control border-0 shadow-sm"
                      value={clientForm.name}
                      onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control border-0 shadow-sm"
                      value={clientForm.phone}
                      onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">PIN Number</label>
                    <input
                      type="text"
                      className="form-control border-0 shadow-sm"
                      placeholder="Optional"
                      value={clientForm.pin}
                      onChange={(e) => setClientForm({ ...clientForm, pin: e.target.value })}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      className="form-control border-0 shadow-sm"
                      value={clientForm.location}
                      onChange={(e) => setClientForm({ ...clientForm, location: e.target.value })}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                      required
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer border-0">
                <button type="button" className="btn btn-secondary" onClick={onCloseClientModal} style={{ borderRadius: "12px", height: "45px" }}>
                  Close
                </button>
                <button type="button" className="btn btn-add" onClick={saveClient} disabled={loading} style={{ borderRadius: "12px", height: "45px" }}>
                  {loading ? "Saving..." : "Save Client"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Supplier Modal */}
      {showSupplierModal && (
        <div className="modal fade show" style={{ display: "block", zIndex: 1055, backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content" style={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Add New Supplier</h5>
                <button type="button" className="btn-close" onClick={onCloseSupplierModal}></button>
              </div>
              <div className="modal-body pt-2">
                <form onSubmit={(e) => { e.preventDefault(); saveSupplier(); }}>
                  <div className="mb-3">
                    <label className="form-label">Supplier Name</label>
                    <input
                      type="text"
                      className="form-control border-0 shadow-sm"
                      value={supplierForm.name}
                      onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control border-0 shadow-sm"
                      value={supplierForm.phone}
                      onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      className="form-control border-0 shadow-sm"
                      value={supplierForm.location}
                      onChange={(e) => setSupplierForm({ ...supplierForm, location: e.target.value })}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                      required
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer border-0">
                <button type="button" className="btn btn-secondary" onClick={onCloseSupplierModal} style={{ borderRadius: "12px", height: "45px" }}>
                  Close
                </button>
                <button type="button" className="btn btn-add" onClick={saveSupplier} disabled={loading} style={{ borderRadius: "12px", height: "45px" }}>
                  {loading ? "Saving..." : "Save Supplier"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal fade show" style={{ display: "block", zIndex: 1055, backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content" style={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Edit Details</h5>
                <button type="button" className="btn-close" onClick={onCloseEditModal}></button>
              </div>
              <div className="modal-body pt-2">
                <form onSubmit={(e) => { e.preventDefault(); saveEdit(); }}>
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-control border-0 shadow-sm"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control border-0 shadow-sm"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                      required
                    />
                  </div>
                  {editForm.type === "client" && (
                    <div className="mb-3">
                      <label className="form-label">PIN Number</label>
                      <input
                        type="text"
                        className="form-control border-0 shadow-sm"
                        placeholder="Optional"
                        value={editForm.pin}
                        onChange={(e) => setEditForm({ ...editForm, pin: e.target.value })}
                        style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                      />
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      className="form-control border-0 shadow-sm"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      style={{ borderRadius: "16px", height: "45px", color: "#000000" }}
                      required
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer border-0">
                <button type="button" className="btn btn-secondary" onClick={onCloseEditModal} style={{ borderRadius: "12px", height: "45px" }}>
                  Close
                </button>
                <button type="button" className="btn btn-add" onClick={saveEdit} disabled={loading} style={{ borderRadius: "12px", height: "45px" }}>
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 