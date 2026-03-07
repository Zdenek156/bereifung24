'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface FreelancerProfile {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  phone: string | null
  street: string | null
  zipCode: string | null
  city: string | null
  companyName: string | null
  taxNumber: string | null
  vatId: string | null
  affiliateCode: string
  tier: string
  region: string | null
  status: string
  notifyNewBooking: boolean
  notifyLeadReminder: boolean
  notifyBillingReady: boolean
  notifyWorkshopWarning: boolean
}

const tierLabels: Record<string, string> = {
  STARTER: '🌱 Starter',
  BRONZE: '🥉 Bronze',
  SILVER: '🥈 Silber',
  GOLD: '🥇 Gold',
}

const statusLabels: Record<string, string> = {
  ACTIVE: '✅ Aktiv',
  PAUSED: '⏸ Pausiert',
  TERMINATED: '❌ Beendet',
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<FreelancerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()

  // Stripe Connect state
  const [stripeStatus, setStripeStatus] = useState<{
    connected: boolean
    chargesEnabled?: boolean
    payoutsEnabled?: boolean
    detailsSubmitted?: boolean
    requirementsDue?: string[]
    stripeAccountId?: string | null
  } | null>(null)
  const [stripeLoading, setStripeLoading] = useState(false)
  const [stripeMessage, setStripeMessage] = useState('')

  useEffect(() => {
    fetch('/api/freelancer/profile')
      .then(r => r.ok ? r.json() : Promise.reject('Fehler'))
      .then(data => setProfile(data))
      .catch(() => setError('Profil konnte nicht geladen werden'))
      .finally(() => setLoading(false))

    // Load Stripe Connect status
    fetch('/api/freelancer/stripe-connect')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStripeStatus(data) })
      .catch(() => {})

    // Check for Stripe redirect
    const stripeParam = searchParams.get('stripe')
    if (stripeParam === 'success') {
      setStripeMessage('Stripe-Konto erfolgreich verbunden! Status wird aktualisiert...')
      // Refresh status after redirect
      setTimeout(() => {
        fetch('/api/freelancer/stripe-connect')
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data) setStripeStatus(data); setStripeMessage('') })
      }, 2000)
    } else if (stripeParam === 'refresh') {
      setStripeMessage('Stripe-Einrichtung muss fortgesetzt werden.')
    }
  }, [searchParams])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch('/api/freelancer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: profile.phone,
          street: profile.street,
          zipCode: profile.zipCode,
          city: profile.city,
          companyName: profile.companyName,
          taxNumber: profile.taxNumber,
          vatId: profile.vatId,
          notifyNewBooking: profile.notifyNewBooking,
          notifyLeadReminder: profile.notifyLeadReminder,
          notifyBillingReady: profile.notifyBillingReady,
          notifyWorkshopWarning: profile.notifyWorkshopWarning,
        }),
      })
      if (!res.ok) throw new Error('Speichern fehlgeschlagen')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  function update(field: string, value: string | boolean) {
    if (!profile) return
    setProfile({ ...profile, [field]: value })
  }

  async function handleStripeConnect() {
    setStripeLoading(true)
    setStripeMessage('')
    try {
      const res = await fetch('/api/freelancer/stripe-connect', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setStripeMessage(data.error || 'Fehler beim Erstellen des Stripe-Links')
      }
    } catch {
      setStripeMessage('Netzwerkfehler')
    } finally {
      setStripeLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
  if (!profile) return <div className="text-red-600 p-4">{error || 'Profil nicht gefunden'}</div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mein Profil</h1>
        <p className="text-gray-500">Persönliche Daten und Einstellungen</p>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="text-lg font-semibold">{statusLabels[profile.status] || profile.status}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tier</p>
            <p className="text-lg font-semibold">{tierLabels[profile.tier] || profile.tier}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Affiliate-Code</p>
            <p className="text-lg font-mono font-bold text-blue-600">{profile.affiliateCode}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal Data */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">👤 Persönliche Daten</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vorname</label>
              <input value={profile.firstName || ''} disabled className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500 text-sm" />
              <p className="text-xs text-gray-400 mt-1">Nur durch Admin änderbar</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nachname</label>
              <input value={profile.lastName || ''} disabled className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
              <input value={profile.email} disabled className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
              <input value={profile.phone || ''} onChange={e => update('phone', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="+49 123 456789" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Straße + Hausnr.</label>
              <input value={profile.street || ''} onChange={e => update('street', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PLZ</label>
                <input value={profile.zipCode || ''} onChange={e => update('zipCode', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stadt</label>
                <input value={profile.city || ''} onChange={e => update('city', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Region / Gebiet</label>
              <input value={profile.region || ''} disabled className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500 text-sm" />
              <p className="text-xs text-gray-400 mt-1">Wird vom Admin zugewiesen</p>
            </div>
          </div>
        </div>

        {/* Business Data */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">🏢 Geschäftsdaten</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Firmenname</label>
              <input value={profile.companyName || ''} onChange={e => update('companyName', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Steuernummer</label>
              <input value={profile.taxNumber || ''} onChange={e => update('taxNumber', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">USt-IdNr.</label>
              <input value={profile.vatId || ''} onChange={e => update('vatId', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="DE123456789" />
            </div>
          </div>
        </div>

        {/* Stripe Connect */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">💳 Stripe-Auszahlungskonto</h2>
          <p className="text-xs text-gray-500 mb-3">Verbinde dein Stripe-Konto für automatische Provisionsauszahlungen</p>
          
          {stripeMessage && (
            <div className={`mb-3 px-3 py-2 rounded-lg text-sm ${stripeMessage.includes('erfolgreich') ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
              {stripeMessage}
            </div>
          )}

          {stripeStatus?.connected && stripeStatus.payoutsEnabled ? (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-green-800">Stripe verbunden</p>
                <p className="text-xs text-green-600">Auszahlungen sind aktiviert. Ihre Provisionen werden automatisch überwiesen.</p>
              </div>
            </div>
          ) : stripeStatus?.connected && !stripeStatus.payoutsEnabled ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-yellow-800">Einrichtung unvollständig</p>
                  <p className="text-xs text-yellow-600">Bitte schließe die Stripe-Einrichtung ab, um Auszahlungen zu erhalten.</p>
                </div>
              </div>
              <button
                onClick={handleStripeConnect}
                disabled={stripeLoading}
                className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {stripeLoading ? 'Wird geladen...' : 'Einrichtung fortsetzen'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600">
                  Verbinde dein Stripe-Konto, damit deine Provisionen automatisch auf dein Bankkonto überwiesen werden.
                  Stripe verarbeitet die Auszahlungen sicher und zuverlässig.
                </p>
              </div>
              <button
                onClick={handleStripeConnect}
                disabled={stripeLoading}
                className="px-5 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {stripeLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Wird geladen...
                  </>
                ) : (
                  <>💳 Mit Stripe verbinden</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">🔔 Benachrichtigungen</h2>
          <div className="space-y-3">
            {[
              { key: 'notifyNewBooking', label: 'Neue Buchung bei meiner Werkstatt', desc: 'Info per E-Mail bei jeder Buchung' },
              { key: 'notifyLeadReminder', label: 'Lead-Erinnerungen', desc: 'Automatische Follow-up-Erinnerungen' },
              { key: 'notifyBillingReady', label: 'Abrechnung bereit', desc: 'Info wenn monatliche Abrechnung erstellt wurde' },
              { key: 'notifyWorkshopWarning', label: 'Werkstatt-Warnungen', desc: 'Wenn eine Werkstatt Probleme zeigt' },
            ].map(n => (
              <label key={n.key} className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={(profile as unknown as Record<string, unknown>)[n.key] as boolean}
                  onChange={e => update(n.key, e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{n.label}</p>
                  <p className="text-xs text-gray-500">{n.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Speichere...' : 'Änderungen speichern'}
          </button>
          {saved && <span className="text-green-600 text-sm font-medium">✓ Gespeichert!</span>}
          {error && <span className="text-red-600 text-sm">{error}</span>}
        </div>
      </form>
    </div>
  )
}
