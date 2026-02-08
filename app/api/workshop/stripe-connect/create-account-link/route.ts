import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getApiSetting } from '@/lib/api-settings'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

/**
 * Create Stripe Connect Account Link for Express Onboarding
 * Workshop clicks button → Gets redirected to Stripe → Completes onboarding
 */
export async function POST(request: NextRequest) {
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
      where: { userId: session.user.id },
      include: { user: true }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
    }

    let accountId = workshop.stripeAccountId

    // If no account exists yet, create one
    if (!accountId) {
      console.log('[STRIPE CONNECT] Creating new Express account for workshop:', workshop.id)
      
      // Build account creation data - MINIMAL to avoid forcing business type
      const accountData: Stripe.AccountCreateParams = {
        type: 'express',
        country: 'DE',
        email: workshop.user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      }

      // DON'T set business_type, business_profile, or company data
      // Let Stripe collect everything during onboarding flow
      // This way workshops can choose Individual vs Company themselves

      console.log('[STRIPE CONNECT] Creating account with MINIMAL data:', JSON.stringify({
        type: accountData.type,
        country: accountData.country,
        email: accountData.email,
      }))

      const account = await stripe.accounts.create(accountData)

      accountId = account.id
      console.log('[STRIPE CONNECT] Account created:', accountId)

      // Save account ID to database
      await prisma.workshop.update({
        where: { id: workshop.id },
        data: { 
          stripeAccountId: accountId,
          stripeEnabled: false // Will be enabled after onboarding complete
        }
      })
    }

    // Create Account Link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXTAUTH_URL}/dashboard/workshop/settings?stripe_refresh=true`,
      return_url: `${process.env.NEXTAUTH_URL}/dashboard/workshop/settings?stripe_onboarding=success`,
      type: 'account_onboarding',
    })

    console.log('[STRIPE CONNECT] Account link created for:', accountId)

    return NextResponse.json({
      success: true,
      url: accountLink.url,
      accountId
    })
  } catch (error) {
    console.error('[STRIPE CONNECT] Error creating account link:', error)
    return NextResponse.json({
      error: 'Failed to create Stripe Connect link',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
