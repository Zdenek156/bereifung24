import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getApiSetting } from '@/lib/api-settings'

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

async function fetchWeatherData(lat: number, lon: number, threshold: number): Promise<WeatherData> {
  try {
    // Get API key from database (managed in admin panel)
    const WEATHERAPI_KEY = await getApiSetting('WEATHERAPI_KEY', 'WEATHERAPI_KEY')
    
    if (!WEATHERAPI_KEY) {
      throw new Error('WeatherAPI key not configured. Please add it in admin settings.')
    }

    // WeatherAPI.com provides current weather + 7-day forecast in a single call
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHERAPI_KEY}&q=${lat},${lon}&days=7&lang=de`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`WeatherAPI error: ${response.status}`)
    }
    
    const data = await response.json()

    // Process current weather
    const current = {
      temperature: data.current.temp_c,
      condition: data.current.condition.text,
      humidity: data.current.humidity,
      windSpeed: Math.round(data.current.wind_kph)
    }

    // Process forecast
    const forecast = data.forecast.forecastday.map((day: any) => ({
      date: day.date,
      minTemp: day.day.mintemp_c,
      maxTemp: day.day.maxtemp_c,
      condition: day.day.condition.text
    }))

    // Generate recommendation
    let recommendation = ''
    if (current.temperature < threshold) {
      recommendation = `Es ist kalt! Zeit für Winterreifen. Die Temperatur liegt bei ${Math.round(current.temperature)}°C.`
    } else if (current.temperature >= threshold && current.temperature < threshold + 3) {
      recommendation = `Die Temperaturen nähern sich Ihrer Schwelle. Bereiten Sie sich auf den Reifenwechsel vor.`
    } else {
      recommendation = `Noch warm genug für Sommerreifen. Temperatur: ${Math.round(current.temperature)}°C.`
    }

    return {
      current,
      forecast,
      recommendation
    }
  } catch (error) {
    console.error('Weather API error:', error)
    throw new Error('Failed to fetch weather data')
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get customer with weather alert settings
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id },
      include: {
        weatherAlert: true,
        user: true
      }
    })

    if (!customer || !customer.weatherAlert) {
      return NextResponse.json(
        { error: 'Weather alert not configured' },
        { status: 404 }
      )
    }

    const settings = customer.weatherAlert

    if (!settings.isEnabled) {
      return NextResponse.json(
        { error: 'Weather alert is disabled' },
        { status: 400 }
      )
    }

    // Determine which location to use
    let lat: number
    let lon: number

    if (settings.useCustomLocation && settings.customLatitude && settings.customLongitude) {
      lat = settings.customLatitude
      lon = settings.customLongitude
    } else if (customer.user.latitude && customer.user.longitude) {
      lat = customer.user.latitude
      lon = customer.user.longitude
    } else {
      return NextResponse.json(
        { error: 'No location available. Please set your address or custom location.' },
        { status: 400 }
      )
    }

    // Fetch weather data
    const weatherData = await fetchWeatherData(lat, lon, settings.temperatureThreshold)

    return NextResponse.json(weatherData)
  } catch (error) {
    console.error('Error fetching current weather:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    )
  }
}
