import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import { createFreelancerCommission } from '@/lib/freelancer/commissionService'
import { getApiSetting } from '@/lib/api-settings'

/**
 * POST /api/admin/commissions/backfill
 *
 * Backfills missing data for existing DirectBookings:
 * 1. stripeFee (real Stripe fee from balance_transaction)
 * 2. paymentMethodDetail (card type from charge)
 * 3. FreelancerCommission records for FL-workshop bookings
 *
 * Admin only. Safe to run multiple times (idempotent).
 */
export async function POST(request: Request) {
  try {
    // Allow admin session OR CRON_SECRET for server-side calls
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    const isCronAuth = cronSecret && authHeader === `Bearer ${cronSecret}`

    if (!isCronAuth) {
      const session = await getServerSession(authOptions)
      if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const results = {
      stripeFee: { updated: 0, failed: 0, skipped: 0 },
      paymentMethod: { updated: 0, failed: 0, skipped: 0 },
      freelancerCommission: { created: 0, skipped: 0, failed: 0 },
    }

    // 1. Find all PAID bookings missing stripeFee or paymentMethodDetail
    const bookingsMissingData = await prisma.directBooking.findMany({
      where: {
        paymentStatus: 'PAID',
        stripePaymentId: { not: null },
        OR: [
          { stripeFee: null },
          { paymentMethodDetail: null },
        ],
      },
      select: {
        id: true,
        stripePaymentId: true,
        stripeFee: true,
        paymentMethodDetail: true,
      },
    })

    console.log(`📊 Backfill: ${bookingsMissingData.length} bookings missing stripeFee or paymentMethodDetail`)

    // Get Stripe key
    const stripeSecretKey = await getApiSetting('STRIPE_SECRET_KEY')

    if (stripeSecretKey && bookingsMissingData.length > 0) {
      const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-11-20.acacia' as any })

      for (const booking of bookingsMissingData) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            booking.stripePaymentId!,
            { expand: ['latest_charge'] }
          )

          const charge = paymentIntent.latest_charge as Stripe.Charge | null
          if (!charge) {
            results.stripeFee.skipped++
            results.paymentMethod.skipped++
            continue
          }

          const updateData: Record<string, any> = {}

          // a. Get real Stripe fee
          if (booking.stripeFee === null && charge.balance_transaction) {
            try {
              const btId = typeof charge.balance_transaction === 'string'
                ? charge.balance_transaction
                : charge.balance_transaction.id
              const bt = await stripe.balanceTransactions.retrieve(btId)
              updateData.stripeFee = bt.fee / 100
              results.stripeFee.updated++
            } catch {
              results.stripeFee.failed++
            }
          } else {
            results.stripeFee.skipped++
          }

          // b. Get payment method detail
          if (booking.paymentMethodDetail === null) {
            const methodType = charge.payment_method_details?.type || null
            if (methodType) {
              updateData.paymentMethodDetail = methodType
              results.paymentMethod.updated++
            } else {
              results.paymentMethod.skipped++
            }
          } else {
            results.paymentMethod.skipped++
          }

          // Apply updates
          if (Object.keys(updateData).length > 0) {
            await prisma.directBooking.update({
              where: { id: booking.id },
              data: updateData,
            })
          }

          // Throttle to avoid Stripe rate limits
          await new Promise(resolve => setTimeout(resolve, 200))
        } catch (error) {
          console.error(`⚠️ Backfill failed for booking ${booking.id}:`, error)
          results.stripeFee.failed++
          results.paymentMethod.failed++
        }
      }
    }

    // 2. Backfill FreelancerCommission for FL-workshop bookings
    const flBookings = await prisma.directBooking.findMany({
      where: {
        paymentStatus: 'PAID',
        workshop: {
          freelancerId: { not: null },
        },
      },
      select: {
        id: true,
        workshop: {
          select: { freelancerId: true },
        },
      },
    })

    // Get existing commissions to skip
    const existingCommissions = await prisma.freelancerCommission.findMany({
      select: { bookingId: true },
    })
    const existingBookingIds = new Set(existingCommissions.map(c => c.bookingId))

    for (const booking of flBookings) {
      if (existingBookingIds.has(booking.id)) {
        results.freelancerCommission.skipped++
        continue
      }

      try {
        const result = await createFreelancerCommission(booking.id)
        if (result.created) {
          results.freelancerCommission.created++
          console.log(`✅ Backfill: FL commission created for booking ${booking.id}: ${result.freelancerAmount}€`)
        } else {
          results.freelancerCommission.skipped++
        }
      } catch (error) {
        console.error(`⚠️ FL commission backfill failed for booking ${booking.id}:`, error)
        results.freelancerCommission.failed++
      }
    }

    console.log('📊 Backfill complete:', results)

    return NextResponse.json({
      success: true,
      results,
      summary: {
        stripeFeesUpdated: results.stripeFee.updated,
        paymentMethodsUpdated: results.paymentMethod.updated,
        freelancerCommissionsCreated: results.freelancerCommission.created,
      },
    })
  } catch (error) {
    console.error('❌ Backfill error:', error)
    return NextResponse.json(
      { error: 'Backfill failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
