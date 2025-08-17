'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAnalytics } from '@/hooks/useAnalytics'
import { formatNairobiDateTime, getCurrentNairobiTime } from '@/lib/timezone'
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Package,
  Calendar, Filter, Download, Share, RefreshCw, Zap, Eye,
  ArrowUpRight, ArrowDownRight, Target, Award, Clock, Star,
  MoreVertical, ChevronDown, Settings, Maximize2, Minimize2,
  AlertCircle, CheckCircle, Info, X, Sparkles, Brain
} from 'lucide-react'
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter, ComposedChart, ReferenceLine, FunnelChart,
  Funnel, LabelList
} from 'recharts'







// Enhanced DashboardCard component matching seller analytics styling
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
    ? 'bg-card/70 backdrop-blur-xl border border-border/50'
    : neumorphic
    ? 'bg-muted shadow-[20px_20px_60px_hsl(var(--muted-foreground)/0.1),-20px_-20px_60px_hsl(var(--background))]'
    : 'bg-card border border-border'

  const gradientStyles = gradient
    ? 'bg-primary text-primary-foreground border-0'
    : ''

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`relative rounded-lg p-6 transition-all duration-300 ${baseStyles} ${gradientStyles}`}
    >
      {/* Background Pattern for gradient cards */}
      {gradient && (
        <div className="absolute inset-0 rounded-lg overflow-hidden opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        </div>
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className={`text-sm font-medium ${
              gradient ? 'text-primary-foreground/80' : 'text-muted-foreground'
            }`}>
              {title}
            </h3>
            <p className={`text-2xl font-bold mt-1 ${
              gradient ? 'text-primary-foreground' : 'text-card-foreground'
            }`}>
              {value}
            </p>
          </div>
          
          {Icon && (
            <div className={`p-3 rounded-md ${
              gradient 
                ? 'bg-white/20 backdrop-blur-sm' 
                : 'bg-primary/10'
            }`}>
              <Icon className={`w-6 h-6 ${
                gradient ? 'text-primary-foreground' : 'text-primary'
              }`} />
            </div>
          )}
        </div>

        {/* Change Indicator */}
        {change !== undefined && (
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${
              change >= 0 
                ? gradient ? 'text-green-100' : 'text-success'
                : gradient ? 'text-red-100' : 'text-error'
            }`}>
              {change >= 0 ? '+' : ''}{change}%
            </span>
            <span className={`text-xs ${
              gradient ? 'text-primary-foreground/70' : 'text-muted-foreground'
            }`}>
              from last month
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Enhanced ChartCard component matching seller analytics styling
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
      transition={{ duration: 0.3 }}
      className={`bg-card/70 backdrop-blur-xl border border-border/50 rounded-lg p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
        </div>
        
        {action || (
          <button className="p-2 rounded-md hover:bg-muted/50 transition-colors">
            <MoreVertical className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Chart Content */}
      <div className="relative">
        {children}
      </div>
    </motion.div>
  )
}

// DashboardLayout component matching seller analytics structure
const DashboardLayout: React.FC<{ userType?: string; children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-background p-6">
    <div className="max-w-7xl mx-auto">
      {children}
    </div>
  </div>
)

// Types
interface SalesData {
  date: string
  revenue: number
  orders: number
  customers: number
  profit: number
}

interface Product {
  id: string
  name: string
  category: string
  price: number
  cost: number
  stock_quantity: number
  units_sold: number
  revenue: number
}

interface Customer {
  id: string
  name: string
  email: string
  segment: string
  lifetime_value: number
  total_orders: number
}

interface Order {
  id: string
  customer_id: string
  total_amount: number
  status: string
  created_at: string
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

  // Reset to current settings when modal opens
  useEffect(() => {
    if (isOpen) {
      setChartType(currentSettings.chartType)
      setShowPredictions(currentSettings.showPredictions)
      setDataSource(currentSettings.dataSource)
      setRefreshInterval(currentSettings.refreshInterval)
    }
  }, [isOpen, currentSettings])

  const handleApply = () => {
    const newSettings = {
      chartType,
      showPredictions,
      dataSource,
      refreshInterval
    }
    onApply(newSettings)
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

        <div>
          <label className="block text-sm font-medium text-card-foreground mb-2">Refresh Interval</label>
          <CustomDropdown
            options={[
              { value: '10', label: '⚡ 10 seconds' },
              { value: '30', label: '🔄 30 seconds' },
              { value: '60', label: '⏱️ 1 minute' },
              { value: '300', label: '⏰ 5 minutes' },
              { value: 'manual', label: '✋ Manual only' }
            ]}
            value={refreshInterval}
            onChange={setRefreshInterval}
          />
        </div>

        <div className="p-4 bg-gradient-to-r from-primary/10 to-chart-1/10 rounded-xl border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="text-sm font-medium text-card-foreground">AI Predictions</span>
                <p className="text-xs text-muted-foreground">Show predictive analytics</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showPredictions}
                onChange={(e) => setShowPredictions(e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-xl hover:bg-muted/80 transition-all duration-200"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-chart-1 text-primary-foreground rounded-xl hover:shadow-lg transition-all duration-200"
          >
            <span className="flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Apply Settings
            </span>
          </motion.button>
        </div>
      </div>
    </SettingsModal>
  )
}

const PerformanceSettingsModal = ({ 
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
  const [targets, setTargets] = useState<{[key: string]: number}>(currentSettings)

  useEffect(() => {
    if (isOpen) {
      setTargets(currentSettings)
    }
  }, [isOpen, currentSettings])

  const handleApply = () => {
    onApply(targets)
    onClose()
  }

  const metricIcons: {[key: string]: string} = {
    revenueGrowth: '💰',
    customerSatisfaction: '😊',
    orderFulfillment: '📦',
    profitMargin: '📈',
    marketShare: '🎯',
    retentionRate: '🔄'
  }

  return (
    <SettingsModal isOpen={isOpen} onClose={onClose} title="Performance Targets">
      <div className="space-y-4">
        {Object.entries(targets).map(([key, value]) => (
          <div key={key} className="p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{metricIcons[key]}</span>
              <div>
                <label className="block text-sm font-medium text-card-foreground">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </label>
                <p className="text-xs text-muted-foreground">Target percentage</p>
              </div>
            </div>
            <div className="relative">
              <input
                type="number"
                value={Number(value)}
                onChange={(e) => setTargets((prev: {[key: string]: number}) => ({ ...prev, [key]: Number(e.target.value) }))}
                className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                min="0"
                max="100"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</div>
            </div>
            <div className="mt-2 w-full bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary to-chart-1 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(Number(value), 100)}%` }}
              />
            </div>
          </div>
        ))}
        
        <div className="flex gap-3 pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-xl hover:bg-muted/80 transition-all duration-200"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-chart-1 text-primary-foreground rounded-xl hover:shadow-lg transition-all duration-200"
          >
            <span className="flex items-center justify-center gap-2">
              <Target className="w-4 h-4" />
              Apply Targets
            </span>
          </motion.button>
        </div>
      </div>
    </SettingsModal>
  );
}

const ProductSettingsModal = ({ 
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
  const [sortBy, setSortBy] = useState(currentSettings.sortBy)
  const [category, setCategory] = useState(currentSettings.category)
  const [showOutOfStock, setShowOutOfStock] = useState(currentSettings.showOutOfStock)

  useEffect(() => {
    if (isOpen) {
      setSortBy(currentSettings.sortBy)
      setCategory(currentSettings.category)
      setShowOutOfStock(currentSettings.showOutOfStock)
    }
  }, [isOpen, currentSettings])

  const handleApply = () => {
    const newSettings = {
      sortBy,
      category,
      showOutOfStock
    }
    onApply(newSettings)
    onClose()
  }

  return (
    <SettingsModal isOpen={isOpen} onClose={onClose} title="Product Display Settings">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-card-foreground mb-2">Sort Products By</label>
          <CustomDropdown
            options={[
              { value: 'revenue', label: '💰 Revenue' },
              { value: 'units_sold', label: '📦 Units Sold' },
              { value: 'profit_margin', label: '📈 Profit Margin' },
              { value: 'name', label: '🔤 Name' }
            ]}
            value={sortBy}
            onChange={setSortBy}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-card-foreground mb-2">Category Filter</label>
          <CustomDropdown
            options={[
              { value: 'all', label: '🌐 All Categories' },
              { value: 'electronics', label: '📱 Electronics' },
              { value: 'clothing', label: '👕 Clothing' },
              { value: 'books', label: '📚 Books' },
              { value: 'home', label: '🏠 Home & Garden' }
            ]}
            value={category}
            onChange={setCategory}
          />
        </div>

        <div className="p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="text-sm font-medium text-card-foreground">Show Out of Stock</span>
                <p className="text-xs text-muted-foreground">Include products with zero inventory</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showOutOfStock}
                onChange={(e) => setShowOutOfStock(e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-xl hover:bg-muted/80 transition-all duration-200"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-chart-1 text-primary-foreground rounded-xl hover:shadow-lg transition-all duration-200"
          >
            <span className="flex items-center justify-center gap-2">
              <Package className="w-4 h-4" />
              Apply Filters
            </span>
          </motion.button>
        </div>
      </div>
    </SettingsModal>
  )
}

const CustomerSettingsModal = ({ 
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
  const [segmentFilter, setSegmentFilter] = useState(currentSettings.segmentFilter)
  const [exportFormat, setExportFormat] = useState(currentSettings.exportFormat)
  const [includePersonalData, setIncludePersonalData] = useState(currentSettings.includePersonalData)

  useEffect(() => {
    if (isOpen) {
      setSegmentFilter(currentSettings.segmentFilter)
      setExportFormat(currentSettings.exportFormat)
      setIncludePersonalData(currentSettings.includePersonalData)
    }
  }, [isOpen, currentSettings])

  const handleApply = () => {
    const newSettings = {
      segmentFilter,
      exportFormat,
      includePersonalData
    }
    onApply(newSettings)
    onClose()
  }

  return (
    <SettingsModal isOpen={isOpen} onClose={onClose} title="Customer Analytics Settings">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-card-foreground mb-2">Customer Segment Filter</label>
          <CustomDropdown
            options={[
              { value: 'all', label: '🌐 All Segments' },
              { value: 'enterprise', label: '🏢 Enterprise' },
              { value: 'smb', label: '🏪 SMB' },
              { value: 'individual', label: '👤 Individual' }
            ]}
            value={segmentFilter}
            onChange={setSegmentFilter}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-card-foreground mb-2">Default Export Format</label>
          <CustomDropdown
            options={[
              { value: 'csv', label: '📊 CSV' },
              { value: 'json', label: '📄 JSON' },
              { value: 'xlsx', label: '📈 Excel' },
              { value: 'pdf', label: '📋 PDF Report' }
            ]}
            value={exportFormat}
            onChange={setExportFormat}
          />
        </div>

        <div className="p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Eye className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <span className="text-sm font-medium text-card-foreground">Include Personal Data</span>
                <p className="text-xs text-muted-foreground">⚠️ Requires GDPR compliance</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includePersonalData}
                onChange={(e) => setIncludePersonalData(e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-xl hover:bg-muted/80 transition-all duration-200"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-chart-1 text-primary-foreground rounded-xl hover:shadow-lg transition-all duration-200"
          >
            <span className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              Apply Settings
            </span>
          </motion.button>
        </div>
      </div>
    </SettingsModal>
  )
}

// Custom Dropdown Component
const CustomDropdown = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select option",
  className = ""
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div className={`relative ${className}`}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-card/70 backdrop-blur-xl border border-border/50 rounded-xl flex items-center justify-between text-card-foreground hover:bg-card/90 transition-all duration-200"
      >
        <span className="font-medium">
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl z-[99999] overflow-hidden"
          >
            {options.map((option) => (
              <motion.button
                key={option.value}
                whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className="w-full px-4 py-3 text-left text-card-foreground hover:bg-muted/50 transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl"
              >
                {option.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Card Menu Component
const CardMenu = ({ onExport, onFullscreen, onSettings }: {
  onExport?: () => void
  onFullscreen?: () => void
  onSettings?: () => void
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
      >
        <MoreVertical className="w-5 h-5 text-muted-foreground" />
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 top-full mt-2 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl z-[99999] min-w-[160px] overflow-hidden"
          >
            {onExport && (
              <motion.button
                whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
                onClick={() => { onExport(); setIsOpen(false) }}
                className="w-full px-4 py-3 text-left text-card-foreground hover:bg-muted/50 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Data
              </motion.button>
            )}
            {onFullscreen && (
              <motion.button
                whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
                onClick={() => { onFullscreen(); setIsOpen(false) }}
                className="w-full px-4 py-3 text-left text-card-foreground hover:bg-muted/50 transition-colors flex items-center gap-2"
              >
                <Maximize2 className="w-4 h-4" />
                Fullscreen
              </motion.button>
            )}
            {onSettings && (
              <motion.button
                whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
                onClick={() => { onSettings(); setIsOpen(false) }}
                className="w-full px-4 py-3 text-left text-card-foreground hover:bg-muted/50 transition-colors flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Settings
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Notification Component
const Notification = ({ type, message, onClose }: {
  type: 'success' | 'error' | 'info'
  message: string
  onClose: () => void
}) => {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info
  }
  
  const colors = {
    success: 'text-success border-success/20 bg-success/10',
    error: 'text-error border-error/20 bg-error/10',
    info: 'text-primary border-primary/20 bg-primary/10'
  }
  
  const Icon = icons[type]
  
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      className={`fixed top-4 right-4 z-50 p-4 rounded-xl border backdrop-blur-xl ${colors[type]} max-w-md`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="ml-auto p-1 rounded-lg hover:bg-black/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

// Connection Status Component for monitoring real-time connections
const ConnectionStatus = ({ analytics }: { analytics: any }) => {
  const [connectionDetails, setConnectionDetails] = useState({
    supabaseConnected: false,
    sseConnected: false,
    lastUpdate: null as Date | null,
    subscriptionCount: 0
  })

  useEffect(() => {
    // Update connection status based on analytics state
    setConnectionDetails({
      supabaseConnected: analytics.lastUpdate !== null,
      sseConnected: analytics.isRealTimeConnected,
      lastUpdate: analytics.lastUpdate,
      subscriptionCount: 4 // We have 4 table subscriptions
    })
  }, [analytics.lastUpdate, analytics.isRealTimeConnected])

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-lg p-3 shadow-lg min-w-[200px]"
      >
        <div className="text-xs font-medium text-muted-foreground mb-2">Connection Status</div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${connectionDetails.supabaseConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span>Supabase: {connectionDetails.supabaseConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${connectionDetails.sseConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
            <span>SSE: {connectionDetails.sseConnected ? 'Connected' : 'Fallback Mode'}</span>
          </div>
          
          {connectionDetails.lastUpdate && (
            <div className="text-xs text-muted-foreground">
                                  Last Update: {formatNairobiDateTime(connectionDetails.lastUpdate)}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '3m' | '6m' | '12m' | 'YTD'>('12m')
  const [isRealTime, setIsRealTime] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState('revenue') // Re-added missing variable
  const [showPrediction, setShowPrediction] = useState(true) // Re-added missing variable
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
  } | null>(null)
  
  // Modal states
  const [chartSettingsOpen, setChartSettingsOpen] = useState(false)
  const [performanceSettingsOpen, setPerformanceSettingsOpen] = useState(false)
  const [productSettingsOpen, setProductSettingsOpen] = useState(false)
  const [customerSettingsOpen, setCustomerSettingsOpen] = useState(false)

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
    retentionRate: 85
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
  
  // Use the analytics hook
  const {
    salesData,
    products,
    customers,
    orders,
    analytics,
    aiAnalysis,
    loading,
    error,
    aiLoading,
    fetchAnalyticsData,
    fetchLiveUpdate, // Add this if available
    generateAIInsights,
    exportSalesData,
    exportProductsData,
    exportCustomersData,
    exportAllData,
    getChartData,
    getCustomerSegments,
    getTopProducts
  } = useAnalytics(timeRange)

  // Update function
  const debouncedLiveUpdate = useCallback(() => {
    if (fetchLiveUpdate) {
      fetchLiveUpdate()
    } else {
      fetchAnalyticsData()
    }
  }, [fetchLiveUpdate, fetchAnalyticsData])

  // Handle export with notifications
  const handleExport = (type: string) => {
    try {
      switch (type) {
        case 'revenue':
          exportSalesData()
          setNotification({ type: 'success', message: 'Sales data exported successfully!' })
          break
        case 'products':
          exportProductsData()
          setNotification({ type: 'success', message: 'Products data exported successfully!' })
          break
        case 'customers':
          exportCustomersData()
          setNotification({ type: 'success', message: 'Customers data exported successfully!' })
          break
        case 'all':
          exportAllData()
          setNotification({ type: 'success', message: 'All analytics data exported successfully!' })
          break
        case 'performance':
          setNotification({ type: 'info', message: 'Performance data export coming soon!' })
          break
        case 'ai-insights':
          if (aiAnalysis) {
            const dataStr = JSON.stringify(aiAnalysis, null, 2)
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
            const exportFileDefaultName = `ai-insights-${getCurrentNairobiTime().toISOString().split('T')[0]}.json`
            const linkElement = document.createElement('a')
            linkElement.setAttribute('href', dataUri)
            linkElement.setAttribute('download', exportFileDefaultName)
            linkElement.click()
            setNotification({ type: 'success', message: 'AI insights exported successfully!' })
          } else {
            setNotification({ type: 'error', message: 'No AI insights to export. Generate insights first.' })
          }
          break
        default:
          setNotification({ type: 'info', message: 'Export feature coming soon!' })
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to export data. Please try again.' })
    }
  }

  // Handle fullscreen
  const handleFullscreen = (chartType: string) => {
    setNotification({ type: 'info', message: `Fullscreen view for ${chartType} coming soon!` })
  }

  // Handle settings
  const handleSettings = (settingsType: string) => {
    switch (settingsType) {
      case 'Revenue chart':
        setChartSettingsOpen(true)
        break
      case 'Performance':
        setPerformanceSettingsOpen(true)
        break
      case 'Products':
        setProductSettingsOpen(true)
        break
      case 'Customer':
        setCustomerSettingsOpen(true)
        break
      case 'AI':
        setNotification({ type: 'info', message: 'AI settings coming soon! Configure model parameters, analysis depth, and prediction accuracy.' })
        break
      default:
        setNotification({ type: 'info', message: `${settingsType} settings coming soon!` })
    }
  }

  // Data refresh
  useEffect(() => {
    if (!isRealTime || loading || chartSettings.refreshInterval === 'manual') return
    
    const intervalMs = chartSettings.refreshInterval === '30' ? 30000 :
                      chartSettings.refreshInterval === '60' ? 60000 :
                      chartSettings.refreshInterval === '300' ? 300000 : 30000
    
    const interval = setInterval(() => {
      if (!loading) {
        if (fetchLiveUpdate) {
          fetchLiveUpdate()
        } else {
          fetchAnalyticsData()
        }
      }
    }, intervalMs)
    
    return () => {
      clearInterval(interval)
    }
  }, [isRealTime, fetchAnalyticsData, fetchLiveUpdate, loading, chartSettings.refreshInterval])

  const chartData = getChartData()
  
  // Add fallback data if chart data is empty
  const fallbackChartData = [
    { date: '2024-01', revenue: 50000, orders: 120, customers: 45, profit: 15000 },
    { date: '2024-02', revenue: 55000, orders: 135, customers: 52, profit: 16500 },
    { date: '2024-03', revenue: 60000, orders: 150, customers: 58, profit: 18000 },
    { date: '2024-04', revenue: 65000, orders: 165, customers: 65, profit: 19500 },
    { date: '2024-05', revenue: 70000, orders: 180, customers: 72, profit: 21000 },
    { date: '2024-06', revenue: 75000, orders: 195, customers: 78, profit: 22500 }
  ]
  
  // Use fallback data if no real data is available
  const displayChartData = chartData.length > 0 ? chartData : fallbackChartData

  // Customer segments for pie chart (filtered by settings)
  const filteredCustomers = customerSettings.segmentFilter === 'all' 
    ? customers 
    : customers.filter(c => c.segment === customerSettings.segmentFilter)
    
  const customerSegments = customerSettings.segmentFilter === 'all' 
    ? [
        { 
          name: 'Enterprise', 
          value: customers.filter(c => c.segment === 'enterprise').length,
          revenue: customers.filter(c => c.segment === 'enterprise').reduce((sum, c) => sum + Number(c.lifetime_value), 0),
          color: 'hsl(var(--chart-1))'
        },
        { 
          name: 'SMB', 
          value: customers.filter(c => c.segment === 'smb').length,
          revenue: customers.filter(c => c.segment === 'smb').reduce((sum, c) => sum + Number(c.lifetime_value), 0),
          color: 'hsl(var(--chart-2))'
        },
        { 
          name: 'Individual', 
          value: customers.filter(c => c.segment === 'individual').length,
          revenue: customers.filter(c => c.segment === 'individual').reduce((sum, c) => sum + Number(c.lifetime_value), 0),
          color: 'hsl(var(--chart-3))'
        }
      ]
    : [
        {
          name: customerSettings.segmentFilter.charAt(0).toUpperCase() + customerSettings.segmentFilter.slice(1),
          value: filteredCustomers.length,
          revenue: filteredCustomers.reduce((sum, c) => sum + Number(c.lifetime_value), 0),
          color: 'hsl(var(--primary))'
        }
      ]

  // Performance metrics using applied settings
  const performanceMetrics = [
    { metric: 'Revenue Growth', value: Math.min(analytics.growthRate, 100), target: performanceSettings.revenueGrowth },
    { metric: 'Customer Satisfaction', value: 92, target: performanceSettings.customerSatisfaction },
    { metric: 'Order Fulfillment', value: 88, target: performanceSettings.orderFulfillment },
    { metric: 'Profit Margin', value: 78, target: performanceSettings.profitMargin },
    { metric: 'Market Share', value: 65, target: performanceSettings.marketShare },
    { metric: 'Retention Rate', value: 89, target: performanceSettings.retentionRate }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span className="text-lg font-medium text-muted-foreground">Loading analytics...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout userType="seller">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}
      </AnimatePresence>

      {/* Settings Modals */}
      <AnimatePresence mode="wait">
        {chartSettingsOpen && (
          <ChartSettingsModal 
            key="chart-settings"
            isOpen={chartSettingsOpen} 
            onClose={() => setChartSettingsOpen(false)}
            currentSettings={chartSettings}
            onApply={(newSettings) => {
              setChartSettings(newSettings)
              setNotification({ 
                type: 'success', 
                message: '📊 Chart settings applied successfully!' 
              })
            }}
          />
        )}
        {performanceSettingsOpen && (
          <PerformanceSettingsModal 
            key="performance-settings"
            isOpen={performanceSettingsOpen} 
            onClose={() => setPerformanceSettingsOpen(false)}
            currentSettings={performanceSettings}
            onApply={(newSettings) => {
              setPerformanceSettings(newSettings)
              setNotification({ 
                type: 'success', 
                message: '🎯 Performance targets updated successfully!' 
              })
            }}
          />
        )}
        {productSettingsOpen && (
          <ProductSettingsModal 
            key="product-settings"
            isOpen={productSettingsOpen} 
            onClose={() => setProductSettingsOpen(false)}
            currentSettings={productSettings}
            onApply={(newSettings) => {
              setProductSettings(newSettings)
              setNotification({ 
                type: 'success', 
                message: '📦 Product display settings applied!' 
              })
            }}
          />
        )}
        {customerSettingsOpen && (
          <CustomerSettingsModal 
            key="customer-settings"
            isOpen={customerSettingsOpen} 
            onClose={() => setCustomerSettingsOpen(false)}
            currentSettings={customerSettings}
            onApply={(newSettings) => {
              setCustomerSettings(newSettings)
              setNotification({ 
                type: 'success', 
                message: '👥 Customer analytics settings updated!' 
              })
            }}
          />
        )}
      </AnimatePresence>

      {/* AI Analytics Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="bg-primary rounded-2xl p-8 text-primary-foreground relative overflow-hidden">
          {/* 3D Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-black/30" />
            <motion.div
              className="absolute -top-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl"
              animate={{ 
                scale: [1, 1.3, 1],
                rotate: [0, 180, 360],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 30, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/10 rounded-full blur-3xl"
              animate={{ 
                scale: [1.3, 1, 1.3],
                rotate: [360, 180, 0],
                opacity: [0.5, 0.3, 0.5]
              }}
              transition={{ duration: 35, repeat: Infinity }}
            />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Advanced Analytics Hub</h1>
                <p className="text-primary-foreground/80 mb-4">AI-powered insights and predictive analytics</p>
              </div>
              
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleExport('all')}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-3xl hover:bg-white/30 transition-colors"
                >
                  <Download className="w-5 h-5 mr-2 inline" />
                  Export
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-3xl hover:bg-white/30 transition-colors"
                >
                  <Share className="w-5 h-5 mr-2 inline" />
                  Share
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsRealTime(!isRealTime)}
                  className={`px-4 py-2 rounded-3xl transition-colors ${
                    isRealTime 
                      ? 'bg-green-500/30 border border-green-400' 
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  <RefreshCw className={`w-5 h-5 mr-2 inline ${isRealTime ? 'animate-spin' : ''}`} />
                  {isRealTime ? 'Live' : 'Paused'}
                </motion.button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5" />
                  <p className="text-primary-foreground/80 text-sm">Total Revenue</p>
                </div>
                <p className="text-2xl font-bold">KES {(analytics.totalRevenue / 1000).toFixed(0)}K</p>
                <p className="text-sm text-green-200 mt-1 flex items-center">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  +{analytics.growthRate.toFixed(1)}% YoY
                </p>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="w-5 h-5" />
                  <p className="text-primary-foreground/80 text-sm">Growth Rate</p>
                </div>
                <p className="text-2xl font-bold">{analytics.growthRate.toFixed(1)}%</p>
                <p className="text-sm text-primary-foreground/80 mt-1">Above target</p>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5" />
                  <p className="text-primary-foreground/80 text-sm">Active Customers</p>
                </div>
                <p className="text-2xl font-bold">{customers.length}</p>
                <p className="text-sm text-green-200 mt-1">+15% retention</p>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Package className="w-5 h-5" />
                  <p className="text-primary-foreground/80 text-sm">Orders/Month</p>
                </div>
                <p className="text-2xl font-bold">{analytics.totalOrders}</p>
                <p className="text-sm text-primary-foreground/80 mt-1">Peak season</p>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="w-5 h-5" />
                  <p className="text-primary-foreground/80 text-sm">Avg Order Value</p>
                </div>
                <p className="text-2xl font-bold">${analytics.avgOrderValue.toFixed(0)}</p>
                <p className="text-sm text-green-200 mt-1">Industry leading</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Time Range Selector & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="bg-card/70 backdrop-blur-xl border border-border/50 rounded-2xl p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex gap-2">
              {(['7d', '30d', '3m', '6m', '12m', 'YTD'] as const).map((range) => (
                <motion.button
                  key={range}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setTimeRange(range)
                    setNotification({ 
                      type: 'info', 
                      message: `Time range updated to ${range}. Data refreshing...` 
                    })
                  }}
                  className={`px-4 py-2 rounded-3xl transition-colors ${
                    timeRange === range
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {range}
                </motion.button>
              ))}
            </div>
            
            <div className="flex gap-4 items-center">
              <label className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                <input
                  type="checkbox"
                  checked={showPrediction}
                  onChange={(e) => setShowPrediction(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                AI Predictions
              </label>
              
              <CustomDropdown
                options={[
                  { value: 'revenue', label: 'Revenue' },
                  { value: 'orders', label: 'Orders' },
                  { value: 'customers', label: 'Customers' },
                  { value: 'profit', label: 'Profit' }
                ]}
                value={selectedMetric}
                onChange={setSelectedMetric}
                className="min-w-[140px]"
              />
              
              {/* Settings Status Indicators */}
              <div className="flex gap-2">
                <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  📊 {chartSettings.chartType}
                </div>
                <div className="px-3 py-1 bg-chart-1/10 text-chart-1 rounded-full text-xs font-medium">
                  🔄 {chartSettings.refreshInterval === 'manual' ? 'Manual' : `${chartSettings.refreshInterval}s`}
                </div>
                {productSettings.category !== 'all' && (
                  <div className="px-3 py-1 bg-chart-2/10 text-chart-2 rounded-full text-xs font-medium">
                    📦 {productSettings.category}
                  </div>
                )}
                {customerSettings.segmentFilter !== 'all' && (
                  <div className="px-3 py-1 bg-chart-3/10 text-chart-3 rounded-full text-xs font-medium">
                    👥 {customerSettings.segmentFilter}
                  </div>
                )}
              </div>
              

            </div>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Revenue Growth"
          value={`${analytics.growthRate.toFixed(1)}%`}
          change={5.2}
          icon={TrendingUp}
          gradient
        />
        
        <DashboardCard
          title="Customer LTV"
          value={`$${(customers.reduce((sum, c) => sum + Number(c.lifetime_value), 0) / customers.length || 0).toFixed(0)}`}
          change={12.8}
          icon={Users}
          neumorphic
        />
        
        <DashboardCard
          title="Conversion Rate"
          value={`${analytics.conversionRate}%`}
          change={-0.3}
          icon={Target}
          glass
        />
        
        <DashboardCard
          title="Avg Order Value"
          value={`$${analytics.avgOrderValue.toFixed(0)}`}
          change={8.7}
          icon={DollarSign}
          glass
        />
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trends - Large Chart */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card/70 backdrop-blur-xl border border-border/50 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">
                  Revenue & Performance Trends
                </h3>
                <p className="text-sm text-muted-foreground">12-month analysis with AI forecasting</p>
              </div>
              <CardMenu 
                onExport={() => handleExport('revenue')}
                onFullscreen={() => handleFullscreen('revenue')}
                onSettings={() => handleSettings('Revenue chart')}
              />
            </div>
            
            <div className="mb-4 flex gap-2">
              {[
                { value: 'revenue', label: 'Revenue' },
                { value: 'profit', label: 'Profit' },
                { value: 'orders', label: 'Orders' }
              ].map((metric) => (
                <motion.button
                  key={metric.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedMetric(metric.value)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    selectedMetric === metric.value
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  {metric.label}
                </motion.button>
              ))}
            </div>
            
            <ResponsiveContainer width="100%" height={350}>
              {(() => {
                // Ensure we have valid data
                if (!displayChartData || displayChartData.length === 0) {
                  return (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No chart data available</p>
                    </div>
                  )
                }
                
                switch (chartSettings.chartType) {
                  case 'area':
                    return (
                      <AreaChart data={displayChartData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'calc(var(--radius) - 2px)',
                            color: 'hsl(var(--card-foreground))'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey={chartSettings.dataSource === 'all' ? selectedMetric : chartSettings.dataSource} 
                          stroke="hsl(var(--primary))" 
                          fillOpacity={1} 
                          fill="url(#revenueGradient)" 
                          strokeWidth={3}
                        />
                        {chartSettings.showPredictions && (
                          <Area 
                            type="monotone" 
                            dataKey="predicted" 
                            stroke="hsl(var(--chart-3))" 
                            strokeDasharray="5 5"
                            fillOpacity={0.3} 
                            fill="hsl(var(--chart-3))" 
                            strokeWidth={2}
                          />
                        )}
                      </AreaChart>
                    )
                  case 'line':
                    return (
                      <LineChart data={displayChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'calc(var(--radius) - 2px)',
                            color: 'hsl(var(--card-foreground))'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey={chartSettings.dataSource === 'all' ? selectedMetric : chartSettings.dataSource} 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3}
                          dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                        />
                        {chartSettings.showPredictions && (
                          <Line 
                            type="monotone" 
                            dataKey="predicted" 
                            stroke="hsl(var(--chart-3))" 
                            strokeDasharray="5 5"
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--chart-3))', strokeWidth: 2, r: 3 }}
                          />
                        )}
                      </LineChart>
                    )
                  case 'bar':
                    return (
                      <BarChart data={displayChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'calc(var(--radius) - 2px)',
                            color: 'hsl(var(--card-foreground))'
                          }}
                        />
                        <Bar 
                          dataKey={chartSettings.dataSource === 'all' ? selectedMetric : chartSettings.dataSource} 
                          fill="hsl(var(--primary))" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    )
                  case 'composed':
                  default:
                    return (
                      <ComposedChart data={displayChartData}>
                        <defs>
                          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'calc(var(--radius) - 2px)',
                            color: 'hsl(var(--card-foreground))'
                          }}
                        />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                          dataKey={selectedMetric} 
                          stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#revenueGradient)" 
                  strokeWidth={3}
                />
                        {selectedMetric === 'revenue' && (
                          <Bar yAxisId="right" dataKey="orders" fill="hsl(var(--chart-2))" opacity={0.6} />
                        )}
                        {selectedMetric === 'revenue' && (
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="profit" 
                            stroke="hsl(var(--chart-3))" 
                  strokeWidth={2}
                            dot={{ fill: 'hsl(var(--chart-3))', strokeWidth: 2, r: 4 }}
                />
                        )}
              </ComposedChart>
                    )
                }
              })()}
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Performance Radar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/70 backdrop-blur-xl border border-border/50 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">Performance Metrics</h3>
              <p className="text-sm text-muted-foreground">Current vs targets</p>
            </div>
            <CardMenu 
              onExport={() => handleExport('performance')}
              onSettings={() => handleSettings('Performance')}
            />
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={performanceMetrics}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="metric" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" fontSize={8} domain={[0, 100]} />
              <Radar 
                name="Current" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary))" 
                fillOpacity={0.6}
                strokeWidth={2}
              />
              <Radar 
                name="Target" 
                dataKey="target" 
                stroke="hsl(var(--chart-3))" 
                fill="hsl(var(--chart-3))" 
                fillOpacity={0.3}
                strokeWidth={2}
                strokeDasharray="5 5"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'calc(var(--radius) - 2px)',
                  color: 'hsl(var(--card-foreground))'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
          
          <div className="mt-4 p-4 bg-primary/10 rounded-3xl">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-primary" />
              <span className="font-medium text-card-foreground">AI Analysis</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Revenue growth exceeding targets by {(analytics.growthRate - 15).toFixed(1)}%. Focus on market share expansion next quarter.
            </p>
          </div>
        </motion.div>

        {/* Top Products Performance */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card/70 backdrop-blur-xl border border-border/50 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-card-foreground">
                Top Products Performance
              </h3>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <CardMenu 
                  onExport={() => handleExport('products')}
                  onSettings={() => handleSettings('Products')}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              {products
                .filter(product => {
                  // Apply category filter
                  if (productSettings.category !== 'all' && product.category !== productSettings.category) {
                    return false
                  }
                  // Apply stock filter
                  if (!productSettings.showOutOfStock && product.stock_quantity === 0) {
                    return false
                  }
                  return true
                })
                .sort((a, b) => {
                  // Apply sorting
                  switch (productSettings.sortBy) {
                    case 'revenue':
                      return Number(b.revenue) - Number(a.revenue)
                    case 'units_sold':
                      return b.units_sold - a.units_sold
                    case 'profit_margin':
                      const aMargin = ((Number(a.price) - Number(a.cost)) / Number(a.price)) * 100
                      const bMargin = ((Number(b.price) - Number(b.cost)) / Number(b.price)) * 100
                      return bMargin - aMargin
                    case 'name':
                      return a.name.localeCompare(b.name)
                    default:
                      return 0
                  }
                })
                .slice(0, 5)
                .map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-3xl bg-muted/30 hover:bg-muted/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-3xl bg-primary flex items-center justify-center text-primary-foreground font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-card-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.units_sold} units sold</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-card-foreground">
                        ${Number(product.revenue).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm font-medium text-card-foreground">
                        {(((Number(product.price) - Number(product.cost)) / Number(product.price)) * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Margin</p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <ArrowUpRight className="w-4 h-4 text-success" />
                      <span className="text-sm font-medium text-success">
                        {(Math.random() * 20 + 5).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Customer Segmentation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/70 backdrop-blur-xl border border-border/50 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-card-foreground">Customer Segments</h3>
            <CardMenu 
              onExport={() => handleExport('customers')}
              onSettings={() => handleSettings('Customer')}
            />
          </div>
          
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={customerSegments}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {customerSegments && customerSegments.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'calc(var(--radius) - 2px)',
                  color: 'hsl(var(--card-foreground))'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="space-y-3 mt-4">
            {customerSegments && customerSegments.map((segment) => (
              <div key={segment.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
                  <span className="text-sm text-muted-foreground">{segment.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{segment.value} customers</p>
                  <p className="text-xs text-muted-foreground">${segment.revenue.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AI-Powered Business Insights - Full Width */}
        <div className="lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-primary/10 via-card/70 to-secondary/10 backdrop-blur-xl border border-border/50 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
            </div>
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground">
                    🤖 AI-Powered Business Insights
                  </h3>
                  <p className="text-sm text-muted-foreground">Powered by Gemini 2.5 Flash</p>
            </div>
          </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={generateAIInsights}
                  disabled={aiLoading}
                  className="px-4 py-2 bg-primary/20 hover:bg-primary/30 rounded-xl text-sm font-medium text-primary transition-all disabled:opacity-50"
                >
                  {aiLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Analyzing...
              </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Refresh Insights
            </div>
        )}
                </button>
                <CardMenu 
                  onExport={() => handleExport('ai-insights')}
                  onSettings={() => handleSettings('AI')}
                />
      </div>
          </div>
          
            {aiLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted/50 rounded-xl w-3/4 mb-2" />
                    <div className="h-3 bg-muted/30 rounded-xl w-1/2" />
              </div>
                ))}
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-4">
                {aiAnalysis.insights && aiAnalysis.insights.map((insight: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-2xl bg-card/50 border border-border/30 hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {insight.type === 'Growth Opportunity' ? '📈' : 
                           insight.type === 'Customer Insight' ? '👥' : 
                           insight.type === 'Timing Optimization' ? '⏰' : '⚠️'}
                        </span>
                        <span className="font-medium text-card-foreground">{insight.title}</span>
            </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          insight.impact === 'High Impact' ? 'bg-red-500/20 text-red-400' :
                          insight.impact === 'Strategic' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {insight.impact}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Confidence: {insight.confidence}
                      </span>
              </div>
              </div>
                    <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                    <p className="text-sm text-card-foreground font-medium">{insight.recommendation}</p>
                </motion.div>
              ))}
                
                {/* AI Forecast Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl border border-primary/20"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <span className="font-medium text-card-foreground">📊 Forecast Insight</span>
              </div>
                  <p className="text-sm text-muted-foreground">
                    {aiAnalysis.summary}
              </p>
                </motion.div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-muted-foreground" />
            </div>
                <p className="text-muted-foreground mb-4">No AI insights generated yet</p>
                <button
                  onClick={generateAIInsights}
                  className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-all"
                >
                  Generate AI Insights
                </button>
          </div>
            )}
        </motion.div>
        </div>
      </div>

      {/* Connection Status Component */}
      <ConnectionStatus analytics={analytics} />
    </DashboardLayout>
  )
}