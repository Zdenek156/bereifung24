import { NextResponse } from 'next/server'
import { getFreelancerSession } from '@/lib/freelancer-auth'
import { prisma } from '@/lib/prisma'
import { getApiSetting } from '@/lib/api-settings'
import Stripe from 'stripe'

/**
 * Parse street field — may contain "Straße 2, Stadt" — split on comma
 */
function parseStreetField(raw: string | null | undefined): { line1?: string; cityFromStreet?: string } {
  if (!raw) return {}
  const parts = raw.split(',').map(s => s.trim())
  return {
    line1: parts[0] || undefined,
    cityFromStreet: parts[1] || undefined,
  }
}

/**
 * GET - Get Stripe Connect status for freelancer
 * POST - Create or resume Stripe Connect onboarding
 */

export async function GET() {
  const { error, freelancer } = await getFreelancerSession()
  if (error) return error
  if (!freelancer) return NextResponse.json({ error: 'Kein Freelancer-Profil' }, { status: 404 })

  // Check if freelancer has a Stripe account
  if (!freelancer.stripeAccountId) {
    return NextResponse.json({
      connected: false,
      stripeAccountId: null,
      chargesEnabled: false,
      payoutsEnabled: false,
    })
  }

  // Check Stripe account status
  try {
    const stripeSecretKey = await getApiSetting('STRIPE_SECRET_KEY', 'STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe nicht konfiguriert' }, { status: 500 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' as any })
    const account = await stripe.accounts.retrieve(freelancer.stripeAccountId)

    return NextResponse.json({
      connected: true,
      stripeAccountId: freelancer.stripeAccountId,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      requirementsDue: account.requirements?.currently_due || [],
      detailsSubmitted: account.details_submitted,
    })
  } catch (err) {
    console.error('Error checking Stripe account:', err)
    return NextResponse.json({
      connected: false,
      stripeAccountId: freelancer.stripeAccountId,
      error: 'Stripe-Konto konnte nicht geprüft werden',
    })
  }
}

export async function POST() {
  const { error, freelancer } = await getFreelancerSession()
  if (error) return error
  if (!freelancer) return NextResponse.json({ error: 'Kein Freelancer-Profil' }, { status: 404 })

  try {
    const stripeSecretKey = await getApiSetting('STRIPE_SECRET_KEY', 'STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe nicht konfiguriert' }, { status: 500 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' as any })

    let accountId = freelancer.stripeAccountId

    // Create new Stripe Express account if not exists  
    if (!accountId) {
      // Pre-fill as much data as possible from freelancer profile
      const firstName = freelancer.user.firstName || undefined
      const lastName = freelancer.user.lastName || undefined
      const email = freelancer.user.email || undefined
      const rawStreet = freelancer.street || freelancer.user.street || undefined
      const { line1: streetLine, cityFromStreet } = parseStreetField(rawStreet)
      const zip = freelancer.zip || freelancer.user.zipCode || undefined
      const city = freelancer.city || freelancer.user.city || cityFromStreet || undefined

      const account = await stripe.accounts.create({
        type: 'express',
        country: 'DE',
        email,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: 'individual',
        individual: {
          first_name: firstName,
          last_name: lastName,
          email,
          address: (streetLine || zip || city) ? {
            line1: streetLine,
            postal_code: zip,
            city,
            country: 'DE',
          } : undefined,
        },
        business_profile: {
          url: 'https://bereifung24.de',
          mcc: '5571', // Motorcycle Dealers and Their Tire Services
        },
        metadata: {
          freelancerId: freelancer.id,
          affiliateCode: freelancer.affiliateCode,
        },
      })

      accountId = account.id

      // Save to database
      await prisma.freelancer.update({
        where: { id: freelancer.id },
        data: { stripeAccountId: accountId },
      })

      console.log(`✅ Stripe Connect account created for freelancer ${freelancer.id}: ${accountId}`)
    } else {
      // Account already exists — update with latest profile data so onboarding is pre-filled
      try {
        const firstName = freelancer.user.firstName || undefined
        const lastName = freelancer.user.lastName || undefined
        const email = freelancer.user.email || undefined
        const rawStreet = freelancer.street || freelancer.user.street || undefined
        const { line1: streetLine, cityFromStreet } = parseStreetField(rawStreet)
        const zip = freelancer.zip || freelancer.user.zipCode || undefined
        const city = freelancer.city || freelancer.user.city || cityFromStreet || undefined

        await stripe.accounts.update(accountId, {
          email,
          individual: {
            first_name: firstName,
            last_name: lastName,
            email,
            address: (streetLine || zip || city) ? {
              line1: streetLine,
              postal_code: zip,
              city,
              country: 'DE',
            } : undefined,
          },
        })
      } catch (updateErr) {
        // Don't fail if update doesn't work (account may be in a state that doesn't allow updates)
        console.warn('Could not update Stripe account with profile data:', updateErr)
      }
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `https://bereifung24.de/freelancer/profile?stripe=refresh`,
      return_url: `https://bereifung24.de/freelancer/profile?stripe=success`,
      type: 'account_onboarding',
    })

    return NextResponse.json({
      url: accountLink.url,
      accountId,
    })
  } catch (err) {
    console.error('Error creating Stripe onboarding:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Stripe-Fehler' },
      { status: 500 }
    )
  }
}
