'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AccountingSettings {
  id: string
  fiscalYearStart: number
  taxAdvisorName: string | null
  taxAdvisorEmail: string | null
  taxAdvisorPhone: string | null
  taxAdvisorCompany: string | null
  defaultVatRate: number
  reducedVatRate: number
  preferredExportFormat: 'DATEV' | 'EXCEL' | 'PDF'
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState<AccountingSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    fiscalYearStart: 1,
    taxAdvisorName: '',
    taxAdvisorEmail: '',
    taxAdvisorPhone: '',
    taxAdvisorCompany: '',
    defaultVatRate: 19,
    reducedVatRate: 7,
    preferredExportFormat: 'DATEV' as 'DATEV' | 'EXCEL' | 'PDF'
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
    if (session.user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
    // Load settings
    loadSettings()
  }, [session, status, router])

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/accounting/settings')
      if (!res.ok) throw new Error('Fehler beim Laden der Einstellungen')
      const data = await res.json()
      if (data.settings) {
        setSettings(data.settings)
        setFormData({
          fiscalYearStart: data.settings.fiscalYearStart,
          taxAdvisorName: data.settings.taxAdvisorName || '',
          taxAdvisorEmail: data.settings.taxAdvisorEmail || '',
          taxAdvisorPhone: data.settings.taxAdvisorPhone || '',
          taxAdvisorCompany: data.settings.taxAdvisorCompany || '',
          defaultVatRate: data.settings.defaultVatRate,
          reducedVatRate: data.settings.reducedVatRate,
          preferredExportFormat: data.settings.preferredExportFormat
        })
      }
    } catch (err) {
      console.error('Error loading settings:', err)
      setError('Einstellungen konnten nicht geladen werden')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const res = await fetch('/api/admin/accounting/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Fehler beim Speichern')
      }

      const data = await res.json()
      setSettings(data.settings)
      setSuccess('Einstellungen erfolgreich gespeichert!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || !session || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link 
          href="/admin/buchhaltung" 
          className="text-blue-600 hover:underline mb-2 inline-block"
        >
          ← Zurück zur Buchhaltung
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Buchhaltungs-Einstellungen</h1>
        <p className="text-gray-600 mt-2">
          Konfigurieren Sie USt-Sätze, Steuerberater-Daten und Export-Optionen
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fiscal Year Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Geschäftsjahr</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beginn (Monat)
            </label>
            <select
              value={formData.fiscalYearStart}
              onChange={(e) => setFormData({ ...formData, fiscalYearStart: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>
                  {new Date(2026, month - 1, 1).toLocaleDateString('de-DE', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Standard: Januar (Geschäftsjahr entspricht Kalenderjahr)
          </p>
        </div>

        {/* VAT Rates Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Umsatzsteuer-Sätze</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Regelsteuersatz (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.defaultVatRate}
                onChange={(e) => setFormData({ ...formData, defaultVatRate: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ermäßigter Satz (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.reducedVatRate}
                onChange={(e) => setFormData({ ...formData, reducedVatRate: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Standard in Deutschland: 19% (Regelsteuersatz) und 7% (ermäßigt)
          </p>
        </div>

        {/* Tax Advisor Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Steuerberater</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={formData.taxAdvisorName}
                onChange={(e) => setFormData({ ...formData, taxAdvisorName: e.target.value })}
                placeholder="z.B. Max Mustermann"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kanzlei / Firma
              </label>
              <input
                type="text"
                value={formData.taxAdvisorCompany}
                onChange={(e) => setFormData({ ...formData, taxAdvisorCompany: e.target.value })}
                placeholder="z.B. Steuerberatung Mustermann GmbH"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-Mail
                </label>
                <input
                  type="email"
                  value={formData.taxAdvisorEmail}
                  onChange={(e) => setFormData({ ...formData, taxAdvisorEmail: e.target.value })}
                  placeholder="steuerberater@beispiel.de"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.taxAdvisorPhone}
                  onChange={(e) => setFormData({ ...formData, taxAdvisorPhone: e.target.value })}
                  placeholder="+49 123 456789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Export Settings Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Export-Einstellungen</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Standard-Export-Format
            </label>
            <select
              value={formData.preferredExportFormat}
              onChange={(e) => setFormData({ ...formData, preferredExportFormat: e.target.value as 'DATEV' | 'EXCEL' | 'PDF' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="DATEV">DATEV (CSV)</option>
              <option value="EXCEL">Excel (XLSX)</option>
              <option value="PDF">PDF</option>
            </select>
            <p className="text-sm text-gray-500 mt-2">
              DATEV ist der Standard für die Übergabe an den Steuerberater
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {saving ? 'Speichere...' : 'Einstellungen speichern'}
          </button>
          <Link
            href="/admin/buchhaltung"
            className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 font-medium"
          >
            Abbrechen
          </Link>
        </div>
      </form>

      {/* Info Box */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">ℹ️ Hinweise</h3>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li>Diese Einstellungen werden für alle automatischen Buchungen und Exporte verwendet</li>
          <li>Die USt-Sätze können je nach Geschäftsvorfall individuell angepasst werden</li>
          <li>Steuerberater-Daten werden für Export-E-Mails verwendet</li>
          <li>Änderungen wirken sich nicht auf bereits erstellte Buchungen aus</li>
        </ul>
      </div>
    </div>
  )
}
