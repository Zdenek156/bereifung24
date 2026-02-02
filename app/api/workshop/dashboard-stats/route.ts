import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateDistance } from '@/lib/geocoding'

export const dynamic = 'force-dynamic'

// Helper function to detect service type from request
function detectServiceType(request: {
  additionalNotes?: string | null
  width: number
  aspectRatio: number
  diameter: number
}): string {
  const notes = request.additionalNotes || ''
  
  if (notes.includes('🏍️ MOTORRADREIFEN')) return 'MOTORCYCLE_TIRE'
  if (notes.includes('🔧 REIFENREPARATUR')) return 'TIRE_REPAIR'
  if (notes.includes('ACHSVERMESSUNG')) return 'ALIGNMENT_BOTH'
  if (notes.includes('BREMSEN-SERVICE')) return 'BRAKE_SERVICE'
  if (notes.includes('BATTERIE-SERVICE')) return 'BATTERY_SERVICE'
  if (notes.includes('KLIMASERVICE')) return 'CLIMATE_SERVICE'
  if (notes.includes('🔧 SONSTIGE REIFENSERVICES')) return 'OTHER_SERVICES'
  
  if (request.width === 0 && request.aspectRatio === 0 && request.diameter === 0) {
    return 'WHEEL_CHANGE'
  }
  
  return 'TIRE_CHANGE'
}

