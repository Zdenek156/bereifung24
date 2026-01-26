import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasApplication } from '@/lib/applications'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to HR application or is ADMIN/B24_EMPLOYEE
    if (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE') {
      const hasAccess = await hasApplication(session.user.id, 'hr')
      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Check query parameter for inactive employees
    const { searchParams } = new URL(request.url)
    const showInactive = searchParams.get('inactive') === 'true'

    const employees = await prisma.b24Employee.findMany({
      where: {
        AND: [
          // Filter by status: TERMINATED = inactive, others = active
          showInactive 
            ? { status: 'TERMINATED' } 
            : { status: { not: 'TERMINATED' } },
          // Exclude admin and system accounts (case-insensitive)
          { 
            NOT: [
              { email: { contains: 'admin@bereifung24.de', mode: 'insensitive' } },
              { email: { contains: 'system@', mode: 'insensitive' } }
            ]
          }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        status: true,
        department: true,
        position: true,
        profileImage: true,
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

    return NextResponse.json({ 
      success: true, 
      data: employees 
    })
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}
