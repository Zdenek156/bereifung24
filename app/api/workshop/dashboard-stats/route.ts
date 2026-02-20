import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const serviceTypeLabels: Record<string, string> = {
  WHEEL_CHANGE: 'Räderwechsel',
  TIRE_CHANGE: 'Reifenwechsel',
  TIRE_REPAIR: 'Reifenreparatur',
  MOTORCYCLE_TIRE: 'Motorrad-Reifenwechsel',
  ALIGNMENT_BOTH: 'Achsvermessung',
  CLIMATE_SERVICE: 'Klimaservice'
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

    // Zeitbereiche definieren
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)
    
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const sevenDaysFromNow = new Date(now)
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

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

      // Umsatz der letzten 7 Tage
      prisma.directBooking.aggregate({
        where: {
          workshopId: workshopId,
          createdAt: {
            gte: sevenDaysAgo
          },
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
        take: 5
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
        take: 3
      })
    ])

    // Formatiere Heute's Buchungen für Widget
    const todaysBookings = todaysBookingsList.map(booking => ({
      id: booking.id,
      time: booking.time,
      customerName: `${booking.customer.user.firstName} ${booking.customer.user.lastName}`,
      serviceType: serviceTypeLabels[booking.serviceType] || booking.serviceType,
      vehicle: `${booking.vehicle.make} ${booking.vehicle.model}`,
      status: booking.status
    }))

    // Formatiere Aktivitäten
    const recentActivities = []
    
    // Neue Buchungen
    for (const booking of recentBookings.slice(0, 3)) {
      const serviceName = serviceTypeLabels[booking.serviceType] || booking.serviceType
      const customerName = `${booking.customer.user.firstName} ${booking.customer.user.lastName}`
      recentActivities.push({
        id: `booking-${booking.id}`,
        type: 'booking',
        message: `Neue Buchung von ${customerName} - ${serviceName}`,
        time: formatTimeAgo(booking.createdAt),
        date: booking.createdAt
      })
    }

    // Zahlungen (aus bezahlten Buchungen)
    for (const booking of recentBookings.slice(0, 2)) {
      if (booking.paymentStatus === 'PAID' && booking.paidAt) {
        const amount = booking.workshopPayout ? Number(booking.workshopPayout).toFixed(2) : Number(booking.totalPrice).toFixed(2)
        recentActivities.push({
          id: `payment-${booking.id}`,
          type: 'payment',
          message: `Zahlung erhalten - ${amount} €`,
          time: formatTimeAgo(booking.paidAt),
          date: booking.paidAt
        })
      }
    }

    // Bewertungen
    for (const review of recentReviews) {
      const customerName = `${review.customer.user.firstName} ${review.customer.user.lastName}`
      recentActivities.push({
        id: `review-${review.id}`,
        type: 'review',
        message: `${review.rating}-Sterne Bewertung von ${customerName}`,
        time: formatTimeAgo(review.createdAt),
        date: review.createdAt
      })
    }

    // Sortiere Aktivitäten nach Datum (neueste zuerst)
    recentActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const stats = {
      todaysBookings: todaysBookingsCount,
      todaysBookingsList: todaysBookings,
      totalRevenue: last7DaysRevenue._sum.totalPrice ? Number(last7DaysRevenue._sum.totalPrice) : 0,
      workshopPayout: last7DaysRevenue._sum.workshopPayout ? Number(last7DaysRevenue._sum.workshopPayout) : 0,
      bookingsCount7Days: last7DaysRevenue._count.id,
      upcomingBookings: upcomingBookingsCount,
      averageRating: reviewsData._avg.rating || 0,
      totalReviews: reviewsData._count.id,
      recentActivities: recentActivities.slice(0, 6) // Max 6 Aktivitäten
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
