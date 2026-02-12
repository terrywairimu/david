"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import {
  SectionId,
  TimeRangeKey,
  getSubTypes,
  getAnalyticsMetrics,
  getTimeRangeSubtitle,
  getChartTitle,
} from "@/lib/analytics-config"

export interface ChartDataPoint {
  date: string
  amount: number
  count: number
  avg?: number
  revenue?: number
  orders?: number
  value?: number
  [key: string]: string | number | undefined
}

export interface UseComprehensiveAnalyticsParams {
  section: SectionId
  subType: string
  analyticsMetric: string
  timeRange: TimeRangeKey
  customStartDate?: string
  customEndDate?: string
}

export interface UseComprehensiveAnalyticsReturn {
  chartData: ChartDataPoint[]
  summary: {
    total: number
    count: number
    avg: number
    growthRate: number
  }
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  chartTitle: string
  timeLabel: string
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function weekKey(d: Date): string {
  const start = new Date(d)
  start.setDate(d.getDate() - d.getDay())
  return start.toISOString().slice(0, 10)
}

export function useComprehensiveAnalytics({
  section,
  subType,
  analyticsMetric,
  timeRange,
  customStartDate,
  customEndDate,
}: UseComprehensiveAnalyticsParams): UseComprehensiveAnalyticsReturn {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [summary, setSummary] = useState({ total: 0, count: 0, avg: 0, growthRate: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const computeDateWindow = useCallback((): { start: Date; end: Date } => {
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
        case "7d":
          start.setDate(end.getDate() - 7)
          break
        case "30d":
          start.setDate(end.getDate() - 30)
          break
        case "3m":
          start.setMonth(end.getMonth() - 3)
          break
        case "6m":
          start.setMonth(end.getMonth() - 6)
          break
        case "12m":
        default:
          start.setMonth(end.getMonth() - 12)
      }
    }
    return { start, end }
  }, [timeRange, customStartDate, customEndDate])

  const getAggKey = useCallback(
    (dateStr: string) => {
      const d = new Date(dateStr)
      if (timeRange === "7d") return d.toLocaleDateString()
      if (timeRange === "30d") return weekKey(d)
      return monthKey(d)
    },
    [timeRange]
  )

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { start, end } = computeDateWindow()
      const startIso = start.toISOString()
      const endIso = end.toISOString()

      const subTypes = getSubTypes(section)
      const config = subTypes.find((s) => s.id === subType)
      if (!config) {
        setChartData([])
        setSummary({ total: 0, count: 0, avg: 0, growthRate: 0 })
        return
      }

      const { table, dateField, amountField } = config
      const aggregationMap = new Map<
        string,
        { amount: number; count: number }
      >()

      // Stock has special handling
      if (section !== "stock") {
        let query = supabase
          .from(table)
          .select(`*`)
          .gte(dateField, startIso)
          .lte(dateField, endIso)

        if (section === "expenses" && subType !== "all") {
          query = query.eq("expense_type", subType)
        }
        if (section === "purchases" && subType !== "all") {
          if (subType === "client") {
            query = query.not("client_id", "is", null)
          } else if (subType === "general") {
            query = query.is("client_id", null)
          }
        }

        const { data: rows, error: fetchError } = await query
        if (fetchError) throw fetchError
        const records = rows || []

        records.forEach((r: any) => {
          const dateStr = r[dateField] || r.date_created || r.purchase_date || r.payment_date
          if (!dateStr) return
          const k = getAggKey(dateStr)
          const current = aggregationMap.get(k) || { amount: 0, count: 0 }
          const amt = Number(r[amountField] || r.total_amount || r.grand_total || r.amount || 0)
          current.amount += amt
          current.count += 1
          aggregationMap.set(k, current)
        })
      }

      // Stock: items or valuation - aggregate by date_added, value = qty * unit_price
      if (section === "stock" && (subType === "items" || subType === "valuation")) {
        aggregationMap.clear()
        const { data: stockRows } = await supabase
          .from("stock_items")
          .select("date_added, quantity, unit_price")
          .gte("date_added", startIso)
          .lte("date_added", endIso)
        ;(stockRows || []).forEach((r: any) => {
          const k = getAggKey(r.date_added)
          const current = aggregationMap.get(k) || { amount: 0, count: 0 }
          current.amount += (r.quantity || 0) * (r.unit_price || 0)
          current.count += 1
          aggregationMap.set(k, current)
        })
      }

      // Stock movements - use stock_movements table
      if (section === "stock" && subType === "movements") {
        aggregationMap.clear()
        const { data: movRows } = await supabase
          .from("stock_movements")
          .select("date_created, quantity")
          .gte("date_created", startIso)
          .lte("date_created", endIso)
        ;(movRows || []).forEach((r: any) => {
          const k = getAggKey(r.date_created)
          const current = aggregationMap.get(k) || { amount: 0, count: 0 }
          current.amount += Math.abs(r.quantity || 0)
          current.count += 1
          aggregationMap.set(k, current)
        })
      }

      const series = Array.from(aggregationMap.entries())
        .map(([date, data]) => ({
          date,
          amount: data.amount,
          count: data.count,
          avg: data.count > 0 ? data.amount / data.count : 0,
          revenue: data.amount,
          orders: data.count,
          value: data.amount,
          movements: section === "stock" ? data.amount : undefined,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setChartData(series)

      const total = series.reduce((s, r) => s + r.amount, 0)
      const count = series.reduce((s, r) => s + r.count, 0)
      const last = series.at(-1)?.amount || 0
      const prev = series.at(-2)?.amount || last
      const growthRate = prev === 0 ? 0 : ((last - prev) / prev) * 100

      setSummary({
        total,
        count,
        avg: count > 0 ? total / count : 0,
        growthRate,
      })
    } catch (e: any) {
      setError(e?.message || "Failed to load analytics")
      setChartData([])
      setSummary({ total: 0, count: 0, avg: 0, growthRate: 0 })
    } finally {
      setLoading(false)
    }
  }, [
    section,
    subType,
    computeDateWindow,
    getAggKey,
  ])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const timeLabel = getTimeRangeSubtitle(
    timeRange,
    customStartDate,
    customEndDate
  )
  const chartTitle = getChartTitle(section, subType, analyticsMetric, timeLabel)

  return {
    chartData,
    summary,
    loading,
    error,
    refetch: fetchData,
    chartTitle,
    timeLabel,
  }
}
