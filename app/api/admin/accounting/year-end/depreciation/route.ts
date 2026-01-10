import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Complete Depreciation Calculation Step
 * Calculates and books depreciation for all assets for the fiscal year
 */
export async function POST(request: NextRequest) {
  console.log('[YEAR-END DEPRECIATION] API Called')
  
  try {
    const session = await getServerSession(authOptions)
    console.log('[YEAR-END DEPRECIATION] Session:', session?.user?.email, session?.user?.role)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const year = body.year || new Date().getFullYear()
    
    console.log('[YEAR-END DEPRECIATION] Processing depreciation for year:', year)

    // Check if balance sheet exists
    const balanceSheet = await prisma.balanceSheet.findUnique({
      where: { year }
    })

    if (!balanceSheet) {
      return NextResponse.json({
        success: false,
        error: 'Keine Bilanz für dieses Jahr gefunden'
      }, { status: 404 })
    }

    if (balanceSheet.locked) {
      return NextResponse.json({
        success: false,
        error: 'Geschäftsjahr ist bereits gesperrt'
      }, { status: 400 })
    }

    // Get all active assets that need depreciation for this year
    const endDate = new Date(year, 11, 31)
    
    // First, get count of existing depreciations for this year per asset
    const existingDepreciations = await prisma.depreciation.groupBy({
      by: ['assetId'],
      where: { year },
      _count: true
    })
    
    const assetsWithDepreciation = new Set(
      existingDepreciations.map(d => d.assetId)
    )
    
    const assets = await prisma.asset.findMany({
      where: {
        acquisitionDate: {
          lte: endDate
        },
        OR: [
          { disposalDate: null },
          { disposalDate: { gt: new Date(year, 0, 1) } }
        ]
      }
    })

    let createdCount = 0
    let skippedCount = 0

    // Create depreciation entries for assets that don't have them yet
    for (const asset of assets) {
      // Skip if already has depreciation for this year
      if (assetsWithDepreciation.has(asset.id)) {
        skippedCount++
        continue
      }
      
      if (asset.usefulLife > 0 && !asset.fullyDepreciated) {
        // Use the annual depreciation already calculated in Asset
        const annualDepreciation = asset.annualDepreciation
        const monthlyDepreciation = annualDepreciation / 12
        
        // Create monthly depreciation entries for the year
        for (let month = 1; month <= 12; month++) {
          await prisma.depreciation.create({
            data: {
              assetId: asset.id,
              year,
              month,
              depreciationRate: (1 / asset.usefulLife) * 100, // Percentage
              depreciationAmount: monthlyDepreciation,
              accumulatedDepreciation: 0, // To be calculated
              bookValue: asset.bookValue,
              method: asset.afaMethod
            }
          })
        }
        createdCount++
      } else {
        skippedCount++
      }
    }

    console.log('[YEAR-END DEPRECIATION] Created:', createdCount, 'Skipped:', skippedCount)

    return NextResponse.json({
      success: true,
      message: `Abschreibungen berechnet: ${createdCount} neu erstellt, ${skippedCount} bereits vorhanden`,
      data: {
        created: createdCount,
        skipped: skippedCount
      }
    })
  } catch (error) {
    console.error('[YEAR-END DEPRECIATION] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Fehler bei der Abschreibungsberechnung'
    }, { status: 500 })
  }
}
