'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, RefreshCw, ExternalLink, Search, X, Save, Clock } from 'lucide-react'

interface DisputeListItem {
  id: string
  stripeDisputeId: string
  stripeChargeId: string
  amount: number
  currency: string
  reason: string
  status: string
  outcome: string | null
  liability: 'BEFORE_APPOINTMENT' | 'AFTER_APPOINTMENT' | 'UNKNOWN'
  evidenceDueBy: string | null
  disputeCreatedAt: string
  bookingDate: string | null
  bookingTime: string | null
  internalNotes: string | null
  evidenceSubmittedAt: string | null
  directBooking: {
    id: string
    serviceType: string
    date: string
    time: string
    totalPrice: string | number
    status: string
    paymentStatus: string
    customer: { id: string; firstName: string; lastName: string; email: string } | null
    workshop: { id: string; companyName: string; email: string } | null
  } | null
}

interface Stats {
  total: number
  open: number
  won: number
  lost: number
  workshopLiable: number
  customerLiable: number
  totalAmountCents: number
}

const REASON_LABELS: Record<string, string> = {
  duplicate: 'Doppelbuchung',
  fraudulent: 'Betrug',
  subscription_canceled: 'Abo gekündigt',
  product_unacceptable: 'Mangelhafte Leistung',
  product_not_received: 'Leistung nicht erhalten',
  unrecognized: 'Nicht erkannt',
  credit_not_processed: 'Erstattung nicht erhalten',
  general: 'Allgemein',
  incorrect_account_details: 'Falsche Kontodaten',
  insufficient_funds: 'Unzureichende Mittel',
  bank_cannot_process: 'Bank-Fehler',
  debit_not_authorized: 'Lastschrift nicht autorisiert',
  customer_initiated: 'Kunde-initiiert',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  warning_needs_response: { label: 'Frühwarnung – Antwort nötig', color: 'bg-yellow-100 text-yellow-800' },
  warning_under_review: { label: 'Frühwarnung – in Prüfung', color: 'bg-yellow-100 text-yellow-800' },
  warning_closed: { label: 'Frühwarnung geschlossen', color: 'bg-gray-100 text-gray-700' },
  needs_response: { label: 'Antwort erforderlich', color: 'bg-red-100 text-red-800' },
  under_review: { label: 'In Prüfung', color: 'bg-blue-100 text-blue-800' },
  charge_refunded: { label: 'Erstattet', color: 'bg-gray-100 text-gray-700' },
  won: { label: 'Gewonnen', color: 'bg-green-100 text-green-800' },
  lost: { label: 'Verloren', color: 'bg-red-100 text-red-800' },
}

function formatEuro(cents: number) {
  return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}

function formatDate(d: string | null) {
  if (!d) return '–'
  return new Date(d).toLocaleDateString('de-DE')
}

