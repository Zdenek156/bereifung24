'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [settings, setSettings] = useState<EmailSettings>({
    imapHost: 'mail.your-server.de',
    imapPort: 993,
    imapUser: '',
    imapPassword: '',
    imapTls: true,
    smtpHost: 'mail.your-server.de',
    smtpPort: 465,
    smtpUser: '',
    smtpPassword: '',
    smtpSecure: true,
    syncEnabled: true,
    syncInterval: 300000, // 5 Minuten
  })

  const [showPassword, setShowPassword] = useState(false)

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
    try {
      const res = await fetch('/api/email/settings')
      if (res.ok) {
        const data = await res.json()
        // API gibt { settings, needsConfiguration } zurück
        if (data.settings) {
          setSettings((prev) => ({
            ...prev,
            ...data.settings,
          }))
        }
      } else if (res.status !== 404) {
        throw new Error('Failed to fetch settings')
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
    setMessage(null)

    try {
      // Validierung
      if (!settings.imapUser || !settings.imapPassword) {
        throw new Error('Bitte füllen Sie alle Pflichtfelder aus')
      }

      const res = await fetch('/api/email/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          smtpPassword: settings.smtpPassword || settings.imapPassword,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save settings')
      }

      setMessage({ type: 'success', text: 'Einstellungen erfolgreich gespeichert!' })
      
      // Nach 2 Sekunden zur Email-Übersicht
      setTimeout(() => {
        router.push('/mitarbeiter/email')
      }, 2000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/email/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'INBOX', limit: 1 }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Verbindung fehlgeschlagen')
      }

      setMessage({ type: 'success', text: 'Verbindung erfolgreich getestet!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Einstellungen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                type="button"
                onClick={() => router.push('/mitarbeiter/email')}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Zurück
              </button>
              <h1 className="text-2xl font-bold text-gray-900">E-Mail-Einstellungen</h1>
            </div>
            <p className="text-gray-600">
              Konfigurieren Sie Ihren Hetzner E-Mail-Zugang
            </p>
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* IMAP Einstellungen */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                IMAP (Posteingang)
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IMAP Server *
                  </label>
                  <input
                    type="text"
                    value={settings.imapHost}
                    onChange={(e) => setSettings({ ...settings, imapHost: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IMAP Port *
                  </label>
                  <input
                    type="number"
                    value={settings.imapPort}
                    onChange={(e) => setSettings({ ...settings, imapPort: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-Mail-Adresse *
                  </label>
                  <input
                    type="email"
                    value={settings.imapUser}
                    onChange={(e) => setSettings({ ...settings, imapUser: e.target.value, smtpUser: e.target.value })}
                    placeholder="ihre.email@bereifung24.de"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Passwort *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={settings.imapPassword}
                      onChange={(e) => setSettings({ ...settings, imapPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required={!settings.id}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="imapTls"
                    checked={settings.imapTls}
                    onChange={(e) => setSettings({ ...settings, imapTls: e.target.checked })}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label htmlFor="imapTls" className="ml-2 text-sm text-gray-700">
                    TLS verwenden (empfohlen)
                  </label>
                </div>
              </div>
            </div>

            {/* SMTP Einstellungen */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                SMTP (Postausgang)
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Server *
                  </label>
                  <input
                    type="text"
                    value={settings.smtpHost}
                    onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Port *
                  </label>
                  <input
                    type="number"
                    value={settings.smtpPort}
                    onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="smtpSecure"
                    checked={settings.smtpSecure}
                    onChange={(e) => setSettings({ ...settings, smtpSecure: e.target.checked })}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label htmlFor="smtpSecure" className="ml-2 text-sm text-gray-700">
                    SSL/TLS verwenden (empfohlen)
                  </label>
                </div>
              </div>
            </div>

            {/* Synchronisierung */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Synchronisierung
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="syncEnabled"
                    checked={settings.syncEnabled}
                    onChange={(e) => setSettings({ ...settings, syncEnabled: e.target.checked })}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label htmlFor="syncEnabled" className="ml-2 text-sm text-gray-700">
                    Automatische Synchronisierung aktivieren
                  </label>
                </div>

                {settings.syncEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sync-Intervall (Minuten)
                    </label>
                    <select
                      value={settings.syncInterval / 60000}
                      onChange={(e) => setSettings({ ...settings, syncInterval: parseInt(e.target.value) * 60000 })}
                      className="w-full md:w-64 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1">1 Minute</option>
                      <option value="5">5 Minuten</option>
                      <option value="10">10 Minuten</option>
                      <option value="15">15 Minuten</option>
                      <option value="30">30 Minuten</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
              >
                {saving ? 'Speichere...' : 'Einstellungen speichern'}
              </button>

              {settings.id && (
                <button
                  type="button"
                  onClick={testConnection}
                  disabled={saving}
                  className="w-full px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:bg-gray-100 disabled:text-gray-400 font-medium"
                >
                  Verbindung testen
                </button>
              )}
              
              {!settings.id && (
                <p className="text-sm text-gray-500 text-center">
                  💡 Speichern Sie zuerst die Einstellungen, um die Verbindung zu testen
                </p>
              )}
            </div>
          </form>

          {/* Hilfe */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">
              💡 Hetzner E-Mail-Setup
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• IMAP Server: <code className="bg-blue-100 px-2 py-0.5 rounded">mail.your-server.de</code></li>
              <li>• IMAP Port: <code className="bg-blue-100 px-2 py-0.5 rounded">993</code> (SSL/TLS)</li>
              <li>• SMTP Server: <code className="bg-blue-100 px-2 py-0.5 rounded">mail.your-server.de</code></li>
              <li>• SMTP Port: <code className="bg-blue-100 px-2 py-0.5 rounded">465</code> (SSL) oder <code className="bg-blue-100 px-2 py-0.5 rounded">587</code> (STARTTLS)</li>
              <li>• Die E-Mail-Adresse muss vom Admin bei Hetzner eingerichtet werden</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
