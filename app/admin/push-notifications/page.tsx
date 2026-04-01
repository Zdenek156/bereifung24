'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import BackButton from '@/components/BackButton'

interface NotificationLog {
  id: string
  userId: string | null
  title: string
  body: string
  type: string
  status: string
  error: string | null
  isBroadcast: boolean
  sentBy: string | null
  createdAt: string
}

interface Stats {
  total: number
  sent: number
  failed: number
  uniqueUsers: number
  broadcasts: number
  usersWithTokens: number
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  booking_confirmation: { label: 'Buchungsbestätigung', color: 'bg-green-100 text-green-700' },
  booking_reminder: { label: 'Terminerinnerung', color: 'bg-blue-100 text-blue-700' },
  booking_update: { label: 'Buchungs-Update', color: 'bg-yellow-100 text-yellow-700' },
  season_tip: { label: 'Saison-Tipp', color: 'bg-orange-100 text-orange-700' },
  manual: { label: 'Manuell', color: 'bg-purple-100 text-purple-700' },
}

export default function PushNotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationLog[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  // Pagination + Search
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const pageSize = 20

  // Send form
  const [sendMode, setSendMode] = useState<'broadcast' | 'user'>('broadcast')
  const [sendTitle, setSendTitle] = useState('')
  const [sendBody, setSendBody] = useState('')
  const [sendUserId, setSendUserId] = useState('')
  const [sendType, setSendType] = useState('manual')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null)

  // Cron trigger
  const [triggeringCron, setTriggeringCron] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        limit: String(pageSize),
        page: String(currentPage),
      })
      if (searchQuery) params.set('search', searchQuery)
      const res = await fetch(`/api/admin/push-notifications?${params}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setStats(data.stats)
        setTotalPages(data.totalPages || 1)
        setTotalItems(data.total || 0)
      }
    } catch (error) {
      console.error('Failed to load push data:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery])

  useEffect(() => {
    if (status === 'authenticated') {
      loadData()
    }
  }, [status, loadData])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    setSearchQuery(searchInput)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setSendResult(null)

    try {
      const payload: Record<string, string> = {
        mode: sendMode,
        title: sendTitle,
        body: sendBody,
        type: sendType,
      }
      if (sendMode === 'user') payload.userId = sendUserId

      const res = await fetch('/api/admin/push-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      setSendResult({ success: res.ok, message: data.message || data.error })

      if (res.ok) {
        setSendTitle('')
        setSendBody('')
        setSendUserId('')
        loadData()
      }
    } catch {
      setSendResult({ success: false, message: 'Netzwerkfehler' })
    } finally {
      setSending(false)
    }
  }

  const triggerReminders = async () => {
    setTriggeringCron(true)
    try {
      const res = await fetch('/api/cron/push-reminders', {
        method: 'POST',
        headers: { 'x-manual-trigger': 'true' },
      })
      const data = await res.json()
      alert(
        res.ok
          ? `✅ ${data.sent} Erinnerungen gesendet (${data.bookingsFound} Termine morgen)`
          : `❌ ${data.error}`
      )
      loadData()
    } catch {
      alert('Fehler beim Auslösen')
    } finally {
      setTriggeringCron(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Push-Benachrichtigungen</h1>
            <p className="text-gray-500 text-sm">FCM Push-Notifications an App-Nutzer senden</p>
          </div>
        </div>
        <button
          onClick={triggerReminders}
          disabled={triggeringCron}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {triggeringCron ? 'Läuft...' : '🔔 Terminerinnerungen jetzt senden'}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Gesamt gesendet" value={stats.total} color="bg-gray-50" />
          <StatCard label="Erfolgreich" value={stats.sent} color="bg-green-50" />
          <StatCard label="Fehlgeschlagen" value={stats.failed} color="bg-red-50" />
          <StatCard label="Nutzer erreicht" value={stats.uniqueUsers} color="bg-blue-50" />
          <StatCard label="Broadcasts" value={stats.broadcasts} color="bg-purple-50" />
          <StatCard label="Aktive Tokens" value={stats.usersWithTokens} color="bg-orange-50" />
        </div>
      )}

      {/* Send Form */}
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Push-Nachricht senden</h2>

        <form onSubmit={handleSend} className="space-y-4">
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="broadcast"
                checked={sendMode === 'broadcast'}
                onChange={() => setSendMode('broadcast')}
                className="text-blue-600"
              />
              <span className="text-sm">An alle Nutzer (Broadcast)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="user"
                checked={sendMode === 'user'}
                onChange={() => setSendMode('user')}
                className="text-blue-600"
              />
              <span className="text-sm">An einzelnen Nutzer</span>
            </label>
          </div>

          {sendMode === 'user' && (
            <input
              type="text"
              placeholder="User ID"
              value={sendUserId}
              onChange={e => setSendUserId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              required
            />
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Titel"
              value={sendTitle}
              onChange={e => setSendTitle(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
              required
              maxLength={100}
            />
            <select
              value={sendType}
              onChange={e => setSendType(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="manual">Manuell</option>
              <option value="season_tip">Saison-Tipp</option>
              <option value="booking_update">Buchungs-Update</option>
            </select>
          </div>

          <textarea
            placeholder="Nachricht"
            value={sendBody}
            onChange={e => setSendBody(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            rows={3}
            required
            maxLength={500}
          />

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={sending}
              className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 text-sm font-medium"
            >
              {sending ? 'Sendet...' : sendMode === 'broadcast' ? '📡 Broadcast senden' : '📤 An Nutzer senden'}
            </button>

            {sendResult && (
              <span className={`text-sm ${sendResult.success ? 'text-green-600' : 'text-red-600'}`}>
                {sendResult.message}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Notification Log */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Benachrichtigungen ({totalItems})</h2>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Suche nach Titel oder Nachricht..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-sm w-64"
            />
            <button type="submit" className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">
              Suchen
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchInput(''); setSearchQuery(''); setCurrentPage(1) }}
                className="px-3 py-1.5 text-gray-500 hover:text-red-600 text-sm"
              >
                ✕
              </button>
            )}
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Zeitpunkt</th>
                <th className="text-left px-4 py-3 font-medium">Typ</th>
                <th className="text-left px-4 py-3 font-medium">Titel</th>
                <th className="text-left px-4 py-3 font-medium">Nachricht</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Ziel</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {notifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    Noch keine Push-Benachrichtigungen gesendet
                  </td>
                </tr>
              ) : (
                notifications.map(n => {
                  const typeInfo = TYPE_LABELS[n.type] || { label: n.type, color: 'bg-gray-100 text-gray-700' }
                  return (
                    <tr key={n.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                        {new Date(n.createdAt).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                        {n.title}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[300px] truncate">
                        {n.body}
                      </td>
                      <td className="px-4 py-3">
                        {n.status === 'SENT' ? (
                          <span className="text-green-600 font-medium">✓ Gesendet</span>
                        ) : (
                          <span className="text-red-600 font-medium" title={n.error || ''}>
                            ✗ Fehler
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {n.isBroadcast ? (
                          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Broadcast</span>
                        ) : n.userId ? (
                          <span className="font-mono">{n.userId.substring(0, 8)}...</span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Seite {currentPage} von {totalPages} ({totalItems} Einträge)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Zurück
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1.5 text-sm border rounded-lg ${
                      currentPage === pageNum ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Weiter →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`${color} rounded-xl p-4 border`}>
      <p className="text-2xl font-bold text-gray-900">{value.toLocaleString('de-DE')}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}
