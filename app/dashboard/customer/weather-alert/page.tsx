'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface WeatherAlertSettings {
  isEnabled: boolean
  temperatureThreshold: number
  daysInAdvance: number
  showOnDashboard: boolean
  useCustomLocation: boolean
  customZipCode?: string
  customCity?: string
  lastAlertSeason?: string
  lastAlertDate?: string
}

export default function WeatherAlertPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [settings, setSettings] = useState<WeatherAlertSettings>({
    isEnabled: false,
    temperatureThreshold: 7,
    daysInAdvance: 3,
    showOnDashboard: true,
    useCustomLocation: false
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/weather-alert/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage(null)

      const res = await fetch('/api/weather-alert/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save settings')
      }

      setMessage({ type: 'success', text: 'Einstellungen erfolgreich gespeichert!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/customer')}
          className="mb-4 flex items-center text-blue-600 hover:text-blue-700"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Zurück zum Dashboard
        </button>
        
        <div className="flex items-center gap-3 mb-2">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h1 className="text-3xl font-bold">Wetter-Erinnerung</h1>
        </div>
        <p className="text-gray-600">
          Erhalten Sie eine Erinnerung zum Reifenwechsel, wenn die Temperatur sich ändert
        </p>
      </div>

      {/* Info Box */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-blue-900 text-sm">
            <strong>So funktioniert es:</strong> Wir überwachen die Wettervorhersage für Ihren Standort.
            Wenn die Temperatur in den nächsten Tagen Ihren Schwellwert erreicht, senden wir Ihnen eine
            Email-Erinnerung. Die Benachrichtigung erfolgt nur einmal pro Saison.
          </div>
        </div>
      </div>

      {message && (
        <div className={`mb-6 border rounded-lg p-4 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-sm ${message.type === 'success' ? 'text-green-900' : 'text-red-900'}`}>
            {message.text}
          </p>
        </div>
      )}

      <div className="grid gap-6">
        {/* Main Settings */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Benachrichtigungseinstellungen</h2>
            <p className="text-sm text-gray-600 mt-1">
              Konfigurieren Sie, wann Sie an den Reifenwechsel erinnert werden möchten
            </p>
          </div>
          <div className="p-6 space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-base font-medium">Wetter-Erinnerung aktivieren</label>
                <div className="text-sm text-gray-500">
                  Automatische Email-Benachrichtigungen aktivieren
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.isEnabled}
                  onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="border-t pt-6 space-y-6">
              {/* Temperature Threshold */}
              <div>
                <label htmlFor="temperature" className="flex items-center gap-2 mb-2 font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Temperatur-Schwelle
                </label>
                <div className="flex items-center gap-4">
                  <input
                    id="temperature"
                    type="number"
                    min="-5"
                    max="15"
                    value={settings.temperatureThreshold}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        temperatureThreshold: parseInt(e.target.value) || 7
                      })
                    }
                    disabled={!settings.isEnabled}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-2xl font-semibold">°C</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Sie werden benachrichtigt, wenn die Temperatur unter diesen Wert fällt (empfohlen: 7°C)
                </p>
              </div>

              {/* Days in Advance */}
              <div>
                <label htmlFor="days" className="flex items-center gap-2 mb-2 font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Vorlaufzeit
                </label>
                <div className="flex items-center gap-4">
                  <input
                    id="days"
                    type="number"
                    min="1"
                    max="7"
                    value={settings.daysInAdvance}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        daysInAdvance: parseInt(e.target.value) || 3
                      })
                    }
                    disabled={!settings.isEnabled}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="font-semibold">Tage</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Wie viele Tage im Voraus möchten Sie benachrichtigt werden? (1-7 Tage)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Anzeige-Einstellungen</h2>
            <p className="text-sm text-gray-600 mt-1">
              Passen Sie an, wo die Wetter-Informationen angezeigt werden
            </p>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-base font-medium">Auf Dashboard anzeigen</label>
                <div className="text-sm text-gray-500">
                  Wetter-Widget auf Ihrem Dashboard einblenden
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showOnDashboard}
                  onChange={(e) => setSettings({ ...settings, showOnDashboard: e.target.checked })}
                  disabled={!settings.isEnabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer disabled:opacity-50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Location Settings */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Standort
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Wir verwenden standardmäßig Ihre hinterlegte Adresse für die Wettervorhersage
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-base font-medium">Eigenen Standort verwenden</label>
                <div className="text-sm text-gray-500">
                  Abweichenden Standort für Wettervorhersage verwenden
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.useCustomLocation}
                  onChange={(e) => setSettings({ ...settings, useCustomLocation: e.target.checked })}
                  disabled={!settings.isEnabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer disabled:opacity-50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {settings.useCustomLocation && (
              <div className="border-t pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="zipCode" className="block text-sm font-medium mb-2">PLZ</label>
                    <input
                      id="zipCode"
                      placeholder="z.B. 10115"
                      value={settings.customZipCode || ''}
                      onChange={(e) =>
                        setSettings({ ...settings, customZipCode: e.target.value })
                      }
                      disabled={!settings.isEnabled}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium mb-2">Stadt</label>
                    <input
                      id="city"
                      placeholder="z.B. Berlin"
                      value={settings.customCity || ''}
                      onChange={(e) =>
                        setSettings({ ...settings, customCity: e.target.value })
                      }
                      disabled={!settings.isEnabled}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Info */}
        {settings.lastAlertSeason && (
          <div className="bg-gray-50 rounded-lg shadow border">
            <div className="p-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium">Letzte Benachrichtigung</p>
                  <p className="text-sm text-gray-600">
                    Saison: {settings.lastAlertSeason}
                    {settings.lastAlertDate && (
                      <> • {new Date(settings.lastAlertDate).toLocaleDateString('de-DE')}</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => router.push('/dashboard/customer')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="min-w-32 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Speichert...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Speichern
              </>
            )}
          </button>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
          Tipps für den Reifenwechsel
        </h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span><strong>Winterreifen:</strong> Wechseln Sie auf Winterreifen, wenn die Temperatur dauerhaft unter 7°C fällt</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-orange-600 font-bold">•</span>
            <span><strong>Sommerreifen:</strong> Wechseln Sie zurück zu Sommerreifen, wenn es dauerhaft über 7°C warm wird</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-green-600 font-bold">•</span>
            <span><strong>O-bis-O-Regel:</strong> Von Oktober bis Ostern Winterreifen fahren (als Faustregel)</span>
          </p>
        </div>
      </div>
    </div>
  )
}
