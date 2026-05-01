import { NextRequest, NextResponse } from 'next/server'
import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'

const WORKSHOP_FIELDS = [
  'notifyWsBookingReceived',
  'notifyWsBookingCancelled',
  'notifyWsReviewReceived',
  'notifyWsPayoutReceived',
  'notifyWsAppointmentReminder',
] as const

const SELECT_FIELDS = WORKSHOP_FIELDS.reduce((acc, f) => {
  acc[f] = true
  return acc
}, {} as Record<string, boolean>)

/**
 * GET /api/workshop/notification-settings
 * Get push notification preferences for the authenticated workshop user
 */
export async function GET(request: NextRequest) {
  try {
    const user = authenticateMobileRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: SELECT_FIELDS,
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json(dbUser)
  } catch (error) {
    console.error('[WORKSHOP NOTIFICATION SETTINGS GET] Error:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Einstellungen' }, { status: 500 })
  }
}

/**
 * PUT /api/workshop/notification-settings
 * Update push notification preferences for the authenticated workshop user
 */
export async function PUT(request: NextRequest) {
  try {
    const user = authenticateMobileRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const body = await request.json()
    const updateData: Record<string, boolean> = {}

    for (const field of WORKSHOP_FIELDS) {
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
      select: SELECT_FIELDS,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[WORKSHOP NOTIFICATION SETTINGS PUT] Error:', error)
    return NextResponse.json({ error: 'Fehler beim Speichern der Einstellungen' }, { status: 500 })
  }
}
