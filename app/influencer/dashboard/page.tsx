'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Influencer {
  id: string
  email: string
  code: string
  name: string | null
  channelName: string | null
  platform: string | null
}

interface Stats {
  totalClicks: number
  totalConversions: number
  conversionRate: number
  totalEarnings: number
  unpaidEarnings: number
  paidEarnings: number
  conversionsByType: {
    PAGE_VIEW: number
    REGISTRATION: number
    ACCEPTED_OFFER: number
    WORKSHOP_REGISTRATION: number
  }
  recentClicks: number
  recentConversions: number
  monthlyStats: Array<{
    month: string
    clicks: number
    conversions: number
    earnings: number
  }>
}

interface Conversion {
  id: string
  type: string
  convertedAt: string
  isPaid: boolean
  amount: number
}

interface Payment {
  id: string
  amount: number
  status: string
  createdAt: string
  paidAt: string | null
}

export default function InfluencerDashboardPage() {
  const router = useRouter()
  const [influencer, setInfluencer] = useState<Influencer | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentConversions, setRecentConversions] = useState<Conversion[]>([])
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Check auth
      const authRes = await fetch('/api/influencer/auth/me')
      if (!authRes.ok) {
        router.push('/influencer/login')
        return
      }
      const authData = await authRes.json()
      setInfluencer(authData.influencer)

      // Load stats
      const statsRes = await fetch('/api/influencer/stats')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        console.log('[DEBUG] Stats data received:', statsData)
        setStats(statsData.stats)
        setRecentConversions(statsData.recentConversions)
        setRecentPayments(statsData.recentPayments)
      } else if (statsRes.status === 401) {
        // Not authenticated - redirect to login
        router.push('/influencer/login')
        return
      } else {
        console.error('Stats API error:', statsRes.status)
        setError('Fehler beim Laden der Statistiken')
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Fehler beim Laden der Daten')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/influencer/auth/logout', { method: 'POST' })
    router.push('/influencer/login')
  }

  const formatCurrency = (cents: number) => {
    if (cents === undefined || cents === null || isNaN(cents)) {
      console.warn('[FORMAT] Invalid cents value:', cents)
      return '€0.00'
    }
    return `€${(cents / 100).toFixed(2)}`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getTrackingLink = () => {
    return `${window.location.origin}?ref=${influencer?.code}`
  }

  const copyTrackingLink = () => {
    navigator.clipboard.writeText(getTrackingLink())
    alert('Link kopiert!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Lädt...</div>
      </div>
    )
  }

  if (error || !influencer || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error || 'Fehler beim Laden'}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bereifung24 Influencer</h1>
              <p className="text-sm text-gray-600 mt-1">
                {influencer.channelName || influencer.name || influencer.email} • Code: {influencer.code}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/influencer/profile')}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Profil
              </button>
              <button
                onClick={() => router.push('/influencer/payments')}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Auszahlungen
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Abmelden
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Tracking Link */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Dein Tracking-Link</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={getTrackingLink()}
              readOnly
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white font-mono text-sm"
            />
            <button
              onClick={copyTrackingLink}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
            >
              Kopieren
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 mb-1">Gesamtverdienst</div>
            <div className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalEarnings)}</div>
            <div className="text-xs text-gray-500 mt-2">
              Ausgezahlt: {formatCurrency(stats.paidEarnings)}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 mb-1">Klicks</div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalClicks}</div>
            <div className="text-xs text-gray-500 mt-2">
              Letzte 30 Tage: {stats.recentClicks}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 mb-1">Conversions</div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalConversions}</div>
            <div className="text-xs text-gray-500 mt-2">
              Letzte 30 Tage: {stats.recentConversions}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 mb-1">Conversion Rate</div>
            <div className="text-3xl font-bold text-gray-900">{stats.conversionRate}%</div>
            <div className="text-xs text-gray-500 mt-2">
              von allen Klicks
            </div>
          </div>
        </div>

        {/* Conversions by Type */}
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversions nach Typ</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-600">Seitenaufrufe</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {stats.conversionsByType.PAGE_VIEW}
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-600">Registrierung Kunde</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {stats.conversionsByType.REGISTRATION}
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-600">Angenommenes Angebot</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {stats.conversionsByType.ACCEPTED_OFFER}
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-600">Registrierung Werkstatt</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {stats.conversionsByType.WORKSHOP_REGISTRATION}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Conversions */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Neueste Conversions</h2>
            </div>
            <div className="divide-y">
              {recentConversions.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  Noch keine Conversions
                </div>
              ) : (
                recentConversions.map(conv => (
                  <div key={conv.id} className="px-6 py-4 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-900">
                        {conv.type === 'PAGE_VIEW' ? 'Seitenaufruf' :
                         conv.type === 'REGISTRATION' ? 'Registrierung' :
                         'Angebot angenommen'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(conv.convertedAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(conv.amount)}
                      </div>
                      <div className="text-xs">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          conv.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {conv.isPaid ? 'Bezahlt' : 'Offen'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Auszahlungen</h2>
            </div>
            <div className="divide-y">
              {recentPayments.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  Noch keine Auszahlungen
                </div>
              ) : (
                recentPayments.map(payment => (
                  <div key={payment.id} className="px-6 py-4 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(payment.createdAt)}
                      </div>
                    </div>
                    <div>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {payment.status === 'COMPLETED' ? 'Abgeschlossen' :
                         payment.status === 'PENDING' ? 'In Bearbeitung' :
                         payment.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
