/**
 * Application-Based Access Control Helper
 * Simpler permission system: Employees either have access to an application or not
 */

import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

/**
 * Check if user has access to an application
 * @param userId - User ID (can be ADMIN or B24_EMPLOYEE)
 * @param applicationKey - Application key (e.g., "customers", "workshops", "hr")
 * @returns true if user has access, false otherwise
 */
export async function hasApplication(
  userId: string,
  applicationKey: string
): Promise<boolean> {
  try {
    // Get user session to check role
    const session = await getServerSession(authOptions)
    if (!session?.user) return false

    // ADMIN users have access to all applications
    if (session.user.role === 'ADMIN') return true

    // B24_EMPLOYEE users need to check their assigned applications
    if (session.user.role === 'B24_EMPLOYEE') {
      const assignment = await prisma.b24EmployeeApplication.findUnique({
        where: {
          employeeId_applicationKey: {
            employeeId: userId,
            applicationKey
          }
        }
      })
      return !!assignment
    }

    return false
  } catch (error) {
    console.error('Error checking application access:', error)
    return false
  }
}

/**
 * Get all applications assigned to an employee
 * @param employeeId - Employee ID
 * @returns Array of application keys
 */
export async function getEmployeeApplications(
  employeeId: string
): Promise<string[]> {
  try {
    const assignments = await prisma.b24EmployeeApplication.findMany({
      where: { employeeId },
      select: { applicationKey: true }
    })
    return assignments.map(a => a.applicationKey)
  } catch (error) {
    console.error('Error fetching employee applications:', error)
    return []
  }
}

/**
 * Get all applications with details
 * @param includeInactive - Whether to include inactive applications
 * @returns Array of applications
 */
export async function getAllApplications(includeInactive = false) {
  try {
    return await prisma.application.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { sortOrder: 'asc' }
    })
  } catch (error) {
    console.error('Error fetching applications:', error)
    return []
  }
}

/**
 * Assign application to employee
 * @param employeeId - Employee ID
 * @param applicationKey - Application key
 * @param assignedBy - User ID who is assigning
 */
export async function assignApplication(
  employeeId: string,
  applicationKey: string,
  assignedBy: string
) {
  try {
    return await prisma.b24EmployeeApplication.create({
      data: {
        employeeId,
        applicationKey,
        assignedBy
      }
    })
  } catch (error) {
    console.error('Error assigning application:', error)
    throw new Error('Failed to assign application')
  }
}

/**
 * Unassign application from employee
 * @param employeeId - Employee ID
 * @param applicationKey - Application key
 */
export async function unassignApplication(
  employeeId: string,
  applicationKey: string
) {
  try {
    return await prisma.b24EmployeeApplication.delete({
      where: {
        employeeId_applicationKey: {
          employeeId,
          applicationKey
        }
      }
    })
  } catch (error) {
    console.error('Error unassigning application:', error)
    throw new Error('Failed to unassign application')
  }
}

/**
 * Get employee's applications with full details
 * @param employeeId - Employee ID
 */
export async function getEmployeeApplicationsWithDetails(employeeId: string) {
  try {
    const assignments = await prisma.b24EmployeeApplication.findMany({
      where: { employeeId },
      include: {
        application: true
      },
      orderBy: {
        application: {
          sortOrder: 'asc'
        }
      }
    })
    return assignments.map(a => a.application)
  } catch (error) {
    console.error('Error fetching employee applications with details:', error)
    return []
  }
}
