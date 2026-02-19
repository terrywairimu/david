'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import html2canvas from 'html2canvas'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useComprehensiveAnalytics } from '@/hooks/useComprehensiveAnalytics'
import { useSegmentationData } from '@/hooks/useSegmentationData'
import {
  SECTIONS,
  getSubTypes,
  getAnalyticsMetrics,
  TIME_RANGE_LABELS,
  getChartTypeForMetric,
  getHeaderStatsConfig,
  getSegmentationTitle,
  type SectionId,
  type TimeRangeKey,
  type ChartTypeKey,
} from '@/lib/analytics-config'
import { formatNumber } from '@/lib/format-number'
import { generateAnalyticsReportPDF } from '@/lib/analytics-report-pdf'
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Package,
  Calendar, Filter, Download, Share, RefreshCw, Zap, Eye,
  ArrowUpRight, ArrowDownRight, Target, Award, Clock, Star,
  MoreVertical, ChevronDown, Settings, Maximize2, Minimize2,
  AlertCircle, CheckCircle, Info, X, Sparkles, Brain, Loader2
} from 'lucide-react'
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter, ComposedChart, ReferenceLine, FunnelChart,
  Funnel, LabelList
} from 'recharts'

// Fallback chart color when CSS variables may not resolve (e.g. SSR or theme loading)
const CHART_PRIMARY = '#6366f1'

// Fixed dimensions for Cartesian charts - avoids ResponsiveContainer grid issues
const CHART_WIDTH = 600
const CHART_HEIGHT = 318

// Analytics chart renderer - picks best chart type per metric (uses fixed size, no ResponsiveContainer)
const AnalyticsChartByType: React.FC<{
  data: { date: string; [key: string]: string | number | undefined }[]
  dataKey: string
  chartType: ChartTypeKey
  format: 'currency' | 'number' | 'percent'
  showPrediction?: boolean
}> = ({ data, dataKey, chartType, format, showPrediction }) => {
  const formatValue = (value: number) => {
    if (format === 'currency') return `KES ${Number(value).toLocaleString()}`
    if (format === 'percent') return `${value}%`
    return String(value)
  }
  const commonProps = {
    data,
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    margin: { top: 16, right: 16, left: 16, bottom: 16 },
  }
  const tooltipProps = {
    contentStyle: { borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' } as const,
    formatter: (value: number) => formatValue(value),
  }
  const yAxisProps = { domain: [0, 'auto' as const], hide: true }

  if (chartType === 'bar' || chartType === 'barHorizontal') {
    return (
      <BarChart {...commonProps}>
        <defs>
          <linearGradient id="colorBarAnalytics" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_PRIMARY} stopOpacity={0.9} />
            <stop offset="95%" stopColor={CHART_PRIMARY} stopOpacity={0.6} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis {...yAxisProps} />
        <Tooltip {...tooltipProps} />
        <Bar dataKey={dataKey} fill="url(#colorBarAnalytics)" radius={[4, 4, 0, 0]} />
        {showPrediction && <Bar dataKey="predicted" fill="#f59e0b" fillOpacity={0.4} radius={[4, 4, 0, 0]} />}
      </BarChart>
    )
  }

  if (chartType === 'line') {
    return (
      <LineChart {...commonProps}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis {...yAxisProps} />
        <Tooltip {...tooltipProps} />
        <Line type="monotone" dataKey={dataKey} stroke={CHART_PRIMARY} strokeWidth={3} dot={{ r: 3 }} />
        {showPrediction && <Line type="monotone" dataKey="predicted" stroke="#f59e0b" strokeDasharray="5 5" dot={false} />}
      </LineChart>
    )
  }

  // Default: area (monetary trends)
  return (
    <AreaChart {...commonProps}>
      <defs>
        <linearGradient id="colorRevAnalytics" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={CHART_PRIMARY} stopOpacity={0.4} />
          <stop offset="95%" stopColor={CHART_PRIMARY} stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
      <YAxis {...yAxisProps} />
      <Tooltip {...tooltipProps} />
      <Area type="monotone" dataKey={dataKey} stroke={CHART_PRIMARY} strokeWidth={3} fill="url(#colorRevAnalytics)" />
      {showPrediction && <Area type="monotone" dataKey="predicted" stroke="#f59e0b" strokeDasharray="5 5" fill="none" />}
    </AreaChart>
  )
}

