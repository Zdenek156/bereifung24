'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface EmailTemplate {
  id: string
  key: string
  name: string
  description: string | null
  subject: string
  htmlContent: string
  placeholders: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function EmailTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/email-templates')
      
      if (!res.ok) {
        throw new Error('Failed to fetch templates')
      }

      const data = await res.json()
      setTemplates(data)
    } catch (err) {
      setError('Fehler beim Laden der Templates')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/email-templates/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        throw new Error('Failed to delete template')
      }

      // Refresh list
      await fetchTemplates()
      setDeleteConfirm(null)
    } catch (err) {
      alert('Fehler beim Löschen des Templates')
      console.error(err)
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/email-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (!res.ok) {
        throw new Error('Failed to update template')
      }

      // Refresh list
      await fetchTemplates()
    } catch (err) {
      alert('Fehler beim Aktualisieren des Templates')
      console.error(err)
    }
  }

  const handleExport = () => {
    // Erstelle JSON-Datei mit allen Templates
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      templates: templates.map(t => ({
        key: t.key,
        name: t.name,
        description: t.description,
        subject: t.subject,
        htmlContent: t.htmlContent,
        placeholders: t.placeholders,
        isActive: t.isActive
      }))
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `email-templates-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setImporting(true)
      const text = await file.text()
      const importData = JSON.parse(text)

      if (!importData.templates || !Array.isArray(importData.templates)) {
        throw new Error('Ungültiges Backup-Format')
      }

      // Importiere jedes Template
      let successCount = 0
      let errorCount = 0

      for (const template of importData.templates) {
        try {
          const res = await fetch('/api/admin/email-templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(template)
          })

          if (res.ok) {
            successCount++
          } else {
            errorCount++
            console.error(`Fehler beim Import von ${template.key}:`, await res.text())
          }
        } catch (err) {
          errorCount++
          console.error(`Fehler beim Import von ${template.key}:`, err)
        }
      }

      alert(`Import abgeschlossen!\n✅ Erfolgreich: ${successCount}\n❌ Fehler: ${errorCount}`)
      
      // Refresh list
      await fetchTemplates()
    } catch (err) {
      alert('Fehler beim Importieren der Templates: ' + (err as Error).message)
      console.error(err)
    } finally {
      setImporting(false)
      // Reset file input
      event.target.value = ''
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Lädt...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Email Templates</h1>
        <div className="flex gap-3">
          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={templates.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportieren
          </button>

          {/* Import Button */}
          <label className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors cursor-pointer flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {importing ? 'Importiere...' : 'Importieren'}
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={importing}
              className="hidden"
            />
          </label>

          {/* New Template Button */}
          <Link
            href="/admin/email-templates/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Neues Template
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                Name
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                Key
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-56">
                Betreff
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Status
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Aktualisiert
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {templates.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Keine Templates vorhanden
                </td>
              </tr>
            ) : (
              templates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-[180px]" title={template.name}>
                      {template.name}
                    </div>
                    {template.description && (
                      <div className="text-xs text-gray-500 truncate max-w-[180px]" title={template.description}>
                        {template.description}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded block truncate max-w-[140px]" title={template.key}>
                      {template.key}
                    </code>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm text-gray-900 truncate max-w-[200px]" title={template.subject}>
                      {template.subject}
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(template.id, template.isActive)}
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        template.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {template.isActive ? 'Aktiv' : 'Inaktiv'}
                    </button>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500">
                    {new Date(template.updatedAt).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/admin/email-templates/${template.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Bearbeiten
                    </Link>
                    {deleteConfirm === template.id ? (
                      <>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="text-red-600 hover:text-red-900 mr-2"
                        >
                          Bestätigen
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Abbrechen
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(template.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Löschen
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Hinweise zu Platzhaltern</h3>
        <p className="text-sm text-blue-800">
          In Templates können Sie Platzhalter verwenden: <code className="bg-blue-100 px-1 rounded">{'{{variableName}}'}</code>
        </p>
        <p className="text-sm text-blue-800 mt-1">
          Beispiele: <code className="bg-blue-100 px-1 rounded">{'{{customerName}}'}</code>, 
          <code className="bg-blue-100 px-1 ml-1 rounded">{'{{workshopName}}'}</code>, 
          <code className="bg-blue-100 px-1 ml-1 rounded">{'{{appointmentDate}}'}</code>
        </p>
      </div>

      <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-2">💾 Backup-Funktionen</h3>
        <p className="text-sm text-green-800">
          <strong>Exportieren:</strong> Lädt alle Templates als JSON-Datei herunter (Backup)
        </p>
        <p className="text-sm text-green-800 mt-1">
          <strong>Importieren:</strong> Stellt Templates aus einer Backup-Datei wieder her
        </p>
      </div>
    </div>
  )
}
