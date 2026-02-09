import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getApiSetting } from '@/lib/api-settings'
import Stripe from 'stripe'

/**
 * Get available payment methods configured in Stripe
 * Shows which payment methods are available for all workshops
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Allow ADMIN and B24_EMPLOYEE (middleware already checks application access)
    if (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE') {
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

    // Get payment method configuration
    const paymentMethods = await stripe.paymentMethodConfigurations.list({
      limit: 1,
    })

    const config = paymentMethods.data[0]

    // Map payment methods to readable format
    const availableMethods = {
      card: config?.card?.available || false,
      sepa_debit: config?.sepa_debit?.available || false,
      apple_pay: config?.apple_pay?.available || false,
      google_pay: config?.google_pay?.available || false,
      klarna: config?.klarna?.available || false,
      giropay: config?.giropay?.available || false,
      sofort: config?.sofort?.available || false,
      link: config?.link?.available || false,
      amazon_pay: config?.amazon_pay?.available || false,
    }

    // Payment method details with German names
    const methodDetails = {
      card: {
        name: 'Kreditkarten',
        description: 'Visa, Mastercard, American Express, Debit',
        icon: '💳',
        category: 'must-have'
      },
      sepa_debit: {
        name: 'SEPA-Lastschrift',
        description: 'Bankeinzug via IBAN',
        icon: '🏦',
        category: 'must-have'
      },
      apple_pay: {
        name: 'Apple Pay',
        description: 'Mobile Wallet für Apple-Geräte',
        icon: '🍎',
        category: 'must-have'
      },
      google_pay: {
        name: 'Google Pay',
        description: 'Mobile Wallet für Android',
        icon: '🤖',
        category: 'must-have'
      },
      klarna: {
        name: 'Klarna',
        description: 'Jetzt kaufen, später zahlen',
        icon: '💳',
        category: 'nice-to-have'
      },
      giropay: {
        name: 'Giropay',
        description: 'Online-Banking Deutschland',
        icon: '🏦',
        category: 'nice-to-have'
      },
      sofort: {
        name: 'SOFORT',
        description: 'Sofortüberweisung',
        icon: '⚡',
        category: 'nice-to-have'
      },
      link: {
        name: 'Link',
        description: 'Stripe Link - 1-Click Checkout',
        icon: '🔗',
        category: 'nice-to-have'
      },
      amazon_pay: {
        name: 'Amazon Pay',
        description: 'Zahlung mit Amazon-Konto',
        icon: '📦',
        category: 'nice-to-have'
      }
    }

    // Combine availability with details
    const methods = Object.entries(availableMethods).map(([key, available]) => ({
      id: key,
      available,
      ...methodDetails[key as keyof typeof methodDetails]
    }))

    // Separate into categories
    const mustHave = methods.filter(m => m.category === 'must-have')
    const niceToHave = methods.filter(m => m.category === 'nice-to-have')

    return NextResponse.json({
      success: true,
      paymentMethods: methods,
      categories: {
        mustHave,
        niceToHave
      },
      summary: {
        total: methods.length,
        active: methods.filter(m => m.available).length,
        inactive: methods.filter(m => !m.available).length
      }
    })
  } catch (error) {
    console.error('[PAYMENT METHODS] Error fetching payment methods:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch payment methods',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
