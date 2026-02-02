import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPayPalWebhookSignature } from '@/lib/paypal/webhook'
import { sendEmail } from '@/lib/email'

/**
 * PayPal Webhook Handler
 * Receives notifications from PayPal about payment events
 * 
 * Setup: Add this URL to PayPal webhook settings:
 * https://bereifung24.de/api/webhooks/paypal
 * 
 * Events to subscribe:
 * - PAYMENT.CAPTURE.COMPLETED
 * - PAYMENT.CAPTURE.DENIED
 * - PAYMENT.CAPTURE.REFUNDED
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Read webhook body
    const body = await request.text()
    const event = JSON.parse(body)
    
    console.log('📬 PayPal Webhook received:', event.event_type)
    
    // 2. Verify PayPal signature (security!)
    const headers = {
      'paypal-transmission-id': request.headers.get('paypal-transmission-id') || '',
      'paypal-transmission-time': request.headers.get('paypal-transmission-time') || '',
      'paypal-cert-url': request.headers.get('paypal-cert-url') || '',
      'paypal-transmission-sig': request.headers.get('paypal-transmission-sig') || '',
      'paypal-auth-algo': request.headers.get('paypal-auth-algo') || ''
    }
    
    const isValid = await verifyPayPalWebhookSignature(body, headers)
    if (!isValid) {
      console.error('❌ Invalid PayPal signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    
    // 3. Handle different event types
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCompleted(event)
        break
      
      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentFailed(event)
        break
      
      case 'PAYMENT.CAPTURE.REFUNDED':
        await handlePaymentRefunded(event)
        break
      
      default:
        console.log('ℹ️  Unhandled event type:', event.event_type)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ PayPal webhook error:', error)
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentCompleted(event: any) {
  try {
    const orderId = event.resource.supplementary_data?.related_ids?.order_id
    const captureId = event.resource.id
    const amount = parseFloat(event.resource.amount.value)
    const currency = event.resource.amount.currency_code
    
    // Extract custom_id from purchase_units (contains bookingId)
    const customId = event.resource.supplementary_data?.related_ids?.custom_id || 
                     event.resource.custom_id
    
    if (!customId) {
      console.error('❌ No custom_id found in PayPal event')
      return
    }
    
    // Find or create payment record
    const payment = await prisma.payment.upsert({
      where: { 
        paypalOrderId: orderId || captureId 
      },
      create: {
        bookingId: customId,
        paypalOrderId: orderId,
        paypalCaptureId: captureId,
        amount,
        currency,
        method: 'PAYPAL',
        status: 'COMPLETED',
        confirmedAt: new Date(),
        transactionId: captureId,
        metadata: event.resource
      },
      update: {
        status: 'COMPLETED',
        paypalCaptureId: captureId,
        confirmedAt: new Date(),
        metadata: event.resource
      }
    })
    
    console.log('✅ Payment recorded:', payment.id)
    
    // Update booking status
    const booking = await prisma.booking.update({
      where: { id: customId },
      data: {
        paymentStatus: 'PAID',
        paymentMethod: 'PAYPAL',
        paidAt: new Date()
      },
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
    
    console.log('✅ Booking updated:', booking.id)
    
    // Send confirmation emails
    await sendPaymentConfirmationEmails(booking, payment)
    
  } catch (error) {
    console.error('❌ Error handling payment completed:', error)
    throw error
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(event: any) {
  try {
    const orderId = event.resource.supplementary_data?.related_ids?.order_id
    const customId = event.resource.supplementary_data?.related_ids?.custom_id || 
                     event.resource.custom_id
    
    if (!customId) {
      console.error('❌ No custom_id found in PayPal event')
      return
    }
    
    // Update payment record
    await prisma.payment.upsert({
      where: { 
        paypalOrderId: orderId 
      },
      create: {
        bookingId: customId,
        paypalOrderId: orderId,
        amount: 0,
        currency: 'EUR',
        method: 'PAYPAL',
        status: 'FAILED',
        failedAt: new Date(),
        metadata: event.resource
      },
      update: {
        status: 'FAILED',
        failedAt: new Date(),
        metadata: event.resource
      }
    })
    
    // Update booking status
    await prisma.booking.update({
      where: { id: customId },
      data: {
        paymentStatus: 'FAILED'
      }
    })
    
    console.log('⚠️  Payment failed for booking:', customId)
    
  } catch (error) {
    console.error('❌ Error handling payment failed:', error)
    throw error
  }
}

/**
 * Handle payment refund
 */
