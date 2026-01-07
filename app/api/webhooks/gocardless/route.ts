// app/api/webhooks/gocardless/route.ts
// GoCardless Webhook Handler

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyWebhookSignature } from '@/lib/gocardless'
import { sendEmail, sepaMandateActivatedEmailTemplate } from '@/lib/email'

export async function POST(request: Request) {
  try {
    // Get raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get('webhook-signature')

    if (!signature) {
      console.error('❌ Missing webhook signature')
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    // Get webhook secret from database
    const webhookSecretSetting = await prisma.adminApiSetting.findUnique({
      where: { key: 'GOCARDLESS_WEBHOOK_SECRET' }
    })

    const webhookSecret = webhookSecretSetting?.value || process.env.GOCARDLESS_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('❌ Missing GOCARDLESS_WEBHOOK_SECRET')
      return NextResponse.json({ error: 'Missing webhook secret configuration' }, { status: 500 })
    }

    // Verify webhook signature
    console.log('🔐 Verifying webhook signature...')
    console.log('   Received signature:', signature)
    console.log('   Using secret:', webhookSecret?.substring(0, 20) + '...')
    console.log('   Body length:', body.length)
    
    const isValid = verifyWebhookSignature(
      body,
      signature,
      webhookSecret
    )

    if (!isValid) {
      console.error('❌ Invalid webhook signature')
      console.error('   Expected secret:', webhookSecret?.substring(0, 30) + '...')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse webhook payload
    const webhook = JSON.parse(body)
    console.log('📥 GoCardless Webhook received:', webhook.events?.length, 'events')

    // Process each event
    for (const event of webhook.events) {
      try {
        await processWebhookEvent(event)
      } catch (error) {
        console.error(`❌ Error processing event ${event.id}:`, error)
        // Continue processing other events
      }
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Error processing GoCardless webhook:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

async function processWebhookEvent(event: any) {
  const { resource_type, action, links } = event

  console.log(`🔔 Processing ${resource_type}.${action}`)

  switch (resource_type) {
    case 'mandates':
      await handleMandateEvent(action, links.mandate)
      break

    case 'payments':
      await handlePaymentEvent(action, links.payment)
      break

    case 'payouts':
      await handlePayoutEvent(action, links.payout)
      break

    default:
      console.log(`⏭️ Unhandled resource type: ${resource_type}`)
  }
}

async function handleMandateEvent(action: string, mandateId: string) {
  const statusMap: Record<string, string> = {
    'created': 'pending_submission',
    'submitted': 'submitted',
    'active': 'active',
    'cancelled': 'cancelled',
    'failed': 'failed',
    'expired': 'expired'
  }

  const newStatus = statusMap[action]
  if (!newStatus) {
    console.log(`⏭️ Unhandled mandate action: ${action}`)
    return
  }

  // Update workshop mandate status
  const result = await prisma.workshop.updateMany({
    where: { gocardlessMandateId: mandateId },
    data: { gocardlessMandateStatus: newStatus }
  })

  if (result.count > 0) {
    console.log(`✅ Updated mandate ${mandateId} to status: ${newStatus}`)
    
    // Send email notification when mandate becomes active
    if (newStatus === 'active') {
      try {
        // Fetch workshop details including user email
        const workshop = await prisma.workshop.findFirst({
          where: { gocardlessMandateId: mandateId },
          include: { user: true }
        })

        if (workshop && workshop.user?.email) {
          const emailData = sepaMandateActivatedEmailTemplate({
            workshopName: workshop.companyName,
            companyName: workshop.companyName,
            mandateReference: workshop.gocardlessMandateRef || mandateId,
            activatedAt: new Date().toLocaleDateString('de-DE', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          })

          await sendEmail({
            to: workshop.user.email,
            ...emailData
          })

          console.log(`📧 SEPA activation email sent to ${workshop.user.email}`)
        } else {
          console.log(`⚠️ Could not send email: Workshop or user email not found for mandate ${mandateId}`)
        }
      } catch (emailError) {
        console.error(`❌ Failed to send SEPA activation email:`, emailError)
        // Don't throw - email failure shouldn't break webhook processing
      }
    }
  } else {
    console.log(`⚠️ No workshop found for mandate ${mandateId}`)
  }
}

async function handlePaymentEvent(action: string, paymentId: string) {
  const statusMap: Record<string, string> = {
    'created': 'pending_submission',
    'submitted': 'submitted',
    'confirmed': 'confirmed',
    'paid_out': 'paid_out',
    'cancelled': 'cancelled',
    'failed': 'failed',
    'charged_back': 'charged_back'
  }

  const newStatus = statusMap[action]
  if (!newStatus) {
    console.log(`⏭️ Unhandled payment action: ${action}`)
    return
  }

  // Update commission payment status
  const result = await prisma.commission.updateMany({
    where: { gocardlessPaymentId: paymentId },
    data: {
      gocardlessPaymentStatus: newStatus,
      status: newStatus === 'confirmed' || newStatus === 'paid_out' ? 'COLLECTED' : 'PENDING'
    }
  })

  if (result.count > 0) {
    console.log(`✅ Updated payment ${paymentId} to status: ${newStatus}`)

    // If payment confirmed, create monthly consolidated accounting entry
    if (newStatus === 'confirmed' || newStatus === 'paid_out') {
      console.log(`💰 Payment ${paymentId} collected successfully`)
      
      try {
        // Get all commissions for this payment to calculate total and get workshop info
        const commissions = await prisma.commission.findMany({
          where: { gocardlessPaymentId: paymentId },
          include: {
            workshop: {
              select: {
                companyName: true
              }
            }
          }
        })

        if (commissions.length > 0) {
          const totalAmount = commissions.reduce((sum, c) => sum + c.commissionAmount.toNumber(), 0)
          const firstCommission = commissions[0]
          const workshopName = firstCommission.workshop.companyName
          const billingPeriod = `${firstCommission.billingYear}-${String(firstCommission.billingMonth).padStart(2, '0')}`
          
          // Create consolidated booking for the entire monthly payment
          const { BookingService } = await import('@/lib/accounting/bookingService')
          const bookingService = new BookingService()
          
          // Get or create system user for automated bookings
          let systemUser = await prisma.user.findFirst({
            where: { email: 'system@bereifung24.de' }
          })
          
          if (!systemUser) {
            systemUser = await prisma.user.create({
              data: {
                email: 'system@bereifung24.de',
                password: 'NO_LOGIN',
                role: 'ADMIN',
                firstName: 'System',
                lastName: 'Automated',
                isActive: false
              }
            })
          }

          await bookingService.bookCommissionReceived(
            paymentId,
            totalAmount,
            new Date(),
            systemUser.id
          )
          
          console.log(`📊 Monthly commission booking created: ${workshopName} - ${billingPeriod} - €${totalAmount.toFixed(2)}`)
        }
      } catch (bookingError) {
        console.error(`❌ Failed to create monthly commission booking:`, bookingError)
        // Don't fail webhook if booking fails
      }
    }

    // If payment failed, log error
    if (newStatus === 'failed' || newStatus === 'charged_back') {
      console.error(`❌ Payment ${paymentId} failed or charged back`)
      // Could send notification to admin here
    }
  } else {
    console.log(`⚠️ No commission found for payment ${paymentId}`)
  }
}

async function handlePayoutEvent(action: string, payoutId: string) {
  if (action === 'paid') {
    // Update commissions with this payout ID
    const result = await prisma.commission.updateMany({
      where: { gocardlessPayoutId: payoutId },
      data: {
        status: 'COLLECTED'
      }
    })

    console.log(`✅ Payout ${payoutId} paid - ${result.count} commissions updated`)
  }
}
