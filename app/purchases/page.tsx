"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { ShoppingCart, Plus, Search, Download, Eye, FileText, Printer, Edit } from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"
import { ActionGuard } from "@/components/ActionGuard"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import PurchaseModal from "@/components/ui/purchase-modal"
import ClientPurchaseModal from "@/components/ui/client-purchase-modal"
import { RegisteredEntity } from "@/lib/types"
import SearchFilterRow from "@/components/ui/search-filter-row"
import { exportPurchasesReport, generateSupplierPaymentNumber, adjustStockForPurchaseEdit } from "@/lib/workflow-utils"
import { generateReportPDF, ReportData, ReportColumn } from "@/lib/dynamic-report-pdf"

interface Purchase {
  id: number
  purchase_order_number: string
  purchase_date: string
  supplier_id: number
  client_id?: number
  paid_to?: string
  payment_method: string
  payment_status?: string
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
  const searchParams = useSearchParams()
  const { canPerformAction } = useAuth()
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
  
  // URL parameters
  const paymentType = searchParams.get('type') || 'all'
  const viewType = searchParams.get('view') || 'general'

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

  // Handle URL parameters
  useEffect(() => {
    if (viewType === 'client') {
      setCurrentView('client')
    } else {
      setCurrentView('general')
    }
    // Refetch purchases when URL parameters change
    fetchPurchases()
  }, [viewType, paymentType])

