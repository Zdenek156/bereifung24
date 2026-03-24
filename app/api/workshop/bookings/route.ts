import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateWorkshopRequest } from '@/lib/workshop-auth'

/**
 * GET /api/workshop/bookings
 * Get all DirectBookings for the workshop
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateWorkshopRequest(request)
    if (!auth) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Get search params for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Build where clause
    const where: any = {
      workshopId: auth.workshopId
    }

    if (status && status !== 'all') {
      if (status === 'upcoming') {
        // Bevorstehend: date >= today AND status CONFIRMED or RESERVED
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        where.date = { gte: todayStart }
        where.status = { in: ['CONFIRMED', 'RESERVED'] }
      } else {
        where.status = status.toUpperCase()
      }
    }

    // Fetch bookings with related data
    const bookings = await prisma.directBooking.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                street: true,
                city: true,
                zipCode: true
              }
            }
          }
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            licensePlate: true
          }
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { time: 'desc' }
      ]
    })

    // Convert Decimal fields to numbers
    const bookingsData = bookings.map(booking => ({
      ...booking,
      basePrice: Number(booking.basePrice),
      balancingPrice: booking.balancingPrice ? Number(booking.balancingPrice) : null,
      storagePrice: booking.storagePrice ? Number(booking.storagePrice) : null,
      disposalFee: booking.disposalFee ? Number(booking.disposalFee) : null,
      runFlatSurcharge: booking.runFlatSurcharge ? Number(booking.runFlatSurcharge) : null,
      washingPrice: booking.washingPrice ? Number(booking.washingPrice) : null,
      tirePurchasePrice: booking.tirePurchasePrice ? Number(booking.tirePurchasePrice) : null,
      totalTirePurchasePrice: booking.totalTirePurchasePrice ? Number(booking.totalTirePurchasePrice) : null,
      totalPrice: Number(booking.totalPrice),
      platformCommission: booking.platformCommission ? Number(booking.platformCommission) : null,
      workshopPayout: booking.workshopPayout ? Number(booking.workshopPayout) : null,
      stripeFeesEstimate: booking.stripeFeesEstimate ? Number(booking.stripeFeesEstimate) : null,
      platformNetCommission: booking.platformNetCommission ? Number(booking.platformNetCommission) : null,
      discountAmount: booking.discountAmount ? Number(booking.discountAmount) : null,
      originalPrice: booking.originalPrice ? Number(booking.originalPrice) : null,
    }))

    return NextResponse.json({ bookings: bookingsData })

  } catch (error) {
    console.error('Error fetching workshop bookings:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Buchungen' },
      { status: 500 }
    )
  }
}
