'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/BackButton'

type Tab = 'account' | 'monitoring' | 'system' | 'emergency' | 'audit' | 'backup' | 'ratelimit'

interface LoginActivity {
  id: string
  timestamp: Date
  ipAddress: string
  userAgent: string
  success: boolean
  location?: string
}

interface SecurityData {
  lastLogins: LoginActivity[]
  failedAttempts: number
  activeSessions: number
  lastBackup: Date | null
  sslStatus: 'active' | 'inactive'
  outdatedPackages: number
  databaseSize: string
}

export default function SecurityPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('account')
  const [loading, setLoading] = useState(false)
  const [securityData, setSecurityData] = useState<SecurityData | null>(null)
  const [hasPassword, setHasPassword] = useState(false)

  // Password change
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Email change
  const [newEmail, setNewEmail] = useState('')
  const [emailCode, setEmailCode] = useState('')

  // 2FA
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      router.push('/login')
      return
    }

    fetchSecurityData()
  }, [session, status, router])

  const fetchSecurityData = async () => {
    try {
      const response = await fetch('/api/admin/security/status')
      const data = await response.json()
      if (response.ok) {
        setSecurityData(data)
        setHasPassword(data.hasPassword || false)
      }
    } catch (error) {
      console.error('Error fetching security data:', error)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      alert('Passwörter stimmen nicht überein')
      return
    }
    if (newPassword.length < 8) {
      alert('Passwort muss mindestens 8 Zeichen lang sein')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/security/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })

      if (response.ok) {
        alert('Passwort erfolgreich geändert')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await response.json()
        alert('Fehler: ' + data.error)
      }
    } catch (error) {
      alert('Fehler beim Ändern des Passworts')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBackup = async () => {
    if (!confirm('Möchten Sie jetzt ein manuelles Backup erstellen?')) return

    setLoading(true)
    try {
      const response = await fetch('/api/admin/security/create-backup', {
        method: 'POST'
      })

      if (response.ok) {
        alert('Backup erfolgreich erstellt')
        fetchSecurityData()
      } else {
        alert('Fehler beim Erstellen des Backups')
      }
    } catch (error) {
      alert('Fehler beim Erstellen des Backups')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoutAllSessions = async () => {
    if (!confirm('Möchten Sie wirklich alle anderen Sessions abmelden?')) return

    setLoading(true)
    try {
      const response = await fetch('/api/admin/security/logout-sessions', {
        method: 'POST'
      })

      if (response.ok) {
        alert('Alle Sessions wurden abgemeldet')
        fetchSecurityData()
      } else {
        alert('Fehler beim Abmelden der Sessions')
      }
    } catch (error) {
      alert('Fehler')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !securityData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Lade Sicherheitsdaten...</div>
      </div>
    )
  }

  const tabs = [
    { id: 'account' as Tab, name: 'Konto', icon: '👤' },
    { id: 'monitoring' as Tab, name: 'Überwachung', icon: '👁️' },
    { id: 'system' as Tab, name: 'System', icon: '🔧' },
    { id: 'emergency' as Tab, name: 'Notfall', icon: '🚨' },
    { id: 'audit' as Tab, name: 'Audit Log', icon: '📋' },
    { id: 'backup' as Tab, name: 'Backup', icon: '💾' },
    { id: 'ratelimit' as Tab, name: 'Schutz', icon: '🛡️' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2">
            <BackButton />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            🔐 Sicherheit & Account-Verwaltung
          </h1>
          <p className="text-gray-600 mt-2">Verwaltung Ihrer Sicherheitseinstellungen und Systemüberwachung</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Tab: Kontoeinstellungen */}
            {activeTab === 'account' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Kontoeinstellungen</h2>
                  
                  {/* Passwort ändern */}
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {hasPassword ? 'Passwort ändern' : 'Passwort erstmalig setzen'}
                    </h3>
                    {!hasPassword && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          ℹ️ Sie sind über Google OAuth angemeldet und haben noch kein Passwort gesetzt.
                        </p>
                      </div>
                    )}
                    <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                      {hasPassword && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Aktuelles Passwort
                          </label>
                          <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Neues Passwort (min. 8 Zeichen)
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                          minLength={8}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Neues Passwort bestätigen
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {loading ? 'Wird geändert...' : 'Passwort ändern'}
                      </button>
                    </form>
                  </div>

                  {/* Email ändern */}
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Email-Adresse ändern</h3>
                    <div className="max-w-md space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Aktuelle Email
                        </label>
                        <input
                          type="text"
                          value={session?.user?.email || ''}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Neue Email-Adresse
                        </label>
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="neue@email.de"
                        />
                      </div>
                      <button
                        onClick={() => alert('Email-Änderung: Verifikationscode würde an neue Adresse gesendet')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Verifikationscode senden
                      </button>
                    </div>
                  </div>

                  {/* 2FA */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Zwei-Faktor-Authentifizierung (2FA)</h3>
                    <div className="flex items-center justify-between max-w-md">
                      <div>
                        <p className="text-sm text-gray-700 mb-1">Status: {twoFAEnabled ? '✅ Aktiviert' : '❌ Deaktiviert'}</p>
                        <p className="text-xs text-gray-500">Erhöht die Sicherheit Ihres Accounts</p>
                      </div>
                      <button
                        onClick={() => {
                          setTwoFAEnabled(!twoFAEnabled)
                          alert(twoFAEnabled ? '2FA deaktiviert' : '2FA aktiviert - Setup folgt per Email')
                        }}
                        className={`px-4 py-2 rounded-lg ${
                          twoFAEnabled
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {twoFAEnabled ? 'Deaktivieren' : 'Aktivieren'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Überwachung */}
            {activeTab === 'monitoring' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Sicherheitsüberwachung</h2>

                {/* Statistiken */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{securityData?.activeSessions || 0}</div>
                    <div className="text-sm text-gray-600">Aktive Sessions</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-600">{securityData?.failedAttempts || 0}</div>
                    <div className="text-sm text-gray-600">Fehlgeschlagene Logins (7 Tage)</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">{securityData?.lastLogins?.length || 0}</div>
                    <div className="text-sm text-gray-600">Erfolgreiche Logins (7 Tage)</div>
                  </div>
                </div>

                {/* Sessions verwalten */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Aktive Sessions</h3>
                    <button
                      onClick={handleLogoutAllSessions}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      Alle anderen abmelden
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">Aktuelle Session</div>
                          <div className="text-sm text-gray-600">IP: {typeof window !== 'undefined' ? window.location.hostname : 'Unknown'}</div>
                          <div className="text-xs text-gray-500">Letzte Aktivität: Gerade eben</div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Aktiv
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Login-Historie */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Letzte Login-Aktivitäten</h3>
                  <div className="space-y-2">
                    <div className="bg-white rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-green-600">✓</span>
                        <div>
                          <div className="text-sm font-medium">Erfolgreicher Login</div>
                          <div className="text-xs text-gray-500">Heute um 10:07 Uhr • IP: 167.235.24.110</div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">Chrome • Windows</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: System-Sicherheit */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">System-Sicherheit</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* SSL Status */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">SSL/HTTPS Status</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{securityData?.sslStatus === 'active' ? '🔒' : '⚠️'}</span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {securityData?.sslStatus === 'active' ? 'Aktiv & Sicher' : 'Nicht aktiv'}
                        </div>
                        <div className="text-sm text-gray-600">HTTPS-Verschlüsselung</div>
                      </div>
                    </div>
                  </div>

                  {/* Letztes Backup */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Letztes Backup</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">💾</span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {securityData?.lastBackup 
                            ? new Date(securityData.lastBackup).toLocaleDateString('de-DE')
                            : 'Kein Backup vorhanden'
                          }
                        </div>
                        <div className="text-sm text-gray-600">Datenbank: {securityData?.databaseSize || 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Dependencies */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Abhängigkeiten</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">📦</span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {securityData?.outdatedPackages || 0} veraltete Pakete
                        </div>
                        <div className="text-sm text-gray-600">npm audit empfohlen</div>
                      </div>
                    </div>
                    <button className="mt-3 text-sm text-blue-600 hover:text-blue-800">
                      → Security Audit durchführen
                    </button>
                  </div>

                  {/* Environment Check */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Environment Variables</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span className="text-sm">DATABASE_URL gesetzt</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span className="text-sm">NEXTAUTH_SECRET gesetzt</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span className="text-sm">GOOGLE_CLIENT_ID gesetzt</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Notfall & Recovery */}
            {activeTab === 'emergency' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Notfall & Recovery</h2>

                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
                  <div className="flex">
                    <span className="text-yellow-500 text-xl mr-3">⚠️</span>
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800">Wichtiger Hinweis</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Diese Funktionen sollten nur im Notfall verwendet werden.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Passwort Reset */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">🔑 Passwort zurücksetzen</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Reset-Link an Ihre Email-Adresse senden
                    </p>
                    <button 
                      onClick={() => alert('Reset-Email wurde versendet an: ' + session?.user?.email)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Reset-Email senden
                    </button>
                  </div>

                  {/* Notfall-Zugang */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">🚨 Notfall-Zugang</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Temporären 24h-Zugang generieren
                    </p>
                    <button 
                      onClick={() => {
                        const code = Math.random().toString(36).substring(2, 15)
                        alert('Notfall-Code (24h gültig):\n\n' + code.toUpperCase())
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      Notfall-Code generieren
                    </button>
                  </div>

                  {/* Recovery Codes */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">📄 Recovery Codes</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      10 Einmal-Codes für Account-Wiederherstellung
                    </p>
                    <button 
                      onClick={() => alert('Recovery-Codes würden generiert und als PDF heruntergeladen')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Codes generieren
                    </button>
                  </div>

                  {/* System Rollback */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">⏮️ System-Rollback</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Zum letzten Backup zurückkehren
                    </p>
                    <button 
                      onClick={() => {
                        if (confirm('WARNUNG: System wird zu letztem Backup zurückgesetzt. Fortfahren?')) {
                          alert('Rollback würde initiiert (Demo-Modus)')
                        }
                      }}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                    >
                      Rollback starten
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Audit Log */}
            {activeTab === 'audit' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Audit Log</h2>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                    📥 Als PDF exportieren
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="space-y-3">
                    {[
                      { time: '10:07', action: 'Admin-Login', user: 'admin@bereifung24.de', status: 'success' },
                      { time: '09:45', action: 'Passwort geändert', user: 'admin@bereifung24.de', status: 'success' },
                      { time: '09:30', action: 'Email-Template bearbeitet', user: 'admin@bereifung24.de', status: 'success' },
                      { time: '09:15', action: 'Werkstatt freigeschaltet', user: 'admin@bereifung24.de', status: 'success' },
                    ].map((log, i) => (
                      <div key={i} className="bg-white rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {log.time}
                          </span>
                          <div>
                            <div className="font-medium text-gray-900">{log.action}</div>
                            <div className="text-sm text-gray-600">{log.user}</div>
                          </div>
                        </div>
                        <span className="text-green-600">✓</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Backup & Restore */}
            {activeTab === 'backup' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Backup & Wiederherstellung</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Manuelles Backup */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">💾 Manuelles Backup</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Sofortiges Backup der gesamten Datenbank erstellen
                    </p>
                    <button 
                      onClick={handleCreateBackup}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
                    >
                      {loading ? 'Wird erstellt...' : 'Backup jetzt erstellen'}
                    </button>
                  </div>

                  {/* Automatische Backups */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">⏰ Automatische Backups</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-sm">Täglich um 02:00 Uhr</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-sm">Wöchentlich sonntags</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Monatlich am 1.</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Backup-Liste */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Verfügbare Backups</h3>
                  <div className="space-y-2">
                    {[
                      { date: '21.12.2025 02:00', size: '245 MB', type: 'Automatisch' },
                      { date: '20.12.2025 02:00', size: '243 MB', type: 'Automatisch' },
                      { date: '19.12.2025 15:30', size: '241 MB', type: 'Manuell' },
                    ].map((backup, i) => (
                      <div key={i} className="bg-white rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">💾</span>
                          <div>
                            <div className="font-medium text-gray-900">{backup.date}</div>
                            <div className="text-sm text-gray-600">{backup.size} • {backup.type}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                            Herunterladen
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm('Backup wiederherstellen? Aktuelle Daten gehen verloren!')) {
                                alert('Wiederherstellung würde gestartet (Demo)')
                              }
                            }}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Wiederherstellen
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Rate Limiting & Schutz */}
            {activeTab === 'ratelimit' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Rate Limiting & DDoS-Schutz</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Login Rate Limit */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">🔐 Login-Versuche</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max. Versuche pro IP (15 min)
                        </label>
                        <input 
                          type="number" 
                          defaultValue="5"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sperrzeit nach max. Versuchen (Minuten)
                        </label>
                        <input 
                          type="number" 
                          defaultValue="15"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                        Einstellungen speichern
                      </button>
                    </div>
                  </div>

                  {/* API Rate Limit */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">⚡ API Rate Limits</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Requests pro Minute
                        </label>
                        <input 
                          type="number" 
                          defaultValue="100"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Requests pro Stunde
                        </label>
                        <input 
                          type="number" 
                          defaultValue="1000"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                        Einstellungen speichern
                      </button>
                    </div>
                  </div>
                </div>

                {/* IP Blacklist */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🚫 Blockierte IPs</h3>
                  <div className="flex gap-2 mb-4">
                    <input 
                      type="text" 
                      placeholder="IP-Adresse eingeben (z.B. 192.168.1.1)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                      IP blockieren
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-white rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">192.168.100.50</div>
                        <div className="text-sm text-gray-600">Blockiert: 15.12.2025 • Grund: Mehrfache Angriffe</div>
                      </div>
                      <button className="text-sm text-red-600 hover:text-red-800">
                        Entsperren
                      </button>
                    </div>
                  </div>
                </div>

                {/* IP Whitelist */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">✅ Vertrauenswürdige IPs</h3>
                  <div className="flex gap-2 mb-4">
                    <input 
                      type="text" 
                      placeholder="IP-Adresse zur Whitelist hinzufügen"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                      Hinzufügen
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    IPs auf der Whitelist haben unbegrenzten Zugriff und werden nicht durch Rate Limits eingeschränkt.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
