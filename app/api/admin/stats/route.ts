import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current month start and end
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Count total customers
    const totalCustomers = await prisma.customer.count()

    // Count total workshops
    const totalWorkshops = await prisma.workshop.count()

    // Count total offers
    const totalOffers = await prisma.offer.count()

    // Count accepted offers (all time)
    const acceptedOffers = await prisma.offer.count({
      where: {
        status: 'ACCEPTED'
      }
    })

    // Get monthly revenue (accepted offers in current month)
    const monthlyBookings = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd
        },
        status: {
          in: ['CONFIRMED', 'COMPLETED']
        }
      },
      include: {
        offer: true
      }
    })

    const monthlyRevenue = monthlyBookings.reduce((sum, booking) => sum + booking.offer.price, 0)
    const monthlyCommission = monthlyRevenue * 0.049 // 4,9% commission

    return NextResponse.json({
      totalCustomers,
      totalWorkshops,
      totalOffers,
      acceptedOffers,
      monthlyRevenue,
      monthlyCommission
    })

  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
  }
}
