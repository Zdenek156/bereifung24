'use client'

import { useEffect, useState } from 'react'

interface KPIData {
  commissionThisMonth: number
  commissionChange: number
  activeWorkshopCount: number
  totalWorkshopCount: number
  bookingsThisMonth: number
  bookingsChange: number
  openLeads: number
  conversionRate: number
  tier: { tier: string, percentage: number, label: string, color: string }
}

interface TierData {
  currentTier: string
  tierLabel: string
  percentage: number
  activeWorkshops: number
  nextTier: string | null
  workshopsNeeded: number
  progress: number
  message: string
}

interface ChartPoint {
  period: string
  label: string
  value: number
  count: number
}

interface Activity {
  id: string
  type: string
  description: string
  timestamp: string
  icon: string
}

function KPICard({ title, value, change, suffix, icon }: { title: string, value: string | number, change?: number, suffix?: string, icon: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {change !== undefined && (
          <span className={`text-sm font-medium ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'}`}>
            {change > 0 ? '↑' : change < 0 ? '↓' : '→'} {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}{suffix}</p>
      <p className="text-sm text-gray-500 mt-1">{title}</p>
    </div>
  )
}

function SimpleBarChart({ data, label }: { data: ChartPoint[], label: string }) {
  const maxValue = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700">{label}</h3>
      <div className="flex items-end gap-2 h-40">
        {data.map((point) => (
          <div key={point.period} className="flex-1 flex flex-col items-center">
            <span className="text-xs text-gray-600 mb-1">{typeof point.value === 'number' && point.value % 1 !== 0 ? point.value.toFixed(2) : point.value}</span>
            <div
              className="w-full bg-blue-500 rounded-t transition-all duration-500"
              style={{ height: `${Math.max(4, (point.value / maxValue) * 120)}px` }}
            />
            <span className="text-xs text-gray-500 mt-1">{point.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function FreelancerDashboard() {
  const [kpis, setKpis] = useState<KPIData | null>(null)
  const [tier, setTier] = useState<TierData | null>(null)
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [chartType, setChartType] = useState<'bookings' | 'volume' | 'commission'>('bookings')
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchChart()
  }, [chartType])

  async function fetchData() {
    try {
      const [kpiRes, tierRes, actRes] = await Promise.all([
        fetch('/api/freelancer/dashboard/kpis'),
        fetch('/api/freelancer/dashboard/tier'),
        fetch('/api/freelancer/dashboard/activity'),
      ])
      if (kpiRes.ok) setKpis(await kpiRes.json())
      if (tierRes.ok) setTier(await tierRes.json())
      if (actRes.ok) {
        const data = await actRes.json()
        setActivities(data.activities)
      }
    } catch (err) {
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchChart() {
    try {
      const res = await fetch(`/api/freelancer/dashboard/chart?type=${chartType}`)
      if (res.ok) {
        const data = await res.json()
        setChartData(data.data)
      }
    } catch (err) {
      console.error('Chart error:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Übersicht</h1>
        <p className="text-gray-500">Willkommen zurück!</p>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard icon="💰" title="Provision (Monat)" value={`${kpis.commissionThisMonth.toFixed(2)}€`} change={kpis.commissionChange} />
          <KPICard icon="🔧" title="Aktive Werkstätten" value={kpis.activeWorkshopCount} />
          <KPICard icon="📅" title="Buchungen (Monat)" value={kpis.bookingsThisMonth} change={kpis.bookingsChange} />
          <KPICard icon="🎯" title="Offene Leads" value={kpis.openLeads} />
          <KPICard icon="📈" title="Conversion Rate" value={kpis.conversionRate} suffix="%" />
        </div>
      )}

      {/* Tier Progress */}
      {tier && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Stufenfortschritt</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              tier.currentTier === 'EXPERT' ? 'bg-amber-100 text-amber-800' :
              tier.currentTier === 'PRO' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {tier.tierLabel} ({tier.percentage}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                tier.currentTier === 'EXPERT' ? 'bg-amber-500' :
                tier.currentTier === 'PRO' ? 'bg-blue-500' :
                'bg-gray-500'
              }`}
              style={{ width: `${tier.progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">{tier.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Aktivität (6 Monate)</h2>
            <div className="flex gap-1">
              {(['bookings', 'volume', 'commission'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`px-3 py-1 text-xs rounded-full ${chartType === type ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {type === 'bookings' ? 'Buchungen' : type === 'volume' ? 'Volumen' : 'Provision'}
                </button>
              ))}
            </div>
          </div>
          <SimpleBarChart
            data={chartData}
            label={chartType === 'bookings' ? 'Buchungen' : chartType === 'volume' ? 'Volumen (€)' : 'Provision (€)'}
          />
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Letzte Aktivitäten</h2>
          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-gray-500 text-sm">Noch keine Aktivitäten vorhanden.</p>
            ) : (
              activities.map(activity => (
                <div key={activity.id} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                  <span className="text-lg mt-0.5">{activity.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
