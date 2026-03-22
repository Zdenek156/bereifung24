import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/getAuthUser'
import { prisma } from '@/lib/prisma'
import { notifyReviewRequest } from '@/lib/pushNotificationService'

/**
 * POST /api/cron/review-prompts
 * Find completed bookings where appointment ended ~2h ago → send review push
 * 
 * Call via cron: every 30 minutes
 * curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://bereifung24.de/api/cron/review-prompts
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

    const now = new Date()

    // Find completed direct bookings where:
    // 1. Appointment was 2-4 hours ago (window to catch them)
    // 2. No ReviewPrompt exists yet
    // 3. No Review exists yet
    // 4. Customer has FCM token
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000)

    // Also check for bookings that are CONFIRMED/RESERVED but appointment time has passed
    // (workshop may not always mark as COMPLETED)
    const bookings = await prisma.directBooking.findMany({
      where: {
        // Booking date + time should be 2-4 hours ago
        // We check date <= today and filter by computed datetime below
        status: { in: ['COMPLETED', 'CONFIRMED'] },
        review: null, // No review yet
        reviewPrompt: null, // No prompt sent yet
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
          select: { id: true, companyName: true },
        },
      },
    })

    // Filter bookings where appointment end time was 2-4 hours ago
    const eligibleBookings = bookings.filter((booking) => {
      const [hours, minutes] = booking.time.split(':').map(Number)
      const appointmentStart = new Date(booking.date)
      appointmentStart.setHours(hours, minutes, 0, 0)
      // Appointment end = start + duration
      const appointmentEnd = new Date(
        appointmentStart.getTime() + (booking.durationMinutes || 60) * 60 * 1000
      )
      return appointmentEnd <= twoHoursAgo && appointmentEnd >= fourHoursAgo
    })

    console.log(
      `[CRON REVIEW] Found ${eligibleBookings.length} eligible bookings (of ${bookings.length} total without review)`
    )

    let sent = 0
    let failed = 0

    for (const booking of eligibleBookings) {
      const userId = booking.customer?.user?.id
      if (!userId) continue

      try {
        // Calculate scheduledAt (appointment end + 2h)
        const [hours, minutes] = booking.time.split(':').map(Number)
        const appointmentStart = new Date(booking.date)
        appointmentStart.setHours(hours, minutes, 0, 0)
        const scheduledAt = new Date(
          appointmentStart.getTime() +
            (booking.durationMinutes || 60) * 60 * 1000 +
            2 * 60 * 60 * 1000
        )

        // Create ReviewPrompt record
        await prisma.reviewPrompt.create({
          data: {
            directBookingId: booking.id,
            userId,
            workshopId: booking.workshop.id,
            scheduledAt,
            sentAt: new Date(),
          },
        })

        // Send push notification
        const result = await notifyReviewRequest(
          userId,
          booking.id,
          booking.workshop.companyName || 'Werkstatt'
        )

        if (result.success) {
          sent++
        } else {
          failed++
        }
      } catch (error) {
        console.error(`[CRON REVIEW] Error for booking ${booking.id}:`, error)
        failed++
      }
    }

    // Expire old prompts (7 days without review)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const expired = await prisma.reviewPrompt.updateMany({
      where: {
        sentAt: { not: null },
        completedAt: null,
        dismissedAt: null,
        expiredAt: null,
        createdAt: { lte: sevenDaysAgo },
      },
      data: {
        expiredAt: now,
      },
    })

    console.log(
      `[CRON REVIEW] Prompts sent: ${sent} OK, ${failed} failed. Expired: ${expired.count}`
    )

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      eligible: eligibleBookings.length,
      sent,
      failed,
      expired: expired.count,
    })
  } catch (error) {
    console.error('[CRON REVIEW] Error:', error)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}

/**
 * GET /api/cron/review-prompts
 * Health check
 */
export async function GET() {
  return NextResponse.json({
    service: 'review-prompts',
    description: 'Send review request push notifications 2h after appointment',
    schedule: 'Every 30 minutes',
    status: 'active',
  })
}
