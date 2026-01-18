import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/accounting/provisions/totals
 * Get provision totals by type
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

    // Get all provisions that haven't been released
    const provisions = await prisma.provision.findMany({
      where: {
        released: false
      }
    })

    // Calculate totals by type
    const totals = provisions.reduce((acc, provision) => {
      const amount = parseFloat(provision.amount.toString())
      
      if (!acc[provision.type]) {
        acc[provision.type] = 0
      }
      
      acc[provision.type] += amount
      
      return acc
    }, {} as Record<string, number>)

    // Calculate overall total
    const total = Object.values(totals).reduce((sum, amount) => sum + amount, 0)

    return NextResponse.json({
      success: true,
      data: {
        totals,
        total
      }
    })
  } catch (error) {
    console.error('Error fetching provision totals:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch provision totals',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
