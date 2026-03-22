import { NextRequest, NextResponse } from 'next/server'
import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/user/fcm-token
 * Save or update the FCM push token for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const user = authenticateMobileRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { fcmToken } = await request.json()

    if (!fcmToken || typeof fcmToken !== 'string') {
      return NextResponse.json({ error: 'FCM Token erforderlich' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: user.userId },
      data: {
        fcmToken,
        fcmTokenUpdatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[FCM TOKEN] Error:', error)
    return NextResponse.json({ error: 'Fehler beim Speichern des FCM Tokens' }, { status: 500 })
  }
}

/**
 * DELETE /api/user/fcm-token
 * Remove the FCM token (e.g. on notification opt-out)
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = authenticateMobileRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: user.userId },
      data: {
        fcmToken: null,
        fcmTokenUpdatedAt: null,
      },
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[FCM TOKEN DELETE] Error:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen des FCM Tokens' }, { status: 500 })
  }
}
