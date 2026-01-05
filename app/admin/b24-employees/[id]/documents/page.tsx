'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Document {
  id: string
  type: string
  title: string
  description?: string
  fileName: string
  fileSize: number
  mimeType: string
  uploadedAt: string
  uploadedByRole: 'EMPLOYEE' | 'HR'
  uploadedBy: {
    firstName: string
    lastName: string
  }
}

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  position?: string
}

export default function EmployeeDocumentsPage() {
  const params = useParams()
  const router = useRouter()
  const employeeId = params.id as string

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<'hr' | 'employee'>('hr')
  
  // Upload form
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadData, setUploadData] = useState({
    type: 'contract',
    title: '',
    description: '',
    category: '',
    file: null as File | null
  })

  useEffect(() => {
    fetchEmployee()
    fetchDocuments()
  }, [employeeId])

  const fetchEmployee = async () => {
    try {
      const res = await fetch(`/api/admin/b24-employees/${employeeId}`)
      if (res.ok) {
        const data = await res.json()
        setEmployee(data.employee)
      }
    } catch (error) {
      console.error('Error fetching employee:', error)
    }
  }

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/admin/employee-documents?employeeId=${employeeId}`)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.all || [])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const hrDocumentTypes = [
    { value: 'contract', label: 'Arbeitsvertrag', icon: '📄' },
    { value: 'payslip', label: 'Gehaltsabrechnung', icon: '💰' },
    { value: 'tax', label: 'Steuerdokument', icon: '📊' },
    { value: 'social_security', label: 'Sozialversicherung', icon: '🏥' },
    { value: 'company', label: 'Firmendokument', icon: '🏢' }
  ]

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
      formData.append('employeeId', employeeId)

      const res = await fetch('/api/admin/employee-documents', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        alert('Dokument erfolgreich hochgeladen!')
        setShowUploadForm(false)
        setUploadData({
          type: 'contract',
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

  const hrDocuments = documents.filter(doc => doc.uploadedByRole === 'HR')
  const employeeDocuments = documents.filter(doc => doc.uploadedByRole === 'EMPLOYEE')
  const currentDocuments = activeTab === 'hr' ? hrDocuments : employeeDocuments

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
                href={`/admin/b24-employees/${employeeId}`}
                className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
              >
                ← Zurück zu Mitarbeiter-Details
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Dokumente: {employee?.firstName} {employee?.lastName}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {employee?.position} • {employee?.email}
              </p>
            </div>
            <button
              onClick={() => setShowUploadForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              📤 Dokument hochladen (HR)
            </button>
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
                  <span className="text-2xl">🏢</span>
                  <div>
                    <div>Von HR hochgeladen</div>
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
                  <span className="text-2xl">👤</span>
                  <div>
                    <div>Vom Mitarbeiter hochgeladen</div>
                    <div className="text-sm font-normal text-gray-500">
                      {employeeDocuments.length} {employeeDocuments.length === 1 ? 'Dokument' : 'Dokumente'}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-1">🏢</div>
                    <div className="text-sm text-gray-600">Firmendokumente</div>
                    <div className="text-lg font-semibold">
                      {currentDocuments.filter(d => d.type === 'company').length}
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
                  <h2 className="text-xl font-bold text-gray-900">Dokument hochladen (HR)</h2>
                  <button
                    onClick={() => setShowUploadForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">ℹ️</span>
                      <div className="text-sm text-blue-900">
                        <strong>Als HR können Sie hochladen:</strong> Arbeitsverträge, Gehaltsabrechnungen, Steuerdokumente, Sozialversicherungsunterlagen und Firmendokumente.
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
                      {hrDocumentTypes.map(type => (
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
                      placeholder="z.B. Personal, Finanzen, Arbeitsrecht"
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
        {currentDocuments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📂</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Keine Dokumente vorhanden
            </h3>
            <p className="text-gray-600 mb-4">
              {activeTab === 'hr' 
                ? 'Noch keine HR-Dokumente für diesen Mitarbeiter hochgeladen'
                : 'Mitarbeiter hat noch keine Dokumente hochgeladen'}
            </p>
            {activeTab === 'hr' && (
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
            {currentDocuments.map((doc) => (
              <div key={doc.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{getDocumentIcon(doc.type)}</div>
                    <div className="text-right">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded block mb-1">
                        {formatFileSize(doc.fileSize)}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded block ${
                        doc.uploadedByRole === 'HR' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {doc.uploadedByRole === 'HR' ? '🏢 HR' : '👤 MA'}
                      </span>
                    </div>
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
                    <div>👤 Hochgeladen von: {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}</div>
                  </div>

                  <button
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
