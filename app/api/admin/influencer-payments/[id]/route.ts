import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, influencerPaymentConfirmationEmailTemplate } from '@/lib/email'
import { bookingService } from '@/lib/accounting/bookingService'

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

    // AUTO-BOOKING: Create accounting entry when payment is marked as PAID
    if (status === 'PAID') {
      try {
        const influencerName = payment.influencer.channelName || payment.influencer.email
        await bookingService.bookInfluencerPayment(
          payment.id,
          payment.totalAmount / 100, // Convert cents to euros
          payment.paidAt!,
          session.user.id,
          influencerName
        )
        console.log(`✅ Auto-booking created for influencer payment ${payment.id}`)
      } catch (error) {
        console.error('Failed to create auto-booking for influencer payment:', error)
        // Don't fail the payment if booking fails
      }
    }

    // Send email notification when payment is marked as PAID
    if (status === 'PAID') {
      try {
        const influencerName = payment.influencer.channelName || 'Influencer'

        const emailTemplate = influencerPaymentConfirmationEmailTemplate({
          influencerName,
          amount: `€${(payment.totalAmount / 100).toFixed(2)}`,
          periodStart: new Date(payment.periodStart).toLocaleDateString('de-DE'),
          periodEnd: new Date(payment.periodEnd).toLocaleDateString('de-DE'),
          totalClicks: payment.totalClicks,
          clicksAmount: `€${(payment.clicksAmount / 100).toFixed(2)}`,
          totalRegistrations: payment.totalRegistrations,
          registrationsAmount: `€${(payment.registrationsAmount / 100).toFixed(2)}`,
          totalOffers: payment.totalOffers,
          offersAmount: `€${(payment.offersAmount / 100).toFixed(2)}`,
          paymentMethod: payment.paymentMethod,
          paymentReference: payment.paymentReference || undefined,
          paidAt: new Date(payment.paidAt!).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        })

        await sendEmail({
          to: payment.influencer.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html
        })

        console.log('[ADMIN] Payment confirmation email sent to:', payment.influencer.email)
      } catch (emailError) {
        console.error('[ADMIN] Failed to send payment confirmation email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ payment })
  } catch (error) {
    console.error('[ADMIN] Error updating payment:', error)
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    )
  }
}
