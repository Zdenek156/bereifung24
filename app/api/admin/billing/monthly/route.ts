import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const COMMISSION_RATE = 0.049 // 4.9%
const TAX_RATE = 0.19 // 19%

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    // Fetch all completed bookings for the month
    const bookings = await prisma.booking.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        workshop: {
          select: {
            id: true,
            companyName: true,
            gocardlessMandateId: true,
            gocardlessMandateStatus: true
          }
        },
        tireRequest: {
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
          }
        },
        offer: {
          select: {
            price: true
          }
        }
      }
    })

    // Group bookings by workshop
    const workshopMap = new Map<string, any>()

    for (const booking of bookings) {
      if (!booking.offer?.price) continue

      const workshopId = booking.workshopId
      const price = booking.offer.price
      const commissionNet = price * COMMISSION_RATE
      const commissionTax = commissionNet * TAX_RATE
      const commissionGross = commissionNet + commissionTax

      if (!workshopMap.has(workshopId)) {
        workshopMap.set(workshopId, {
          workshopId: workshopId,
          workshopName: booking.workshop.companyName,
          hasSepaMandate: !!(booking.workshop.gocardlessMandateId && booking.workshop.gocardlessMandateStatus === 'active'),
          totalBookings: 0,
          totalRevenue: 0,
          commissionNet: 0,
          commissionTax: 0,
          commissionGross: 0,
          bookings: []
        })
      }

      const workshop = workshopMap.get(workshopId)
      workshop.totalBookings++
      workshop.totalRevenue += price
      workshop.commissionNet += commissionNet
      workshop.commissionTax += commissionTax
      workshop.commissionGross += commissionGross
      workshop.bookings.push({
        id: booking.id,
        customerName: `${booking.tireRequest?.customer?.user?.firstName || ''} ${booking.tireRequest?.customer?.user?.lastName || ''}`.trim() || 'Unbekannt',
        service: `${booking.tireRequest?.season || ''} ${booking.tireRequest?.width || ''}/${booking.tireRequest?.aspectRatio || ''}R${booking.tireRequest?.diameter || ''} x${booking.tireRequest?.quantity || 4}`,
        date: booking.completedAt,
        price: price,
        commission: commissionNet
      })
    }

    const workshops = Array.from(workshopMap.values())
      .sort((a, b) => b.commissionGross - a.commissionGross)

    // Calculate totals
    const stats = {
      year,
      month,
      totalWorkshops: workshops.length,
      totalBookings: workshops.reduce((sum, w) => sum + w.totalBookings, 0),
      totalRevenue: workshops.reduce((sum, w) => sum + w.totalRevenue, 0),
      totalCommissionNet: workshops.reduce((sum, w) => sum + w.commissionNet, 0),
      totalCommissionTax: workshops.reduce((sum, w) => sum + w.commissionTax, 0),
      totalCommissionGross: workshops.reduce((sum, w) => sum + w.commissionGross, 0),
      workshopsWithSepa: workshops.filter(w => w.hasSepaMandate).length,
      workshops
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching monthly billing stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
