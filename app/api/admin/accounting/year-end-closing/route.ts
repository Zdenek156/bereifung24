import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { initiateYearEnd, getYearEndStatus } from '@/lib/accounting/yearEndClosingService'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/accounting/year-end-closing
 * Fetch year-end closings with optional filtering
 * Query params: year, status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year')
    const status = searchParams.get('status')

    // If year is provided, get detailed status
    if (year) {
      const yearEndStatus = await getYearEndStatus(parseInt(year))
      return NextResponse.json({
        success: true,
        data: yearEndStatus
      })
    }

    // Otherwise, query year-end closing records
    const where: any = {}

    if (status) {
      where.status = status
    }

    const yearEndClosings = await prisma.yearEndClosing.findMany({
      where,
      orderBy: {
        year: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: yearEndClosings
    })
  } catch (error) {
    console.error('Error fetching year-end closings:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/accounting/year-end-closing
 * Initiate year-end closing
 * Body: { year: number, fiscalYear?: string }
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

    const body = await request.json()
    const { year, fiscalYear } = body

    if (!year || typeof year !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Year is required and must be a number' },
        { status: 400 }
      )
    }

    const yearEndStatus = await initiateYearEnd(year, fiscalYear, session.user.id)

    return NextResponse.json({
      success: true,
      data: yearEndStatus
    }, { status: 201 })
  } catch (error) {
    console.error('Error initiating year-end closing:', error)

    if (error instanceof Error) {
      if (error.message.includes('not initialized')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        )
      }
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
