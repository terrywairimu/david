"use client"

import React, { useEffect, useState } from "react"
import { Plus, Edit, Trash2, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import SearchFilterRow from "@/components/ui/search-filter-row"

interface Quotation {
  id: number
  quotation_number: string
  client_id: number
  date_created: string
  valid_until: string
  total_amount: number
  labour_total: number
  grand_total: number
  status: "draft" | "pending" | "accepted" | "rejected" | "expired"
  notes?: string
  terms_conditions?: string
  client?: {
    id: number
    name: string
    phone?: string
  }
}

const QuotationsView = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [clientFilter, setClientFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [clients, setClients] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    fetchQuotations()
    fetchClients()
  }, [])

  const fetchQuotations = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("quotations")
        .select(`
          *,
          client:registered_entities(*)
        `)
        .order("date_created", { ascending: false })

      if (error) {
        console.error("Error fetching quotations:", error)
        toast.error("Failed to fetch quotations")
      } else {
        setQuotations(data || [])
      }
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
        .eq("status", "active")
        .order("name")

      if (error) {
        console.error("Error fetching clients:", error)
      } else {
        const clientOptions = [
          { value: "", label: "All Clients" },
          ...(data || []).map((client) => ({
            value: client.id.toString(),
            label: client.name,
          })),
        ]
        setClients(clientOptions)
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
    }
  }

  const filteredQuotations = quotations.filter((quotation) => {
    const matchesSearch =
      quotation.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.client?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesClient = clientFilter === "" || quotation.client_id.toString() === clientFilter

    const matchesDate =
      dateFilter === "" ||
      (dateFilter === "today" && new Date(quotation.date_created).toDateString() === new Date().toDateString()) ||
      (dateFilter === "week" && isThisWeek(new Date(quotation.date_created))) ||
      (dateFilter === "month" && isThisMonth(new Date(quotation.date_created)))

    return matchesSearch && matchesClient && matchesDate
  })

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      draft: "badge bg-secondary",
      pending: "badge bg-warning",
      accepted: "badge bg-success",
      rejected: "badge bg-danger",
      expired: "badge bg-dark",
    }
    return statusClasses[status as keyof typeof statusClasses] || "badge bg-secondary"
  }

  const exportToCSV = () => {
    const csvContent = [
      ["Quotation #", "Client", "Date Created", "Valid Until", "Total Amount", "Status"],
      ...filteredQuotations.map((quotation) => [
        quotation.quotation_number,
        quotation.client?.name || "",
        new Date(quotation.date_created).toLocaleDateString(),
        new Date(quotation.valid_until).toLocaleDateString(),
        quotation.total_amount.toFixed(2),
        quotation.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "quotations.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const isThisWeek = (date: Date) => {
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 6)
    return date >= startOfWeek && date <= endOfWeek
  }

  const isThisMonth = (date: Date) => {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    const endOfMonth = new Date(startOfMonth)
    endOfMonth.setMonth(endOfMonth.getMonth() + 1)
    endOfMonth.setDate(endOfMonth.getDate() - 1)
    return date >= startOfMonth && date <= endOfMonth
  }

  const dateOptions = [
    { value: "", label: "All Dates" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
  ]

  return (
    <div className="card-body">
      {/* Add New Quotation Button */}
      <div className="d-flex mb-4">
        <button className="btn btn-add">
          <Plus size={16} className="me-2" />
          Add New Quotation
        </button>
      </div>

      {/* Search and Filter Controls */}
      <SearchFilterRow
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search quotations..."
        firstFilter={{
          value: clientFilter,
          onChange: setClientFilter,
          options: clients,
        }}
        secondFilter={{
          value: dateFilter,
          onChange: setDateFilter,
          options: dateOptions,
        }}
        onExport={exportToCSV}
        exportLabel="Export"
      />

      {/* Quotations Table */}
      <div className="table-responsive">
        <table className="table" id="quotationTable">
          <thead>
            <tr>
              <th>Quotation #</th>
              <th>Client</th>
              <th>Date Created</th>
              <th>Valid Until</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center">
                  Loading...
                </td>
              </tr>
            ) : filteredQuotations.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center">
                  No quotations found
                </td>
              </tr>
            ) : (
              filteredQuotations.map((quotation) => (
                <tr key={quotation.id}>
                  <td className="fw-bold">{quotation.quotation_number}</td>
                  <td>
                    <div>{quotation.client?.name}</div>
                    {quotation.client?.phone && (
                      <small className="text-muted">{quotation.client.phone}</small>
                    )}
                  </td>
                  <td>{new Date(quotation.date_created).toLocaleDateString()}</td>
                  <td>{new Date(quotation.valid_until).toLocaleDateString()}</td>
                  <td>${quotation.total_amount.toFixed(2)}</td>
                  <td>
                    <span className={getStatusBadge(quotation.status)}>
                      {quotation.status}
                    </span>
                  </td>
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

export default QuotationsView
