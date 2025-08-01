"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Plus, Search, Download, Eye, FileText, Printer } from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import PurchaseModal from "@/components/ui/purchase-modal"
import ClientPurchaseModal from "@/components/ui/client-purchase-modal"
import { RegisteredEntity } from "@/lib/types"

interface Purchase {
  id: number
  purchase_order_number: string
  purchase_date: string
  supplier_id: number
  client_id?: number
  paid_to?: string
  payment_method: string
  total_amount: number
  status: string
  supplier?: RegisteredEntity
  client?: RegisteredEntity
  items?: Array<{
    id: number
    stock_item_id: number
    quantity: number
    unit_price: number
    total_price: number
    stock_item?: {
      name: string
      description: string
      unit: string
    }
  }>
}

const PurchasesPage = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [supplierFilter, setSupplierFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [specificDate, setSpecificDate] = useState("")
  const [periodStartDate, setPeriodStartDate] = useState("")
  const [periodEndDate, setPeriodEndDate] = useState("")
  const [suppliers, setSuppliers] = useState<RegisteredEntity[]>([])
  const [clients, setClients] = useState<RegisteredEntity[]>([])
  const [showGeneralModal, setShowGeneralModal] = useState(false)
  const [showClientModal, setShowClientModal] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | undefined>()
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create")
  const [currentView, setCurrentView] = useState<"client" | "general">("client")

  useEffect(() => {
    fetchPurchases()
    fetchSuppliers()
    fetchClients()
    
    // Set up real-time subscription for purchases
    const subscription = supabase
      .channel('purchases_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases' }, (payload) => {
        console.log('Purchase change detected:', payload)
        fetchPurchases() // Refresh the table
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_items' }, (payload) => {
        console.log('Purchase items change detected:', payload)
        fetchPurchases() // Refresh the table
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchPurchases = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("purchases")
        .select(`
          *,
          supplier:registered_entities!purchases_supplier_id_fkey(id, name, phone, location),
          client:registered_entities!purchases_client_id_fkey(id, name, phone, location),
          items:purchase_items(
            *,
            stock_item:stock_items(name, description, unit)
          )
        `)
        .order("purchase_date", { ascending: false })

      if (error) throw error
      setPurchases(data || [])
    } catch (error) {
      console.error("Error fetching purchases:", error)
      toast.error("Failed to load purchases")
    } finally {
      setLoading(false)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from("registered_entities")
        .select("id, name, type, date_added, status")
        .eq("type", "supplier")
        .order("name")

      if (error) throw error
      setSuppliers(data || [])
    } catch (error) {
      console.error("Error fetching suppliers:", error)
    }
  }

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("registered_entities")
        .select("id, name, type, date_added, status")
        .eq("type", "client")
        .order("name")

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error("Error fetching clients:", error)
    }
  }

  const handleDateFilterChange = (value: string) => {
    setDateFilter(value)
    
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const todayFormatted = `${year}-${month}-${day}`
    
    if (value === "specific") {
      setSpecificDate(todayFormatted)
    } else if (value === "period") {
      setPeriodStartDate(todayFormatted)
      setPeriodEndDate(todayFormatted)
    } else {
      setSpecificDate("")
      setPeriodStartDate("")
      setPeriodEndDate("")
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const checkDateFilter = (purchaseDate: string, filterType: string, specificDate?: string, periodStart?: string, periodEnd?: string) => {
    const purchaseDateObj = new Date(purchaseDate)
    const today = new Date()
    
    // Reset time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0)
    purchaseDateObj.setHours(0, 0, 0, 0)
    
    switch (filterType) {
      case "today":
        return purchaseDateObj.getTime() === today.getTime()
      case "week":
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        return purchaseDateObj >= weekStart
      case "month":
        return purchaseDateObj.getMonth() === today.getMonth() && 
               purchaseDateObj.getFullYear() === today.getFullYear()
      case "year":
        return purchaseDateObj.getFullYear() === today.getFullYear()
      case "specific":
        if (specificDate) {
          const specDate = new Date(specificDate)
          specDate.setHours(0, 0, 0, 0)
          return purchaseDateObj.getTime() === specDate.getTime()
        }
        return true
      case "period":
        if (periodStart && periodEnd) {
          const startDate = new Date(periodStart)
          const endDate = new Date(periodEnd)
          startDate.setHours(0, 0, 0, 0)
          endDate.setHours(23, 59, 59, 999)
          return purchaseDateObj >= startDate && purchaseDateObj <= endDate
        }
        return true
      default:
        return true
    }
  }

  const getFilteredPurchases = () => {
    let filtered = [...purchases]

    // Filter by view type
    if (currentView === "client") {
      filtered = filtered.filter(purchase => purchase.client_id != null)
    } else {
      filtered = filtered.filter(purchase => purchase.client_id == null)
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(purchase =>
        purchase.purchase_order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.items?.some(item => item.stock_item?.description?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Supplier filter
    if (supplierFilter) {
      filtered = filtered.filter(purchase => purchase.supplier_id.toString() === supplierFilter)
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(purchase => {
        if (dateFilter === "specific" && specificDate) {
          return checkDateFilter(purchase.purchase_date, "specific", specificDate)
        } else if (dateFilter === "period" && periodStartDate && periodEndDate) {
          return checkDateFilter(purchase.purchase_date, "period", undefined, periodStartDate, periodEndDate)
        } else {
          return checkDateFilter(purchase.purchase_date, dateFilter)
        }
      })
    }

    return filtered
  }

  const filteredPurchases = getFilteredPurchases()

  const handleGeneralModalSave = async (purchaseData: any) => {
    try {
      if (modalMode === "create") {
        // Create new general purchase
        const { data: newPurchase, error: purchaseError } = await supabase
          .from("purchases")
          .insert({
            purchase_order_number: purchaseData.purchase_order_number,
            purchase_date: purchaseData.purchase_date,
            supplier_id: purchaseData.supplier_id,
            payment_method: purchaseData.payment_method,
            total_amount: purchaseData.total_amount,
            status: purchaseData.status
          })
          .select()
          .single()

        if (purchaseError) throw purchaseError

        // Insert purchase items
        if (purchaseData.items && purchaseData.items.length > 0) {
          const purchaseItems = purchaseData.items.map((item: any) => ({
            purchase_id: newPurchase.id,
            stock_item_id: item.stock_item_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          }))

          const { error: itemsError } = await supabase
            .from("purchase_items")
            .insert(purchaseItems)

          if (itemsError) throw itemsError

          // Update stock levels
          for (const item of purchaseData.items) {
            if (item.stock_item_id) {
              try {
                console.log(`Updating stock for item ID: ${item.stock_item_id}, adding quantity: ${item.quantity}`);
                
                // Get current stock level
                const { data: stockItem, error: fetchError } = await supabase
                  .from("stock_items")
                  .select("quantity, name")
                  .eq("id", item.stock_item_id)
                  .single()

                if (fetchError) {
                  console.error("Error fetching stock item:", fetchError);
                  throw fetchError;
                }

                console.log(`Current stock for ${stockItem.name}: ${stockItem.quantity}`);

                // Update stock quantity by adding purchased quantity
                const newQuantity = (stockItem.quantity || 0) + item.quantity

                console.log(`Updating to new quantity: ${newQuantity}`);

                const { error: updateError } = await supabase
                  .from("stock_items")
                  .update({ quantity: newQuantity })
                  .eq("id", item.stock_item_id)

                if (updateError) {
                  console.error("Error updating stock quantity:", updateError);
                  throw updateError;
                }

                // Record stock movement
                const { error: movementError } = await supabase
                  .from("stock_movements")
                  .insert({
                stock_item_id: item.stock_item_id,
                    movement_type: "in",
                    quantity: item.quantity,
                    reference_type: "purchase",
                    reference_id: newPurchase.id,
                    notes: `Purchase Order: ${purchaseData.purchase_order_number}`
              })

                if (movementError) {
                  console.error("Error creating stock movement:", movementError);
                  // Don't throw error for movement tracking, just log it
              }

                console.log(`Successfully updated stock for ${stockItem.name}: ${stockItem.quantity} + ${item.quantity} = ${newQuantity}`);
                toast.success(`Stock updated for ${item.description}: +${item.quantity}`);
              } catch (stockError) {
                console.error("Error updating stock for item:", item.stock_item_id, stockError);
                toast.error(`Failed to update stock for ${item.description}: ${stockError instanceof Error ? stockError.message : String(stockError)}`);
              }
            } else {
              console.log(`Skipping stock update for item without stock_item_id:`, item);
            }
          }
        }

        toast.success("General purchase created successfully")
      } else if (modalMode === "edit") {
        // Update existing purchase
        const { error: updateError } = await supabase
          .from("purchases")
          .update({
            purchase_date: purchaseData.purchase_date,
            supplier_id: purchaseData.supplier_id,
            payment_method: purchaseData.payment_method,
            total_amount: purchaseData.total_amount,
            status: purchaseData.status
          })
          .eq("id", selectedPurchase?.id)

        if (updateError) throw updateError

        // Delete existing items and insert new ones
        const { error: deleteError } = await supabase
          .from("purchase_items")
          .delete()
          .eq("purchase_id", selectedPurchase?.id)

        if (deleteError) throw deleteError

        // Insert updated items
        if (purchaseData.items && purchaseData.items.length > 0) {
          const purchaseItems = purchaseData.items.map((item: any) => ({
            purchase_id: selectedPurchase?.id,
            stock_item_id: item.stock_item_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          }))

          const { error: itemsError } = await supabase
            .from("purchase_items")
            .insert(purchaseItems)

          if (itemsError) throw itemsError
        }

        toast.success("General purchase updated successfully")
      }

      fetchPurchases()
      setShowGeneralModal(false)
    } catch (error) {
      console.error("Error saving general purchase:", error)
      toast.error("Failed to save general purchase")
    }
  }

  const handleClientModalSave = async (purchaseData: any) => {
    try {
      if (modalMode === "create") {
        // Create new client purchase
        const { data: newPurchase, error: purchaseError } = await supabase
          .from("purchases")
          .insert({
            purchase_order_number: purchaseData.purchase_order_number,
            purchase_date: purchaseData.purchase_date,
            supplier_id: purchaseData.supplier_id,
            client_id: purchaseData.client_id,
            paid_to: purchaseData.paid_to,
            payment_method: purchaseData.payment_method,
            total_amount: purchaseData.total_amount,
            status: purchaseData.status
          })
          .select()
          .single()

        if (purchaseError) throw purchaseError

        // Insert purchase items
        if (purchaseData.items && purchaseData.items.length > 0) {
          const purchaseItems = purchaseData.items.map((item: any) => ({
            purchase_id: newPurchase.id,
            stock_item_id: item.stock_item_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          }))

          const { error: itemsError } = await supabase
            .from("purchase_items")
            .insert(purchaseItems)

          if (itemsError) throw itemsError

          // Update stock levels
          for (const item of purchaseData.items) {
            if (item.stock_item_id) {
              try {
                console.log(`Updating stock for item ID: ${item.stock_item_id}, adding quantity: ${item.quantity}`);
                
                // Get current stock level
                const { data: stockItem, error: fetchError } = await supabase
                  .from("stock_items")
                  .select("quantity, name")
                  .eq("id", item.stock_item_id)
                  .single()

                if (fetchError) {
                  console.error("Error fetching stock item:", fetchError);
                  throw fetchError;
                }

                console.log(`Current stock for ${stockItem.name}: ${stockItem.quantity}`);

                // Update stock quantity by adding purchased quantity
                const newQuantity = (stockItem.quantity || 0) + item.quantity

                console.log(`Updating to new quantity: ${newQuantity}`);

                const { error: updateError } = await supabase
                  .from("stock_items")
                  .update({ quantity: newQuantity })
                  .eq("id", item.stock_item_id)

                if (updateError) {
                  console.error("Error updating stock quantity:", updateError);
                  throw updateError;
                }

                // Record stock movement
                const { error: movementError } = await supabase
                  .from("stock_movements")
                  .insert({
                stock_item_id: item.stock_item_id,
                    movement_type: "in",
                    quantity: item.quantity,
                    reference_type: "purchase",
                    reference_id: newPurchase.id,
                    notes: `Client Purchase Order: ${purchaseData.purchase_order_number}`
              })

                if (movementError) {
                  console.error("Error creating stock movement:", movementError);
                  // Don't throw error for movement tracking, just log it
              }

                console.log(`Successfully updated stock for ${stockItem.name}: ${stockItem.quantity} + ${item.quantity} = ${newQuantity}`);
                toast.success(`Stock updated for ${item.description}: +${item.quantity}`);
              } catch (stockError) {
                console.error("Error updating stock for item:", item.stock_item_id, stockError);
                toast.error(`Failed to update stock for ${item.description}: ${stockError instanceof Error ? stockError.message : String(stockError)}`);
              }
            } else {
              console.log(`Skipping stock update for item without stock_item_id:`, item);
            }
          }
        }

        toast.success("Client purchase created successfully")
      } else if (modalMode === "edit") {
        // Update existing purchase
        const { error: updateError } = await supabase
          .from("purchases")
          .update({
            purchase_date: purchaseData.purchase_date,
            supplier_id: purchaseData.supplier_id,
            client_id: purchaseData.client_id,
            paid_to: purchaseData.paid_to,
            payment_method: purchaseData.payment_method,
            total_amount: purchaseData.total_amount,
            status: purchaseData.status
          })
          .eq("id", selectedPurchase?.id)

        if (updateError) throw updateError

        // Delete existing items and insert new ones
        const { error: deleteError } = await supabase
          .from("purchase_items")
          .delete()
          .eq("purchase_id", selectedPurchase?.id)

        if (deleteError) throw deleteError

        // Insert updated items
        if (purchaseData.items && purchaseData.items.length > 0) {
          const purchaseItems = purchaseData.items.map((item: any) => ({
            purchase_id: selectedPurchase?.id,
            stock_item_id: item.stock_item_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          }))

          const { error: itemsError } = await supabase
            .from("purchase_items")
            .insert(purchaseItems)

          if (itemsError) throw itemsError
        }

        toast.success("Client purchase updated successfully")
      }

      fetchPurchases()
      setShowClientModal(false)
    } catch (error) {
      console.error("Error saving client purchase:", error)
      toast.error("Failed to save client purchase")
    }
  }

  const handleView = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
    setModalMode("view")
    if (purchase.client_id) {
      setShowClientModal(true)
    } else {
      setShowGeneralModal(true)
    }
  }

  const handleEdit = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
    setModalMode("edit")
    if (purchase.client_id) {
      setShowClientModal(true)
    } else {
      setShowGeneralModal(true)
    }
  }

  const handlePrint = (purchase: Purchase) => {
    const printContent = `
      <html>
        <head>
          <title>Purchase Order - ${purchase.purchase_order_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .info { margin-bottom: 20px; }
            .items { width: 100%; border-collapse: collapse; }
            .items th, .items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items th { background-color: #f2f2f2; }
            .total { text-align: right; margin-top: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Purchase Order</h1>
            <h2>${purchase.purchase_order_number}</h2>
          </div>
          <div class="info">
            <p><strong>Date:</strong> ${formatDate(purchase.purchase_date)}</p>
            <p><strong>Supplier:</strong> ${purchase.supplier?.name}</p>
            ${purchase.client ? `<p><strong>Client:</strong> ${purchase.client.name}</p>` : ''}
            ${purchase.paid_to ? `<p><strong>Paid To:</strong> ${purchase.paid_to}</p>` : ''}
            <p><strong>Payment Method:</strong> ${purchase.payment_method}</p>
          </div>
          <table class="items">
            <thead>
              <tr>
                <th>Description</th>
                <th>Unit</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${purchase.items?.map(item => `
                <tr>
                  <td>${item.stock_item?.description || 'N/A'}</td>
                  <td>${item.stock_item?.unit || 'N/A'}</td>
                  <td>${item.quantity}</td>
                  <td>KES ${item.unit_price.toFixed(2)}</td>
                  <td>KES ${item.total_price.toFixed(2)}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>
          <div class="total">
            <p>Total Amount: KES ${purchase.total_amount.toFixed(2)}</p>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleDownload = (purchase: Purchase) => {
    const csvContent = [
      ['Purchase Order', purchase.purchase_order_number],
      ['Date', formatDate(purchase.purchase_date)],
      ['Supplier', purchase.supplier?.name || ''],
      ['Client', purchase.client?.name || ''],
      ['Paid To', purchase.paid_to || ''],
      ['Payment Method', purchase.payment_method],
      [''],
      ['Item Description', 'Unit', 'Quantity', 'Unit Price', 'Total'],
      ...(purchase.items?.map(item => [
        item.stock_item?.description || 'N/A',
        item.stock_item?.unit || 'N/A',
        item.quantity.toString(),
        item.unit_price.toFixed(2),
        item.total_price.toFixed(2)
      ]) || []),
      [''],
      ['Total Amount', '', '', '', purchase.total_amount.toFixed(2)]
    ]

    const csvString = csvContent.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvString], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `purchase_${purchase.purchase_order_number}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportPurchases = () => {
    const csvContent = [
      ['Order Number', 'Date', 'Supplier', 'Client', 'Paid To', 'Payment Method', 'Total Amount', 'Status'],
      ...filteredPurchases.map(purchase => [
        purchase.purchase_order_number,
        formatDate(purchase.purchase_date),
        purchase.supplier?.name || '',
        purchase.client?.name || '',
        purchase.paid_to || '',
        purchase.payment_method,
        purchase.total_amount.toFixed(2),
        purchase.status
      ])
    ]

    const csvString = csvContent.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvString], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'purchases_export.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="card">
      <SectionHeader 
        title="Purchase Management" 
        icon={<ShoppingCart size={24} />}
      >
        <div className="d-flex gap-2">
          <button
            className={`btn-add ${currentView === "client" ? "active" : ""}`}
            onClick={() => setCurrentView("client")}
          >
            Client Purchase
          </button>
          <button
            className={`btn-add ${currentView === "general" ? "active" : ""}`}
            onClick={() => setCurrentView("general")}
          >
            General Purchase
          </button>
        </div>
      </SectionHeader>
      
      {/* Active View Content */}
      <div className="card-body p-0">
        {/* Add New Button */}
        <div className="d-flex mb-3">
          {currentView === "client" ? (
            <button
              className="btn-add"
              onClick={() => {
                setSelectedPurchase(undefined)
                setModalMode("create")
                setShowClientModal(true)
              }}
            >
              <Plus size={16} className="me-2" />
              Add New Client Purchase
            </button>
          ) : (
            <button
              className="btn-add"
              onClick={() => {
                setSelectedPurchase(undefined)
                setModalMode("create")
                setShowGeneralModal(true)
              }}
            >
              <Plus size={16} className="me-2" />
              Add New General Purchase
            </button>
          )}
        </div>

      {/* Search and Filter Controls */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="input-group shadow-sm">
            <span className="input-group-text border-0 bg-white" style={{ borderRadius: "16px 0 0 16px", height: "45px" }}>
              <Search size={16} className="text-muted" />
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
            <option value="">All Suppliers</option>
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <select
            className="form-select border-0 shadow-sm"
            value={dateFilter}
            onChange={(e) => handleDateFilterChange(e.target.value)}
            style={{ borderRadius: "16px", height: "45px" }}
          >
            <option value="">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="specific">Specific Date</option>
            <option value="period">Specific Period</option>
          </select>
          {dateFilter === "specific" && (
            <input
              type="date"
              className="form-control border-0 shadow-sm mt-2"
              value={specificDate}
              onChange={(e) => setSpecificDate(e.target.value)}
              style={{ borderRadius: "16px", height: "45px" }}
            />
          )}
          {dateFilter === "period" && (
            <div className="mt-2">
              <div className="d-flex align-items-center justify-content-between">
                <input
                  type="date"
                  className="form-control border-0 shadow-sm"
                  value={periodStartDate}
                  onChange={(e) => setPeriodStartDate(e.target.value)}
                  style={{ borderRadius: "16px", height: "45px", width: "calc(50% - 10px)" }}
                />
                <div className="mx-1 text-center" style={{ width: "20px" }}>
                  <div className="small text-muted mb-1">to</div>
                  <i className="fas fa-arrow-right"></i>
                </div>
                <input
                  type="date"
                  className="form-control border-0 shadow-sm"
                  value={periodEndDate}
                  onChange={(e) => setPeriodEndDate(e.target.value)}
                  style={{ borderRadius: "16px", height: "45px", width: "calc(50% - 10px)" }}
                />
              </div>
            </div>
          )}
        </div>
        <div className="col-md-2">
          <button
            className="btn w-100 shadow-sm export-btn"
            onClick={exportPurchases}
            style={{ borderRadius: "16px", height: "45px" }}
          >
            <Download size={16} className="me-2" />
            Export
          </button>
        </div>
      </div>

      {/* Purchases Table */}
      <table className="table" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "15%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "15%" }} />
            {currentView === "client" && (
              <>
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
              </>
            )}
            <col style={{ width: "18%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "8%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Date</th>
              <th>Supplier</th>
              {currentView === "client" && (
                <>
                  <th>Client</th>
                  <th>Paid To</th>
                </>
              )}
              <th>Items</th>
              <th>Total Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={currentView === "client" ? 8 : 6} className="text-center">Loading purchases...</td>
              </tr>
            ) : filteredPurchases.length === 0 ? (
              <tr>
                <td colSpan={currentView === "client" ? 8 : 6} className="text-center">No purchases found</td>
              </tr>
            ) : (
              filteredPurchases.map(purchase => (
                <tr key={purchase.id}>
                  <td>{purchase.purchase_order_number}</td>
                  <td>{formatDate(purchase.purchase_date)}</td>
                  <td>{purchase.supplier?.name || "-"}</td>
                  {currentView === "client" && (
                    <>
                      <td>{purchase.client?.name || "-"}</td>
                      <td>{purchase.paid_to || "-"}</td>
                    </>
                  )}
                  <td>
                    {purchase.items && purchase.items.length > 0 ? (
                      <div style={{ maxHeight: "60px", overflowY: "auto" }}>
                        {purchase.items.map((item, index) => (
                          <div key={index} className="small">
                            {(
                              item.stock_item?.description && item.stock_item.description.trim() !== ''
                                ? item.stock_item.description
                                : (item.stock_item?.name && item.stock_item.name.trim() !== ''
                                    ? item.stock_item.name
                                    : 'N/A')
                            )} ({item.quantity} {item.stock_item?.unit || 'N/A'})
                          </div>
                        ))}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>KES {purchase.total_amount.toFixed(2)}</td>
                  <td>
                    <div className="btn-group" role="group">
                      <button
                        className="btn btn-sm action-btn"
                        onClick={() => handleView(purchase)}
                        title="View"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="btn btn-sm action-btn"
                        onClick={() => handlePrint(purchase)}
                        title="Print"
                      >
                        <Printer size={14} />
                      </button>
                      <button
                        className="btn btn-sm action-btn"
                        onClick={() => handleDownload(purchase)}
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

      {/* General Purchase Modal */}
      <PurchaseModal
        isOpen={showGeneralModal}
        onClose={() => setShowGeneralModal(false)}
        onSave={handleGeneralModalSave}
        purchase={selectedPurchase}
        mode={modalMode}
      />

      {/* Client Purchase Modal */}
      <ClientPurchaseModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        onSave={handleClientModalSave}
        purchase={selectedPurchase}
        mode={modalMode}
      />
      </div>
    </div>
  )
}

export default PurchasesPage
