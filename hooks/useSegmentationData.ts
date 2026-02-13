"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { SectionId, TimeRangeKey, getSubTypes } from "@/lib/analytics-config"

const SEGMENT_COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#cfcfcf", "#f59e0b", "#22c55e", "#3b82f6"]

export interface SegmentationItem {
  name: string
  value: number
  revenue: number
  color: string
  total_paid?: number
  total_expenses?: number
  net_profit?: number
}

export interface UseSegmentationDataParams {
  section: SectionId
  subType: string
  timeRange: TimeRangeKey
  customStartDate?: string
  customEndDate?: string
  clientId?: string | null
}

export interface UseSegmentationDataReturn {
  segments: SegmentationItem[]
  loading: boolean
  error: string | null
  subtitle: string
}

function computeDateWindow(
  timeRange: TimeRangeKey,
  customStartDate?: string,
  customEndDate?: string
): { start: Date; end: Date } {
  let end: Date
  let start: Date
  if (timeRange === "custom") {
    end = customEndDate ? new Date(customEndDate) : new Date()
    start = customStartDate ? new Date(customStartDate) : (() => {
      const s = new Date(end)
      s.setDate(s.getDate() - 30)
      return s
    })()
  } else {
    end = new Date()
    start = new Date(end)
    switch (timeRange) {
      case "7d": start.setDate(end.getDate() - 7); break
      case "30d": start.setDate(end.getDate() - 30); break
      case "3m": start.setMonth(end.getMonth() - 3); break
      case "6m": start.setMonth(end.getMonth() - 6); break
      case "12m":
      default: start.setMonth(end.getMonth() - 12)
    }
  }
  return { start, end }
}

function getSegmentationConfig(section: SectionId, subType: string): { table: string; dateField: string; groupBy: string; groupByFallback?: string; amountField: string; filter?: { col: string; val: string } } | null {
  switch (section) {
    case "profitability":
      return {
        table: "sales_orders",
        dateField: "date_created",
        groupBy: "status",
        amountField: "grand_total",
      }
    case "sales": {
      const subTypes = getSubTypes("sales")
      const config = subTypes.find((s) => s.id === subType)
      if (!config) return null
      return {
        table: config.table,
        dateField: config.dateField,
        groupBy: "status",
        amountField: config.amountField,
      }
    }
    case "expenses": {
      const subTypes = getSubTypes("expenses")
      const config = subTypes.find((s) => s.id === subType)
      if (!config) return null
      const filter = subType !== "all" ? { col: "expense_type", val: subType } : undefined
      return {
        table: "expenses",
        dateField: "date_created",
        groupBy: "expense_category",
        groupByFallback: "category",
        amountField: "amount",
        filter,
      }
    }
    case "payments": {
      const subTypes = getSubTypes("payments")
      const config = subTypes.find((s) => s.id === subType)
      if (!config) return null
      return {
        table: config.table,
        dateField: "date_created",
        groupBy: "payment_method",
        amountField: "amount",
      }
    }
    case "purchases": {
      const subTypes = getSubTypes("purchases")
      const config = subTypes.find((s) => s.id === subType)
      if (!config) return null
      const filter = subType === "client" ? { col: "client_id", val: "not_null" } : subType === "general" ? { col: "client_id", val: "null" } : undefined
      return {
        table: "purchases",
        dateField: "purchase_date",
        groupBy: "status",
        amountField: "total_amount",
        filter,
      }
    }
    case "stock": {
      const subTypes = getSubTypes("stock")
      const config = subTypes.find((s) => s.id === subType)
      if (!config) return null
      if (subType === "movements") {
        return {
          table: "stock_movements",
          dateField: "date_created",
          groupBy: "movement_type",
          amountField: "quantity",
        }
      }
      return {
        table: "stock_items",
        dateField: "date_added",
        groupBy: "category",
        amountField: "unit_price",
      }
    }
    default:
      return null
  }
}

export function useSegmentationData({
  section,
  subType,
  timeRange,
  customStartDate,
  customEndDate,
  clientId,
}: UseSegmentationDataParams): UseSegmentationDataReturn {
  const [segments, setSegments] = useState<SegmentationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const config = getSegmentationConfig(section, subType)
      if (!config) {
        setSegments([])
        return
      }

      const { start, end } = computeDateWindow(timeRange, customStartDate, customEndDate)
      const startIso = start.toISOString()
      const endIso = end.toISOString()

      const selectFields = config.table === "stock_items"
        ? `${config.groupBy}, quantity, ${config.amountField}`
        : config.groupByFallback
          ? `${config.groupBy}, ${config.groupByFallback}, ${config.amountField}`
          : `${config.groupBy}, ${config.amountField}`
      let query = supabase
        .from(config.table)
        .select(selectFields)
        .gte(config.dateField, startIso)
        .lte(config.dateField, endIso)

      if (section === "profitability" && clientId && clientId !== "general") {
        query = query.eq("client_id", clientId)
      }
      if (config.filter) {
        if (config.filter.val === "not_null") {
          query = query.not(config.filter.col, "is", null)
        } else if (config.filter.val === "null") {
          query = query.is(config.filter.col, null)
        } else {
          query = query.eq(config.filter.col, config.filter.val)
        }
      }

      const { data: rows, error: fetchError } = await query
      if (fetchError) throw fetchError

      const agg = new Map<string, { count: number; amount: number }>()
      for (const r of rows || []) {
        const row = r as Record<string, unknown>
        const key = String(row[config.groupBy] ?? row[config.groupByFallback ?? ""] ?? "Uncategorized")
        let amt = 0
        if (config.table === "stock_items") {
          amt = Number(row.quantity || 0) * Number(row.unit_price || 0)
        } else if (config.table === "stock_movements") {
          amt = Math.abs(Number(row.quantity || 0))
        } else {
          amt = Number(row[config.amountField] || row.grand_total || row.total_amount || row.amount || 0)
        }
        const current = agg.get(key) || { count: 0, amount: 0 }
        current.count += 1
        current.amount += amt
        agg.set(key, current)
      }

      const total = Array.from(agg.values()).reduce((s, v) => s + v.amount, 0) || 1
      const items = Array.from(agg.entries())
        .map(([name, data], i) => ({
          name: name || "Uncategorized",
          value: total > 0 ? Math.round((data.amount / total) * 100) : 0,
          revenue: data.amount,
          color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
        }))
        .filter((s) => s.value > 0)
        .sort((a, b) => b.revenue - a.revenue)

      setSegments(items)
    } catch (e: any) {
      setError(e?.message || "Failed to load segmentation")
      setSegments([])
    } finally {
      setLoading(false)
    }
  }, [section, subType, timeRange, customStartDate, customEndDate, clientId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const subLabel = subType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  const subtitle = `${subLabel} distribution`

  return { segments, loading, error, subtitle }
}