function daysUntil(d: string | null): number | null {
  if (!d) return null
  const diff = new Date(d).getTime() - Date.now()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export default function ChargebacksPage() {
  const [disputes, setDisputes] = useState<DisputeListItem[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'open' | 'closed' | 'all'>('open')
  const [liabilityFilter, setLiabilityFilter] = useState<'all' | 'AFTER_APPOINTMENT' | 'BEFORE_APPOINTMENT' | 'UNKNOWN'>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<DisputeListItem | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: statusFilter, liability: liabilityFilter })
      const res = await fetch(`/api/admin/chargebacks?${params}`)
      if (res.ok) {
        const data = await res.json()
        setDisputes(data.disputes || [])
        setStats(data.stats || null)
      }
    } finally {
      setLoading(false)
    }
  }, [statusFilter, liabilityFilter])

  useEffect(() => { load() }, [load])

  const openDetail = (d: DisputeListItem) => {
    setSelected(d)
    setNotes(d.internalNotes || '')
  }

  const saveNotes = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/chargebacks/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internalNotes: notes }),
      })
      if (res.ok) {
        await load()
        setSelected({ ...selected, internalNotes: notes })
      }
    } finally {
      setSaving(false)
    }
  }

  const syncFromStripe = async () => {
    if (!selected) return
    setSyncing(true)
    try {
      const res = await fetch(`/api/admin/chargebacks/${selected.id}`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        await load()
        setSelected({ ...selected, ...data.dispute })
      }
    } finally {
      setSyncing(false)
    }
  }

  const filtered = disputes.filter(d => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      d.stripeDisputeId.toLowerCase().includes(s) ||
      d.directBooking?.customer?.email.toLowerCase().includes(s) ||
      d.directBooking?.workshop?.companyName.toLowerCase().includes(s)
    )
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              Chargebacks / Disputes
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Stripe-Rückbuchungen automatisch erfasst. Beweispflicht-Logik nach AGB §5.1: Vor Termin = Kunde, nach Termin = Werkstatt.
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
            <StatCard label="Gesamt" value={stats.total} color="text-gray-900" />
            <StatCard label="Offen" value={stats.open} color="text-yellow-700" />
            <StatCard label="Werkstatt-Pflicht" value={stats.workshopLiable} color="text-orange-700" />
            <StatCard label="Kunde-Schuld" value={stats.customerLiable} color="text-blue-700" />
            <StatCard label="Gewonnen" value={stats.won} color="text-green-700" />
            <StatCard label="Verloren" value={stats.lost} color="text-red-700" />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-center">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(['open', 'closed', 'all'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  statusFilter === s ? 'bg-white shadow-sm font-medium' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {s === 'open' ? 'Offen' : s === 'closed' ? 'Abgeschlossen' : 'Alle'}
              </button>
            ))}
          </div>

          <select
            value={liabilityFilter}
            onChange={e => setLiabilityFilter(e.target.value as typeof liabilityFilter)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
          >
            <option value="all">Alle Beweispflichten</option>
            <option value="AFTER_APPOINTMENT">Werkstatt-Pflicht</option>
            <option value="BEFORE_APPOINTMENT">Kunde-Schuld</option>
            <option value="UNKNOWN">Unbekannt</option>
          </select>

          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Suche: Dispute-ID, Kunde, Werkstatt..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Lade Chargebacks...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <AlertTriangle className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p>Keine Chargebacks gefunden.</p>
              <p className="text-xs mt-1">Stripe sendet automatisch eine Benachrichtigung, sobald eine Rückbuchung erfolgt.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">Datum</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">Status</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">Beweispflicht</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">Grund</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">Buchung</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">Werkstatt</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">Kunde</th>
                    <th className="text-right px-4 py-2 font-medium text-gray-700">Betrag</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">Frist</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(d => {
                    const days = daysUntil(d.evidenceDueBy)
                    const urgent = days !== null && days <= 3 && days >= 0
                    const status = STATUS_LABELS[d.status] || { label: d.status, color: 'bg-gray-100 text-gray-700' }
                    return (
                      <tr
                        key={d.id}
                        onClick={() => openDetail(d)}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-4 py-2 text-gray-700">{formatDate(d.disputeCreatedAt)}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <LiabilityBadge liability={d.liability} />
                        </td>
                        <td className="px-4 py-2 text-gray-700">{REASON_LABELS[d.reason] || d.reason}</td>
                        <td className="px-4 py-2 text-gray-700">
                          {d.bookingDate ? `${formatDate(d.bookingDate)} ${d.bookingTime || ''}` : '–'}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          {d.directBooking?.workshop?.companyName || '–'}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          {d.directBooking?.customer
                            ? `${d.directBooking.customer.firstName} ${d.directBooking.customer.lastName}`
                            : '–'}
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-gray-900">
                          {formatEuro(d.amount)}
                        </td>
                        <td className="px-4 py-2">
                          {days !== null ? (
                            <span className={`inline-flex items-center gap-1 text-xs ${
                              urgent ? 'text-red-700 font-semibold' : days < 0 ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              <Clock className="w-3 h-3" />
                              {days < 0 ? `${Math.abs(days)}d überfällig` : `${days}d`}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">–</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div
            className="bg-white w-full max-w-2xl h-full overflow-y-auto shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Chargeback-Details</h2>
                <p className="text-xs text-gray-500 mt-1 font-mono">{selected.stripeDisputeId}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Liability Banner */}
              <LiabilityBanner liability={selected.liability} />

              {/* Key facts */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Field label="Status">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${(STATUS_LABELS[selected.status]?.color) || 'bg-gray-100 text-gray-700'}`}>
                    {STATUS_LABELS[selected.status]?.label || selected.status}
                  </span>
                </Field>
                <Field label="Betrag">{formatEuro(selected.amount)}</Field>
                <Field label="Grund">{REASON_LABELS[selected.reason] || selected.reason}</Field>
                <Field label="Eingang">{formatDate(selected.disputeCreatedAt)}</Field>
                <Field label="Termindatum">
                  {selected.bookingDate ? `${formatDate(selected.bookingDate)} ${selected.bookingTime || ''}` : '–'}
                </Field>
                <Field label="Beweisfrist">
                  {selected.evidenceDueBy ? formatDate(selected.evidenceDueBy) : '–'}
                </Field>
              </div>

              {/* Booking */}
              {selected.directBooking && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <h3 className="font-semibold text-gray-900 mb-2">Buchung</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-gray-500">Service:</span> {selected.directBooking.serviceType}</div>
                    <div><span className="text-gray-500">Buchungsstatus:</span> {selected.directBooking.status}</div>
                    <div><span className="text-gray-500">Werkstatt:</span> {selected.directBooking.workshop?.companyName || '–'}</div>
                    <div><span className="text-gray-500">Werkstatt-Mail:</span> {selected.directBooking.workshop?.email || '–'}</div>
                    <div><span className="text-gray-500">Kunde:</span> {selected.directBooking.customer ? `${selected.directBooking.customer.firstName} ${selected.directBooking.customer.lastName}` : '–'}</div>
                    <div><span className="text-gray-500">Kunden-Mail:</span> {selected.directBooking.customer?.email || '–'}</div>
                  </div>
                  <div className="pt-2">
                    <Link
                      href={`/admin/customers?bookingId=${selected.directBooking.id}`}
                      className="text-sm text-primary-600 hover:underline"
                    >
                      → Buchung öffnen
                    </Link>
                  </div>
                </div>
              )}

              {/* Internal Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Interne Notizen</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Notizen zur Bearbeitung, Kommunikation mit Werkstatt/Kunde..."
                />
                <button
                  onClick={saveNotes}
                  disabled={saving}
                  className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Speichere...' : 'Speichern'}
                </button>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-200 pt-4 flex flex-wrap gap-2">
                <button
                  onClick={syncFromStripe}
                  disabled={syncing}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  Von Stripe aktualisieren
                </button>
                <a
                  href={`https://dashboard.stripe.com/disputes/${selected.stripeDisputeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <ExternalLink className="w-4 h-4" />
                  In Stripe öffnen (Beweise einreichen)
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-gray-900">{children}</div>
    </div>
  )
}

function LiabilityBadge({ liability }: { liability: DisputeListItem['liability'] }) {
  if (liability === 'AFTER_APPOINTMENT') {
    return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Werkstatt-Pflicht</span>
  }
  if (liability === 'BEFORE_APPOINTMENT') {
    return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Kunde-Schuld</span>
  }
  return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Unbekannt</span>
}

function LiabilityBanner({ liability }: { liability: DisputeListItem['liability'] }) {
  if (liability === 'AFTER_APPOINTMENT') {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h3 className="font-semibold text-orange-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Werkstatt in Beweispflicht
        </h3>
        <p className="text-sm text-orange-800 mt-1">
          Chargeback nach Termin → Werkstatt muss Leistungserbringung belegen (Fotos, Unterschrift, Rechnung). Werkstatt zur Beweis-Bereitstellung kontaktieren und Beweise direkt in Stripe hochladen.
        </p>
      </div>
    )
  }
  if (liability === 'BEFORE_APPOINTMENT') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Schuld liegt beim Kunden
        </h3>
        <p className="text-sm text-blue-800 mt-1">
          Chargeback vor Termin → Kunde hätte gemäß AGB §5.1 die Stornierung direkt mit der Werkstatt vereinbaren müssen. Beweise (AGB-Auszug, Buchungsbestätigung) in Stripe einreichen, um den Chargeback abzuwehren.
        </p>
      </div>
    )
  }
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" />
        Buchung nicht zugeordnet
      </h3>
      <p className="text-sm text-gray-700 mt-1">
        Es konnte keine zugehörige DirectBooking gefunden werden. Manuelle Recherche in Stripe Dashboard erforderlich.
      </p>
    </div>
  )
}
