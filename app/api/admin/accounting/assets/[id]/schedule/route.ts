import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/accounting/assets/[id]/schedule
 * Get depreciation schedule for an asset
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const asset = await prisma.asset.findUnique({
      where: { id: params.id },
      include: {
        depreciationEntries: {
          orderBy: [
            { year: 'asc' },
            { month: 'asc' }
          ]
        }
      }
    })

    if (!asset) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      )
    }

    // Generate depreciation schedule
    const schedule = []
    const startYear = asset.acquisitionDate.getFullYear()
    const currentYear = new Date().getFullYear()
    let remainingValue = asset.acquisitionCost
    const annualDepreciation = asset.annualDepreciation

    for (let year = startYear; year <= startYear + asset.usefulLife; year++) {
      const openingValue = remainingValue
      const depreciation = Math.min(annualDepreciation, remainingValue)
      const closingValue = remainingValue - depreciation

      schedule.push({
        period: year.toString(),
        openingValue: openingValue,
        depreciation: depreciation,
        closingValue: closingValue
      })

      remainingValue = closingValue

      if (remainingValue <= 0) break
    }

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Error fetching depreciation schedule:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch depreciation schedule' },
      { status: 500 }
    )
  }
}
