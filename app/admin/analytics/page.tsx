'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BackButton from '@/components/BackButton'

interface AnalyticsData {
  timeRange: string
  startDate: string
  endDate: string
  totalViews: number
  uniqueVisitors: number
  viewsByPage: Array<{ path: string; count: number }>
  viewsByDay: Array<{ date: string; count: number }>
  workshopViews: Array<{ workshopId: string; workshopName: string; count: number }>
  topReferrers: Array<{ referrer: string; count: number }>
}

interface GSCData {
  overview: {
    totalClicks: number
    totalImpressions: number
    avgCtr: number
    avgPosition: number
  }
  topQueries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>
  topPages: Array<{ page: string; clicks: number; impressions: number; ctr: number; position: number }>
  dailyData: Array<{ date: string; clicks: number; impressions: number }>
}

interface AppAnalyticsData {
  overview: {
    activeUsers: number
    newUsers: number
    sessions: number
    screenViews: number
    engagedSessions: number
    avgSessionDuration: number
    crashFreeRate: number
  }
  dailyData: Array<{ date: string; activeUsers: number; sessions: number; screenViews: number }>
  topScreens: Array<{ screen: string; views: number; users: number }>
  topEvents: Array<{ event: string; count: number; users: number }>
  platforms: Array<{ platform: string; users: number; sessions: number }>
  timeRange: string
}

