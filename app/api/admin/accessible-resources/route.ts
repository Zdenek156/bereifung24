import { NextResponse } from 'next/server'
import { requireAdminOrEmployee } from '@/lib/permissions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Nicht authorisiert' }, { status: 401 })
  }

  // All available resources
  const resources = [
    'workshops',
    'customers',
    'email',
    'notifications',
    'billing',
    'commissions',
    'territories',
    'cleanup',
    'sepa-mandates',
    'api-settings',
    'email-settings',
    'email-templates',
    'b24-employees',
    'analytics',
    'server-info',
    'security',
    'sales',
    'kvp'
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
}
