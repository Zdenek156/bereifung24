import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { scheduleDepreciation, getDepreciationSchedule } from '@/lib/accounting/depreciationService'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/accounting/depreciation
 * Fetch depreciation entries with optional filtering
 * Query params: assetId, year, month
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24EMPLOYEE')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const assetId = searchParams.get('assetId')
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    // If assetId is provided, return schedule for that asset
    if (assetId) {
      const schedule = await getDepreciationSchedule(assetId)
      return NextResponse.json({
        success: true,
        data: schedule
      })
    }

    // Otherwise, filter all depreciation entries
    const where: any = {}

    if (year) {
      where.year = parseInt(year)
    }

    if (month) {
      where.month = parseInt(month)
    }

    const depreciations = await prisma.depreciation.findMany({
      where,
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            assetNumber: true
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: depreciations
    })
  } catch (error) {
    console.error('Error fetching depreciation entries:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/accounting/depreciation
 * Calculate and schedule depreciation for an asset
 * Body: { assetId: string, year?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { assetId, year } = body

    if (!assetId) {
      return NextResponse.json(
        { success: false, error: 'Asset ID is required' },
        { status: 400 }
      )
    }

    const depreciations = await scheduleDepreciation(assetId, year)

    return NextResponse.json({
      success: true,
      data: depreciations
    }, { status: 201 })
  } catch (error) {
    console.error('Error scheduling depreciation:', error)

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { success: false, error: 'Asset not found' },
          { status: 404 }
        )
      }
      if (error.message.includes('before acquisition')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
