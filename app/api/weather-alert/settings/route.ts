import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch weather alert settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id },
      include: {
        weatherAlert: true
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Return existing settings or defaults
    const settings = customer.weatherAlert || {
      isEnabled: false,
      temperatureThreshold: 7,
      daysInAdvance: 3,
      showOnDashboard: true,
      useCustomLocation: false
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching weather alert settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// POST - Update weather alert settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      isEnabled,
      temperatureThreshold,
      daysInAdvance,
      showOnDashboard,
      useCustomLocation,
      customZipCode,
      customCity
    } = body

    // Validate inputs
    if (temperatureThreshold < -5 || temperatureThreshold > 15) {
      return NextResponse.json(
        { error: 'Temperature threshold must be between -5°C and 15°C' },
        { status: 400 }
      )
    }

    if (daysInAdvance < 1 || daysInAdvance > 7) {
      return NextResponse.json(
        { error: 'Days in advance must be between 1 and 7' },
        { status: 400 }
      )
    }

    // Get or geocode custom location if needed
    let customLatitude = null
    let customLongitude = null

    if (useCustomLocation && customZipCode && customCity) {
      try {
        // Geocode the custom location (simple approach with nominatim)
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${customZipCode}+${customCity}+Germany&format=json&limit=1`
        const geocodeRes = await fetch(geocodeUrl, {
          headers: {
            'User-Agent': 'Bereifung24-Platform'
          }
        })
        const geocodeData = await geocodeRes.json()
        
        if (geocodeData.length > 0) {
          customLatitude = parseFloat(geocodeData[0].lat)
          customLongitude = parseFloat(geocodeData[0].lon)
        }
      } catch (error) {
        console.error('Geocoding error:', error)
        // Continue without coordinates - will use user's address instead
      }
    }

    // Upsert weather alert settings
    const weatherAlert = await prisma.weatherAlert.upsert({
      where: { customerId: customer.id },
      create: {
        customerId: customer.id,
        isEnabled,
        temperatureThreshold,
        daysInAdvance,
        showOnDashboard,
        useCustomLocation,
        customZipCode: useCustomLocation ? customZipCode : null,
        customCity: useCustomLocation ? customCity : null,
        customLatitude,
        customLongitude
      },
      update: {
        isEnabled,
        temperatureThreshold,
        daysInAdvance,
        showOnDashboard,
        useCustomLocation,
        customZipCode: useCustomLocation ? customZipCode : null,
        customCity: useCustomLocation ? customCity : null,
        customLatitude,
        customLongitude
      }
    })

    return NextResponse.json(weatherAlert)
  } catch (error) {
    console.error('Error updating weather alert settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
