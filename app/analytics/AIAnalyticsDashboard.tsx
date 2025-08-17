'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  BarChart3, 
  PieChart, 
  LineChart,
  Zap,
  Star,
  DollarSign,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Lightbulb,
  Shield,
  Rocket
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AIAnalyticsProps {
  className?: string
  onInsightSelect?: (insight: any) => void
}

interface AnalyticsData {
  businessInsights: {
    insights: any[]
    predictions: any[]
    risks: any[]
    opportunities: any[]
  }
  marketOpportunities: {
    opportunities: any[]
    recommendations: string[]
    priorityActions: any[]
  }
  aiStrategicAnalysis: string
  summary: {
    totalCustomers: number
    totalRevenue: number
    avgSatisfaction: number
    topRisks: any[]
    topOpportunities: any[]
  }
}

export default function AIAnalyticsDashboard({ className = '', onInsightSelect }: AIAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  // Fetch AI analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/ai/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisType: 'comprehensive'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const result = await response.json()
      setAnalyticsData(result.data)
    } catch (err) {
      console.error('Analytics fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      toast({
        title: 'Analytics Error',
        description: 'Failed to load AI analytics. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Refresh analytics
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalytics()
    setRefreshing(false)
    toast({
      title: 'Analytics Refreshed',
      description: 'AI insights have been updated with the latest data.',
    })
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl border border-gray-200 p-8 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <span className="ml-4 text-gray-600">Loading AI Analytics...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-2xl border border-gray-200 p-8 ${className}`}>
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Unavailable</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className={`bg-white rounded-2xl border border-gray-200 p-8 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <span className="ml-4 text-gray-600">Loading AI Analytics...</span>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'AI Overview', icon: Brain },
    { id: 'predictions', label: 'Predictions', icon: TrendingUp },
    { id: 'risks', label: 'Risk Analysis', icon: AlertTriangle },
    { id: 'opportunities', label: 'Opportunities', icon: Target },
    { id: 'strategic', label: 'Strategic AI', icon: Rocket }
  ]

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI Analytics Dashboard</h2>
              <p className="text-sm text-gray-500">Real-time business intelligence powered by Google Gemini 2.5 Flash</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AIOverview data={analyticsData} onInsightSelect={onInsightSelect} />
            </motion.div>
          )}

          {activeTab === 'predictions' && (
            <motion.div
              key="predictions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AIPredictions data={analyticsData.businessInsights?.predictions || []} />
            </motion.div>
          )}

          {activeTab === 'risks' && (
            <motion.div
              key="risks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AIRiskAnalysis data={analyticsData.businessInsights?.risks || []} />
            </motion.div>
          )}

          {activeTab === 'opportunities' && (
            <motion.div
              key="opportunities"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AIOpportunities data={analyticsData.marketOpportunities || { opportunities: [], recommendations: [], priorityActions: [] }} />
            </motion.div>
          )}

          {activeTab === 'strategic' && (
            <motion.div
              key="strategic"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AIStrategicAnalysis analysis={analyticsData.aiStrategicAnalysis || 'Strategic analysis not available'} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// AI Overview Component
function AIOverview({ data, onInsightSelect }: { data: AnalyticsData, onInsightSelect?: (insight: any) => void }) {
  // Ensure data and data.summary exist
  if (!data || !data.summary) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Analytics data not available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Customers"
          value={data.summary.totalCustomers?.toString() || '0'}
          icon={Users}
          trend="stable"
          color="blue"
        />
        <MetricCard
          title="Total Revenue"
          value={`$${data.summary.totalRevenue?.toLocaleString() || '0'}`}
          icon={DollarSign}
          trend="up"
          color="green"
        />
        <MetricCard
          title="Avg Satisfaction"
          value={`${data.summary.avgSatisfaction?.toFixed(2) || '0.00'}/5.0`}
          icon={Star}
          trend="up"
          color="yellow"
        />
        <MetricCard
          title="AI Confidence"
          value="94%"
          icon={Brain}
          trend="up"
          color="purple"
        />
      </div>

      {/* Top Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-red-900">Critical Risks</h3>
          </div>
          <div className="space-y-3">
            {(data.summary.topRisks || []).slice(0, 2).map((risk, index) => (
              <div key={index} className="bg-white/50 rounded-lg p-3">
                <h4 className="font-medium text-red-900">{risk.type}</h4>
                <p className="text-sm text-red-700">{risk.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-green-900">Top Opportunities</h3>
          </div>
          <div className="space-y-3">
            {(data.summary.topOpportunities || []).slice(0, 2).map((opportunity, index) => (
              <div key={index} className="bg-white/50 rounded-lg p-3">
                <h4 className="font-medium text-green-900">{opportunity.type}</h4>
                <p className="text-sm text-green-700">{opportunity.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-purple-900">AI-Powered Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(data.businessInsights?.insights || []).slice(0, 4).map((insight, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              onClick={() => onInsightSelect?.(insight)}
              className="bg-white/60 rounded-lg p-4 cursor-pointer hover:bg-white/80 transition-colors"
            >
              <h4 className="font-medium text-purple-900 mb-2">{insight.type}</h4>
              <p className="text-sm text-purple-700 mb-2">{insight.insight}</p>
              <p className="text-xs text-purple-600 font-medium">💡 {insight.recommendation}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// AI Predictions Component
function AIPredictions({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-2">🔮</div>
        <p className="text-gray-500">No prediction data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">🔮 AI Revenue Predictions</h3>
        <p className="text-gray-600">Machine learning models analyzing your business trajectory</p>
      </div>

      {data.map((prediction, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-xl font-semibold text-blue-900">{prediction.type}</h4>
              <p className="text-blue-700">{prediction.timeframe}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">{prediction.prediction}</div>
              <div className="text-sm text-blue-600">Confidence: {prediction.confidence}</div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {prediction.factors.map((factor: string, factorIndex: number) => (
              <span
                key={factorIndex}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {factor}
              </span>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// AI Risk Analysis Component
function AIRiskAnalysis({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-2">⚠️</div>
        <p className="text-gray-500">No risk data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">⚠️ AI Risk Assessment</h3>
        <p className="text-gray-600">Predictive risk analysis with mitigation strategies</p>
      </div>

      {data.map((risk, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`rounded-xl p-6 ${
            risk.severity === 'High' 
              ? 'bg-gradient-to-r from-red-50 to-red-100' 
              : risk.severity === 'Medium'
              ? 'bg-gradient-to-r from-yellow-50 to-yellow-100'
              : 'bg-gradient-to-r from-gray-50 to-gray-100'
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                risk.severity === 'High' ? 'bg-red-500' :
                risk.severity === 'Medium' ? 'bg-yellow-500' : 'bg-gray-500'
              }`}></div>
              <div>
                <h4 className="text-xl font-semibold text-gray-900">{risk.type}</h4>
                <p className="text-gray-700">{risk.description}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              risk.severity === 'High' ? 'bg-red-200 text-red-800' :
              risk.severity === 'Medium' ? 'bg-yellow-200 text-yellow-800' :
              'bg-gray-200 text-gray-800'
            }`}>
              {risk.severity} Risk
            </span>
          </div>
          
          <div className="space-y-3">
            <div>
              <h5 className="font-medium text-gray-900 mb-1">Impact:</h5>
              <p className="text-gray-700">{risk.impact}</p>
            </div>
            <div>
              <h5 className="font-medium text-gray-900 mb-1">Mitigation Strategy:</h5>
              <p className="text-gray-700">{risk.mitigation}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// AI Opportunities Component
function AIOpportunities({ data }: { data: any }) {
  if (!data || !data.opportunities || data.opportunities.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-2">🚀</div>
        <p className="text-gray-500">No opportunity data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">🚀 Growth Opportunities</h3>
        <p className="text-gray-600">AI-identified opportunities for business expansion</p>
      </div>

      {/* Opportunities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(data.opportunities || []).map((opportunity: any, index: number) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <h4 className="text-lg font-semibold text-green-900">{opportunity.type}</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                opportunity.priority === 'High' ? 'bg-red-200 text-red-800' :
                opportunity.priority === 'Medium' ? 'bg-yellow-200 text-yellow-800' :
                'bg-green-200 text-green-800'
              }`}>
                {opportunity.priority} Priority
              </span>
            </div>
            <p className="text-green-700 mb-3">{opportunity.opportunity}</p>
            <p className="text-green-800 font-medium">{opportunity.potential}</p>
          </motion.div>
        ))}
      </div>

      {/* Priority Actions */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-blue-900 mb-4">Priority Actions</h4>
        <div className="space-y-3">
          {(data.priorityActions || []).map((action: any, index: number) => (
            <div key={index} className="bg-white/60 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-blue-900">{action.action}</h5>
                <span className="text-sm text-blue-600">ROI: {action.expectedROI}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Clock className="w-4 h-4" />
                Timeline: {action.timeline}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// AI Strategic Analysis Component
function AIStrategicAnalysis({ analysis }: { analysis: string }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">🧠 Strategic AI Analysis</h3>
        <p className="text-gray-600">Comprehensive business strategy powered by AI</p>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
        <div className="prose max-w-none text-gray-800">
          {analysis.split('\n').map((line, index) => (
            <p key={index} className="mb-4 leading-relaxed">
              {line.trim()}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

// Metric Card Component
function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color 
}: { 
  title: string
  value: string
  icon: any
  trend: 'up' | 'down' | 'stable'
  color: 'blue' | 'green' | 'yellow' | 'purple'
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    purple: 'from-purple-500 to-purple-600',
  }

  const trendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 bg-gradient-to-br ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trendIcon && (
          <trendIcon className={`w-5 h-5 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
        )}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm text-gray-600">{title}</p>
      </div>
    </div>
  )
} 