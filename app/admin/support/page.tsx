'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  LifeBuoy, Search, Filter, RefreshCw, ChevronRight,
  Mail, Clock, AlertTriangle, CheckCircle, XCircle, Inbox,
  User, ArrowLeft, Settings, Eye, EyeOff, X, Save
} from 'lucide-react'
import BackButton from '@/components/BackButton'

interface Ticket {
  id: string
  name: string
  email: string
  message: string
  subject: string | null
  ticketNumber: number | null
  status: string
  priority: string
  assignedToId: string | null
  internalNotes: string | null
  reply: string | null
  repliedAt: string | null
  repliedBy: string | null
  createdAt: string
  updatedAt: string
}

interface Stat {
  status: string
  _count: { id: number }
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Neu',
  READ: 'Gelesen',
  IN_PROGRESS: 'In Bearbeitung',
  REPLIED: 'Beantwortet',
  CLOSED: 'Geschlossen',
}

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-red-100 text-red-800 border-red-200',
  READ: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  REPLIED: 'bg-green-100 text-green-800 border-green-200',
  CLOSED: 'bg-gray-100 text-gray-600 border-gray-200',
}

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Niedrig',
  NORMAL: 'Normal',
  HIGH: 'Hoch',
  URGENT: 'Dringend',
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-gray-500',
  NORMAL: 'text-blue-600',
  HIGH: 'text-orange-600',
  URGENT: 'text-red-600',
}

const PRIORITY_DOT: Record<string, string> = {
  LOW: 'bg-gray-400',
  NORMAL: 'bg-blue-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-red-500',
}

export default function SupportTicketsPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<Stat[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // Email settings modal
  const [showSettings, setShowSettings] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [emailSettings, setEmailSettings] = useState({ supportEmail: '', supportPassword: '', hasPassword: false })

  const openSettings = async () => {
    setShowSettings(true)
    setSettingsLoading(true)
    setSettingsMsg(null)
    try {
      const res = await fetch('/api/admin/support/settings')
      if (res.ok) {
        const data = await res.json()
        setEmailSettings(data)
      }
    } catch {
      setSettingsMsg({ type: 'error', text: 'Fehler beim Laden der Einstellungen' })
    } finally {
      setSettingsLoading(false)
    }
  }

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSettingsSaving(true)
    setSettingsMsg(null)
    try {
      const res = await fetch('/api/admin/support/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supportEmail: emailSettings.supportEmail, supportPassword: emailSettings.supportPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setSettingsMsg({ type: 'success', text: 'Einstellungen gespeichert!' })
        setEmailSettings(prev => ({ ...prev, hasPassword: !!prev.supportPassword && prev.supportPassword !== '••••••••' }))
      } else {
        setSettingsMsg({ type: 'error', text: data.error || 'Fehler beim Speichern' })
      }
    } catch {
      setSettingsMsg({ type: 'error', text: 'Netzwerkfehler' })
    } finally {
      setSettingsSaving(false)
    }
  }

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/admin/support?${params}`)
      if (!res.ok) throw new Error('Fehler beim Laden')
      const data = await res.json()
      setTickets(data.tickets)
      setStats(data.stats)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const getStatCount = (status: string) =>
    stats.find((s) => s.status === status)?._count?.id ?? 0

  const totalNew = getStatCount('NEW')
  const totalAll = stats.reduce((acc, s) => acc + (s._count?.id ?? 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Support-Email konfigurieren</h2>
              </div>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4">
              <p className="text-sm text-gray-500 mb-4">
                Diese Email-Adresse wird für das Versenden von Antworten an Kunden verwendet.<br />
                <span className="font-medium text-gray-700">z.B. support@bereifung24.de</span>
              </p>

              {settingsLoading ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <form onSubmit={saveSettings} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email-Adresse *
                    </label>
                    <input
                      type="email"
                      value={emailSettings.supportEmail}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                      placeholder="support@bereifung24.de"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Passwort {emailSettings.hasPassword ? '(leer lassen um beizubehalten)' : '*'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={emailSettings.supportPassword}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, supportPassword: e.target.value }))}
                        placeholder={emailSettings.hasPassword ? '••••••••' : 'Email-Passwort eingeben'}
                        required={!emailSettings.hasPassword}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Die SMTP-Server-Einstellungen werden aus den allgemeinen <a href="/admin/email-settings" className="text-blue-600 hover:underline">Email-Einstellungen</a> übernommen.</p>
                  </div>

                  {settingsMsg && (
                    <div className={`p-3 rounded-lg text-sm ${settingsMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {settingsMsg.text}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowSettings(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      Schließen
                    </button>
                    <button
                      type="submit"
                      disabled={settingsSaving}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {settingsSaving ? 'Speichern...' : 'Speichern'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-1">
            <BackButton />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <LifeBuoy className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Support-Tickets</h1>
                <p className="text-sm text-gray-500">
                  {totalAll} Tickets gesamt
                  {totalNew > 0 && (
                    <span className="ml-2 text-red-600 font-medium">· {totalNew} neu</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openSettings}
                title="Support-Email konfigurieren"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Email konfigurieren</span>
              </button>
              <button
                onClick={fetchTickets}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Aktualisieren</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {['NEW', 'READ', 'IN_PROGRESS', 'REPLIED', 'CLOSED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? 'ALL' : s)}
              className={`bg-white rounded-xl border p-3 text-left transition-all hover:shadow-sm ${
                statusFilter === s ? 'ring-2 ring-blue-500 border-blue-300' : 'border-gray-200'
              }`}
            >
              <div className="text-2xl font-bold text-gray-900">{getStatCount(s)}</div>
              <div className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full border w-fit ${STATUS_COLORS[s]}`}>
                {STATUS_LABELS[s]}
              </div>
            </button>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Name, E-Mail oder Nachricht suchen..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              Suchen
            </button>
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setSearchInput('') }}
                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
              >
                ✕
              </button>
            )}
          </form>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Alle Status</option>
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {/* Ticket List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Keine Tickets gefunden</p>
            <p className="text-sm text-gray-400 mt-1">Versuchen Sie andere Filteroptionen</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => router.push(`/admin/support/${ticket.id}`)}
                className={`w-full bg-white rounded-xl border text-left p-4 hover:shadow-sm transition-all flex items-start gap-4 ${
                  ticket.status === 'NEW' ? 'border-red-200 hover:border-red-300' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Priority dot */}
                <div className="flex-shrink-0 mt-1">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${PRIORITY_DOT[ticket.priority] || 'bg-blue-500'}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {ticket.ticketNumber && (
                      <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        T-{String(ticket.ticketNumber).padStart(4, '0')}
                      </span>
                    )}
                    <span className="font-semibold text-gray-900 text-sm">{ticket.name}</span>
                    <span className="text-gray-400 text-xs">{ticket.email}</span>
                    {ticket.status === 'NEW' && (
                      <span className="text-xs font-bold text-white bg-red-500 px-1.5 py-0.5 rounded">NEU</span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm truncate">
                    {ticket.subject || ticket.message}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[ticket.status]}`}>
                      {STATUS_LABELS[ticket.status] || ticket.status}
                    </span>
                    <span className={`text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
                      {PRIORITY_LABELS[ticket.priority] || ticket.priority}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(ticket.createdAt).toLocaleDateString('de-DE', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