// Local Implementation of Dashboard Components to match Tujenge style
const DashboardCard: React.FC<{
  title: string
  value: string
  change?: number
  icon?: any
  gradient?: boolean
  neumorphic?: boolean
  glass?: boolean
}> = ({ title, value, change, icon: Icon, gradient, neumorphic, glass }) => {
  const baseStyles = glass
    ? 'bg-card/40 backdrop-blur-xl border border-border shadow-sm'
    : neumorphic
      ? 'bg-muted border border-border shadow-inner'
      : 'bg-card border border-border shadow-md'

  const gradientStyles = gradient
    ? 'bg-gradient-to-br from-primary to-chart-1 text-primary-foreground border-none'
    : ''

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`relative rounded-2xl p-6 overflow-hidden transition-all duration-300 ${baseStyles} ${gradientStyles}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-xl ${gradient ? 'bg-white/20' : 'bg-primary/10'}`}>
          {Icon && <Icon className={`w-6 h-6 ${gradient ? 'text-white' : 'text-primary'}`} />}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${change >= 0
            ? (gradient ? 'bg-white/20 text-white' : 'bg-green-500/10 text-green-500')
            : (gradient ? 'bg-white/20 text-white' : 'bg-red-500/10 text-red-500')
            }`}>
            {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div>
        <h3 className={`text-sm font-medium mb-1 ${gradient ? 'text-white/80' : 'text-muted-foreground'}`}>{title}</h3>
        <p className={`text-2xl font-bold ${gradient ? 'text-white' : 'text-card-foreground'}`}>{value}</p>
      </div>
    </motion.div>
  )
}

const ChartCard: React.FC<{
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
}> = ({ title, subtitle, children, className = '', action }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card/70 backdrop-blur-xl border border-border rounded-2xl p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </motion.div>
  )
}

// Settings Modal Components
const SettingsModal = ({
  isOpen,
  onClose,
  title,
  children
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  )
}

const ChartSettingsModal = ({
  isOpen,
  onClose,
  currentSettings,
  onApply
}: {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: any;
  onApply: (settings: any) => void;
}) => {
  const [chartType, setChartType] = useState(currentSettings.chartType)
  const [showPredictions, setShowPredictions] = useState(currentSettings.showPredictions)
  const [dataSource, setDataSource] = useState(currentSettings.dataSource)
  const [refreshInterval, setRefreshInterval] = useState(currentSettings.refreshInterval)

  useEffect(() => {
    if (isOpen) {
      setChartType(currentSettings.chartType)
      setShowPredictions(currentSettings.showPredictions)
      setDataSource(currentSettings.dataSource)
      setRefreshInterval(currentSettings.refreshInterval)
    }
  }, [isOpen, currentSettings])

  const handleApply = () => {
    onApply({ chartType, showPredictions, dataSource, refreshInterval })
    onClose()
  }

  return (
    <SettingsModal isOpen={isOpen} onClose={onClose} title="Chart Settings">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-card-foreground mb-2">Chart Type</label>
          <CustomDropdown
            options={[
              { value: 'area', label: '📊 Area Chart' },
              { value: 'line', label: '📈 Line Chart' },
              { value: 'bar', label: '📊 Bar Chart' },
              { value: 'composed', label: '🔄 Composed Chart' }
            ]}
            value={chartType}
            onChange={setChartType}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-card-foreground mb-2">Data Source</label>
          <CustomDropdown
            options={[
              { value: 'all', label: '🌐 All Data' },
              { value: 'revenue', label: '💰 Revenue Only' },
              { value: 'orders', label: '📦 Orders Only' },
              { value: 'customers', label: '👥 Customers Only' }
            ]}
            value={dataSource}
            onChange={setDataSource}
          />
        </div>
        <div className="flex gap-3 pt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-muted rounded-xl">Cancel</button>
          <button onClick={handleApply} className="flex-1 px-4 py-2 bg-primary text-white rounded-xl">Apply</button>
        </div>
      </div>
    </SettingsModal>
  )
}

const PerformanceSettingsModal = ({ isOpen, onClose, currentSettings, onApply }: any) => {
  const [targets, setTargets] = useState(currentSettings)
  useEffect(() => { if (isOpen) setTargets(currentSettings) }, [isOpen, currentSettings])
  return (
    <SettingsModal isOpen={isOpen} onClose={onClose} title="Performance Targets">
      <div className="space-y-4">
        {Object.entries(targets).map(([key, value]: any) => (
          <div key={key}>
            <label className="block text-sm font-medium mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
            <input
              type="number"
              value={value}
              onChange={(e) => setTargets({ ...targets, [key]: Number(e.target.value) })}
              className="w-full p-2 bg-muted rounded-lg"
            />
          </div>
        ))}
        <button onClick={() => { onApply(targets); onClose(); }} className="w-full py-2 bg-primary text-white rounded-xl">Apply Targets</button>
      </div>
    </SettingsModal>
  )
}

const ProductSettingsModal = ({ isOpen, onClose, currentSettings, onApply }: any) => {
  const [settings, setSettings] = useState(currentSettings)
  useEffect(() => { if (isOpen) setSettings(currentSettings) }, [isOpen, currentSettings])
  return (
    <SettingsModal isOpen={isOpen} onClose={onClose} title="Product Settings">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Sort By</label>
          <CustomDropdown
            options={[
              { value: 'revenue', label: 'Revenue' },
              { value: 'units_sold', label: 'Units Sold' }
            ]}
            value={settings.sortBy}
            onChange={(v: string) => setSettings({ ...settings, sortBy: v })}
          />
        </div>
        <button onClick={() => { onApply(settings); onClose(); }} className="w-full py-2 bg-primary text-white rounded-xl">Apply Settings</button>
      </div>
    </SettingsModal>
  )
}

const CustomerSettingsModal = ({ isOpen, onClose, currentSettings, onApply }: any) => {
  const [settings, setSettings] = useState(currentSettings)
  useEffect(() => { if (isOpen) setSettings(currentSettings) }, [isOpen, currentSettings])
  return (
    <SettingsModal isOpen={isOpen} onClose={onClose} title="Customer Settings">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Segment Filter</label>
          <CustomDropdown
            options={[
              { value: 'all', label: 'All Segments' },
              { value: 'enterprise', label: 'Enterprise' }
            ]}
            value={settings.segmentFilter}
            onChange={(v: string) => setSettings({ ...settings, segmentFilter: v })}
          />
        </div>
        <button onClick={() => { onApply(settings); onClose(); }} className="w-full py-2 bg-primary text-white rounded-xl">Apply Settings</button>
      </div>
    </SettingsModal>
  )
}

const CustomDropdown = ({ options, value, onChange, className = "", placement = "bottom" }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void; className?: string; placement?: "top" | "bottom" }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  const ref = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const selected = options.find((opt: any) => opt.value === value)

  useEffect(() => {
    if (!isOpen || !ref.current) return
    const updatePos = () => {
      if (ref.current) {
        const r = ref.current.getBoundingClientRect()
        setPosition({
          left: r.left,
          width: r.width,
          top: placement === "top" ? r.top : r.bottom,
        })
      }
    }
    updatePos()
    window.addEventListener("scroll", updatePos, true)
    window.addEventListener("resize", updatePos)
    return () => {
      window.removeEventListener("scroll", updatePos, true)
      window.removeEventListener("resize", updatePos)
    }
  }, [isOpen, placement])

  useEffect(() => {
    if (!isOpen) return
    const onOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (ref.current?.contains(target) || menuRef.current?.contains(target)) return
      setIsOpen(false)
    }
    document.addEventListener("mousedown", onOutside)
    return () => document.removeEventListener("mousedown", onOutside)
  }, [isOpen])

  const dropdownContent = isOpen && (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, y: placement === "top" ? 4 : -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: placement === "top" ? 4 : -4 }}
        style={{
          position: "fixed",
          left: position.left,
          width: position.width,
          ...(placement === "top" ? { bottom: window.innerHeight - position.top + 8 } : { top: position.top + 8 }),
        }}
        className="bg-card border border-border rounded-xl shadow-xl overflow-hidden z-[9999]"
      >
        {options.map((opt: any) => (
          <button key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className="w-full px-4 py-2 text-left hover:bg-muted transition-colors">
            {opt.label}
          </button>
        ))}
      </motion.div>
    </AnimatePresence>
  )

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full px-4 py-2 bg-muted border border-border rounded-xl flex justify-between items-center">
        <span>{selected?.label || 'Select...'}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {typeof document !== "undefined" && createPortal(dropdownContent, document.body)}
    </div>
  )
}

const ClientSearchDropdown = ({
  clients,
  filteredClients,
  clientSearch,
  onSearchChange,
  value,
  onChange,
  className = "",
  placement = "top",
}: {
  clients: { id: number; name: string }[]
  filteredClients: { id: number; name: string }[]
  clientSearch: string
  onSearchChange: (v: string) => void
  value: string
  onChange: (v: string) => void
  className?: string
  placement?: "top" | "bottom"
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  const ref = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const selectedLabel = value === "general" ? "General (All Clients)" : clients.find((c) => String(c.id) === value)?.name || value || "General"

  useEffect(() => {
    if (!isOpen || !ref.current) return
    const updatePos = () => {
      if (ref.current) {
        const r = ref.current.getBoundingClientRect()
        setPosition({
          left: r.left,
          width: Math.max(r.width, 220),
          top: placement === "top" ? r.top : r.bottom,
        })
      }
    }
    updatePos()
    window.addEventListener("scroll", updatePos, true)
    window.addEventListener("resize", updatePos)
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50)
    return () => {
      window.removeEventListener("scroll", updatePos, true)
      window.removeEventListener("resize", updatePos)
    }
  }, [isOpen, placement])

  useEffect(() => {
    if (!isOpen) return
    const onOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (ref.current?.contains(target) || menuRef.current?.contains(target)) return
      setIsOpen(false)
    }
    document.addEventListener("mousedown", onOutside)
    return () => document.removeEventListener("mousedown", onOutside)
  }, [isOpen])

  const dropdownContent = isOpen && (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, y: placement === "top" ? 4 : -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: placement === "top" ? 4 : -4 }}
        style={{
          position: "fixed",
          left: position.left,
          width: position.width,
          ...(placement === "top" ? { bottom: window.innerHeight - position.top + 8 } : { top: position.top + 8 }),
        }}
        className="bg-card border border-border rounded-xl shadow-xl overflow-hidden z-[9999]"
      >
        <div className="p-2 border-b border-border">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search client..."
            value={clientSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm"
          />
        </div>
        <div className="max-h-[200px] overflow-y-auto">
          <button
            onClick={() => { onChange("general"); setIsOpen(false); onSearchChange(""); }}
            className={`w-full px-4 py-2 text-left hover:bg-muted transition-colors ${value === "general" ? "bg-primary/10 font-medium" : ""}`}
          >
            General (All Clients)
          </button>
          {filteredClients.map((c) => (
            <button
              key={c.id}
              onClick={() => { onChange(String(c.id)); setIsOpen(false); onSearchChange(""); }}
              className={`w-full px-4 py-2 text-left hover:bg-muted transition-colors ${value === String(c.id) ? "bg-primary/10 font-medium" : ""}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full px-4 py-2 bg-muted border border-border rounded-xl flex justify-between items-center">
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 ml-1 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {typeof document !== "undefined" && createPortal(dropdownContent, document.body)}
    </div>
  )
}

