import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Free Weather API - OpenWeatherMap (requires API key in .env)
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || ''

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
    // Fetch current weather
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=de&appid=${OPENWEATHER_API_KEY}`
    const currentRes = await fetch(currentUrl)
    const currentData = await currentRes.json()

    // Fetch 5-day forecast
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=de&appid=${OPENWEATHER_API_KEY}`
    const forecastRes = await fetch(forecastUrl)
    const forecastData = await forecastRes.json()

    // Process current weather
    const current = {
      temperature: currentData.main.temp,
      condition: currentData.weather[0].description,
      humidity: currentData.main.humidity,
      windSpeed: Math.round(currentData.wind.speed * 3.6) // m/s to km/h
    }

    // Process forecast (group by day and get min/max)
    const dailyForecast: { [key: string]: any } = {}
    
    forecastData.list.forEach((item: any) => {
      const date = item.dt_txt.split(' ')[0]
      if (!dailyForecast[date]) {
        dailyForecast[date] = {
          date,
          minTemp: item.main.temp_min,
          maxTemp: item.main.temp_max,
          condition: item.weather[0].description
        }
      } else {
        dailyForecast[date].minTemp = Math.min(dailyForecast[date].minTemp, item.main.temp_min)
        dailyForecast[date].maxTemp = Math.max(dailyForecast[date].maxTemp, item.main.temp_max)
      }
    })

    const forecast = Object.values(dailyForecast).slice(0, 7)

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
