import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Check if B24_EMPLOYEE has specific resource permission
 * GET /api/employee/check-permission?resource=procurement&action=read
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ hasPermission: false }, { status: 401 })
    }

    // Admin always has access
    if (session.user.role === 'ADMIN') {
      return NextResponse.json({ hasPermission: true })
    }

    // Only check for B24_EMPLOYEE
    if (session.user.role !== 'B24_EMPLOYEE') {
      return NextResponse.json({ hasPermission: false })
    }

    const searchParams = req.nextUrl.searchParams
    const resource = searchParams.get('resource')
    const action = searchParams.get('action') || 'read'

    if (!resource) {
      return NextResponse.json(
        { error: 'Resource parameter required' },
        { status: 400 }
      )
    }

    // Find employee
    const employee = await prisma.b24Employee.findUnique({
      where: { userId: session.user.id },
      include: { permissions: true }
    })

    if (!employee) {
      return NextResponse.json({ hasPermission: false })
    }

    // Check if employee has the specific permission
    const hasPermission = employee.permissions.some(
      (p) =>
        p.resource === resource &&
        (action === 'read' ? p.canRead :
         action === 'write' ? p.canWrite :
         action === 'delete' ? p.canDelete : false)
    )

    return NextResponse.json({ hasPermission })

  } catch (error) {
    console.error('Error checking permission:', error)
    return NextResponse.json(
      { error: 'Failed to check permission', hasPermission: false },
      { status: 500 }
    )
  }
}
