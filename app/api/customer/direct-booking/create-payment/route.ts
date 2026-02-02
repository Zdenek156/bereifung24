import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
})

/**
 * POST /api/customer/direct-booking/create-payment
 * Create payment session for direct booking
 * 
 * Body:
 * {
 *   workshopId: string,
 *   vehicleId: string,
 *   serviceType: string, // "WHEEL_CHANGE"
 *   hasBalancing: boolean,
 *   hasStorage: boolean,
 *   basePrice: number,
 *   balancingPrice: number,
 *   storagePrice: number,
 *   totalPrice: number,
 *   durationMinutes: number,
 *   paymentMethod: "STRIPE" | "PAYPAL"
 * }
 * 
 * Returns:
 * {
 *   success: true,
 *   directBookingId: string,
 *   sessionUrl: string (for Stripe),
 *   sessionId: string
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      workshopId,
      vehicleId,
      serviceType,
      hasBalancing,
      hasStorage,
      basePrice,
      balancingPrice,
      storagePrice,
      totalPrice,
      durationMinutes,
      paymentMethod
    } = body

    // Validate
    if (!workshopId || !vehicleId || !serviceType || !totalPrice || !paymentMethod) {
      return NextResponse.json(
        { error: 'Fehlende Parameter' },
        { status: 400 }
      )
    }

    // Verify workshop exists
    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      include: {
        workshopServices: {
          where: {
            serviceType,
            isActive: true
          }
        }
      }
    })

    if (!workshop || workshop.workshopServices.length === 0) {
      return NextResponse.json(
        { error: 'Werkstatt oder Service nicht gefunden' },
        { status: 404 }
      )
    }

    // Verify vehicle ownership
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    })

    if (!vehicle || vehicle.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Fahrzeug nicht gefunden' },
        { status: 404 }
      )
    }

    // Get customer details
    const customer = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Kunde nicht gefunden' },
        { status: 404 }
      )
    }

    // Create DirectBooking record
    const directBooking = await prisma.directBooking.create({
      data: {
        customerId: session.user.id,
        workshopId,
        vehicleId,
        serviceType,
        hasBalancing,
        hasStorage,
        basePrice,
        balancingPrice: balancingPrice || 0,
        storagePrice: storagePrice || 0,
        totalPrice,
        durationMinutes,
        paymentMethod,
        paymentStatus: 'PENDING'
      }
    })

    // Create Stripe Checkout Session
    if (paymentMethod === 'STRIPE') {
      const serviceDescription = [
        `Räderwechsel (${vehicle.manufacturer} ${vehicle.model})`,
        hasBalancing ? 'mit Wuchten' : '',
        hasStorage ? 'mit Einlagerung' : ''
      ].filter(Boolean).join(', ')

      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: serviceDescription,
                description: `Bei: ${workshop.name}, ${workshop.city}`,
                metadata: {
                  directBookingId: directBooking.id,
                  workshopId: workshop.id,
                  serviceType
                }
              },
              unit_amount: Math.round(totalPrice * 100) // Convert to cents
            },
            quantity: 1
          }
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/customer/direct-booking/success?session_id={CHECKOUT_SESSION_ID}&direct_booking_id=${directBooking.id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/customer/direct-booking/wheel-change?canceled=true`,
        customer_email: customer.email || undefined,
        metadata: {
          directBookingId: directBooking.id,
          customerId: session.user.id,
          workshopId,
          serviceType
        }
      })

      // Update DirectBooking with Stripe session ID
      await prisma.directBooking.update({
        where: { id: directBooking.id },
        data: {
          stripeSessionId: checkoutSession.id
        }
      })

      return NextResponse.json({
        success: true,
        directBookingId: directBooking.id,
        sessionUrl: checkoutSession.url,
        sessionId: checkoutSession.id
      })
    }

    // PayPal integration would go here
    if (paymentMethod === 'PAYPAL') {
      return NextResponse.json(
        { error: 'PayPal not yet implemented for direct booking' },
        { status: 501 }
      )
    }

    return NextResponse.json(
      { error: 'Ungültige Zahlungsmethode' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Zahlung' },
      { status: 500 }
    )
  }
}
