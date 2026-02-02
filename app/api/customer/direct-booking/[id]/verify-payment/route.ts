import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
})

/**
 * POST /api/customer/direct-booking/[id]/verify-payment
 * Verify payment and update DirectBooking status
 */

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID fehlt' },
        { status: 400 }
      )
    }

    // Get DirectBooking
    const directBooking = await prisma.directBooking.findUnique({
      where: { id: params.id },
      include: {
        workshop: true,
        vehicle: true,
        customer: true
      }
    })

    if (!directBooking) {
      return NextResponse.json(
        { error: 'Buchung nicht gefunden' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (directBooking.customerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Keine Berechtigung' },
        { status: 403 }
      )
    }

    // Check if already paid
    if (directBooking.paymentStatus === 'PAID') {
      return NextResponse.json({
        success: true,
        directBooking,
        message: 'Bereits bezahlt'
      })
    }

    // Verify Stripe payment
    if (directBooking.paymentMethod === 'STRIPE') {
      const stripeSession = await stripe.checkout.sessions.retrieve(sessionId)

      if (stripeSession.payment_status === 'paid') {
        // Update DirectBooking
        const updatedBooking = await prisma.directBooking.update({
          where: { id: params.id },
          data: {
            paymentStatus: 'PAID',
            paidAt: new Date(),
            stripePaymentId: stripeSession.payment_intent as string
          },
          include: {
            workshop: true,
            vehicle: true,
            customer: true
          }
        })

        return NextResponse.json({
          success: true,
          directBooking: updatedBooking,
          message: 'Zahlung erfolgreich verifiziert'
        })
      } else {
        return NextResponse.json(
          { error: 'Zahlung noch nicht abgeschlossen' },
          { status: 400 }
        )
      }
    }

    // PayPal verification would go here
    if (directBooking.paymentMethod === 'PAYPAL') {
      return NextResponse.json(
        { error: 'PayPal nicht implementiert' },
        { status: 501 }
      )
    }

    return NextResponse.json(
      { error: 'Ungültige Zahlungsmethode' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Zahlungsverifizierung' },
      { status: 500 }
    )
  }
}
