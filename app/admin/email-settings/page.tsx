'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface EmailSettings {
  host: string
  port: string
  user: string
  password: string
  from: string
}

export default function EmailSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [settings, setSettings] = useState<EmailSettings>({
    host: '',
    port: '587',
    user: '',
    password: '',
    from: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user?.role !== 'ADMIN') {
      router.push('/')
    } else {
      fetchSettings()
    }
  }, [session, status, router])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/email-settings')
      if (res.ok) {
        const data = await res.json()
        if (data.settings) {
          setSettings(data.settings)
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der Einstellungen:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/email-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Email-Einstellungen erfolgreich gespeichert!' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Fehler beim Speichern' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Netzwerkfehler beim Speichern' })
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/email-settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail: session?.user?.email })
      })

      const data = await res.json()
      
      if (res.ok) {
        setMessage({ type: 'success', text: `Test-Email erfolgreich gesendet an ${session?.user?.email}` })
      } else {
        setMessage({ type: 'error', text: data.error || 'Fehler beim Senden der Test-Email' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Netzwerkfehler beim Testen' })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zurück zum Admin Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">📧 Email-Einstellungen</h1>
          <p className="mt-2 text-gray-600">
            Konfigurieren Sie hier die SMTP-Einstellungen für den Email-Versand
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP Host *
            </label>
            <input
              type="text"
              value={settings.host}
              onChange={(e) => setSettings({ ...settings, host: e.target.value })}
              placeholder="z.B. mail.your-server.de, smtp.gmail.com"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Der SMTP-Server Ihres Email-Providers
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP Port *
            </label>
            <select
              value={settings.port}
              onChange={(e) => setSettings({ ...settings, port: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="25">25 (Standard, unverschlüsselt)</option>
              <option value="587">587 (TLS/STARTTLS - empfohlen)</option>
              <option value="465">465 (SSL)</option>
              <option value="2525">2525 (Alternativ)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email-Adresse (Benutzername) *
            </label>
            <input
              type="email"
              value={settings.user}
              onChange={(e) => setSettings({ ...settings, user: e.target.value })}
              placeholder="z.B. info@bereifung24.de"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passwort *
            </label>
            <input
              type="password"
              value={settings.password}
              onChange={(e) => setSettings({ ...settings, password: e.target.value })}
              placeholder="Email-Passwort"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              ⚠️ Wird verschlüsselt in der Datenbank gespeichert
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Absender-Adresse (FROM) *
            </label>
            <input
              type="email"
              value={settings.from}
              onChange={(e) => setSettings({ ...settings, from: e.target.value })}
              placeholder="z.B. noreply@bereifung24.de"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Die Email-Adresse, die als Absender angezeigt wird
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Wird gespeichert...' : 'Einstellungen speichern'}
            </button>

            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !settings.host || !settings.user}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {testing ? 'Sendet...' : 'Test-Email senden'}
            </button>
          </div>
        </form>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-blue-900 mb-2">💡 Hinweise:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Port 587 mit STARTTLS ist die empfohlene Konfiguration</li>
            <li>• Bei Gmail: App-Passwort verwenden (nicht das normale Passwort)</li>
            <li>• Bei Hetzner: mail.your-server.de mit Port 587</li>
            <li>• Test-Email wird an Ihre Admin-Email gesendet: {session?.user?.email}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
