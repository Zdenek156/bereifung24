'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Document {
  id: string
  type: string
  title: string
  description?: string
  fileName: string
  fileSize: number
  mimeType: string
  category?: string
  tags: string[]
  uploadedAt: string
  uploadedBy: {
    firstName: string
    lastName: string
  }
  validFrom?: string
  validUntil?: string
}

export default function DokumentePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  
  // Upload form
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadData, setUploadData] = useState({
    type: 'other',
    title: '',
    description: '',
    category: '',
    file: null as File | null
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user) {
      fetchDocuments()
    }
  }, [status, session, router])

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/employee/documents')
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadData({ ...uploadData, file: e.target.files[0] })
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadData.file) {
      alert('Bitte wählen Sie eine Datei aus')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadData.file)
      formData.append('type', uploadData.type)
      formData.append('title', uploadData.title)
      formData.append('description', uploadData.description)
      formData.append('category', uploadData.category)

      const res = await fetch('/api/employee/documents', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        alert('Dokument erfolgreich hochgeladen!')
        setShowUploadForm(false)
        setUploadData({
          type: 'other',
          title: '',
          description: '',
          category: '',
          file: null
        })
        fetchDocuments()
      } else {
        const error = await res.json()
        alert('Fehler beim Hochladen: ' + error.error)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Fehler beim Hochladen')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (docId: string, fileName: string) => {
    try {
      const res = await fetch(`/api/employee/documents/${docId}/download`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Fehler beim Herunterladen')
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('Fehler beim Herunterladen')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getDocumentIcon = (type: string) => {
    const icons: Record<string, string> = {
      contract: '📄',
      payslip: '💰',
      certificate: '🎓',
      tax: '📊',
      social_security: '🏥',
      other: '📎'
    }
    return icons[type] || '📎'
  }

  const documentTypes = [
    { value: 'all', label: 'Alle Dokumente' },
    { value: 'contract', label: 'Verträge' },
    { value: 'payslip', label: 'Gehaltsabrechnungen' },
    { value: 'certificate', label: 'Bescheinigungen' },
    { value: 'tax', label: 'Steuerdokumente' },
    { value: 'social_security', label: 'Sozialversicherung' },
    { value: 'other', label: 'Sonstige' }
  ]

  const filteredDocuments = filterType === 'all' 
    ? documents 
    : documents.filter(doc => doc.type === filterType)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Lade Dokumente...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/mitarbeiter"
                className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
              >
                ← Zurück zum Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Meine Dokumente</h1>
              <p className="text-sm text-gray-600 mt-1">
                {documents.length} {documents.length === 1 ? 'Dokument' : 'Dokumente'}
              </p>
            </div>
            <button
              onClick={() => setShowUploadForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              📤 Dokument hochladen
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex flex-wrap gap-2">
            {documentTypes.map(type => (
              <button
                key={type.value}
                onClick={() => setFilterType(type.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === type.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Upload Form Modal */}
        {showUploadForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Dokument hochladen</h2>
                  <button
                    onClick={() => setShowUploadForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleUpload} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dokumententyp *
                    </label>
                    <select
                      value={uploadData.type}
                      onChange={(e) => setUploadData({ ...uploadData, type: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="contract">Vertrag</option>
                      <option value="payslip">Gehaltsabrechnung</option>
                      <option value="certificate">Bescheinigung</option>
                      <option value="tax">Steuerdokument</option>
                      <option value="social_security">Sozialversicherung</option>
                      <option value="other">Sonstige</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Titel *
                    </label>
                    <input
                      type="text"
                      value={uploadData.title}
                      onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="z.B. Arbeitsvertrag 2026"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Beschreibung
                    </label>
                    <textarea
                      value={uploadData.description}
                      onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Optional: Zusätzliche Informationen"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kategorie
                    </label>
                    <input
                      type="text"
                      value={uploadData.category}
                      onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="z.B. Personal, Finanzen"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Datei *
                    </label>
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Erlaubt: PDF, Word, Bilder (max. 10MB)
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={uploading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {uploading ? 'Wird hochgeladen...' : '📤 Hochladen'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUploadForm(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Abbrechen
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Documents Grid */}
        {filteredDocuments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📂</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Keine Dokumente vorhanden
            </h3>
            <p className="text-gray-600 mb-4">
              {filterType === 'all' 
                ? 'Laden Sie Ihr erstes Dokument hoch'
                : 'Keine Dokumente in dieser Kategorie'}
            </p>
            {filterType === 'all' && (
              <button
                onClick={() => setShowUploadForm(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                📤 Erstes Dokument hochladen
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{getDocumentIcon(doc.type)}</div>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {formatFileSize(doc.fileSize)}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {doc.title}
                  </h3>
                  
                  {doc.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {doc.description}
                    </p>
                  )}

                  <div className="text-xs text-gray-500 space-y-1 mb-4">
                    <div>📅 {new Date(doc.uploadedAt).toLocaleDateString('de-DE')}</div>
                    <div>👤 {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}</div>
                    {doc.category && <div>🏷️ {doc.category}</div>}
                  </div>

                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {doc.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => handleDownload(doc.id, doc.fileName)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    📥 Herunterladen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
