"use client"

import { useEffect, useState } from "react"
import { Search, Download, Eye, Printer, ShoppingBasket } from "lucide-react"
import { supabase, type Purchase, type RegisteredEntity } from "@/lib/supabase-client"
import { toast } from "sonner"
import PurchaseModal from "@/components/ui/purchase-modal"

const PurchasesPage = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [supplierFilter, setSupplierFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [suppliers, setSuppliers] = useState<RegisteredEntity[]>([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchPurchases()
    fetchSuppliers()
  }, [])

  const fetchPurchases = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("purchases")
        .select(`
          *,
          supplier:registered_entities(*),
          purchase_items(*)
        `)
        .order("date_created", { ascending: false })

      if (error) {
        console.error("Error fetching purchases:", error)
        toast.error("Failed to fetch purchases")
      } else {
        setPurchases(data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('registered_entities')
        .select('*')
        .eq('entity_type', 'supplier')
        .order('name')

      if (error) {
        console.error('Error fetching suppliers:', error)
        return
      }

      setSuppliers(data || [])
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch = 
      purchase.purchase_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSupplier = supplierFilter === "all" || purchase.supplier_id?.toString() === supplierFilter

    const matchesDate = (() => {
      if (dateFilter === "all") return true
      
      const purchaseDate = new Date(purchase.date_created)
      const now = new Date()
      
      switch (dateFilter) {
        case "today":
          return purchaseDate.toDateString() === now.toDateString()
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return purchaseDate >= weekAgo
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          return purchaseDate >= monthAgo
        case "year":
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          return purchaseDate >= yearAgo
        default:
          return true
      }
    })()

    return matchesSearch && matchesSupplier && matchesDate
  })

  const exportToCSV = () => {
    const csvData = filteredPurchases.map(purchase => ({
      Order_Number: purchase.purchase_number,
      Date: new Date(purchase.date_created).toLocaleDateString(),
      Supplier: purchase.supplier?.name || "N/A",
      Items: purchase.purchase_items?.length || 0,
      Total_Amount: purchase.total_amount
    }))

    const csvString = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map(row => Object.values(row).join(","))
    ].join("\n")

    const blob = new Blob([csvString], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "purchases.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handlePrint = (purchase: Purchase) => {
    // Create a print window with purchase details
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Purchase Order - ${purchase.purchase_number}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .details { margin-bottom: 20px; }
              .items { width: 100%; border-collapse: collapse; }
              .items th, .items td { border: 1px solid #ddd; padding: 8px; }
              .items th { background-color: #f2f2f2; }
              .total { text-align: right; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Purchase Order</h1>
              <p>Order Number: ${purchase.purchase_number}</p>
            </div>
            <div class="details">
              <p><strong>Date:</strong> ${new Date(purchase.date_created).toLocaleDateString()}</p>
              <p><strong>Supplier:</strong> ${purchase.supplier?.name || 'N/A'}</p>
            </div>
            <table class="items">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Unit</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                                 ${purchase.purchase_items?.map(item => `
                   <tr>
                     <td>${item.description}</td>
                     <td>pcs</td>
                     <td>${item.quantity}</td>
                     <td>KES ${item.unit_price.toFixed(2)}</td>
                     <td>KES ${item.total_price.toFixed(2)}</td>
                   </tr>
                 `).join('') || ''}
              </tbody>
            </table>
            <div class="total">
              <p><strong>Total: KES ${purchase.total_amount.toFixed(2)}</strong></p>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleDownload = (purchase: Purchase) => {
    // Create a download of purchase details as JSON
    const purchaseData = {
      orderNumber: purchase.purchase_number,
      date: purchase.date_created,
      supplier: purchase.supplier?.name,
      items: purchase.purchase_items,
      total: purchase.total_amount
    }

    const dataStr = JSON.stringify(purchaseData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `purchase_${purchase.purchase_number}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleView = (purchase: Purchase) => {
    // Create a view modal or navigate to details page
    alert(`Viewing purchase: ${purchase.purchase_number}\nSupplier: ${purchase.supplier?.name}\nTotal: KES ${purchase.total_amount.toFixed(2)}`)
  }

  const handleModalSave = (purchaseData: any) => {
    // Refresh the purchases list after successful save
    fetchPurchases()
  }

  return (
    <div id="purchasesSection" className="card">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <h2 className="mb-0">Purchase Management</h2>
          <button 
            type="button" 
            className="btn btn-add"
            onClick={() => setShowModal(true)}
          >
            <ShoppingBasket className="me-2" size={16} />
            Add New Purchase
          </button>
        </div>
      </div>
      
      <div className="card-body">
        {/* Search and Filter Controls */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="input-group shadow-sm">
              <span className="input-group-text border-0 bg-white" style={{ borderRadius: "16px 0 0 16px", height: "45px" }}>
                <Search className="text-muted" size={16} />
              </span>
              <input
                type="text"
                className="form-control border-0"
                placeholder="Search purchases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ borderRadius: "0 16px 16px 0", height: "45px" }}
              />
            </div>
          </div>
          <div className="col-md-3">
            <select
              className="form-select border-0 shadow-sm"
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              style={{ borderRadius: "16px", height: "45px" }}
            >
              <option value="all">All Suppliers</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id.toString()}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <select
              className="form-select border-0 shadow-sm"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ borderRadius: "16px", height: "45px" }}
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <div className="col-md-3">
            <button 
              className="btn w-100 shadow-sm export-btn" 
              onClick={exportToCSV}
              style={{ borderRadius: "16px", height: "45px" }}
            >
              <Download size={16} className="me-1" />
              Export
            </button>
          </div>
        </div>

        {/* Purchases Table */}
        <div className="table-responsive">
          <table className="table" id="purchasesTable">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Date</th>
                <th>Supplier</th>
                <th>Items</th>
                <th>Total Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted">
                    No purchases found
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td>{purchase.purchase_number}</td>
                    <td>{new Date(purchase.date_created).toLocaleDateString()}</td>
                    <td>{purchase.supplier?.name || "N/A"}</td>
                    <td>{purchase.purchase_items?.length || 0} items</td>
                    <td>KES {purchase.total_amount.toFixed(2)}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <button 
                          className="action-btn" 
                          onClick={() => handleView(purchase)}
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="action-btn" 
                          onClick={() => handlePrint(purchase)}
                          title="Print"
                        >
                          <Printer size={16} />
                        </button>
                        <button 
                          className="action-btn" 
                          onClick={() => handleDownload(purchase)}
                          title="Download"
                        >
                          <Download size={16} />
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

      {/* Purchase Modal */}
      <PurchaseModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleModalSave}
      />
    </div>
  )
}

export default PurchasesPage
