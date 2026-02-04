import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getApiSetting } from '@/lib/api-settings'

async function generatePayPalAccessToken() {
  const clientId = await getApiSetting('PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_ID')
  const clientSecret = await getApiSetting('PAYPAL_CLIENT_SECRET', 'PAYPAL_CLIENT_SECRET')
  const mode = await getApiSetting('PAYPAL_MODE', 'PAYPAL_MODE') || 'sandbox'

  console.log('[PAYPAL] Loaded credentials:', {
    hasClientId: !!clientId,
    clientIdLength: clientId?.length || 0,
    hasClientSecret: !!clientSecret,
    clientSecretLength: clientSecret?.length || 0,
    mode
  })

  if (!clientId || !clientSecret) {
    console.error('[PAYPAL] Missing credentials!')
    throw new Error('PayPal credentials not configured')
  }

  const PAYPAL_API_URL = mode === 'live' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com'

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  console.log('[PAYPAL] Generating access token...', { mode, apiUrl: PAYPAL_API_URL })

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
  console.log('[PAYPAL CREATE ORDER] API called')
  
  try {
    const session = await getServerSession(authOptions)
    console.log('[PAYPAL CREATE ORDER] Session:', { hasSession: !!session, userId: session?.user?.id })
    
    if (!session?.user?.id) {
      console.log('[PAYPAL CREATE ORDER] Unauthorized - no session')
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { amount, description, customerName, customerEmail, workshopName, date, time, street, city, zipCode, country } = body
    console.log('[PAYPAL CREATE ORDER] Request body:', { 
      amount, 
      hasDescription: !!description,
      customerName,
      customerEmail,
      workshopName,
      date,
      time,
      street,
      city,
      zipCode,
      country
    })

    if (!amount) {
      console.log('[PAYPAL CREATE ORDER] Missing amount')
      return NextResponse.json(
        { error: 'Fehlende Parameter' },
        { status: 400 }
      )
    }

    console.log('[PAYPAL CREATE ORDER] Generating access token...')
    const accessToken = await generatePayPalAccessToken()
    const mode = await getApiSetting('PAYPAL_MODE', 'PAYPAL_MODE') || 'sandbox'
    const PAYPAL_API_URL = mode === 'live' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com'
    const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    // Verwendungszweck zusammenstellen
    const paymentDescription = description || `Reifendienst-Termin bei ${workshopName || 'Werkstatt'} am ${date} um ${time}`

    const orderPayload: any = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'EUR',
          value: amount.toFixed(2)
        },
        description: paymentDescription,
        custom_id: `booking_${session.user.id}_${Date.now()}`, // Eindeutige Referenz
        invoice_id: `INV-${Date.now()}` // Rechnungsnummer
      }],
      application_context: {
        brand_name: 'Bereifung24',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${process.env.NEXTAUTH_URL}/dashboard/customer/direct-booking/success`,
        cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/customer/direct-booking/checkout`
      }
    }

    // Kundendaten hinzufügen (falls vorhanden)
    if (customerName && customerEmail) {
      orderPayload.payer = {
        name: {
          given_name: customerName.split(' ')[0] || customerName,
          surname: customerName.split(' ').slice(1).join(' ') || ''
        },
        email_address: customerEmail,
        address: {
          address_line_1: street || '',
          admin_area_2: city || '',
          postal_code: zipCode || '',
          country_code: country || 'DE'
        }
      }
    }

    console.log('[PAYPAL CREATE ORDER] Creating order with payload:', JSON.stringify(orderPayload, null, 2))

    const order = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(orderPayload)
    })

    const orderData = await order.json()

    if (!order.ok) {
      console.error('PayPal order creation failed:', orderData)
      return NextResponse.json(
        { error: 'PayPal-Bestellung konnte nicht erstellt werden' },
        { status: 500 }
      )
    }

    console.log('[PAYPAL CREATE ORDER] ✅ Order created:', orderData.id)

    // SDK v6 requires { id } format
    return NextResponse.json({ 
      id: orderData.id
    })

  } catch (error) {
    console.error('[PAYPAL CREATE ORDER] ❌ ERROR:', error)
    console.error('[PAYPAL CREATE ORDER] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fehler bei der PayPal-Zahlung' },
      { status: 500 }
    )
  }
}
