'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Influencer {
  id: string
  email: string
  code: string
  platform: string | null
  channelName: string | null
  channelUrl: string | null
  isActive: boolean
  isRegistered: boolean
  commissionPer1000Views: number
  commissionPerRegistration: number
  commissionPerAcceptedOffer: number
  activeFrom: string | null
  activeUntil: string | null
  isUnlimited: boolean
  totalClicks: number
  totalConversions: number
  unpaidEarnings: number
  paidEarnings: number
  createdAt: string
}

interface Stats {
  totalInfluencers: number
  activeInfluencers: number
  totalClicks: number
  conversionsByType: {
    PAGE_VIEW?: number
    REGISTRATION?: number
    ACCEPTED_OFFER?: number
    WORKSHOP_REGISTRATION?: number
  }
  unpaidCommissions: number
  paidCommissions: number
  recentConversions: number
  conversionRate: number
  topPerformers: Array<{
    id: string
    code: string
    email: string
    channelName: string | null
    platform: string | null
    conversions: number
  }>
}

export default function InfluencerManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [settings, setSettings] = useState({
    defaultPer1000Views: 300,
    defaultPerRegistration: 1500,
    defaultPerAcceptedOffer: 2500
  })
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      loadData()
    }
  }, [status, router])

  const loadData = async () => {
    try {
      const [influencersRes, statsRes, settingsRes] = await Promise.all([
        fetch('/api/admin/influencers'),
        fetch('/api/admin/influencers/stats'),
        fetch('/api/admin/influencer-settings')
      ])

      if (influencersRes.ok) {
        const data = await influencersRes.json()
        setInfluencers(data)
      }

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }

      if (settingsRes.ok) {
        const data = await settingsRes.json()
        if (data.settings) {
          setSettings(data.settings)
        }
      }

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSettings(true)

    try {
      const response = await fetch('/api/admin/influencer-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        alert('Einstellungen erfolgreich gespeichert!')
        setShowSettings(false)
      } else {
        alert('Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Fehler beim Speichern')
    } finally {
      setSavingSettings(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('de-DE')
  }

  const getPlatformBadgeColor = (platform: string | null) => {
    switch (platform) {
      case 'TIKTOK': return 'bg-pink-100 text-pink-800'
      case 'INSTAGRAM': return 'bg-purple-100 text-purple-800'
      case 'YOUTUBE': return 'bg-red-100 text-red-800'
      case 'FACEBOOK': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Influencer-Daten...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="text-blue-600 hover:text-blue-800 mb-3 inline-flex items-center text-sm"
          >
            ← Zurück zum Dashboard
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Influencer Management</h1>
              <p className="mt-2 text-gray-600">Verwalte Influencer, verfolge Performance und verarbeite Zahlungen</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/admin/influencer-applications')}
                className="px-4 py-2 bg-white border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                📝 Bewerbungen
              </button>
              <button
                onClick={() => router.push('/admin/notifications')}
                className="px-4 py-2 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Benachrichtigungen
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Influencer</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stats.activeInfluencers}</div>
                      <div className="ml-2 text-sm text-gray-500">/ {stats.totalInfluencers} gesamt</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Clicks</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stats.totalClicks}</div>
                      <div className="ml-2 text-sm text-gray-500">{stats.conversionRate}% Conv.</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Conversions</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {(stats.conversionsByType.REGISTRATION || 0) + (stats.conversionsByType.ACCEPTED_OFFER || 0)}
                      </div>
                      <div className="ml-2 text-sm text-green-600">+{stats.recentConversions} (7d)</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Provision offen</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {formatCurrency(stats.unpaidCommissions)}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Neuer Influencer</span>
          </button>

          <button
            onClick={loadData}
            className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Aktualisieren
          </button>
        </div>

        {/* Influencers Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Influencer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provision
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {influencers.map((influencer) => (
                <tr key={influencer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {influencer.channelName || influencer.email}
                        </div>
                        <div className="text-sm text-gray-500">{influencer.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="px-2 py-1 text-sm font-mono bg-gray-100 rounded">
                      {influencer.code}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {influencer.platform ? (
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPlatformBadgeColor(influencer.platform)}`}>
                        {influencer.platform}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{influencer.totalClicks} Clicks</div>
                    <div className="text-xs text-gray-400">{influencer.totalConversions} Conversions</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="font-medium text-gray-900">{formatCurrency(influencer.unpaidEarnings)}</div>
                    <div className="text-xs text-gray-400">Bezahlt: {formatCurrency(influencer.paidEarnings)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        influencer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {influencer.isActive ? 'Aktiv' : 'Inaktiv'}
                      </span>
                      {!influencer.isRegistered && (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Nicht registriert
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => router.push(`/admin/influencer-management/${influencer.id}`)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}?ref=${influencer.code}`
                        navigator.clipboard.writeText(url)
                        alert('Link kopiert!')
                      }}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Link kopieren
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {influencers.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Influencer</h3>
              <p className="mt-1 text-sm text-gray-500">Erstelle deinen ersten Influencer.</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Neuer Influencer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal - Simplified for now */}
      {showCreateModal && (
        <CreateInfluencerModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadData()
          }}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Standard-Provisionen für Landingpage</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-gray-600 mb-6">
                Diese Werte werden auf der öffentlichen Influencer-Landingpage (<strong>/influencer</strong>) angezeigt. 
                Individuelle Provisionen können pro Influencer separat festgelegt werden.
              </p>

              <form onSubmit={saveSettings} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      💰 Provision pro 1000 Views (in Cent)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={settings.defaultPer1000Views}
                      onChange={(e) => setSettings({...settings, defaultPer1000Views: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <div className="text-sm font-semibold text-green-600 mt-2">
                      → Anzeige auf Landingpage: €{(settings.defaultPer1000Views / 100).toFixed(2)}
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🎯 Provision pro Registrierung (in Cent)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={settings.defaultPerRegistration}
                      onChange={(e) => setSettings({...settings, defaultPerRegistration: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <div className="text-sm font-semibold text-green-600 mt-2">
                      → Anzeige auf Landingpage: €{(settings.defaultPerRegistration / 100).toFixed(2)}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ✅ Provision pro abgeschlossenem Deal (in Cent)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={settings.defaultPerAcceptedOffer}
                      onChange={(e) => setSettings({...settings, defaultPerAcceptedOffer: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <div className="text-sm font-semibold text-green-600 mt-2">
                      → Anzeige auf Landingpage: €{(settings.defaultPerAcceptedOffer / 100).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {savingSettings ? 'Wird gespeichert...' : '✓ Einstellungen speichern'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal - TODO */}
      {selectedInfluencer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Influencer Details</h3>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(selectedInfluencer, null, 2)}
            </pre>
            <button
              onClick={() => setSelectedInfluencer(null)}
              className="mt-4 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function CreateInfluencerModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    code: '',
    platform: '',
    channelName: '',
    channelUrl: '',
    commissionPer1000Views: 300,
    commissionPerRegistration: 1500,
    commissionPerAcceptedOffer: 2500,
    commissionPerWorkshopRegistration: 1500,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/admin/influencers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        const data = await res.json()
        alert(`Influencer erstellt! Registrierungslink:\n${data.registrationLink}`)
        onSuccess()
      } else {
        const error = await res.json()
        alert(`Fehler: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating influencer:', error)
      alert('Fehler beim Erstellen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">Neuer Influencer</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code * (z.B. PETER24)</label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
            <select
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Nicht angegeben</option>
              <option value="TIKTOK">TikTok</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="YOUTUBE">YouTube</option>
              <option value="FACEBOOK">Facebook</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Channel Name</label>
            <input
              type="text"
              value={formData.channelName}
              onChange={(e) => setFormData({ ...formData, channelName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Channel URL</label>
            <input
              type="url"
              value={formData.channelUrl}
              onChange={(e) => setFormData({ ...formData, channelUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Provision (in Cent)</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pro 1000 Views</label>
                <input
                  type="number"
                  value={formData.commissionPer1000Views}
                  onChange={(e) => setFormData({ ...formData, commissionPer1000Views: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <div className="text-xs text-gray-500 mt-1">€{(formData.commissionPer1000Views / 100).toFixed(2)}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pro Registrierung Kunde</label>
                <input
                  type="number"
                  value={formData.commissionPerRegistration}
                  onChange={(e) => setFormData({ ...formData, commissionPerRegistration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <div className="text-xs text-gray-500 mt-1">€{(formData.commissionPerRegistration / 100).toFixed(2)}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pro Angenommenes Angebot</label>
                <input
                  type="number"
                  value={formData.commissionPerAcceptedOffer}
                  onChange={(e) => setFormData({ ...formData, commissionPerAcceptedOffer: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <div className="text-xs text-gray-500 mt-1">€{(formData.commissionPerAcceptedOffer / 100).toFixed(2)}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pro Registrierung Werkstatt</label>
                <input
                  type="number"
                  value={formData.commissionPerWorkshopRegistration}
                  onChange={(e) => setFormData({ ...formData, commissionPerWorkshopRegistration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <div className="text-xs text-gray-500 mt-1">€{(formData.commissionPerWorkshopRegistration / 100).toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Erstelle...' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
