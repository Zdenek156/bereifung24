'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  LifeBuoy, ArrowLeft, Mail, Clock, User, Send, Save,
  AlertTriangle, CheckCircle, RefreshCw, ChevronDown
} from 'lucide-react'

interface Ticket {
  id: string
  name: string
  email: string
  message: string
  subject: string | null
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

interface Agent {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'Neu' },
  { value: 'READ', label: 'Gelesen' },
  { value: 'IN_PROGRESS', label: 'In Bearbeitung' },
  { value: 'REPLIED', label: 'Beantwortet' },
  { value: 'CLOSED', label: 'Geschlossen' },
]

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Niedrig' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'Hoch' },
  { value: 'URGENT', label: 'Dringend' },
]

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-red-100 text-red-800',
  READ: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  REPLIED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-600',
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-gray-500',
  NORMAL: 'text-blue-600',
  HIGH: 'text-orange-600',
  URGENT: 'text-red-600 font-bold',
}

export default function SupportTicketDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)
  const [error, setError] = useState('')
  const [assignedToName, setAssignedToName] = useState<string | null>(null)
  const [repliedByName, setRepliedByName] = useState<string | null>(null)

  // Editable fields
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [assignedToId, setAssignedToId] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [subject, setSubject] = useState('')
  const [replyText, setReplyText] = useState('')

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/support/${id}`)
      if (!res.ok) throw new Error('Fehler beim Laden')
      const data = await res.json()
      setTicket(data.ticket)
      setAssignedToName(data.assignedToName)
      setRepliedByName(data.repliedByName)
      setStatus(data.ticket.status)
      setPriority(data.ticket.priority)
      setAssignedToId(data.ticket.assignedToId || '')
      setInternalNotes(data.ticket.internalNotes || '')
      setSubject(data.ticket.subject || '')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/support/agents')
      if (!res.ok) return
      const data = await res.json()
      setAgents(data.agents)
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    fetchTicket()
    fetchAgents()
  }, [fetchTicket, fetchAgents])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/support/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, priority, assignedToId: assignedToId || null, internalNotes, subject }),
      })
      if (!res.ok) throw new Error('Fehler beim Speichern')
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
      await fetchTicket()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleSendReply = async () => {
    if (!replyText.trim()) return
    setSending(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/support/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Senden')
      setSendSuccess(true)
      setReplyText('')
      setTimeout(() => setSendSuccess(false), 3000)
      setStatus('REPLIED')
      await fetchTicket()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fehler beim Senden')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 font-medium">Ticket nicht gefunden</p>
          <button onClick={() => router.back()} className="mt-3 text-blue-600 text-sm hover:underline">
            Zurück zur Liste
          </button>
        </div>
      </div>
    )
  }

  const agentName = (a: Agent) => `${a.firstName} ${a.lastName}`.trim() || a.email

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/admin/support')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Alle Tickets
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[ticket.status] || 'bg-gray-100 text-gray-600'}`}>
              {STATUS_OPTIONS.find(s => s.value === ticket.status)?.label || ticket.status}
            </span>
            <span className={`text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
              {PRIORITY_OPTIONS.find(p => p.value === ticket.priority)?.label}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Ticket content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer Message */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{ticket.name}</span>
                  <a href={`mailto:${ticket.email}`} className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {ticket.email}
                  </a>
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {new Date(ticket.createdAt).toLocaleDateString('de-DE', {
                    day: '2-digit', month: 'long', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              </div>
            </div>

            {subject && (
              <div className="mb-3">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Betreff</span>
                <p className="font-medium text-gray-800 mt-0.5">{subject}</p>
              </div>
            )}

            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nachricht</span>
              <div className="mt-1 bg-gray-50 rounded-lg p-4 border border-gray-100">
                <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">{ticket.message}</p>
              </div>
            </div>
          </div>

          {/* Previous reply */}
          {ticket.reply && (
            <div className="bg-green-50 rounded-xl border border-green-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-800">Bereits beantwortet</span>
                {repliedByName && (
                  <span className="text-xs text-green-600">durch {repliedByName}</span>
                )}
                {ticket.repliedAt && (
                  <span className="text-xs text-green-500 ml-auto">
                    {new Date(ticket.repliedAt).toLocaleDateString('de-DE', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                )}
              </div>
              <p className="text-sm text-green-900 whitespace-pre-wrap bg-white rounded-lg p-3 border border-green-100">
                {ticket.reply}
              </p>
            </div>
          )}

          {/* Reply Form */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              {ticket.reply ? 'Weitere Antwort senden' : 'Per E-Mail antworten'}
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              Antwort wird an <strong>{ticket.email}</strong> gesendet
            </p>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder={`Hallo ${ticket.name},\n\nvielen Dank für Ihre Nachricht...`}
            />

            {sendSuccess && (
              <div className="mt-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Antwort erfolgreich gesendet!
              </div>
            )}
            {error && (
              <div className="mt-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="mt-3 flex justify-end">
              <button
                onClick={handleSendReply}
                disabled={sending || !replyText.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Wird gesendet...</>
                ) : (
                  <><Send className="w-4 h-4" />Antwort senden</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="space-y-4">
          {/* Ticket Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">Ticket-Einstellungen</h3>

            <div className="space-y-4">
              {/* Subject */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Betreff (intern)</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Kurze Beschreibung..."
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Priorität</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {PRIORITY_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Assigned To */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Zugewiesen an</label>
                <select
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Nicht zugewiesen —</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>
                      {agentName(a)}{a.role === 'ADMIN' ? ' (Admin)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Interne Notizen</label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Nur für interne Mitarbeiter sichtbar..."
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:bg-gray-300 transition-colors"
            >
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Speichern...</>
              ) : saveSuccess ? (
                <><CheckCircle className="w-4 h-4" />Gespeichert!</>
              ) : (
                <><Save className="w-4 h-4" />Änderungen speichern</>
              )}
            </button>
          </div>

          {/* Meta Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Info</h3>
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Erstellt</span>
                <span className="text-gray-700">{new Date(ticket.createdAt).toLocaleDateString('de-DE')}</span>
              </div>
              <div className="flex justify-between">
                <span>Aktualisiert</span>
                <span className="text-gray-700">{new Date(ticket.updatedAt).toLocaleDateString('de-DE')}</span>
              </div>
              {ticket.repliedAt && (
                <div className="flex justify-between">
                  <span>Beantwortet</span>
                  <span className="text-gray-700">{new Date(ticket.repliedAt).toLocaleDateString('de-DE')}</span>
                </div>
              )}
              {repliedByName && (
                <div className="flex justify-between">
                  <span>Beantwortet von</span>
                  <span className="text-gray-700">{repliedByName}</span>
                </div>
              )}
              {assignedToName && (
                <div className="flex justify-between">
                  <span>Zugewiesen an</span>
                  <span className="text-gray-700">{assignedToName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Schnellaktionen</h3>
            <div className="space-y-2">
              <button
                onClick={async () => {
                  setStatus('IN_PROGRESS')
                  await fetch(`/api/admin/support/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'IN_PROGRESS' }),
                  })
                  fetchTicket()
                }}
                className="w-full text-left px-3 py-2 text-sm bg-yellow-50 text-yellow-800 rounded-lg hover:bg-yellow-100 transition-colors border border-yellow-200"
              >
                → In Bearbeitung setzen
              </button>
              <button
                onClick={async () => {
                  setStatus('CLOSED')
                  await fetch(`/api/admin/support/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'CLOSED' }),
                  })
                  fetchTicket()
                }}
                className="w-full text-left px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
              >
                ✕ Ticket schließen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
