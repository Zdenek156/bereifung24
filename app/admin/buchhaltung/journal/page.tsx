'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import BackButton from '@/components/BackButton'

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
  attachmentUrls?: string[]
}

export default function JournalPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [entries, setEntries] = useState<AccountingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [accountFrom, setAccountFrom] = useState('')
  const [accountTo, setAccountTo] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [sourceType, setSourceType] = useState('ALL')
  const [showStorno, setShowStorno] = useState<'ALL' | 'ONLY' | 'EXCLUDE'>('ALL')
  const [showFilters, setShowFilters] = useState(false)
  const [detailModal, setDetailModal] = useState<{ open: boolean; entryId: string }>({ open: false, entryId: '' })
  const [detailData, setDetailData] = useState<any>(null)
  const [stornoModal, setStornoModal] = useState<{ open: boolean; entryId: string; entryNumber: string }>({ 
    open: false, 
    entryId: '', 
    entryNumber: '' 
  })
  const [stornoReason, setStornoReason] = useState('')
  const [stornoLoading, setStornoLoading] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [sortBy, setSortBy] = useState<'date' | 'entryNumber' | 'amount'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE') {
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
      if (accountFrom) params.append('accountFrom', accountFrom)
      if (accountTo) params.append('accountTo', accountTo)
      if (minAmount) params.append('minAmount', minAmount)
      if (maxAmount) params.append('maxAmount', maxAmount)
      if (sourceType && sourceType !== 'ALL') params.append('sourceType', sourceType)
      if (showStorno === 'ONLY') params.append('isStorno', 'true')
      if (showStorno === 'EXCLUDE') params.append('isStorno', 'false')

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

  const openDetailModal = async (entryId: string) => {
    setDetailModal({ open: true, entryId })
    setDetailData(null)

    try {
      const response = await fetch(`/api/admin/accounting/entries/${entryId}`)
      if (response.ok) {
        const data = await response.json()
        setDetailData(data.entry)
      }
    } catch (error) {
      console.error('Error fetching entry details:', error)
    }
  }

  const closeDetailModal = () => {
    setDetailModal({ open: false, entryId: '' })
    setDetailData(null)
  }

  const handleExport = () => {
    const params = new URLSearchParams()
    if (dateFrom) params.append('from', dateFrom)
    if (dateTo) params.append('to', dateTo)
    
    window.open(`/api/admin/accounting/entries/export?${params}`, '_blank')
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

  const handleFileUpload = async (files: FileList | null, entryId: string) => {
    if (!files || files.length === 0) return

    setUploadingFiles(true)
    const formData = new FormData()
    
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i])
    }
    formData.append('entryId', entryId)

    try {
      const response = await fetch('/api/admin/accounting/documents', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        alert(`${data.urls.length} Datei(en) erfolgreich hochgeladen`)
        // Refresh detail modal
        openDetailModal(entryId)
      } else {
        alert(data.error || 'Fehler beim Hochladen')
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      alert('Fehler beim Hochladen der Dateien')
    } finally {
      setUploadingFiles(false)
    }
  }

  const handleSort = (field: 'date' | 'entryNumber' | 'amount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const getSortedEntries = () => {
    const sorted = [...entries].sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime()
          break
        case 'entryNumber':
          comparison = a.entryNumber.localeCompare(b.entryNumber)
          break
        case 'amount':
          comparison = a.amount - b.amount
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return sorted
  }

  const handleRemoveDocument = async (entryId: string, fileUrl: string) => {
    if (!confirm('Beleg wirklich entfernen?')) return

    try {
      const response = await fetch('/api/admin/accounting/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId, fileUrl })
      })

      const data = await response.json()

      if (response.ok) {
        alert('Beleg erfolgreich entfernt')
        // Refresh detail modal
        openDetailModal(entryId)
      } else {
        alert(data.error || 'Fehler beim Entfernen')
      }
    } catch (error) {
      console.error('Error removing document:', error)
      alert('Fehler beim Entfernen des Belegs')
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
              <BackButton />
              <h1 className="text-3xl font-bold text-gray-900">
                Journalbuch
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Chronologische Übersicht aller Buchungseinträge ({entries.length} Einträge)
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                CSV Export
              </button>
              <Link
                href="/admin/buchhaltung/manuelle-buchung"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                + Neue Buchung
              </Link>
            </div>
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
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('entryNumber')}
                  >
                    <div className="flex items-center gap-2">
                      Belegnr.
                      {sortBy === 'entryNumber' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-2">
                      Datum
                      {sortBy === 'date' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Soll
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Haben
                  </th>
                  <th 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Betrag
                      {sortBy === 'amount' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Beschreibung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quelle
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">                    Belege
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                      Noch keine Buchungseinträge vorhanden
                    </td>
                  </tr>
                ) : (
                  getSortedEntries().map((entry) => (
                    <tr 
                      key={entry.id} 
                      className={`hover:bg-gray-50 ${entry.isStorno ? 'bg-red-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <button
                          onClick={() => openDetailModal(entry.id)}
                          className="text-primary-600 hover:text-primary-800 hover:underline cursor-pointer"
                        >
                          {entry.entryNumber}
                        </button>
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
                        {entry.attachmentUrls && entry.attachmentUrls.length > 0 ? (
                          <div className="flex items-center justify-center gap-1">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-xs font-medium text-green-600">
                              {entry.attachmentUrls.length}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
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
              Fehlerhafte Buchungen müssen per Storno korrigiert werden. Klicken Sie auf die Belegnummer für Details.
            </div>
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {detailModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Buchungsdetails
                </h3>
                <button
                  onClick={closeDetailModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {!detailData ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Basis-Info */}
                  <div className="grid grid-cols-2 gap-6 pb-6 border-b">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Belegnummer</label>
                      <p className="mt-1 text-lg font-semibold text-gray-900">{detailData.entryNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Buchungsdatum</label>
                      <p className="mt-1 text-lg text-gray-900">
                        {new Date(detailData.bookingDate).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Betrag</label>
                      <p className="mt-1 text-2xl font-bold text-gray-900">{detailData.amount.toFixed(2)} €</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <p className="mt-1">
                        {detailData.isStorno ? (
                          <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800">
                            STORNO
                          </span>
                        ) : detailData.locked ? (
                          <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                            Gesperrt
                          </span>
                        ) : (
                          <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800">
                            Offen
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Konten */}
                  <div className="grid grid-cols-2 gap-6 pb-6 border-b">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Soll-Konto</label>
                      <p className="mt-1 text-lg font-semibold text-gray-900">
                        {detailData.debitAccountDetails?.accountNumber || detailData.debitAccount}
                      </p>
                      <p className="text-sm text-gray-600">
                        {detailData.debitAccountDetails?.accountName}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                        {detailData.debitAccountDetails?.accountType}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Haben-Konto</label>
                      <p className="mt-1 text-lg font-semibold text-gray-900">
                        {detailData.creditAccountDetails?.accountNumber || detailData.creditAccount}
                      </p>
                      <p className="text-sm text-gray-600">
                        {detailData.creditAccountDetails?.accountName}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                        {detailData.creditAccountDetails?.accountType}
                      </span>
                    </div>
                  </div>

                  {/* Beschreibung & Quelle */}
                  <div className="pb-6 border-b">
                    <label className="text-sm font-medium text-gray-500">Beschreibung</label>
                    <p className="mt-1 text-gray-900">{detailData.description}</p>
                    
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Quelle</label>
                        <p className="mt-1">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {detailData.sourceType}
                          </span>
                        </p>
                      </div>
                      {detailData.documentNumber && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Belegnummer</label>
                          <p className="mt-1 text-sm text-gray-900">{detailData.documentNumber}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ersteller & Zeitstempel */}
                  <div className="grid grid-cols-2 gap-6 pb-6 border-b">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Erstellt von</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {detailData.createdBy?.name || 'System'}
                      </p>
                      <p className="text-xs text-gray-500">{detailData.createdBy?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Erstellt am</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(detailData.createdAt).toLocaleString('de-DE')}
                      </p>
                    </div>
                  </div>

                  {/* Belege/Dokumente */}
                  <div className="pb-6 border-b">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-500">
                        Belege & Dokumente ({detailData.attachmentUrls?.length || 0})
                      </label>
                      {!detailData.locked && !detailData.isStorno && (
                        <label className="px-3 py-1 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 cursor-pointer transition-colors">
                          {uploadingFiles ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Hochladen...
                            </div>
                          ) : (
                            <>+ Belege hochladen</>
                          )}
                          <input
                            type="file"
                            multiple
                            accept="application/pdf,image/jpeg,image/jpg,image/png,image/heic"
                            onChange={(e) => handleFileUpload(e.target.files, detailData.id)}
                            className="hidden"
                            disabled={uploadingFiles}
                          />
                        </label>
                      )}
                    </div>

                    {detailData.attachmentUrls && detailData.attachmentUrls.length > 0 ? (
                      <div className="space-y-2">
                        {detailData.attachmentUrls.map((url: string, idx: number) => {
                          const filename = url.split('/').pop() || 'Dokument'
                          const isPDF = filename.toLowerCase().endsWith('.pdf')
                          
                          return (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-gray-100">
                              <div className="flex items-center gap-3">
                                {isPDF ? (
                                  <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <img 
                                    src={url} 
                                    alt={filename} 
                                    className="w-12 h-12 object-cover rounded border border-gray-200"
                                  />
                                )}
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{filename}</p>
                                  <p className="text-xs text-gray-500">
                                    {isPDF ? 'PDF-Dokument' : 'Bild'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1 text-sm text-primary-600 hover:text-primary-800 hover:underline"
                                >
                                  Öffnen
                                </a>
                                <a
                                  href={url}
                                  download
                                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  Download
                                </a>
                                {!detailData.locked && !detailData.isStorno && (
                                  <button
                                    onClick={() => handleRemoveDocument(detailData.id, url)}
                                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:underline"
                                  >
                                    Entfernen
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <svg className="mx-auto w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm text-gray-500">Noch keine Belege hochgeladen</p>
                        {!detailData.locked && !detailData.isStorno && (
                          <p className="text-xs text-gray-400 mt-1">
                            Nutzen Sie den Button oben, um Belege hinzuzufügen
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Audit Log */}
                  {detailData.auditLogs && detailData.auditLogs.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-3 block">Änderungshistorie</label>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {detailData.auditLogs.map((log: any, idx: number) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-3 text-sm">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">{log.action}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(log.timestamp).toLocaleString('de-DE')}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">
                              {log.user?.name || 'System'} ({log.user?.email})
                            </p>
                            {log.changes && (
                              <div className="mt-2 p-2 bg-white rounded text-xs font-mono">
                                {log.changes.reason && (
                                  <p><strong>Grund:</strong> {log.changes.reason}</p>
                                )}
                                {log.changes.stornoEntryId && (
                                  <p className="text-red-600"><strong>Storno-ID:</strong> {log.changes.stornoEntryId}</p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeDetailModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
