import cron from 'node-cron'
import { prisma } from '@/lib/prisma'

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

  // Get all workshops with PENDING commissions
  const workshops = await prisma.workshop.findMany({
    where: {
      commissions: {
        some: { status: 'PENDING' }
      }
    },
    include: {
      commissions: {
        where: {
          status: 'PENDING'
        }
      }
    }
  })

  const results = {
    totalWorkshops: 0,
    totalCommissions: 0,
    totalGrossAmount: 0,
    successfulPayments: 0,
    failedPayments: 0
  }

  for (const workshop of workshops) {
    if (workshop.commissions.length === 0) continue

    // Calculate total commission amount from PENDING commissions
    const commissionGross = workshop.commissions.reduce(
      (sum, commission) => sum + Number(commission.commissionAmount), 
      0
    )

    if (commissionGross < 0.01) continue // Skip if less than 1 cent

    results.totalWorkshops++
    results.totalCommissions += workshop.commissions.length
    results.totalGrossAmount += commissionGross

    results.totalWorkshops++
    results.totalCommissions += workshop.commissions.length
    results.totalGrossAmount += commissionGross

    // Mark commissions as COLLECTED for billing
    try {
      await prisma.commission.updateMany({
        where: {
          id: {
            in: workshop.commissions.map(c => c.id)
          }
        },
        data: {
          status: 'COLLECTED',
          billedAt: new Date(),
          billingMonth: month,
          billingYear: year,
          notes: `Automatische Abrechnung für ${month}/${year}`
        }
      })

      results.successfulPayments++
      console.log(`✅ Billing for ${workshop.companyName}: ${commissionGross.toFixed(2)}€ (${workshop.commissions.length} commissions)`)
    } catch (billingError) {
      console.error(`❌ Failed to bill ${workshop.companyName}:`, billingError)
      results.failedPayments++
    }
  }

  console.log('📊 Billing Summary:', results)
  return results
}
