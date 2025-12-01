'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react'

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

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'pending_submission':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'pending_submission':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'failed':
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
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
        <Button onClick={fetchMandates} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Aktualisieren
        </Button>
      </div>

      <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-blue-600" />
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
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-4 text-gray-600">Lade Daten...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {mandates.map((mandate) => (
            <Card key={mandate.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{mandate.name}</h3>
                    {mandate.hasSepaMandate && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-2 ${getStatusColor(mandate.mandateStatus)}`}>
                        {getStatusIcon(mandate.mandateStatus)}
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
                      <Button
                        onClick={() => syncMandateStatus(mandate.id)}
                        disabled={syncing === mandate.id}
                        variant="outline"
                        size="sm"
                      >
                        {syncing === mandate.id ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Status prüfen
                      </Button>
                      
                      {mandate.mandateStatus !== 'active' && (
                        <Button
                          onClick={() => activateMandate(mandate.id)}
                          disabled={syncing === mandate.id}
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Manuell aktivieren
                        </Button>
                      )}
                    </>
                  )}
                  
                  {!mandate.hasSepaMandate && (
                    <span className="text-sm text-gray-500 italic">Kein SEPA-Mandat</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
