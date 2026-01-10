import cron from 'node-cron'
import { prisma } from '@/lib/prisma'

/**
 * Automatic Monthly Depreciation (AfA) Cron Job
 * Runs on the 1st of every month at 03:00 AM
 * 
 * Calculates and books monthly depreciation for all active assets
 */
export function startDepreciationCron() {
  // Run on the 1st of every month at 03:00 AM
  cron.schedule('0 3 1 * *', async () => {
    console.log('🔄 Starting automatic monthly depreciation (AfA)...', new Date().toISOString())
    
    try {
      await runMonthlyDepreciation()
      console.log('✅ Monthly depreciation completed successfully')
    } catch (error) {
      console.error('❌ Error in monthly depreciation cron:', error)
      // TODO: Send error notification to admin
    }
  })

  console.log('✅ Depreciation cron job scheduled: 1st of every month at 03:00 AM')
}

async function runMonthlyDepreciation() {
  // Get current year and month
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // 1-based month

  console.log(`📅 Running monthly depreciation for ${currentYear}-${String(currentMonth).padStart(2, '0')}`)

  // Get all active assets that are not fully depreciated
  const assets = await prisma.asset.findMany({
    where: {
      status: 'ACTIVE',
      fullyDepreciated: false
    }
  })

  console.log(`📊 Found ${assets.length} active assets to process`)

  let processedCount = 0
  let skippedCount = 0
  let totalDepreciation = 0

  // Process each asset
  for (const asset of assets) {
    // Check if depreciation already exists for this month
    const existingEntry = await prisma.depreciationEntry.findUnique({
      where: {
        assetId_year_month: {
          assetId: asset.id,
          year: currentYear,
          month: currentMonth
        }
      }
    })

    if (existingEntry) {
      console.log(`⏭️  Skipping ${asset.name} - already processed for ${currentYear}-${currentMonth}`)
      skippedCount++
      continue
    }

    // Calculate monthly depreciation
    const monthlyDepreciation = asset.annualDepreciation / 12
    
    // Calculate new book value
    const newBookValue = Math.max(0, asset.bookValue - monthlyDepreciation)
    
    // Check if asset becomes fully depreciated
    const isFullyDepreciated = newBookValue <= 0

    try {
      // Create depreciation entry
      await prisma.depreciationEntry.create({
        data: {
          assetId: asset.id,
          year: currentYear,
          month: currentMonth,
          amount: monthlyDepreciation,
          bookValue: newBookValue,
          notes: `Automatische monatliche AfA ${String(currentMonth).padStart(2, '0')}/${currentYear}`
        }
      })

      // Update asset book value
      await prisma.asset.update({
        where: { id: asset.id },
        data: {
          bookValue: newBookValue,
          fullyDepreciated: isFullyDepreciated
        }
      })

      totalDepreciation += monthlyDepreciation
      processedCount++

      console.log(
        `✓ ${asset.name}: €${monthlyDepreciation.toFixed(2)} AfA, ` +
        `Neuer Buchwert: €${newBookValue.toFixed(2)}` +
        (isFullyDepreciated ? ' [Vollständig abgeschrieben]' : '')
      )
    } catch (error) {
      console.error(`❌ Error processing depreciation for asset ${asset.name}:`, error)
    }
  }

  console.log(
    `\n📈 Depreciation Summary:\n` +
    `   - Processed: ${processedCount} assets\n` +
    `   - Skipped: ${skippedCount} assets\n` +
    `   - Total AfA: €${totalDepreciation.toFixed(2)}\n` +
    `   - Period: ${currentYear}-${String(currentMonth).padStart(2, '0')}`
  )

  return {
    processed: processedCount,
    skipped: skippedCount,
    totalDepreciation,
    year: currentYear,
    month: currentMonth
  }
}
