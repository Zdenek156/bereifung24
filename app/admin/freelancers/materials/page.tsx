'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Material {
  id: string
  title: string
  description: string | null
  category: string
  fileUrl: string
  fileName: string
  fileSize: number | null
  version: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count: { downloads: number }
}

const categories = [
  { value: 'PRESENTATION', label: '📊 Präsentation' },
  { value: 'ONE_PAGER', label: '📄 One-Pager' },
  { value: 'BROCHURE', label: '📕 Broschüre' },
  { value: 'EMAIL_TEMPLATE', label: '📧 E-Mail-Vorlage' },
  { value: 'FAQ', label: '❓ FAQ' },
  { value: 'CONTRACT', label: '📝 Vertrag' },
  { value: 'OTHER', label: '📁 Sonstiges' },
]

const categoryLabels: Record<string, string> = Object.fromEntries(categories.map(c => [c.value, c.label]))

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '–'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FreelancerMaterialsPage() {
  const router = useRouter()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [editMaterial, setEditMaterial] = useState<Material | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('PRESENTATION')
  const [version, setVersion] = useState('1.0')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const fetchMaterials = async () => {
    try {
      const res = await fetch('/api/admin/freelancers/materials')
      if (res.ok) {
        const data = await res.json()
        setMaterials(data.materials)
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMaterials() }, [])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setCategory('PRESENTATION')
    setVersion('1.0')
    setSelectedFile(null)
    setEditMaterial(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const openUploadDialog = () => {
    resetForm()
    setShowUploadDialog(true)
  }

  const openEditDialog = (m: Material) => {
    setEditMaterial(m)
    setTitle(m.title)
    setDescription(m.description || '')
    setCategory(m.category)
    setVersion(m.version)
    setSelectedFile(null)
    setShowUploadDialog(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      formData.append('category', category)
      formData.append('version', version)
      if (selectedFile) formData.append('file', selectedFile)

      let res: Response
      if (editMaterial) {
        res = await fetch(`/api/admin/freelancers/materials/${editMaterial.id}`, {
          method: 'PUT',
          body: formData,
        })
      } else {
        if (!selectedFile) {
          setError('Bitte eine Datei auswählen')
          setUploading(false)
          return
        }
        res = await fetch('/api/admin/freelancers/materials', {
          method: 'POST',
          body: formData,
        })
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Fehler beim Speichern')
      }

      setSuccess(editMaterial ? 'Material aktualisiert!' : 'Material hochgeladen!')
      setShowUploadDialog(false)
      resetForm()
      fetchMaterials()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" wirklich löschen? Freelancer können diese Datei dann nicht mehr herunterladen.`)) return

    try {
      const res = await fetch(`/api/admin/freelancers/materials/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSuccess('Material gelöscht!')
        fetchMaterials()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch {}
  }

  const toggleActive = async (m: Material) => {
    const formData = new FormData()
    formData.append('isActive', (!m.isActive).toString())
    await fetch(`/api/admin/freelancers/materials/${m.id}`, { method: 'PUT', body: formData })
    fetchMaterials()
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => router.push('/mitarbeiter/freelancers')} className="text-sm text-blue-600 hover:underline mb-2 block">
            ← Zurück zu Freelancers
          </button>
          <h1 className="text-2xl font-bold text-gray-900">📁 Vertriebsmaterialien</h1>
          <p className="text-gray-600 mt-1">
            Materialien die Freelancer herunterladen können ({materials.length} gesamt)
          </p>
        </div>
        <button
          onClick={openUploadDialog}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Material hochladen
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">{success}</div>
      )}
      {error && !showUploadDialog && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>
      )}

      {/* Materials Table */}
      {materials.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">Noch keine Materialien vorhanden.</p>
          <button
            onClick={openUploadDialog}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Erstes Material hochladen
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titel</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategorie</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datei</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Version</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Downloads</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {materials.map(m => (
                <tr key={m.id} className={`hover:bg-gray-50 ${!m.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{m.title}</p>
                    {m.description && <p className="text-sm text-gray-500 truncate max-w-xs">{m.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm">{categoryLabels[m.category] || m.category}</td>
                  <td className="px-4 py-3">
                    <a href={m.fileUrl} target="_blank" rel="noopener" className="text-sm text-blue-600 hover:underline">
                      {m.fileName}
                    </a>
                    <p className="text-xs text-gray-400">{formatFileSize(m.fileSize)}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-sm">{m.version}</td>
                  <td className="px-4 py-3 text-center text-sm font-medium">{m._count.downloads}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(m)}
                      className={`text-xs px-2 py-1 rounded-full font-medium ${m.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {m.isActive ? '✅ Aktiv' : '❌ Inaktiv'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEditDialog(m)} className="text-sm text-blue-600 hover:underline">
                        Bearbeiten
                      </button>
                      <button onClick={() => handleDelete(m.id, m.title)} className="text-sm text-red-600 hover:underline">
                        Löschen
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload/Edit Dialog */}
      {showUploadDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editMaterial ? '📝 Material bearbeiten' : '📤 Neues Material hochladen'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="z.B. B24 Vertriebspräsentation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Kurze Beschreibung des Materials"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {categories.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                  <input
                    type="text"
                    value={version}
                    onChange={e => setVersion(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1.0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Datei {editMaterial ? '(optional — neue Version)' : '*'}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                    accept=".pdf,.pptx,.docx,.xlsx,.png,.jpg,.jpeg,.zip"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    {selectedFile ? selectedFile.name : 'Datei auswählen'}
                  </button>
                  <p className="text-xs text-gray-400 mt-1">PDF, PPTX, DOCX, XLSX, Bilder, ZIP — max. 20 MB</p>
                  {editMaterial && !selectedFile && (
                    <p className="text-xs text-gray-500 mt-1">Aktuelle Datei: {editMaterial.fileName}</p>
                  )}
                </div>
              </div>

              {error && showUploadDialog && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowUploadDialog(false); resetForm(); setError('') }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? 'Wird hochgeladen...' : editMaterial ? 'Speichern' : 'Hochladen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
