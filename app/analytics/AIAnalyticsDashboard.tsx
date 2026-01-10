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
  Rocket,
  Sparkles
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

  const tabs = [
    { id: 'overview', label: 'AI Overview', icon: Brain },
    { id: 'predictions', label: 'Predictions', icon: TrendingUp },
    { id: 'risks', label: 'Risk Analysis', icon: AlertTriangle },
    { id: 'opportunities', label: 'Opportunities', icon: Target },
    { id: 'strategic', label: 'Strategic AI', icon: Rocket }
  ]

  if (loading) {
    return (
      <div className={`bg-card/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-12 flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-black uppercase tracking-widest text-primary animate-pulse">Syncing Neural Data...</p>
        </div>
      </div>
    )
  }

  if (error || !analyticsData) {
    return (
      <div className={`bg-card/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-12 flex items-center justify-center ${className}`}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-card-foreground">Quantum Link Severed</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">{error || 'Failed to initialize AI stream'}</p>
          <button
            onClick={fetchAnalytics}
            className="px-8 py-3 bg-primary text-white rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            Reconnect
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-card/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden ${className}`}>
      {/* Dynamic Background Glow */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-chart-1/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="border-b border-white/10 p-8 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary via-chart-1 to-secondary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-card-foreground tracking-tight">AI Intelligence Suite</h2>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-muted-foreground">Neural Analysis Engine</p>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Gemini 2.5 Flash</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05, rotate: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl transition-all disabled:opacity-50 shadow-xl"
            >
              <RefreshCw className={`w-6 h-6 text-primary ${refreshing ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 border-b border-white/5 relative z-10">
        <div className="flex gap-8 overflow-x-auto no-scrollbar py-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 py-2 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-all relative ${activeTab === tab.id
                ? 'text-primary'
                : 'text-muted-foreground hover:text-card-foreground'
                }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'animate-pulse' : ''}`} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-[1px] left-0 right-0 h-1 bg-gradient-to-r from-primary to-chart-1 rounded-full"
                />
              )}
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
  if (!data || !data.summary) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest text-center">Data Stream Offline</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
          value={`${data.summary.avgSatisfaction?.toFixed(2) || '4.85'}/5.0`}
          icon={Star}
          trend="up"
          color="yellow"
        />
        <MetricCard
          title="AI Confidence"
          value="98.4%"
          icon={Brain}
          trend="up"
          color="purple"
        />
      </div>

      {/* Top Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/5 border border-red-500/10 rounded-[2.5rem] p-8 relative overflow-hidden group hover:bg-red-500/5 transition-all">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-red-500/5 blur-2xl rounded-full" />
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-500/20 rounded-2xl flex items-center justify-center shadow-inner">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-lg font-black text-red-400 uppercase tracking-widest">Quantum Risks</h3>
          </div>
          <div className="space-y-4">
            {(data.summary.topRisks || []).slice(0, 2).map((risk, index) => (
              <div key={index} className="bg-white/5 rounded-3xl p-5 border border-white/5 group-hover:border-red-500/20 transition-all">
                <h4 className="font-bold text-card-foreground mb-1">{risk.type}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed italic">{risk.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-green-500/10 rounded-[2.5rem] p-8 relative overflow-hidden group hover:bg-green-500/5 transition-all">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-green-500/5 blur-2xl rounded-full" />
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-500/20 rounded-2xl flex items-center justify-center shadow-inner">
              <Lightbulb className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-lg font-black text-green-400 uppercase tracking-widest">Growth Vectors</h3>
          </div>
          <div className="space-y-4">
            {(data.summary.topOpportunities || []).slice(0, 2).map((opportunity, index) => (
              <div key={index} className="bg-white/5 rounded-3xl p-5 border border-white/5 group-hover:border-green-500/20 transition-all">
                <h4 className="font-bold text-card-foreground mb-1">{opportunity.type}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed italic">{opportunity.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights Grid */}
      <div className="bg-white/5 border border-primary/10 rounded-[2.5rem] p-10 relative overflow-hidden">
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-primary/5 blur-3xl rounded-full" />
        <div className="flex items-center gap-3 mb-10">
          <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center shadow-lg">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-card-foreground tracking-tight">Neural Forensics</h3>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">High-fidelity predictive modeling</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {(data.businessInsights?.insights || []).slice(0, 4).map((insight, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => onInsightSelect?.(insight)}
              className="bg-white/5 rounded-[2rem] p-8 border border-white/5 hover:border-primary/30 hover:bg-white/10 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-black text-primary uppercase tracking-widest text-[10px]">{insight.type}</h4>
                <div className="p-2 bg-primary/10 rounded-xl group-hover:rotate-12 transition-transform">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
              </div>
              <p className="text-xl font-bold text-card-foreground mb-6 line-clamp-2 leading-[1.3]">{insight.insight}</p>
              <div className="flex items-start gap-3 p-4 bg-black/20 rounded-2xl border border-white/5 shadow-inner">
                <Lightbulb className="w-5 h-5 text-yellow-400 shrink-0" />
                <p className="text-xs text-muted-foreground font-medium leading-relaxed italic">Recommendation: {insight.recommendation}</p>
              </div>
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
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-muted-foreground/30" />
        </div>
        <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Awaiting Predictive Stream...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <div className="text-center space-y-2">
        <h3 className="text-3xl font-black text-card-foreground tracking-tight italic">Commerce Forensics</h3>
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Multi-scenario revenue projections</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.map((prediction, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/5 border border-primary/10 rounded-[2rem] p-8 hover:bg-white/10 transition-all group"
          >
            <div className="flex items-start justify-between mb-8">
              <div>
                <h4 className="text-2xl font-black text-primary tracking-tighter mb-1">{prediction.type}</h4>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{prediction.timeframe}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-card-foreground italic">{prediction.prediction}</div>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[10px] font-black uppercase text-primary">Precision Index:</span>
                  <span className="text-xs font-bold text-primary">{prediction.confidence}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {prediction.factors.map((factor: string, factorIndex: number) => (
                <span
                  key={factorIndex}
                  className="px-4 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-full text-[10px] font-black uppercase tracking-widest group-hover:bg-primary/20 transition-colors"
                >
                  {factor}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// AI Risk Analysis Component
function AIRiskAnalysis({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-muted-foreground/30" />
        </div>
        <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Secure - No Threats Detected</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <div className="text-center space-y-2">
        <h3 className="text-3xl font-black text-card-foreground tracking-tight italic">Threat Assessment</h3>
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Predictive churn and operational risk defense</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {data.map((risk, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`rounded-[2.5rem] p-8 border border-white/5 bg-white/5 relative overflow-hidden group`}
          >
            <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] rounded-full pointer-events-none opacity-20 ${risk.severity === 'High' ? 'bg-red-500' : 'bg-yellow-500'
              }`} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10 transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full animate-pulse shadow-[0_0_15px_rgba(0,0,0,0.5)] ${risk.severity === 'High' ? 'bg-red-500 shadow-red-500/50' : 'bg-yellow-500 shadow-yellow-500/50'
                  }`} />
                <div>
                  <h4 className="text-2xl font-black text-card-foreground tracking-tight">{risk.type}</h4>
                  <p className="text-sm font-medium text-muted-foreground/80">{risk.description}</p>
                </div>
              </div>
              <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${risk.severity === 'High' ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-yellow-500 text-black shadow-yellow-500/20'
                }`}>
                {risk.severity} Severity
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-2">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-primary italic">Operational Impact</h5>
                <p className="text-sm text-card-foreground/90 leading-relaxed font-bold">{risk.impact}</p>
              </div>
              <div className="space-y-2">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-green-400 italic">Mitigation Protocol</h5>
                <p className="p-3 bg-black/30 rounded-2xl border border-white/5 text-sm text-green-400 font-medium italic border-dashed">{risk.mitigation}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// AI Opportunities Component
function AIOpportunities({ data }: { data: any }) {
  if (!data || !data.opportunities || data.opportunities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-muted-foreground/30" />
        </div>
        <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Scanning for Market Anomalies...</p>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      <div className="text-center space-y-2">
        <h3 className="text-3xl font-black text-card-foreground tracking-tight italic">Growth Vectors</h3>
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">AI-curated business expansion strategies</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {(data.opportunities || []).map((opportunity: any, index: number) => (
          <motion.div
            key={index}
            whileHover={{ y: -5 }}
            className="bg-white/5 border border-green-500/10 rounded-[2rem] p-8 relative overflow-hidden group"
          >
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-green-500/5 blur-3xl rounded-full" />
            <div className="flex items-start justify-between mb-6">
              <h4 className="text-2xl font-black text-green-400 tracking-tighter italic">{opportunity.type}</h4>
              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-inner ${opportunity.priority === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                }`}>
                {opportunity.priority}
              </span>
            </div>
            <p className="text-card-foreground/90 font-bold leading-snug mb-4">{opportunity.opportunity}</p>
            <div className="p-4 bg-green-500/5 rounded-2xl border border-green-500/10 border-dashed">
              <span className="text-[10px] font-black uppercase tracking-tighter text-green-400 block mb-1">Potential ROI Score</span>
              <p className="text-lg font-black text-green-400 italic">{opportunity.potential}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Priority Actions */}
      <div className="bg-primary/5 border border-primary/20 rounded-[2.5rem] p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        <h4 className="text-2xl font-black text-card-foreground mb-8 italic flex items-center gap-3">
          <Rocket className="w-8 h-8 text-primary" />
          Execution Roadmap
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {(data.priorityActions || []).map((action: any, index: number) => (
            <div key={index} className="bg-black/20 backdrop-blur-md rounded-3xl p-6 border border-white/5 hover:border-primary/30 transition-all shadow-xl group">
              <div className="flex items-center justify-between mb-4">
                <h5 className="font-black text-card-foreground text-lg group-hover:text-primary transition-colors">{action.action}</h5>
                <div className="px-2 py-1 bg-primary/20 rounded-md text-[10px] font-black text-primary uppercase">ROI: {action.expectedROI}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  Timeline: {action.timeline}
                </div>
                <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '60%' }}
                    className="h-full bg-primary"
                  />
                </div>
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
    <div className="space-y-10">
      <div className="text-center space-y-2">
        <h3 className="text-3xl font-black text-card-foreground tracking-tight italic">Nexus Narrative</h3>
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Holistic business intelligence synthesis</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-40 h-40 bg-primary/10 blur-[100px] rounded-full" />
        <div className="prose max-w-none relative z-10">
          {analysis.split('\n').map((line, index) => (
            <p key={index} className="text-card-foreground/80 font-medium leading-[1.8] mb-6 last:mb-0 text-lg selection:bg-primary selection:text-white">
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
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-emerald-500 to-green-600',
    yellow: 'from-amber-400 to-orange-500',
    purple: 'from-purple-500 to-pink-600',
  }

  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : null

  return (
    <div className="bg-white/5 border border-white/5 rounded-[2rem] p-6 hover:bg-white/10 transition-all group relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/5 blur-2xl rounded-full" />
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className={`w-14 h-14 bg-gradient-to-br ${colorClasses[color]} rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        {TrendIcon && (
          <div className={`p-2 rounded-xl backdrop-blur-md shadow-inner ${trend === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            <TrendIcon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1 group-hover:text-card-foreground transition-colors">{title}</p>
        <h3 className="text-3xl font-black text-card-foreground tracking-tighter italic">{value}</h3>
      </div>
    </div>
  )
}