import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Public workshop search API for mobile app
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const zipCode = searchParams.get('zipCode')
    const city = searchParams.get('city')
    const latitude = searchParams.get('latitude') ? parseFloat(searchParams.get('latitude')!) : null
    const longitude = searchParams.get('longitude') ? parseFloat(searchParams.get('longitude')!) : null
    const radius = parseFloat(searchParams.get('radius') || '50') // km
    const serviceType = searchParams.get('serviceType')

    const workshops = await prisma.workshop.findMany({
      where: {
        status: 'ACTIVE',
        approved: true,
        // Workshop must have completed setup (Helfer-Widget requirements)
        stripeEnabled: true,                     // Stripe payments enabled
        stripeAccountId: { not: null },          // Stripe connected
        workshopServices: { some: { isActive: true } },  // At least 1 active service
        OR: [
          // Workshop-level Google Calendar
          { googleCalendarId: { not: null }, googleAccessToken: { not: null } },
          // OR employee-level Google Calendar
          { employees: { some: { googleCalendarId: { not: null }, googleAccessToken: { not: null } } } },
        ],
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            street: true,
            zipCode: true,
            city: true,
            phone: true,
            latitude: true,
            longitude: true,
          },
        },
        reviews: {
          select: { rating: true },
        },
        workshopServices: {
          where: { isActive: true },
          select: {
            serviceType: true,
            basePrice: true,
            basePrice4: true,
            balancingPrice: true,
            storagePrice: true,
            washingPrice: true,
            durationMinutes: true,
            durationMinutes4: true,
            balancingMinutes: true,
          },
        },
        tireChangePricing: {
          where: { isActive: true },
          select: {
            rimSize: true,
            pricePerTire: true,
          },
        },
        landingPage: {
          select: {
            heroImage: true,
          },
        },
      },
    })

    // If zipCode or city provided but no lat/lng, try to geocode
    let searchLat = latitude
    let searchLng = longitude

    if ((zipCode || city) && searchLat == null) {
      const geo = await geocodeLocation(zipCode, city)
      if (geo) {
        searchLat = geo.lat
        searchLng = geo.lng
      }
    }

    // Calculate distances from search point
    let results = workshops.map(workshop => {
      const wsLat = workshop.user.latitude ? Number(workshop.user.latitude) : null
      const wsLng = workshop.user.longitude ? Number(workshop.user.longitude) : null

      let distance: number | null = null

      if (searchLat != null && searchLng != null && wsLat != null && wsLng != null) {
        distance = haversineDistance(searchLat, searchLng, wsLat, wsLng)
      }

      const ratings = workshop.reviews.map(r => r.rating)
      const averageRating = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : null

      // Build pricing object
      const pricing: Record<string, number | null> = {}
      for (const p of workshop.tireChangePricing) {
        pricing[`tireChangePrice_${p.rimSize}`] = Number(p.pricePerTire)
      }

      // Add per-service pricing from workshopServices
      // Find the relevant service (prefer searched type, fallback to WHEEL_CHANGE)
      const wheelChangeService = workshop.workshopServices.find(s => s.serviceType === 'WHEEL_CHANGE')
      if (wheelChangeService) {
        if (wheelChangeService.basePrice != null) pricing.basePrice = Number(wheelChangeService.basePrice)
        if (wheelChangeService.basePrice4 != null) pricing.basePrice4 = Number(wheelChangeService.basePrice4)
        if (wheelChangeService.balancingPrice != null) pricing.balancingPrice = Number(wheelChangeService.balancingPrice)
        if (wheelChangeService.storagePrice != null) pricing.storagePrice = Number(wheelChangeService.storagePrice)
        if (wheelChangeService.washingPrice != null) pricing.washingPrice = Number(wheelChangeService.washingPrice)
        if (wheelChangeService.durationMinutes != null) pricing.durationMinutes = Number(wheelChangeService.durationMinutes)
        if (wheelChangeService.durationMinutes4 != null) pricing.durationMinutes4 = Number(wheelChangeService.durationMinutes4)
        if (wheelChangeService.balancingMinutes != null) pricing.balancingMinutes = Number(wheelChangeService.balancingMinutes)
      }

      // Also add duration from filtered service type if different
      if (serviceType && serviceType !== 'WHEEL_CHANGE') {
        const filteredService = workshop.workshopServices.find(s => s.serviceType === serviceType)
        if (filteredService) {
          if (filteredService.basePrice != null) pricing.serviceBasePrice = Number(filteredService.basePrice)
          if (filteredService.durationMinutes != null) pricing.durationMinutes = Number(filteredService.durationMinutes)
          if (filteredService.durationMinutes4 != null) pricing.durationMinutes4 = Number(filteredService.durationMinutes4)
        }
      }

      return {
        id: workshop.id,
        name: workshop.companyName || `${workshop.user.firstName} ${workshop.user.lastName}`,
        street: workshop.user.street || '',
        zipCode: workshop.user.zipCode || '',
        city: workshop.user.city || '',
        phone: workshop.user.phone,
        latitude: wsLat,
        longitude: wsLng,
        profileImage: workshop.logoUrl,
        cardImageUrl: workshop.cardImageUrl,
        heroImage: workshop.landingPage?.heroImage ?? null,
        description: workshop.description,
        averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
        reviewCount: workshop.reviews.length,
        distance,
        services: workshop.workshopServices.map(s => s.serviceType),
        pricing,
      }
    })

    // Filter by zipCode or city text match
    if (zipCode && !searchLat) {
      results = results.filter(w => w.zipCode.startsWith(zipCode.substring(0, 2)))
    }
    if (city && !searchLat) {
      const cityLower = city.toLowerCase()
      results = results.filter(w => w.city.toLowerCase().includes(cityLower))
    }

    // Filter by radius if we have search coordinates
    if (searchLat != null && searchLng != null) {
      results = results.filter(w => w.distance !== null && w.distance <= radius)
    }

    // Filter by service type if specified
    if (serviceType) {
      results = results.filter(w => w.services.includes(serviceType))
    }

    // Sort by distance (nearest first), then by rating
    results.sort((a, b) => {
      if (a.distance !== null && b.distance !== null) return a.distance - b.distance
      if (a.distance !== null) return -1
      if (b.distance !== null) return 1
      return (b.averageRating || 0) - (a.averageRating || 0)
    })

    return NextResponse.json({ workshops: results })
  } catch (error) {
    console.error('Workshop search error:', error)
    return NextResponse.json(
      { error: 'Werkstattsuche fehlgeschlagen' },
      { status: 500 }
    )
  }
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 10) / 10
}

// Simple geocoding using Nominatim (OpenStreetMap) for German zip codes/cities
async function geocodeLocation(zipCode: string | null, city: string | null): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = zipCode ? `${zipCode}, Germany` : `${city}, Germany`
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=de`
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Bereifung24-App/1.0' },
    })
    const data = await response.json()
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
  } catch (e) {
    console.error('Geocoding error:', e)
  }
  return null
}
