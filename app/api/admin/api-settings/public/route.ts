import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/api-settings/public?key=PAYPAL_CLIENT_ID
 * Public endpoint to get specific API settings (only non-sensitive keys)
 * Used by frontend components to load PayPal Client ID
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json(
        { error: 'Key parameter required' },
        { status: 400 }
      )
    }

    // Only allow public keys (not secrets)
    const allowedPublicKeys = [
      'PAYPAL_CLIENT_ID',
      'STRIPE_PUBLISHABLE_KEY',
      'GOOGLE_MAPS_API_KEY'
    ]

    if (!allowedPublicKeys.includes(key)) {
      return NextResponse.json(
        { error: 'This key is not publicly accessible' },
        { status: 403 }
      )
    }

    const setting = await prisma.adminApiSetting.findUnique({
      where: { key },
      select: { value: true }
    })

    if (!setting || !setting.value) {
      return NextResponse.json(
        { error: 'Setting not found or not configured' },
        { status: 404 }
      )
    }

    return NextResponse.json({ value: setting.value })
  } catch (error) {
    console.error('Error fetching public API setting:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
