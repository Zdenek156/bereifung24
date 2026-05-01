import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateWorkshopRequest } from '@/lib/workshop-auth'

export const dynamic = 'force-dynamic'

const serviceTypeLabels: Record<string, string> = {
  WHEEL_CHANGE: 'Räderwechsel',
  TIRE_CHANGE: 'Reifenwechsel',
  TIRE_REPAIR: 'Reifenreparatur',
  MOTORCYCLE_TIRE: 'Motorrad-Reifenwechsel',
  ALIGNMENT_BOTH: 'Achsvermessung',
  CLIMATE_SERVICE: 'Klimaservice'
}

export async function GET(request: NextRequest) {
  console.log('🔵 Dashboard Stats API aufgerufen')
  
  try {
    const auth = await authenticateWorkshopRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workshopId = auth.workshopId

    // Workshop-Name laden
    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      select: { companyName: true }
    })

    // Revenue period from query param
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d'

    // Zeitbereiche definieren
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)
    
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const sevenDaysFromNow = new Date(now)
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    // Revenue period date range
    let revenueStartDate: Date | undefined
    if (period === '1d') {
      revenueStartDate = todayStart
    } else if (period === '7d') {
      revenueStartDate = sevenDaysAgo
    } else if (period === '30d') {
      revenueStartDate = new Date(now)
      revenueStartDate.setDate(revenueStartDate.getDate() - 30)
    } else if (period === '365d') {
      revenueStartDate = new Date(now)
      revenueStartDate.setFullYear(revenueStartDate.getFullYear() - 1)
    }
    // period === 'all' → revenueStartDate stays undefined (no date filter)

    // Parallelisiere alle Datenbankabfragen für Performance
    const [
      todaysBookingsCount,
      todaysBookingsList,
      last7DaysRevenue,
      upcomingBookingsCount,
      reviewsData,
      recentBookings,
      recentReviews
    ] = await Promise.all([
      // Heute's Buchungen (Anzahl)
      prisma.directBooking.count({
        where: {
          workshopId: workshopId,
          date: {
            gte: todayStart,
            lt: todayEnd
          },
          status: {
            in: ['CONFIRMED', 'COMPLETED']
          }
        }
      }),

      // Heute's Buchungen (Details für Widget)
      prisma.directBooking.findMany({
        where: {
          workshopId: workshopId,
          date: {
            gte: todayStart,
            lt: todayEnd
          },
          status: {
            in: ['CONFIRMED', 'COMPLETED']
          }
        },
        include: {
          customer: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          vehicle: {
            select: {
              make: true,
              model: true
            }
          }
        },
        orderBy: { time: 'asc' },
        take: 10
      }),

      // Umsatz für den gewählten Zeitraum
      prisma.directBooking.aggregate({
        where: {
          workshopId: workshopId,
          ...(revenueStartDate ? { createdAt: { gte: revenueStartDate } } : {}),
          status: {
            in: ['CONFIRMED', 'COMPLETED']
          }
        },
        _sum: {
          totalPrice: true,
          workshopPayout: true
        },
        _count: {
          id: true
        }
      }),

      // Kommende Buchungen (nächste 7 Tage)
      prisma.directBooking.count({
        where: {
          workshopId: workshopId,
          date: {
            gte: now,
            lt: sevenDaysFromNow
          },
          status: {
            in: ['CONFIRMED', 'RESERVED']
          }
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

      // Neueste Buchungen für Aktivitäten
      prisma.directBooking.findMany({
        where: {
          workshopId: workshopId
        },
        include: {
          customer: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 15
      }),

      // Neueste Bewertungen
      prisma.review.findMany({
        where: {
          workshopId: workshopId
        },
        include: {
          customer: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ])

    // Formatiere Heute's Buchungen für Widget
    const todaysBookings = todaysBookingsList.map(booking => ({
      id: booking.id,
      time: booking.time,
      customerName: booking.customer?.user
        ? `${booking.customer.user.firstName} ${booking.customer.user.lastName}`
        : 'Unbekannter Kunde',
      serviceType: serviceTypeLabels[booking.serviceType] || booking.serviceType,
      vehicle: booking.vehicle
        ? `${booking.vehicle.make} ${booking.vehicle.model}`
        : '',
      status: booking.status
    }))

    // Formatiere Aktivitäten
    const recentActivities = []
    
    // Neue Buchungen
    for (const booking of recentBookings) {
      const serviceName = serviceTypeLabels[booking.serviceType] || booking.serviceType
      const customerName = booking.customer?.user
        ? `${booking.customer.user.firstName} ${booking.customer.user.lastName}`
        : 'Unbekannter Kunde'
      recentActivities.push({
        id: `booking-${booking.id}`,
        type: 'booking',
        message: `Neue Buchung von ${customerName} - ${serviceName}`,
        time: formatTimeAgo(booking.createdAt),
        date: booking.createdAt,
        createdAt: booking.createdAt,
        payload: { customerName, serviceName }
      })
    }

    // Zahlungen (aus bezahlten Buchungen - Workshop-Auszahlung anzeigen)
    for (const booking of recentBookings) {
      if (booking.paymentStatus === 'PAID' && booking.paidAt && booking.workshopPayout) {
        const amount = Number(booking.workshopPayout).toFixed(2)
        recentActivities.push({
          id: `payment-${booking.id}`,
          type: 'payment',
          message: `Auszahlung erhalten - ${amount} €`,
          time: formatTimeAgo(booking.paidAt),
          date: booking.paidAt,
          createdAt: booking.paidAt,
          payload: { amount }
        })
      }
    }

    // Bewertungen
    for (const review of recentReviews) {
      const customerName = review.customer?.user ? `${review.customer.user.firstName} ${review.customer.user.lastName}` : 'Ehem. Kunde'
      recentActivities.push({
        id: `review-${review.id}`,
        type: 'review',
        message: `${review.rating}-Sterne Bewertung von ${customerName}`,
        time: formatTimeAgo(review.createdAt),
        date: review.createdAt,
        createdAt: review.createdAt,
        payload: { customerName, rating: review.rating }
      })
    }

    // Sortiere Aktivitäten nach Datum (neueste zuerst)
    recentActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const stats = {
      workshopName: workshop?.companyName ?? '',
      todaysBookings: todaysBookingsCount,
      todaysBookings_list: todaysBookings,
      totalRevenue: last7DaysRevenue._sum.totalPrice ? Number(last7DaysRevenue._sum.totalPrice) : 0,
      revenue7Days: last7DaysRevenue._sum.totalPrice ? Number(last7DaysRevenue._sum.totalPrice) : 0,
      workshopPayout: last7DaysRevenue._sum.workshopPayout ? Number(last7DaysRevenue._sum.workshopPayout) : 0,
      bookingsCount7Days: last7DaysRevenue._count.id,
      revenue7DaysCount: last7DaysRevenue._count.id,
      upcomingBookings: upcomingBookingsCount,
      averageRating: reviewsData._avg.rating || 0,
      totalReviews: reviewsData._count.id,
      revenueperiod: period,
      recentActivities: recentActivities.slice(0, 20) // Max 20 Aktivitäten
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('❌ CRITICAL ERROR in dashboard-stats:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error)
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
