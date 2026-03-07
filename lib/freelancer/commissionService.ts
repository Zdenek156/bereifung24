import { prisma } from '@/lib/prisma'
import { calculateFreelancerCommission, getTierInfo } from '@/lib/freelancer-auth'
import { AccountingBookingService } from '@/lib/accounting/bookingService'

const bookingService = new AccountingBookingService()

/**
 * Create a FreelancerCommission record when a booking is paid
 * for a workshop that belongs to a freelancer.
 *
 * Flow:
 *   bookingAmount (totalPrice)
 *     → 6.9% = b24GrossCommission
 *       → minus stripeFee = b24NetCommission
 *         → freelancerPercentage% (15/20/25/30) = freelancerAmount
 *
 * Called from the Stripe webhook after checkout.session.completed
 */
export async function createFreelancerCommission(bookingId: string): Promise<{
  created: boolean
  commissionId?: string
  freelancerAmount?: number
  error?: string
}> {
  try {
    // 1. Load the booking with workshop → freelancer
    const booking = await prisma.directBooking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        totalPrice: true,
        platformCommission: true,
        stripeFee: true,
        stripeFeesEstimate: true,
        platformNetCommission: true,
        paidAt: true,
        workshop: {
          select: {
            id: true,
            companyName: true,
            freelancerId: true,
            freelancer: {
              select: {
                id: true,
                tier: true,
                status: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    })

    if (!booking) {
      return { created: false, error: 'Booking not found' }
    }

    // 2. No freelancer → nothing to do
    if (!booking.workshop.freelancerId || !booking.workshop.freelancer) {
      return { created: false }
    }

    const freelancer = booking.workshop.freelancer

    // Only active freelancers earn commission
    if (freelancer.status !== 'ACTIVE') {
      return { created: false, error: 'Freelancer not active' }
    }

    // 3. Prevent duplicate commission for same booking
    const existing = await prisma.freelancerCommission.findFirst({
      where: { bookingId: booking.id, freelancerId: freelancer.id },
    })
    if (existing) {
      return { created: false, error: 'Commission already exists for this booking' }
    }

    // 4. Count active workshops for tier determination
    const activeWorkshopCount = await prisma.workshop.count({
      where: {
        freelancerId: freelancer.id,
        status: 'ACTIVE',
      },
    })

    const tierInfo = getTierInfo(activeWorkshopCount)

    // 5. Calculate commission amounts
    const bookingAmount = Number(booking.totalPrice)
    const actualStripeFee = booking.stripeFee
      ? Number(booking.stripeFee)
      : booking.stripeFeesEstimate
        ? Number(booking.stripeFeesEstimate)
        : bookingAmount * 0.015 + 0.25 // fallback estimate

    const b24GrossCommission = booking.platformCommission
      ? Number(booking.platformCommission)
      : bookingAmount * 0.069

    const b24NetCommission = booking.platformNetCommission
      ? Number(booking.platformNetCommission)
      : b24GrossCommission - actualStripeFee

    const freelancerPercentage = tierInfo.percentage
    const freelancerAmount = Math.round(b24NetCommission * (freelancerPercentage / 100) * 100) / 100

    // 6. Calculate period (YYYY-MM based on paidAt or now)
    const paidDate = booking.paidAt || new Date()
    const period = `${paidDate.getFullYear()}-${String(paidDate.getMonth() + 1).padStart(2, '0')}`

    // 7. Create the commission record
    const commission = await prisma.freelancerCommission.create({
      data: {
        freelancerId: freelancer.id,
        bookingId: booking.id,
        workshopId: booking.workshop.id,
        bookingAmount: Math.round(bookingAmount * 100) / 100,
        b24GrossCommission: Math.round(b24GrossCommission * 100) / 100,
        stripeFee: Math.round(actualStripeFee * 100) / 100,
        b24NetCommission: Math.round(b24NetCommission * 100) / 100,
        freelancerPercentage,
        freelancerAmount,
        period,
      },
    })

    // 8. Update freelancer tier if changed
    if (freelancer.tier !== tierInfo.tier) {
      await prisma.freelancer.update({
        where: { id: freelancer.id },
        data: { tier: tierInfo.tier },
      })
      console.log(`📊 Freelancer tier updated: ${freelancer.tier} → ${tierInfo.tier}`)
    }

    // 9. Create accounting entry (expense: Provisionsaufwendungen)
    //    SOLL 4650 (Provisionsaufwendungen) / HABEN 1200 (Bank)
    //    This records the freelancer's share as a B24 expense
    try {
      await bookingService.createBooking({
        debitAccountNumber: '4650',   // Provisionsaufwendungen (expense)
        creditAccountNumber: '1200',  // Bank (will be paid from bank)
        amount: freelancerAmount,
        description: `Freelancer-Provision ${freelancer.user.firstName} ${freelancer.user.lastName} – ${booking.workshop.companyName} – Buchung ${booking.id.slice(-8)} (${tierInfo.tier} ${freelancerPercentage}%)`,
        bookingDate: paidDate,
        sourceType: 'COMMISSION',
        sourceId: commission.id,
        referenceNumber: `FL-PROV-${period}-${commission.id.slice(-8)}`,
      })
      console.log(`📒 Accounting entry created for freelancer commission: ${freelancerAmount}€`)
    } catch (accountingError) {
      // Don't fail the commission if accounting entry fails
      console.error('⚠️ Failed to create accounting entry for freelancer commission:', accountingError)
    }

    console.log(`✅ Freelancer commission created: ${freelancerAmount}€ for ${freelancer.user.firstName} ${freelancer.user.lastName} (${tierInfo.tier} ${freelancerPercentage}%) – Workshop: ${booking.workshop.companyName}`)

    return {
      created: true,
      commissionId: commission.id,
      freelancerAmount,
    }
  } catch (error) {
    console.error('❌ Error creating freelancer commission:', error)
    return { created: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
