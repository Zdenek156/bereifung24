'use client'

import { useState, useEffect } from 'react'
import BackButton from '@/components/BackButton'

interface Commission {
  id: string
  bookingId: string
  orderTotal: number
  commissionRate: number
  commissionAmount: number
  stripeFee: number | null
  status: string
  billedAt: string | null
  collectedAt: string | null
  paymentMethod: string | null
  paymentMethodDetail: string | null
  paymentStatus: string | null
  stripePaymentId: string | null
  notes: string | null
  createdAt: string
  workshop: {
    id: string
    companyName: string
    contactName: string
    email: string
    stripeAccountId: string | null
  }
  customer: {
    name: string
    email: string
  }
}

type FilterType = 'all' | 'pending' | 'billed' | 'collected' | 'failed'

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [billing, setBilling] = useState(false)
  const [billingResult, setBillingResult] = useState<any>(null)

  useEffect(() => {
    fetchCommissions()
  }, [])

  const fetchCommissions = async () => {
    try {
      const response = await fetch('/api/admin/commissions')
      if (response.ok) {
        const data = await response.json()
        setCommissions(data.commissions)
      }
    } catch (error) {
      console.error('Error fetching commissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCommissions = commissions
    .filter(commission => {
      if (filter === 'all') return true
      return commission.status.toLowerCase() === filter
    })
    .filter(commission => {
      if (!searchTerm) return true
      const term = searchTerm.toLowerCase()
      return (
        commission.workshop.companyName.toLowerCase().includes(term) ||
        commission.customer.name.toLowerCase().includes(term) ||
        commission.workshop.email.toLowerCase().includes(term)
      )
    })

  const totalCommissions = filteredCommissions.reduce((sum, c) => sum + c.commissionAmount, 0)
  const pendingCommissions = commissions.filter(c => c.status === 'PENDING')
  const collectedCommissions = commissions.filter(c => c.status === 'COLLECTED')
  const failedCommissions = commissions.filter(c => c.status === 'FAILED')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'BILLED': return 'bg-blue-100 text-blue-800'
      case 'COLLECTED': return 'bg-green-100 text-green-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Ausstehend'
      case 'BILLED': return 'Abgerechnet'
      case 'COLLECTED': return 'Eingezogen'
      case 'FAILED': return 'Fehlgeschlagen'
      default: return status
    }
  }

  const handleUpdateStatus = async (commissionId: string, newStatus: string, sepaStatus?: string, notes?: string) => {
    try {
      const response = await fetch('/api/admin/commissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commissionId,
          status: newStatus,
          sepaStatus,
          notes
        })
      })

      if (response.ok) {
        fetchCommissions()
        setShowUpdateModal(false)
        setSelectedCommission(null)
      }
    } catch (error) {
      console.error('Error updating commission:', error)
    }
  }

  const handleManualBilling = async () => {
    if (!confirm('Provisionsabrechnungen für alle Werkstätten generieren?\n\nDies erstellt:\n✅ Abrechnungen für alle PENDING Provisionen\n✅ PDFs für jede Abrechnung\n✅ Buchhaltungseinträge\n✅ Email-Versand mit Info über bereits abgezogene Provisionen\n\n⚠️ Hinweis: Die Provisionen wurden bereits automatisch von Stripe abgezogen!')) {
      return
    }

    setBilling(true)
    setBillingResult(null)

    try {
      const response = await fetch('/api/admin/invoices/generate', {
        method: 'POST'
      })

      const result = await response.json()
      
      if (response.ok) {
        setBillingResult(result)
        
        // Build detailed message
        const summary = result.data?.summary
        if (summary) {
          let message = `📊 Rechnungsgenerierung abgeschlossen!\n\n`
          message += `✅ Erfolgreich: ${summary.successCount} Werkstätten\n`
          message += `❌ Fehlgeschlagen: ${summary.failedCount} Werkstätten\n`
          message += `📅 Zeitraum: ${new Date(summary.period.start).toLocaleDateString('de-DE')} - ${new Date(summary.period.end).toLocaleDateString('de-DE')}`
          
          // Show error details if any
          if (summary.failedWorkshops && summary.failedWorkshops.length > 0) {
            message += '\n\n❌ Fehlerdetails:'
            summary.failedWorkshops.forEach((err: any) => {
              message += `\n- ${err.workshopName}: ${err.error}`
            })
          }
          
          alert(message)
        } else {
          alert('✅ Rechnungen erfolgreich generiert!')
        }
        
        fetchCommissions() // Refresh list
      } else {
        alert(`❌ Fehler: ${result.error}`)
      }
    } catch (error) {
      console.error('Error generating invoices:', error)
      alert('❌ Fehler beim Generieren der Rechnungen')
    } finally {
      setBilling(false)
    }
  }

  const handleTest = async (step: number) => {
    try {
      const endpoints = [
        '/api/admin/invoices/test-create',
        '/api/admin/invoices/test-pdf',
        '/api/admin/invoices/test-accounting'
      ]
      
      console.log(`🧪 Starting Test ${step}...`)
      const response = await fetch(endpoints[step - 1], { method: 'POST' })
      const result = await response.json()
      
      console.log(`📊 Test ${step} Result:`, result)
      
      if (result.success) {
        console.log(`✅ Test ${step} SUCCESSFUL:`, result.data)
        alert(`✅ Test ${step} erfolgreich! Details in der Console (F12)`)
      } else {
        console.error(`❌ Test ${step} FAILED:`, result.error)
        console.error('Full error details:', result)
        alert(`❌ Test ${step} fehlgeschlagen! Siehe Console (F12) für Details`)
      }
    } catch (error) {
      console.error(`❌ Test ${step} ERROR:`, error)
      alert(`❌ Fehler bei Test ${step}! Siehe Console (F12)`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Test Buttons */}
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold mb-2 text-blue-900">🧪 Test-Modus (Schritt für Schritt)</h3>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => handleTest(1)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
              1️⃣ Rechnung erstellen
            </button>
            <button onClick={() => handleTest(2)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
              2️⃣ PDF per Email
            </button>
            <button onClick={() => handleTest(3)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
              3️⃣ Buchhaltung
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <BackButton />
            {pendingCommissions.length > 0 && (
              <button
                onClick={handleManualBilling}
                disabled={billing}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {billing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Rechnungen werden generiert...
                  </>
                ) : (
                  <>
                    📄 Abrechnungen generieren ({pendingCommissions.length} Provisionen)
                  </>
                )}
              </button>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Provisionsverwaltung</h1>
          <p className="text-gray-600 mt-2">Übersicht aller Provisionen und Zahlungen</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Gesamt Provisionen</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {commissions.length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Ausstehend</div>
            <div className="text-3xl font-bold text-yellow-600 mt-2">
              {pendingCommissions.length}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {pendingCommissions.reduce((sum, c) => sum + c.commissionAmount, 0).toLocaleString('de-DE', {
                style: 'currency',
                currency: 'EUR'
              })}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Eingezogen</div>
            <div className="text-3xl font-bold text-green-600 mt-2">
              {collectedCommissions.length}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {collectedCommissions.reduce((sum, c) => sum + c.commissionAmount, 0).toLocaleString('de-DE', {
                style: 'currency',
                currency: 'EUR'
              })}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Fehlgeschlagen</div>
            <div className="text-3xl font-bold text-red-600 mt-2">
              {failedCommissions.length}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {failedCommissions.reduce((sum, c) => sum + c.commissionAmount, 0).toLocaleString('de-DE', {
                style: 'currency',
                currency: 'EUR'
              })}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Suche nach Werkstatt oder Kunde..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Alle
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg ${filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Ausstehend
              </button>
              <button
                onClick={() => setFilter('collected')}
                className={`px-4 py-2 rounded-lg ${filter === 'collected' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Eingezogen
              </button>
              <button
                onClick={() => setFilter('failed')}
                className={`px-4 py-2 rounded-lg ${filter === 'failed' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Fehlgeschlagen
              </button>
            </div>
          </div>
        </div>

        {/* Commissions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Lade Provisionen...</p>
            </div>
          ) : filteredCommissions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Keine Provisionen gefunden
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Werkstatt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kunde
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Auftragswert
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provision
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stripe-Gebühren
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zahlungsmethode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Datum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCommissions.map((commission) => (
                    <tr key={commission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {commission.workshop.companyName}
                        </div>
                        <div className="text-sm text-gray-500">{commission.workshop.contactName}</div>
                        <div className="text-sm text-gray-500">{commission.workshop.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{commission.customer.name}</div>
                        <div className="text-sm text-gray-500">{commission.customer.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {commission.orderTotal.toLocaleString('de-DE', {
                            style: 'currency',
                            currency: 'EUR'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-primary-600">
                          {commission.commissionAmount.toLocaleString('de-DE', {
                            style: 'currency',
                            currency: 'EUR'
                          })}
                        </div>
                        <div className="text-xs text-gray-500">{commission.commissionRate}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {commission.stripeFee !== null ? (
                          <>
                            <div className="text-sm font-medium text-red-600">
                              {commission.stripeFee.toLocaleString('de-DE', {
                                style: 'currency',
                                currency: 'EUR'
                              })}
                            </div>
                            <div className="text-xs text-green-600">✓ Echte Gebühr</div>
                          </>
                        ) : (
                          <div className="text-xs text-gray-400">
                            Noch nicht erfasst
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {commission.paymentMethodDetail === 'google_pay' && (
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                              </svg>
                              <span>Google Pay</span>
                            </div>
                          )}
                          {commission.paymentMethodDetail === 'apple_pay' && (
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                              </svg>
                              <span>Apple Pay</span>
                            </div>
                          )}
                          {commission.paymentMethodDetail === 'card' && (
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20 8H4V6h16m0 12H4v-6h16m0-8H4c-1.11 0-2 .89-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
                              </svg>
                              <span>Kreditkarte</span>
                            </div>
                          )}
                          {commission.paymentMethodDetail === 'paypal' && (
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.76-4.852a.932.932 0 0 1 .922-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.78-4.461z"/>
                              </svg>
                              <span>PayPal</span>
                            </div>
                          )}
                          {commission.paymentMethod === 'STRIPE' && !commission.paymentMethodDetail && (
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
                              </svg>
                              <span>Stripe</span>
                            </div>
                          )}
                          {!commission.paymentMethod && (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(commission.status)}`}>
                          {getStatusText(commission.status)}
                        </span>
                        {commission.paymentStatus && (
                          <div className="text-xs text-gray-500 mt-1">
                            {commission.paymentStatus === 'PAID' ? '✓ Bezahlt' : 
                             commission.paymentStatus === 'PENDING' ? '⏳ Ausstehend' :
                             commission.paymentStatus === 'FAILED' ? '✗ Fehlgeschlagen' : 
                             commission.paymentStatus}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(commission.createdAt).toLocaleDateString('de-DE')}
                        </div>
                        {commission.collectedAt && (
                          <div className="text-xs text-green-600">
                            Eingezogen: {new Date(commission.collectedAt).toLocaleDateString('de-DE')}
                          </div>
                        )}
                        {commission.billedAt && !commission.collectedAt && (
                          <div className="text-xs text-blue-600">
                            Abgerechnet: {new Date(commission.billedAt).toLocaleDateString('de-DE')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedCommission(commission)
                            setShowUpdateModal(true)
                          }}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Bearbeiten
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        {filteredCommissions.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Zusammenfassung</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">Anzahl Provisionen</div>
                <div className="text-2xl font-bold text-gray-900">{filteredCommissions.length}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Gesamt Auftragswert</div>
                <div className="text-2xl font-bold text-gray-900">
                  {filteredCommissions.reduce((sum, c) => sum + c.orderTotal, 0).toLocaleString('de-DE', {
                    style: 'currency',
                    currency: 'EUR'
                  })}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Gesamt Provisionen</div>
                <div className="text-2xl font-bold text-primary-600">
                  {totalCommissions.toLocaleString('de-DE', {
                    style: 'currency',
                    currency: 'EUR'
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Update Modal */}
        {showUpdateModal && selectedCommission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Provision aktualisieren</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  defaultValue={selectedCommission.status}
                  onChange={(e) => {
                    if (confirm('Status wirklich ändern?')) {
                      handleUpdateStatus(selectedCommission.id, e.target.value)
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="PENDING">Ausstehend</option>
                  <option value="BILLED">Abgerechnet</option>
                  <option value="COLLECTED">Eingezogen</option>
                  <option value="FAILED">Fehlgeschlagen</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowUpdateModal(false)
                    setSelectedCommission(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
