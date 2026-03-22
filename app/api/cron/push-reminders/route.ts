import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/getAuthUser'
import { prisma } from '@/lib/prisma'
import { notifyBookingReminder } from '@/lib/pushNotificationService'

/**
 * POST /api/cron/push-reminders
 * Send appointment reminders (24h before) to users with FCM tokens
 * 
 * Call via cron: daily at 18:00
 * curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://bereifung24.de/api/cron/push-reminders
 */
export async function POST(request: NextRequest) {
  try {
    // Auth: CRON_SECRET or admin/employee session
    const authHeader = request.headers.get('authorization')
    const isManualTrigger = request.headers.get('x-manual-trigger') === 'true'

    if (isManualTrigger) {
      const authUser = await getAuthUser(request)
      if (!authUser || (authUser.role !== 'ADMIN' && authUser.role !== 'B24_EMPLOYEE')) {
        return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 401 })
      }
    } else {
      const cronSecret = process.env.CRON_SECRET
      if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Find bookings for tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0] // YYYY-MM-DD

    const tomorrowStart = new Date(tomorrowStr + 'T00:00:00.000Z')
    const tomorrowEnd = new Date(tomorrowStr + 'T23:59:59.999Z')

    // Get confirmed direct bookings for tomorrow where customer has FCM token
    const bookings = await prisma.directBooking.findMany({
      where: {
        date: {
          gte: tomorrowStart,
          lte: tomorrowEnd,
        },
        status: { in: ['RESERVED', 'CONFIRMED'] },
        customer: {
          user: {
            fcmToken: { not: null },
          },
        },
      },
      include: {
        customer: {
          include: {
            user: {
              select: { id: true, fcmToken: true },
            },
          },
        },
        workshop: {
          select: { companyName: true },
        },
      },
    })

    console.log(`[CRON PUSH] Found ${bookings.length} bookings for tomorrow (${tomorrowStr})`)

    let sent = 0
    let failed = 0

    for (const booking of bookings) {
      const userId = booking.customer?.user?.id
      if (!userId) continue

      try {
        const dateFormatted = new Date(booking.date).toLocaleDateString('de-DE', {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })

        const result = await notifyBookingReminder(
          userId,
          booking.id,
          booking.workshop?.companyName || 'Werkstatt',
          dateFormatted,
          booking.time
        )

        if (result.success) sent++
        else failed++
      } catch (error) {
        console.error(`[CRON PUSH] Error for booking ${booking.id}:`, error)
        failed++
      }
    }

    console.log(`[CRON PUSH] Reminders sent: ${sent} OK, ${failed} failed`)

    return NextResponse.json({
      success: true,
      date: tomorrowStr,
      bookingsFound: bookings.length,
      sent,
      failed,
    })
  } catch (error) {
    console.error('[CRON PUSH] Error:', error)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}

/**
 * GET /api/cron/push-reminders
 * Health check
 */
export async function GET() {
  return NextResponse.json({
    service: 'push-reminders',
    status: 'ok',
    description: 'Sends appointment reminder push notifications 24h before',
  })
}
