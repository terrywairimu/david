"use client"

import React, { useEffect, useState } from "react"
import { Plus, Edit, Trash2, Eye, Download, FileText, CreditCard, Receipt, Printer } from "lucide-react"
import { useRouter } from "next/navigation"
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
import SearchFilterRow from "@/components/ui/search-filter-row"

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
  cabinet_labour_percentage?: number
  accessories_labour_percentage?: number
  appliances_labour_percentage?: number
  wardrobes_labour_percentage?: number
  tvunit_labour_percentage?: number
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
  worktop_labor_qty?: number
  worktop_labor_unit_price?: number
  section_names?: {
    cabinet: string;
    worktop: string;
    accessories: string;
    appliances: string;
    wardrobes: string;
    tvunit: string;
  };
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
  // Payment tracking fields
  total_paid?: number
  has_payments?: boolean
  payment_percentage?: number
}

const QuotationsView = () => {
  const router = useRouter()
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

        fetchQuotations() // Refresh quotations when changes occur
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotation_items' }, (payload) => {

        fetchQuotations() // Refresh quotations when items change
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registered_entities' }, (payload) => {

        fetchClients() // Refresh clients when changes occur
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, (payload) => {

        fetchQuotations() // Refresh quotations when payments change to update payment status
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
      
      // Fetch payments for each quotation to determine payment status
      const quotationsWithPayments = await Promise.all(
        (data || []).map(async (quotation) => {
          const { data: payments } = await supabase
            .from("payments")
            .select("amount")
            .eq("quotation_number", quotation.quotation_number)
            .eq("status", "completed")
          
          const totalPaid = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
          const hasPayments = totalPaid > 0
          
          return {
            ...quotation,
            total_paid: totalPaid,
            has_payments: hasPayments,
            payment_percentage: quotation.grand_total > 0 ? (totalPaid / quotation.grand_total) * 100 : 0
          }
        })
      )
      
      setQuotations(quotationsWithPayments)
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
            wardrobes_labour_percentage: quotationData.wardrobes_labour_percentage,
            tvunit_labour_percentage: quotationData.tvunit_labour_percentage,
            worktop_labor_qty: quotationData.worktop_labor_qty,
            worktop_labor_unit_price: quotationData.worktop_labor_unit_price,
            vat_amount: quotationData.vat_amount,
            vat_percentage: quotationData.vat_percentage,
            discount_amount: quotationData.discount_amount,
            section_names: quotationData.section_names
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
            wardrobes_labour_percentage: quotationData.wardrobes_labour_percentage,
            tvunit_labour_percentage: quotationData.tvunit_labour_percentage,
            worktop_labor_qty: quotationData.worktop_labor_qty,
            worktop_labor_unit_price: quotationData.worktop_labor_unit_price,
            vat_amount: quotationData.vat_amount,
            vat_percentage: quotationData.vat_percentage,
            discount_amount: quotationData.discount_amount,
            section_names: quotationData.section_names
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
      
      // Automatically navigate to sales orders view
      setTimeout(() => {
        router.push('/sales?tab=orders')
      }, 1000) // Small delay to allow user to see the success message
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
      // Convert watermark logo to base64
      const watermarkBase64 = await imageToBase64('/logowatermark.png');

      // Prepare items data with section headings and improved formatting
      const items: any[] = [];
      const grouped = quotation.items?.reduce((acc, item) => {
        (acc[item.category] = acc[item.category] || []).push(item);
        return acc;
      }, {} as Record<string, typeof quotation.items>) || {};



      // Define the default section order
      const sectionOrder = ['cabinet', 'worktop', 'accessories', 'appliances', 'wardrobes', 'tvunit'];
      
      // Process sections in the defined order
      sectionOrder.forEach((category) => {
        const itemsInCategory = grouped[category] || [];
        if (itemsInCategory.length === 0) return; // Skip empty sections
        
        // Check if section is visible based on include flags
        let isSectionVisible = true;
        switch (category) {
          case 'worktop':
            isSectionVisible = quotation.include_worktop || false;
            break;
          case 'accessories':
            isSectionVisible = quotation.include_accessories || false;
            break;
          case 'appliances':
            isSectionVisible = quotation.include_appliances || false;
            break;
          case 'wardrobes':
            isSectionVisible = quotation.include_wardrobes || false;
            break;
          case 'tvunit':
            isSectionVisible = quotation.include_tvunit || false;
            break;
          case 'cabinet':
            // Cabinet is always visible
            isSectionVisible = true;
            break;
        }
        
        if (!isSectionVisible) return; // Skip hidden sections
        
        // Use dynamic section name if available, type-safe
        const allowedKeys = [
          'cabinet', 'worktop', 'accessories', 'appliances', 'wardrobes', 'tvunit'
        ] as const;
        type SectionKey = typeof allowedKeys[number];
        const safeCategory = allowedKeys.includes(category as SectionKey) ? category as SectionKey : undefined;
        const sectionLabel = safeCategory && quotation.section_names?.[safeCategory]
          ? quotation.section_names[safeCategory]
          : category.charAt(0).toUpperCase() + category.slice(1);
        // Insert section heading row (all caps, large font, special flag)
        items.push({
          isSection: true,
          itemNumber: "",
          quantity: "",
          unit: "",
          description: sectionLabel.toUpperCase(),
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
        
        // Debug: Log items added for this category

        
        // Special handling for worktop category: add worktop labor item if it exists
        if (category === 'worktop' && quotation.worktop_labor_qty && quotation.worktop_labor_unit_price) {
          const worktopLaborItem = {
            isSection: false,
            itemNumber: String(itemsInCategory.length + 1),
            quantity: quotation.worktop_labor_qty,
            unit: "per slab",
            description: "Worktop Installation Labor",
            unitPrice: quotation.worktop_labor_unit_price,
            total: quotation.worktop_labor_qty * quotation.worktop_labor_unit_price
          };
          items.push(worktopLaborItem);
          // Worktop labor item added
        }

        // Do not add a synthetic Labour Charge row - only show labour if it exists in saved items (add labour was toggled on when saved)
        
        // Insert section summary row after all items in this section (sum of saved items only)
        let sectionTotal1 = itemsInCategory.reduce((sum, item) => sum + (item.total_price || 0), 0);
        
        // Add worktop labor to section total if it exists
        if (category === 'worktop' && quotation.worktop_labor_qty && quotation.worktop_labor_unit_price) {
          sectionTotal1 += quotation.worktop_labor_qty * quotation.worktop_labor_unit_price;
        }
        
        const summaryRow = {
          isSectionSummary: true,
          itemNumber: "",
          quantity: "",
          unit: "",
          description: `${sectionLabel} Total`,
          unitPrice: "",
          total: sectionTotal1.toFixed(2) // Always show total, even if 0.00
        };
        
        items.push(summaryRow);
      });

      // Debug: Log the final items array
      console.log('Final items array for PDF:', items);

      // Calculate section totals for PDF
      const sectionTotals: Array<{name: string, total: number}> = [];
      
      sectionOrder.forEach((category) => {
        const itemsInCategory = grouped[category] || [];
        if (itemsInCategory.length === 0) return;
        
        // Check if section is visible based on include flags
        let isSectionVisible = true;
        switch (category) {
          case 'worktop':
            isSectionVisible = quotation.include_worktop || false;
            break;
          case 'accessories':
            isSectionVisible = quotation.include_accessories || false;
            break;
          case 'appliances':
            isSectionVisible = quotation.include_appliances || false;
            break;
          case 'wardrobes':
            isSectionVisible = quotation.include_wardrobes || false;
            break;
          case 'tvunit':
            isSectionVisible = quotation.include_tvunit || false;
            break;
          case 'cabinet':
            // Cabinet is always visible
            isSectionVisible = true;
            break;
        }
        
        if (!isSectionVisible) return; // Skip hidden sections
        
        // Get section name
        const allowedKeys = [
          'cabinet', 'worktop', 'accessories', 'appliances', 'wardrobes', 'tvunit'
        ] as const;
        type SectionKey = typeof allowedKeys[number];
        const safeCategory = allowedKeys.includes(category as SectionKey) ? category as SectionKey : undefined;
        const sectionLabel = safeCategory && quotation.section_names?.[safeCategory]
          ? quotation.section_names[safeCategory]
          : category.charAt(0).toUpperCase() + category.slice(1);
        
        // Calculate section total (sum of saved items only - labour only if present in items)
        let sectionTotal2 = itemsInCategory.reduce((sum, item) => sum + (item.total_price || 0), 0);
        
        // Add worktop labor to section total if it exists
        if (category === 'worktop' && quotation.worktop_labor_qty && quotation.worktop_labor_unit_price) {
          sectionTotal2 += quotation.worktop_labor_qty * quotation.worktop_labor_unit_price;
        }
        
        // Only add section total if it's greater than 0
        if (sectionTotal2 > 0) {
          sectionTotals.push({
            name: sectionLabel,
            total: sectionTotal2
          });
        }
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
        sectionTotals,
        total: quotation.grand_total || 0,
        notes: quotation.notes || "",
        terms: parseTermsAndConditions(quotation.terms_conditions || ""),
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
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
        if (isIOS) {
          // iOS Safari limitation: navigate to PDF in same tab and let user hit share/print
          window.location.href = url
        } else {
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
        }
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
      // Convert watermark logo to base64
      const watermarkBase64 = await imageToBase64('/logowatermark.png');
      


      // Prepare items data with section headings and improved formatting
      const items: any[] = [];
      const grouped = quotation.items?.reduce((acc, item) => {
        (acc[item.category] = acc[item.category] || []).push(item);
        return acc;
      }, {} as Record<string, typeof quotation.items>) || {};

      // Debug: Log the grouped items structure


      // Define the default section order
      const sectionOrder = ['cabinet', 'worktop', 'accessories', 'appliances', 'wardrobes', 'tvunit'];
      
      // Process sections in the defined order
      sectionOrder.forEach((category) => {
        const itemsInCategory = grouped[category] || [];
        if (itemsInCategory.length === 0) return; // Skip empty sections
        
        // Check if section is visible based on include flags
        let isSectionVisible = true;
        switch (category) {
          case 'worktop':
            isSectionVisible = quotation.include_worktop || false;
            break;
          case 'accessories':
            isSectionVisible = quotation.include_accessories || false;
            break;
          case 'appliances':
            isSectionVisible = quotation.include_appliances || false;
            break;
          case 'wardrobes':
            isSectionVisible = quotation.include_wardrobes || false;
            break;
          case 'tvunit':
            isSectionVisible = quotation.include_tvunit || false;
            break;
          case 'cabinet':
            // Cabinet is always visible
            isSectionVisible = true;
            break;
        }
        
        if (!isSectionVisible) return; // Skip hidden sections
        
        // Calculate section total first to determine if we should include this section
        let sectionTotal3 = itemsInCategory.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0);
        
        // Add worktop labor to section total if it exists
        if (category === 'worktop' && quotation.worktop_labor_qty && quotation.worktop_labor_unit_price) {
          sectionTotal3 += quotation.worktop_labor_qty * quotation.worktop_labor_unit_price;
        }

        // Only include section if total is greater than 0 (sectionTotal3 is sum of items only here)
        if (sectionTotal3 <= 0) return;
        // Debug: Log each category and its items
        // Use dynamic section name if available, type-safe
        const allowedKeys = [
          'cabinet', 'worktop', 'accessories', 'appliances', 'wardrobes', 'tvunit'
        ] as const;
        type SectionKey = typeof allowedKeys[number];
        const safeCategory = allowedKeys.includes(category as SectionKey) ? category as SectionKey : undefined;
        const sectionLabel = safeCategory && quotation.section_names?.[safeCategory]
          ? quotation.section_names[safeCategory]
          : category.charAt(0).toUpperCase() + category.slice(1);
        // Insert section heading row (all caps, large font, special flag)
        items.push({
          isSection: true,
          itemNumber: "",
          quantity: "",
          unit: "",
          description: sectionLabel.toUpperCase(),
          unitPrice: "",
          total: ""
        });
        
        // Debug: Log section heading added
        // Section heading added
        
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
        
        // Debug: Log items added for this category

        
        // Special handling for worktop category: add worktop labor item if it exists
        if (category === 'worktop' && quotation.worktop_labor_qty && quotation.worktop_labor_unit_price) {
          const worktopLaborItem = {
            isSection: false,
            itemNumber: String(itemsInCategory.length + 1),
            quantity: quotation.worktop_labor_qty,
            unit: "per slab",
            description: "Worktop Installation Labor",
            unitPrice: quotation.worktop_labor_unit_price,
            total: quotation.worktop_labor_qty * quotation.worktop_labor_unit_price
          };
          items.push(worktopLaborItem);
          // Worktop labor item added
        }

        // Do not add a synthetic Labour Charge row - only show labour if it exists in saved items (add labour was toggled on when saved)
        
        // Insert section summary row after all items in this section (sum of saved items only)
        let sectionTotal4 = itemsInCategory.reduce((sum, item) => sum + (item.total_price || 0), 0);
        
        // Add worktop labor to section total if it exists
        if (category === 'worktop' && quotation.worktop_labor_qty && quotation.worktop_labor_unit_price) {
          sectionTotal4 += quotation.worktop_labor_qty * quotation.worktop_labor_unit_price;
        }
        
        const summaryRow = {
          isSectionSummary: true,
          itemNumber: "",
          quantity: "",
          unit: "",
          description: `${sectionLabel} Total`,
          unitPrice: "",
          total: sectionTotal4.toFixed(2) // Always show total, even if 0.00
        };
        
        items.push(summaryRow);
      });

      // Debug: Log the final items array
      console.log('Final items array for PDF:', items);

      // Calculate section totals for PDF
      const sectionTotals: Array<{name: string, total: number}> = [];
      
      sectionOrder.forEach((category) => {
        const itemsInCategory = grouped[category] || [];
        if (itemsInCategory.length === 0) return;
        
        // Check if section is visible based on include flags
        let isSectionVisible = true;
        switch (category) {
          case 'worktop':
            isSectionVisible = quotation.include_worktop || false;
            break;
          case 'accessories':
            isSectionVisible = quotation.include_accessories || false;
            break;
          case 'appliances':
            isSectionVisible = quotation.include_appliances || false;
            break;
          case 'wardrobes':
            isSectionVisible = quotation.include_wardrobes || false;
            break;
          case 'tvunit':
            isSectionVisible = quotation.include_tvunit || false;
            break;
          case 'cabinet':
            // Cabinet is always visible
            isSectionVisible = true;
            break;
        }
        
        if (!isSectionVisible) return; // Skip hidden sections
        
        // Get section name
        const allowedKeys = [
          'cabinet', 'worktop', 'accessories', 'appliances', 'wardrobes', 'tvunit'
        ] as const;
        type SectionKey = typeof allowedKeys[number];
        const safeCategory = allowedKeys.includes(category as SectionKey) ? category as SectionKey : undefined;
        const sectionLabel = safeCategory && quotation.section_names?.[safeCategory]
          ? quotation.section_names[safeCategory]
          : category.charAt(0).toUpperCase() + category.slice(1);
        
        // Calculate section total (sum of saved items only - labour only if present in items)
        let sectionTotal5 = itemsInCategory.reduce((sum, item) => sum + (item.total_price || 0), 0);
        
        // Add worktop labor to section total if it exists
        if (category === 'worktop' && quotation.worktop_labor_qty && quotation.worktop_labor_unit_price) {
          sectionTotal5 += quotation.worktop_labor_qty * quotation.worktop_labor_unit_price;
        }
        
        // Only add section total if it's greater than 0
        if (sectionTotal5 > 0) {
          sectionTotals.push({
            name: sectionLabel,
            total: sectionTotal5
          });
        }
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
        sectionTotals,
        total: quotation.grand_total || 0,
        notes: quotation.notes || "",
        terms: parseTermsAndConditions(quotation.terms_conditions || ""),
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
      // Build the filename as clientname-projectlocation-quotation-<quotationNumber>.pdf
      const sanitize = (str: string) => (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const clientName = sanitize(quotation.client?.name || 'client');
      const projectLocation = sanitize(quotation.client?.location || 'location');
      const quotationNumber = quotation.quotation_number || 'quotation';
      const filename = `${clientName}-${projectLocation}-quotation-${quotationNumber}.pdf`;
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Error downloading quotation:', error);
      toast.error("Failed to download quotation. Please try again.");
    }
  };

  const handleNewQuotation = () => {
    setSelectedQuotation(undefined)
    setModalMode("create")
    setShowModal(true)
  };

  // Export function
  const exportQuotations = (format: 'pdf' | 'csv') => {
    const filteredQuotations = getFilteredQuotations()
    exportQuotationsReport(filteredQuotations, format)
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
        <SearchFilterRow
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search quotations..."
          firstFilter={{
            value: clientFilter,
            onChange: setClientFilter,
            options: clients,
            placeholder: "All Clients"
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
          onExport={exportQuotations}
          exportLabel="Export Quotations"
        />

            {/* Quotations Table */}
        <div className="card table-section">
          <div className="responsive-table-wrapper">
            <table className="table table-hover">
            <thead>
              <tr>
              <th className="col-number">Quotation #</th>
                <th className="col-date">Date</th>
              <th className="col-client">Client</th>
              <th className="col-amount">Total Amount</th>
              <th className="col-status">Status</th>
              <th className="col-actions">Actions</th>
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
                        {quotation.status === "pending" && (
                          <button
                            className="btn btn-sm action-btn"
                            onClick={() => handleEdit(quotation)}
                            title="Edit"
                          >
                        <Edit size={14} />
                      </button>
                        )}
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
                          <Printer size={14} />
                        </button>
                        <button
                          className="btn btn-sm action-btn"
                          onClick={() => handleDownload(quotation)}
                          title="Download"
                        >
                          <Download size={14} />
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
          onProceedToSalesOrder={handleProceedToSalesOrder}
        />
      )}
      </div>
    </div>
  )
}

export default QuotationsView
