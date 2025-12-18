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

    // Hole alle offenen Anfragen (nur die, deren needByDate noch nicht abgelaufen ist)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Setze auf Mitternacht für korrekten Vergleich
    
    const allRequests = await prisma.tireRequest.findMany({
      where: {
        status: {
          in: ['PENDING', 'OPEN', 'QUOTED'] // Anfragen die noch offen sind oder bereits Angebote haben
        },
        needByDate: {
          gte: today // Nur Anfragen zeigen, deren Datum noch nicht abgelaufen ist
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
        city: true,
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
            createdAt: true,
            tireOptions: {
              select: {
                carTireType: true
              }
            }
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
          // Wenn Anfrage keine Koordinaten hat, zeige sie trotzdem an (PLZ/Stadt-Matching)
          if (request.latitude === null || request.longitude === null) {
            console.warn(`Request ${request.id} has no coordinates - showing anyway`)
            return true // Zeige Anfragen ohne Koordinaten an
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
        .map(request => {
          const requestWithVehicle = request as typeof request & { 
            vehicle: { make: string; model: string; year: number } | null 
          }
          
          const vehicleInfo = requestWithVehicle.vehicle 
            ? `${requestWithVehicle.vehicle.make} ${requestWithVehicle.vehicle.model} (${requestWithVehicle.vehicle.year})`
            : undefined
          
          // Remove vehicle object and add formatted string
          const { vehicle, ...requestWithoutVehicle } = requestWithVehicle
          
          // Berechne Distanz nur wenn beide Koordinaten vorhanden
          let distance = 999 // Default für Anfragen ohne Koordinaten (werden ans Ende sortiert)
          if (request.latitude !== null && request.longitude !== null) {
            distance = calculateDistance(
              workshop.user.latitude!,
              workshop.user.longitude!,
              request.latitude,
              request.longitude
            )
          }
          
          return {
            ...requestWithoutVehicle,
            vehicle: null,
            vehicleInfo,
            distance
          }
        })
        .sort((a, b) => a.distance - b.distance)
    } else {
      // Wenn Workshop keine Koordinaten hat, zeige alle Anfragen
      console.warn(`Workshop ${workshop.id} has no coordinates - showing all requests`)
      
      // Format vehicle info auch für Anfragen ohne Koordinaten-Filter
      filteredRequests = allRequests.map(request => {
        const requestWithVehicle = request as typeof request & { 
          vehicle: { make: string; model: string; year: number } | null 
        }
        
        const vehicleInfo = requestWithVehicle.vehicle 
          ? `${requestWithVehicle.vehicle.make} ${requestWithVehicle.vehicle.model} (${requestWithVehicle.vehicle.year})`
          : undefined
        
        // Remove vehicle object and add formatted string
        const { vehicle, ...requestWithoutVehicle } = requestWithVehicle
        
        return {
          ...requestWithoutVehicle,
          vehicle: null,
          vehicleInfo,
          distance: 0 // Keine Distanz wenn Workshop keine Koordinaten hat
        }
      })
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
