import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET all workshops
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workshops = await prisma.workshop.findMany({
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            street: true,
            zipCode: true,
            city: true
          }
        },
        bookings: {
          where: {
            status: {
              in: ['CONFIRMED', 'COMPLETED']
            }
          },
          include: {
            offer: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate revenue for each workshop
    const workshopsWithRevenue = workshops.map(workshop => {
      const revenue = workshop.bookings.reduce((sum, booking) => sum + booking.offer.price, 0)
      return {
        id: workshop.id,
        companyName: workshop.companyName,
        isVerified: workshop.isVerified,
        createdAt: workshop.createdAt,
        user: workshop.user,
        revenue
      }
    })

    return NextResponse.json(workshopsWithRevenue)

  } catch (error) {
    console.error('Workshops fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch workshops' }, { status: 500 })
  }
}
