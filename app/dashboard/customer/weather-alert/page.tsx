'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CloudSnow, 
  Sun, 
  ThermometerSnowflake, 
  Calendar,
  MapPin,
  Info,
  Save,
  ArrowLeft
} from 'lucide-react'

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
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/customer')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zum Dashboard
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <ThermometerSnowflake className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Wetter-Erinnerung</h1>
        </div>
        <p className="text-gray-600">
          Erhalten Sie eine Erinnerung zum Reifenwechsel, wenn die Temperatur sich ändert
        </p>
      </div>

      {/* Info Box */}
      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <Info className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>So funktioniert es:</strong> Wir überwachen die Wettervorhersage für Ihren Standort.
          Wenn die Temperatur in den nächsten Tagen Ihren Schwellwert erreicht, senden wir Ihnen eine
          Email-Erinnerung. Die Benachrichtigung erfolgt nur einmal pro Saison, damit Sie nicht mehrfach
          erinnert werden.
        </AlertDescription>
      </Alert>

      {message && (
        <Alert className={`mb-6 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <AlertDescription className={message.type === 'success' ? 'text-green-900' : 'text-red-900'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Main Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Benachrichtigungseinstellungen</CardTitle>
            <CardDescription>
              Konfigurieren Sie, wann Sie an den Reifenwechsel erinnert werden möchten
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Wetter-Erinnerung aktivieren</Label>
                <div className="text-sm text-gray-500">
                  Automatische Email-Benachrichtigungen aktivieren
                </div>
              </div>
              <Switch
                checked={settings.isEnabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, isEnabled: checked })
                }
              />
            </div>

            <div className="border-t pt-6 space-y-6">
              {/* Temperature Threshold */}
              <div>
                <Label htmlFor="temperature" className="flex items-center gap-2 mb-2">
                  <ThermometerSnowflake className="w-4 h-4" />
                  Temperatur-Schwelle
                </Label>
                <div className="flex items-center gap-4">
                  <Input
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
                    className="w-24"
                  />
                  <span className="text-2xl font-semibold">°C</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Sie werden benachrichtigt, wenn die Temperatur unter diesen Wert fällt (empfohlen: 7°C)
                </p>
              </div>

              {/* Days in Advance */}
              <div>
                <Label htmlFor="days" className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" />
                  Vorlaufzeit
                </Label>
                <div className="flex items-center gap-4">
                  <Input
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
                    className="w-24"
                  />
                  <span className="font-semibold">Tage</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Wie viele Tage im Voraus möchten Sie benachrichtigt werden? (1-7 Tage)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Anzeige-Einstellungen</CardTitle>
            <CardDescription>
              Passen Sie an, wo die Wetter-Informationen angezeigt werden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Auf Dashboard anzeigen</Label>
                <div className="text-sm text-gray-500">
                  Wetter-Widget auf Ihrem Dashboard einblenden
                </div>
              </div>
              <Switch
                checked={settings.showOnDashboard}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, showOnDashboard: checked })
                }
                disabled={!settings.isEnabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Standort
            </CardTitle>
            <CardDescription>
              Wir verwenden standardmäßig Ihre hinterlegte Adresse für die Wettervorhersage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Eigenen Standort verwenden</Label>
                <div className="text-sm text-gray-500">
                  Abweichenden Standort für Wettervorhersage verwenden
                </div>
              </div>
              <Switch
                checked={settings.useCustomLocation}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, useCustomLocation: checked })
                }
                disabled={!settings.isEnabled}
              />
            </div>

            {settings.useCustomLocation && (
              <div className="border-t pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zipCode">PLZ</Label>
                    <Input
                      id="zipCode"
                      placeholder="z.B. 10115"
                      value={settings.customZipCode || ''}
                      onChange={(e) =>
                        setSettings({ ...settings, customZipCode: e.target.value })
                      }
                      disabled={!settings.isEnabled}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Stadt</Label>
                    <Input
                      id="city"
                      placeholder="z.B. Berlin"
                      value={settings.customCity || ''}
                      onChange={(e) =>
                        setSettings({ ...settings, customCity: e.target.value })
                      }
                      disabled={!settings.isEnabled}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Info */}
        {settings.lastAlertSeason && (
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-gray-600 mt-0.5" />
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
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/customer')}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="min-w-32"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Speichert...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Speichern
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <CloudSnow className="w-5 h-5 text-blue-600" />
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
