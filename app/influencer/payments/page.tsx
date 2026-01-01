'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Payment {
  id: string
  amount: number
  status: string
  requestedAt: string
  paidAt: string | null
  createdAt: string
}

interface Stats {
  unpaidEarnings: number
  paidEarnings: number
  totalEarnings: number
}

export default function InfluencerPaymentsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

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

      // Load payments
      const paymentsRes = await fetch('/api/influencer/payments')
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json()
        setPayments(paymentsData.payments)
      }

      // Load stats
      const statsRes = await fetch('/api/influencer/stats')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats({
          unpaidEarnings: statsData.stats.unpaidEarnings,
          paidEarnings: statsData.stats.paidEarnings,
          totalEarnings: statsData.stats.totalEarnings
        })
      } else if (statsRes.status === 401) {
        router.push('/influencer/login')
        return
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const requestPayment = async () => {
    setRequesting(true)
    setMessage(null)

    try {
      const res = await fetch('/api/influencer/payments', {
        method: 'POST'
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Fehler bei der Auszahlungsanfrage' })
      } else {
        setMessage({ type: 'success', text: 'Auszahlungsanfrage erfolgreich erstellt!' })
        // Reload data
        setTimeout(() => {
          loadData()
          setMessage(null)
        }, 2000)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ein Fehler ist aufgetreten' })
    } finally {
      setRequesting(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">In Bearbeitung</span>
      case 'COMPLETED':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Abgeschlossen</span>
      case 'REJECTED':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Abgelehnt</span>
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>
    }
  }

  const hasPendingPayment = payments.some(p => p.status === 'PENDING')
  const canRequestPayment = stats && stats.unpaidEarnings >= 5000 && !hasPendingPayment

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Lädt...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow mb-8">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Auszahlungen</h1>
          <button
            onClick={() => router.push('/influencer/dashboard')}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Zurück zum Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {message && (
          <div className={`mb-6 rounded-lg p-4 ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 
            'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">Offen zur Auszahlung</div>
              <div className="text-3xl font-bold text-blue-600">{formatCurrency(stats.unpaidEarnings)}</div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">Bereits ausgezahlt</div>
              <div className="text-3xl font-bold text-green-600">{formatCurrency(stats.paidEarnings)}</div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">Gesamtverdienst</div>
              <div className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalEarnings)}</div>
            </div>
          </div>
        )}

        {/* Request Payment Button */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Auszahlung anfordern</h2>
          
          {!canRequestPayment && stats && (
            <div className="mb-4">
              {hasPendingPayment ? (
                <div className="text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  ⏳ Sie haben bereits eine ausstehende Auszahlungsanfrage
                </div>
              ) : stats.unpaidEarnings < 5000 ? (
                <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  💡 Mindestbetrag: €50.00 • Aktueller Betrag: {formatCurrency(stats.unpaidEarnings)}
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 rounded-full h-2 transition-all"
                      style={{ width: `${Math.min((stats.unpaidEarnings / 5000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <button
            onClick={requestPayment}
            disabled={!canRequestPayment || requesting}
            className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {requesting ? 'Wird angefordert...' : `Auszahlung anfordern ${stats ? `(${formatCurrency(stats.unpaidEarnings)})` : ''}`}
          </button>

          <p className="mt-3 text-sm text-gray-500">
            Mindestbetrag für Auszahlungen: €50.00 • Auszahlungen erfolgen innerhalb von 7-14 Werktagen
          </p>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Auszahlungsverlauf</h2>
          </div>

          {payments.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Noch keine Auszahlungen angefordert</p>
            </div>
          ) : (
            <div className="divide-y">
              {payments.map(payment => (
                <div key={payment.id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-gray-900 text-lg">
                        {formatCurrency(payment.amount)}
                      </div>
                      {getStatusBadge(payment.status)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Angefordert: {formatDate(payment.requestedAt)}
                    </div>
                    {payment.paidAt && (
                      <div className="text-sm text-green-600 mt-1">
                        ✓ Ausgezahlt: {formatDate(payment.paidAt)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Wichtige Informationen</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Mindestbetrag für Auszahlungen: €50.00</li>
            <li>• Auszahlungen werden innerhalb von 7-14 Werktagen bearbeitet</li>
            <li>• Stellen Sie sicher, dass Ihre Zahlungsinformationen im Profil vollständig sind</li>
            <li>• Bei Fragen kontaktieren Sie uns unter support@bereifung24.de</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
