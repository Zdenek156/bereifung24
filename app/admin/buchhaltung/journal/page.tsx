'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface AccountingEntry {
  id: string
  entryNumber: string
  bookingDate: string
  debitAccount: string
  creditAccount: string
  debitAccountName?: string
  creditAccountName?: string
  amount: number
  description: string
  sourceType: string
  locked: boolean
  isStorno: boolean
  createdAt: string
}

export default function JournalPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [entries, setEntries] = useState<AccountingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [stornoModal, setStornoModal] = useState<{ open: boolean; entryId: string; entryNumber: string }>({ 
    open: false, 
    entryId: '', 
    entryNumber: '' 
  })
  const [stornoReason, setStornoReason] = useState('')
  const [stornoLoading, setStornoLoading] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }

    fetchEntries()
  }, [session, status, router])

  const fetchEntries = async () => {
    try {
      const params = new URLSearchParams()
      if (filter) params.append('search', filter)
      if (dateFrom) params.append('from', dateFrom)
      if (dateTo) params.append('to', dateTo)

      const response = await fetch(`/api/admin/accounting/entries?${params}`)
      if (response.ok) {
        const data = await response.json()
        setEntries(data.entries || [])
      }
    } catch (error) {
      console.error('Error fetching entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setLoading(true)
    fetchEntries()
  }

  const openStornoModal = (entryId: string, entryNumber: string) => {
    setStornoModal({ open: true, entryId, entryNumber })
    setStornoReason('')
  }

  const closeStornoModal = () => {
    setStornoModal({ open: false, entryId: '', entryNumber: '' })
    setStornoReason('')
  }

  const handleStorno = async () => {
    if (!stornoReason || stornoReason.trim().length < 3) {
      alert('Bitte geben Sie einen Grund für die Stornierung an (mindestens 3 Zeichen)')
      return
    }

    setStornoLoading(true)
    try {
      const response = await fetch(`/api/admin/accounting/entries/${stornoModal.entryId}/storno`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: stornoReason })
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message || 'Buchung erfolgreich storniert')
        closeStornoModal()
        fetchEntries() // Refresh list
      } else {
        alert(data.error || 'Fehler beim Stornieren')
      }
    } catch (error) {
      console.error('Error creating storno:', error)
      alert('Fehler beim Stornieren der Buchung')
    } finally {
      setStornoLoading(false)
    }
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
          <div className="flex items-center justify-between">
            <div>
              <Link 
                href="/admin/buchhaltung" 
                className="text-primary-600 hover:text-primary-700 mb-2 inline-block"
              >
                ← Zurück zur Buchhaltung
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                Journalbuch
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Chronologische Übersicht aller Buchungseinträge
              </p>
            </div>
            <Link
              href="/admin/buchhaltung/manuelle-buchung"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              + Neue Buchung
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suche
              </label>
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Buchungsnummer, Beschreibung..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Von Datum
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bis Datum
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Suchen
              </button>
            </div>
          </div>
        </div>

        {/* Journal Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Belegnr.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Soll
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Haben
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Betrag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Beschreibung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quelle
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      Noch keine Buchungseinträge vorhanden
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr 
                      key={entry.id} 
                      className={`hover:bg-gray-50 ${entry.isStorno ? 'bg-red-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {entry.entryNumber}
                        {entry.description.startsWith('STORNO:') && (
                          <div className="text-xs text-red-600 mt-1">
                            {entry.description.match(/STORNO-(.+?)(?:\s|$)/)?.[0] || ''}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(entry.bookingDate).toLocaleDateString('de-DE')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">{entry.debitAccount}</div>
                        {entry.debitAccountName && (
                          <div className="text-gray-500 text-xs">{entry.debitAccountName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">{entry.creditAccount}</div>
                        {entry.creditAccountName && (
                          <div className="text-gray-500 text-xs">{entry.creditAccountName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        {entry.amount.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                        <div className="truncate" title={entry.description}>
                          {entry.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {entry.sourceType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {entry.isStorno ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            STORNO
                          </span>
                        ) : entry.locked ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Gesperrt
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            Offen
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {!entry.isStorno && !entry.locked && (
                          <button
                            onClick={() => openStornoModal(entry.id, entry.entryNumber)}
                            className="text-red-600 hover:text-red-800 font-medium text-sm"
                            title="Buchung stornieren"
                          >
                            Stornieren
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-700">
              <strong>Hinweis:</strong> Gesperrte Einträge können nicht mehr geändert werden (GoBD-Konformität). 
              Fehlerhafte Buchungen müssen per Storno korrigiert werden.
            </div>
          </div>
        </div>
      </main>

      {/* Storno Modal */}
      {stornoModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Buchung stornieren
                </h3>
                <button
                  onClick={closeStornoModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex">
                  <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Achtung - GoBD-konformes Storno</p>
                    <p>Die Buchung <strong>{stornoModal.entryNumber}</strong> wird nicht gelöscht.</p>
                    <p className="mt-2">Es wird eine Gegenbuchung erstellt, die Soll und Haben vertauscht.</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grund für Stornierung <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={stornoReason}
                  onChange={(e) => setStornoReason(e.target.value)}
                  placeholder="z.B. Falscher Betrag, Falsches Konto, etc."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Mindestens 3 Zeichen (wird in Audit-Log gespeichert)
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeStornoModal}
                  disabled={stornoLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleStorno}
                  disabled={stornoLoading || !stornoReason || stornoReason.trim().length < 3}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {stornoLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Storniere...
                    </div>
                  ) : (
                    'Jetzt stornieren'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
