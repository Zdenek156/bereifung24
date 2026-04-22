'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, CheckCircle, XCircle, Mail, Inbox, Eye, EyeOff, Trash2 } from 'lucide-react'

interface Field {
  key: string
  label: string
  group: 'smtp' | 'imap'
  placeholder: string
  sensitive: boolean
  value: string
  isSet: boolean
}

interface TestResult {
  ok: boolean
  detail?: string
  error?: string
}

export default function OutreachSettingsPage() {
  const [fields, setFields] = useState<Field[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [showPw, setShowPw] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [testing, setTesting] = useState<'smtp' | 'imap' | 'both' | null>(null)
  const [testResult, setTestResult] = useState<{ smtp?: TestResult; imap?: TestResult } | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/admin/sales/outreach-settings')
      if (!r.ok) throw new Error(`Status ${r.status}`)
      const data = await r.json()
      setFields(data.fields || [])
      const init: Record<string, string> = {}
      for (const f of data.fields || []) init[f.key] = f.value || ''
      setValues(init)
    } catch (e: any) {
      setError(`Laden fehlgeschlagen: ${e?.message || e}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setTestResult(null)
    try {
      const r = await fetch('/api/admin/sales/outreach-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || `Status ${r.status}`)
      setSavedAt(Date.now())
      // Sensitive Felder zurücksetzen, aber neu laden um isSet zu aktualisieren
      await load()
    } catch (e: any) {
      setError(`Speichern fehlgeschlagen: ${e?.message || e}`)
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async (which: 'smtp' | 'imap' | 'both') => {
    setTesting(which)
    setTestResult(null)
    try {
      const r = await fetch('/api/admin/sales/outreach-settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ which }),
      })
      const data = await r.json()
      setTestResult({ smtp: data.smtp, imap: data.imap })
    } catch (e: any) {
      setError(`Test fehlgeschlagen: ${e?.message || e}`)
    } finally {
      setTesting(null)
    }
  }

  const handleClear = (key: string) => {
    if (!confirm(`Wert für "${key}" wirklich löschen?`)) return
    setValues({ ...values, [key]: '__CLEAR__' })
  }

  const smtpFields = fields.filter((f) => f.group === 'smtp')
  const imapFields = fields.filter((f) => f.group === 'imap')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/admin/sales"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" /> Zurück
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Outreach-Einstellungen</h1>
            <p className="text-sm text-gray-600">Konfiguration der Partner-Mailbox (SMTP + IMAP) für KI-Outreach</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
            {error}
          </div>
        )}
        {savedAt && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> Gespeichert um {new Date(savedAt).toLocaleTimeString('de-DE')}
          </div>
        )}

        {/* SMTP */}
        <SectionCard
          icon={<Mail className="h-5 w-5 text-blue-600" />}
          title="SMTP – Ausgehende Emails"
          description="Konto, von dem Outreach-Emails an Prospects versendet werden."
        >
          <FieldGrid
            fields={smtpFields}
            values={values}
            setValues={setValues}
            showPw={showPw}
            setShowPw={setShowPw}
            onClear={handleClear}
          />
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => handleTest('smtp')}
              disabled={testing !== null}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {testing === 'smtp' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              SMTP testen
            </button>
            {testResult?.smtp && <ResultBadge r={testResult.smtp} />}
          </div>
        </SectionCard>

        {/* IMAP */}
        <SectionCard
          icon={<Inbox className="h-5 w-5 text-purple-600" />}
          title="IMAP – Eingehende Replies"
          description="Postfach, das per Cronjob auf Antworten der Werkstätten gepollt wird."
        >
          <FieldGrid
            fields={imapFields}
            values={values}
            setValues={setValues}
            showPw={showPw}
            setShowPw={setShowPw}
            onClear={handleClear}
          />
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => handleTest('imap')}
              disabled={testing !== null}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {testing === 'imap' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              IMAP testen
            </button>
            {testResult?.imap && <ResultBadge r={testResult.imap} />}
          </div>
        </SectionCard>

        {/* Action bar */}
        <div className="sticky bottom-4 bg-white border border-gray-200 rounded-lg shadow-md px-4 py-3 flex items-center justify-between">
          <div className="text-xs text-gray-600">
            Passwörter werden verschlüsselt gespeichert. Leeres Passwort-Feld = vorhandener Wert bleibt unverändert.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTest('both')}
              disabled={testing !== null || saving}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {testing === 'both' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Beide testen
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Speichere…' : 'Speichern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionCard({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      {children}
    </div>
  )
}

function FieldGrid({
  fields, values, setValues, showPw, setShowPw, onClear,
}: {
  fields: Field[]
  values: Record<string, string>
  setValues: (v: Record<string, string>) => void
  showPw: Record<string, boolean>
  setShowPw: (v: Record<string, boolean>) => void
  onClear: (key: string) => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {fields.map((f) => {
        const isPw = f.sensitive
        const isVisible = showPw[f.key]
        const currentValue = values[f.key] ?? ''
        const isClearMarker = currentValue === '__CLEAR__'

        return (
          <div key={f.key}>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {f.label}
              {f.isSet && isPw && !isClearMarker && (
                <span className="ml-1 text-green-600">● gesetzt</span>
              )}
              {isClearMarker && <span className="ml-1 text-red-600">● wird gelöscht</span>}
            </label>
            <div className="relative">
              <input
                type={isPw && !isVisible ? 'password' : 'text'}
                value={isClearMarker ? '' : currentValue}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                placeholder={isPw && f.isSet ? '•••••••• (leer lassen = unverändert)' : f.placeholder}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 pr-16"
                autoComplete="off"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-1 gap-0.5">
                {isPw && (
                  <button
                    type="button"
                    onClick={() => setShowPw({ ...showPw, [f.key]: !isVisible })}
                    className="p-1 text-gray-400 hover:text-gray-700"
                    title={isVisible ? 'Verbergen' : 'Anzeigen'}
                  >
                    {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                )}
                {f.isSet && (
                  <button
                    type="button"
                    onClick={() => onClear(f.key)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Wert löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ResultBadge({ r }: { r: TestResult }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded ${r.ok ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}
    >
      {r.ok ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {r.ok ? r.detail || 'OK' : r.error || 'Fehler'}
    </div>
  )
}
