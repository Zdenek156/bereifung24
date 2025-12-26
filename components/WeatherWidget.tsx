'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!settings?.isEnabled || !settings?.showOnDashboard) {
    return null // Don't show widget if disabled
  }

  if (!weather) {
    return (
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
            Wetter-Erinnerung
          </h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-3">
            Wetterdaten konnten nicht geladen werden
          </p>
          <button
            onClick={() => router.push('/dashboard/customer/weather-alert')}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Einstellungen
          </button>
        </div>
      </div>
    )
  }

  const currentTemp = weather.current.temperature
  const threshold = settings.temperatureThreshold
  const isBelowThreshold = currentTemp < threshold

  return (
    <div className={`bg-white rounded-lg shadow ${isBelowThreshold ? 'border-2 border-blue-500' : 'border'}`}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {isBelowThreshold ? (
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
            Reifenwechsel-Erinnerung
          </h3>
          <button
            onClick={() => router.push('/dashboard/customer/weather-alert')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
      <div className="p-6 space-y-4">
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
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <span className="text-gray-600">{weather.current.windSpeed} km/h</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <span className="text-gray-600">{weather.current.humidity}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
