'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  CloudSnow, 
  Sun, 
  Settings,
  ThermometerSnowflake,
  Wind,
  Droplets
} from 'lucide-react'

interface WeatherData {
  current: {
    temperature: number
    condition: string
    humidity: number
    windSpeed: number
  }
  forecast: {
    date: string
    minTemp: number
    maxTemp: number
    condition: string
  }[]
  recommendation: string
}

export default function WeatherWidget() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [settings, setSettings] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch settings
      const settingsRes = await fetch('/api/weather-alert/settings')
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        setSettings(settingsData)
        
        // Only fetch weather if enabled
        if (settingsData.isEnabled) {
          const weatherRes = await fetch('/api/weather-alert/current')
          if (weatherRes.ok) {
            const weatherData = await weatherRes.json()
            setWeather(weatherData)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!settings?.isEnabled || !settings?.showOnDashboard) {
    return null // Don't show widget if disabled
  }

  if (!weather) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CloudSnow className="w-5 h-5" />
            Wetter-Erinnerung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-3">
            Wetterdaten konnten nicht geladen werden
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/customer/weather-alert')}
          >
            <Settings className="w-4 h-4 mr-2" />
            Einstellungen
          </Button>
        </CardContent>
      </Card>
    )
  }

  const currentTemp = weather.current.temperature
  const threshold = settings.temperatureThreshold
  const isBelowThreshold = currentTemp < threshold

  return (
    <Card className={isBelowThreshold ? 'border-blue-500 border-2' : ''}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            {isBelowThreshold ? (
              <CloudSnow className="w-5 h-5 text-blue-600" />
            ) : (
              <Sun className="w-5 h-5 text-orange-500" />
            )}
            Reifenwechsel-Erinnerung
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/customer/weather-alert')}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Temperature */}
        <div className="text-center py-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
          <div className="text-5xl font-bold text-blue-900">
            {Math.round(currentTemp)}°C
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {weather.current.condition}
          </div>
        </div>

        {/* Recommendation */}
        {isBelowThreshold && (
          <div className="p-3 bg-blue-100 border border-blue-300 rounded-lg">
            <p className="text-sm font-medium text-blue-900">
              ❄️ {weather.recommendation}
            </p>
          </div>
        )}

        {/* Forecast */}
        <div>
          <h4 className="text-sm font-medium mb-2">Nächste {settings.daysInAdvance} Tage</h4>
          <div className="space-y-2">
            {weather.forecast.slice(0, settings.daysInAdvance).map((day, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded"
              >
                <span className="text-gray-600">
                  {new Date(day.date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-gray-600">{Math.round(day.minTemp)}°</span>
                  <span className="text-gray-400">/</span>
                  <span className="font-medium">{Math.round(day.maxTemp)}°</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="flex items-center gap-2 text-sm">
            <Wind className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{weather.current.windSpeed} km/h</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Droplets className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{weather.current.humidity}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
