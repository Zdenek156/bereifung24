'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import BackButton from '@/components/BackButton'

interface Placeholder {
  key: string
  description: string
}

interface EmailTemplate {
  id: string
  key: string
  name: string
  description: string | null
  subject: string
  htmlContent: string
  placeholders: string
  isActive: boolean
}

export default function EditEmailTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const isNew = params?.id === 'new'
  
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    subject: '',
    htmlContent: '',
    placeholders: '[]',
    isActive: true
  })

  useEffect(() => {
    if (!isNew && params?.id) {
      fetchTemplate(params.id as string)
    }
  }, [params?.id, isNew])

  const fetchTemplate = async (id: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/email-templates/${id}`)
      
      if (!res.ok) {
        throw new Error('Failed to fetch template')
      }

      const data = await res.json()
      setFormData({
        key: data.key,
        name: data.name,
        description: data.description || '',
        subject: data.subject,
        htmlContent: data.htmlContent,
        placeholders: data.placeholders,
        isActive: data.isActive
      })
    } catch (err) {
      setError('Fehler beim Laden des Templates')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      setError('')

      const url = isNew 
        ? '/api/admin/email-templates'
        : `/api/admin/email-templates/${params?.id}`
      
      const method = isNew ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save template')
      }

      router.push('/admin/email-templates')
    } catch (err: any) {
      setError(err.message || 'Fehler beim Speichern')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const addPlaceholder = () => {
    try {
      const placeholders: Placeholder[] = JSON.parse(formData.placeholders)
      placeholders.push({ key: '', description: '' })
      setFormData({ ...formData, placeholders: JSON.stringify(placeholders, null, 2) })
    } catch (err) {
      console.error('Invalid JSON in placeholders')
    }
  }

  const removePlaceholder = (index: number) => {
    try {
      const placeholders: Placeholder[] = JSON.parse(formData.placeholders)
      placeholders.splice(index, 1)
      setFormData({ ...formData, placeholders: JSON.stringify(placeholders, null, 2) })
    } catch (err) {
      console.error('Invalid JSON in placeholders')
    }
  }

  const updatePlaceholder = (index: number, field: 'key' | 'description', value: string) => {
    try {
      const placeholders: Placeholder[] = JSON.parse(formData.placeholders)
      placeholders[index][field] = value
      setFormData({ ...formData, placeholders: JSON.stringify(placeholders, null, 2) })
    } catch (err) {
      console.error('Invalid JSON in placeholders')
    }
  }

  const getPreviewContent = () => {
    let preview = formData.htmlContent
    try {
      const placeholders: Placeholder[] = JSON.parse(formData.placeholders)
      placeholders.forEach(p => {
        if (p.key) {
          const regex = new RegExp(`{{${p.key}}}`, 'g')
          preview = preview.replace(regex, `<span style="background: yellow;">${p.description || p.key}</span>`)
        }
      })
    } catch (err) {
      console.error('Error generating preview')
    }
    return preview
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Lädt...</div>
      </div>
    )
  }

  let placeholdersArray: Placeholder[] = []
  try {
    placeholdersArray = JSON.parse(formData.placeholders)
  } catch (err) {
    placeholdersArray = []
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center mb-6">
        <div className="mr-4">
          <BackButton />
        </div>
        <h1 className="text-3xl font-bold">
          {isNew ? 'Neues Email Template' : 'Email Template bearbeiten'}
        </h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Grundinformationen</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Key *
              </label>
              <input
                type="text"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="BOOKING_CONFIRMATION_CUSTOMER"
                required
                disabled={!isNew}
              />
              <p className="text-xs text-gray-500 mt-1">
                Eindeutiger Schlüssel (nur Großbuchstaben, Zahlen und Unterstriche). Kann nach Erstellung nicht geändert werden.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="Terminbestätigung - Kunde"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beschreibung
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                rows={2}
                placeholder="Wofür wird dieses Template verwendet?"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Template aktiv
              </label>
            </div>
          </div>
        </div>

        {/* Email Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Email Inhalt</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Betreff *
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="Terminbestätigung - {{workshopName}}"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                HTML Inhalt *
              </label>
              <textarea
                value={formData.htmlContent}
                onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm"
                rows={15}
                placeholder="<html>...</html>"
                required
              />
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                {showPreview ? 'Vorschau ausblenden' : 'Vorschau anzeigen'}
              </button>
            </div>

            {showPreview && (
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-2">Vorschau:</h3>
                <div 
                  className="bg-white p-4 border rounded"
                  dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Placeholders */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Platzhalter</h2>
            <button
              type="button"
              onClick={addPlaceholder}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
            >
              + Platzhalter hinzufügen
            </button>
          </div>

          <div className="space-y-3">
            {placeholdersArray.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Keine Platzhalter definiert. Fügen Sie Platzhalter hinzu, um diese in Subject und HTML zu verwenden.
              </p>
            ) : (
              placeholdersArray.map((placeholder, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={placeholder.key}
                      onChange={(e) => updatePlaceholder(index, 'key', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="customerName"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={placeholder.description}
                      onChange={(e) => updatePlaceholder(index, 'description', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="Name des Kunden"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removePlaceholder(index)}
                    className="text-red-600 hover:text-red-800 px-3 py-2"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm text-blue-800">
              <strong>Verwendung:</strong> Platzhalter im Format <code className="bg-blue-100 px-1 rounded">{'{{key}}'}</code> werden beim Versenden durch echte Werte ersetzt.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href="/admin/email-templates"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Abbrechen
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Speichert...' : isNew ? 'Template erstellen' : 'Änderungen speichern'}
          </button>
        </div>
      </form>
    </div>
  )
}