export default function AdminAnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')
  const [gscData, setGscData] = useState<GSCData | null>(null)
  const [gscLoading, setGscLoading] = useState(false)
  const [gscError, setGscError] = useState<string | null>(null)
  const [gscConfigured, setGscConfigured] = useState(true)
  const [gscFilter, setGscFilter] = useState('')
  const [gscTimeRange, setGscTimeRange] = useState('7d')
  const [appData, setAppData] = useState<AppAnalyticsData | null>(null)
  const [appLoading, setAppLoading] = useState(false)
  const [appError, setAppError] = useState<string | null>(null)
  const [appTimeRange, setAppTimeRange] = useState('30d')

  useEffect(() => {
    if (status === 'loading') return

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      router.push('/login')
      return
    }

    fetchAnalytics()
    fetchGSCData()
    fetchAppData()
  }, [session, status, router, timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`)
      const data = await response.json()

      if (response.ok) {
        setAnalytics(data)
      } else {
        alert('Fehler beim Laden der Statistiken')
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      alert('Fehler beim Laden der Statistiken')
    } finally {
      setLoading(false)
    }
  }

  const fetchGSCData = async (tr?: string, filter?: string) => {
    try {
      setGscLoading(true)
      setGscError(null)
      const range = tr || gscTimeRange
      const filterParam = filter !== undefined ? filter : gscFilter
      let url = `/api/admin/analytics/search-console?timeRange=${range}`
      if (filterParam) url += `&filter=${encodeURIComponent(filterParam)}`
      
      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        setGscData(data)
        setGscConfigured(true)
      } else {
        setGscError(data.error)
        setGscConfigured(data.configured !== false)
      }
    } catch (error) {
      console.error('Error fetching GSC data:', error)
      setGscError('Verbindungsfehler')
    } finally {
      setGscLoading(false)
    }
  }

  const handleGscTimeRangeChange = (range: string) => {
    setGscTimeRange(range)
    fetchGSCData(range)
  }

  const handleGscFilterChange = (filter: string) => {
    setGscFilter(filter)
    fetchGSCData(undefined, filter)
  }

  const fetchAppData = async (tr?: string) => {
    try {
      setAppLoading(true)
      setAppError(null)
      const range = tr || appTimeRange
      const response = await fetch(`/api/admin/analytics/app?timeRange=${range}`)
      const data = await response.json()

      if (response.ok) {
        setAppData(data)
      } else {
        setAppError(data.error || 'Fehler beim Laden')
      }
    } catch (error) {
      console.error('Error fetching app analytics:', error)
      setAppError('Verbindungsfehler')
    } finally {
      setAppLoading(false)
    }
  }

  const handleAppTimeRangeChange = (range: string) => {
    setAppTimeRange(range)
    fetchAppData(range)
  }

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.round(seconds % 60)
    return m > 0 ? `${m}m ${s}s` : `${s}s`
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📊 Analytics & Besucherstatistik</h1>
              <p className="mt-1 text-sm text-gray-600">
                Seitenaufrufe, Besucher-Tracking, Google Search Console und App-Statistiken
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Time Range Filter */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap gap-6 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zeitraum (Website)</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: '24h', label: 'Letzte 24 Stunden' },
                  { value: '7d', label: 'Letzte 7 Tage' },
                  { value: '30d', label: 'Letzte 30 Tage' },
                  { value: '90d', label: 'Letzte 90 Tage' },
                  { value: 'year', label: 'Letztes Jahr' },
                  { value: 'all', label: 'Gesamt' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTimeRange(option.value)}
                    className={`px-4 py-2 rounded-lg ${
                      timeRange === option.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            {gscConfigured && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Zeitraum (Google)</label>
                  <div className="flex gap-2">
                    {[
                      { value: '7d', label: '7 Tage' },
                      { value: '30d', label: '30 Tage' },
                      { value: '90d', label: '90 Tage' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleGscTimeRangeChange(option.value)}
                        className={`px-3 py-2 rounded-lg text-sm ${gscTimeRange === option.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Google Filter</label>
                  <div className="flex gap-2">
                    {[
                      { value: '', label: 'Alle Seiten' },
                      { value: 'werkstatt', label: 'Werkstatt-SEO' },
                      { value: 'ratgeber', label: 'Blog' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleGscFilterChange(option.value)}
                        className={`px-3 py-2 rounded-lg text-sm ${gscFilter === option.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Overview Stats - Combined */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {/* Website Stats */}
          {analytics && (
            <>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className="text-xs font-medium text-gray-500">Seitenaufrufe</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalViews.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-xs font-medium text-gray-500">Besucher</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{analytics.uniqueVisitors.toLocaleString()}</p>
              </div>
            </>
          )}
          {/* GSC Stats */}
          {gscData && (
            <>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <p className="text-xs font-medium text-gray-500">Google Klicks</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">{gscData.overview.totalClicks.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <p className="text-xs font-medium text-gray-500">Impressions</p>
                </div>
                <p className="text-2xl font-bold text-purple-600">{gscData.overview.totalImpressions.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <p className="text-xs font-medium text-gray-500">Klickrate (CTR)</p>
                </div>
                <p className="text-2xl font-bold text-green-600">{(gscData.overview.avgCtr * 100).toFixed(1)}%</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <p className="text-xs font-medium text-gray-500">Ø Position</p>
                </div>
                <p className="text-2xl font-bold text-orange-600">{gscData.overview.avgPosition.toFixed(1)}</p>
              </div>
            </>
          )}
          {!gscConfigured && (
            <div className="col-span-2 md:col-span-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-700">
                🔍 Google Search Console nicht konfiguriert.{' '}
                <Link href="/admin/api-settings" className="font-medium underline hover:text-yellow-900">API-Einstellungen öffnen</Link>
              </p>
            </div>
          )}
          {gscLoading && !gscData && (
            <div className="col-span-2 md:col-span-4 flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        {/* GSC Daily Chart - Klicks & Impressions */}
        {gscData && gscData.dailyData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📈 Google Klicks & Impressions pro Tag</h2>
            <div className="overflow-x-auto">
              <div className="flex items-end gap-1 min-w-max" style={{ height: '180px' }}>
                {gscData.dailyData.map((day, index) => {
                  const maxImpressions = Math.max(...gscData.dailyData.map(d => d.impressions))
                  const impressionHeight = maxImpressions > 0 ? (day.impressions / maxImpressions) * 140 : 0
                  const clickHeight = maxImpressions > 0 ? (day.clicks / maxImpressions) * 140 : 0
                  return (
                    <div key={index} className="flex flex-col items-center relative group" style={{ minWidth: '28px' }}>
                      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                        {day.clicks} Klicks / {day.impressions} Impressions
                      </div>
                      <div className="w-5 bg-purple-200 rounded-t relative" style={{ height: `${impressionHeight}px` }}>
                        <div className="absolute bottom-0 w-full bg-blue-500 rounded-t" style={{ height: `${clickHeight}px` }}></div>
                      </div>
                      <p className="text-[9px] text-gray-500 mt-1 rotate-45 origin-top-left w-12">
                        {new Date(day.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-4 mt-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded"></span> Klicks</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-200 rounded"></span> Impressions</span>
              </div>
            </div>
          </div>
        )}

        {/* GSC Top Keywords */}
        {gscData && gscData.topQueries.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🔑 Top Suchanfragen (Google)</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Suchanfrage</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Klicks</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Impressions</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">CTR</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Position</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {gscData.topQueries.map((q, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{q.query}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600">{q.clicks}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">{q.impressions.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">{(q.ctr * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className={`font-semibold ${q.position <= 10 ? 'text-green-600' : q.position <= 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {q.position.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* GSC Top Pages */}
        {gscData && gscData.topPages.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📄 Top Seiten (Google)</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seite</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Klicks</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Impressions</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">CTR</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Position</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {gscData.topPages.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-mono">{p.page}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600">{p.clicks}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">{p.impressions.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">{(p.ctr * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className={`font-semibold ${p.position <= 10 ? 'text-green-600' : p.position <= 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {p.position.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== APP ANALYTICS SECTION ===== */}
        <div className="border-t my-8"></div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">📱 App-Statistiken (Firebase)</h2>
          <div className="flex gap-2">
            {[
              { value: '7d', label: '7 Tage' },
              { value: '30d', label: '30 Tage' },
              { value: '90d', label: '90 Tage' },
              { value: 'year', label: '1 Jahr' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleAppTimeRangeChange(option.value)}
                className={`px-3 py-1.5 rounded-lg text-sm ${appTimeRange === option.value ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {appLoading && !appData && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        )}

        {appError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">❌ {appError}</p>
          </div>
        )}

        {appData && (
          <>
            {/* App Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <p className="text-xs font-medium text-gray-500">Aktive Nutzer</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{appData.overview.activeUsers.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className="text-xs font-medium text-gray-500">Neue Nutzer</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{appData.overview.newUsers.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <p className="text-xs font-medium text-gray-500">Sessions</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{appData.overview.sessions.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <p className="text-xs font-medium text-gray-500">Bildschirmaufrufe</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{appData.overview.screenViews.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                  <p className="text-xs font-medium text-gray-500">Aktive Sessions</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{appData.overview.engagedSessions.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <p className="text-xs font-medium text-gray-500">Ø Session-Dauer</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatDuration(appData.overview.avgSessionDuration)}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-xs font-medium text-gray-500">Absturzfrei</p>
                </div>
                <p className="text-2xl font-bold text-green-600">{(appData.overview.crashFreeRate * 100).toFixed(1)}%</p>
              </div>
            </div>

            {/* App Platform Breakdown */}
            {appData.platforms.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {appData.platforms.map((p, i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
                    <div className="text-3xl">
                      {p.platform.toLowerCase().includes('android') ? '🤖' : p.platform.toLowerCase().includes('ios') ? '🍎' : '💻'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{p.platform}</p>
                      <p className="text-sm text-gray-600">{p.users} Nutzer · {p.sessions} Sessions</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* App Daily Active Users Chart */}
            {appData.dailyData.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Aktive Nutzer pro Tag</h3>
                <div className="overflow-x-auto">
                  <div className="flex items-end gap-1 min-w-max" style={{ height: '200px' }}>
                    {appData.dailyData.map((day, index) => {
                      const maxUsers = Math.max(...appData.dailyData.map(d => d.activeUsers))
                      const height = maxUsers > 0 ? (day.activeUsers / maxUsers) * 160 : 0
                      const dateStr = day.date.length === 8
                        ? `${day.date.slice(0, 4)}-${day.date.slice(4, 6)}-${day.date.slice(6, 8)}`
                        : day.date
                      return (
                        <div key={index} className="flex flex-col items-center relative group" style={{ minWidth: '28px' }}>
                          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                            {day.activeUsers} Nutzer · {day.sessions} Sessions
                          </div>
                          <div
                            className="w-5 bg-emerald-500 rounded-t hover:bg-emerald-600 transition-colors"
                            style={{ height: `${height}px` }}
                          />
                          <p className="text-[9px] text-gray-500 mt-1 rotate-45 origin-top-left w-12">
                            {new Date(dateStr).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* App Top Screens */}
            {appData.topScreens.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📱 Top Bildschirme</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bildschirm</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aufrufe</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nutzer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {appData.topScreens.map((s, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 font-mono">{s.screen}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-emerald-600">{s.views.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600">{s.users.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* App Top Events */}
            {appData.topEvents.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Top Ereignisse</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Anzahl</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nutzer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {appData.topEvents.map((e, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 font-mono">{e.event}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-purple-600">{e.count.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600">{e.users.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ===== WEBSITE ANALYTICS SECTION ===== */}
        {analytics && (
          <>
            {/* Divider */}
            <div className="border-t my-8"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">🌐 Website-Statistiken</h2>

            {/* Views by Day Chart */}
            {analytics.viewsByDay.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Seitenaufrufe pro Tag</h3>
                <div className="overflow-x-auto">
                  <div className="flex items-end gap-2 min-w-max" style={{ height: '200px' }}>
                    {analytics.viewsByDay.map((day, index) => {
                      const maxCount = Math.max(...analytics.viewsByDay.map(d => d.count))
                      const height = maxCount > 0 ? (day.count / maxCount) * 160 : 0
                      return (
                        <div key={index} className="flex flex-col items-center">
                          <div
                            className="w-12 bg-primary-600 rounded-t hover:bg-primary-700 transition-colors relative group"
                            style={{ height: `${height}px` }}
                          >
                            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                              {day.count} Aufrufe
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mt-2 rotate-45 origin-top-left w-16">
                            {new Date(day.date).toLocaleDateString('de-DE', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Views by Page */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📄 Top Seiten (Website)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seite</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aufrufe</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Anteil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {analytics.viewsByPage.map((page, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 font-mono">{page.path}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">
                          {page.count.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                          {((page.count / analytics.totalViews) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Workshop Landing Page Views */}
            {analytics.workshopViews.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🏪 Werkstatt Landing Pages</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Werkstatt</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aufrufe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {analytics.workshopViews.map((workshop, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{workshop.workshopName}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">
                            {workshop.count.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Top Referrers */}
            {analytics.topReferrers.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🔗 Top Referrer</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quelle</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Besucher</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {analytics.topReferrers.map((referrer, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 font-mono break-all">
                            {referrer.referrer || 'Direktaufruf'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">
                            {referrer.count.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
