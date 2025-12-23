'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

export default function AdminAnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    if (status === 'loading') return

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      router.push('/login')
      return
    }

    fetchAnalytics()
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
            <Link
              href="/admin"
              className="text-gray-600 hover:text-gray-900"
            >
              ← Zurück
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📊 Analytics & Besucherstatistik</h1>
              <p className="mt-1 text-sm text-gray-600">
                Seitenaufrufe und Besucher-Tracking
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Time Range Filter */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zeitraum
          </label>
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

        {analytics && (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Gesamt Seitenaufrufe</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalViews.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Eindeutige Besucher</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.uniqueVisitors.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Views by Day Chart */}
            {analytics.viewsByDay.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">📈 Aufrufe pro Tag</h2>
                <div className="overflow-x-auto">
                  <div className="flex items-end gap-2 min-w-max" style={{ height: '200px' }}>
                    {analytics.viewsByDay.map((day, index) => {
                      const maxCount = Math.max(...analytics.viewsByDay.map(d => d.count))
                      const height = (day.count / maxCount) * 160
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">📄 Top Seiten</h2>
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
                <h2 className="text-lg font-semibold text-gray-900 mb-4">🏪 Werkstatt Landing Pages</h2>
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
                <h2 className="text-lg font-semibold text-gray-900 mb-4">🔗 Top Referrer</h2>
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
