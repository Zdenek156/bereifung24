// app/admin/buchhaltung/belege/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Document {
  url: string
  fileName: string
  entryId: string | null
  documentNumber: string | null
  description: string | null
  bookingDate: string | null
  amount: number | null
  debitAccount: string | null
  creditAccount: string | null
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filterUnassigned, setFilterUnassigned] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    setStartDate(monthStart.toISOString().split('T')[0])
    setEndDate(monthEnd.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (startDate && endDate) {
      fetchDocuments()
    }
  }, [startDate, endDate, filterUnassigned])

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        ...(filterUnassigned && { unassigned: 'true' })
      })
      
      const response = await fetch(`/api/admin/accounting/documents?${params}`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (files: FileList | null, entryId?: string) => {
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach(file => {
        formData.append('files', file)
      })
      if (entryId) {
        formData.append('entryId', entryId)
      }

      const response = await fetch('/api/admin/accounting/documents', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        alert(`${data.count} Datei(en) erfolgreich hochgeladen`)
        fetchDocuments()
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload fehlgeschlagen')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveDocument = async (entryId: string, documentUrl: string) => {
    if (!confirm('Beleg wirklich von dieser Buchung entfernen?')) return

    try {
      const response = await fetch('/api/admin/accounting/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId, documentUrl })
      })

      if (response.ok) {
        alert('Beleg erfolgreich entfernt')
        fetchDocuments()
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error}`)
      }
    } catch (error) {
      console.error('Remove error:', error)
      alert('Fehler beim Entfernen')
    }
  }

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-'
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('de-DE')
  }

  const getFileType = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return 'PDF'
    if (['jpg', 'jpeg', 'png', 'heic'].includes(ext || '')) return 'Bild'
    return ext?.toUpperCase() || 'Datei'
  }

  const isImage = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    return ['jpg', 'jpeg', 'png'].includes(ext || '')
  }

  return (
    <main className="flex-1 p-8 bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/admin/buchhaltung"
          className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block"
        >
          ← Zurück zur Buchhaltung
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          Beleg-Verwaltung
        </h1>
        <p className="text-gray-600 mt-2">
          Hochladen, Verwalten und Zuordnen von Belegen zu Buchungen
        </p>
      </div>

      {/* Info-Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-1">
              Belege direkt aus dem Journal hochladen
            </h3>
            <p className="text-sm text-blue-700">
              Öffnen Sie eine Buchung im <Link href="/admin/buchhaltung/journal" className="underline font-medium">Journalbuch</Link> und laden Sie dort den Beleg direkt hoch. 
              So wird er automatisch der richtigen Buchung zugeordnet.
            </p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Von
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bis
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchDocuments}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Lädt...' : 'Aktualisieren'}
            </button>
          </div>

          <div className="flex items-end">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!filterUnassigned}
                onChange={(e) => setFilterUnassigned(!e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Nur Buchungen mit Belegen
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Dokumenten-Liste */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Lade Belege...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600 text-lg">Keine Belege gefunden</p>
          <p className="text-gray-500 text-sm mt-2">
            {filterUnassigned ? 'Alle Buchungen haben Belege zugeordnet' : 'Laden Sie Belege hoch, um sie hier zu sehen'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              📄 {documents.length} Beleg(e) gefunden
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vorschau
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dateiname
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Buchung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Betrag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {isImage(doc.fileName) ? (
                        <div className="relative w-16 h-16">
                          <Image
                            src={doc.url}
                            alt={doc.fileName}
                            fill
                            className="object-cover rounded cursor-pointer hover:opacity-75"
                            onClick={() => setSelectedDocument(doc)}
                          />
                        </div>
                      ) : (
                        <div 
                          className="w-16 h-16 bg-red-100 rounded flex items-center justify-center cursor-pointer hover:bg-red-200"
                          onClick={() => setSelectedDocument(doc)}
                        >
                          <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {doc.fileName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getFileType(doc.fileName)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {doc.documentNumber ? (
                        <div>
                          <Link
                            href={`/admin/buchhaltung/journal?highlight=${doc.entryId}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            {doc.documentNumber}
                          </Link>
                          <div className="text-sm text-gray-500 mt-1">
                            {doc.description}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {doc.debitAccount} → {doc.creditAccount}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(doc.bookingDate)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(doc.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                          title="Öffnen"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                        <a
                          href={doc.url}
                          download
                          className="text-green-600 hover:text-green-800"
                          title="Herunterladen"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                        {doc.entryId && (
                          <button
                            onClick={() => handleRemoveDocument(doc.entryId!, doc.url)}
                            className="text-red-600 hover:text-red-800"
                            title="Von Buchung entfernen"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vorschau-Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">
                {selectedDocument.fileName}
              </h3>
              <button
                onClick={() => setSelectedDocument(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              {isImage(selectedDocument.fileName) ? (
                <div className="relative w-full" style={{ minHeight: '400px' }}>
                  <Image
                    src={selectedDocument.url}
                    alt={selectedDocument.fileName}
                    width={800}
                    height={600}
                    className="w-full h-auto rounded"
                  />
                </div>
              ) : (
                <iframe
                  src={selectedDocument.url}
                  className="w-full h-[600px] rounded border border-gray-300"
                  title={selectedDocument.fileName}
                />
              )}
              
              <div className="mt-4 flex gap-4">
                <a
                  href={selectedDocument.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  In neuem Tab öffnen
                </a>
                <a
                  href={selectedDocument.url}
                  download
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Herunterladen
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
