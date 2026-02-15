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
  clientId?: string | null
}

export interface UseComprehensiveAnalyticsReturn {
  chartData: ChartDataPoint[]
  summary: {
    total: number
    count: number
    avg: number
    growthRate: number
    distinctEntities: number
    total_paid?: number
    total_expenses?: number
    net_profit?: number
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
  clientId,
}: UseComprehensiveAnalyticsParams): UseComprehensiveAnalyticsReturn {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [summary, setSummary] = useState({
    total: 0, count: 0, avg: 0, growthRate: 0, distinctEntities: 0,
    total_paid: 0, total_expenses: 0, net_profit: 0,
  })
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
      if (!config && section !== "profitability") {
        setChartData([])
        setSummary({ total: 0, count: 0, avg: 0, growthRate: 0, distinctEntities: 0, total_paid: 0, total_expenses: 0, net_profit: 0 })
        return
      }

      const aggregationMap = new Map<
        string,
        { amount: number; count: number; total_paid: number; total_expenses: number; net_profit: number }
      >()

      // Profitability: payments (received) - expenses (client)
      if (section === "profitability") {
        let paymentsQuery = supabase
          .from("payments")
          .select("date_created, amount, client_id")
          .gte("date_created", startIso)
          .lte("date_created", endIso)
        if (clientId && clientId !== "general") {
          paymentsQuery = paymentsQuery.eq("client_id", clientId)
        }
        const { data: paymentRows } = await paymentsQuery
        const payments = paymentRows || []

        let expensesQuery = supabase
          .from("expenses")
          .select("date_created, amount, client_id")
          .gte("date_created", startIso)
          .lte("date_created", endIso)
          .eq("expense_type", "client")
        if (clientId && clientId !== "general") {
          expensesQuery = expensesQuery.eq("client_id", clientId)
        }
        const { data: expenseRows } = await expensesQuery
        const expenses = expenseRows || []

        // Client purchases: cost of items bought for that client (purchase price, not selling price)
        let purchasesQuery = supabase
          .from("purchases")
          .select("purchase_date, total_amount, client_id")
          .gte("purchase_date", startIso.split("T")[0])
          .lte("purchase_date", endIso.split("T")[0])
          .not("client_id", "is", null)
        if (clientId && clientId !== "general") {
          purchasesQuery = purchasesQuery.eq("client_id", clientId)
        }
        const { data: purchaseRows } = await purchasesQuery
        const clientPurchases = purchaseRows || []

        payments.forEach((r: any) => {
          const dateStr = String(r.date_created || "")
          if (!dateStr) return
          const k = getAggKey(dateStr)
          const current = aggregationMap.get(k) || { amount: 0, count: 0, total_paid: 0, total_expenses: 0, net_profit: 0 }
          const amt = Number(r.amount || 0)
          current.total_paid += amt
          current.count += 1
          aggregationMap.set(k, current)
        })

        expenses.forEach((r: any) => {
          const dateStr = String(r.date_created || "")
          if (!dateStr) return
          const k = getAggKey(dateStr)
          const current = aggregationMap.get(k) || { amount: 0, count: 0, total_paid: 0, total_expenses: 0, net_profit: 0 }
          const amt = Number(r.amount || 0)
          current.total_expenses += amt
          aggregationMap.set(k, current)
        })

        // Add client purchases (purchase price / cost) to total_expenses
        clientPurchases.forEach((r: any) => {
          const dateStr = String(r.purchase_date || r.date_created || "")
          if (!dateStr) return
          const k = getAggKey(dateStr)
          const current = aggregationMap.get(k) || { amount: 0, count: 0, total_paid: 0, total_expenses: 0, net_profit: 0 }
          const amt = Number(r.total_amount || 0)
          current.total_expenses += amt
          aggregationMap.set(k, current)
        })

        // Recompute net_profit per bucket (total_paid - total_expenses)
        aggregationMap.forEach((v) => {
          v.net_profit = (v.total_paid || 0) - (v.total_expenses || 0)
        })
      }

      const { table, dateField, amountField } = config || { table: "", dateField: "date_created", amountField: "amount" }

      // Stock has special handling
      if (section !== "stock" && section !== "profitability") {
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
          const dateStr = String(r[dateField] || r.date_created || r.purchase_date || r.payment_date || '')
          if (!dateStr || dateStr === 'undefined') return
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
        .map(([date, data]) => {
          const d = data as any
          const totalPaid = d.total_paid ?? 0
          const totalExpenses = d.total_expenses ?? 0
          const netProfit = d.net_profit ?? (totalPaid - totalExpenses)
          return {
            date,
            amount: section === "profitability" ? netProfit : data.amount,
            count: data.count,
            avg: data.count > 0 ? (section === "profitability" ? netProfit : data.amount) / data.count : 0,
            revenue: data.amount,
            orders: data.count,
            value: data.amount,
            movements: section === "stock" ? data.amount : undefined,
            total_paid: totalPaid,
            total_expenses: totalExpenses,
            net_profit: netProfit,
          }
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setChartData(series)

      const total = series.reduce((s, r) => s + (r.amount || 0), 0)
      const count = series.reduce((s, r) => s + (r.count || 0), 0)
      const last = series.at(-1)?.amount || 0
      const prev = series.at(-2)?.amount || last
      const growthRate = prev === 0 ? 0 : ((last - prev) / prev) * 100

      let totalPaidSum = 0
      let totalExpensesSum = 0
      let netProfitSum = 0
      if (section === "profitability") {
        totalPaidSum = series.reduce((s, r) => s + (Number((r as any).total_paid) || 0), 0)
        totalExpensesSum = series.reduce((s, r) => s + (Number((r as any).total_expenses) || 0), 0)
        netProfitSum = totalPaidSum - totalExpensesSum
      }

      let distinctEntities = 0
      if (section === "sales") {
        const { data: rows } = await supabase.from(table).select("client_id")
          .gte(dateField, startIso).lte(dateField, endIso).not("client_id", "is", null)
        distinctEntities = new Set((rows || []).map((r: any) => r.client_id)).size
      } else if (section === "expenses") {
        if (subType === "client") {
          const { data: rows } = await supabase.from("expenses").select("client_id")
            .gte("date_created", startIso).lte("date_created", endIso)
            .eq("expense_type", "client").not("client_id", "is", null)
          distinctEntities = new Set((rows || []).map((r: any) => r.client_id)).size
        } else {
          let q = supabase.from("expenses").select("expense_category, category")
            .gte("date_created", startIso).lte("date_created", endIso)
          if (subType === "company") q = q.eq("expense_type", "company")
          const { data: rows } = await q
          distinctEntities = new Set((rows || []).map((r: any) => (r as any).expense_category || (r as any).category || "").filter(Boolean)).size
        }
      } else if (section === "payments") {
        if (subType === "received") {
          const { data: rows } = await supabase.from("payments").select("client_id")
            .gte("date_created", startIso).lte("date_created", endIso).not("client_id", "is", null)
          distinctEntities = new Set((rows || []).map((r: any) => r.client_id)).size
        } else if (subType === "supplier") {
          const { data: rows } = await supabase.from("supplier_payments").select("supplier_id")
            .gte("date_created", startIso).lte("date_created", endIso).not("supplier_id", "is", null)
          distinctEntities = new Set((rows || []).map((r: any) => r.supplier_id)).size
        } else if (subType === "employee") {
          const { data: rows } = await supabase.from("employee_payments").select("employee_id")
            .gte("date_created", startIso).lte("date_created", endIso).not("employee_id", "is", null)
          distinctEntities = new Set((rows || []).map((r: any) => r.employee_id)).size
        }
      } else if (section === "purchases") {
        let q = supabase.from("purchases").select("supplier_id, client_id")
          .gte("purchase_date", startIso).lte("purchase_date", endIso)
        if (subType === "client") q = q.not("client_id", "is", null)
        else if (subType === "general") q = q.is("client_id", null)
        const { data: rows } = await q
        const ids = (rows || []).map((r: any) => r.supplier_id || r.client_id).filter(Boolean)
        distinctEntities = new Set(ids).size
      } else if (section === "profitability") {
        const { data: payRows } = await supabase.from("payments").select("client_id")
          .gte("date_created", startIso).lte("date_created", endIso)
          .not("client_id", "is", null)
        if (clientId && clientId !== "general") {
          distinctEntities = 1
        } else {
          distinctEntities = new Set((payRows || []).map((r: any) => r.client_id)).size
        }
      } else if (section === "stock") {
        if (subType === "movements") {
          const { data: rows } = await supabase.from("stock_movements").select("stock_item_id")
            .gte("date_created", startIso).lte("date_created", endIso)
          distinctEntities = new Set((rows || []).map((r: any) => r.stock_item_id)).size
        } else {
          const { data: rows } = await supabase.from("stock_items").select("category")
            .gte("date_added", startIso).lte("date_added", endIso)
          distinctEntities = new Set((rows || []).map((r: any) => r.category || "").filter(Boolean)).size
        }
      }

      setSummary({
        total: section === "profitability" ? netProfitSum : total,
        count,
        avg: count > 0 ? (section === "profitability" ? netProfitSum / count : total / count) : 0,
        growthRate,
        distinctEntities,
        total_paid: section === "profitability" ? totalPaidSum : undefined,
        total_expenses: section === "profitability" ? totalExpensesSum : undefined,
        net_profit: section === "profitability" ? netProfitSum : undefined,
      })
    } catch (e: any) {
      setError(e?.message || "Failed to load analytics")
      setChartData([])
      setSummary({ total: 0, count: 0, avg: 0, growthRate: 0, distinctEntities: 0, total_paid: 0, total_expenses: 0, net_profit: 0 })
    } finally {
      setLoading(false)
    }
  }, [
    section,
    subType,
    clientId,
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
