import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'WORKSHOP') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workshopId = session.user.workshopId

    if (!workshopId) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
    }

    const now = new Date()
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    // Count new requests (created in last 24 hours, no offers from this workshop yet)
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const newRequests = await prisma.tireRequest.count({
      where: {
        status: 'OPEN',
        createdAt: {
          gte: twentyFourHoursAgo
        },
        NOT: {
          offers: {
            some: {
              workshopId: workshopId
            }
          }
        }
      }
    })

    // Count accepted offers (accepted in last 7 days, not yet marked as completed)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const acceptedOffers = await prisma.offer.count({
      where: {
        workshopId: workshopId,
        status: 'ACCEPTED',
        acceptedAt: {
          gte: sevenDaysAgo
        },
        booking: {
          status: {
            not: 'COMPLETED'
          }
        }
      }
    })

    // Count upcoming appointments (in next 7 days)
    const upcomingAppointments = await prisma.booking.count({
      where: {
        offer: {
          workshopId: workshopId
        },
        appointmentDate: {
          gte: now,
          lte: sevenDaysFromNow
        },
        status: {
          in: ['CONFIRMED', 'IN_PROGRESS']
        }
      }
    })

    // Count pending reviews (reviews from last 7 days without response)
    const pendingReviews = await prisma.review.count({
      where: {
        workshopId: workshopId,
        createdAt: {
          gte: sevenDaysAgo
        },
        workshopResponse: null
      }
    })

    return NextResponse.json({
      newRequests,
      acceptedOffers,
      upcomingAppointments,
      pendingReviews
    })

  } catch (error) {
    console.error('❌ Error fetching workshop notification stats:', error)
    console.error('❌ Error message:', error instanceof Error ? error.message : String(error))
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
