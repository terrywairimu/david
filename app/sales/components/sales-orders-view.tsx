"use client"

import React, { useEffect, useState } from "react"
import { Plus, Edit, Trash2, Eye, Download, FileText, Receipt, Printer } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import SalesOrderModal from "@/components/ui/sales-order-modal"
import { 
  proceedToInvoice, 
  proceedToCashSaleFromSalesOrder, 
  printDocument, 
  downloadDocument,
  exportSalesOrders as exportSalesOrdersReport
} from "@/lib/workflow-utils"

interface SalesOrder {
  id: number
  order_number: string
  client_id: number
  quotation_id?: number
  original_quotation_number?: string
  date_created: string
  cabinet_total: number
  worktop_total: number
  accessories_total: number
  labour_percentage: number
  labour_total: number
  cabinet_labour_percentage?: number
  accessories_labour_percentage?: number
  appliances_labour_percentage?: number
  wardrobes_labour_percentage?: number
  tvunit_labour_percentage?: number
  appliances_total?: number
  wardrobes_total?: number
  tvunit_total?: number
  total_amount: number
  grand_total: number
  vat_amount?: number
  vat_percentage?: number
  worktop_labor_qty?: number
  worktop_labor_unit_price?: number
  include_accessories: boolean
  status: "pending" | "processing" | "completed" | "cancelled" | "converted_to_invoice" | "converted_to_cash_sale"
  notes?: string
  terms_conditions?: string
  section_names?: {
    cabinet: string;
    worktop: string;
    accessories: string;
    appliances: string;
    wardrobes: string;
    tvunit: string;
  }
  client?: {
    id: number
    name: string
    phone?: string
    location?: string
  }
  items?: Array<{
    id: number
    category: "cabinet" | "worktop" | "accessories"
    description: string
    unit: string
    quantity: number
    unit_price: number
    total_price: number
    stock_item_id?: number
  }>
}

