'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import BackButton from '@/components/BackButton'

interface ApiSetting {
  id: string
  key: string
  value: string
  description: string
}

export default function AdminApiSettings() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState<ApiSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({}) // Track visibility per key

  useEffect(() => {
    if (status === 'loading') return

    if (!session || !session.user) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE') {
      router.push('/dashboard')
      return
    }

    loadSettings()
  }, [session, status, router])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/api-settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        
        // Initialize edited values
        const initial: Record<string, string> = {}
        data.forEach((setting: ApiSetting) => {
          initial[setting.key] = setting.value || ''
        })
        setEditedValues(initial)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updates = Object.entries(editedValues).map(([key, value]) => ({
        key,
        value
      }))

      const response = await fetch('/api/admin/api-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updates })
      })

      if (response.ok) {
        alert('Einstellungen erfolgreich gespeichert!')
        loadSettings()
      } else {
        const error = await response.json()
        alert(error.error || 'Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleValueChange = (key: string, value: string) => {
    setEditedValues(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const toggleVisibility = (key: string) => {
    setVisibleKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  if (status === 'loading' || !session) {
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
          <BackButton />
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">
                API-Einstellungen
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Verwalten Sie externe API-Keys (GoCardless, Google, etc.)
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Sicherheitshinweis:</strong> Diese Keys werden in der Datenbank gespeichert. 
                Geben Sie niemals API-Keys an Dritte weiter und ändern Sie sie regelmäßig.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Lade Einstellungen...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-6 space-y-6">
              {settings.map((setting) => (
                <div key={setting.id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                  <label className="block">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {setting.key}
                      </span>
                      {setting.value && (
                        <span className="text-xs text-green-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Konfiguriert
                        </span>
                      )}
                    </div>
                    {setting.description && (
                      <p className="text-xs text-gray-500 mb-2">{setting.description}</p>
                    )}
                    <div className="relative">
                      <input
                        type={visibleKeys[setting.key] ? "text" : "password"}
                        value={editedValues[setting.key] || ''}
                        onChange={(e) => handleValueChange(setting.key, e.target.value)}
                        placeholder={`${setting.key} eingeben...`}
                        className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => toggleVisibility(setting.key)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        {visibleKeys[setting.key] ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </label>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={() => loadSettings()}
                disabled={saving}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Zurücksetzen
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Speichern...
                  </>
                ) : (
                  'Speichern'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Verfügbare API-Keys:</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• <strong>GOCARDLESS_ACCESS_TOKEN</strong> - GoCardless API Access Token für SEPA-Lastschriften</li>
            <li>• <strong>GOCARDLESS_ENVIRONMENT</strong> - "sandbox" oder "live"</li>
            <li>• <strong>GOOGLE_OAUTH_CLIENT_ID</strong> - Google OAuth Client ID für Calendar Integration</li>
            <li>• <strong>GOOGLE_OAUTH_CLIENT_SECRET</strong> - Google OAuth Client Secret</li>
            <li>• <strong>API_NINJAS_KEY</strong> - API Ninjas für VIN Lookup und Fahrzeugsuche (Free: 50k/Monat)</li>
            <li>• <strong>STRIPE_SECRET_KEY</strong> - Stripe Secret Key (sk_test_xxx oder sk_live_xxx)</li>
            <li>• <strong>STRIPE_PUBLISHABLE_KEY</strong> - Stripe Publishable Key (pk_test_xxx oder pk_live_xxx)</li>
            <li>• <strong>STRIPE_WEBHOOK_SECRET</strong> - Stripe Webhook Signing Secret (whsec_xxx) für Webhook-Verifizierung</li>
          </ul>
          <p className="text-xs text-blue-600 mt-3">
            💡 <strong>API Ninjas Key:</strong> Kostenlos registrieren auf <a href="https://api-ninjas.com/register" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-800">api-ninjas.com/register</a>
          </p>
        </div>

        {/* PayPal Info Box */}
        <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-purple-900 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 00-.794.68l-.04.22-.63 3.993-.032.17a.804.804 0 01-.794.679H7.72a.483.483 0 01-.477-.558L7.418 21h1.518l.95-6.02h1.385c4.678 0 7.75-2.203 8.796-6.502z"/>
              <path d="M2.379 0h9.606a3.4 3.4 0 013.4 3.4v.01c0 2.416-1.672 4.534-4.035 5.15L10.12 9.61 9.72 12H8.333L6.975 21H5.591l1.357-8.387-1.229.002a3.4 3.4 0 01-3.393-3.165L2.31 9.28 2 7.417v-.002L2.379 0z"/>
            </svg>
            PayPal Integration
          </h3>
          <ul className="text-xs text-purple-700 space-y-1.5">
            <li>• <strong>PAYPAL_CLIENT_ID</strong> - Client ID aus PayPal Developer Dashboard → Apps & Credentials</li>
            <li>• <strong>PAYPAL_CLIENT_SECRET</strong> - Secret aus PayPal Developer Dashboard (auf "Show" klicken)</li>
            <li>• <strong>PAYPAL_WEBHOOK_ID</strong> - Webhook ID (Format: WH-xxxxxxxxxxxxx) nach Erstellung</li>
            <li>• <strong>PAYPAL_API_URL</strong> - API URL:
              <ul className="ml-4 mt-1">
                <li>→ Sandbox: <code className="bg-purple-100 px-1 rounded">https://api-m.sandbox.paypal.com</code></li>
                <li>→ Live: <code className="bg-purple-100 px-1 rounded">https://api-m.paypal.com</code></li>
              </ul>
            </li>
          </ul>
          <div className="mt-3 pt-3 border-t border-purple-200">
            <p className="text-xs text-purple-600">
              📝 <strong>Setup-Anleitung:</strong>
            </p>
            <ol className="text-xs text-purple-700 space-y-1 mt-1 ml-4 list-decimal">
              <li>Gehe zu <a href="https://developer.paypal.com/dashboard/" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-900">PayPal Developer Dashboard</a></li>
              <li>Apps & Credentials → Sandbox/Live auswählen</li>
              <li>App erstellen oder vorhandene auswählen</li>
              <li>Client ID & Secret kopieren (Secret: auf "Show" klicken)</li>
              <li>Webhook hinzufügen: <code className="bg-purple-100 px-1 rounded">https://bereifung24.de/api/webhooks/paypal</code></li>
              <li>Events auswählen: PAYMENT.CAPTURE.COMPLETED, DENIED, REFUNDED</li>
              <li>Webhook ID kopieren (WH-xxxxxxxxxxxxx)</li>
              <li>Alle Werte hier eintragen und speichern</li>
            </ol>
          </div>
        </div>

        {/* Stripe Info Box */}
        <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-indigo-900 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
            </svg>
            Stripe Integration
          </h3>
          <ul className="text-xs text-indigo-700 space-y-1.5">
            <li>• <strong>STRIPE_SECRET_KEY</strong> - Secret Key aus Stripe Dashboard → Developers → API keys</li>
            <li>• <strong>STRIPE_PUBLISHABLE_KEY</strong> - Publishable Key (wird auch im Frontend benötigt)</li>
            <li>• <strong>Wichtig:</strong> Test vs. Live Keys:
              <ul className="ml-4 mt-1">
                <li>→ Test: <code className="bg-indigo-100 px-1 rounded">sk_test_xxx</code> und <code className="bg-indigo-100 px-1 rounded">pk_test_xxx</code></li>
                <li>→ Live: <code className="bg-indigo-100 px-1 rounded">sk_live_xxx</code> und <code className="bg-indigo-100 px-1 rounded">pk_live_xxx</code></li>
              </ul>
            </li>
          </ul>
          <div className="mt-3 pt-3 border-t border-indigo-200">
            <p className="text-xs text-indigo-600">
              📝 <strong>Setup-Anleitung:</strong>
            </p>
            <ol className="text-xs text-indigo-700 space-y-1 mt-1 ml-4 list-decimal">
              <li>Gehe zu <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-900">Stripe Dashboard &gt; API keys</a></li>
              <li>Für Test-Modus: "Test mode" aktivieren (Toggle oben rechts)</li>
              <li>Secret key kopieren (sk_test_xxx oder sk_live_xxx)</li>
              <li>Publishable key kopieren (pk_test_xxx oder pk_live_xxx)</li>
              <li>Beide Keys hier eintragen und speichern</li>
              <li><strong>Webhook einrichten:</strong> Gehe zu <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-900">Webhooks</a></li>
              <li>URL: <code className="bg-indigo-100 px-1 rounded">https://bereifung24.de/api/webhooks/stripe</code></li>
              <li>Events: checkout.session.completed, payment_intent.succeeded, payment_intent.payment_failed, charge.refunded, <strong>account.updated</strong></li>
              <li>Webhook Secret (whsec_xxx) kopieren und als <strong>STRIPE_WEBHOOK_SECRET</strong> hier speichern</li>
            </ol>
          </div>
          <div className="mt-3 pt-3 border-t border-indigo-200">
            <p className="text-xs text-indigo-600">
              💡 <strong>Zahlungsmethoden:</strong> Stripe unterstützt Kreditkarte, SEPA-Lastschrift, Sofort, Giropay und viele mehr
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
