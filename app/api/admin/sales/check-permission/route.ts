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
    
    console.log('[CHECK PERMISSION] Session:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      email: session?.user?.email,
      role: session?.user?.role,
      b24EmployeeId: session?.user?.b24EmployeeId
    })
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ADMIN always has access
    if (session.user.role === 'ADMIN') {
      console.log('[CHECK PERMISSION] ADMIN access granted')
      return NextResponse.json({ hasPermission: true })
    }

    // For B24_EMPLOYEE, check application assignment
    if (session.user.role === 'B24_EMPLOYEE') {
      if (!session.user.b24EmployeeId) {
        console.log('[CHECK PERMISSION] B24_EMPLOYEE missing ID')
        return NextResponse.json({ error: 'Employee ID missing', hasPermission: false }, { status: 400 })
      }

      console.log('[CHECK PERMISSION] Checking employee applications for:', session.user.b24EmployeeId)

      const employee = await prisma.b24Employee.findUnique({
        where: { id: session.user.b24EmployeeId },
        include: {
          applications: {
            where: { applicationId: 10 }, // Sales CRM Application
            select: { id: true, applicationId: true }
          }
        }
      })

      console.log('[CHECK PERMISSION] Employee found:', {
        hasEmployee: !!employee,
        applicationsCount: employee?.applications.length || 0,
        applications: employee?.applications
      })

      if (employee && employee.applications.length > 0) {
        console.log('[CHECK PERMISSION] B24_EMPLOYEE access granted')
        return NextResponse.json({ hasPermission: true })
      }

      console.log('[CHECK PERMISSION] No permission found')
    }

    return NextResponse.json({ hasPermission: false, error: 'Forbidden' }, { status: 403 })
  } catch (error) {
    console.error('[CHECK PERMISSION] Error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
