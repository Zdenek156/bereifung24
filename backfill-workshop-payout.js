/**
 * Backfill workshop payout and platform commission for existing bookings
 * Run with: node backfill-workshop-payout.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function backfillWorkshopPayout() {
  console.log('🔄 Starting backfill for workshop payout and platform commission...')

  try {
    // Find all DirectBookings where workshopPayout is null
    const bookings = await prisma.directBooking.findMany({
      where: {
        workshopPayout: null
      },
      select: {
        id: true,
        totalPrice: true
      }
    })

    console.log(`📊 Found ${bookings.length} bookings without workshop payout`)

    if (bookings.length === 0) {
      console.log('✅ No bookings to update')
      return
    }

    const platformCommissionRate = 0.069 // 6.9%
    let updated = 0
    let failed = 0

    for (const booking of bookings) {
      try {
        const totalPrice = Number(booking.totalPrice)
        const platformCommission = totalPrice * platformCommissionRate
        const workshopPayout = totalPrice - platformCommission

        await prisma.directBooking.update({
          where: { id: booking.id },
          data: {
            platformCommission: platformCommission,
            workshopPayout: workshopPayout
          }
        })

        updated++
        console.log(`✓ Updated booking ${booking.id}: Total ${totalPrice.toFixed(2)}€ → Workshop ${workshopPayout.toFixed(2)}€ (Commission: ${platformCommission.toFixed(2)}€)`)
      } catch (error) {
        failed++
        console.error(`✗ Failed to update booking ${booking.id}:`, error.message)
      }
    }

    console.log('\n📈 Backfill Summary:')
    console.log(`   ✅ Updated: ${updated}`)
    console.log(`   ❌ Failed: ${failed}`)
    console.log(`   📊 Total: ${bookings.length}`)

  } catch (error) {
    console.error('❌ Error during backfill:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

backfillWorkshopPayout()
  .then(() => {
    console.log('\n✅ Backfill completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Backfill failed:', error)
    process.exit(1)
  })
