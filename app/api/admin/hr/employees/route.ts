import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    // Check permission - requires 'hr' read access or ADMIN
    const permissionError = await requirePermission('hr', 'read')
    if (permissionError) return permissionError

    // Check query parameter for inactive employees
    const { searchParams } = new URL(request.url)
    const showInactive = searchParams.get('inactive') === 'true'

    const employees = await prisma.b24Employee.findMany({
      where: {
        isActive: !showInactive // true for active, false for inactive
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        department: true,
        position: true,
        employmentType: true,
        workTimeModel: true,
        monthlySalary: true,
        contractStart: true,
        contractEnd: true,
        hierarchyLevel: true,
        manager: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: [
        { hierarchyLevel: 'desc' },
        { lastName: 'asc' }
      ]
    })

    return NextResponse.json(employees)
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}
