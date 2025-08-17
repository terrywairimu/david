"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { supabase } from "@/lib/supabase-client"

type TimeRange = "7d" | "30d" | "3m" | "6m" | "12m" | "YTD"

export interface UseAnalyticsReturn {
  salesData: Array<{ date: string; revenue: number; orders: number; customers: number; profit: number }>
  products: Array<{ id: string; name: string; category: string; price: number; cost: number; stock_quantity: number; units_sold: number; revenue: number }>
  customers: Array<{ id: string; name: string; segment?: string; lifetime_value?: number; total_orders?: number }>
  orders: Array<{ id: string; total_amount: number; status?: string; created_at: string }>
  analytics: { growthRate: number; lastUpdate: Date | null; isRealTimeConnected: boolean; totalRevenue: number; totalOrders: number; avgOrderValue: number; conversionRate: number }
  aiAnalysis: any
  loading: boolean
  aiLoading: boolean
  error: string | null
  fetchAnalyticsData: () => Promise<void>
  fetchLiveUpdate: () => Promise<void>
  generateAIInsights: () => Promise<void>
  exportSalesData: () => void
  exportProductsData: () => void
  exportCustomersData: () => void
  exportAllData: () => void
  getChartData: () => Array<{ date: string; revenue: number; orders: number; customers: number; profit: number }>
  getCustomerSegments: () => Array<{ name: string; value: number; revenue: number; color?: string }>
  getTopProducts: () => Array<{ id: string; name: string; revenue: number; units_sold: number; profit_margin?: number }>
}