const CustomDateRangeDropdown = ({
  isActive,
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  onSelect,
}: {
  isActive: boolean
  startDate: string
  endDate: string
  onStartChange: (v: string) => void
  onEndChange: (v: string) => void
  onSelect: () => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  const ref = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen || !ref.current) return
    const updatePos = () => {
      if (ref.current) {
        const r = ref.current.getBoundingClientRect()
        setPosition({
          left: r.left,
          width: Math.max(r.width, 200),
          top: r.bottom,
        })
      }
    }
    updatePos()
    window.addEventListener("scroll", updatePos, true)
    window.addEventListener("resize", updatePos)
    return () => {
      window.removeEventListener("scroll", updatePos, true)
      window.removeEventListener("resize", updatePos)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (ref.current?.contains(target) || menuRef.current?.contains(target)) return
      setIsOpen(false)
    }
    document.addEventListener("mousedown", onOutside)
    return () => document.removeEventListener("mousedown", onOutside)
  }, [isOpen])

  const handleOpen = () => {
    if (!isOpen && !startDate && !endDate) {
      const end = new Date()
      const start = new Date(end)
      start.setDate(start.getDate() - 30)
      onEndChange(end.toISOString().slice(0, 10))
      onStartChange(start.toISOString().slice(0, 10))
      onSelect()
    }
    setIsOpen(!isOpen)
  }

  const label = isActive && startDate && endDate
    ? `${new Date(startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${new Date(endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
    : "Custom"

  const dropdownContent = isOpen && (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        style={{
          position: "fixed",
          left: position.left,
          width: position.width,
          top: position.top + 8,
        }}
        className="bg-card border border-border rounded-xl shadow-xl z-[9999] p-3 min-w-[200px]"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Start</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { onStartChange(e.target.value); onSelect() }}
              className="w-full px-2 py-1.5 bg-muted border border-border rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">End</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { onEndChange(e.target.value); onSelect() }}
              className="w-full px-2 py-1.5 bg-muted border border-border rounded-lg text-xs"
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={handleOpen}
        className={`px-3 py-1.5 rounded-lg transition-all text-sm font-medium flex items-center gap-1 ${isActive ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-muted'}`}
      >
        {label}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {typeof document !== "undefined" && createPortal(dropdownContent, document.body)}
    </div>
  )
}

