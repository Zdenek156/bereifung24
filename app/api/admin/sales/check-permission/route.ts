import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Check if user has Sales CRM permission (Application ID 10)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ADMIN always has access
    if (session.user.role === 'ADMIN') {
      return NextResponse.json({ hasPermission: true })
    }

    // For B24_EMPLOYEE, check application assignment
    if (session.user.role === 'B24_EMPLOYEE') {
      const employee = await prisma.b24Employee.findUnique({
        where: { id: session.user.b24EmployeeId },
        include: {
          applications: {
            where: { applicationId: 10 }, // Sales CRM Application
            select: { id: true }
          }
        }
      })

      if (employee && employee.applications.length > 0) {
        return NextResponse.json({ hasPermission: true })
      }
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } catch (error) {
    console.error('Permission check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
