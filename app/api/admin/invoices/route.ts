import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdminOrCEO } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/invoices
 * Get all invoices with filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const hasAccess = await isAdminOrCEO(session)
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const status = searchParams.get('status')
    const workshopId = searchParams.get('workshopId')

    // Build filter
    const where: any = {}

    if (year) {
      const yearNum = parseInt(year)
      where.periodStart = {
        gte: new Date(yearNum, 0, 1)
      }
      where.periodEnd = {
        lte: new Date(yearNum, 11, 31, 23, 59, 59)
      }
    }

    if (month) {
      const monthNum = parseInt(month)
      const yearNum = year ? parseInt(year) : new Date().getFullYear()
      where.periodStart = {
        gte: new Date(yearNum, monthNum - 1, 1)
      }
      where.periodEnd = {
        lte: new Date(yearNum, monthNum, 0, 23, 59, 59)
      }
    }

    if (status) {
      where.status = status
    }

    if (workshopId) {
      where.workshopId = workshopId
    }

    const invoices = await prisma.commissionInvoice.findMany({
      where,
      include: {
        workshop: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: invoices
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}
