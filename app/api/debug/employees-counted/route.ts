import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get all employees to see who is being counted
    const allEmployees = await prisma.b24Employee.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        contractEnd: true
      },
      orderBy: { email: 'asc' }
    })

    // Get employees counted in stats (those not filtered out)
    const countedEmployees = await prisma.b24Employee.findMany({
      where: {
        AND: [
          { email: { not: { contains: 'admin@bereifung24.de' } } },
          { email: { not: { contains: 'system@' } } }
        ]
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        contractEnd: true
      },
      orderBy: { email: 'asc' }
    })

    return NextResponse.json({
      success: true,
      totalInDatabase: allEmployees.length,
      countedInStats: countedEmployees.length,
      allEmployees,
      countedEmployees,
      filters: {
        excludingAdminEmail: 'admin@bereifung24.de',
        excludingSystemPrefix: 'system@'
      }
    })
  } catch (error) {
    console.error('Error fetching employee debug info:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
