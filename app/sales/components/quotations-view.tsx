"use client"

import React, { useEffect, useState } from "react"
import { Plus, Edit, Trash2, Eye, Download, FileText, CreditCard, Receipt } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import QuotationModal from "@/components/ui/quotation-modal"
import { 
  proceedToSalesOrder, 
  proceedToCashSale, 
  printDocument, 
  downloadDocument,
  exportQuotations as exportQuotationsReport
} from "@/lib/workflow-utils"

interface Quotation {
  id: number
  quotation_number: string
  client_id: number
  date_created: string
  valid_until: string
  cabinet_total: number
  worktop_total: number
  accessories_total: number
  appliances_total: number
  wardrobes_total: number
  tvunit_total: number
  labour_percentage: number
  labour_total: number
  total_amount: number
  grand_total: number
  vat_amount?: number
  vat_percentage?: number
  include_worktop: boolean
  include_accessories: boolean
  include_appliances: boolean
  include_wardrobes: boolean
  include_tvunit: boolean
  status: "pending" | "accepted" | "rejected" | "expired" | "converted_to_sales_order" | "converted_to_cash_sale"
  notes?: string
  terms_conditions?: string
  client?: {
    id: number
    name: string
    phone?: string
    location?: string
  }
  items?: Array<{
    id: number
    category: "cabinet" | "worktop" | "accessories" | "appliances" | "wardrobes" | "tvunit"
    description: string
    unit: string
    quantity: number
    unit_price: number
    total_price: number
    stock_item_id?: number
  }>
}

