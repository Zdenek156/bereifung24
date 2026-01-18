import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/admin/accounting/assets/depreciation/run
 * Run monthly depreciation for all active assets
 * 
 * This calculates the monthly depreciation (AfA) for each active asset
 * and creates depreciation entries in the database.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current year and month
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // 1-based month

    console.log(`Running monthly depreciation for ${currentYear}-${currentMonth}`)

    // Get all active assets that are not fully depreciated
    const assets = await prisma.asset.findMany({
      where: {
        status: 'ACTIVE',
        fullyDepreciated: false
      }
    })

    console.log(`Found ${assets.length} active assets`)

    let processedCount = 0
    let skippedCount = 0

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
        console.log(`Depreciation already exists for asset ${asset.name} in ${currentYear}-${currentMonth}`)
        skippedCount++
        continue
      }

      // Calculate monthly depreciation
      const monthlyDepreciation = asset.annualDepreciation / 12
      
      // Calculate new book value
      const newBookValue = Math.max(0, asset.bookValue - monthlyDepreciation)
      
      // Check if asset becomes fully depreciated
      const isFullyDepreciated = newBookValue <= 0

      // Create depreciation entry
      await prisma.depreciationEntry.create({
        data: {
          assetId: asset.id,
          year: currentYear,
          month: currentMonth,
          amount: monthlyDepreciation,
          bookValue: newBookValue,
          notes: `Monatliche AfA ${currentMonth}/${currentYear}`
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

      console.log(`Processed depreciation for asset ${asset.name}: €${monthlyDepreciation.toFixed(2)}`)
      processedCount++
    }

    console.log(`Monthly depreciation completed: ${processedCount} processed, ${skippedCount} skipped`)

    return NextResponse.json({
      success: true,
      message: `Monatliche AfA erfolgreich ausgeführt für ${processedCount} Anlagen`,
      details: {
        processed: processedCount,
        skipped: skippedCount,
        year: currentYear,
        month: currentMonth
      }
    })
  } catch (error) {
    console.error('Error running monthly depreciation:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to run monthly depreciation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
