import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getApiSetting } from '@/lib/api-settings'

async function generatePayPalAccessToken() {
  const clientId = await getApiSetting('PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_ID')
  const clientSecret = await getApiSetting('PAYPAL_CLIENT_SECRET', 'PAYPAL_CLIENT_SECRET')
  const mode = await getApiSetting('PAYPAL_MODE', 'PAYPAL_MODE') || 'sandbox'

  if (!clientId || !clientSecret) {
    console.error('[PAYPAL] Missing credentials:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret
    })
    throw new Error('PayPal credentials not configured')
  }

  const PAYPAL_API_URL = mode === 'live' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com'

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  console.log('[PAYPAL] Generating access token...', { mode })

  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })

  const data = await response.json()
  
  if (!response.ok || !data.access_token) {
    console.error('[PAYPAL] Token generation failed:', data)
    throw new Error(`PayPal authentication failed: ${data.error_description || data.error}`)
  }

  console.log('[PAYPAL] Access token generated successfully')
  return data.access_token
}

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
    const { amount, description } = body

    if (!amount) {
      return NextResponse.json(
        { error: 'Fehlende Parameter' },
        { status: 400 }
      )
    }

    const accessToken = await generatePayPalAccessToken()
    const mode = await getApiSetting('PAYPAL_MODE', 'PAYPAL_MODE') || 'sandbox'
    const PAYPAL_API_URL = mode === 'live' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com'
    const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    const order = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'EUR',
            value: amount.toFixed(2)
          },
          description: description || 'Reifendienst-Buchung'
        }],
        application_context: {
          brand_name: 'Bereifung24',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${process.env.NEXTAUTH_URL}/dashboard/customer/direct-booking/success`,
          cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/customer/direct-booking/checkout`
        }
      })
    })

    const orderData = await order.json()

    if (!order.ok) {
      console.error('PayPal order creation failed:', orderData)
      return NextResponse.json(
        { error: 'PayPal-Bestellung konnte nicht erstellt werden' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      orderId: orderData.id 
    })

  } catch (error) {
    console.error('Error creating PayPal order:', error)
    return NextResponse.json(
      { error: 'Fehler bei der PayPal-Zahlung' },
      { status: 500 }
    )
  }
}
