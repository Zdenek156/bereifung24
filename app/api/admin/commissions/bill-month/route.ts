// app/api/admin/commissions/bill-month/route.ts
// Admin endpoint to trigger monthly billing for all workshops

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  createPayment,
  calculateCommission,
  generateInvoiceNumber,
  formatAmountForGoCardless
} from '@/lib/gocardless'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    // Check if admin
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 })
    }

    const { year, month } = await request.json()

    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Invalid year or month' },
        { status: 400 }
      )
    }

    // Calculate billing period
    const billingStart = new Date(year, month - 1, 1)
    const billingEnd = new Date(year, month, 0, 23, 59, 59)

    console.log(`📅 Starting monthly billing for ${year}-${month}...`)

    // Get all workshops with active SEPA mandates
    const workshops = await prisma.workshop.findMany({
      where: {
        gocardlessMandateId: { not: null },
        gocardlessMandateStatus: 'active'
      },
      select: {
        id: true,
        name: true,
        email: true,
        gocardlessMandateId: true,
        bookings: {
          where: {
            status: 'CONFIRMED',
            appointmentDate: {
              gte: billingStart,
              lte: billingEnd
            }
          },
          select: {
            id: true,
            appointmentDate: true,
            tireRequest: {
              select: {
                serviceType: true
              }
            },
            offer: {
              select: {
                totalPrice: true
              }
            }
          }
        }
      }
    })

    const results = []
    let totalProcessed = 0
    let totalSkipped = 0
    let totalErrors = 0

    for (const workshop of workshops) {
      try {
        // Calculate total revenue for this workshop in the billing period
        const totalRevenue = workshop.bookings.reduce(
          (sum, booking) => sum + (booking.offer?.totalPrice || 0),
          0
        )

        // Skip if no revenue
        if (totalRevenue === 0) {
          console.log(`⏭️ Workshop ${workshop.name} - No revenue for ${year}-${month}`)
          totalSkipped++
          continue
        }

        // Calculate commission
        const commission = calculateCommission(totalRevenue, 4.9)

        // Get next invoice sequence number for this month
        const existingInvoices = await prisma.commission.count({
          where: {
            billingYear: year,
            billingMonth: month
          }
        })
        const invoiceNumber = generateInvoiceNumber(year, month, existingInvoices + 1)

        // Create commission records for each booking
        const commissionRecords = await Promise.all(
          workshop.bookings.map(async (booking) => {
            const bookingCommission = calculateCommission(booking.offer?.totalPrice || 0, 4.9)

            return prisma.commission.create({
              data: {
                workshopId: workshop.id,
                bookingId: booking.id,
                amount: bookingCommission.commissionGross,
                commissionRate: 4.9,
                netAmount: bookingCommission.commissionNet,
                grossAmount: bookingCommission.commissionGross,
                taxAmount: bookingCommission.taxAmount,
                taxRate: 19.0,
                status: 'PENDING',
                billingPeriodStart: billingStart,
                billingPeriodEnd: billingEnd,
                billingMonth: month,
                billingYear: year,
                invoiceNumber,
                description: `Provision ${booking.tireRequest?.serviceType || 'Service'} - ${year}/${month.toString().padStart(2, '0')}`
              }
            })
          })
        )

        // Create GoCardless payment
        const chargeDate = new Date()
        chargeDate.setDate(chargeDate.getDate() + 3) // 3 days from now
        const chargeDateStr = chargeDate.toISOString().split('T')[0]

        const payment = await createPayment({
          amount: formatAmountForGoCardless(commission.commissionGross),
          currency: 'EUR',
          mandateId: workshop.gocardlessMandateId!,
          description: `Bereifung24 Provision ${year}/${month.toString().padStart(2, '0')}`,
          reference: invoiceNumber,
          chargeDate: chargeDateStr,
          metadata: {
            workshopId: workshop.id,
            billingMonth: month.toString(),
            billingYear: year.toString(),
            invoiceNumber
          }
        })

        // Update commission records with payment ID
        await prisma.commission.updateMany({
          where: {
            id: {
              in: commissionRecords.map((c) => c.id)
            }
          },
          data: {
            gocardlessPaymentId: payment.id,
            gocardlessPaymentStatus: payment.status,
            gocardlessChargeDate: new Date(payment.charge_date)
          }
        })

        console.log(`✅ Workshop ${workshop.name}: €${commission.commissionGross.toFixed(2)} scheduled for ${chargeDateStr}`)

        results.push({
          workshopId: workshop.id,
          workshopName: workshop.name,
          totalRevenue,
          commission: commission.commissionGross,
          commissionNet: commission.commissionNet,
          taxAmount: commission.taxAmount,
          invoiceNumber,
          paymentId: payment.id,
          chargeDate: chargeDateStr,
          bookingsCount: workshop.bookings.length,
          success: true
        })

        totalProcessed++

      } catch (error: any) {
        console.error(`❌ Error processing workshop ${workshop.name}:`, error.message)
        results.push({
          workshopId: workshop.id,
          workshopName: workshop.name,
          success: false,
          error: error.message
        })
        totalErrors++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Monatliche Abrechnung für ${year}-${month} abgeschlossen`,
      summary: {
        totalWorkshops: workshops.length,
        processed: totalProcessed,
        skipped: totalSkipped,
        errors: totalErrors
      },
      results
    })

  } catch (error: any) {
    console.error('Error in monthly billing:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process monthly billing' },
      { status: 500 }
    )
  }
}
