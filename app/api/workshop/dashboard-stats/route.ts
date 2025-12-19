import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'WORKSHOP') {
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

      // Umsatz (aus abgeschlossenen Buchungen)
      prisma.booking.aggregate({
        where: {
          workshopId: workshopId,
          status: 'COMPLETED'
        },
        _sum: {
          totalPrice: true
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
            diameter: true
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

    // Berechne "Neue Anfragen" = Angebote wo der Workshop noch nicht gesendet hat
    // Das ist die gleiche Logik wie auf der Browse-Requests Seite
    const allRequestsAvailable = await prisma.tireRequest.count({
      where: {
        status: {
          in: ['PENDING', 'OPEN', 'QUOTED']
        },
        needByDate: {
          gte: new Date()
        }
      }
    })

    const newRequestsCount = Math.max(0, allRequestsAvailable - allOffersCount)

    // Berechne Konversionsrate
    const conversionRate = allOffersCount > 0 
      ? Math.round((acceptedOffersCount / allOffersCount) * 100) 
      : 0

    // Formatiere Aktivitäten
    const recentActivities = []
    
    if (recentActivitiesData[0]) {
      const req = recentActivitiesData[0]
      recentActivities.push({
        id: req.id,
        type: 'request',
        message: `Neue Anfrage für Reifenwechsel (${req.width}/${req.diameter})`,
        time: formatTimeAgo(req.createdAt)
      })
    }

    if (recentActivitiesData[1]) {
      const offer = recentActivitiesData[1]
      const vehicle = offer.tireRequest.vehicle
      recentActivities.push({
        id: offer.id,
        type: 'offer_accepted',
        message: `Ihr Angebot wurde angenommen - ${vehicle?.make || 'Fahrzeug'} ${vehicle?.model || ''}`,
        time: formatTimeAgo(offer.updatedAt)
      })
    }

    if (recentActivitiesData[2]) {
      const booking = recentActivitiesData[2]
      recentActivities.push({
        id: booking.id,
        type: 'appointment',
        message: `Termin am ${formatDate(booking.appointmentDate)}`,
        time: formatTimeAgo(booking.appointmentDate)
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
        time: formatTimeAgo(review.createdAt)
      })
    }

    const stats = {
      newRequests: newRequestsCount,
      pendingOffers: pendingOffersCount,
      acceptedOffers: acceptedOffersCount,
      upcomingAppointments: upcomingAppointmentsCount,
      totalRevenue: revenueData._sum.totalPrice || 0,
      averageRating: reviewsData._avg.rating || 0,
      totalReviews: reviewsData._count.id,
      conversionRate: conversionRate,
      recentActivities: recentActivities
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching workshop dashboard stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Hilfsfunktionen
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

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
