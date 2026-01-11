import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/employee/list
 * Get list of all active B24 employees for task assignment
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'B24_EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all active employees
    const employees = await prisma.b24Employee.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profileImage: true,
        position: true
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    })

    return NextResponse.json(employees)
  } catch (error) {
    console.error('Error fetching employee list:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Mitarbeiterliste' },
      { status: 500 }
    )
  }
}
