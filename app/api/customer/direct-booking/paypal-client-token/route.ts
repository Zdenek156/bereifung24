import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Generate PayPal Client Token for SDK v6
 * This token is used to initialize the PayPal JavaScript SDK
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[PAYPAL CLIENT TOKEN] Generating client token...')

    // Get PayPal credentials DIRECTLY from database (bypass cache)
    const settings = await prisma.adminApiSetting.findMany({
      where: {
        key: {
          in: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_API_URL']
        }
      }
    })
    
    const clientId = settings.find(s => s.key === 'PAYPAL_CLIENT_ID')?.value
    const clientSecret = settings.find(s => s.key === 'PAYPAL_CLIENT_SECRET')?.value
    const apiUrl = settings.find(s => s.key === 'PAYPAL_API_URL')?.value || 'https://api-m.paypal.com'

    if (!clientId || !clientSecret) {
      console.error('[PAYPAL CLIENT TOKEN] Missing credentials')
      return NextResponse.json(
        { error: 'PayPal credentials not configured' },
        { status: 500 }
      )
    }

    console.log('[PAYPAL CLIENT TOKEN] Credentials loaded:', {
      hasClientId: !!clientId,
      clientIdPrefix: clientId?.substring(0, 10) + '...',
      clientSecretPrefix: clientSecret?.substring(0, 10) + '...',
      apiUrl
    })

    // Generate client token (JWT format) for SDK v6
    // SDK v6 requires response_type=client_token to get JWT format (not Braintree token)
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const tokenResponse = await fetch(`${apiUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'grant_type': 'client_credentials',
        'response_type': 'client_token',
        'domains[]': 'bereifung24.de'
      }).toString()
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      console.error('[PAYPAL CLIENT TOKEN] Token generation failed:', error)
      return NextResponse.json(
        { error: 'Failed to generate client token' },
        { status: 500 }
      )
    }

    const { access_token } = await tokenResponse.json()
    console.log('[PAYPAL CLIENT TOKEN] ✅ Client token (JWT) generated successfully')
    console.log('[PAYPAL CLIENT TOKEN] Token format check:', {
      startsWithEyJ: access_token?.startsWith('eyJ'),
      tokenPrefix: access_token?.substring(0, 20) + '...',
      isJWT: access_token?.split('.').length === 3
    })

    return NextResponse.json({ 
      success: true,
      clientToken: access_token  // This is now a JWT token for SDK v6
    })

  } catch (error) {
    console.error('[PAYPAL CLIENT TOKEN] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
