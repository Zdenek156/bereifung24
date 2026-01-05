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
  uploadedByRole: 'EMPLOYEE' | 'HR'
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
  const [activeTab, setActiveTab] = useState<'hr' | 'employee'>('hr')
  const [filterType, setFilterType] = useState<string>('all')
  
  // Upload form
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadData, setUploadData] = useState({
    type: 'certificate',
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
          type: 'certificate',
          title: '',
          description: '',
          category: '',
          file: null
        })
        setActiveTab('employee') // Switch to employee tab after upload
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
      proof: '✅',
      tax: '📊',
      social_security: '🏥',
      company: '🏢',
      other: '📎'
    }
    return icons[type] || '📎'
  }

  const uploadableTypes = [
    { value: 'certificate', label: 'Bescheinigung', icon: '🎓' },
    { value: 'proof', label: 'Nachweis', icon: '✅' },
    { value: 'other', label: 'Sonstige', icon: '📎' }
  ]

  const hrDocuments = documents.filter(doc => doc.uploadedByRole === 'HR')
  const employeeDocuments = documents.filter(doc => doc.uploadedByRole === 'EMPLOYEE')

  const currentDocuments = activeTab === 'hr' ? hrDocuments : employeeDocuments
  
  const filteredDocuments = filterType === 'all' 
    ? currentDocuments 
    : currentDocuments.filter(doc => doc.type === filterType)

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
                {documents.length} {documents.length === 1 ? 'Dokument' : 'Dokumente'} insgesamt
                • {hrDocuments.length} von HR • {employeeDocuments.length} von mir
              </p>
            </div>
            {activeTab === 'employee' && (
              <button
                onClick={() => setShowUploadForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                📤 Dokument hochladen
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('hr')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'hr'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">📥</span>
                  <div>
                    <div>Von HR erhalten</div>
                    <div className="text-sm font-normal text-gray-500">
                      {hrDocuments.length} {hrDocuments.length === 1 ? 'Dokument' : 'Dokumente'}
                    </div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('employee')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'employee'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">📤</span>
                  <div>
                    <div>Von mir hochgeladen</div>
                    <div className="text-sm font-normal text-gray-500">
                      {employeeDocuments.length} {employeeDocuments.length === 1 ? 'Dokument' : 'Dokumente'}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Statistics Cards - inside tab content */}
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {activeTab === 'hr' ? (
                <>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-1">📄</div>
                    <div className="text-sm text-gray-600">Verträge</div>
                    <div className="text-lg font-semibold">
                      {currentDocuments.filter(d => d.type === 'contract').length}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-1">💰</div>
                    <div className="text-sm text-gray-600">Gehaltsabrechnungen</div>
                    <div className="text-lg font-semibold">
                      {currentDocuments.filter(d => d.type === 'payslip').length}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-1">📊</div>
                    <div className="text-sm text-gray-600">Steuerdokumente</div>
                    <div className="text-lg font-semibold">
                      {currentDocuments.filter(d => d.type === 'tax').length}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-1">🏥</div>
                    <div className="text-sm text-gray-600">Sozialversicherung</div>
                    <div className="text-lg font-semibold">
                      {currentDocuments.filter(d => d.type === 'social_security').length}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-1">🎓</div>
                    <div className="text-sm text-gray-600">Bescheinigungen</div>
                    <div className="text-lg font-semibold">
                      {currentDocuments.filter(d => d.type === 'certificate').length}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-1">✅</div>
                    <div className="text-sm text-gray-600">Nachweise</div>
                    <div className="text-lg font-semibold">
                      {currentDocuments.filter(d => d.type === 'proof').length}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-1">📎</div>
                    <div className="text-sm text-gray-600">Sonstige</div>
                    <div className="text-lg font-semibold">
                      {currentDocuments.filter(d => d.type === 'other').length}
                    </div>
                  </div>
                </>
              )}
            </div>
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
                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">ℹ️</span>
                      <div className="text-sm text-blue-900">
                        <strong>Sie können hochladen:</strong> Bescheinigungen, Nachweise und sonstige Dokumente.
                        <br />
                        <strong>Hinweis:</strong> Verträge, Gehaltsabrechnungen und offizielle Dokumente werden von der Personalabteilung hochgeladen.
                      </div>
                    </div>
                  </div>

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
                      {uploadableTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
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
