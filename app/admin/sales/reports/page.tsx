'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, TrendingUp, Users, Target, CheckCircle, ListTodo, MapPin, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface Stats {
  totalProspects: number
  byStatus: { status: string; count: number }[]
  byCities: { city: string; count: number }[]
  conversionRate: number
  avgLeadScore: number
  activeTasks: number
  recentActivity: {
    id: string
    type: string
    prospectName: string
    createdAt: string
    createdBy: string
  }[]
}

export default function SalesReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || !session.user) {
      router.push('/login')
      return
    }

    fetchStats()
  }, [status, session, router, timeRange])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/sales/stats?timeRange=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-800'
      case 'CONTACTED': return 'bg-yellow-100 text-yellow-800'
      case 'CONVERTED': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'NEW': return 'Neu'
      case 'CONTACTED': return 'Kontaktiert'
      case 'CONVERTED': return 'Konvertiert'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Lade Reports...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/sales')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Performance-Tracking und Auswertungen
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="week">Letzte Woche</option>
                <option value="month">Letzter Monat</option>
                <option value="quarter">Letztes Quartal</option>
                <option value="year">Letztes Jahr</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gesamt Prospects</p>
                <p className="text-3xl font-bold mt-2">{stats?.totalProspects || 0}</p>
              </div>
              <Users className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-3xl font-bold mt-2">{stats?.conversionRate.toFixed(1) || 0}%</p>
              </div>
              <Target className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ø Lead Score</p>
                <p className="text-3xl font-bold mt-2">{stats?.avgLeadScore.toFixed(0) || 0}</p>
                <p className="text-xs text-gray-500 mt-1">von 100</p>
              </div>
              <TrendingUp className="h-12 w-12 text-primary-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aktive Tasks</p>
                <p className="text-3xl font-bold mt-2">{stats?.activeTasks || 0}</p>
              </div>
              <ListTodo className="h-12 w-12 text-yellow-600 opacity-20" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Status Breakdown */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary-600" />
              Prospects nach Status
            </h3>
            <div className="space-y-3">
              {stats?.byStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${(item.count / (stats?.totalProspects || 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-12 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Cities */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary-600" />
              Top Städte
            </h3>
            <div className="space-y-3">
              {stats?.byCities.slice(0, 5).map((item, index) => (
                <div key={item.city} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                    <span className="text-sm font-medium">{item.city}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(item.count / (stats?.byCities[0]?.count || 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-12 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-600" />
            Jüngste Aktivitäten
          </h3>
          <div className="space-y-3">
            {stats?.recentActivity.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'NOTE' ? 'bg-blue-500' :
                    activity.type === 'TASK' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium">{activity.prospectName}</p>
                    <p className="text-xs text-gray-500">
                      {activity.type === 'NOTE' ? 'Notiz' : activity.type === 'TASK' ? 'Aufgabe' : 'Interaktion'} von {activity.createdBy}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(activity.createdAt).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
