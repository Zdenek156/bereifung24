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
      
      // Build account creation data for Individual (Privatperson/Einzelunternehmen)
      const accountData: Stripe.AccountCreateParams = {
        type: 'express',
        country: 'DE',
        email: workshop.user.email,
        business_type: 'individual', // Force Individual (not Company) to avoid HRB requirement
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      }

      // Add individual data (person details)
      accountData.individual = {
        email: workshop.user.email,
      }

      // Split full name into first and last name if available
      if (workshop.user.name) {
        const nameParts = workshop.user.name.trim().split(' ')
        if (nameParts.length >= 2) {
          accountData.individual.first_name = nameParts[0]
          accountData.individual.last_name = nameParts.slice(1).join(' ')
        } else {
          accountData.individual.first_name = nameParts[0]
        }
      }

      // Add business profile with address and phone
      accountData.business_profile = {
        name: workshop.companyName || workshop.user.name || 'Werkstatt',
        mcc: '7538', // Automotive Service Shops
      }

      // Add phone if available
      if (workshop.phone) {
        accountData.business_profile.support_phone = workshop.phone
        accountData.individual.phone = workshop.phone
      }

      // Add address if available
      if (workshop.address && workshop.city && workshop.zipCode) {
        accountData.individual.address = {
          line1: workshop.address,
          city: workshop.city,
          postal_code: workshop.zipCode,
          country: 'DE',
        }

        accountData.business_profile.support_address = {
          line1: workshop.address,
          city: workshop.city,
          postal_code: workshop.zipCode,
          country: 'DE',
        }
      }

      console.log('[STRIPE CONNECT] Creating INDIVIDUAL account with data:', JSON.stringify({
        type: accountData.type,
        business_type: accountData.business_type,
        country: accountData.country,
        email: accountData.email,
        individualName: accountData.individual.first_name + ' ' + (accountData.individual.last_name || ''),
        businessName: accountData.business_profile?.name,
        phone: workshop.phone,
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
