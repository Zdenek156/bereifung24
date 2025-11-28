// app/api/webhooks/gocardless/route.ts
// GoCardless Webhook Handler

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyWebhookSignature } from '@/lib/gocardless'

export async function POST(request: Request) {
  try {
    // Get raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get('webhook-signature')

    if (!signature) {
      console.error('❌ Missing webhook signature')
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(
      body,
      signature,
      process.env.GOCARDLESS_WEBHOOK_SECRET!
    )

    if (!isValid) {
      console.error('❌ Invalid webhook signature')
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

    // If payment confirmed, update to COLLECTED
    if (newStatus === 'confirmed' || newStatus === 'paid_out') {
      console.log(`💰 Payment ${paymentId} collected successfully`)
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
