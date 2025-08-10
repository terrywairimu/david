"use client"

import React, { useEffect, useState } from "react"
import { Plus, Edit, Trash2, Eye, Download, FileText, Receipt, Printer } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import InvoiceModal from "@/components/ui/invoice-modal"
import { 
  proceedToCashSaleFromInvoice, 
  printDocument, 
  downloadDocument,
  exportInvoices as exportInvoicesReport
} from "@/lib/workflow-utils"

interface Invoice {
  id: number
  invoice_number: string
  client_id: number
  sales_order_id?: number
  original_quotation_number?: string
  date_created: string
  due_date: string
  cabinet_total: number
  worktop_total: number
  accessories_total: number
  appliances_total?: number
  wardrobes_total?: number
  tvunit_total?: number
  labour_percentage: number
  labour_total: number
  total_amount: number
  grand_total: number
  paid_amount: number
  balance_amount: number
  vat_amount?: number
  vat_percentage?: number
  worktop_labor_qty?: number
  worktop_labor_unit_price?: number
  include_accessories: boolean
  include_worktop?: boolean
  include_appliances?: boolean
  include_wardrobes?: boolean
  include_tvunit?: boolean
  cabinet_labour_percentage?: number
  accessories_labour_percentage?: number
  appliances_labour_percentage?: number
  wardrobes_labour_percentage?: number
  tvunit_labour_percentage?: number
  status: "pending" | "paid" | "overdue" | "cancelled" | "converted_to_cash_sale"
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
    category: "cabinet" | "worktop" | "accessories" | "appliances" | "wardrobes" | "tvunit"
    description: string
    unit: string
    quantity: number
    unit_price: number
    total_price: number
    stock_item_id?: number
  }>
}

