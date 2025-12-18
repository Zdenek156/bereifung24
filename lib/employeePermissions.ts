import { prisma } from './prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

/**
 * Check if an employee has permission for a specific resource and action
 */
export async function checkEmployeePermission(
  employeeId: string,
  resource: string,
  action: 'read' | 'write' | 'delete'
): Promise<boolean> {
  try {
    const permission = await prisma.b24EmployeePermission.findUnique({
      where: {
        employeeId_resource: {
          employeeId,
          resource
        }
      }
    })

    if (!permission) {
      return false
    }

    switch (action) {
      case 'read':
        return permission.canRead
      case 'write':
        return permission.canWrite
      case 'delete':
        return permission.canDelete
      default:
        return false
    }
  } catch (error) {
    console.error('Error checking employee permission:', error)
    return false
  }
}

/**
 * Check if the current session user has employee permission
 */
export async function checkCurrentUserPermission(
  resource: string,
  action: 'read' | 'write' | 'delete'
): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return false
    }

    // Find employee by email
    const employee = await prisma.b24Employee.findUnique({
      where: { email: session.user.email },
      include: { permissions: true }
    })

    if (!employee || !employee.isActive) {
      return false
    }

    return checkEmployeePermission(employee.id, resource, action)
  } catch (error) {
    console.error('Error checking current user permission:', error)
    return false
  }
}

/**
 * Get all permissions for an employee
 */
export async function getEmployeePermissions(employeeId: string) {
  try {
    const permissions = await prisma.b24EmployeePermission.findMany({
      where: { employeeId }
    })

    return permissions.reduce((acc, perm) => {
      acc[perm.resource] = {
        canRead: perm.canRead,
        canWrite: perm.canWrite,
        canDelete: perm.canDelete
      }
      return acc
    }, {} as Record<string, { canRead: boolean; canWrite: boolean; canDelete: boolean }>)
  } catch (error) {
    console.error('Error getting employee permissions:', error)
    return {}
  }
}

/**
 * Log employee activity
 */
export async function logEmployeeActivity(
  employeeId: string,
  action: string,
  resource?: string,
  resourceId?: string,
  details?: any,
  ipAddress?: string
) {
  try {
    await prisma.b24EmployeeActivityLog.create({
      data: {
        employeeId,
        action,
        resource,
        resourceId,
        details: details ? JSON.stringify(details) : null,
        ipAddress
      }
    })
  } catch (error) {
    console.error('Error logging employee activity:', error)
  }
}

/**
 * Middleware function to require permission
 */
export function requireEmployeePermission(
  resource: string,
  action: 'read' | 'write' | 'delete'
) {
  return async () => {
    const hasPermission = await checkCurrentUserPermission(resource, action)
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions')
    }
    
    return true
  }
}
