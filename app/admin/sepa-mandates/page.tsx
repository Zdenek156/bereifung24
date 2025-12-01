'use client'

import { useState, useEffect } from 'react'

interface SepaMandateInfo {
  id: string
  name: string
  email: string
  owner: string
  hasSepaMandate: boolean
  mandateStatus: string | null
  mandateRef: string | null
  mandateCreatedAt: string | null
  customerId: string | null
}

export default function SepaMandatesPage() {
  const [mandates, setMandates] = useState<SepaMandateInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)

  const fetchMandates = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/sepa-status')
      const data = await response.json()
      setMandates(data.workshops)
    } catch (error) {
      console.error('Error fetching mandates:', error)
    } finally {
      setLoading(false)
    }
  }

  const syncMandateStatus = async (workshopId: string) => {
    setSyncing(workshopId)
    try {
      const response = await fetch('/api/debug/check-mandate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workshopId })
      })
      const result = await response.json()
      
      if (result.error) {
        alert(`Fehler: ${result.error}`)
      } else {
        alert(`Status aktualisiert: ${result.oldStatus} → ${result.newStatus}`)
        fetchMandates()
      }
    } catch (error) {
      alert('Fehler beim Synchronisieren')
    } finally {
      setSyncing(null)
    }
  }

  const activateMandate = async (workshopId: string) => {
    if (!confirm('SEPA-Mandat manuell auf "active" setzen?')) return
    
    setSyncing(workshopId)
    try {
      const response = await fetch('/api/debug/activate-sepa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workshopId })
      })
      const result = await response.json()
      
      if (result.success) {
        alert('SEPA-Mandat aktiviert!')
        fetchMandates()
      }
    } catch (error) {
      alert('Fehler beim Aktivieren')
    } finally {
      setSyncing(null)
    }
  }

  useEffect(() => {
    fetchMandates()
  }, [])

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'pending_submission':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">SEPA-Mandate</h1>
          <p className="text-gray-600 mt-1">
            GoCardless Mandate-Status für alle Werkstätten
          </p>
        </div>
        <button 
          onClick={fetchMandates} 
          disabled={loading}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Aktualisieren
        </button>
      </div>

      <div className="p-6 mb-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Webhook-Konfiguration erforderlich
        </h3>
        <p className="text-sm text-gray-700 mb-3">
          Damit SEPA-Mandate automatisch von <code>pending_submission</code> auf <code>active</code> 
          wechseln, muss der GoCardless Webhook konfiguriert werden:
        </p>
        <ol className="text-sm space-y-1 ml-4 list-decimal text-gray-700">
          <li>GoCardless Dashboard → Developers → Webhooks öffnen</li>
          <li>Webhook URL hinzufügen: <code className="bg-white px-2 py-1 rounded">https://reifen.bereifung24.de/api/webhooks/gocardless</code></li>
          <li>Webhook Secret kopieren</li>
          <li>In <code className="bg-white px-2 py-1 rounded">/var/www/bereifung24/.env</code> hinzufügen: <code className="bg-white px-2 py-1 rounded">GOCARDLESS_WEBHOOK_SECRET="..."</code></li>
          <li>PM2 neu starten: <code className="bg-white px-2 py-1 rounded">pm2 restart bereifung24</code></li>
        </ol>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <svg className="w-8 h-8 animate-spin mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <p className="mt-4 text-gray-600">Lade Daten...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {mandates.map((mandate) => (
            <div key={mandate.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{mandate.name}</h3>
                    {mandate.hasSepaMandate && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(mandate.mandateStatus)}`}>
                        {mandate.mandateStatus || 'Kein Status'}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mt-4">
                    <div>
                      <span className="font-medium">Owner:</span> {mandate.owner}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {mandate.email}
                    </div>
                    <div>
                      <span className="font-medium">Workshop ID:</span> 
                      <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">{mandate.id}</code>
                    </div>
                    {mandate.customerId && (
                      <div>
                        <span className="font-medium">Customer ID:</span> 
                        <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">{mandate.customerId}</code>
                      </div>
                    )}
                    {mandate.mandateRef && (
                      <div>
                        <span className="font-medium">Mandate Ref:</span> {mandate.mandateRef}
                      </div>
                    )}
                    {mandate.mandateCreatedAt && (
                      <div>
                        <span className="font-medium">Erstellt:</span> {new Date(mandate.mandateCreatedAt).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  {mandate.hasSepaMandate && (
                    <>
                      <button
                        onClick={() => syncMandateStatus(mandate.id)}
                        disabled={syncing === mandate.id}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm flex items-center gap-2"
                      >
                        <svg className={`w-4 h-4 ${syncing === mandate.id ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Status prüfen
                      </button>
                      
                      {mandate.mandateStatus !== 'active' && (
                        <button
                          onClick={() => activateMandate(mandate.id)}
                          disabled={syncing === mandate.id}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                        >
                          Manuell aktivieren
                        </button>
                      )}
                    </>
                  )}
                  
                  {!mandate.hasSepaMandate && (
                    <span className="text-sm text-gray-500 italic">Kein SEPA-Mandat</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
