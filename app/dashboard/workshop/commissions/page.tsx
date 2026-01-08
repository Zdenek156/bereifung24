'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Commission {
  id: string
  orderTotal: number
  commissionRate: number
  commissionAmount: number
  status: string
  billedAt: string | null
  collectedAt: string | null
  sepaReference: string | null
  notes: string | null
  createdAt: string
  booking: {
    appointmentDate: string
    customer: {
      user: {
        firstName: string
        lastName: string
      }
    }
    tireRequest: {
      season: string
      width: number
      aspectRatio: number
      diameter: number
      additionalNotes: string | null
    }
  }
}

interface CommissionsData {
  commissions: Commission[]
  summary: {
    totalPending: number
    totalBilled: number
    totalCollected: number
    totalAll: number
    count: number
  }
}

export default function WorkshopCommissions() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [commissionsData, setCommissionsData] = useState<CommissionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'billed' | 'collected'>('all')

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'WORKSHOP') {
      router.push('/dashboard')
      return
    }

    fetchCommissions()
  }, [session, status, router])

  const fetchCommissions = async () => {
    try {
      const response = await fetch('/api/workshop/commissions')
      if (response.ok) {
        const data = await response.json()
        setCommissionsData(data)
      }
    } catch (error) {
      console.error('Error fetching commissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-orange-100 text-orange-800',
      BILLED: 'bg-blue-100 text-blue-800',
      COLLECTED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
    }
    const labels = {
      PENDING: 'Offen',
      BILLED: 'In Rechnung gestellt',
      COLLECTED: 'Eingezogen',
      FAILED: 'Fehlgeschlagen',
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const getServiceDescription = (commission: Commission) => {
    const notes = commission.booking.tireRequest.additionalNotes || ''
    const width = commission.booking.tireRequest.width
    
    // Erkenne Service-Typen aus additionalNotes
    if (notes.includes('RÄDER UMSTECKEN')) {
      return 'Räder umstecken'
    }
    if (notes.includes('REIFENREPARATUR')) {
      return 'Reifenreparatur'
    }
    if (notes.includes('ACHSVERMESSUNG')) {
      return 'Achsvermessung'
    }
    if (notes.includes('BREMSEN-SERVICE')) {
      return 'Bremsen-Service'
    }
    if (notes.includes('BATTERIE-SERVICE')) {
      return 'Batterie-Service'
    }
    if (notes.includes('KLIMASERVICE')) {
      return 'Klimaservice'
    }
    if (notes.includes('SONSTIGE REIFENSERVICES') || notes.includes('SONSTIGE DIENSTLEISTUNG')) {
      return 'Sonstiger Service'
    }
    
    // Wenn width = 0 und kein erkannter Service, dann generischer Service
    if (width === 0) {
      return 'Service'
    }
    
    // Standard: Reifengröße anzeigen
    return `${commission.booking.tireRequest.width}/${commission.booking.tireRequest.aspectRatio} R${commission.booking.tireRequest.diameter}`
  }

  const filteredCommissions = commissionsData?.commissions.filter(comm => {
    if (filter === 'all') return true
    return comm.status === filter.toUpperCase()
  }) || []

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/workshop"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ← Zurück zum Dashboard
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Provisionen</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Übersicht der Plattformgebühren
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        {commissionsData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Gesamt</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {commissionsData.summary.totalAll.toFixed(2)} €
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {commissionsData.summary.count} Aufträge
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Offen</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {commissionsData.summary.totalPending.toFixed(2)} €
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">In Rechnung gestellt</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {commissionsData.summary.totalBilled.toFixed(2)} €
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Eingezogen</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {commissionsData.summary.totalCollected.toFixed(2)} €
              </p>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-blue-900 dark:text-blue-300">
              <p className="font-medium mb-1">Wie funktioniert die Provision?</p>
              <p>
                Für jeden abgeschlossenen Auftrag berechnen wir eine Plattformgebühr von 4,9% des Gesamtbetrags. 
                Die Gebühr wird automatisch per SEPA-Lastschrift von Ihrem hinterlegten Konto eingezogen. 
                Sie werden vor jedem Einzug per E-Mail informiert.
              </p>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Alle
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'pending'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Offen
            </button>
            <button
              onClick={() => setFilter('billed')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'billed'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              In Rechnung gestellt
            </button>
            <button
              onClick={() => setFilter('collected')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'collected'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Eingezogen
            </button>
          </div>
        </div>

        {/* Commissions List */}
        {filteredCommissions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Keine Provisionen</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {filter === 'all' 
                ? 'Es gibt noch keine Provisionen.'
                : `Keine ${filter === 'pending' ? 'offenen' : filter === 'billed' ? 'in Rechnung gestellten' : 'eingezogenen'} Provisionen.`}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Kunde / Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Auftragswert
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Provision (4,9%)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Abgerechnet
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCommissions.map((comm) => (
                  <tr key={comm.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(comm.booking.appointmentDate).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {comm.booking.customer.user.firstName} {comm.booking.customer.user.lastName}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">
                        {getServiceDescription(comm)}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {comm.orderTotal.toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-600">
                      {comm.commissionAmount.toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(comm.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {comm.collectedAt ? (
                        <span className="text-green-600">
                          ✓ {new Date(comm.collectedAt).toLocaleDateString('de-DE')}
                        </span>
                      ) : comm.billedAt ? (
                        <span className="text-blue-600">
                          {new Date(comm.billedAt).toLocaleDateString('de-DE')}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
