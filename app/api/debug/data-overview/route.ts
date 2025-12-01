import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check TireRequests
    const tireRequests = await prisma.tireRequest.findMany({
      select: {
        id: true,
        status: true,
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
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    })

    // Check Offers
    const offers = await prisma.offer.findMany({
      select: {
        id: true,
        status: true,
        price: true,
        acceptedAt: true,
        createdAt: true,
        tireRequest: {
          select: {
            id: true,
            status: true
          }
        },
        workshop: {
          select: {
            companyName: true
          }
        }
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    })

    // Check Bookings
    const bookings = await prisma.booking.findMany({
      select: {
        id: true,
        status: true,
        offerId: true,
        appointmentDate: true,
        completedAt: true,
        createdAt: true
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    })

    // Count by status
    const offerStatusCounts: Record<string, number> = {}
    offers.forEach(o => {
      offerStatusCounts[o.status] = (offerStatusCounts[o.status] || 0) + 1
    })

    const requestStatusCounts: Record<string, number> = {}
    tireRequests.forEach(r => {
      requestStatusCounts[r.status] = (requestStatusCounts[r.status] || 0) + 1
    })

    return NextResponse.json({
      summary: {
        totalTireRequests: tireRequests.length,
        totalOffers: offers.length,
        totalBookings: bookings.length,
        requestStatusCounts,
        offerStatusCounts
      },
      tireRequests: tireRequests.map(r => ({
        id: r.id.substring(0, 8) + '...',
        status: r.status,
        customer: `${r.customer.user.firstName} ${r.customer.user.lastName}`,
        createdAt: r.createdAt
      })),
      offers: offers.map(o => ({
        id: o.id.substring(0, 8) + '...',
        status: o.status,
        price: o.price,
        workshop: o.workshop.companyName,
        requestStatus: o.tireRequest.status,
        acceptedAt: o.acceptedAt,
        createdAt: o.createdAt
      })),
      bookings: bookings.map(b => ({
        id: b.id.substring(0, 8) + '...',
        status: b.status,
        offerId: b.offerId ? b.offerId.substring(0, 8) + '...' : null,
        appointmentDate: b.appointmentDate,
        completedAt: b.completedAt,
        createdAt: b.createdAt
      }))
    })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
