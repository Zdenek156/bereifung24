import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getApiSetting } from '@/lib/api-settings'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

/**
 * Check Stripe Connect Account Status
 * Called after workshop completes onboarding to verify everything is set up
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'WORKSHOP') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Stripe keys
    const stripeSecretKey = await getApiSetting('STRIPE_SECRET_KEY', 'STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
    })

    // Get workshop
    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id }
    })

    if (!workshop?.stripeAccountId) {
      return NextResponse.json({
        connected: false,
        onboardingComplete: false
      })
    }

    // Retrieve account from Stripe
    const account = await stripe.accounts.retrieve(workshop.stripeAccountId)

    // Check if charges are enabled (onboarding complete)
    const chargesEnabled = account.charges_enabled
    const payoutsEnabled = account.payouts_enabled
    const detailsSubmitted = account.details_submitted

    console.log('[STRIPE CONNECT] Account status:', {
      accountId: workshop.stripeAccountId,
      chargesEnabled,
      payoutsEnabled,
      detailsSubmitted
    })

    // Update workshop if onboarding is complete
    if (chargesEnabled && !workshop.stripeEnabled) {
      await prisma.workshop.update({
        where: { id: workshop.id },
        data: { stripeEnabled: true }
      })
      console.log('[STRIPE CONNECT] Workshop enabled for payments:', workshop.id)
    }

    return NextResponse.json({
      connected: true,
      onboardingComplete: chargesEnabled && detailsSubmitted,
      chargesEnabled,
      payoutsEnabled,
      accountId: workshop.stripeAccountId,
      requirements: account.requirements
    })
  } catch (error) {
    console.error('[STRIPE CONNECT] Error checking account status:', error)
    return NextResponse.json({
      error: 'Failed to check account status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