async function handlePaymentRefunded(event: any) {
  try {
    const captureId = event.resource.id
    
    // Find payment by capture ID
    const payment = await prisma.payment.findFirst({
      where: { paypalCaptureId: captureId }
    })
    
    if (!payment) {
      console.error('❌ Payment not found for capture ID:', captureId)
      return
    }
    
    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
        metadata: event.resource
      }
    })
    
    // Update booking status
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: {
        paymentStatus: 'REFUNDED'
      }
    })
    
    console.log('💸 Payment refunded:', payment.id)
    
  } catch (error) {
    console.error('❌ Error handling payment refunded:', error)
    throw error
  }
}

/**
 * Send payment confirmation emails to customer and workshop
 */
async function sendPaymentConfirmationEmails(booking: any, payment: any) {
  try {
    const appointmentDate = new Date(booking.appointmentDate)
    const formattedDate = appointmentDate.toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    const formattedAmount = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: payment.currency
    }).format(parseFloat(payment.amount.toString()))
    
    // Email to customer
    await sendEmail({
      to: booking.customer.user.email,
      subject: '✅ Zahlung bestätigt - Ihr Termin ist gesichert',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Zahlung erfolgreich!</h2>
          
          <p>Hallo ${booking.customer.user.firstName},</p>
          
          <p>Ihre Zahlung wurde erfolgreich bestätigt. Ihr Termin ist nun gesichert!</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📅 Termindetails</h3>
            <p><strong>Datum:</strong> ${formattedDate}</p>
            <p><strong>Uhrzeit:</strong> ${booking.appointmentTime} Uhr</p>
            <p><strong>Werkstatt:</strong> ${booking.workshop.companyName}</p>
          </div>
          
          <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #16a34a;">💳 Zahlungsbestätigung</h3>
            <p><strong>Betrag:</strong> ${formattedAmount}</p>
            <p><strong>Methode:</strong> PayPal</p>
            <p><strong>Status:</strong> Bezahlt ✅</p>
            <p><strong>Transaktions-ID:</strong> ${payment.transactionId}</p>
          </div>
          
          <p>Sie erhalten vor Ihrem Termin noch eine Erinnerung per E-Mail.</p>
          
          <p>Bei Fragen können Sie sich jederzeit an uns wenden.</p>
          
          <p>Mit freundlichen Grüßen<br>Ihr Bereifung24-Team</p>
        </div>
      `
    })
    
    // Email to workshop
    await sendEmail({
      to: booking.workshop.user.email,
      subject: '💰 Zahlung eingegangen für Termin',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Zahlung eingegangen</h2>
          
          <p>Hallo ${booking.workshop.companyName},</p>
          
          <p>Für folgenden Termin ist die Zahlung eingegangen:</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📅 Termindetails</h3>
            <p><strong>Datum:</strong> ${formattedDate}</p>
            <p><strong>Uhrzeit:</strong> ${booking.appointmentTime} Uhr</p>
            <p><strong>Kunde:</strong> ${booking.customer.user.firstName} ${booking.customer.user.lastName}</p>
            <p><strong>Telefon:</strong> ${booking.customer.user.phone || '-'}</p>
          </div>
          
          <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #16a34a;">💳 Zahlungsinformation</h3>
            <p><strong>Betrag:</strong> ${formattedAmount}</p>
            <p><strong>Methode:</strong> PayPal</p>
            <p><strong>Status:</strong> Bezahlt ✅</p>
          </div>
          
          <p><strong>Der Kunde hat bereits bezahlt.</strong> Bitte erbringen Sie den Service wie vereinbart.</p>
          
          <p>Mit freundlichen Grüßen<br>Ihr Bereifung24-Team</p>
        </div>
      `
    })
    
    console.log('✅ Payment confirmation emails sent')
    
  } catch (error) {
    console.error('❌ Error sending payment emails:', error)
    // Don't throw - email failure shouldn't fail the webhook
  }
}
