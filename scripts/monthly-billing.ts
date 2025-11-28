// scripts/monthly-billing.ts
// Cron job script to run monthly billing automatically

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function runMonthlyBilling() {
  try {
    // Get previous month
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const year = lastMonth.getFullYear()
    const month = lastMonth.getMonth() + 1

    console.log(`\n📅 Starting automated monthly billing for ${year}-${month}...\n`)

    // Call the billing API endpoint
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/commissions/bill-month`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In production, use proper authentication
        // For now, we'll trust internal calls
      },
      body: JSON.stringify({ year, month })
    })

    const result = await response.json()

    if (result.success) {
      console.log(`\n✅ Monthly billing completed successfully\n`)
      console.log(`Summary:`)
      console.log(`  Total workshops: ${result.summary.totalWorkshops}`)
      console.log(`  Processed: ${result.summary.processed}`)
      console.log(`  Skipped: ${result.summary.skipped}`)
      console.log(`  Errors: ${result.summary.errors}`)

      if (result.results?.length > 0) {
        console.log(`\nDetails:`)
        result.results.forEach((r: any) => {
          if (r.success) {
            console.log(`  ✅ ${r.workshopName}: €${r.commission.toFixed(2)} (${r.bookingsCount} bookings)`)
          } else {
            console.log(`  ❌ ${r.workshopName}: ${r.error}`)
          }
        })
      }
    } else {
      console.error(`\n❌ Monthly billing failed:`, result.error)
      process.exit(1)
    }

  } catch (error) {
    console.error('Error running monthly billing:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

runMonthlyBilling()