  const fetchPurchases = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (paymentType !== "all") params.set("type", paymentType)
      if (viewType !== "general") params.set("view", viewType)
      const qs = params.toString()
      const res = await fetch(`/api/purchases${qs ? `?${qs}` : ""}`, { credentials: "include" })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setPurchases(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching purchases:", error)
      toast.error("Failed to load purchases")
    } finally {
      setLoading(false)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/purchases/suppliers", { credentials: "include" })
      if (!res.ok) return
      const data = await res.json()
      setSuppliers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching suppliers:", error)
    }
  }

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/purchases/clients", { credentials: "include" })
      if (!res.ok) return
      const data = await res.json()
      setClients(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching clients:", error)
    }
  }

  const createSupplierPaymentFromPurchase = async (purchase: any, purchaseData: any) => {
    try {
      console.log("Starting supplier payment creation for purchase:", purchase)
      
      // Check if supplier payment already exists for this purchase
      const { data: existingPayment } = await supabase
        .from("supplier_payments")
        .select("id")
        .eq("paid_to", purchase.purchase_order_number)
        .eq("supplier_id", purchaseData.supplier_id)
        .single()
      
      if (existingPayment) {
        console.log("Supplier payment already exists for this purchase, skipping creation")
        toast.info("Supplier payment already exists for this purchase")
        return
      }
      
      // Generate payment number using the proper generator
      const paymentNumber = await generateSupplierPaymentNumber()
      
      const paymentData = {
        payment_number: paymentNumber,
        supplier_id: purchaseData.supplier_id,
        date_created: new Date().toISOString(),
        description: `Payment for purchase ${purchase.purchase_order_number}`,
        amount: purchaseData.amount_paid || purchaseData.total_amount,
        paid_to: purchase.purchase_order_number,
        account_debited: purchaseData.payment_method || "cash",
        status: purchaseData.payment_status === "fully_paid" ? "completed" : "pending",
        balance: purchaseData.balance || 0,
        payment_method: purchaseData.payment_method || "cash"
      }

      console.log("Creating supplier payment with data:", paymentData)

      const { error } = await supabase
        .from("supplier_payments")
        .insert([paymentData])

      if (error) {
        console.error("Error creating supplier payment:", error)
        toast.error(`Failed to create supplier payment: ${error.message}`)
      } else {
        toast.success(`Supplier payment ${paymentNumber} created automatically (${purchaseData.payment_status === "fully_paid" ? "completed" : "pending"})`)
      }
    } catch (error) {
      console.error("Error creating supplier payment:", error)
      toast.error(`Failed to create supplier payment: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
            payment_status: purchaseData.payment_status,
            amount_paid: purchaseData.amount_paid,
            balance: purchaseData.balance,
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
        
        // If purchase is fully paid or partially paid, create supplier payment
        if ((purchaseData.payment_status === "fully_paid" || purchaseData.payment_status === "partially_paid") && purchaseData.supplier_id) {
          await createSupplierPaymentFromPurchase(newPurchase, purchaseData)
        }
      } else if (modalMode === "edit") {
        // Get original items for stock adjustment
        const originalItems = selectedPurchase?.items || [];
        
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

        // Adjust stock quantities: reverse original + add new
        if (selectedPurchase?.id && selectedPurchase?.purchase_order_number) {
          try {
            await adjustStockForPurchaseEdit(
              originalItems,
              purchaseData.items || [],
              selectedPurchase.id,
              selectedPurchase.purchase_order_number
            );
          } catch (stockError) {
            console.error("Error adjusting stock for purchase edit:", stockError);
            // Don't throw error - purchase update should succeed even if stock adjustment fails
          }
        }

        toast.success("General purchase updated successfully")
        
        // If purchase is fully paid or partially paid, create supplier payment
        if ((purchaseData.payment_status === "fully_paid" || purchaseData.payment_status === "partially_paid") && purchaseData.supplier_id) {
          await createSupplierPaymentFromPurchase(selectedPurchase, purchaseData)
        }
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
            payment_status: purchaseData.payment_status,
            amount_paid: purchaseData.amount_paid,
            balance: purchaseData.balance,
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
        
        // If purchase is fully paid or partially paid, create supplier payment
        if ((purchaseData.payment_status === "fully_paid" || purchaseData.payment_status === "partially_paid") && purchaseData.supplier_id) {
          await createSupplierPaymentFromPurchase(newPurchase, purchaseData)
        }
      } else if (modalMode === "edit") {
        // Get original items for stock adjustment
        const originalItems = selectedPurchase?.items || [];
        
        // Update existing purchase
        const { error: updateError } = await supabase
          .from("purchases")
          .update({
            purchase_date: purchaseData.purchase_date,
            supplier_id: purchaseData.supplier_id,
            client_id: purchaseData.client_id,
            paid_to: purchaseData.paid_to,
            payment_method: purchaseData.payment_method,
            payment_status: purchaseData.payment_status,
            amount_paid: purchaseData.amount_paid,
            balance: purchaseData.balance,
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

        // Adjust stock quantities: reverse original + add new
        if (selectedPurchase?.id && selectedPurchase?.purchase_order_number) {
          try {
            await adjustStockForPurchaseEdit(
              originalItems,
              purchaseData.items || [],
              selectedPurchase.id,
              selectedPurchase.purchase_order_number
            );
          } catch (stockError) {
            console.error("Error adjusting stock for purchase edit:", stockError);
            // Don't throw error - purchase update should succeed even if stock adjustment fails
          }
        }

        toast.success("Client purchase updated successfully")
        
        // If purchase is fully paid or partially paid, create supplier payment
        if ((purchaseData.payment_status === "fully_paid" || purchaseData.payment_status === "partially_paid") && purchaseData.supplier_id) {
          await createSupplierPaymentFromPurchase(selectedPurchase, purchaseData)
        }
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

  const handleDownload = async (purchase: Purchase) => {
    try {
      const columns: ReportColumn[] = [
        { key: 'description', label: 'Description', width: 35, align: 'left' },
        { key: 'unit', label: 'Unit', width: 10, align: 'center' },
        { key: 'quantity', label: 'Qty', width: 10, align: 'right' },
        { key: 'unit_price', label: 'Unit Price', width: 20, align: 'right' },
        { key: 'total_price', label: 'Total', width: 25, align: 'right' }
      ]
      
      const rows = (purchase.items || []).map(item => ({
        description: item.stock_item?.description || item.stock_item?.name || 'N/A',
        unit: item.stock_item?.unit || 'N/A',
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }))
      
      const reportData: ReportData = {
        title: `PURCHASE ORDER - ${purchase.purchase_order_number}`,
        subtitle: purchase.client ? `Client: ${purchase.client.name}` : undefined,
        period: `Date: ${formatDate(purchase.purchase_date)} | Supplier: ${purchase.supplier?.name || 'N/A'}`,
        generatedDate: new Date().toLocaleString(),
        columns,
        rows,
        totals: { total_price: purchase.total_amount },
        summary: `Payment Method: ${purchase.payment_method} | Status: ${purchase.payment_status || 'N/A'}`
      }
      
      await generateReportPDF(reportData, 'portrait', `purchase_${purchase.purchase_order_number}`)
      toast.success('Purchase order downloaded as PDF')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to download PDF')
    }
  }

  // Export function
  const exportPurchases = (format: 'pdf' | 'csv') => {
    const filteredPurchases = getFilteredPurchases()
    exportPurchasesReport(filteredPurchases, format, currentView)
  }

  const exportPurchasesOld = () => {
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
        title={`Purchase Management${paymentType !== 'all' ? ` - ${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)}` : ''}`}
        icon={<ShoppingCart size={24} />}
      >
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
      </SectionHeader>
      
      {/* Active View Content */}
      <div className="card-body p-0">
        {/* Add New Button */}
        <div className="d-flex mb-3">
          <ActionGuard actionId="add">
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
          </ActionGuard>
        </div>

      {/* Search and Filter Controls */}
      <SearchFilterRow
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search purchases..."
        firstFilter={{
          value: supplierFilter,
          onChange: setSupplierFilter,
          options: [
            { value: "", label: "All Suppliers" },
            ...suppliers.map(supplier => ({ value: supplier.id.toString(), label: supplier.name }))
          ],
          placeholder: "All Suppliers"
        }}
        dateFilter={{
          value: dateFilter,
          onChange: handleDateFilterChange,
          onSpecificDateChange: setSpecificDate,
          onPeriodStartChange: setPeriodStartDate,
          onPeriodEndChange: setPeriodEndDate,
          specificDate,
          periodStartDate,
          periodEndDate
        }}
        onExport={canPerformAction("export") ? exportPurchases : undefined}
        exportLabel="Export Purchases"
      />

      {/* Purchases Table */}
      <div className="card table-section">
        <div className="responsive-table-wrapper">
          <table className="table table-hover">
            <thead>
              <tr>
                <th className="col-number">Order Number</th>
                <th className="col-date">Date</th>
                <th className="col-supplier">Supplier</th>
                {currentView === "client" && (
                  <>
                    <th className="col-client">Client</th>
                    <th className="col-client">Paid To</th>
                  </>
                )}
                <th className="col-items">Items</th>
                <th className="col-amount">Total Amount</th>
                <th className="col-actions">Actions</th>
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
                        <ActionGuard actionId="view">
                          <button
                            className="btn btn-sm action-btn"
                            onClick={() => handleView(purchase)}
                            title="View"
                          >
                            <Eye size={14} />
                          </button>
                        </ActionGuard>
                        <ActionGuard actionId="edit">
                          <button
                            className="btn btn-sm action-btn"
                            onClick={() => handleEdit(purchase)}
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                        </ActionGuard>
                        <ActionGuard actionId="view">
                          <button
                            className="btn btn-sm action-btn"
                            onClick={() => handlePrint(purchase)}
                            title="Print"
                          >
                            <Printer size={14} />
                          </button>
                        </ActionGuard>
                        <ActionGuard actionId="export">
                          <button
                            className="btn btn-sm action-btn"
                            onClick={() => handleDownload(purchase)}
                            title="Download"
                          >
                            <Download size={14} />
                          </button>
                        </ActionGuard>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
