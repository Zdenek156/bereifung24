import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all bookings with offers
    const bookings = await prisma.booking.findMany({
      where: {
        offer: {
          isNot: null
        }
      },
      select: {
        id: true,
        status: true,
        appointmentDate: true,
        completedAt: true,
        createdAt: true,
        workshop: {
          select: {
            companyName: true,
            gocardlessMandateId: true,
            gocardlessMandateStatus: true
          }
        },
        offer: {
          select: {
            price: true,
            status: true
          }
        }
      },
      take: 20,
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Count by status
    const statusCounts: Record<string, number> = {}
    bookings.forEach(b => {
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1
    })

    return NextResponse.json({
      total: bookings.length,
      statusCounts,
      bookings: bookings.map(b => ({
        id: b.id.substring(0, 8) + '...',
        workshop: b.workshop.companyName,
        bookingStatus: b.status,
        offerStatus: b.offer.status,
        price: b.offer.price,
        appointmentDate: b.appointmentDate,
        completedAt: b.completedAt,
        createdAt: b.createdAt,
        hasSepaMandate: !!b.workshop.gocardlessMandateId,
        sepaMandateStatus: b.workshop.gocardlessMandateStatus
      }))
    })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