// Utilities
function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function downloadBlob(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

export function useAnalytics(timeRange: TimeRange = "12m"): UseAnalyticsReturn {
  const [salesData, setSalesData] = useState<UseAnalyticsReturn["salesData"]>([])
  const [products, setProducts] = useState<UseAnalyticsReturn["products"]>([])
  const [customers, setCustomers] = useState<UseAnalyticsReturn["customers"]>([])
  const [orders, setOrders] = useState<UseAnalyticsReturn["orders"]>([])
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [aiLoading, setAiLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<UseAnalyticsReturn["analytics"]>({ growthRate: 0, lastUpdate: null, isRealTimeConnected: false, totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, conversionRate: 0 })

  const initialLoadRef = useRef(false)

  const computeDateWindow = useCallback((): { start: Date; end: Date } => {
    const end = new Date()
    const start = new Date(end)
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
      case "YTD":
        start.setMonth(0); start.setDate(1)
        break
      default:
        start.setMonth(end.getMonth() - 12)
    }
    return { start, end }
  }, [timeRange])

  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { start, end } = computeDateWindow()
      const startIso = start.toISOString()
      const endIso = end.toISOString()

      // Load invoices + cash sales as revenue
      const [invRes, cashRes, expensesRes, clientsRes] = await Promise.all([
        supabase.from("invoices").select("date_created, grand_total").gte("date_created", startIso).lte("date_created", endIso),
        supabase.from("cash_sales").select("date_created, grand_total").gte("date_created", startIso).lte("date_created", endIso),
        supabase.from("expenses").select("date_created, amount").gte("date_created", startIso).lte("date_created", endIso),
        supabase.from("registered_entities").select("id, name, type, date_added").eq("type", "client")
      ])

      const invoices = (invRes.data || []).map(r => ({ date_created: r.date_created as string, amount: Number((r as any).grand_total || 0) }))
      const cash = (cashRes.data || []).map(r => ({ date_created: r.date_created as string, amount: Number((r as any).grand_total || 0) }))
      const expenses = (expensesRes.data || []).map(r => ({ date_created: r.date_created as string, amount: Number((r as any).amount || 0) }))
      const allRevenue = [...invoices, ...cash]

      // Aggregate per month
      const revenueByMonth = new Map<string, number>()
      const expenseByMonth = new Map<string, number>()
      allRevenue.forEach(r => {
        const k = monthKey(new Date(r.date_created))
        revenueByMonth.set(k, (revenueByMonth.get(k) || 0) + r.amount)
      })
      expenses.forEach(r => {
        const k = monthKey(new Date(r.date_created))
        expenseByMonth.set(k, (expenseByMonth.get(k) || 0) + r.amount)
      })

      const months = Array.from(new Set([...revenueByMonth.keys(), ...expenseByMonth.keys()])).sort()
      const chartSeries = months.map(m => {
        const revenue = revenueByMonth.get(m) || 0
        const expense = expenseByMonth.get(m) || 0
        const profit = revenue - expense
        return { date: m, revenue, orders: Math.max(1, Math.round(revenue / 1000)), customers: 0, profit }
      })
      setSalesData(chartSeries)

      // Customers
      const clientRows = (clientsRes.data || []).map(c => ({ id: String(c.id), name: (c as any).name, segment: "smb", lifetime_value: 0, total_orders: 0 }))
      setCustomers(clientRows)

      // Products/Orders: provide sample data matching the expected interface
      const sampleProducts = [
        { id: '1', name: 'Sample Product 1', category: 'electronics', price: 100, cost: 60, stock_quantity: 50, units_sold: 25, revenue: 2500 },
        { id: '2', name: 'Sample Product 2', category: 'clothing', price: 50, cost: 30, stock_quantity: 100, units_sold: 40, revenue: 2000 },
        { id: '3', name: 'Sample Product 3', category: 'books', price: 25, cost: 15, stock_quantity: 200, units_sold: 80, revenue: 2000 }
      ]
      setProducts(sampleProducts)
      setOrders([])

      // Simple growth metric
      const last = chartSeries.at(-1)?.revenue || 0
      const prev = chartSeries.at(-2)?.revenue || last
      const growthRate = prev === 0 ? 0 : Math.round(((last - prev) / prev) * 100)
      const totalRevenue = chartSeries.reduce((s, r) => s + r.revenue, 0)
      const ordersCount = chartSeries.reduce((s, r) => s + r.orders, 0)
      const avgOrderValue = ordersCount > 0 ? totalRevenue / ordersCount : 0
      const conversionRate = customers.length > 0 ? Math.min(100, Math.max(0, (ordersCount / (customers.length * 10)) * 100)) : 0
      setAnalytics({ growthRate, lastUpdate: new Date(), isRealTimeConnected: false, totalRevenue, totalOrders: ordersCount, avgOrderValue, conversionRate: Number(conversionRate.toFixed(1)) })
    } catch (e: any) {
      setError(e?.message || "Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }, [computeDateWindow])

  const fetchLiveUpdate = useCallback(async () => {
    await fetchAnalyticsData()
  }, [fetchAnalyticsData])

  const generateAIInsights = useCallback(async () => {
    try {
      setAiLoading(true)
      const payload = {
        summary: {
          growthRate: analytics.growthRate,
          months: salesData.length,
          revenue: salesData.reduce((s, r) => s + r.revenue, 0),
          profit: salesData.reduce((s, r) => s + r.profit, 0)
        }
      }
      const res = await fetch("/api/analytics/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      setAiAnalysis(data)
    } catch (e: any) {
      setError(e?.message || "Failed to generate AI insights")
    } finally {
      setAiLoading(false)
    }
  }, [analytics.growthRate, salesData])

  // CSV exports
  const exportSalesData = useCallback(() => {
    const header = "date,revenue,orders,customers,profit"
    const rows = salesData.map(r => `${r.date},${r.revenue},${r.orders},${r.customers},${r.profit}`).join("\n")
    downloadBlob("sales-analytics.csv", `${header}\n${rows}`)
  }, [salesData])

  const exportProductsData = useCallback(() => {
    const header = "id,name,category,price,cost,stock_quantity,units_sold,revenue"
    const rows = products.map(p => `${p.id},${p.name},${p.category},${p.price},${p.cost},${p.stock_quantity},${p.units_sold},${p.revenue}`).join("\n")
    downloadBlob("products-analytics.csv", `${header}\n${rows}`)
  }, [products])

  const exportCustomersData = useCallback(() => {
    const header = "id,name,segment,lifetime_value,total_orders"
    const rows = customers.map(c => `${c.id},${c.name},${c.segment || ""},${c.lifetime_value || 0},${c.total_orders || 0}`).join("\n")
    downloadBlob("customers-analytics.csv", `${header}\n${rows}`)
  }, [customers])

  const exportAllData = useCallback(() => {
    exportSalesData(); exportProductsData(); exportCustomersData()
  }, [exportCustomersData, exportProductsData, exportSalesData])

  const getChartData = useCallback(() => salesData, [salesData])

  const getCustomerSegments = useCallback(() => {
    const bySeg = new Map<string, { count: number; revenue: number }>()
    customers.forEach(c => {
      const seg = c.segment || "smb"
      const v = bySeg.get(seg) || { count: 0, revenue: 0 }
      v.count += 1
      v.revenue += c.lifetime_value || 0
      bySeg.set(seg, v)
    })
    return Array.from(bySeg.entries()).map(([name, v], i) => ({ name: name[0].toUpperCase() + name.slice(1), value: v.count, revenue: v.revenue }))
  }, [customers])

  const getTopProducts = useCallback(() => {
    return products
      .map(p => ({ id: p.id, name: p.name, revenue: p.revenue, units_sold: p.units_sold, profit_margin: ((p.price - p.cost) / p.price) * 100 }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }, [products])

  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true
      fetchAnalyticsData()
    } else {
      fetchAnalyticsData()
    }
  }, [fetchAnalyticsData])

  return {
    salesData,
    products,
    customers,
    orders,
    analytics,
    aiAnalysis,
    loading,
    aiLoading,
    error,
    fetchAnalyticsData,
    fetchLiveUpdate,
    generateAIInsights,
    exportSalesData,
    exportProductsData,
    exportCustomersData,
    exportAllData,
    getChartData,
    getCustomerSegments,
    getTopProducts
  }
}

export default useAnalytics


