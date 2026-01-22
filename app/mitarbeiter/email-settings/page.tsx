'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Mail, Lock, Server, Loader2 } from 'lucide-react'

interface EmailSettings {
  id?: string
  imapHost: string
  imapPort: number
  imapUser: string
  imapPassword?: string
  imapTls: boolean
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPassword?: string
  smtpSecure: boolean
  syncEnabled: boolean
  syncInterval: number
}

export default function EmailSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [hasExistingSettings, setHasExistingSettings] = useState(false)

  const [formData, setFormData] = useState<EmailSettings>({
    imapHost: '',
    imapPort: 993,
    imapUser: '',
    imapPassword: '',
    imapTls: true,
    smtpHost: '',
    smtpPort: 465,
    smtpUser: '',
    smtpPassword: '',
    smtpSecure: true,
    syncEnabled: true,
    syncInterval: 300000, // 5 Minuten
  })

  const [useCommonServer, setUseCommonServer] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchSettings()
    }
  }, [session])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/email/settings', {
        cache: 'no-store'
      })
      
      if (res.ok) {
        const data = await res.json()
        
        if (data.settings) {
          setHasExistingSettings(true)
          setFormData({
            ...data.settings,
            imapPassword: '', // Passwort nicht vorausfüllen
            smtpPassword: '',
          })
          
          // Prüfen ob separate IMAP/SMTP Server
          if (data.settings.imapHost !== data.settings.smtpHost) {
            setUseCommonServer(false)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Validierung
      if (!formData.imapHost || !formData.imapUser || !formData.imapPassword) {
        alert('Bitte füllen Sie alle erforderlichen Felder aus')
        setSaving(false)
        return
      }

      // Bei gemeinsamer Konfiguration SMTP Werte setzen
      const submitData = useCommonServer
        ? {
            ...formData,
            smtpHost: formData.imapHost.replace('imap.', 'smtp.'),
            smtpUser: formData.imapUser,
            smtpPassword: formData.imapPassword,
          }
        : formData

      const res = await fetch('/api/email/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Fehler beim Speichern')
      }

      alert('✅ E-Mail-Einstellungen erfolgreich gespeichert!')
      
      // Zur E-Mail-Seite weiterleiten
      router.push('/mitarbeiter/email')
    } catch (error: any) {
      console.error('Error saving settings:', error)
      alert(`❌ Fehler: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async () => {
    setTestingConnection(true)
    try {
      // Hier könnte man einen Test-API-Endpunkt aufrufen
      alert('Verbindungstest wird implementiert...')
    } catch (error) {
      console.error('Connection test failed:', error)
    } finally {
      setTestingConnection(false)
    }
  }

  const handleInputChange = (field: keyof EmailSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Lade Einstellungen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/mitarbeiter/email"
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">E-Mail-Einstellungen</h1>
              <p className="text-gray-600 mt-1">
                Konfigurieren Sie Ihr persönliches E-Mail-Postfach
              </p>
            </div>
          </div>
        </div>

        {/* Hinweis für neue Einrichtung */}
        {!hasExistingSettings && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  Erstmalige Einrichtung
                </h3>
                <p className="text-sm text-blue-800">
                  Sie müssen Ihre E-Mail-Zugangsdaten eingeben, bevor Sie E-Mails abrufen können.
                  Wenden Sie sich an Ihren Administrator, wenn Sie Ihre E-Mail-Adresse noch nicht haben.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Formular */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md">
          {/* Allgemeine Einstellungen */}
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5" />
              E-Mail-Konto
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-Mail-Adresse *
                </label>
                <input
                  type="email"
                  value={formData.imapUser}
                  onChange={(e) => handleInputChange('imapUser', e.target.value)}
                  placeholder="ihr.name@bereifung24.de"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ihre vollständige E-Mail-Adresse
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passwort *
                </label>
                <input
                  type="password"
                  value={formData.imapPassword || ''}
                  onChange={(e) => handleInputChange('imapPassword', e.target.value)}
                  placeholder={hasExistingSettings ? '(unverändert lassen)' : 'Ihr E-Mail-Passwort'}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required={!hasExistingSettings}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {hasExistingSettings
                    ? 'Nur ausfüllen, wenn Sie das Passwort ändern möchten'
                    : 'Ihr E-Mail-Passwort für den Abruf und Versand'}
                </p>
              </div>
            </div>
          </div>

          {/* Server-Konfiguration */}
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Server className="h-5 w-5" />
              Server-Einstellungen
            </h2>

            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useCommonServer}
                  onChange={(e) => setUseCommonServer(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">
                  Gemeinsame Server-Konfiguration verwenden (empfohlen)
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Für Bereifung24-E-Mail-Adressen (@bereifung24.de)
              </p>
            </div>

            {useCommonServer ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mail-Server *
                    </label>
                    <input
                      type="text"
                      value={formData.imapHost}
                      onChange={(e) => handleInputChange('imapHost', e.target.value)}
                      placeholder="mail.bereifung24.de"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Server für Empfang (IMAP) und Versand (SMTP)
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        IMAP Port
                      </label>
                      <input
                        type="number"
                        value={formData.imapPort}
                        onChange={(e) => handleInputChange('imapPort', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SMTP Port
                      </label>
                      <input
                        type="number"
                        value={formData.smtpPort}
                        onChange={(e) => handleInputChange('smtpPort', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.imapTls}
                        onChange={(e) => handleInputChange('imapTls', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">TLS/SSL für IMAP</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.smtpSecure}
                        onChange={(e) => handleInputChange('smtpSecure', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">SSL für SMTP</span>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* IMAP Server */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Posteingangsserver (IMAP)
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          IMAP Server *
                        </label>
                        <input
                          type="text"
                          value={formData.imapHost}
                          onChange={(e) => handleInputChange('imapHost', e.target.value)}
                          placeholder="imap.hetzner.de"
                          className="w-full px-4 py-2 border rounded-lg"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Port
                        </label>
                        <input
                          type="number"
                          value={formData.imapPort}
                          onChange={(e) => handleInputChange('imapPort', parseInt(e.target.value))}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.imapTls}
                        onChange={(e) => handleInputChange('imapTls', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">TLS/SSL verwenden (empfohlen)</span>
                    </label>
                  </div>
                </div>

                {/* SMTP Server */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Postausgangsserver (SMTP)
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Server *
                        </label>
                        <input
                          type="text"
                          value={formData.smtpHost}
                          onChange={(e) => handleInputChange('smtpHost', e.target.value)}
                          placeholder="smtp.hetzner.de"
                          className="w-full px-4 py-2 border rounded-lg"
                          required={!useCommonServer}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Port
                        </label>
                        <input
                          type="number"
                          value={formData.smtpPort}
                          onChange={(e) => handleInputChange('smtpPort', parseInt(e.target.value))}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.smtpSecure}
                        onChange={(e) => handleInputChange('smtpSecure', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">SSL verwenden (empfohlen)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Synchronisierungs-Einstellungen */}
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Synchronisierung</h2>

            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.syncEnabled}
                  onChange={(e) => handleInputChange('syncEnabled', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">
                  Automatische Synchronisierung aktivieren
                </span>
              </label>

              {formData.syncEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Synchronisierungs-Intervall
                  </label>
                  <select
                    value={formData.syncInterval}
                    onChange={(e) => handleInputChange('syncInterval', parseInt(e.target.value))}
                    className="px-4 py-2 border rounded-lg"
                  >
                    <option value={60000}>Jede Minute</option>
                    <option value={300000}>Alle 5 Minuten</option>
                    <option value={600000}>Alle 10 Minuten</option>
                    <option value={1800000}>Alle 30 Minuten</option>
                    <option value={3600000}>Jede Stunde</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Aktionen */}
          <div className="p-6 flex justify-between">
            <Link
              href="/mitarbeiter/email"
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Abbrechen
            </Link>

            <div className="flex gap-3">
              {/* <button
                type="button"
                onClick={testConnection}
                disabled={testingConnection || saving}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {testingConnection ? 'Teste...' : 'Verbindung testen'}
              </button> */}

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Speichere...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Einstellungen speichern
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Hilfe-Box */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-semibold text-amber-900 mb-2">📋 Beispiel-Konfiguration</h3>
          <div className="text-sm text-amber-800 space-y-1">
            <p><strong>E-Mail:</strong> vorname.nachname@bereifung24.de</p>
            <p><strong>Server:</strong> mail.your-server.de</p>
            <p><strong>IMAP Port:</strong> 993 (mit TLS/SSL)</p>
            <p><strong>SMTP Port:</strong> 587</p>
          </div>
        </div>
      </div>
    </div>
  )
}
