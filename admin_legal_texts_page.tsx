'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Save, FileText, Shield, Scale, Eye, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface LegalText {
  id: string
  key: string
  title: string
  content: string
  version: number
  updatedAt: string
}

const LEGAL_KEYS = [
  { key: 'agb', label: 'AGB', icon: Scale, description: 'Allgemeine Geschäftsbedingungen' },
  { key: 'impressum', label: 'Impressum', icon: FileText, description: 'Angaben gemäß § 5 TMG' },
  { key: 'datenschutz', label: 'Datenschutz', icon: Shield, description: 'Datenschutzerklärung' },
]

export default function LegalTextsPage() {
  const [texts, setTexts] = useState<LegalText[]>([])
  const [activeKey, setActiveKey] = useState<string>('agb')
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [preview, setPreview] = useState(false)

  const loadTexts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/legal-texts')
      if (res.ok) {
        const data = await res.json()
        setTexts(data)
        const active = data.find((t: LegalText) => t.key === activeKey)
        if (active) {
          setEditTitle(active.title)
          setEditContent(active.content)
        }
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Fehler beim Laden der Texte' })
    } finally {
      setLoading(false)
    }
  }, [activeKey])

  useEffect(() => {
    loadTexts()
  }, [loadTexts])

  const selectKey = (key: string) => {
    setActiveKey(key)
    setPreview(false)
    const text = texts.find(t => t.key === key)
    if (text) {
      setEditTitle(text.title)
      setEditContent(text.content)
    } else {
      const config = LEGAL_KEYS.find(k => k.key === key)
      setEditTitle(config?.description || '')
      setEditContent('')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/legal-texts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: activeKey,
          title: editTitle,
          content: editContent,
        }),
      })

      if (res.ok) {
        const updated = await res.json()
        setTexts(prev => {
          const idx = prev.findIndex(t => t.key === activeKey)
          if (idx >= 0) {
            const next = [...prev]
            next[idx] = updated
            return next
          }
          return [...prev, updated]
        })
        setMessage({ type: 'success', text: `${LEGAL_KEYS.find(k => k.key === activeKey)?.label} erfolgreich gespeichert (Version ${updated.version})` })
      } else {
        setMessage({ type: 'error', text: 'Fehler beim Speichern' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Netzwerkfehler beim Speichern' })
    } finally {
      setSaving(false)
    }
  }

  const activeText = texts.find(t => t.key === activeKey)
  const activeConfig = LEGAL_KEYS.find(k => k.key === activeKey)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft className="w-4 h-4" /> Zurück zum Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Rechtliche Texte</h1>
        <p className="mt-1 text-gray-600">AGB, Impressum und Datenschutz verwalten — wird auf der Webseite und in der App angezeigt.</p>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar - Document selector */}
        <div className="space-y-2">
          {LEGAL_KEYS.map(({ key, label, icon: Icon, description }) => {
            const text = texts.find(t => t.key === key)
            const isActive = activeKey === key
            return (
              <button
                key={key}
                onClick={() => selectKey(key)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  isActive
                    ? 'border-primary-500 bg-primary-50 shadow-sm ring-1 ring-primary-200'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-primary-100' : 'bg-gray-100'}`}>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <p className={`font-semibold ${isActive ? 'text-primary-700' : 'text-gray-900'}`}>{label}</p>
                    <p className="text-xs text-gray-500">{description}</p>
                    {text && (
                      <p className="text-xs text-gray-400 mt-1">
                        Version {text.version} · {new Date(text.updatedAt).toLocaleDateString('de-DE')}
                      </p>
                    )}
                    {!text && (
                      <p className="text-xs text-orange-500 mt-1">⚠ Noch nicht angelegt</p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Editor */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {activeConfig && <activeConfig.icon className="w-5 h-5 text-primary-600" />}
                {activeConfig?.label} bearbeiten
              </h2>
              {activeText && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Letzte Änderung: {new Date(activeText.updatedAt).toLocaleString('de-DE')} · Version {activeText.version}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreview(!preview)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  preview ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Eye className="w-4 h-4" />
                Vorschau
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editContent.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Speichere...' : 'Speichern'}
              </button>
            </div>
          </div>

          <div className="p-4 border-b border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="z.B. Allgemeine Geschäftsbedingungen"
            />
          </div>

          {preview ? (
            <div className="p-6">
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: editContent }} />
            </div>
          ) : (
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inhalt (HTML)
                <span className="text-xs text-gray-400 ml-2">Unterstützt HTML-Tags wie &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;strong&gt; etc.</span>
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={30}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-y"
                placeholder="HTML-Inhalt hier eingeben..."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
