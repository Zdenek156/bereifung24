import { NextRequest, NextResponse } from 'next/server'
import { authenticateMobileRequest, revokeRefreshToken } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = authenticateMobileRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Revoke refresh token and clear FCM token
    await prisma.user.update({
      where: { id: user.userId },
      data: {
        refreshToken: null,
        refreshTokenExpiry: null,
        fcmToken: null,
        fcmTokenUpdatedAt: null,
      },
    })

    return NextResponse.json({ success: true, message: 'Erfolgreich abgemeldet' })

  } catch (error) {
    console.error('[MOBILE LOGOUT] Error:', error)
    return NextResponse.json({ error: 'Abmeldefehler' }, { status: 500 })
  }
}