const QuotationsView = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [clientFilter, setClientFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [specificDate, setSpecificDate] = useState("")
  const [periodStartDate, setPeriodStartDate] = useState("")
  const [periodEndDate, setPeriodEndDate] = useState("")
  const [clients, setClients] = useState<{ value: string; label: string }[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | undefined>()
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("create")

  useEffect(() => {
    fetchQuotations()
    fetchClients()
    
    // Set up real-time subscription for quotations
    const quotationsSubscription = supabase
      .channel('quotations_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotations' }, (payload) => {
        console.log('Quotations change detected:', payload)
        fetchQuotations() // Refresh quotations when changes occur
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotation_items' }, (payload) => {
        console.log('Quotation items change detected:', payload)
        fetchQuotations() // Refresh quotations when items change
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registered_entities' }, (payload) => {
        console.log('Registered entities change detected:', payload)
        fetchClients() // Refresh clients when changes occur
      })
      .subscribe()

    return () => {
      supabase.removeChannel(quotationsSubscription)
    }
  }, [])

  const fetchQuotations = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("quotations")
        .select(`
          *,
          client:registered_entities(id, name, phone, location),
          items:quotation_items(*)
        `)
        .order("date_created", { ascending: false })

      if (error) throw error
      setQuotations(data || [])
    } catch (error) {
      console.error("Error fetching quotations:", error)
      toast.error("Failed to load quotations")
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("registered_entities")
        .select("id, name")
        .eq("type", "client")
        .order("name")

      if (error) throw error
      
        const clientOptions = [
          { value: "", label: "All Clients" },
        ...(data || []).map(client => ({
            value: client.id.toString(),
          label: client.name
        }))
        ]
      
        setClients(clientOptions)
    } catch (error) {
      console.error("Error fetching clients:", error)
    }
  }

  const handleDateFilterChange = (value: string) => {
    setDateFilter(value)
    if (value !== "specific") {
      setSpecificDate("")
    }
    if (value !== "period") {
      setPeriodStartDate("")
      setPeriodEndDate("")
    }
  }

  const getFilteredQuotations = () => {
    let filtered = [...quotations]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (quotation) =>
      quotation.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          quotation.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          quotation.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Client filter
    if (clientFilter) {
      filtered = filtered.filter(quotation => quotation.client_id.toString() === clientFilter)
    }

    // Date filter
    if (dateFilter) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter(quotation => {
        const quotationDate = new Date(quotation.date_created)
        const quotationDay = new Date(quotationDate.getFullYear(), quotationDate.getMonth(), quotationDate.getDate())
        
        switch (dateFilter) {
          case "today":
            return quotationDay.getTime() === today.getTime()
          case "week":
            const weekStart = new Date(today)
            weekStart.setDate(today.getDate() - today.getDay())
            return quotationDay >= weekStart
          case "month":
            return quotationDate.getMonth() === now.getMonth() && quotationDate.getFullYear() === now.getFullYear()
          case "year":
            return quotationDate.getFullYear() === now.getFullYear()
          case "specific":
            if (specificDate) {
              const specDate = new Date(specificDate)
              const specDay = new Date(specDate.getFullYear(), specDate.getMonth(), specDate.getDate())
              return quotationDay.getTime() === specDay.getTime()
            }
            return true
          case "period":
            if (periodStartDate && periodEndDate) {
              const startDate = new Date(periodStartDate)
              const endDate = new Date(periodEndDate)
              const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
              const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
              return quotationDay >= startDay && quotationDay <= endDay
            }
            return true
          default:
            return true
        }
      })
    }

    return filtered
  }

  const filteredQuotations = getFilteredQuotations()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "badge bg-warning"
      case "accepted":
        return "badge bg-success"
      case "rejected":
        return "badge bg-danger"
      case "expired":
        return "badge bg-secondary"
      case "converted_to_sales_order":
        return "badge bg-info"
      case "converted_to_cash_sale":
        return "badge bg-primary"
      default:
        return "badge bg-secondary"
    }
  }

  const handleModalSave = async (quotationData: any) => {
    console.log('handleModalSave - Received quotationData:', {
      total_amount: quotationData.total_amount,
      grand_total: quotationData.grand_total,
      vat_amount: quotationData.vat_amount,
      vat_percentage: quotationData.vat_percentage
    });
    
    try {
      if (modalMode === "create") {
        // Create new quotation
        const { data: quotation, error: insertError } = await supabase
          .from("quotations")
          .insert({
            quotation_number: quotationData.quotation_number,
            client_id: quotationData.client_id,
            date_created: quotationData.date_created,
            cabinet_total: quotationData.cabinet_total,
            worktop_total: quotationData.worktop_total,
            accessories_total: quotationData.accessories_total,
            appliances_total: quotationData.appliances_total,
            wardrobes_total: quotationData.wardrobes_total,
            tvunit_total: quotationData.tvunit_total,
            labour_percentage: quotationData.labour_percentage,
            labour_total: quotationData.labour_total,
            total_amount: quotationData.total_amount,
            grand_total: quotationData.grand_total,
            include_worktop: quotationData.include_worktop,
            include_accessories: quotationData.include_accessories,
            include_appliances: quotationData.include_appliances,
            include_wardrobes: quotationData.include_wardrobes,
            include_tvunit: quotationData.include_tvunit,
            status: quotationData.status,
            notes: quotationData.notes,
            terms_conditions: quotationData.terms_conditions,
            cabinet_labour_percentage: quotationData.cabinet_labour_percentage,
            accessories_labour_percentage: quotationData.accessories_labour_percentage,
            appliances_labour_percentage: quotationData.appliances_labour_percentage,
            worktop_labor_qty: quotationData.worktop_labor_qty,
            worktop_labor_unit_price: quotationData.worktop_labor_unit_price,
            vat_amount: quotationData.vat_amount,
            vat_percentage: quotationData.vat_percentage
          })
          .select()
          .single()

        if (insertError) throw insertError

        // Insert quotation items
        if (quotationData.items && quotationData.items.length > 0) {
          const quotationItems = quotationData.items.map((item: any) => ({
            quotation_id: quotation.id,
            category: item.category,
            description: item.description,
            unit: item.unit,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            stock_item_id: item.stock_item_id
          }))

          const { error: itemsError } = await supabase
            .from("quotation_items")
            .insert(quotationItems)

          if (itemsError) throw itemsError
        }

        toast.success("Quotation created successfully")
      } else if (modalMode === "edit") {
        // Update existing quotation
        const { error: updateError } = await supabase
          .from("quotations")
          .update({
            client_id: quotationData.client_id,
            date_created: quotationData.date_created,
            cabinet_total: quotationData.cabinet_total,
            worktop_total: quotationData.worktop_total,
            accessories_total: quotationData.accessories_total,
            appliances_total: quotationData.appliances_total,
            wardrobes_total: quotationData.wardrobes_total,
            tvunit_total: quotationData.tvunit_total,
            labour_percentage: quotationData.labour_percentage,
            labour_total: quotationData.labour_total,
            total_amount: quotationData.total_amount,
            grand_total: quotationData.grand_total,
            include_worktop: quotationData.include_worktop,
            include_accessories: quotationData.include_accessories,
            include_appliances: quotationData.include_appliances,
            include_wardrobes: quotationData.include_wardrobes,
            include_tvunit: quotationData.include_tvunit,
            status: quotationData.status,
            notes: quotationData.notes,
            terms_conditions: quotationData.terms_conditions,
            cabinet_labour_percentage: quotationData.cabinet_labour_percentage,
            accessories_labour_percentage: quotationData.accessories_labour_percentage,
            appliances_labour_percentage: quotationData.appliances_labour_percentage,
            worktop_labor_qty: quotationData.worktop_labor_qty,
            worktop_labor_unit_price: quotationData.worktop_labor_unit_price,
            vat_amount: quotationData.vat_amount,
            vat_percentage: quotationData.vat_percentage
          })
          .eq("id", selectedQuotation?.id)

        if (updateError) throw updateError

        // Delete existing items and insert new ones
        const { error: deleteError } = await supabase
          .from("quotation_items")
          .delete()
          .eq("quotation_id", selectedQuotation?.id)

        if (deleteError) throw deleteError

        // Insert updated items
        if (quotationData.items && quotationData.items.length > 0) {
          const quotationItems = quotationData.items.map((item: any) => ({
            quotation_id: selectedQuotation?.id,
            category: item.category,
            description: item.description,
            unit: item.unit,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            stock_item_id: item.stock_item_id
          }))

          const { error: itemsError } = await supabase
            .from("quotation_items")
            .insert(quotationItems)

          if (itemsError) throw itemsError
        }

        toast.success("Quotation updated successfully")
      }

      fetchQuotations()
      setShowModal(false)
    } catch (error) {
      console.error("Error saving quotation:", error)
      toast.error("Failed to save quotation")
    }
  }

  const handleView = (quotation: Quotation) => {
    setSelectedQuotation(quotation)
    setModalMode("view")
    setShowModal(true)
  }

  const handleEdit = (quotation: Quotation) => {
    setSelectedQuotation(quotation)
    setModalMode("edit")
    setShowModal(true)
  }

  const handleDelete = async (quotation: Quotation) => {
    if (window.confirm(`Are you sure you want to delete quotation ${quotation.quotation_number}?`)) {
      try {
        const { error } = await supabase
          .from("quotations")
          .delete()
          .eq("id", quotation.id)

        if (error) throw error

        toast.success("Quotation deleted successfully")
        fetchQuotations()
      } catch (error) {
        console.error("Error deleting quotation:", error)
        toast.error("Failed to delete quotation")
      }
    }
  }

  const handleProceedToSalesOrder = async (quotation: Quotation) => {
    try {
      const salesOrder = await proceedToSalesOrder(quotation.id)
      toast.success(`Sales order ${salesOrder.order_number} created successfully`)
      fetchQuotations()
    } catch (error) {
      // Error handling is done in the workflow function
    }
  }

  const handleProceedToCashSale = async (quotation: Quotation) => {
    try {
      const cashSale = await proceedToCashSale(quotation.id)
      toast.success(`Cash sale ${cashSale.sale_number} created successfully`)
      fetchQuotations()
    } catch (error) {
      // Error handling is done in the workflow function
    }
  }

  const handlePrint = async (quotation: Quotation) => {
    try {
      const { generate } = await import('@pdfme/generator');
      const { text, rectangle, line, image } = await import('@pdfme/schemas');
      const { generateQuotationPDF, imageToBase64 } = await import('@/lib/pdf-template');

      // Convert logo to base64
      const logoBase64 = await imageToBase64('/logo.png');

      // Prepare items data with section headings and improved formatting
      const items: any[] = [];
      const grouped = quotation.items?.reduce((acc, item) => {
        (acc[item.category] = acc[item.category] || []).push(item);
        return acc;
      }, {} as Record<string, typeof quotation.items>) || {};

      Object.entries(grouped).forEach(([category, itemsInCategory]) => {
        // Insert section heading row (all caps, large font, special flag)
        items.push({
          isSection: true,
          itemNumber: "",
          quantity: "",
          unit: "",
          description: category.toUpperCase(),
          unitPrice: "",
          total: ""
        });
        // Insert all items in this category, numbering starts from 1
        itemsInCategory.forEach((item, idx) => {
          items.push({
            isSection: false,
            itemNumber: String(idx + 1),
            quantity: item.quantity,
            unit: item.unit,
            description: item.description,
            unitPrice: item.unit_price != null ? item.unit_price : "",
            total: item.total_price != null ? item.total_price : ""
          });
        });
        // Insert section summary row after all items in this section
        const sectionTotal = itemsInCategory.reduce((sum, item) => sum + (item.total_price || 0), 0);
        items.push({
          isSectionSummary: true,
          itemNumber: "",
          quantity: "",
          unit: "",
          description: "",
          unitPrice: `${category.charAt(0).toUpperCase() + category.slice(1)} Total:`,
          total: sectionTotal !== 0 ? sectionTotal.toFixed(2) : ""
        });
      });

      // Prepare quotation data
      const { template, inputs } = await generateQuotationPDF({
        companyName: "CABINET MASTER STYLES & FINISHES",
        companyLocation: "Location: Ruiru Eastern By-Pass",
        companyPhone: "Tel: +254729554475",
        companyEmail: "Email: cabinetmasterstyles@gmail.com",
        clientNames: quotation.client?.name || "",
        siteLocation: quotation.client?.location || "",
        mobileNo: quotation.client?.phone || "",
        date: new Date(quotation.date_created).toLocaleDateString(),
        deliveryNoteNo: "Delivery Note No.",
        quotationNumber: quotation.quotation_number,
        items,
        subtotal: quotation.total_amount || 0,
        vat: quotation.vat_amount || 0,
        vatPercentage: quotation.vat_percentage || 16,
        total: quotation.grand_total || 0,
        notes: quotation.notes || "",
        terms: parseTermsAndConditions(quotation.terms_conditions || ""),
        preparedBy: "",
        approvedBy: "",
        companyLogo: logoBase64
      });

      const pdf = await generate({
        template,
        inputs,
        plugins: { text, rectangle, line, image }
      });

      const blob = new Blob([new Uint8Array(pdf.buffer)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Error printing quotation:', error);
      toast.error("Failed to print quotation. Please try again.");
    }
  };

  const handleDownload = async (quotation: Quotation) => {
    try {
      const { generate } = await import('@pdfme/generator');
      const { text, rectangle, line, image } = await import('@pdfme/schemas');
      const { generateQuotationPDF, imageToBase64 } = await import('@/lib/pdf-template');

      // Convert logo to base64
      const logoBase64 = await imageToBase64('/logo.png');

      // Prepare items data with section headings and improved formatting
      const items: any[] = [];
      const grouped = quotation.items?.reduce((acc, item) => {
        (acc[item.category] = acc[item.category] || []).push(item);
        return acc;
      }, {} as Record<string, typeof quotation.items>) || {};

      Object.entries(grouped).forEach(([category, itemsInCategory]) => {
        // Insert section heading row (all caps, large font, special flag)
        items.push({
          isSection: true,
          itemNumber: "",
          quantity: "",
          unit: "",
          description: category.toUpperCase(),
          unitPrice: "",
          total: ""
        });
        // Insert all items in this category, numbering starts from 1
        itemsInCategory.forEach((item, idx) => {
          items.push({
            isSection: false,
            itemNumber: String(idx + 1),
            quantity: item.quantity,
            unit: item.unit,
            description: item.description,
            unitPrice: item.unit_price != null ? item.unit_price : "",
            total: item.total_price != null ? item.total_price : ""
          });
        });
        // Insert section summary row after all items in this section
        const sectionTotal = itemsInCategory.reduce((sum, item) => sum + (item.total_price || 0), 0);
        items.push({
          isSectionSummary: true,
          itemNumber: "",
          quantity: "",
          unit: "",
          description: "",
          unitPrice: `${category.charAt(0).toUpperCase() + category.slice(1)} Total:`,
          total: sectionTotal !== 0 ? sectionTotal.toFixed(2) : ""
        });
      });

      // Prepare quotation data
      const { template, inputs } = await generateQuotationPDF({
        companyName: "CABINET MASTER STYLES & FINISHES",
        companyLocation: "Location: Ruiru Eastern By-Pass",
        companyPhone: "Tel: +254729554475",
        companyEmail: "Email: cabinetmasterstyles@gmail.com",
        clientNames: quotation.client?.name || "",
        siteLocation: quotation.client?.location || "",
        mobileNo: quotation.client?.phone || "",
        date: new Date(quotation.date_created).toLocaleDateString(),
        deliveryNoteNo: "Delivery Note No.",
        quotationNumber: quotation.quotation_number,
        items,
        subtotal: quotation.total_amount || 0,
        vat: quotation.vat_amount || 0,
        vatPercentage: quotation.vat_percentage || 16,
        total: quotation.grand_total || 0,
        notes: quotation.notes || "",
        terms: parseTermsAndConditions(quotation.terms_conditions || ""),
        preparedBy: "",
        approvedBy: "",
        companyLogo: logoBase64
      });

      const pdf = await generate({
        template,
        inputs,
        plugins: { text, rectangle, line, image }
      });

      const blob = new Blob([new Uint8Array(pdf.buffer)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quotation-${quotation.quotation_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error('Error downloading quotation:', error);
      toast.error("Failed to download quotation. Please try again.");
    }
  };

  const handleNewQuotation = () => {
    setSelectedQuotation(undefined)
    setModalMode("create")
    setShowModal(true)
  }

  // Export function
  const exportQuotations = () => {
    exportQuotationsReport(quotations)
  }

  // Parse terms and conditions from database
  const parseTermsAndConditions = (termsText: string) => {
    return (termsText || "").split('\n').filter(line => line.trim());
  };



  return (
    <div className="quotations-view">
    <div>
      {/* Add New Quotation Button */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5>Quotations</h5>
          <button className="btn-add" onClick={handleNewQuotation}>
            <Plus size={16} />
          Add New Quotation
        </button>
      </div>

        {/* Search and Filter Row */}
        <div className="row mb-3">
          <div className="col-md-3">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="fas fa-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search quotations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ borderRadius: "0 16px 16px 0", height: "45px" }}
              />
            </div>
          </div>
          
          <div className="col-md-3">
            <select
              className="form-select border-0 shadow-sm"
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              style={{ borderRadius: "16px", height: "45px" }}
            >
              {clients.map((client) => (
                <option key={client.value} value={client.value}>
                  {client.label}
                </option>
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
              <div className="d-flex gap-2 mt-2">
                <input
                  type="date"
                  className="form-control border-0 shadow-sm"
                  placeholder="Start Date"
                  value={periodStartDate}
                  onChange={(e) => setPeriodStartDate(e.target.value)}
                  style={{ borderRadius: "16px", height: "45px" }}
                />
                <input
                  type="date"
                  className="form-control border-0 shadow-sm"
                  placeholder="End Date"
                  value={periodEndDate}
                  onChange={(e) => setPeriodEndDate(e.target.value)}
                  style={{ borderRadius: "16px", height: "45px" }}
                />
              </div>
            )}
          </div>
          
          <div className="col-md-3">
            <button
              className="btn w-100 shadow-sm export-btn"
              onClick={exportQuotations}
              style={{ borderRadius: "16px", height: "45px", transition: "all 0.3s ease" }}
            >
              <Download size={16} className="me-2" />
              Export
            </button>
          </div>
        </div>

      {/* Quotations Table */}
      <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
              <th>Quotation #</th>
                <th>Date</th>
              <th>Client</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                  <td colSpan={6} className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                </td>
              </tr>
            ) : filteredQuotations.length === 0 ? (
              <tr>
                  <td colSpan={6} className="text-center py-4 text-muted">
                  No quotations found
                </td>
              </tr>
            ) : (
              filteredQuotations.map((quotation) => (
                <tr key={quotation.id}>
                    <td>{quotation.quotation_number}</td>
                  <td>{new Date(quotation.date_created).toLocaleDateString()}</td>
                    <td>{quotation.client?.name || "Unknown"}</td>
                    <td>KES {quotation.grand_total?.toFixed(2) || "0.00"}</td>
                  <td>
                      <span className={`badge ${getStatusBadge(quotation.status)}`}>
                      {quotation.status}
                    </span>
                  </td>
                  <td>
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-sm action-btn"
                          onClick={() => handleView(quotation)}
                          title="View"
                        >
                      <Eye size={14} />
                    </button>
                        <button
                          className="btn btn-sm action-btn"
                          onClick={() => handleEdit(quotation)}
                          title="Edit"
                        >
                      <Edit size={14} />
                    </button>
                        <button
                          className="btn btn-sm action-btn"
                          onClick={() => handleDelete(quotation)}
                          title="Delete"
                        >
                      <Trash2 size={14} />
                    </button>
                        <button
                          className="btn btn-sm action-btn"
                          onClick={() => handlePrint(quotation)}
                          title="Print"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          className="btn btn-sm action-btn"
                          onClick={() => handleDownload(quotation)}
                          title="Download"
                        >
                          <FileText size={14} />
                        </button>
                        
                        {quotation.status === "accepted" && (
                          <>
                            <button
                              className="btn btn-sm action-btn"
                              onClick={() => handleProceedToSalesOrder(quotation)}
                              title="Create Sales Order"
                            >
                              <CreditCard size={14} />
                            </button>
                            <button
                              className="btn btn-sm action-btn"
                              onClick={() => handleProceedToCashSale(quotation)}
                              title="Create Cash Sale"
                            >
                              <Receipt size={14} />
                            </button>
                          </>
                        )}
                      </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>

      {/* Quotation Modal */}
      {showModal && (
        <QuotationModal
          isOpen={showModal}
          quotation={selectedQuotation}
          mode={modalMode}
          onClose={() => setShowModal(false)}
          onSave={handleModalSave}
        />
      )}
    </div>
  )
}

export default QuotationsView
