import cron from 'node-cron'
import { prisma } from '@/lib/prisma'
import { createPayment } from '@/lib/gocardless'

const COMMISSION_RATE = 0.049 // 4.9%
const TAX_RATE = 0.19 // 19%

export function startBillingCron() {
  // Run on the 1st of every month at 02:00 AM
  cron.schedule('0 2 1 * *', async () => {
    console.log('🔄 Starting automatic monthly billing...', new Date().toISOString())
    
    try {
      const now = new Date()
      // Bill for the previous month
      const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
      const month = now.getMonth() === 0 ? 12 : now.getMonth()

      await runMonthlyBilling(year, month)
      
      console.log('✅ Monthly billing completed successfully')
    } catch (error) {
      console.error('❌ Error in monthly billing cron:', error)
      // TODO: Send error notification to admin
    }
  })

  console.log('✅ Billing cron job scheduled: 1st of every month at 02:00 AM')
}

async function runMonthlyBilling(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  console.log(`📅 Billing for ${month}/${year}`)

  // Get all workshops with SEPA mandates
  const workshops = await prisma.workshop.findMany({
    where: {
      gocardlessMandateId: { not: null },
      gocardlessMandateStatus: 'active'
    },
    include: {
      bookings: {
        where: {
          status: 'COMPLETED',
          completedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          offer: true
        }
      }
    }
  })

  const results = {
    totalWorkshops: 0,
    totalBookings: 0,
    totalGrossAmount: 0,
    successfulPayments: 0,
    failedPayments: 0
  }

  for (const workshop of workshops) {
    if (workshop.bookings.length === 0) continue

    // Calculate commissions
    const totalRevenue = workshop.bookings.reduce((sum: number, booking: any) => sum + (booking.offer?.price || 0), 0)
    const commissionNet = totalRevenue * COMMISSION_RATE
    const commissionTax = commissionNet * TAX_RATE
    const commissionGross = commissionNet + commissionTax

    if (commissionGross < 0.01) continue // Skip if less than 1 cent

    results.totalWorkshops++
    results.totalBookings += workshop.bookings.length
    results.totalGrossAmount += commissionGross

    // Check if already billed
    const existingBilling = await prisma.commission.findFirst({
        where: {
          workshopId: workshop.id,
          billingMonth: month,
          billingYear: year
        }
      })
    
    if (existingBilling) {
      console.log(`⚠️  Workshop ${workshop.companyName} already billed for ${month}/${year}`)
      continue
    }

    // Create commission records for each booking
    const commissionRecords = await Promise.all(
      workshop.bookings.map(async (booking: any) => {
        const bookingPrice = booking.offer?.price || 0
        const bookingCommission = {
          net: bookingPrice * COMMISSION_RATE,
          tax: (bookingPrice * COMMISSION_RATE) * TAX_RATE,
          gross: (bookingPrice * COMMISSION_RATE) * (1 + TAX_RATE)
        }

        return prisma.commission.create({
          data: {
            workshopId: workshop.id,
            bookingId: booking.id,
            orderTotal: bookingPrice,
            commissionRate: COMMISSION_RATE * 100, // Store as percentage (4.9)
            commissionAmount: bookingCommission.gross, // Total commission (gross)
            netAmount: bookingCommission.net,
            taxRate: TAX_RATE * 100, // Store as percentage (19.0)
            taxAmount: bookingCommission.tax,
            grossAmount: bookingCommission.gross,
            status: 'BILLED',
            billedAt: new Date(),
            billingMonth: month,
            billingYear: year,
            notes: `Automatische Abrechnung für ${month}/${year}`
          }
        })
      })
    )

    // Create GoCardless payment
    try {
      const payment = await createPayment({
        amount: Math.round(commissionGross * 100), // in cents
        currency: 'EUR',
        description: `Provision ${month}/${year} - ${workshop.companyName}`,
        mandateId: workshop.gocardlessMandateId!,
        metadata: {
          workshopId: workshop.id,
          billingYear: String(year),
          billingMonth: String(month),
          bookingsCount: String(workshop.bookings.length)
        }
      })

      // Update commissions with payment info
      await prisma.commission.updateMany({
        where: {
          id: {
            in: commissionRecords.map((c: any) => c.id)
          }
        },
        data: {
          gocardlessPaymentId: payment.id,
          gocardlessPaymentStatus: payment.status,
          gocardlessChargeDate: payment.charge_date ? new Date(payment.charge_date) : null,
          status: 'COLLECTED'
        }
      })

      results.successfulPayments++
      console.log(`✅ Payment created for ${workshop.companyName}: ${commissionGross.toFixed(2)}€`)
    } catch (paymentError) {
      console.error(`❌ Failed to create payment for ${workshop.companyName}:`, paymentError)
      results.failedPayments++

      // Mark commissions as failed
      await prisma.commission.updateMany({
        where: {
          id: {
            in: commissionRecords.map((c: any) => c.id)
          }
        },
        data: {
          status: 'FAILED',
          notes: `GoCardless payment failed: ${paymentError instanceof Error ? paymentError.message : 'Unknown error'}`
        }
      })
    }
  }

  console.log('📊 Billing Summary:', results)
  return results
}
