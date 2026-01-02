import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: {
    id: string
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is admin
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { status, paymentReference } = await request.json()
    const { id } = params

    // Validate status
    if (!['PENDING', 'APPROVED', 'PAID', 'CANCELLED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Update payment
    const payment = await prisma.affiliatePayment.update({
      where: { id },
      data: {
        status,
        paymentReference: paymentReference || undefined,
        paidAt: status === 'PAID' ? new Date() : undefined
      },
      include: {
        influencer: {
          select: {
            email: true,
            channelName: true
          }
        }
      }
    })

    console.log('[ADMIN] Payment status updated:', {
      paymentId: id,
      status,
      influencer: payment.influencer.email
    })

    return NextResponse.json({ payment })
  } catch (error) {
    console.error('[ADMIN] Error updating payment:', error)
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    )
  }
}