const CardMenu = ({ onExport, onFullscreen, onSettings }: any) => {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, right: 0 })
  const ref = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen || !ref.current) return
    const updatePos = () => {
      if (ref.current) {
        const r = ref.current.getBoundingClientRect()
        setPosition({
          top: r.bottom + 8,
          right: window.innerWidth - r.right,
        })
      }
    }
    updatePos()
    window.addEventListener("scroll", updatePos, true)
    window.addEventListener("resize", updatePos)
    return () => {
      window.removeEventListener("scroll", updatePos, true)
      window.removeEventListener("resize", updatePos)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (ref.current?.contains(target) || menuRef.current?.contains(target)) return
      setIsOpen(false)
    }
    document.addEventListener("mousedown", onOutside)
    return () => document.removeEventListener("mousedown", onOutside)
  }, [isOpen])

  const menuContent = isOpen && (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        style={{
          position: "fixed",
          top: position.top,
          right: position.right,
        }}
        className="bg-card border border-border rounded-xl shadow-xl z-[9999] min-w-[150px] overflow-hidden"
      >
        {onExport && <button onClick={() => { onExport(); setIsOpen(false) }} className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2"><Download className="w-4 h-4" /> Export</button>}
        {onFullscreen && <button onClick={() => { onFullscreen(); setIsOpen(false) }} className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2"><Maximize2 className="w-4 h-4" /> Fullscreen</button>}
        {onSettings && <button onClick={() => { onSettings(); setIsOpen(false) }} className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2"><Settings className="w-4 h-4" /> Settings</button>}
      </motion.div>
    </AnimatePresence>
  )

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-lg hover:bg-muted/50"><MoreVertical className="w-5 h-5" /></button>
      {typeof document !== "undefined" && createPortal(menuContent, document.body)}
    </div>
  )
}

const Notification = ({ message, onClose }: any) => (
  <motion.div initial={{ y: -100 }} animate={{ y: 20 }} exit={{ y: -100 }} className="fixed top-4 right-4 bg-primary text-white p-4 rounded-xl shadow-2xl z-[10000] flex items-center gap-3">
    <CheckCircle className="w-5 h-5" />
    <span>{message}</span>
    <button onClick={onClose}><X className="w-4 h-4" /></button>
  </motion.div>
)

const ConnectionStatus = ({ analytics }: any) => (
  <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-card/80 backdrop-blur-md border border-border p-2 rounded-full shadow-lg">
    <div className={`w-2 h-2 rounded-full ${analytics.lastUpdate ? 'bg-green-500' : 'bg-red-500'}`} />
    <span className="text-[10px] font-bold text-muted-foreground uppercase">{analytics.isRealTimeConnected ? 'Live' : 'Synced'}</span>
  </div>
)

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRangeKey>('12m')
  const [isRealTime, setIsRealTime] = useState(false)
  const [showPrediction, setShowPrediction] = useState(true)
  const [notification, setNotification] = useState<any>(null)

  // Comprehensive analytics state
  const [section, setSection] = useState<SectionId>('profitability')
  const [subType, setSubType] = useState('general')
  const [clientFilter, setClientFilter] = useState<string>('general')
  const [analyticsMetric, setAnalyticsMetric] = useState('net_profit')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  const subTypes = getSubTypes(section)
  const metrics = getAnalyticsMetrics(section)

  const {
    chartData: comprehensiveChartData,
    summary: comprehensiveSummary,
    loading: comprehensiveLoading,
    error: comprehensiveError,
    refetch: refetchComprehensive,
    chartTitle,
    timeLabel,
  } = useComprehensiveAnalytics({
    section,
    subType: subTypes.some((s) => s.id === subType) ? subType : subTypes[0]?.id ?? 'general',
    analyticsMetric,
    timeRange,
    customStartDate: timeRange === 'custom' ? customStartDate : undefined,
    customEndDate: timeRange === 'custom' ? customEndDate : undefined,
    clientId: section === 'profitability' ? clientFilter : undefined,
  })

  const { segments: segmentationSegments, loading: segmentationLoading, error: segmentationError, subtitle: segmentationSubtitle } = useSegmentationData({
    section,
    subType: section === 'profitability' ? 'sales_orders' : (subTypes.some((s) => s.id === subType) ? subType : subTypes[0]?.id ?? 'sales_orders'),
    timeRange,
    customStartDate: timeRange === 'custom' ? customStartDate : undefined,
    customEndDate: timeRange === 'custom' ? customEndDate : undefined,
    clientId: section === 'profitability' ? clientFilter : undefined,
  })

  // Keep subType and analyticsMetric in sync when section changes
  useEffect(() => {
    const ids = subTypes.map((s) => s.id)
    if (!ids.includes(subType)) {
      setSubType(ids[0] ?? 'general')
    }
  }, [section, subTypes, subType])
  useEffect(() => {
    const metricIds = metrics.map((m) => m.id)
    if (!metricIds.includes(analyticsMetric)) {
      setAnalyticsMetric(metricIds[0] ?? 'net_profit')
    }
  }, [section, metrics, analyticsMetric])

  // Client list for profitability filter
  const [clients, setClients] = useState<{ id: number; name: string }[]>([])
  const [clientSearch, setClientSearch] = useState('')
  useEffect(() => {
    fetch('/api/sales/clients', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setClients(Array.isArray(data) ? data : []))
      .catch(() => setClients([]))
  }, [])
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients.slice(0, 50)
    const q = clientSearch.toLowerCase()
    return clients.filter((c) => (c.name || '').toLowerCase().includes(q)).slice(0, 50)
  }, [clients, clientSearch])

  // Modal states
  const [chartSettingsOpen, setChartSettingsOpen] = useState(false)
  const [performanceSettingsOpen, setPerformanceSettingsOpen] = useState(false)
  const [productSettingsOpen, setProductSettingsOpen] = useState(false)
  const [customerSettingsOpen, setCustomerSettingsOpen] = useState(false)

  // Refs for chart capture (PDF export)
  const mainChartRef = useRef<HTMLDivElement>(null)
  const pieChartRef = useRef<HTMLDivElement>(null)

  // Chart settings
  const [chartSettings, setChartSettings] = useState({
    chartType: 'area',
    showPredictions: true,
    dataSource: 'all',
    refreshInterval: '30'
  })

  const [performanceSettings, setPerformanceSettings] = useState({
    revenueGrowth: 80,
    customerSatisfaction: 90,
    orderFulfillment: 85,
    profitMargin: 75,
    marketShare: 70,
    retentionRate: 88
  })

  const [productSettings, setProductSettings] = useState({
    sortBy: 'revenue',
    category: 'all',
    showOutOfStock: true
  })

  const [customerSettings, setCustomerSettings] = useState({
    segmentFilter: 'all',
    exportFormat: 'csv',
    includePersonalData: false
  })

  const effectiveTimeRangeForLegacy = timeRange === 'custom' ? '12m' : timeRange
  const {
    analytics,
    customers,
    products,
    orders,
    aiAnalysis,
    aiLoading: isAIAnalysisLoading,
    generateAIInsights,
  } = useAnalytics(effectiveTimeRangeForLegacy as any)

  const captureChartAsImage = async (el: HTMLElement | null, options?: { scale?: number }) => {
    if (!el || !el.offsetParent) return undefined
    try {
      const canvas = await html2canvas(el, {
        scale: options?.scale ?? 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })
      return canvas.toDataURL('image/png')
    } catch {
      return undefined
    }
  }

  const handleExport = async (type: string) => {
    setNotification({ message: 'Capturing charts and preparing report...' })
    try {
      const [mainChartImage, pieChartImage] = await Promise.all([
        captureChartAsImage(mainChartRef.current),
        captureChartAsImage(pieChartRef.current),
      ])
      setNotification({ message: 'Generating PDF...' })
      await generateAnalyticsReportPDF(
        {
          section,
          subType: section === 'profitability' ? 'sales_orders' : subType,
          clientFilter,
          timeRange,
          timeLabel,
          customStart: timeRange === 'custom' ? customStartDate : undefined,
          customEnd: timeRange === 'custom' ? customEndDate : undefined,
          comprehensiveSummary: comprehensiveSummary ?? null,
          comprehensiveChartData,
          chartTitle,
          analyticsMetric,
          segmentationSegments,
          aiInsights: aiAnalysis?.insights,
          aiSummary: aiAnalysis?.summary,
          clients,
          mainChartImage,
          pieChartImage,
        },
        'analytics_report'
      )
      setNotification({ message: 'Report downloaded successfully!' })
    } catch (err) {
      console.error('Analytics export failed:', err)
      setNotification({ message: 'Export failed. Please try again.' })
    }
  }

  const handleFullscreen = (section: string) => {
    setNotification({ message: `Entering fullscreen for ${section}...` })
  }

  const handleSettings = (name: string) => {
    if (name.includes('chart')) setChartSettingsOpen(true)
    else if (name.includes('performance')) setPerformanceSettingsOpen(true)
    else if (name.includes('Product')) setProductSettingsOpen(true)
    else if (name.includes('Customer')) setCustomerSettingsOpen(true)
  }

  const performanceMetrics = [
    { metric: 'Revenue', value: analytics.growthRate, target: performanceSettings.revenueGrowth },
    { metric: 'Retention', value: 85, target: performanceSettings.retentionRate },
    { metric: 'Profit', value: 72, target: performanceSettings.profitMargin },
    { metric: 'Customers', value: 65, target: performanceSettings.marketShare },
    { metric: 'Velocity', value: 78, target: performanceSettings.orderFulfillment }
  ]


  return (
    <>
      <AnimatePresence>
        {notification && <Notification message={notification.message} onClose={() => setNotification(null)} />}
      </AnimatePresence>

      {/* Settings Modals */}
      <AnimatePresence>
        {chartSettingsOpen && <ChartSettingsModal isOpen={chartSettingsOpen} onClose={() => setChartSettingsOpen(false)} currentSettings={chartSettings} onApply={setChartSettings} />}
        {performanceSettingsOpen && <PerformanceSettingsModal isOpen={performanceSettingsOpen} onClose={() => setPerformanceSettingsOpen(false)} currentSettings={performanceSettings} onApply={setPerformanceSettings} />}
        {productSettingsOpen && <ProductSettingsModal isOpen={productSettingsOpen} onClose={() => setProductSettingsOpen(false)} currentSettings={productSettings} onApply={setProductSettings} />}
        {customerSettingsOpen && <CustomerSettingsModal isOpen={customerSettingsOpen} onClose={() => setCustomerSettingsOpen(false)} currentSettings={customerSettings} onApply={setCustomerSettings} />}
      </AnimatePresence>

      {/* AI Analytics Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="bg-primary rounded-2xl p-8 text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Advanced Analytics Hub</h1>
              <p className="opacity-80">AI-powered insights and predictive analytics engine</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleExport('all')} className="px-4 py-2 bg-white/20 rounded-xl hover:bg-white/30 transition-all flex items-center gap-2"><Download size={18} /> Export</button>
              <button onClick={() => setIsRealTime(!isRealTime)} className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${isRealTime ? 'bg-green-500/40' : 'bg-white/20'}`}><RefreshCw size={18} className={isRealTime ? 'animate-spin' : ''} /> {isRealTime ? 'Live' : 'Go Live'}</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-8">
            {getHeaderStatsConfig(section, subType).map((statDef, i) => {
              const raw = comprehensiveSummary[statDef.valueKey as keyof typeof comprehensiveSummary] ?? 0
              const num = Number(raw)
              const value = statDef.format === 'currency'
                ? `KES ${num >= 1000 ? (num / 1000).toFixed(1) + 'K' : num.toLocaleString()}`
                : statDef.format === 'percent'
                  ? `${num.toFixed(1)}%`
                  : num.toLocaleString()
              const icons = [DollarSign, BarChart3, Users, Package, Target]
              const Icon = icons[i % icons.length]
              return (
                <div key={i} className="bg-white/10 p-4 rounded-xl backdrop-blur-md">
                  <div className="flex items-center gap-2 opacity-70 text-xs mb-1"><Icon size={14} /> {statDef.label}</div>
                  <div className="text-xl font-bold">{comprehensiveLoading ? '...' : value}</div>
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* Filters - single row - overflow-visible so portaled dropdowns can show above/below */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-6 overflow-visible">
        <div className="flex flex-nowrap items-center gap-3 overflow-x-auto overflow-y-visible">
          <CustomDropdown
            options={SECTIONS.map((s) => ({ value: s.id, label: `${s.icon || ''} ${s.label}` }))}
            value={section}
            onChange={(v) => setSection(v as SectionId)}
            className="min-w-[120px] shrink-0"
            placement="top"
          />
          {section === "profitability" ? (
            <ClientSearchDropdown
              clients={clients}
              filteredClients={filteredClients}
              clientSearch={clientSearch}
              onSearchChange={setClientSearch}
              value={clientFilter}
              onChange={setClientFilter}
              className="min-w-[180px] shrink-0"
              placement="top"
            />
          ) : (
            <CustomDropdown
              options={subTypes.map((s) => ({ value: s.id, label: s.label }))}
              value={subType}
              onChange={setSubType}
              className="min-w-[140px] shrink-0"
              placement="top"
            />
          )}
          <label className="flex items-center gap-2 text-sm cursor-pointer shrink-0">
            <input type="checkbox" checked={showPrediction} onChange={(e) => setShowPrediction(e.target.checked)} className="rounded" />
            AI Predictions
          </label>
          <div className="h-5 w-px bg-border shrink-0" aria-hidden />
          {(['7d', '30d', '3m', '6m', '12m'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-lg transition-all text-sm font-medium shrink-0 ${timeRange === r ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-muted'}`}
            >
              {TIME_RANGE_LABELS[r]}
            </button>
          ))}
          <CustomDateRangeDropdown
            isActive={timeRange === 'custom'}
            startDate={customStartDate}
            endDate={customEndDate}
            onStartChange={setCustomStartDate}
            onEndChange={setCustomEndDate}
            onSelect={() => setTimeRange('custom')}
          />
        </div>
      </div>

      {/* Main Grid - min-w-0 fixes ResponsiveContainer inside grid (recharts/recharts#1423) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 min-w-0">
          <ChartCard
            title={chartTitle}
            subtitle={`${timeLabel} performance analysis`}
            action={
              <div className="flex items-center gap-2">
                <CustomDropdown
                  options={metrics.map((m) => ({ value: m.id, label: m.label }))}
                  value={analyticsMetric}
                  onChange={setAnalyticsMetric}
                  className="min-w-[180px]"
                />
                <CardMenu onExport={() => handleExport('analytics')} onSettings={() => handleSettings('chart')} />
              </div>
            }
          >
            {comprehensiveError && (
              <div className="p-4 text-destructive text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {comprehensiveError}
              </div>
            )}
            {comprehensiveLoading ? (
              <div className="h-[350px] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
            ) : comprehensiveChartData.length === 0 ? (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                <p className="text-sm">No data for this period. Try a different time range or section.</p>
              </div>
            ) : (
              <div ref={mainChartRef} className="w-full overflow-x-auto" style={{ minHeight: 350 }}>
                <AnalyticsChartByType
                  data={comprehensiveChartData}
                  dataKey={(() => {
                    const dk = metrics.find((m) => m.id === analyticsMetric)?.dataKey ?? 'amount'
                    const first = comprehensiveChartData[0] as Record<string, unknown> | undefined
                    return first && dk in first ? dk : 'amount'
                  })()}
                  chartType={getChartTypeForMetric(section, analyticsMetric)}
                  format={metrics.find((m) => m.id === analyticsMetric)?.format ?? 'currency'}
                  showPrediction={showPrediction}
                />
              </div>
            )}
          </ChartCard>
        </div>

        <ChartCard title="Performance Radar" subtitle="Metric targets vs actual" className="lg:col-span-1">
          <div className="w-full" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={performanceMetrics}>
                <PolarGrid strokeOpacity={0.1} />
                <PolarAngleAxis dataKey="metric" fontSize={10} />
                <Radar name="Actual" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.5} />
                <Radar name="Target" dataKey="target" stroke="#cfcfcf" fill="none" strokeDasharray="4 4" />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div className="lg:col-span-2">
          <ChartCard title="Top Products" subtitle="Best performing items">
            <div className="space-y-3">
              {products.slice(0, 5).map((p, i) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">{i + 1}</div>
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">KES {Number(p.revenue).toLocaleString()}</p>
                    <p className="text-[10px] text-green-500 font-bold flex items-center justify-end"><ArrowUpRight size={10} /> {(Math.random() * 15).toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        <ChartCard
          title={getSegmentationTitle(section, section === 'profitability' ? 'sales_orders' : subType)}
          subtitle={section === 'profitability' ? `${timeLabel} · ${(clientFilter && clientFilter !== 'general') ? 'Per client' : 'General'}` : `${timeLabel} · ${segmentationSubtitle}`}
        >
          {section === 'profitability' ? (
            // Profitability: use comprehensiveSummary for Paid/Expenses/Net pie + legend
            <>
              {(comprehensiveLoading && !comprehensiveSummary) ? (
                <div className="h-[200px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (() => {
                const paid = Number(comprehensiveSummary?.total_paid ?? 0)
                const expenses = Number(comprehensiveSummary?.total_expenses ?? 0)
                const net = Number(comprehensiveSummary?.net_profit ?? 0)
                const profitabilitySegments = [
                  { name: 'Paid', value: Math.max(0, paid), revenue: paid, color: '#22c55e' },
                  { name: 'Expenses', value: Math.max(0, expenses), revenue: expenses, color: '#f59e0b' },
                  { name: 'Net', value: Math.max(0, net), revenue: net, color: '#3b82f6' },
                ].filter(s => s.value > 0)
                if (profitabilitySegments.length === 0) {
                  return (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                      No data for this period
                    </div>
                  )
                }
                return (
                  <>
                    <div ref={pieChartRef} className="w-full" style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={profitabilitySegments} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {profitabilitySegments.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                          </Pie>
                          <Tooltip
                            formatter={(value: number, name: string, props: any) => {
                              const rev = props.payload?.revenue ?? 0
                              return [`KES ${Number(rev).toLocaleString()}`, name]
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs border-t border-border pt-3">
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full shrink-0 bg-[#22c55e]" /> <span>Paid: KES {formatNumber(paid)}</span></div>
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full shrink-0 bg-[#f59e0b]" /> <span>Expenses: KES {formatNumber(expenses)}</span></div>
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full shrink-0 bg-[#3b82f6]" /> <span>Net: KES {formatNumber(net)}</span></div>
                    </div>
                  </>
                )
              })()}
            </>
          ) : (
            // Other sections: use segmentationSegments
            <>
              {segmentationError && (
                <div className="p-2 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" />
                  {segmentationError}
                </div>
              )}
              {segmentationLoading ? (
                <div className="h-[200px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : segmentationSegments.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                  No data for this period
                </div>
              ) : (
                <>
                  <div ref={pieChartRef} className="w-full" style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={segmentationSegments} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {segmentationSegments.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string, props: any) => {
                            const rev = props.payload?.revenue ?? 0
                            const fmt = section === 'stock' && subType === 'movements' ? rev.toLocaleString() : `KES ${Number(rev).toLocaleString()}`
                            return [`${value}% · ${fmt}`, name]
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-4">
                    {segmentationSegments.map(s => (
                      <div key={s.name} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} /> <span className="truncate">{s.name}</span></div>
                        <div className="font-bold shrink-0">{s.value}%</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </ChartCard>

        <div className="lg:col-span-3">
          <ChartCard title="AI Business Insights" subtitle="Generated by Gemini 3.0" action={<button onClick={generateAIInsights} className="px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all font-bold flex items-center gap-2"><Brain size={18} /> {isAIAnalysisLoading ? 'Processing...' : 'Generate New'}</button>}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {aiAnalysis?.insights?.map((ins: any, i: number) => (
                <div key={i} className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary"><Zap size={16} /></div>
                    <p className="font-bold text-sm">{ins.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{ins.description}</p>
                </div>
              ))}
            </div>
            {aiAnalysis?.summary && (
              <div className="mt-6 p-4 bg-primary/5 border border-primary/10 rounded-xl flex gap-3 items-start">
                <Sparkles className="text-primary mt-1" size={20} />
                <p className="text-sm font-medium italic">{aiAnalysis.summary}</p>
              </div>
            )}
          </ChartCard>
        </div>
      </div>

      <ConnectionStatus analytics={analytics} />
    </>
  )
}