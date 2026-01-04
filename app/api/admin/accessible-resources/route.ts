import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authorisiert' }, { status: 401 })
    }

    // Check if user has admin or employee role
    if (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE') {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
    }

    // All available resources
    const resources = [
      'workshops',
      'customers',
      'email',
      'notifications',
      'billing',
      'commissions',
      'influencers',
      'territories',
      'cleanup',
      'sepa-mandates',
      'api-settings',
      'email-settings',
      'email-templates',
      'procurement',
      'b24-employees',
      'analytics',
      'server-info',
      'security',
      'sales',
      'kvp',
      'files',
      'co2-tracking',
      'vehicles'
    ]

    // ADMINs have access to everything
    if (session.user.role === 'ADMIN') {
      return NextResponse.json({ accessibleResources: resources })
    }

    // B24_EMPLOYEE: Check permissions
    if (session.user.role === 'B24_EMPLOYEE' && session.user.b24EmployeeId) {
      const permissions = await prisma.b24EmployeePermission.findMany({
        where: {
          employeeId: session.user.b24EmployeeId,
          canRead: true
        },
        select: {
          resource: true
        }
      })

      const accessibleResources = permissions.map(p => p.resource)
      return NextResponse.json({ accessibleResources })
    }

    return NextResponse.json({ accessibleResources: [] })
  } catch (error) {
    console.error('Error in accessible-resources:', error)
    return NextResponse.json({ error: 'Internal server error', accessibleResources: [] }, { status: 500 })
  }
}
