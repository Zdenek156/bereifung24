import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type PermissionAction = 'read' | 'write' | 'delete'

/**
 * Check if user has permission to access a resource
 * Returns true if user is ADMIN or B24_EMPLOYEE with the required permission
 */
export async function hasPermission(
  resource: string,
  action: PermissionAction
): Promise<{ allowed: boolean; user: any }> {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return { allowed: false, user: null }
  }

  // ADMINs have full access
  if (session.user.role === 'ADMIN') {
    return { allowed: true, user: session.user }
  }

  // B24_EMPLOYEE: Check permissions
  if (session.user.role === 'B24_EMPLOYEE' && session.user.b24EmployeeId) {
    const permission = await prisma.b24EmployeePermission.findUnique({
      where: {
        employeeId_resource: {
          employeeId: session.user.b24EmployeeId,
          resource
        }
      }
    })

    if (!permission) {
      return { allowed: false, user: session.user }
    }

    let hasAccess = false
    switch (action) {
      case 'read':
        hasAccess = permission.canRead
        break
      case 'write':
        hasAccess = permission.canWrite
        break
      case 'delete':
        hasAccess = permission.canDelete
        break
    }

    return { allowed: hasAccess, user: session.user }
  }

  // Not ADMIN and not B24_EMPLOYEE
  return { allowed: false, user: session.user }
}

/**
 * Middleware wrapper for API routes that require permissions
 * Usage:
 * 
 * export async function GET(request: NextRequest) {
 *   const authCheck = await requirePermission('customers', 'read')
 *   if (authCheck) return authCheck
 *   
 *   // Your route logic here...
 * }
 * 
 * For backwards compatibility with existing routes that only check ADMIN:
 * Use requireAdmin() or requireAdminOrEmployee() instead
 */
export async function requirePermission(
  resource: string,
  action: PermissionAction
): Promise<NextResponse | null> {
  const { allowed, user } = await hasPermission(resource, action)

  if (!allowed) {
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Insufficient permissions', resource, action },
      { status: 403 }
    )
  }

  // Permission granted
  return null
}

/**
 * Simple admin check - for routes that should only be accessed by true ADMINs
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized - Please log in' },
      { status: 401 }
    )
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    )
  }

  return null
}

/**
 * Check if user is ADMIN or B24_EMPLOYEE (any employee, regardless of permissions)
 * Useful for admin pages that all employees should see
 */
export async function requireAdminOrEmployee(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized - Please log in' },
      { status: 401 }
    )
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE') {
    return NextResponse.json(
      { error: 'Staff access required' },
      { status: 403 }
    )
  }

  return null
}

/**
 * Get all permissions for the current user
 */
export async function getUserPermissions(): Promise<Record<string, { canRead: boolean; canWrite: boolean; canDelete: boolean }>> {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return {}
  }

  // ADMINs have all permissions
  if (session.user.role === 'ADMIN') {
    return {
      '*': { canRead: true, canWrite: true, canDelete: true }
    }
  }

  // B24_EMPLOYEE: Get their permissions
  if (session.user.role === 'B24_EMPLOYEE' && session.user.b24EmployeeId) {
    const permissions = await prisma.b24EmployeePermission.findMany({
      where: { employeeId: session.user.b24EmployeeId }
    })

    return permissions.reduce((acc, perm) => {
      acc[perm.resource] = {
        canRead: perm.canRead,
        canWrite: perm.canWrite,
        canDelete: perm.canDelete
      }
      return acc
    }, {} as Record<string, { canRead: boolean; canWrite: boolean; canDelete: boolean }>)
  }

  return {}
}
