import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/getAuthUser'
import {
  sendToUser,
  broadcastToAll,
  getRecentNotifications,
  getNotificationStats,
  type PushPayload,
} from '@/lib/pushNotificationService'

/**
 * GET /api/admin/push-notifications
 * List recent push notifications + stats
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser || (authUser.role !== 'ADMIN' && authUser.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 403 })
    }

    const url = new URL(request.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 200)
    const page = Math.max(parseInt(url.searchParams.get('page') || '1'), 1)
    const search = url.searchParams.get('search') || undefined

    const [notifResult, stats] = await Promise.all([
      getRecentNotifications(limit, page, search),
      getNotificationStats(),
    ])

    return NextResponse.json({ ...notifResult, stats })
  } catch (error) {
    console.error('[PUSH API] GET error:', error)
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}

/**
 * POST /api/admin/push-notifications
 * Send a push notification
 * 
 * Body:
 *   { mode: "user", userId: "...", title: "...", body: "...", type: "manual" }
 *   { mode: "broadcast", title: "...", body: "...", type: "season_tip" }
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser || (authUser.role !== 'ADMIN' && authUser.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 403 })
    }

    const body = await request.json()
    const { mode, userId, title, body: msgBody, type = 'manual', data } = body

    if (!title || !msgBody) {
      return NextResponse.json({ error: 'Titel und Nachricht erforderlich' }, { status: 400 })
    }

    const payload: PushPayload = { title, body: msgBody, type, data }
    const sentBy = authUser.id

    if (mode === 'broadcast') {
      const result = await broadcastToAll(payload, sentBy)
      return NextResponse.json({
        success: true,
        message: `Broadcast gesendet: ${result.sent}/${result.total} erfolgreich`,
        ...result,
      })
    }

    if (mode === 'user' && userId) {
      const result = await sendToUser(userId, payload, sentBy)
      return NextResponse.json({
        success: result.success,
        message: result.success ? 'Push gesendet' : result.error,
      })
    }

    return NextResponse.json({ error: 'Ungültiger Modus (user/broadcast)' }, { status: 400 })
  } catch (error) {
    console.error('[PUSH API] POST error:', error)
    return NextResponse.json({ error: 'Fehler beim Senden' }, { status: 500 })
  }
}
