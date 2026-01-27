import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateDistance } from '@/lib/geocoding'

// Helper function to detect service type from request
// This matches the logic in app/dashboard/workshop/browse-requests/page.tsx
function detectServiceType(request: {
  additionalNotes?: string | null
  width: number
  aspectRatio: number
  diameter: number
}): string {
  const notes = request.additionalNotes || ''
  
  // Check for specific service markers in additionalNotes
  if (notes.includes('🏍️ MOTORRADREIFEN')) return 'MOTORCYCLE_TIRE'
  if (notes.includes('🔧 REIFENREPARATUR')) return 'TIRE_REPAIR'
  if (notes.includes('ACHSVERMESSUNG')) return 'ALIGNMENT_BOTH'
  if (notes.includes('BREMSEN-SERVICE')) return 'BRAKE_SERVICE'
  if (notes.includes('BATTERIE-SERVICE')) return 'BATTERY_SERVICE'
  if (notes.includes('KLIMASERVICE')) return 'CLIMATE_SERVICE'
  if (notes.includes('🔧 SONSTIGE REIFENSERVICES')) return 'OTHER_SERVICES'
  
  // Check for wheel change (width/aspectRatio/diameter all 0, but AFTER checking additionalNotes)
  if (request.width === 0 && request.aspectRatio === 0 && request.diameter === 0) {
    return 'WHEEL_CHANGE'
  }
  
  // Default: Tire change
  return 'TIRE_CHANGE'
}

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

    // Hole Workshop-Profil mit konfigurierten Services
    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id },
      include: { 
        user: {
          select: {
            id: true,
            latitude: true,
            longitude: true
          }
        },
        workshopServices: {
          where: {
            isActive: true
          },
          include: {
            servicePackages: {
              where: {
                isActive: true
              }
            }
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

    // Get list of configured service types that have at least one active package with price and duration
    const configuredServiceTypes = workshop.workshopServices
      .filter(service => {
        // Service must be active and have at least one package with price and duration configured
        return service.isActive && 
               service.servicePackages.length > 0 &&
               service.servicePackages.some(pkg => 
                 pkg.isActive && 
                 pkg.price > 0 && 
                 pkg.durationMinutes > 0
               )
      })
      .map(service => service.serviceType)

    // If workshop has no configured services, return empty array
    if (configuredServiceTypes.length === 0) {
      console.log(`Workshop ${workshop.id} has no configured service packages - showing no requests`)
      return NextResponse.json({ requests: [] })
    }

    console.log(`Workshop ${workshop.id} configured services:`, configuredServiceTypes)

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

    // Filter by configured service types
    // Only show requests for services the workshop has configured with active packages
    const serviceFilteredRequests = filteredRequests.filter(request => {
      const serviceType = detectServiceType({
        additionalNotes: request.additionalNotes,
        width: request.width,
        aspectRatio: request.aspectRatio,
        diameter: request.diameter
      })
      
      const hasService = configuredServiceTypes.includes(serviceType)
      
      if (!hasService) {
        console.log(`Filtering out request ${request.id} - serviceType ${serviceType} not configured`)
      }
      
      return hasService
    })

    console.log(`Filtered ${filteredRequests.length} requests down to ${serviceFilteredRequests.length} based on configured services`)

    return NextResponse.json({ requests: serviceFilteredRequests })
  } catch (error) {
    console.error('Tire requests fetch error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Anfragen' },
      { status: 500 }
    )
  }
}
