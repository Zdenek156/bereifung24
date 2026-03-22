import { NextRequest, NextResponse } from 'next/server'
import { validateRefreshToken, issueTokenPair, revokeRefreshToken } from '@/lib/mobile-auth'
import { checkRefreshRateLimit, getClientIp } from '@/lib/auth-rate-limiter'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request)
    const rateLimit = checkRefreshRateLimit(ip)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Zu viele Anfragen. Bitte in ${rateLimit.retryAfterSeconds} Sekunden erneut versuchen.` },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
      )
    }

    const { refreshToken } = await request.json()

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh Token erforderlich' },
        { status: 400 }
      )
    }

    // Validate refresh token
    const user = await validateRefreshToken(refreshToken)

    if (!user) {
      return NextResponse.json(
        { error: 'Ungültiger oder abgelaufener Refresh Token' },
        { status: 401 }
      )
    }

    // Revoke old refresh token (rotation for security)
    await revokeRefreshToken(user.id)

    // Issue new token pair
    const tokens = await issueTokenPair(user)

    return NextResponse.json(tokens)

  } catch (error) {
    console.error('[MOBILE REFRESH] Error:', error)
    return NextResponse.json(
      { error: 'Token-Aktualisierung fehlgeschlagen' },
      { status: 500 }
    )
  }
}
