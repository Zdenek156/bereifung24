'use client'

import { useState, useEffect } from 'react'
import BackButton from '@/components/BackButton'

interface Commission {
  id: string
  bookingId: string
  orderTotal: number
  commissionRate: number
  commissionAmount: number
  status: string
  billedAt: string | null
  collectedAt: string | null
  sepaReference: string | null
  sepaStatus: string | null
  notes: string | null
  createdAt: string
  workshop: {
    id: string
    companyName: string
    contactName: string
    email: string
    iban: string | null
    accountHolder: string | null
    paypalEmail: string | null
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
    if (!confirm('Provisionsrechnungen für alle Werkstätten generieren?\n\nDies erstellt:\n✅ Rechnungen für alle PENDING Provisionen\n✅ PDFs für jede Rechnung\n✅ Buchhaltungseinträge\n✅ Email-Versand an Werkstätten\n✅ SEPA-Abbuchungen (falls Mandat vorhanden)')) {
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
        '/api/admin/invoices/test-accounting',
        '/api/admin/invoices/test-sepa'
      ]
      
      const response = await fetch(endpoints[step - 1], { method: 'POST' })
      const result = await response.json()
      
      if (result.success) {
        alert(`✅ Test ${step} erfolgreich!\n\n${JSON.stringify(result.data, null, 2)}`)
      } else {
        alert(`❌ Test ${step} fehlgeschlagen:\n${result.error}`)
      }
    } catch (error) {
      alert(`❌ Fehler bei Test ${step}`)
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
            <button onClick={() => handleTest(4)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
              4️⃣ SEPA
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
                    📄 Rechnungen generieren & abrechnen ({pendingCommissions.length} Provisionen)
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
                      Bankverbindung
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
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {commission.workshop.iban ? (
                            <>
                              <div className="font-medium">{commission.workshop.accountHolder}</div>
                              <div className="text-xs text-gray-500 font-mono">{commission.workshop.iban}</div>
                            </>
                          ) : commission.workshop.paypalEmail ? (
                            <>
                              <div className="font-medium">PayPal</div>
                              <div className="text-xs text-gray-500">{commission.workshop.paypalEmail}</div>
                            </>
                          ) : (
                            <span className="text-red-500">Keine Angabe</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(commission.status)}`}>
                          {getStatusText(commission.status)}
                        </span>
                        {commission.sepaStatus && (
                          <div className="text-xs text-gray-500 mt-1">
                            SEPA: {commission.sepaStatus}
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