export async function GET() {
  console.log('🔵 Dashboard Stats API aufgerufen')
  
  try {
    console.log('🔍 Hole Session...')
    const session = await getServerSession(authOptions)

    console.log('📊 Dashboard Stats - Session:', session ? { id: session.user.id, email: session.user.email, role: session.user.role } : 'NO SESSION')

    if (!session || session.user.role !== 'WORKSHOP') {
      console.log('❌ Dashboard Stats - Unauthorized:', { hasSession: !!session, role: session?.user?.role })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Hole Workshop-Profil
    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
    }

    const workshopId = workshop.id

    // Parallelisiere alle Datenbankabfragen für Performance
    const [
      allOffersCount,
      pendingOffersCount,
      acceptedOffersCount,
      upcomingAppointmentsCount,
      revenueData,
      reviewsData,
      recentActivitiesData
    ] = await Promise.all([
      // Alle Angebote des Workshops (für neue Anfragen)
      prisma.offer.count({
        where: {
          workshopId: workshopId
        }
      }),

      // Ausstehende Angebote (von uns gesendet, noch nicht akzeptiert/abgelehnt)
      prisma.offer.count({
        where: {
          workshopId: workshopId,
          status: 'PENDING'
        }
      }),

      // Akzeptierte Angebote
      prisma.offer.count({
        where: {
          workshopId: workshopId,
          status: 'ACCEPTED'
        }
      }),

      // Bevorstehende Termine
      prisma.booking.count({
        where: {
          workshopId: workshopId,
          status: {
            in: ['CONFIRMED', 'PENDING']
          },
          appointmentDate: {
            gte: new Date()
          }
        }
      }),

      // Umsatz (aus abgeschlossenen Buchungen - über Offers)
      prisma.offer.aggregate({
        where: {
          workshopId: workshopId,
          status: 'ACCEPTED',
          booking: {
            status: 'COMPLETED'
          }
        },
        _sum: {
          price: true
        }
      }),

      // Bewertungen
      prisma.review.aggregate({
        where: {
          workshopId: workshopId
        },
        _avg: {
          rating: true
        },
        _count: {
          id: true
        }
      }),

      // Letzte Aktivitäten (gemischt)
      Promise.all([
        // Neueste Anfrage
        prisma.tireRequest.findFirst({
          where: {
            offers: {
              some: {
                workshopId: workshopId
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            createdAt: true,
            season: true,
            width: true,
            diameter: true,
            additionalNotes: true
          }
        }),
        // Neuestes akzeptiertes Angebot
        prisma.offer.findFirst({
          where: {
            workshopId: workshopId,
            status: 'ACCEPTED'
          },
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: {
            id: true,
            updatedAt: true,
            tireRequest: {
              select: {
                vehicle: {
                  select: {
                    make: true,
                    model: true
                  }
                }
              }
            }
          }
        }),
        // Nächster Termin
        prisma.booking.findFirst({
          where: {
            workshopId: workshopId,
            status: {
              in: ['CONFIRMED', 'PENDING']
            },
            appointmentDate: {
              gte: new Date()
            }
          },
          orderBy: { appointmentDate: 'asc' },
          take: 1,
          select: {
            id: true,
            appointmentDate: true
          }
        }),
        // Neueste Bewertung
        prisma.review.findFirst({
          where: {
            workshopId: workshopId
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            rating: true,
            createdAt: true,
            customer: {
              select: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        })
      ])
    ])

    // Berechne "Neue Anfragen" mit der gleichen Logik wie /api/workshop/tire-requests
    // Hole Workshop mit Services und Koordinaten
    const workshopWithServices = await prisma.workshop.findUnique({
      where: { id: workshopId },
      include: {
        user: {
          select: {
            latitude: true,
            longitude: true
          }
        },
        workshopServices: {
          where: { isActive: true },
          include: {
            servicePackages: {
              where: { isActive: true }
            }
          }
        }
      }
    })

    let newRequestsCount = 0

    if (workshopWithServices && workshopWithServices.user.latitude && workshopWithServices.user.longitude) {
      // Hole konfigurierte Service-Typen
      const configuredServiceTypes = workshopWithServices.workshopServices
        .filter(service => {
          if (!service.isActive) return false
          
          if (service.serviceType === 'WHEEL_CHANGE') {
            return service.basePrice && service.basePrice > 0 && 
                   service.durationMinutes && service.durationMinutes > 0
          }
          
          return service.servicePackages.length > 0 &&
                 service.servicePackages.some(pkg => 
                   pkg.isActive && 
                   pkg.price > 0 && 
                   pkg.durationMinutes > 0
                 )
        })
        .map(service => service.serviceType)

      if (configuredServiceTypes.length > 0) {
        // Hole alle offenen Anfragen mit Koordinaten
        const tomorrow = new Date()
        tomorrow.setHours(0, 0, 0, 0)
        tomorrow.setDate(tomorrow.getDate() + 1)
        
        const allRequests = await prisma.tireRequest.findMany({
          where: {
            status: {
              in: ['PENDING', 'OPEN', 'QUOTED']
            },
            needByDate: {
              gte: tomorrow
            },
            // Nur Anfragen MIT Koordinaten
            latitude: { not: null },
            longitude: { not: null }
          },
          select: {
            id: true,
            latitude: true,
            longitude: true,
            radiusKm: true,
            additionalNotes: true,
            width: true,
            aspectRatio: true,
            diameter: true,
            offers: {
              where: { workshopId: workshopId },
              select: { id: true }
            }
          }
        })

        // Filter nach Umkreis und Service-Typ
        const filteredRequests = allRequests.filter(request => {
          // Skip wenn bereits Angebot erstellt
          if (request.offers.length > 0) return false

          // Prüfe Distanz
          const distance = calculateDistance(
            workshopWithServices.user.latitude!,
            workshopWithServices.user.longitude!,
            request.latitude!,
            request.longitude!
          )

          if (distance > request.radiusKm) return false

          // Prüfe Service-Typ
          const serviceType = detectServiceType({
            additionalNotes: request.additionalNotes,
            width: request.width,
            aspectRatio: request.aspectRatio,
            diameter: request.diameter
          })

          return configuredServiceTypes.includes(serviceType)
        })

        newRequestsCount = filteredRequests.length
      }
    }

    // Berechne Konversionsrate
    const conversionRate = allOffersCount > 0 
      ? Math.round((acceptedOffersCount / allOffersCount) * 100) 
      : 0

    // Formatiere Aktivitäten mit Datum für Sortierung
    const recentActivities = []
    
    if (recentActivitiesData[0]) {
      const req = recentActivitiesData[0]
      // Erkenne Service-Typ aus additionalNotes
      const isWheelChange = req.additionalNotes?.includes('RÄDER UMSTECKEN')
      const serviceName = isWheelChange ? 'Räder umstecken' : 'Reifenwechsel'
      const sizeInfo = isWheelChange ? '' : ` (${req.width}/${req.diameter})`
      
      recentActivities.push({
        id: req.id,
        type: 'request',
        message: `Neue Anfrage für ${serviceName}${sizeInfo}`,
        time: formatTimeAgo(req.createdAt),
        date: req.createdAt
      })
    }

    if (recentActivitiesData[1]) {
      const offer = recentActivitiesData[1]
      const vehicle = offer.tireRequest.vehicle
      recentActivities.push({
        id: offer.id,
        type: 'offer_accepted',
        message: `Ihr Angebot wurde angenommen - ${vehicle?.make || 'Fahrzeug'} ${vehicle?.model || ''}`,
        time: formatTimeAgo(offer.updatedAt),
        date: offer.updatedAt
      })
    }

    if (recentActivitiesData[2]) {
      const booking = recentActivitiesData[2]
      recentActivities.push({
        id: booking.id,
        type: 'appointment',
        message: `Termin am ${formatDate(booking.appointmentDate)}`,
        time: formatTimeAgo(booking.appointmentDate),
        date: booking.appointmentDate
      })
    }

    if (recentActivitiesData[3]) {
      const review = recentActivitiesData[3]
      const customerName = review.customer?.user 
        ? `${review.customer.user.firstName} ${review.customer.user.lastName}`
        : 'Kunde'
      recentActivities.push({
        id: review.id,
        type: 'review',
        message: `Neue ${review.rating}-Sterne Bewertung von ${customerName}`,
        time: formatTimeAgo(review.createdAt),
        date: review.createdAt
      })
    }

    // Sortiere Aktivitäten nach Datum (neueste zuerst)
    recentActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const stats = {
      newRequests: newRequestsCount,
      pendingOffers: pendingOffersCount,
      acceptedOffers: acceptedOffersCount,
      upcomingAppointments: upcomingAppointmentsCount,
      totalRevenue: revenueData._sum.price || 0,
      averageRating: reviewsData._avg.rating || 0,
      totalReviews: reviewsData._count.id,
      conversionRate: conversionRate,
      recentActivities: recentActivities
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('❌ CRITICAL ERROR in dashboard-stats:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('❌ Error message:', error instanceof Error ? error.message : String(error))
    console.error('❌ Error type:', typeof error)
    console.error('❌ Error constructor:', error?.constructor?.name)
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error),
        type: error?.constructor?.name || typeof error
      },
      { status: 500 }
    )
  }
}

// Hilfsfunktionen
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const targetDate = new Date(date)
  const diff = now.getTime() - targetDate.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  // Zukünftige Termine (negative Differenz)
  if (diff < 0) {
    const absMinutes = Math.abs(minutes)
    const absHours = Math.abs(hours)
    const absDays = Math.abs(days)

    if (absMinutes < 60) {
      return `In ${absMinutes} Minute${absMinutes !== 1 ? 'n' : ''}`
    } else if (absHours < 24) {
      return `In ${absHours} Stunde${absHours !== 1 ? 'n' : ''}`
    } else {
      return `In ${absDays} Tag${absDays !== 1 ? 'en' : ''}`
    }
  }

  // Vergangene Ereignisse
  if (minutes < 60) {
    return `Vor ${minutes} Minute${minutes !== 1 ? 'n' : ''}`
  } else if (hours < 24) {
    return `Vor ${hours} Stunde${hours !== 1 ? 'n' : ''}`
  } else {
    return `Vor ${days} Tag${days !== 1 ? 'en' : ''}`
  }
}

function formatDate(date: Date): string {
  const d = new Date(date)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Setze Stunden auf 0 für Vergleich
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate())

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return `heute ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')} Uhr`
  } else if (dateOnly.getTime() === tomorrowOnly.getTime()) {
    return `morgen ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')} Uhr`
  } else {
    return d.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}
