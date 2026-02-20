import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { bookingService } from '@/lib/accounting/bookingService'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Load DirectBookings with commissions (all bookings, we calculate commission even if not paid yet)
    const directBookings = await prisma.directBooking.findMany({
      where: {
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
                lastName: true,
                email: true
              }
            }
          }
        },
        workshop: {
          select: {
            id: true,
            companyName: true,
            stripeAccountId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format as commissions for frontend compatibility
    const formattedCommissions = directBookings.map(booking => {
      // Calculate commission (6.9% of total price)
      const totalPrice = Number(booking.totalPrice)
      const commissionAmount = booking.platformCommission ? Number(booking.platformCommission) : totalPrice * 0.069
      const netCommission = booking.platformNetCommission ? Number(booking.platformNetCommission) : commissionAmount * 0.81 // Estimated after tax
      
      return {
        id: booking.id,
        bookingId: booking.id,
        orderTotal: totalPrice,
        commissionRate: 6.9, // Platform commission rate
        commissionAmount: commissionAmount,
        platformNetCommission: netCommission,
        stripeFeesEstimate: booking.stripeFeesEstimate ? Number(booking.stripeFeesEstimate) : 0,
        workshopPayout: booking.workshopPayout ? Number(booking.workshopPayout) : totalPrice * 0.931,
        status: booking.paymentStatus === 'PAID' ? 'COLLECTED' : booking.paymentStatus === 'PENDING' ? 'PENDING' : 'FAILED',
        billedAt: booking.paidAt,
        collectedAt: booking.paymentStatus === 'PAID' ? booking.paidAt : null,
        paymentMethod: booking.paymentMethod,
        paymentMethodDetail: booking.paymentMethodDetail,
        paymentStatus: booking.paymentStatus,
        stripePaymentId: booking.stripePaymentId,
        notes: `${booking.serviceType} - ${booking.date.toISOString().split('T')[0]} ${booking.time}`,
        createdAt: booking.createdAt,
        workshop: {
          id: booking.workshop.id,
          companyName: booking.workshop.companyName,
          contactName: `${booking.workshop.user.firstName} ${booking.workshop.user.lastName}`,
          email: booking.workshop.user.email,
          stripeAccountId: booking.workshop.stripeAccountId
        },
        customer: {
          name: `${booking.customer.user.firstName} ${booking.customer.user.lastName}`,
          email: booking.customer.user.email
        }
      }
    })

    return NextResponse.json({ commissions: formattedCommissions })

  } catch (error) {
    console.error('Error fetching commissions:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { commissionId, status, sepaStatus, notes } = body

    // Get current commission to check status change
    const currentCommission = await prisma.commission.findUnique({
      where: { id: commissionId }
    })

    if (!currentCommission) {
      return NextResponse.json({ error: 'Commission not found' }, { status: 404 })
    }

    const updatedCommission = await prisma.commission.update({
      where: { id: commissionId },
      data: {
        status,
        sepaStatus,
        notes,
        billedAt: status === 'BILLED' ? new Date() : undefined,
        collectedAt: status === 'COLLECTED' ? new Date() : undefined
      }
    })

    // NOTE: Auto-booking is now created monthly via SEPA payment webhook
    // Individual commission bookings are no longer created here

    return NextResponse.json({ commission: updatedCommission })

  } catch (error) {
    console.error('Error updating commission:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
