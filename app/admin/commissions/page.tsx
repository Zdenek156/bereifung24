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
  freelancer: {
    id: string
    name: string
    tier: string
    amount: number | null
    percentage: number | null
  } | null
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

type TimePeriod = 'today' | 'week' | 'month' | 'year'

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month')
  const [searchTerm, setSearchTerm] = useState('')
  const [billing, setBilling] = useState(false)
  const [billingResult, setBillingResult] = useState<any>(null)
  const [backfilling, setBackfilling] = useState(false)

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

  // Calculate date range based on time period
  const getDateRange = () => {
    const now = new Date()
    const start = new Date()
    
    switch (timePeriod) {
      case 'today':
        start.setHours(0, 0, 0, 0)
        break
      case 'week':
        start.setDate(now.getDate() - 7)
        break
      case 'month':
        start.setMonth(now.getMonth() - 1)
        break
      case 'year':
        start.setFullYear(now.getFullYear() - 1)
        break
    }
    return start
  }

  const filteredCommissions = commissions
    .filter(commission => {
      // Filter by time period
      const commissionDate = new Date(commission.createdAt)
      const startDate = getDateRange()
      if (commissionDate < startDate) return false
      
      // Filter by search term
      if (!searchTerm) return true
      const term = searchTerm.toLowerCase()
      return (
        commission.workshop.companyName.toLowerCase().includes(term) ||
        commission.customer.name.toLowerCase().includes(term) ||
        commission.workshop.email.toLowerCase().includes(term)
      )
    })

  const totalCommissions = filteredCommissions.reduce((sum, c) => sum + c.commissionAmount, 0)
  const totalStripeFees = filteredCommissions.reduce((sum, c) => sum + (c.stripeFee || 0), 0)
  const totalFreelancerPayouts = filteredCommissions.reduce((sum, c) => sum + (c.freelancer?.amount || 0), 0)
  const freelancerBookings = filteredCommissions.filter(c => c.freelancer?.amount)
  const pendingCommissions = filteredCommissions.filter(c => c.status === 'PENDING')
  const collectedCommissions = filteredCommissions.filter(c => c.status === 'COLLECTED')

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

  const handleBackfill = async () => {
    if (!confirm('Fehlende Stripe-Gebühren, Zahlungsmethoden und Freelancer-Provisionen für bestehende Buchungen nachträglich laden?\n\nDies ist sicher und kann mehrfach ausgeführt werden.')) {
      return
    }
    setBackfilling(true)
    try {
      const response = await fetch('/api/admin/commissions/backfill', { method: 'POST' })
      const result = await response.json()
      if (result.success) {
        const s = result.summary
        alert(`✅ Backfill abgeschlossen!\n\nStripe-Gebühren aktualisiert: ${s.stripeFeesUpdated}\nZahlungsmethoden aktualisiert: ${s.paymentMethodsUpdated}\nFL-Provisionen erstellt: ${s.freelancerCommissionsCreated}`)
        fetchCommissions()
      } else {
        alert(`❌ Fehler: ${result.error}`)
      }
    } catch (error) {
      console.error('Backfill error:', error)
      alert('❌ Backfill fehlgeschlagen')
    } finally {
      setBackfilling(false)
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
            <button
              onClick={handleBackfill}
              disabled={backfilling}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm disabled:bg-gray-400"
            >
              {backfilling ? '⏳ Backfill läuft...' : '🔄 Backfill (Stripe + FL-Provisionen)'}
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
            <div className="text-sm font-medium text-gray-600">Buchungen (Zeitraum)</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {filteredCommissions.length}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {totalCommissions.toLocaleString('de-DE', {
                style: 'currency',
                currency: 'EUR'
              })}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Stripe-Gebühren</div>
            <div className="text-3xl font-bold text-red-600 mt-2">
              {totalStripeFees.toLocaleString('de-DE', {
                style: 'currency',
                currency: 'EUR'
              })}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Durchschnitt: {filteredCommissions.length > 0 ? (totalStripeFees / filteredCommissions.length).toFixed(2) : '0.00'}€
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Provisionen (Zeitraum)</div>
            <div className="text-3xl font-bold text-green-600 mt-2">
              {totalCommissions.toLocaleString('de-DE', {
                style: 'currency',
                currency: 'EUR'
              })}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Durchschnitt: {filteredCommissions.length > 0 ? (totalCommissions / filteredCommissions.length).toFixed(2) : '0.00'}€
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Freelancer-Auszahlungen</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">
              {totalFreelancerPayouts.toLocaleString('de-DE', {
                style: 'currency',
                currency: 'EUR'
              })}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {freelancerBookings.length} Buchungen mit FL-Anteil
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
                onClick={() => setTimePeriod('today')}
                className={`px-4 py-2 rounded-lg ${timePeriod === 'today' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Heute
              </button>
              <button
                onClick={() => setTimePeriod('week')}
                className={`px-4 py-2 rounded-lg ${timePeriod === 'week' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Woche
              </button>
              <button
                onClick={() => setTimePeriod('month')}
                className={`px-4 py-2 rounded-lg ${timePeriod === 'month' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Monat
              </button>
              <button
                onClick={() => setTimePeriod('year')}
                className={`px-4 py-2 rounded-lg ${timePeriod === 'year' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Jahr
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
                      Freelancer
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
                        {commission.freelancer?.amount ? (
                          <>
                            <div className="text-sm font-medium text-purple-600">
                              -{commission.freelancer.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                            </div>
                            <div className="text-xs text-gray-500">{commission.freelancer.name}</div>
                            <div className="text-xs text-gray-400">{commission.freelancer.tier} ({commission.freelancer.percentage}%)</div>
                          </>
                        ) : commission.freelancer ? (
                          <div className="text-xs text-gray-400">{commission.freelancer.name} (ausstehend)</div>
                        ) : (
                          <div className="text-xs text-gray-300">—</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {commission.paymentMethodDetail ? (
                            <div className="flex items-center gap-2">
                              {commission.paymentMethodDetail.toUpperCase() === 'VISA' && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">VISA</span>
                              )}
                              {commission.paymentMethodDetail.toUpperCase() === 'MASTERCARD' && (
                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">Mastercard</span>
                              )}
                              {commission.paymentMethodDetail.toUpperCase() === 'AMEX' && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">Amex</span>
                              )}
                              {['google_pay', 'GOOGLE_PAY'].includes(commission.paymentMethodDetail) && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded">Google Pay</span>
                              )}
                              {['apple_pay', 'APPLE_PAY'].includes(commission.paymentMethodDetail) && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">Apple Pay</span>
                              )}
                              {commission.paymentMethodDetail.toLowerCase() === 'paypal' && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">PayPal</span>
                              )}
                              {!['visa', 'mastercard', 'amex', 'google_pay', 'apple_pay', 'paypal'].includes(commission.paymentMethodDetail.toLowerCase()) && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">{commission.paymentMethodDetail.toUpperCase()}</span>
                              )}
                            </div>
                          ) : (
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <div className="text-sm text-gray-600">Gesamt Provisionen (B24)</div>
                <div className="text-2xl font-bold text-primary-600">
                  {totalCommissions.toLocaleString('de-DE', {
                    style: 'currency',
                    currency: 'EUR'
                  })}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Davon Freelancer-Anteil</div>
                <div className="text-2xl font-bold text-purple-600">
                  {totalFreelancerPayouts.toLocaleString('de-DE', {
                    style: 'currency',
                    currency: 'EUR'
                  })}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  B24-Netto nach FL: {(totalCommissions - totalStripeFees - totalFreelancerPayouts).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </div>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  )
}
