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

export default function WeatherWidgetCompact() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [settings, setSettings] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const settingsRes = await fetch('/api/weather-alert/settings')
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        setSettings(settingsData)
        if (settingsData.isEnabled) {
          const weatherRes = await fetch('/api/weather-alert/current')
          if (weatherRes.ok) {
            const weatherData = await weatherRes.json()
            setWeather(weatherData)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching weather data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-6 h-full">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!settings?.isEnabled && settings !== null && !settings?.showOnDashboard) {
    return null
  }

  if (!weather) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-5 h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
            Reifenwechsel-Erinnerung
          </h3>
          <button
            onClick={() => router.push('/dashboard/customer/weather-alert')}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Wetterdaten konnten nicht geladen werden
          </p>
        </div>
      </div>
    )
  }

  const currentTemp = weather.current.temperature
  const threshold = settings?.temperatureThreshold || 7
  const isBelowThreshold = currentTemp < threshold

  // Determine recommendation text
  const getRecommendation = () => {
    if (isBelowThreshold) {
      return { text: 'Winterreifen empfohlen', icon: '❄️', color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700' }
    }
    return { text: 'Sommerreifen ok', icon: '☀️', color: 'text-orange-700 dark:text-orange-300', bgColor: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700' }
  }

  const rec = getRecommendation()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
          {isBelowThreshold ? (
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
          Reifenwechsel-Erinnerung
        </h3>
        <button
          onClick={() => router.push('/dashboard/customer/weather-alert')}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <svg className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Temperature */}
      <div className="text-center py-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg mb-3">
        <div className="text-4xl font-bold text-blue-900 dark:text-blue-200">
          {Math.round(currentTemp)}°C
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {weather.current.condition}
        </div>
      </div>

      {/* Recommendation */}
      <div className={`p-3 rounded-lg border ${rec.bgColor}`}>
        <p className={`text-sm font-medium ${rec.color}`}>
          {rec.icon} {rec.text}
        </p>
      </div>
    </div>
  )
}
