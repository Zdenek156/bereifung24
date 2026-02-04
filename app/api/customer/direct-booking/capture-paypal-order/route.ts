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
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Fehlende Order ID' },
        { status: 400 }
      )
    }

    const accessToken = await generatePayPalAccessToken()
    const mode = await getApiSetting('PAYPAL_MODE', 'PAYPAL_MODE') || 'sandbox'
    const PAYPAL_API_URL = mode === 'live' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com'

    const capture = await fetch(
      `${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    const captureData = await capture.json()

    if (!capture.ok) {
      console.error('PayPal capture failed:', captureData)
      return NextResponse.json(
        { error: 'Zahlung konnte nicht erfasst werden' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      captureId: captureData.id,
      status: captureData.status
    })

  } catch (error) {
    console.error('Error capturing PayPal order:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Zahlungserfassung' },
      { status: 500 }
    )
  }
}