const InvoicesView = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [clientFilter, setClientFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [specificDate, setSpecificDate] = useState("")
  const [periodStartDate, setPeriodStartDate] = useState("")
  const [periodEndDate, setPeriodEndDate] = useState("")
  const [clients, setClients] = useState<{ value: string; label: string }[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>()
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("view")

  useEffect(() => {
    fetchInvoices()
    fetchClients()
    
    // Set up real-time subscription for invoices
    const invoicesSubscription = supabase
      .channel('invoices_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, (payload) => {
        console.log('Invoices change detected:', payload)
        fetchInvoices() // Refresh invoices when changes occur
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoice_items' }, (payload) => {
        console.log('Invoice items change detected:', payload)
        fetchInvoices() // Refresh invoices when items change
      })
      .subscribe()

    return () => {
      supabase.removeChannel(invoicesSubscription)
    }
  }, [])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          client:registered_entities(id, name, phone, location),
          items:invoice_items(*)
        `)
        .order("date_created", { ascending: false })

      if (error) throw error
      setInvoices(data || [])
    } catch (error) {
        console.error("Error fetching invoices:", error)
      toast.error("Failed to fetch invoices")
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
      setClients(data?.map(client => ({ value: client.id.toString(), label: client.name })) || [])
    } catch (error) {
      console.error("Error fetching clients:", error)
    }
  }

  const handleDateFilterChange = (value: string) => {
    setDateFilter(value)
      setSpecificDate("")
      setPeriodStartDate("")
      setPeriodEndDate("")
  }

  const getFilteredInvoices = () => {
    let filtered = invoices

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.original_quotation_number?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Client filter
    if (clientFilter) {
      filtered = filtered.filter(invoice => invoice.client_id.toString() === clientFilter)
    }

    // Date filter
    if (dateFilter === "today") {
      const today = new Date().toISOString().split('T')[0]
      filtered = filtered.filter(invoice => invoice.date_created.startsWith(today))
    } else if (dateFilter === "yesterday") {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      filtered = filtered.filter(invoice => invoice.date_created.startsWith(yesterdayStr))
    } else if (dateFilter === "this_week") {
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.date_created)
        return invoiceDate >= startOfWeek && invoiceDate <= endOfWeek
      })
    } else if (dateFilter === "this_month") {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0)
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.date_created)
        return invoiceDate >= startOfMonth && invoiceDate <= endOfMonth
      })
    } else if (dateFilter === "specific_date" && specificDate) {
      filtered = filtered.filter(invoice => invoice.date_created.startsWith(specificDate))
    } else if (dateFilter === "date_range" && periodStartDate && periodEndDate) {
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.date_created)
              const startDate = new Date(periodStartDate)
              const endDate = new Date(periodEndDate)
        return invoiceDate >= startDate && invoiceDate <= endDate
      })
    }

    return filtered
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-warning text-dark"
      case "paid":
        return "bg-success"
      case "overdue":
        return "bg-danger"
      case "cancelled":
        return "bg-secondary"
      case "converted_to_cash_sale":
        return "bg-info"
      default:
        return "bg-secondary"
    }
  }

  const handleModalSave = async (invoiceData: any) => {
    try {
      setLoading(true)

      if (modalMode === "edit" && selectedInvoice) {
        // Update existing invoice
        const { error: invoiceError } = await supabase
          .from("invoices")
          .update({
            invoice_number: invoiceData.invoice_number,
            client_id: invoiceData.client_id,
            date_created: invoiceData.date_created,
            due_date: invoiceData.due_date,
            cabinet_total: invoiceData.cabinet_total,
            worktop_total: invoiceData.worktop_total,
            accessories_total: invoiceData.accessories_total,
            appliances_total: invoiceData.appliances_total,
            wardrobes_total: invoiceData.wardrobes_total,
            tvunit_total: invoiceData.tvunit_total,
            labour_percentage: invoiceData.labour_percentage,
            labour_total: invoiceData.labour_total,
            total_amount: invoiceData.total_amount,
            grand_total: invoiceData.grand_total,
            vat_percentage: invoiceData.vat_percentage,
            vat_amount: invoiceData.vat_amount,
            include_accessories: invoiceData.include_accessories,
            include_worktop: invoiceData.include_worktop,
            include_appliances: invoiceData.include_appliances,
            include_wardrobes: invoiceData.include_wardrobes,
            include_tvunit: invoiceData.include_tvunit,
            cabinet_labour_percentage: invoiceData.cabinet_labour_percentage,
            accessories_labour_percentage: invoiceData.accessories_labour_percentage,
            appliances_labour_percentage: invoiceData.appliances_labour_percentage,
            wardrobes_labour_percentage: invoiceData.wardrobes_labour_percentage,
            tvunit_labour_percentage: invoiceData.tvunit_labour_percentage,
            worktop_labor_qty: invoiceData.worktop_labor_qty,
            worktop_labor_unit_price: invoiceData.worktop_labor_unit_price,
            notes: invoiceData.notes,
            terms_conditions: invoiceData.terms_conditions,
            section_names: invoiceData.section_names
          })
          .eq("id", selectedInvoice.id)

        if (invoiceError) throw invoiceError

        // Update invoice items
        if (invoiceData.items && invoiceData.items.length > 0) {
          // Delete existing items
          const { error: deleteError } = await supabase
            .from("invoice_items")
            .delete()
            .eq("invoice_id", selectedInvoice.id)

          if (deleteError) throw deleteError

          // Insert new items
          const invoiceItems = invoiceData.items.map((item: any) => ({
            invoice_id: selectedInvoice.id,
            category: item.category,
            description: item.description,
            unit: item.unit,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            stock_item_id: item.stock_item_id
          }))

          const { error: itemsError } = await supabase
            .from("invoice_items")
            .insert(invoiceItems)

          if (itemsError) throw itemsError
        }

        toast.success("Invoice updated successfully")
      } else {
        // Create new invoice
        const { data: newInvoice, error: invoiceError } = await supabase
          .from("invoices")
          .insert({
            invoice_number: invoiceData.invoice_number,
            client_id: invoiceData.client_id,
            sales_order_id: invoiceData.sales_order_id,
            original_quotation_number: invoiceData.original_quotation_number,
            date_created: invoiceData.date_created,
            due_date: invoiceData.due_date,
            cabinet_total: invoiceData.cabinet_total,
            worktop_total: invoiceData.worktop_total,
            accessories_total: invoiceData.accessories_total,
            appliances_total: invoiceData.appliances_total,
            wardrobes_total: invoiceData.wardrobes_total,
            tvunit_total: invoiceData.tvunit_total,
            labour_percentage: invoiceData.labour_percentage,
            labour_total: invoiceData.labour_total,
            total_amount: invoiceData.total_amount,
            grand_total: invoiceData.grand_total,
            paid_amount: invoiceData.paid_amount || 0,
            balance_amount: invoiceData.balance_amount || invoiceData.grand_total,
            vat_percentage: invoiceData.vat_percentage,
            vat_amount: invoiceData.vat_amount,
            include_accessories: invoiceData.include_accessories,
            include_worktop: invoiceData.include_worktop,
            include_appliances: invoiceData.include_appliances,
            include_wardrobes: invoiceData.include_wardrobes,
            include_tvunit: invoiceData.include_tvunit,
            cabinet_labour_percentage: invoiceData.cabinet_labour_percentage,
            accessories_labour_percentage: invoiceData.accessories_labour_percentage,
            appliances_labour_percentage: invoiceData.appliances_labour_percentage,
            wardrobes_labour_percentage: invoiceData.wardrobes_labour_percentage,
            tvunit_labour_percentage: invoiceData.tvunit_labour_percentage,
            worktop_labor_qty: invoiceData.worktop_labor_qty,
            worktop_labor_unit_price: invoiceData.worktop_labor_unit_price,
            status: "pending",
            notes: invoiceData.notes,
            terms_conditions: invoiceData.terms_conditions,
            section_names: invoiceData.section_names
          })
          .select()
          .single()

        if (invoiceError) throw invoiceError

        // Insert invoice items
        if (invoiceData.items && invoiceData.items.length > 0) {
          const invoiceItems = invoiceData.items.map((item: any) => ({
            invoice_id: newInvoice.id,
            category: item.category,
            description: item.description,
            unit: item.unit,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            stock_item_id: item.stock_item_id
          }))

          const { error: itemsError } = await supabase
            .from("invoice_items")
            .insert(invoiceItems)

          if (itemsError) throw itemsError
        }

        toast.success("Invoice created successfully")
      }

      setShowModal(false)
      fetchInvoices()
    } catch (error) {
      console.error("Error saving invoice:", error)
      toast.error("Failed to save invoice")
    } finally {
      setLoading(false)
    }
  }

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setModalMode("view")
    setShowModal(true)
  }

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setModalMode("edit")
    setShowModal(true)
  }

  const handleCreate = () => {
    setSelectedInvoice(undefined)
    setModalMode("create")
    setShowModal(true)
  }

  const handleDelete = async (invoice: Invoice) => {
    if (window.confirm(`Are you sure you want to delete invoice ${invoice.invoice_number}?`)) {
      try {
        const { error } = await supabase
          .from("invoices")
          .delete()
          .eq("id", invoice.id)

        if (error) throw error

        toast.success("Invoice deleted successfully")
        fetchInvoices()
      } catch (error) {
        console.error("Error deleting invoice:", error)
        toast.error("Failed to delete invoice")
      }
    }
  }

  const handleProceedToCashSale = async (invoice: Invoice) => {
    try {
      const cashSale = await proceedToCashSaleFromInvoice(invoice.id)
      toast.success(`Cash sale ${cashSale.sale_number} created successfully`)
      fetchInvoices()
    } catch (error) {
      // Error handling is done in the workflow function
    }
  }

  const handlePrint = async (invoice: Invoice) => {
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
      const grouped = invoice.items?.reduce((acc, item) => {
        (acc[item.category] = acc[item.category] || []).push(item);
        return acc;
      }, {} as Record<string, typeof invoice.items>) || {};

      // Define the default section order
      const sectionOrder = ['cabinet', 'worktop', 'accessories', 'appliances', 'wardrobes', 'tvunit'];
      
      // Process sections in the defined order
      sectionOrder.forEach((category) => {
        const itemsInCategory = grouped[category] || [];
        if (itemsInCategory.length === 0) return; // Skip empty sections
        // Section mapping
        const sectionLabels: { [key: string]: string } = {
          cabinet: invoice.section_names?.cabinet || "General",
          worktop: invoice.section_names?.worktop || "Worktop", 
          accessories: invoice.section_names?.accessories || "Accessories",
          appliances: invoice.section_names?.appliances || "Appliances",
          wardrobes: invoice.section_names?.wardrobes || "Wardrobes",
          tvunit: invoice.section_names?.tvunit || "TV Unit"
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
        if (category === 'worktop' && invoice.worktop_labor_qty && invoice.worktop_labor_unit_price) {
          items.push({
            itemNumber: String(itemNumber),
            quantity: invoice.worktop_labor_qty,
            unit: "per slab",
            description: "Worktop Installation Labor",
            unitPrice: invoice.worktop_labor_unit_price.toFixed(2),
            total: (invoice.worktop_labor_qty * invoice.worktop_labor_unit_price).toFixed(2)
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
            let labourPercentage = invoice.labour_percentage || 30; // Use general labour_percentage as default
            switch (category) {
              case 'cabinet':
                labourPercentage = invoice.cabinet_labour_percentage || invoice.labour_percentage || 30;
                break;
              case 'accessories':
                labourPercentage = invoice.accessories_labour_percentage || invoice.labour_percentage || 30;
                break;
              case 'appliances':
                labourPercentage = invoice.appliances_labour_percentage || invoice.labour_percentage || 30;
                break;
              case 'wardrobes':
                labourPercentage = invoice.wardrobes_labour_percentage || invoice.labour_percentage || 30;
                break;
              case 'tvunit':
                labourPercentage = invoice.tvunit_labour_percentage || invoice.labour_percentage || 30;
                break;
            }
            
            const labourAmount = (sectionItemsTotal * labourPercentage) / 100;
            
            if (labourAmount > 0) {
              items.push({
                itemNumber: String(itemNumber),
                quantity: "",
                unit: "",
                description: `Labour Charge (${labourPercentage}%)`,
                unitPrice: "",
                total: labourAmount.toFixed(2)
              });
              itemNumber++;
            }
          }
        }

        // Insert section summary row
        let sectionTotal = itemsInCategory.reduce((sum, item) => sum + (item.total_price || 0), 0);
        
        // Add worktop labor to section total if it exists
        if (category === 'worktop' && invoice.worktop_labor_qty && invoice.worktop_labor_unit_price) {
          sectionTotal += invoice.worktop_labor_qty * invoice.worktop_labor_unit_price;
        }

        // Add labour charge to section total if it exists (for non-worktop sections)
        if (category !== 'worktop' && category !== 'cabinet' && itemsInCategory.length > 0) {
          const sectionItemsTotal = itemsInCategory.reduce((sum, item) => sum + (item.total_price || 0), 0);
          
          // Get the correct labour percentage for this specific section
          let labourPercentage = invoice.labour_percentage || 30; // Use general labour_percentage as default
          switch (category) {
            case 'accessories':
              labourPercentage = invoice.accessories_labour_percentage || invoice.labour_percentage || 30;
              break;
            case 'appliances':
              labourPercentage = invoice.appliances_labour_percentage || invoice.labour_percentage || 30;
              break;
            case 'wardrobes':
              labourPercentage = invoice.wardrobes_labour_percentage || invoice.labour_percentage || 30;
              break;
            case 'tvunit':
              labourPercentage = invoice.tvunit_labour_percentage || invoice.labour_percentage || 30;
              break;
            default:
              labourPercentage = invoice.labour_percentage || 30;
          }
          
          const labourCharge = (sectionItemsTotal * labourPercentage) / 100;
          if (labourCharge > 0) {
            sectionTotal += labourCharge;
          }
        }
        
        const summaryRow = {
          isSectionSummary: true,
          itemNumber: "",
          quantity: "",
          unit: "",
          description: `${sectionLabel} Total`,
          unitPrice: "",
          total: sectionTotal.toFixed(2) // Always show total, even if 0.00
        };
        
        items.push(summaryRow);
      });

      // Parse terms and conditions
      const parseTermsAndConditions = (termsText: string) => {
        return (termsText || "").split('\n').filter(line => line.trim());
      };

      // Generate PDF using the same function as quotation but with "INVOICE" title
      const { template, inputs } = await generateQuotationPDF({
        companyName: "CABINET MASTER STYLES & FINISHES",
        companyLocation: "Location: Ruiru Eastern By-Pass",
        companyPhone: "Tel: +254729554475",
        companyEmail: "Email: cabinetmasterstyles@gmail.com",
        clientNames: invoice.client?.name || "",
        siteLocation: invoice.client?.location || "",
        mobileNo: invoice.client?.phone || "",
        date: new Date(invoice.date_created).toLocaleDateString(),
        deliveryNoteNo: "Delivery Note No.",
        quotationNumber: invoice.invoice_number,
        originalQuotationNumber: invoice.original_quotation_number || "",
        documentTitle: "INVOICE", // This makes it show "INVOICE" instead of "QUOTATION"
        items,


        total: invoice.grand_total || 0,
        notes: invoice.notes || "",
        terms: parseTermsAndConditions(invoice.terms_conditions || ""),
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
      
      // Check if mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // For mobile devices, open hidden iframe and invoke print in same tab
        const iframe = document.createElement('iframe')
        iframe.style.position = 'fixed'
        iframe.style.right = '0'
        iframe.style.bottom = '0'
        iframe.style.width = '0'
        iframe.style.height = '0'
        iframe.style.border = '0'
        document.body.appendChild(iframe)
        const cleanup = () => { try { document.body.removeChild(iframe) } catch {} }
        iframe.onload = () => {
          setTimeout(() => {
            try { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); } catch {}
            // @ts-ignore
            if (iframe.contentWindow) iframe.contentWindow.onafterprint = cleanup
            setTimeout(cleanup, 2000)
          }, 250)
        }
        iframe.src = url
      } else {
        // For desktop, use automatic print
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
      }
      
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Error printing invoice:", error);
      toast.error("Failed to print invoice");
    }
  }

  const handleDownload = async (invoice: Invoice) => {
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
      const grouped = invoice.items?.reduce((acc, item) => {
        (acc[item.category] = acc[item.category] || []).push(item);
        return acc;
      }, {} as Record<string, typeof invoice.items>) || {};

      // Define the default section order
      const sectionOrder = ['cabinet', 'worktop', 'accessories', 'appliances', 'wardrobes', 'tvunit'];
      
      // Process sections in the defined order
      sectionOrder.forEach((category) => {
        const itemsInCategory = grouped[category] || [];
        if (itemsInCategory.length === 0) return; // Skip empty sections
        // Section mapping
        const sectionLabels: { [key: string]: string } = {
          cabinet: invoice.section_names?.cabinet || "General",
          worktop: invoice.section_names?.worktop || "Worktop", 
          accessories: invoice.section_names?.accessories || "Accessories",
          appliances: invoice.section_names?.appliances || "Appliances",
          wardrobes: invoice.section_names?.wardrobes || "Wardrobes",
          tvunit: invoice.section_names?.tvunit || "TV Unit"
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
        if (category === 'worktop' && invoice.worktop_labor_qty && invoice.worktop_labor_unit_price) {
          items.push({
            itemNumber: String(itemNumber),
            quantity: invoice.worktop_labor_qty,
            unit: "per slab",
            description: "Worktop Installation Labor",
            unitPrice: invoice.worktop_labor_unit_price.toFixed(2),
            total: (invoice.worktop_labor_qty * invoice.worktop_labor_unit_price).toFixed(2)
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
            let labourPercentage = invoice.labour_percentage || 30; // Use general labour_percentage as default
            switch (category) {
              case 'cabinet':
                labourPercentage = invoice.cabinet_labour_percentage || invoice.labour_percentage || 30;
                break;
              case 'accessories':
                labourPercentage = invoice.accessories_labour_percentage || invoice.labour_percentage || 30;
                break;
              case 'appliances':
                labourPercentage = invoice.appliances_labour_percentage || invoice.labour_percentage || 30;
                break;
              case 'wardrobes':
                labourPercentage = invoice.wardrobes_labour_percentage || invoice.labour_percentage || 30;
                break;
              case 'tvunit':
                labourPercentage = invoice.tvunit_labour_percentage || invoice.labour_percentage || 30;
                break;
            }
            
            const labourAmount = (sectionItemsTotal * labourPercentage) / 100;
            
            if (labourAmount > 0) {
              items.push({
                itemNumber: String(itemNumber),
                quantity: "",
                unit: "",
                description: `Labour Charge (${labourPercentage}%)`,
                unitPrice: "",
                total: labourAmount.toFixed(2)
              });
              itemNumber++;
            }
          }
        }

        // Insert section summary row
        let sectionTotal = itemsInCategory.reduce((sum, item) => sum + (item.total_price || 0), 0);
        
        // Add worktop labor to section total if it exists
        if (category === 'worktop' && invoice.worktop_labor_qty && invoice.worktop_labor_unit_price) {
          sectionTotal += invoice.worktop_labor_qty * invoice.worktop_labor_unit_price;
        }

        // Add labour charge to section total if it exists (for non-worktop sections)
        if (category !== 'worktop' && category !== 'cabinet' && itemsInCategory.length > 0) {
          const sectionItemsTotal = itemsInCategory.reduce((sum, item) => sum + (item.total_price || 0), 0);
          
          // Get the correct labour percentage for this specific section
          let labourPercentage = invoice.labour_percentage || 30; // Use general labour_percentage as default
          switch (category) {
            case 'accessories':
              labourPercentage = invoice.accessories_labour_percentage || invoice.labour_percentage || 30;
              break;
            case 'appliances':
              labourPercentage = invoice.appliances_labour_percentage || invoice.labour_percentage || 30;
              break;
            case 'wardrobes':
              labourPercentage = invoice.wardrobes_labour_percentage || invoice.labour_percentage || 30;
              break;
            case 'tvunit':
              labourPercentage = invoice.tvunit_labour_percentage || invoice.labour_percentage || 30;
              break;
            default:
              labourPercentage = invoice.labour_percentage || 30;
          }
          
          const labourCharge = (sectionItemsTotal * labourPercentage) / 100;
          if (labourCharge > 0) {
            sectionTotal += labourCharge;
          }
        }
        
        const summaryRow = {
          isSectionSummary: true,
          itemNumber: "",
          quantity: "",
          unit: "",
          description: `${sectionLabel} Total`,
          unitPrice: "",
          total: sectionTotal.toFixed(2) // Always show total, even if 0.00
        };
        
        items.push(summaryRow);
      });

      // Parse terms and conditions
      const parseTermsAndConditions = (termsText: string) => {
        return (termsText || "").split('\n').filter(line => line.trim());
      };

      // Generate PDF using the same function as quotation but with "INVOICE" title
      const { template, inputs } = await generateQuotationPDF({
        companyName: "CABINET MASTER STYLES & FINISHES",
        companyLocation: "Location: Ruiru Eastern By-Pass",
        companyPhone: "Tel: +254729554475",
        companyEmail: "Email: cabinetmasterstyles@gmail.com",
        clientNames: invoice.client?.name || "",
        siteLocation: invoice.client?.location || "",
        mobileNo: invoice.client?.phone || "",
        date: new Date(invoice.date_created).toLocaleDateString(),
        deliveryNoteNo: "Delivery Note No.",
        quotationNumber: invoice.invoice_number,
        originalQuotationNumber: invoice.original_quotation_number || "",
        documentTitle: "INVOICE", // This makes it show "INVOICE" instead of "QUOTATION"
        items,


        total: invoice.grand_total || 0,
        notes: invoice.notes || "",
        terms: parseTermsAndConditions(invoice.terms_conditions || ""),
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
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice");
    }
  }

  const exportInvoices = () => {
    try {
      const filteredInvoices = getFilteredInvoices()
      exportInvoicesReport(filteredInvoices)
    } catch (error) {
      console.error("Error exporting invoices:", error)
      toast.error("Failed to export invoices")
    }
  }

  const filteredInvoices = getFilteredInvoices()

  return (
    <div className="invoices-view">
      <div>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5>Invoices</h5>
        </div>

        {/* Search and Filter Row */}
        <div className="invoices-search-filter mb-3">
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
                    placeholder="Search invoices..."
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
                  <option value="">All Clients</option>
                  {clients.map(client => (
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
                  <option value="yesterday">Yesterday</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="specific_date">Specific Date</option>
                  <option value="date_range">Date Range</option>
                </select>
                
                {dateFilter === "specific_date" && (
                  <input
                    type="date"
                    className="form-control border-0 shadow-sm mt-2"
                    value={specificDate}
                    onChange={(e) => setSpecificDate(e.target.value)}
                    style={{ borderRadius: "16px", height: "45px" }}
                  />
                )}
                
                {dateFilter === "date_range" && (
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
                  onClick={exportInvoices}
                  style={{ borderRadius: "16px", height: "45px", transition: "all 0.3s ease" }}
                >
                  <FileText className="me-2" size={16} />
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
                  placeholder="Search invoices..."
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
                  <option value="">All Clients</option>
                  {clients.map(client => (
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
                  <option value="yesterday">Yesterday</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="specific_date">Specific Date</option>
                  <option value="date_range">Date Range</option>
                </select>
              </div>
              <div className="flex-fill">
                <button
                  className="btn w-100 shadow-sm export-btn"
                  onClick={exportInvoices}
                  style={{ borderRadius: "16px", height: "45px", transition: "all 0.3s ease" }}
                >
                  <FileText className="me-2" size={16} />
                  Export
                </button>
              </div>
            </div>

            {/* Mobile Date Inputs */}
            {dateFilter === "specific_date" && (
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
            
            {dateFilter === "date_range" && (
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

        {/* Invoices Table */}
        <div className="card table-section">
          <div className="w-full overflow-x-auto">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Client</th>
                  <th>Total Amount</th>
                  <th>Paid Amount</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4 text-muted">
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>{invoice.invoice_number}</td>
                      <td>{new Date(invoice.date_created).toLocaleDateString()}</td>
                      <td>{new Date(invoice.due_date).toLocaleDateString()}</td>
                      <td>{invoice.client?.name || "Unknown"}</td>
                      <td>KES {invoice.grand_total?.toFixed(2) || "0.00"}</td>
                      <td>KES {invoice.paid_amount?.toFixed(2) || "0.00"}</td>
                      <td>KES {invoice.balance_amount?.toFixed(2) || "0.00"}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(invoice.status)}`}>
                          {invoice.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button 
                            className="action-btn"
                            onClick={() => handleView(invoice)}
                            title="View"
                          >
                            <Eye size={14} />
                          </button>
                          {invoice.status !== "converted_to_cash_sale" && (
                            <button 
                              className="action-btn"
                              onClick={() => handleEdit(invoice)}
                              title="Edit"
                            >
                              <Edit size={14} />
                            </button>
                          )}
                          <button 
                            className="action-btn"
                            onClick={() => handleDelete(invoice)}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                          <button 
                            className="action-btn"
                            onClick={() => handlePrint(invoice)}
                            title="Print"
                          >
                            <Printer size={14} />
                          </button>
                          <button 
                            className="action-btn"
                            onClick={() => handleDownload(invoice)}
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

        {/* Invoice Modal */}
        <InvoiceModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleModalSave}
          invoice={selectedInvoice}
          mode={modalMode}
        />
      </div>
    </div>
  )
}

export default InvoicesView
