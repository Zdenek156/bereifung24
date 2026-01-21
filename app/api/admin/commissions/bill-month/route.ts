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

    // Get all workshops with valid SEPA mandates and PENDING commissions
    const workshops = await prisma.workshop.findMany({
      where: {
        gocardlessMandateId: { not: null },
        gocardlessMandateStatus: {
          in: ['pending_submission', 'submitted', 'active']
        }
      },
      select: {
        id: true,
        companyName: true,
        gocardlessMandateId: true,
        user: {
          select: {
            email: true
          }
        },
        commissions: {
          where: {
            status: 'PENDING'
          },
          select: {
            id: true,
            commissionAmount: true,
            netAmount: true,
            taxAmount: true,
            orderTotal: true,
            commissionRate: true,
            bookingId: true,
            createdAt: true
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
        // Calculate total commission from PENDING records
        const totalCommission = workshop.commissions.reduce(
          (sum, commission) => sum + Number(commission.commissionAmount),
          0
        )

        // Skip if no pending commissions
        if (totalCommission === 0 || workshop.commissions.length === 0) {
          console.log(`⏭️ Workshop ${workshop.companyName} - No pending commissions`)
          totalSkipped++
          continue
        }

        // Calculate totals
        const totalNet = workshop.commissions.reduce(
          (sum, c) => sum + Number(c.netAmount || 0),
          0
        )
        const totalTax = workshop.commissions.reduce(
          (sum, c) => sum + Number(c.taxAmount || 0),
          0
        )

        // Get next invoice sequence number for this month
        const existingInvoices = await prisma.commission.count({
          where: {
            billingYear: year,
            billingMonth: month
          }
        })
        const invoiceNumber = generateInvoiceNumber(year, month, existingInvoices + 1)

        // Create GoCardless payment for all PENDING commissions
        const chargeDate = new Date()
        chargeDate.setDate(chargeDate.getDate() + 3) // 3 days from now
        const chargeDateStr = chargeDate.toISOString().split('T')[0]

        const payment = await createPayment({
          amount: formatAmountForGoCardless(totalCommission),
          currency: 'EUR',
          mandateId: workshop.gocardlessMandateId!,
          description: `Bereifung24 Provision ${year}/${month.toString().padStart(2, '0')}`,
          reference: invoiceNumber,
          chargeDate: chargeDateStr,
          metadata: {
            workshopId: workshop.id,
            billingMonth: month.toString(),
            billingYear: year.toString(),
            invoiceNumber,
            commissionsCount: workshop.commissions.length.toString()
          }
        })

        // Update PENDING commissions to COLLECTED with payment info
        await prisma.commission.updateMany({
          where: {
            id: {
              in: workshop.commissions.map((c) => c.id)
            }
          },
          data: {
            gocardlessPaymentId: payment.id,
            gocardlessPaymentStatus: payment.status,
            gocardlessChargeDate: new Date(payment.charge_date),
            status: 'COLLECTED',
            billedAt: new Date(),
            billingMonth: month,
            billingYear: year,
            invoiceNumber
          }
        })

        console.log(`✅ Workshop ${workshop.companyName}: €${totalCommission.toFixed(2)} scheduled for ${chargeDateStr} (${workshop.commissions.length} commissions)`)

        results.push({
          workshopId: workshop.id,
          workshopName: workshop.companyName,
          commission: totalCommission,
          commissionNet: totalNet,
          taxAmount: totalTax,
          invoiceNumber,
          paymentId: payment.id,
          chargeDate: chargeDateStr,
          commissionsCount: workshop.commissions.length,
          success: true
        })

        totalProcessed++

      } catch (error: any) {
        console.error(`❌ Error processing workshop ${workshop.companyName}:`, error.message)
        
        // Mark commissions as FAILED
        await prisma.commission.updateMany({
          where: {
            id: {
              in: workshop.commissions.map(c => c.id)
            }
          },
          data: {
            status: 'FAILED',
            notes: `GoCardless payment failed: ${error.message}`
          }
        })
        
        results.push({
          workshopId: workshop.id,
          workshopName: workshop.companyName,
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
