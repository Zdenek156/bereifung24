import { NextRequest, NextResponse } from 'next/server'
import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/user/notification-settings
 * Get push notification preferences for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = authenticateMobileRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        notifyBookingConfirmation: true,
        notifyReminder: true,
        notifySeason: true,
        notifyBookingUpdate: true,
      },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json(dbUser)

  } catch (error) {
    console.error('[NOTIFICATION SETTINGS GET] Error:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Einstellungen' }, { status: 500 })
  }
}

/**
 * PUT /api/user/notification-settings
 * Update push notification preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const user = authenticateMobileRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const body = await request.json()

    // Only allow known notification fields
    const allowedFields = ['notifyBookingConfirmation', 'notifyReminder', 'notifySeason', 'notifyBookingUpdate'] as const
    const updateData: Record<string, boolean> = {}

    for (const field of allowedFields) {
      if (typeof body[field] === 'boolean') {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Keine gültigen Einstellungen angegeben' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: user.userId },
      data: updateData,
      select: {
        notifyBookingConfirmation: true,
        notifyReminder: true,
        notifySeason: true,
        notifyBookingUpdate: true,
      },
    })

    return NextResponse.json(updated)

  } catch (error) {
    console.error('[NOTIFICATION SETTINGS PUT] Error:', error)
    return NextResponse.json({ error: 'Fehler beim Speichern der Einstellungen' }, { status: 500 })
  }
}
