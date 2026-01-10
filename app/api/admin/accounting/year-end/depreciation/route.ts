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
    
    const assets = await prisma.asset.findMany({
      where: {
        acquisitionDate: {
          lte: endDate
        },
        OR: [
          { disposalDate: null },
          { disposalDate: { gt: new Date(year, 0, 1) } }
        ]
      },
      include: {
        depreciations: {
          where: { year }
        }
      }
    })

    let createdCount = 0
    let skippedCount = 0

    // Create depreciation entries for assets that don't have them yet
    for (const asset of assets) {
      if (asset.depreciations.length === 0 && asset.usefulLife > 0) {
        // Calculate annual depreciation amount (already calculated in Asset)
        const annualDepreciation = asset.annualDepreciation
        
        await prisma.depreciation.create({
          data: {
            assetId: asset.id,
            year,
            amount: annualDepreciation,
            method: 'LINEAR',
            booked: false
          }
        })
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
