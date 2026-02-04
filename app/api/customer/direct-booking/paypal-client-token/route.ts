import { NextRequest, NextResponse } from 'next/server'
import { getApiSetting } from '@/lib/api-settings'

/**
 * Generate PayPal Client Token for SDK v6
 * This token is used to initialize the PayPal JavaScript SDK
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[PAYPAL CLIENT TOKEN] Generating client token...')

    // Get PayPal credentials from database
    const clientId = await getApiSetting('PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_ID')
    const clientSecret = await getApiSetting('PAYPAL_CLIENT_SECRET', 'PAYPAL_CLIENT_SECRET')
    const apiUrl = await getApiSetting('PAYPAL_API_URL', 'https://api-m.paypal.com')

    if (!clientId || !clientSecret) {
      console.error('[PAYPAL CLIENT TOKEN] Missing credentials')
      return NextResponse.json(
        { error: 'PayPal credentials not configured' },
        { status: 500 }
      )
    }

    console.log('[PAYPAL CLIENT TOKEN] Credentials loaded:', {
      hasClientId: !!clientId,
      apiUrl
    })

    // Generate access token first
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const tokenResponse = await fetch(`${apiUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      console.error('[PAYPAL CLIENT TOKEN] Token generation failed:', error)
      return NextResponse.json(
        { error: 'Failed to generate access token' },
        { status: 500 }
      )
    }

    const { access_token } = await tokenResponse.json()
    console.log('[PAYPAL CLIENT TOKEN] Access token generated')

    // Generate client token using access token
    const clientTokenResponse = await fetch(`${apiUrl}/v1/identity/generate-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'Accept-Language': 'en_US'
      },
      body: JSON.stringify({})
    })

    if (!clientTokenResponse.ok) {
      const error = await clientTokenResponse.text()
      console.error('[PAYPAL CLIENT TOKEN] Client token generation failed:', error)
      return NextResponse.json(
        { error: 'Failed to generate client token' },
        { status: 500 }
      )
    }

    const { client_token } = await clientTokenResponse.json()
    console.log('[PAYPAL CLIENT TOKEN] ✅ Client token generated successfully')

    return NextResponse.json({ 
      success: true,
      clientToken: client_token 
    })

  } catch (error) {
    console.error('[PAYPAL CLIENT TOKEN] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
