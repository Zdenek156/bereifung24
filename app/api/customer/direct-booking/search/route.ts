import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/customer/direct-booking/search
 * Search workshops for direct booking (WHEEL_CHANGE)
 * 
 * Body:
 * {
 *   vehicleId: string,
 *   hasBalancing: boolean,
 *   hasStorage: boolean,
 *   radiusKm: number,
 *   customerLat: number,
 *   customerLon: number
 * }
 * 
 * Returns:
 * {
 *   workshops: Array<{
 *     id, name, address, distance,
 *     rating, reviewCount,
 *     openingHours,
 *     basePrice, balancingPrice, storagePrice, totalPrice,
 *     estimatedDuration
 *   }>
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      vehicleId,
      hasBalancing,
      hasStorage,
      radiusKm,
      customerLat,
      customerLon
    } = body

    // Validate input
    if (!vehicleId || customerLat === undefined || customerLon === undefined) {
      return NextResponse.json(
        { error: 'Fehlende Parameter: vehicleId, customerLat, customerLon erforderlich' },
        { status: 400 }
      )
    }

    // Get vehicle to verify ownership
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    })

    if (!vehicle || vehicle.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Fahrzeug nicht gefunden oder keine Berechtigung' },
        { status: 404 }
      )
    }

    // Find workshops with WHEEL_CHANGE service in radius
    const workshops = await prisma.workshop.findMany({
      where: {
        active: true,
        workshopServices: {
          some: {
            serviceType: 'WHEEL_CHANGE',
            isActive: true
          }
        }
      },
      include: {
        workshopServices: {
          where: {
            serviceType: 'WHEEL_CHANGE',
            isActive: true
          }
        },
        bookings: {
          where: {
            review: { not: null }
          },
          select: {
            tireRating: true,
            review: true
          }
        }
      }
    })

    // Calculate distance and filter by radius
    const workshopsWithDistance = workshops
      .map(workshop => {
        const service = workshop.workshopServices[0]
        
        // Haversine formula for distance calculation
        const lat1 = customerLat
        const lon1 = customerLon
        const lat2 = workshop.latitude
        const lon2 = workshop.longitude
        
        const R = 6371 // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        const distance = R * c

        // Calculate prices
        const basePrice = service.basePrice || 0
        const balancingPricePerTire = hasBalancing ? (service.balancingPrice || 0) : 0
        const totalBalancingPrice = balancingPricePerTire * 4 // 4 Räder
        const storagePriceTotal = hasStorage ? (service.storagePrice || 0) : 0
        const totalPrice = basePrice + totalBalancingPrice + storagePriceTotal

        // Calculate estimated duration
        const baseDuration = service.durationMinutes || 30
        const balancingDuration = hasBalancing ? (service.balancingMinutes || 0) * 4 : 0
        const estimatedDuration = baseDuration + balancingDuration

        // Calculate rating
        const reviews = workshop.bookings.filter(b => b.tireRating)
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, b) => sum + (b.tireRating || 0), 0) / reviews.length
          : 0

        return {
          id: workshop.id,
          name: workshop.name,
          address: workshop.address,
          city: workshop.city,
          postalCode: workshop.postalCode,
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal
          
          // Pricing
          basePrice,
          balancingPricePerTire,
          totalBalancingPrice,
          storagePriceTotal,
          totalPrice,
          
          // Duration
          estimatedDuration,
          
          // Rating
          rating: Math.round(avgRating * 10) / 10,
          reviewCount: reviews.length,
          
          // Opening Hours
          openingHours: workshop.openingHours || null,
          
          // Contact
          phone: workshop.phoneNumber,
          email: workshop.email
        }
      })
      .filter(w => radiusKm === undefined || w.distance <= radiusKm)
      .sort((a, b) => {
        // Sort by: 1. Rating (desc), 2. Distance (asc)
        if (Math.abs(a.rating - b.rating) > 0.5) {
          return b.rating - a.rating
        }
        return a.distance - b.distance
      })

    return NextResponse.json({
      success: true,
      workshops: workshopsWithDistance
    })

  } catch (error) {
    console.error('Error searching workshops:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Werkstatt-Suche' },
      { status: 500 }
    )
  }
}