const SalesOrdersView = () => {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [clientFilter, setClientFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [specificDate, setSpecificDate] = useState("")
  const [periodStartDate, setPeriodStartDate] = useState("")
  const [periodEndDate, setPeriodEndDate] = useState("")
  const [clients, setClients] = useState<{ value: string; label: string }[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<SalesOrder | undefined>()
  const [modalMode, setModalMode] = useState<"view" | "edit">("view")

  useEffect(() => {
    fetchSalesOrders()
    fetchClients()
    
    // Set up real-time subscription for sales orders
    const salesOrdersSubscription = supabase
      .channel('sales_orders_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_orders' }, (payload) => {
        console.log('Sales orders change detected:', payload)
        fetchSalesOrders() // Refresh sales orders when changes occur
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_order_items' }, (payload) => {
        console.log('Sales order items change detected:', payload)
        fetchSalesOrders() // Refresh sales orders when items change
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registered_entities' }, (payload) => {
        console.log('Registered entities change detected:', payload)
        fetchClients() // Refresh clients when changes occur
      })
      .subscribe()

    return () => {
      supabase.removeChannel(salesOrdersSubscription)
    }
  }, [])

  const fetchSalesOrders = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("sales_orders")
        .select(`
          *,
          client:registered_entities(id, name, phone, location),
          items:sales_order_items(*)
        `)
        .order("date_created", { ascending: false })

      if (error) throw error
      setSalesOrders(data || [])
    } catch (error) {
        console.error("Error fetching sales orders:", error)
      toast.error("Failed to load sales orders")
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

  const getFilteredSalesOrders = () => {
    let filtered = [...salesOrders]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.original_quotation_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Client filter
    if (clientFilter) {
      filtered = filtered.filter(order => order.client_id.toString() === clientFilter)
    }

    // Date filter
    if (dateFilter) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.date_created)
        const orderDay = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate())
        
        switch (dateFilter) {
          case "today":
            return orderDay.getTime() === today.getTime()
          case "week":
            const weekStart = new Date(today)
            weekStart.setDate(today.getDate() - today.getDay())
            return orderDay >= weekStart
          case "month":
            return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()
          case "year":
            return orderDate.getFullYear() === now.getFullYear()
          case "specific":
            if (specificDate) {
              const specDate = new Date(specificDate)
              const specDay = new Date(specDate.getFullYear(), specDate.getMonth(), specDate.getDate())
              return orderDay.getTime() === specDay.getTime()
            }
            return true
          case "period":
            if (periodStartDate && periodEndDate) {
              const startDate = new Date(periodStartDate)
              const endDate = new Date(periodEndDate)
              const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
              const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
              return orderDay >= startDay && orderDay <= endDay
            }
            return true
          default:
            return true
        }
      })
    }

    return filtered
  }

  const filteredSalesOrders = getFilteredSalesOrders()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "badge bg-warning"
      case "processing":
        return "badge bg-info"
      case "completed":
        return "badge bg-success"
      case "cancelled":
        return "badge bg-danger"
      case "converted_to_invoice":
        return "badge bg-primary"
      case "converted_to_cash_sale":
        return "badge bg-success"
      default:
        return "badge bg-secondary"
    }
  }

  const handleModalSave = async (salesOrderData: any) => {
    try {
      if (modalMode === "edit") {
        // Update existing sales order
        const { error: updateError } = await supabase
          .from("sales_orders")
          .update({
            client_id: salesOrderData.client_id,
            date_created: salesOrderData.date_created,
            cabinet_total: salesOrderData.cabinet_total,
            worktop_total: salesOrderData.worktop_total,
            accessories_total: salesOrderData.accessories_total,
            appliances_total: salesOrderData.appliances_total,
            wardrobes_total: salesOrderData.wardrobes_total,
            tvunit_total: salesOrderData.tvunit_total,
            labour_percentage: salesOrderData.labour_percentage,
            labour_total: salesOrderData.labour_total,
            total_amount: salesOrderData.total_amount,
            grand_total: salesOrderData.grand_total,
            include_worktop: salesOrderData.include_worktop,
            include_accessories: salesOrderData.include_accessories,
            include_appliances: salesOrderData.include_appliances,
            include_wardrobes: salesOrderData.include_wardrobes,
            include_tvunit: salesOrderData.include_tvunit,
            status: salesOrderData.status,
            notes: salesOrderData.notes,
            terms_conditions: salesOrderData.terms_conditions,
            cabinet_labour_percentage: salesOrderData.cabinet_labour_percentage,
            accessories_labour_percentage: salesOrderData.accessories_labour_percentage,
            appliances_labour_percentage: salesOrderData.appliances_labour_percentage,
            wardrobes_labour_percentage: salesOrderData.wardrobes_labour_percentage,
            tvunit_labour_percentage: salesOrderData.tvunit_labour_percentage,
            worktop_labor_qty: salesOrderData.worktop_labor_qty,
            worktop_labor_unit_price: salesOrderData.worktop_labor_unit_price,
            vat_amount: salesOrderData.vat_amount,
            vat_percentage: salesOrderData.vat_percentage,
            section_names: salesOrderData.section_names
          })
          .eq("id", selectedSalesOrder?.id)

        if (updateError) throw updateError

        // Delete existing items and insert new ones
        const { error: deleteError } = await supabase
          .from("sales_order_items")
          .delete()
          .eq("sales_order_id", selectedSalesOrder?.id)

        if (deleteError) throw deleteError

        // Insert updated items
        if (salesOrderData.items && salesOrderData.items.length > 0) {
          const salesOrderItems = salesOrderData.items.map((item: any) => ({
            sales_order_id: selectedSalesOrder?.id,
            category: item.category,
            description: item.description,
            unit: item.unit,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            stock_item_id: item.stock_item_id
          }))

          const { error: itemsError } = await supabase
            .from("sales_order_items")
            .insert(salesOrderItems)

          if (itemsError) throw itemsError
        }

        toast.success("Sales order updated successfully")
      }

      fetchSalesOrders()
    } catch (error) {
      console.error("Error saving sales order:", error)
      toast.error("Failed to save sales order")
    }
  }

  const handleView = (salesOrder: SalesOrder) => {
    setSelectedSalesOrder(salesOrder)
    setModalMode("view")
    setShowModal(true)
  }

  const handleEdit = (salesOrder: SalesOrder) => {
    setSelectedSalesOrder(salesOrder)
    setModalMode("edit")
    setShowModal(true)
  }

  const handleDelete = async (salesOrder: SalesOrder) => {
    if (window.confirm(`Are you sure you want to delete sales order ${salesOrder.order_number}?`)) {
      try {
        const { error } = await supabase
          .from("sales_orders")
          .delete()
          .eq("id", salesOrder.id)

        if (error) throw error

        toast.success("Sales order deleted successfully")
        fetchSalesOrders()
      } catch (error) {
        console.error("Error deleting sales order:", error)
        toast.error("Failed to delete sales order")
      }
    }
  }

  const handleProceedToInvoice = async (salesOrder: SalesOrder) => {
    try {
      const invoice = await proceedToInvoice(salesOrder.id)
      toast.success(`Invoice ${invoice.invoice_number} created successfully`)
      fetchSalesOrders()
    } catch (error) {
      // Error handling is done in the workflow function
    }
  }

  const handleProceedToCashSale = async (salesOrder: SalesOrder) => {
    try {
      const cashSale = await proceedToCashSaleFromSalesOrder(salesOrder.id)
      toast.success(`Cash sale ${cashSale.sale_number} created successfully`)
      fetchSalesOrders()
    } catch (error) {
      // Error handling is done in the workflow function
    }
  }

  const handlePrint = async (salesOrder: SalesOrder) => {
    try {
      const { generate } = await import('@pdfme/generator');
      const { text, rectangle, line, image } = await import('@pdfme/schemas');
      const { generateQuotationPDF, imageToBase64 } = await import('@/lib/pdf-template');

      // Convert logo to base64
      const logoBase64 = await imageToBase64('/logo.png');
      // Convert watermark logo to base64
      const watermarkBase64 = await imageToBase64('/logowatermark.png');

      // Prepare items data with section headings (same as quotation)
      const items: any[] = [];
      const grouped = salesOrder.items?.reduce((acc, item) => {
        (acc[item.category] = acc[item.category] || []).push(item);
        return acc;
      }, {} as Record<string, typeof salesOrder.items>) || {};

      // Define the default section order
      const sectionOrder = ['cabinet', 'worktop', 'accessories', 'appliances', 'wardrobes', 'tvunit'];
      
      // Process sections in the defined order
      sectionOrder.forEach((category) => {
        const itemsInCategory = grouped[category] || [];
        if (itemsInCategory.length === 0) return; // Skip empty sections
        
        // Calculate section total first to determine if we should include this section
        let sectionPrintTotal = itemsInCategory.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0);
        
        // Add worktop labor to section total if it exists
        if (category === 'worktop' && salesOrder.worktop_labor_qty && salesOrder.worktop_labor_unit_price) {
          sectionPrintTotal += salesOrder.worktop_labor_qty * salesOrder.worktop_labor_unit_price;
        }

        // Add labour charge to section total if it exists (for non-worktop sections)
        if (category !== 'worktop' && itemsInCategory.length > 0) {
          const sectionItemsTotal = itemsInCategory.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0);
          
          // Get the correct labour percentage for this specific section
          let labourPercentage = salesOrder.labour_percentage || 30; // Use general labour_percentage as default
          switch (category) {
            case 'cabinet':
              labourPercentage = salesOrder.cabinet_labour_percentage || salesOrder.labour_percentage || 30;
              break;
            case 'accessories':
              labourPercentage = salesOrder.accessories_labour_percentage || salesOrder.labour_percentage || 30;
              break;
            case 'appliances':
              labourPercentage = salesOrder.appliances_labour_percentage || salesOrder.labour_percentage || 30;
              break;
            case 'wardrobes':
              labourPercentage = salesOrder.wardrobes_labour_percentage || salesOrder.labour_percentage || 30;
              break;
            case 'tvunit':
              labourPercentage = salesOrder.tvunit_labour_percentage || salesOrder.labour_percentage || 30;
              break;
            default:
              labourPercentage = salesOrder.labour_percentage || 30;
          }
          
          const labourCharge = (sectionItemsTotal * labourPercentage) / 100;
          if (labourCharge > 0) {
            sectionPrintTotal += labourCharge;
          }
        }
        
        // Only include section if total is greater than 0
        if (sectionPrintTotal <= 0) return;
        
        // Section mapping
        const sectionLabels: { [key: string]: string } = {
          cabinet: salesOrder.section_names?.cabinet || "General",
          worktop: salesOrder.section_names?.worktop || "Worktop", 
          accessories: salesOrder.section_names?.accessories || "Accessories",
          appliances: salesOrder.section_names?.appliances || "Appliances",
          wardrobes: salesOrder.section_names?.wardrobes || "Wardrobes",
          tvunit: salesOrder.section_names?.tvunit || "TV Unit"
        };

        const sectionLabel = sectionLabels[category] || category;

        // Insert section header
        items.push({
          isSection: true,
          itemNumber: "",
          quantity: "",
          unit: "",
          description: sectionLabel,
          unitPrice: "",
          total: ""
        });

        // Insert items for this section
        let itemNumber = 1;
        itemsInCategory.forEach((item) => {
          items.push({
            itemNumber: String(itemNumber),
            quantity: item.quantity,
            unit: item.unit,
            description: item.description,
            unitPrice: item.unit_price.toFixed(2),
            total: item.total_price.toFixed(2)
          });
          itemNumber++;
        });

        // Add worktop installation labor if exists
        if (category === 'worktop' && salesOrder.worktop_labor_qty && salesOrder.worktop_labor_unit_price) {
          items.push({
            itemNumber: String(itemNumber),
            quantity: salesOrder.worktop_labor_qty,
            unit: "per slab",
            description: "Worktop Installation Labor",
            unitPrice: salesOrder.worktop_labor_unit_price.toFixed(2),
            total: (salesOrder.worktop_labor_qty * salesOrder.worktop_labor_unit_price).toFixed(2)
          });
          itemNumber++;
        }

        // Add labour charge for each section that has items (except worktop which has its own labor)
        if (category !== 'worktop' && itemsInCategory.length > 0) {
          // Check if labour charge items already exist in this category
          const hasExistingLabourCharge = itemsInCategory.some(item => 
            item.description && item.description.toLowerCase().includes('labour charge')
          );
          
          // Only calculate labour charge if no labour charge items exist
          if (!hasExistingLabourCharge) {
            const sectionItemsTotal = itemsInCategory.reduce((sum, item) => sum + (item.total_price || 0), 0);
            
            // Get the correct labour percentage for this specific section from database
            let labourPercentage = salesOrder.labour_percentage || 30; // Use general labour_percentage as default
            switch (category) {
              case 'cabinet':
                labourPercentage = salesOrder.cabinet_labour_percentage || salesOrder.labour_percentage || 30;
                break;
              case 'accessories':
                labourPercentage = salesOrder.accessories_labour_percentage || salesOrder.labour_percentage || 30;
                break;
              case 'appliances':
                labourPercentage = salesOrder.appliances_labour_percentage || salesOrder.labour_percentage || 30;
                break;
              case 'wardrobes':
                labourPercentage = salesOrder.wardrobes_labour_percentage || salesOrder.labour_percentage || 30;
                break;
              case 'tvunit':
                labourPercentage = salesOrder.tvunit_labour_percentage || salesOrder.labour_percentage || 30;
                break;
              default:
                labourPercentage = salesOrder.labour_percentage || 30;
            }
            
            const labourCharge = (sectionItemsTotal * labourPercentage) / 100;
            if (labourCharge > 0) {
              items.push({
                itemNumber: String(itemNumber),
                quantity: 1,
                unit: "sum",
                description: `Labour Charge (${labourPercentage}%)`,
                unitPrice: labourCharge.toFixed(2),
                total: labourCharge.toFixed(2)
              });
              itemNumber++;
            }
          }
        }

        // Insert section summary row
        let sectionSummaryTotal = itemsInCategory.reduce((sum, item) => sum + (item.total_price || 0), 0);
        
        if (category === 'worktop' && salesOrder.worktop_labor_qty && salesOrder.worktop_labor_unit_price) {
          sectionSummaryTotal += salesOrder.worktop_labor_qty * salesOrder.worktop_labor_unit_price;
        }

        // Add labour charge to section total if it exists (for non-worktop sections)
        if (category !== 'worktop' && category !== 'cabinet' && itemsInCategory.length > 0) {
          const sectionItemsTotal = itemsInCategory.reduce((sum, item) => sum + (item.total_price || 0), 0);
          
          // Get the correct labour percentage for this specific section
          let labourPercentage = salesOrder.labour_percentage || 30; // Use general labour_percentage as default
          switch (category) {
            case 'accessories':
              labourPercentage = salesOrder.accessories_labour_percentage || salesOrder.labour_percentage || 30;
              break;
            case 'appliances':
              labourPercentage = salesOrder.appliances_labour_percentage || salesOrder.labour_percentage || 30;
              break;
            case 'wardrobes':
              labourPercentage = salesOrder.wardrobes_labour_percentage || salesOrder.labour_percentage || 30;
              break;
            case 'tvunit':
              labourPercentage = salesOrder.tvunit_labour_percentage || salesOrder.labour_percentage || 30;
              break;
            default:
              labourPercentage = salesOrder.labour_percentage || 30;
          }
          
          const labourCharge = (sectionItemsTotal * labourPercentage) / 100;
          if (labourCharge > 0) {
            sectionSummaryTotal += labourCharge;
          }
        }
        
        items.push({
          isSectionSummary: true,
          itemNumber: "",
          quantity: "",
          unit: "",
          description: `${sectionLabel} Total`,
          unitPrice: "",
          total: sectionSummaryTotal.toFixed(2) // Always show total, even if 0.00
        });
      });

      // Parse terms and conditions
      const parseTermsAndConditions = (termsText: string) => {
        return (termsText || "").split('\n').filter(line => line.trim());
      };

      // Generate PDF using the same function as quotation but with "SALES ORDER" title
      const { template, inputs } = await generateQuotationPDF({
        companyName: "CABINET MASTER STYLES & FINISHES",
        companyLocation: "Location: Ruiru Eastern By-Pass",
        companyPhone: "Tel: +254729554475",
        companyEmail: "Email: cabinetmasterstyles@gmail.com",
        clientNames: salesOrder.client?.name || "",
        siteLocation: salesOrder.client?.location || "",
        mobileNo: salesOrder.client?.phone || "",
        date: new Date(salesOrder.date_created).toLocaleDateString(),
        deliveryNoteNo: "Delivery Note No.",
        quotationNumber: salesOrder.order_number,
        originalQuotationNumber: salesOrder.original_quotation_number || "",  // Add original quotation number
        documentTitle: "SALES ORDER", // This makes it show "SALES ORDER" instead of "QUOTATION"
        items,


        total: salesOrder.grand_total || 0,
        notes: salesOrder.notes || "",
        terms: parseTermsAndConditions(salesOrder.terms_conditions || ""),
        preparedBy: "",
        approvedBy: "",
        companyLogo: logoBase64,
        watermarkLogo: watermarkBase64
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
      console.error('Error printing sales order:', error);
      toast.error("Failed to print sales order. Please try again.");
    }
  }

  const handleDownload = async (salesOrder: SalesOrder) => {
    try {
      const { generate } = await import('@pdfme/generator');
      const { text, rectangle, line, image } = await import('@pdfme/schemas');
      const { generateQuotationPDF, imageToBase64 } = await import('@/lib/pdf-template');

      // Convert logo to base64
      const logoBase64 = await imageToBase64('/logo.png');
      // Convert watermark logo to base64
      const watermarkBase64 = await imageToBase64('/logowatermark.png');

      // Prepare items data with section headings (same as print function)
      const items: any[] = [];
      const grouped = salesOrder.items?.reduce((acc, item) => {
        (acc[item.category] = acc[item.category] || []).push(item);
        return acc;
      }, {} as Record<string, typeof salesOrder.items>) || {};

      // Define the default section order
      const sectionOrder = ['cabinet', 'worktop', 'accessories', 'appliances', 'wardrobes', 'tvunit'];
      
      // Process sections in the defined order
      sectionOrder.forEach((category) => {
        const itemsInCategory = grouped[category] || [];
        if (itemsInCategory.length === 0) return; // Skip empty sections
        
        // Calculate section total first to determine if we should include this section
        let sectionDownloadTotal = itemsInCategory.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0);
        
        // Add worktop labor to section total if it exists
        if (category === 'worktop' && salesOrder.worktop_labor_qty && salesOrder.worktop_labor_unit_price) {
          sectionDownloadTotal += salesOrder.worktop_labor_qty * salesOrder.worktop_labor_unit_price;
        }

        // Add labour charge to section total if it exists (for non-worktop sections)
        if (category !== 'worktop' && itemsInCategory.length > 0) {
          const sectionItemsTotal = itemsInCategory.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0);
          
          // Get the correct labour percentage for this specific section
          let labourPercentage = salesOrder.labour_percentage || 30; // Use general labour_percentage as default
          switch (category) {
            case 'cabinet':
              labourPercentage = salesOrder.cabinet_labour_percentage || salesOrder.labour_percentage || 30;
              break;
            case 'accessories':
              labourPercentage = salesOrder.accessories_labour_percentage || salesOrder.labour_percentage || 30;
              break;
            case 'appliances':
              labourPercentage = salesOrder.appliances_labour_percentage || salesOrder.labour_percentage || 30;
              break;
            case 'wardrobes':
              labourPercentage = salesOrder.wardrobes_labour_percentage || salesOrder.labour_percentage || 30;
              break;
            case 'tvunit':
              labourPercentage = salesOrder.tvunit_labour_percentage || salesOrder.labour_percentage || 30;
              break;
            default:
              labourPercentage = salesOrder.labour_percentage || 30;
          }
          
          const labourCharge = (sectionItemsTotal * labourPercentage) / 100;
          if (labourCharge > 0) {
            sectionDownloadTotal += labourCharge;
          }
        }
        
        // Only include section if total is greater than 0
        if (sectionDownloadTotal <= 0) return;
        
        // Section mapping
        const sectionLabels: { [key: string]: string } = {
          cabinet: salesOrder.section_names?.cabinet || "General",
          worktop: salesOrder.section_names?.worktop || "Worktop", 
          accessories: salesOrder.section_names?.accessories || "Accessories",
          appliances: salesOrder.section_names?.appliances || "Appliances",
          wardrobes: salesOrder.section_names?.wardrobes || "Wardrobes",
          tvunit: salesOrder.section_names?.tvunit || "TV Unit"
        };

        const sectionLabel = sectionLabels[category] || category;

        // Insert section header
        items.push({
          isSection: true,
          itemNumber: "",
          quantity: "",
          unit: "",
          description: sectionLabel,
          unitPrice: "",
          total: ""
        });

        // Insert items for this section
        let itemNumber = 1;
        itemsInCategory.forEach((item) => {
          items.push({
            itemNumber: String(itemNumber),
            quantity: item.quantity,
            unit: item.unit,
            description: item.description,
            unitPrice: item.unit_price.toFixed(2),
            total: item.total_price.toFixed(2)
          });
          itemNumber++;
        });

        // Add worktop installation labor if exists
        if (category === 'worktop' && salesOrder.worktop_labor_qty && salesOrder.worktop_labor_unit_price) {
          items.push({
            itemNumber: String(itemNumber),
            quantity: salesOrder.worktop_labor_qty,
            unit: "per slab",
            description: "Worktop Installation Labor",
            unitPrice: salesOrder.worktop_labor_unit_price.toFixed(2),
            total: (salesOrder.worktop_labor_qty * salesOrder.worktop_labor_unit_price).toFixed(2)
          });
          itemNumber++;
        }

        // Add labour charge for each section that has items (except worktop which has its own labor)
        if (category !== 'worktop' && itemsInCategory.length > 0) {
          // Check if labour charge items already exist in this category
          const hasExistingLabourCharge = itemsInCategory.some(item => 
            item.description && item.description.toLowerCase().includes('labour charge')
          );
          
          // Only calculate labour charge if no labour charge items exist
          if (!hasExistingLabourCharge) {
            const sectionItemsTotal = itemsInCategory.reduce((sum, item) => sum + (item.total_price || 0), 0);
            
            // Get the correct labour percentage for this specific section from database
            let labourPercentage = salesOrder.labour_percentage || 30; // Use general labour_percentage as default
            switch (category) {
              case 'cabinet':
                labourPercentage = salesOrder.cabinet_labour_percentage || salesOrder.labour_percentage || 30;
                break;
              case 'accessories':
                labourPercentage = salesOrder.accessories_labour_percentage || salesOrder.labour_percentage || 30;
                break;
              case 'appliances':
                labourPercentage = salesOrder.appliances_labour_percentage || salesOrder.labour_percentage || 30;
                break;
              case 'wardrobes':
                labourPercentage = salesOrder.wardrobes_labour_percentage || salesOrder.labour_percentage || 30;
                break;
              case 'tvunit':
                labourPercentage = salesOrder.tvunit_labour_percentage || salesOrder.labour_percentage || 30;
                break;
              default:
                labourPercentage = salesOrder.labour_percentage || 30;
            }
            
            const labourCharge = (sectionItemsTotal * labourPercentage) / 100;
            if (labourCharge > 0) {
              items.push({
                itemNumber: String(itemNumber),
                quantity: 1,
                unit: "sum",
                description: `Labour Charge (${labourPercentage}%)`,
                unitPrice: labourCharge.toFixed(2),
                total: labourCharge.toFixed(2)
              });
              itemNumber++;
            }
          }
        }

        // Insert section summary row
        let sectionSummaryTotal = itemsInCategory.reduce((sum, item) => sum + (item.total_price || 0), 0);
        
        if (category === 'worktop' && salesOrder.worktop_labor_qty && salesOrder.worktop_labor_unit_price) {
          sectionSummaryTotal += salesOrder.worktop_labor_qty * salesOrder.worktop_labor_unit_price;
        }

        // Add labour charge to section total if it exists (for non-worktop sections)
        if (category !== 'worktop' && category !== 'cabinet' && itemsInCategory.length > 0) {
          const sectionItemsTotal = itemsInCategory.reduce((sum, item) => sum + (item.total_price || 0), 0);
          
          // Get the correct labour percentage for this specific section
          let labourPercentage = salesOrder.labour_percentage || 30; // Use general labour_percentage as default
          switch (category) {
            case 'accessories':
              labourPercentage = salesOrder.accessories_labour_percentage || salesOrder.labour_percentage || 30;
              break;
            case 'appliances':
              labourPercentage = salesOrder.appliances_labour_percentage || salesOrder.labour_percentage || 30;
              break;
            case 'wardrobes':
              labourPercentage = salesOrder.wardrobes_labour_percentage || salesOrder.labour_percentage || 30;
              break;
            case 'tvunit':
              labourPercentage = salesOrder.tvunit_labour_percentage || salesOrder.labour_percentage || 30;
              break;
            default:
              labourPercentage = salesOrder.labour_percentage || 30;
          }
          
          const labourCharge = (sectionItemsTotal * labourPercentage) / 100;
          if (labourCharge > 0) {
            sectionSummaryTotal += labourCharge;
          }
        }
        
        items.push({
          isSectionSummary: true,
          itemNumber: "",
          quantity: "",
          unit: "",
          description: `${sectionLabel} Total`,
          unitPrice: "",
          total: sectionSummaryTotal.toFixed(2) // Always show total, even if 0.00
        });
      });

      // Parse terms and conditions
      const parseTermsAndConditions = (termsText: string) => {
        return (termsText || "").split('\n').filter(line => line.trim());
      };

      // Generate PDF for download
      const { template, inputs } = await generateQuotationPDF({
        companyName: "CABINET MASTER STYLES & FINISHES",
        companyLocation: "Location: Ruiru Eastern By-Pass",
        companyPhone: "Tel: +254729554475",
        companyEmail: "Email: cabinetmasterstyles@gmail.com",
        clientNames: salesOrder.client?.name || "",
        siteLocation: salesOrder.client?.location || "",
        mobileNo: salesOrder.client?.phone || "",
        date: new Date(salesOrder.date_created).toLocaleDateString(),
        deliveryNoteNo: "Delivery Note No.",
        quotationNumber: salesOrder.order_number,
        originalQuotationNumber: salesOrder.original_quotation_number || "",  // Add original quotation number
        documentTitle: "SALES ORDER", // This makes it show "SALES ORDER" instead of "QUOTATION"
        items,


        total: salesOrder.grand_total || 0,
        notes: salesOrder.notes || "",
        terms: parseTermsAndConditions(salesOrder.terms_conditions || ""),
        preparedBy: "",
        approvedBy: "",
        companyLogo: logoBase64,
        watermarkLogo: watermarkBase64
      });

      const pdf = await generate({
        template,
        inputs,
        plugins: { text, rectangle, line, image }
      });
      
      // Download the PDF
      const blob = new Blob([new Uint8Array(pdf.buffer)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-order-${salesOrder.order_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Sales order downloaded successfully!");
    } catch (error) {
      console.error('Error downloading sales order:', error);
      toast.error("Failed to download sales order. Please try again.");
    }
  }



  // Export function
  const exportSalesOrders = () => {
    exportSalesOrdersReport(salesOrders)
  }

  return (
    <div className="sales-orders-view">
      <div>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5>Sales Orders</h5>
        </div>

        {/* Search and Filter Row */}
        <div className="sales-orders-search-filter mb-3">
          {/* Desktop Layout */}
          <div className="d-none d-md-block">
            <div className="row">
              <div className="col-md-3">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0">
                    <i className="fas fa-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search sales orders..."
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
                  onClick={exportSalesOrders}
                  style={{ borderRadius: "16px", height: "45px", transition: "all 0.3s ease" }}
                >
                  <Download size={16} className="me-2" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="d-block d-md-none">
            {/* Search Input - Full Row */}
            <div className="mb-3">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="fas fa-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search sales orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ borderRadius: "0 16px 16px 0", height: "45px" }}
                />
              </div>
            </div>

            {/* Filters and Export Button - Shared Row */}
            <div className="d-flex gap-2">
              <div className="flex-fill">
                <select
                  className="form-select border-0 shadow-sm w-100"
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
              <div className="flex-fill">
                <select
                  className="form-select border-0 shadow-sm w-100"
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
              </div>
              <div className="flex-fill">
                <button
                  className="btn w-100 shadow-sm export-btn"
                  onClick={exportSalesOrders}
                  style={{ borderRadius: "16px", height: "45px", transition: "all 0.3s ease" }}
                >
                  <Download size={16} className="me-2" />
                  Export
                </button>
              </div>
            </div>

            {/* Mobile Date Inputs */}
            {dateFilter === "specific" && (
              <div className="mt-2">
                <input
                  type="date"
                  className="form-control border-0 shadow-sm w-100"
                  value={specificDate}
                  onChange={(e) => setSpecificDate(e.target.value)}
                  style={{ borderRadius: "16px", height: "45px" }}
                />
              </div>
            )}
            
            {dateFilter === "period" && (
              <div className="mt-2">
                <div className="d-flex gap-2">
                  <input
                    type="date"
                    className="form-control border-0 shadow-sm flex-fill"
                    placeholder="Start Date"
                    value={periodStartDate}
                    onChange={(e) => setPeriodStartDate(e.target.value)}
                    style={{ borderRadius: "16px", height: "45px" }}
                  />
                  <input
                    type="date"
                    className="form-control border-0 shadow-sm flex-fill"
                    placeholder="End Date"
                    value={periodEndDate}
                    onChange={(e) => setPeriodEndDate(e.target.value)}
                    style={{ borderRadius: "16px", height: "45px" }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Sales Orders Table */}
      <div className="card table-section">
          <div className="w-full overflow-x-auto">
            <table className="table table-hover">
          <thead>
            <tr>
              <th>Order #</th>
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
            ) : filteredSalesOrders.length === 0 ? (
              <tr>
                  <td colSpan={6} className="text-center py-4 text-muted">
                  No sales orders found
                </td>
              </tr>
            ) : (
                filteredSalesOrders.map((salesOrder) => (
                  <tr key={salesOrder.id}>
                    <td>{salesOrder.order_number}</td>
                    <td>{new Date(salesOrder.date_created).toLocaleDateString()}</td>
                    <td>{salesOrder.client?.name || "Unknown"}</td>
                    <td>KES {salesOrder.grand_total?.toFixed(2) || "0.00"}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(salesOrder.status)}`}>
                        {salesOrder.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td>
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-sm action-btn"
                          onClick={() => handleView(salesOrder)}
                          title="View"
                        >
                      <Eye size={14} />
                    </button>
                        {salesOrder.status !== "converted_to_invoice" && (
                          <button
                            className="btn btn-sm action-btn"
                            onClick={() => handleEdit(salesOrder)}
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                        )}
                        <button
                          className="btn btn-sm action-btn"
                          onClick={() => handleDelete(salesOrder)}
                          title="Delete"
                        >
                      <Trash2 size={14} />
                    </button>
                        <button
                          className="btn btn-sm action-btn"
                          onClick={() => handlePrint(salesOrder)}
                          title="Print"
                        >
                          <Printer size={14} />
                        </button>
                        <button
                          className="btn btn-sm action-btn"
                          onClick={() => handleDownload(salesOrder)}
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
      </div>
    </div>

      {/* Sales Order Modal */}
      <SalesOrderModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleModalSave}
        salesOrder={selectedSalesOrder}
        mode={modalMode}
        onProceedToInvoice={handleProceedToInvoice}
        onProceedToCashSale={handleProceedToCashSale}
      />
      </div>
    </div>
  )
}

export default SalesOrdersView
