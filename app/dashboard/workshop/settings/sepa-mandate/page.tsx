'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface MandateInfo {
  configured: boolean
  mandate?: {
    id: string
    status: string
    reference: string
    createdAt: string
    nextPossibleChargeDate: string
    scheme: string
  }
  message?: string
}

export default function SEPAMandatePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mandate, setMandate] = useState<MandateInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchMandateStatus()
    }
  }, [session])

  const fetchMandateStatus = async () => {
    try {
      const res = await fetch('/api/workshop/sepa-mandate/status')
      if (res.ok) {
        const data = await res.json()
        setMandate(data)
      } else {
        setError('Fehler beim Laden des Mandat-Status')
      }
    } catch (err) {
      console.error('Error fetching mandate status:', err)
      setError('Netzwerkfehler')
    } finally {
      setLoading(false)
    }
  }

  const createMandate = async () => {
    setCreating(true)
    setError(null)

    try {
      const res = await fetch('/api/workshop/sepa-mandate/create', {
        method: 'POST'
      })

      const data = await res.json()

      if (res.ok && data.redirectUrl) {
        // Store session token and redirect flow ID
        sessionStorage.setItem('gc_redirect_flow_id', data.redirectFlowId)
        sessionStorage.setItem('gc_session_token', data.sessionToken)
        
        // Redirect to GoCardless
        window.location.href = data.redirectUrl
      } else {
        setError(data.error || 'Fehler beim Erstellen des Mandats')
      }
    } catch (err) {
      console.error('Error creating mandate:', err)
      setError('Netzwerkfehler')
    } finally {
      setCreating(false)
    }
  }

  const cancelMandate = async () => {
    if (!confirm('Möchten Sie Ihr SEPA-Mandat wirklich widerrufen? Zukünftige Provisionen müssen dann manuell überwiesen werden.')) {
      return
    }

    setCancelling(true)
    setError(null)

    try {
      const res = await fetch('/api/workshop/sepa-mandate/cancel', {
        method: 'POST'
      })

      const data = await res.json()

      if (res.ok) {
        alert('SEPA-Mandat wurde erfolgreich widerrufen')
        await fetchMandateStatus() // Refresh status
      } else {
        setError(data.error || 'Fehler beim Widerrufen des Mandats')
      }
    } catch (err) {
      console.error('Error cancelling mandate:', err)
      setError('Netzwerkfehler')
    } finally {
      setCancelling(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link 
            href="/dashboard/workshop/settings"
            className="text-primary-600 hover:text-primary-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Zurück zu Einstellungen
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SEPA-Lastschriftmandat
          </h1>
          <p className="text-gray-600 mb-8">
            Richten Sie ein SEPA-Mandat für die automatische Provisionsabrechnung ein
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {mandate?.configured && mandate.mandate ? (
            <div className="space-y-6">
              <div className="p-6 bg-green-50 border-2 border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 mb-1">
                      SEPA-Mandat aktiv
                    </h3>
                    <p className="text-green-700">
                      Ihr SEPA-Lastschriftmandat ist eingerichtet und aktiv
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <p className="font-semibold text-gray-900">
                    {mandate.mandate.status === 'active' && '✓ Aktiv'}
                    {mandate.mandate.status === 'pending_submission' && '⏳ Wird aktiviert...'}
                    {mandate.mandate.status === 'submitted' && '📝 Eingereicht'}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Mandatsreferenz</p>
                  <p className="font-mono text-sm text-gray-900">{mandate.mandate.reference}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Erstellt am</p>
                  <p className="text-gray-900">
                    {new Date(mandate.mandate.createdAt).toLocaleDateString('de-DE')}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Nächstmögliche Abbuchung</p>
                  <p className="text-gray-900">
                    {new Date(mandate.mandate.nextPossibleChargeDate).toLocaleDateString('de-DE')}
                  </p>
                </div>
              </div>

              <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">So funktioniert's</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">1.</span>
                    <span>Am Ende jeden Monats wird automatisch die Provision (4,9% des Umsatzes) berechnet</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">2.</span>
                    <span>Sie erhalten eine Rechnung mit Netto-/Brutto-Aufschlüsselung per E-Mail</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">3.</span>
                    <span>Der Betrag wird automatisch 3 Tage später von Ihrem Konto abgebucht</span>
                  </li>
                </ul>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Mandat verwalten</h3>
                <button
                  onClick={cancelMandate}
                  disabled={cancelling}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? 'Wird widerrufen...' : 'SEPA-Mandat widerrufen'}
                </button>
                <p className="mt-2 text-xs text-gray-500">
                  Nach dem Widerruf müssen Provisionen manuell überwiesen werden
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-900 mb-1">
                      Kein SEPA-Mandat eingerichtet
                    </h3>
                    <p className="text-yellow-700">
                      Um Provisionen automatisch abbuchen zu können, benötigen wir ein SEPA-Lastschriftmandat
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Was ist ein SEPA-Lastschriftmandat?</h3>
                <p className="text-gray-600">
                  Mit einem SEPA-Lastschriftmandat autorisieren Sie Bereifung24, fällige Provisionen 
                  automatisch von Ihrem Bankkonto abzubuchen. Dies vereinfacht die monatliche Abrechnung 
                  erheblich.
                </p>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Vorteile:</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Automatische monatliche Abrechnung
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Transparente Rechnungsstellung
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Keine vergessenen Zahlungen
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Jederzeit widerrufbar
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Ablauf:</h4>
                  <ol className="space-y-1 text-sm text-blue-800">
                    <li>1. Klicken Sie auf "SEPA-Mandat einrichten"</li>
                    <li>2. Sie werden zu GoCardless weitergeleitet (unser Zahlungsdienstleister)</li>
                    <li>3. Geben Sie Ihre Bankdaten ein und bestätigen Sie das Mandat</li>
                    <li>4. Nach Bestätigung werden Sie zurück zu Bereifung24 geleitet</li>
                  </ol>
                </div>

                <button
                  onClick={createMandate}
                  disabled={creating}
                  className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Wird erstellt...
                    </span>
                  ) : (
                    'SEPA-Mandat einrichten'
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  Sichere Verbindung über GoCardless • Zertifizierter Zahlungsdienstleister
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
