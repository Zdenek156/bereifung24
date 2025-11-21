import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateDistance } from '@/lib/geocoding'

// GET - Workshop holt verfügbare Anfragen in ihrer Nähe
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Hole Workshop-Profil
    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id },
      include: { 
        user: {
          select: {
            id: true,
            latitude: true,
            longitude: true
          }
        }
      }
    })

    if (!workshop) {
      return NextResponse.json(
        { error: 'Workshop nicht gefunden' },
        { status: 404 }
      )
    }

    // Hole alle offenen Anfragen
    const allRequests = await prisma.tireRequest.findMany({
      where: {
        status: {
          in: ['PENDING', 'QUOTED'] // Anfragen die noch offen sind oder bereits Angebote haben
        }
      },
      select: {
        id: true,
        season: true,
        width: true,
        aspectRatio: true,
        diameter: true,
        loadIndex: true,
        speedRating: true,
        isRunflat: true,
        quantity: true,
        preferredBrands: true,
        additionalNotes: true,
        needByDate: true,
        zipCode: true,
        radiusKm: true,
        latitude: true,
        longitude: true,
        status: true,
        createdAt: true,
        vehicle: {
          select: {
            make: true,
            model: true,
            year: true
          }
        },
        customer: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                zipCode: true,
                city: true
              }
            }
          }
        },
        offers: {
          where: {
            workshopId: workshop.id
          },
          select: {
            id: true,
            status: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            offers: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Filter nach Umkreis wenn Workshop-Koordinaten vorhanden
    let filteredRequests = allRequests

    if (workshop.user.latitude !== null && workshop.user.longitude !== null) {
      filteredRequests = allRequests
        .filter(request => {
          // Zeige Anfragen ohne Koordinaten nicht
          if (request.latitude === null || request.longitude === null) {
            return false
          }

          // Berechne Distanz
          const distance = calculateDistance(
            workshop.user.latitude!,
            workshop.user.longitude!,
            request.latitude,
            request.longitude
          )

          // Filter nach radiusKm der Anfrage
          return distance <= request.radiusKm
        })
        .map(request => ({
          ...request,
          vehicleInfo: request.vehicle ? `${request.vehicle.make} ${request.vehicle.model} (${request.vehicle.year})` : undefined,
          vehicle: undefined, // Remove vehicle object after formatting
          distance: calculateDistance(
            workshop.user.latitude!,
            workshop.user.longitude!,
            request.latitude!,
            request.longitude!
          )
        }))
        .sort((a, b) => a.distance - b.distance)
    } else {
      // Wenn Workshop keine Koordinaten hat, zeige alle Anfragen
      console.warn(`Workshop ${workshop.id} has no coordinates - showing all requests`)
    }

    return NextResponse.json({ requests: filteredRequests })
  } catch (error) {
    console.error('Tire requests fetch error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Anfragen' },
      { status: 500 }
    )
  }
}
