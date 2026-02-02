import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Create PayPal Order for Booking Payment
 * Called by PayPal Smart Button before payment
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId, amount } = await request.json()

    // Validate booking exists and belongs to user
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: {
          include: {
            user: true
          }
        },
        workshop: {
          include: {
            user: true
          }
        },
        tireRequest: true
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.customer.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not your booking' }, { status: 403 })
    }

    // Check if already paid
    if (booking.paymentStatus === 'PAID') {
      return NextResponse.json({ error: 'Already paid' }, { status: 400 })
    }

    // Get PayPal access token and API URL
    const { accessToken, apiUrl } = await getPayPalConfig()

    // Get PayPal merchant email (optional, for marketplace scenarios)
    const paypalMerchantEmail = await prisma.adminApiSetting.findUnique({
      where: { key: 'PAYPAL_MERCHANT_EMAIL' }
    })

    // Create PayPal order with customer address and reference
    // Get customer data from User object
    const user = booking.customer?.user
    const firstName = user?.firstName || booking.tireRequest?.firstName || ''
    const lastName = user?.lastName || booking.tireRequest?.lastName || ''
    const street = user?.street || booking.tireRequest?.street || ''
    const city = user?.city || booking.tireRequest?.city || ''
    const postalCode = user?.postalCode || user?.zipCode || booking.tireRequest?.postalCode || booking.tireRequest?.zipCode || ''

    const orderData: any = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: booking.id,
          custom_id: booking.id, // Used by webhook to identify booking
          description: `Bereifung24 - ${booking.workshop.companyName}`,
          invoice_id: `B24-${booking.id.substring(0, 8).toUpperCase()}`, // Verwendungszweck
          amount: {
            currency_code: 'EUR',
            value: amount.toFixed(2)
          },
          // Only include shipping if customer has address data
          ...(street && city && {
            shipping: {
              name: {
                full_name: `${firstName} ${lastName}`.trim() || 'Customer'
              },
              address: {
                address_line_1: street,
                admin_area_2: city,
                postal_code: postalCode,
                country_code: 'DE'
              }
            }
          })
        }
      ],
      application_context: {
        brand_name: 'Bereifung24',
        locale: 'de-DE',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${process.env.NEXTAUTH_URL}/dashboard/customer/appointments?payment=success`,
        cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/customer/requests/${booking.tireRequestId}/book?offerId=${booking.offerId}&payment=cancelled`
      }
    }

    // Add payee email if configured (for marketplace split payments)
    if (paypalMerchantEmail?.value) {
      orderData.purchase_units[0].payee = {
        email_address: paypalMerchantEmail.value
      }
    }

    const paypalResponse = await fetch(
      `${apiUrl}/v2/checkout/orders`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(orderData)
      }
    )

    if (!paypalResponse.ok) {
      const error = await paypalResponse.json()
      return NextResponse.json({ 
        error: 'PayPal order creation failed',
        details: error
      }, { status: 500 })
    }

    const order = await paypalResponse.json()

    // Create payment record with PENDING status
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount,
        currency: 'EUR',
        method: 'PAYPAL',
        status: 'PENDING',
        paypalOrderId: order.id,
        transactionId: order.id
      }
    })

    return NextResponse.json({
      orderID: order.id,
      status: order.status
    })

  } catch (error) {
    console.error('Error creating PayPal order:', error)
    return NextResponse.json({ 
      error: 'Failed to create PayPal order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Capture PayPal Order after customer approval
 * Called by PayPal Smart Button after customer approves payment
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderID } = await request.json()

    // Get PayPal access token and API URL
    const { accessToken, apiUrl } = await getPayPalConfig()

    // Capture the order
    const captureResponse = await fetch(
      `${apiUrl}/v2/checkout/orders/${orderID}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    if (!captureResponse.ok) {
      const error = await captureResponse.json()
      console.error('PayPal capture failed:', error)
      return NextResponse.json({ 
        error: 'PayPal capture failed',
        details: error
      }, { status: 500 })
    }

    const captureData = await captureResponse.json()

    // Update payment record
    const customId = captureData.purchase_units[0].reference_id || 
                     captureData.purchase_units[0].custom_id

    if (customId) {
      await prisma.payment.updateMany({
        where: {
          bookingId: customId,
          paypalOrderId: orderID
        },
        data: {
          status: 'COMPLETED',
          paypalCaptureId: captureData.purchase_units[0].payments.captures[0].id,
          confirmedAt: new Date()
        }
      })

      // Update booking status
      await prisma.booking.update({
        where: { id: customId },
        data: {
          paymentStatus: 'PAID',
          paymentMethod: 'PAYPAL',
          paidAt: new Date()
        }
      })
    }

    return NextResponse.json({
      status: captureData.status,
      id: captureData.id
    })

  } catch (error) {
    console.error('Error capturing PayPal order:', error)
    return NextResponse.json({ 
      error: 'Failed to capture PayPal order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Get PayPal Configuration and Access Token
 */
async function getPayPalConfig(): Promise<{ accessToken: string; apiUrl: string }> {
  // Load PayPal credentials from database
  const settings = await prisma.adminApiSetting.findMany({
    where: {
      key: {
        in: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_API_URL']
      }
    }
  })

  const clientId = settings.find(s => s.key === 'PAYPAL_CLIENT_ID')?.value
  const clientSecret = settings.find(s => s.key === 'PAYPAL_CLIENT_SECRET')?.value
  const apiUrl = settings.find(s => s.key === 'PAYPAL_API_URL')?.value || 'https://api-m.sandbox.paypal.com'

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured in admin settings')
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(`${apiUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Failed to get PayPal access token:', error)
    throw new Error('Failed to get PayPal access token')
  }

  const data = await response.json()
  return {
    accessToken: data.access_token,
    apiUrl
  }
}
